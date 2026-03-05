-- Sprint 6 cleanup: drop v1 tables and add UNIQUE constraint on scraped_jobs.url

DROP TABLE IF EXISTS job_results;
DROP TABLE IF EXISTS job_searches;

ALTER TABLE scraped_jobs ADD CONSTRAINT scraped_jobs_url_key UNIQUE (url);

-- Note: IVFFlat index on scraped_jobs.embedding is deferred until after backfill (Sprint 7).
-- Run this separately once embedded_at IS NOT NULL on most rows:
--
-- CREATE INDEX scraped_jobs_embedding_idx
--   ON scraped_jobs
--   USING ivfflat (embedding vector_cosine_ops)
--   WITH (lists = 100);
