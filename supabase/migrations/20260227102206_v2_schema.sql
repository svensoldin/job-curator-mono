-- v2 Phase 1: Database schema changes
-- All operations are additive (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

-- 2a. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2b. Alter scraped_jobs
ALTER TABLE scraped_jobs
  ADD COLUMN IF NOT EXISTS embedding           vector(1024),
  ADD COLUMN IF NOT EXISTS structured_summary  jsonb,
  ADD COLUMN IF NOT EXISTS embedded_at         timestamptz,
  ADD COLUMN IF NOT EXISTS summarized_at       timestamptz;

CREATE INDEX IF NOT EXISTS idx_scraped_jobs_not_embedded
  ON scraped_jobs (id) WHERE embedded_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_scraped_jobs_not_summarized
  ON scraped_jobs (id) WHERE summarized_at IS NULL;

-- Note: IVFFlat vector index on scraped_jobs.embedding is intentionally omitted.
-- It must be created AFTER the backfill (Sprint 5), not on an empty column.

-- 2c. Create user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             text UNIQUE NOT NULL,
  plan                text NOT NULL DEFAULT 'free',
  embedding           vector(1024),
  hard_constraints    jsonb,
  skill_graph         jsonb,
  seniority           text,
  culture_preference  text,
  tech_stack_weights  jsonb,
  raw_profile_text    text,
  embedded_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- 2d. Create match_cache
CREATE TABLE IF NOT EXISTS match_cache (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          text NOT NULL REFERENCES user_profiles(user_id),
  job_id           integer NOT NULL REFERENCES scraped_jobs(id) ON DELETE CASCADE,
  score            integer,
  reasoning        text,
  missing_skills   text[],
  salary_alignment text,
  is_hidden_gem    boolean DEFAULT false,
  cached_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_match_cache_user_score
  ON match_cache (user_id, score DESC);

-- 2e. Alter job_results
ALTER TABLE job_results
  ADD COLUMN IF NOT EXISTS reasoning               text,
  ADD COLUMN IF NOT EXISTS missing_skills          text[],
  ADD COLUMN IF NOT EXISTS salary_alignment        text,
  ADD COLUMN IF NOT EXISTS career_growth_alignment text;

-- 2f. Create match_jobs_for_user RPC
CREATE OR REPLACE FUNCTION match_jobs_for_user(
  query_embedding   vector(1024),
  location_filter   text DEFAULT NULL,
  salary_min        integer DEFAULT NULL,
  match_count       integer DEFAULT 30
)
RETURNS TABLE (
  id          integer,
  title       text,
  company     text,
  location    text,
  description text,
  url         text,
  source      text,
  structured_summary jsonb,
  similarity  float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    j.id,
    j.title,
    j.company,
    j.location,
    j.description,
    j.url,
    j.source,
    j.structured_summary,
    1 - (j.embedding <=> query_embedding) AS similarity
  FROM scraped_jobs j
  WHERE
    j.embedding IS NOT NULL
    AND (location_filter IS NULL OR j.location ILIKE '%' || location_filter || '%')
  ORDER BY j.embedding <=> query_embedding
  LIMIT match_count;
$$;
