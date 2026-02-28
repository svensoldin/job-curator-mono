# V2 Strategy Implementation Plan

## Context

The current job-matching system is expensive and hard to differentiate: for every new search, it loops over all scraped jobs and makes one Mistral API call per job (O(users × jobs)). The v2 strategy replaces this with a persistent user profile + a 3-tier matching pipeline (SQL hard filter → vector similarity → batch LLM scoring), reducing token usage drastically and enabling richer, more meaningful job matching.

**Architecture:**

- `apps/scraper` — standalone Puppeteer pipeline triggered daily by GitHub Actions (`.github/workflows/scraper-cron.yml`). Runs: scrape → summarize → embed → run matching for all users. No backend involvement.
- `apps/backend` — Express API serving profiles, matches, and jobs to the frontend.
- `packages/pipeline` — shared library consumed by both `apps/scraper` and `apps/backend`: embedding, job-summary, matching pipeline, Supabase client, table constants.

**In scope:** Structured user profile, 3-tier pipeline + embeddings, job summaries, hidden gem detection.

---

## 1. Database Schema

### Current state (migration `20260227102206_v2_schema.sql` applied)

- pgvector enabled
- `scraped_jobs` extended: `embedding vector(1024)`, `structured_summary jsonb`, `embedded_at`, `summarized_at`
- `user_profiles` table created
- `match_cache` table created
- `match_jobs_for_user` RPC created

### Remaining migration

One new migration needed (`20260228_cleanup.sql`):

**Drop old v1 tables** (no users → no backward compat):

```sql
DROP TABLE IF EXISTS job_results;
DROP TABLE IF EXISTS job_searches;
```

**Add UNIQUE constraint on `scraped_jobs.url`** (required for idempotent upserts — missed in v2 migration):

```sql
ALTER TABLE scraped_jobs ADD CONSTRAINT scraped_jobs_url_key UNIQUE (url);
```

**Create IVFFlat index post-backfill** (do not run until `embedded_at IS NOT NULL` on most rows):

```sql
CREATE INDEX scraped_jobs_embedding_idx
  ON scraped_jobs
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

> Run the index creation as a separate step after the backfill confirms sufficient rows are embedded. Creating it on an empty column wastes time and must be rebuilt.

After applying: regenerate `supabase.types.ts`:

```bash
SUPABASE_ACCESS_TOKEN=... supabase gen types typescript --linked > packages/pipeline/src/lib/supabase.types.ts 2>/dev/null
```

---

## 2. Backend Service Architecture

### Current state

Pipeline services live in `packages/pipeline/src/services/`:
- `embedding/` — `embedText`, `embedBatch`, `processUnembeddedJobs`
- `job-summary/` — `processPendingSummaries`
- `matching/` — `runForUser`, `runForAllUsers`

Backend services in `apps/backend/src/services/`:
- `profile/` — `ProfileService` (CRUD + embedding trigger)
- `cache/` — `CacheService` (read `match_cache` joined with `scraped_jobs`)

Old v1 code still present — **to remove:**
- `services/search-task-manager.ts`
- `services/ai-analyzer/`

### Scraper (`apps/scraper`)

The scraper is a standalone app in `apps/scraper/`, not part of the backend. It runs as a GH Actions job on schedule. The pipeline in `src/index.ts`:

1. `scrapeJobs(SCRAPE_TARGETS)` — Puppeteer scraping (LinkedIn + WTTJ)
2. `processPendingSummaries()` — LLM job summarization
3. `processUnembeddedJobs()` — Mistral embedding
4. `runForAllUsers()` — matching pipeline

No backend cron routes are needed. The GH Action is the scheduler.

---

## 3. API Routes

### Remove (old v1 — still mounted, need cleanup)

- `POST /searches`, `GET /searches`, `POST /searches/create`, `GET /searches/:id` → delete `routes/searches.ts`
- `GET /results/:taskId` → delete `routes/results.ts`

### Keep: `profiles.ts`

| Method | Path                | Description                                                                                                              |
| ------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/profiles/:userId` | Get user profile                                                                                                         |
| POST   | `/profiles`         | Create or update profile. Body: `{ userId, hardConstraints, skillGraph, seniority, culturePreference, techStackWeights }`. Side effect: triggers embedding. |
| DELETE | `/profiles/:userId` | Delete profile                                                                                                           |

### Keep: `matches.ts`

| Method | Path                          | Description                                                            |
| ------ | ----------------------------- | ---------------------------------------------------------------------- |
| GET    | `/matches/:userId`            | Get cached matches. Query: `?limit=20&minScore=50&hiddenGemsOnly=true` |
| GET    | `/matches/:userId/job/:jobId` | Get single match detail                                                |
| POST   | `/matches/trigger/:userId`    | Manually trigger matching pipeline (async fire-and-forget)             |

### Keep: `jobs.ts`

| Method | Path    | Description                                                                  |
| ------ | ------- | ---------------------------------------------------------------------------- |
| GET    | `/jobs` | Get scraped jobs. Query: `?source=linkedin&limit=50&offset=0` |

### Auth middleware (required before production)

Middleware validating `Authorization: Bearer <supabase_jwt>` via `supabase.auth.getUser(jwt)`. All mutating routes must verify JWT `sub` matches the `userId` parameter. Already implemented — verify it is applied to all routes.

---

## 4. Frontend Routes

### Remove

- `/search` (multi-step wizard)

### New / Updated

| Route                  | Purpose                                                                                                                                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/profile`             | Profile setup/edit. Multi-step form: hard constraints → skills (with years) → seniority → culture → review. On submit: `POST /profiles`. If profile exists, loads pre-populated values. On success: redirect to `/matches`.                             |
| `/dashboard` (updated) | Replace `useSearchTasksByUser` with `useMatchesByUser` hitting `GET /matches/:userId`. Replace `SearchCard` with `MatchCard` (score, reasoning snippet, missing skills chips, hidden gem badge). Keep server-side prefetch + HydrationBoundary pattern. |
| `/matches/[jobId]`     | Match detail page. Shows full reasoning, missing skills, salary alignment, `structured_summary` sidebar (stack, seniority, culture), link to original posting.                                                                                          |

### Edge cases to handle

- User with no profile → redirect to `/profile` with onboarding copy
- Matches not yet computed (profile created, GH Action hasn't run) → empty state with "Your matches will be ready tomorrow morning" + "Run now" button triggering `POST /matches/trigger/:userId`

---

## 5. Implementation Order

| Sprint | Work                                                                                                                                          | Status      |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1      | DB migrations: pgvector, alter `scraped_jobs`, create `user_profiles`, `match_cache`, `match_jobs_for_user` RPC. Regenerate types.            | ✅ Done      |
| 2      | Scraper moved to `apps/scraper`; GH Action pipeline (scrape → summarize → embed → match). Scraper bug fixes + scalability tweaks.             | ✅ Done      |
| 3      | `packages/pipeline`: `EmbeddingService`, `JobSummaryService`, unit tests.                                                                     | ✅ Done      |
| 4      | Backend: `ProfileService` + `routes/profiles.ts` + auth middleware.                                                                           | ✅ Done      |
| 5      | Backend: `MatchingPipeline` + `CacheService` + `routes/matches.ts` + `routes/jobs.ts`.                                                        | ✅ Done      |
| 6      | **Fresh DB cleanup**: drop `job_results`/`job_searches`, add UNIQUE on `scraped_jobs.url`. Remove old backend code (`searches.ts`, `results.ts`, `search-task-manager.ts`, `ai-analyzer/`). Clean up `lib/supabase.ts` and pipeline constants. | ⬜ Next      |
| 7      | **Backfill**: `scripts/backfill-summaries.ts` + `scripts/backfill-embeddings.ts` (run once against prod). Create IVFFlat index after backfill. | ⬜ Pending   |
| 8      | Frontend: `/profile` page + sidebar link.                                                                                                     | ⬜ Pending   |
| 9      | Frontend: updated `/dashboard` + `/matches/[jobId]` detail page. Remove old `/search` wizard.                                                 | ⬜ Pending   |

---

## 6. Key Risks

| Risk                                       | Mitigation                                                                                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| IVFFlat index built on empty/sparse table  | Create index only after backfill confirms sufficient rows. Run as separate manual step post-backfill.                                          |
| Mistral rate limits during backfill        | Process in batches of 10–20 with 1s delay. `embedded_at IS NULL` is a safe resume checkpoint — re-running the script is idempotent.           |
| Batch LLM JSON malformed                   | Use `response_format: { type: 'json_object' }`. Wrap parse in try/catch; assign score=0 to unscored jobs.                                     |
| Duplicate jobs across daily scrape runs    | UNIQUE constraint on `scraped_jobs.url` + `onConflict: 'url'` in upsert prevents duplicates. Both must be in place before next scraper run.   |
| `scraped_jobs.id` is `integer`, not `uuid` | Be explicit: `job_id: number` in all TS interfaces for `match_cache`. Type generator enforces this post-migration.                             |
| LinkedIn/WTTJ HTML changes break selectors | Post-scrape sanity check logs error-level alert when 0 jobs or >50% empty descriptions. GH Action job summary surfaces failures immediately.  |

---

## 7. Verification

1. **DB cleanup:** `\dt` in psql confirms `job_results` and `job_searches` are gone.
2. **Backfill:** `SELECT COUNT(*) FROM scraped_jobs WHERE embedded_at IS NOT NULL` — expect most rows filled.
3. **Matching pipeline:** Create a test user profile, run `runForUser(userId)`, query `match_cache` — expect rows with non-null scores.
4. **API:** `curl GET /matches/:userId` should return ranked job list with `score`, `reasoning`, `is_hidden_gem`.
5. **Frontend `/profile`:** Submit form → check Supabase `user_profiles` table has a new row with `embedded_at` set.
6. **Frontend `/dashboard`:** Shows `MatchCard` components with scores after a matching run.
7. **Hidden gems:** Manually verify 1–2 `match_cache` rows where `is_hidden_gem = true` have high similarity but no exact skill keyword overlap.

---

## Critical Files

- [supabase.types.ts](packages/pipeline/src/lib/supabase.types.ts) — regenerate after every DB migration
- [matching.pipeline.ts](packages/pipeline/src/services/matching/matching.pipeline.ts) — core v2 logic
- [scraper-cron.yml](.github/workflows/scraper-cron.yml) — GH Action that drives the full pipeline daily
- [packages/types/index.ts](packages/types/index.ts) — shared types: `UserProfile`, `MatchResult`, `StructuredSummary`
- [dashboard/\_lib/queries.ts](<apps/frontend/src/app/(authenticated)/dashboard/_lib/queries.ts>) — switch from searches to matches query
- [app.ts](apps/backend/src/index.ts) — remove old `/results` and `/searches` route mounts
