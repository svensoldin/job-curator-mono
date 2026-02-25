# V2 Strategy Implementation Plan

## Context

The current job-matching system is expensive and hard to differentiate: for every new search, it loops over all scraped jobs and makes one Mistral API call per job (O(users × jobs)). The v2 strategy replaces this with a persistent user profile + a 3-tier matching pipeline (SQL hard filter → vector similarity → batch LLM scoring), reducing token usage drastically and enabling richer, more meaningful job matching. The old `/search` wizard and `/searches` API are fully replaced by a profile-based flow with daily auto-matching.

**In scope:** Structured user profile, 3-tier pipeline + embeddings, job summaries, hidden gem detection.

---

## 1. Database Schema Changes

### Enable pgvector
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Alter `scraped_jobs` (additive, non-breaking)
Add columns:
- `embedding vector(1024)` — Mistral embedding of the full description
- `structured_summary jsonb` — `{ stack: string[], seniority, culture, responsibilities, salary }`
- `embedded_at timestamptz` (nullable — NULL = not yet processed)
- `summarized_at timestamptz` (nullable)

Add partial indexes for efficient unprocessed-job queries (`WHERE embedded_at IS NULL`, `WHERE summarized_at IS NULL`).

> **Note:** Create the IVFFlat vector index **after** the backfill, not before. An index on an empty table is useless and must be rebuilt.

### New `user_profiles` table
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | text UNIQUE | FK to auth.users |
| `plan` | text | `'free'` \| `'premium'` — default `'free'`. Used to gate features as pricing is defined. |
| `embedding` | vector(1024) | Embedding of `raw_profile_text` |
| `hard_constraints` | jsonb | `{ location, remote: bool, salary_min, salary_max }` |
| `skill_graph` | jsonb | `{ "React": 5, "Node": 3 }` |
| `seniority` | text | junior / mid / senior / lead |
| `culture_preference` | text | startup / scale-up / big_corp |
| `tech_stack_weights` | jsonb | weighted preferences |
| `raw_profile_text` | text | human-readable description used for embedding |
| `embedded_at` | timestamptz | NULL = embedding pending |
| `created_at`, `updated_at` | timestamptz | |

### New `match_cache` table
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | text | |
| `job_id` | integer | FK → `scraped_jobs.id` ON DELETE CASCADE |
| `score` | integer | 0–100 |
| `reasoning` | text | Why it matches |
| `missing_skills` | text[] | |
| `salary_alignment` | text | |
| `is_hidden_gem` | boolean | true if high vector similarity + low keyword overlap |
| `cached_at` | timestamptz | |

UNIQUE constraint on `(user_id, job_id)`. Index on `(user_id, score DESC)`.

### Alter `job_results` (additive — kept for backward compat during transition)
Add: `reasoning text`, `missing_skills text[]`, `salary_alignment text`, `career_growth_alignment text`.

### Supabase RPC for vector search
Create a PostgreSQL function `match_jobs_for_user(query_embedding, location_filter, salary_min, match_count)` that:
1. Filters `scraped_jobs` by location and salary (SQL hard filter tier)
2. Orders by `embedding <=> query_embedding` (cosine distance)
3. Returns top N rows with a `similarity` float

This is called via Supabase `.rpc()` from the backend — cosine search is not expressible through the standard JS client.

### Migration order
1. Enable pgvector
2. Alter `scraped_jobs`
3. Create `user_profiles`
4. Create `match_cache`
5. Alter `job_results`
6. Create `match_jobs_for_user` RPC
7. Regenerate `supabase.types.ts` (`supabase gen types typescript`)

---

## 2. Backend Service Architecture

### New files / services

```
apps/backend/src/
  services/
    embedding/
      embedding.service.ts       # Mistral embeddings API (mistral-embed model)
    job-summary/
      job-summary.service.ts     # One-time LLM summarization of scraped jobs
    matching/
      matching.pipeline.ts       # 3-tier orchestration (core v2 logic)
    profile/
      profile.service.ts         # CRUD for user_profiles + trigger embedding
    cache/
      cache.service.ts           # Read match_cache (with scraped_jobs join)
  cron/
    cron.ts                      # Replaces services/scraper/cron.ts
  routes/
    profiles.ts                  # new
    matches.ts                   # new
    jobs.ts                      # new
    cron.ts                      # new — protected HTTP endpoints for Heroku Scheduler
    searches.ts                  # REMOVE (full replacement)
    results.ts                   # REMOVE (full replacement)
```

### Key service responsibilities

**`EmbeddingService`**
- `embedText(text): Promise<number[]>` — single Mistral `mistral-embed` call
- `embedBatch(texts): Promise<number[][]>` — batch with rate-limit-safe delays
- `processUnembeddedJobs(batchSize)` — fetches jobs where `embedded_at IS NULL`, embeds, updates DB

**`JobSummaryService`**
- `summarizeJob(job): Promise<StructuredSummary>` — single chat completion with `response_format: { type: 'json_object' }`, returns `{ stack, seniority, culture, responsibilities, salary }`
- `processPendingSummaries(batchSize)` — fetches jobs where `summarized_at IS NULL`, summarizes, updates DB

**`ProfileService`**
- `createOrUpdate(userId, input)` — builds `raw_profile_text`, calls `EmbeddingService.embedText()`, upserts into `user_profiles`
- `buildProfileText(input): string` — converts structured input to a descriptive paragraph (e.g. _"Senior frontend engineer with 5y React, 3y Node.js, looking for a startup in Paris, salary 65–80k"_)
- `getByUserId(userId)`, `delete(userId)`

**`MatchingPipeline`**
- `runForUser(userId)`:
  1. Fetch user profile (`hard_constraints`, `embedding`, `skill_graph`)
  2. Call `match_jobs_for_user` RPC → top 30 jobs by cosine distance (after SQL hard filter)
  3. Compute `is_hidden_gem` for each: `similarity >= 0.75` AND keyword overlap with `skill_graph` keys < 30%
  4. Build single batch prompt using `structured_summary` (not full description — key token saving)
  5. One Mistral call → JSON array: `[{ job_id, score, reasoning, missing_skills, salary_alignment }]`
  6. Upsert into `match_cache` with `is_hidden_gem` flag (ON CONFLICT DO UPDATE)
- `runForAllUsers()` — fetches all profiles with `embedding IS NOT NULL`, calls `runForUser()` for each sequentially

**`CacheService`**
- `getMatchesForUser(userId, options?: { limit, minScore, hiddenGemsOnly }): Promise<MatchWithJob[]>` — joins `match_cache` with `scraped_jobs`, ordered by `score DESC`
- `getMatchDetail(userId, jobId): Promise<MatchWithJob | null>`

### Cron via Heroku Scheduler

The backend runs on a basic $5 Heroku dyno with Heroku Scheduler triggering jobs externally. Rather than using `node-cron` embedded in the Express server, each scheduled task is exposed as a protected HTTP endpoint called by Heroku Scheduler.

**New cron routes** (protected by a shared `CRON_SECRET` header, checked in middleware):

| Heroku Scheduler time | HTTP call | Action |
|---|---|---|
| 8:00am | `POST /cron/scrape` | `scrapeJobs()` |
| 8:30am | `POST /cron/process-jobs` | `processPendingSummaries(50)` then `processUnembeddedJobs(50)` |
| 9:00am | `POST /cron/run-matching` | `runMatchingForAllUsers()` |

Alternatively, Heroku Scheduler can run a one-off command (`node dist/scripts/run-matching.js`) — but HTTP endpoints are more portable and testable.

Remove the existing `node-cron` dependency and `services/scraper/cron.ts`. The `CRON_SECRET` env var is added to Heroku config vars and checked in the cron middleware to prevent unauthorized triggering.

---

## 3. API Routes

### Remove
- `POST /searches` (get user searches)
- `GET /searches` (debug)
- `POST /searches/create`
- `GET /searches/:id`
- `GET /results/:taskId`

### New: `profiles.ts`

| Method | Path | Description |
|---|---|---|
| GET | `/profiles/:userId` | Get user profile |
| POST | `/profiles` | Create or update profile. Body: `{ userId, hardConstraints, skillGraph, seniority, culturePreference, techStackWeights }`. Side effect: triggers embedding. |
| DELETE | `/profiles/:userId` | Delete profile |

### New: `matches.ts`

| Method | Path | Description |
|---|---|---|
| GET | `/matches/:userId` | Get cached matches. Query: `?limit=20&minScore=50&hiddenGemsOnly=true` |
| GET | `/matches/:userId/job/:jobId` | Get single match detail |
| POST | `/matches/trigger/:userId` | Manually trigger matching pipeline (async fire-and-forget) |

### New: `jobs.ts`

| Method | Path | Description |
|---|---|---|
| GET | `/jobs` | Get scraped jobs. Query: `?location=Paris&source=linkedin&limit=50&offset=0` |

### New: `cron.ts` (protected routes for Heroku Scheduler)

| Method | Path | Description |
|---|---|---|
| POST | `/cron/scrape` | Trigger scraping pipeline |
| POST | `/cron/process-jobs` | Summarize + embed new jobs |
| POST | `/cron/run-matching` | Run matching pipeline for all users |

Protected by `CRON_SECRET` header middleware — Heroku Scheduler is configured to send this header with each call.

All responses follow existing convention: `{ data: T }` on success, `{ error: string }` on failure.

### Auth middleware (security — required before production)
Add a middleware that validates `Authorization: Bearer <supabase_jwt>` header and extracts `userId` via `supabase.auth.getUser(jwt)`. All mutating routes must verify the JWT `sub` matches the `userId` parameter. The existing backend has no auth on routes — this is the critical security gap to close.

---

## 4. Frontend Routes

### Remove
- `/search` (multi-step wizard)

### New / Updated

| Route | Purpose |
|---|---|
| `/profile` | Profile setup/edit. Multi-step form: hard constraints → skills (with years) → seniority → culture → review. On submit: `POST /profiles`. If profile exists, loads pre-populated values. On success: redirect to `/matches`. |
| `/dashboard` (updated) | Replace `useSearchTasksByUser` with `useMatchesByUser` hitting `GET /matches/:userId`. Replace `SearchCard` with `MatchCard` (score, reasoning snippet, missing skills chips, hidden gem badge). Keep server-side prefetch + HydrationBoundary pattern. |
| `/matches/[jobId]` | Match detail page. Shows full reasoning, missing skills, salary alignment, `structured_summary` sidebar (stack, seniority, culture), link to original posting. Same server component + client component pattern as `/search/[id]`. |

### Shared types to add (`/packages/types/index.ts`)
Add: `UserProfile`, `HardConstraints`, `MatchResult`, `StructuredSummary`.

### Edge cases to handle
- User with no profile → redirect to `/profile` with onboarding copy
- Matches not yet computed (profile created but 9am cron hasn't run) → empty state with "Your matches will be ready tomorrow morning" message + "Run now" button triggering `POST /matches/trigger/:userId`

---

## 5. Implementation Order

| Sprint | Work | App still working? |
|---|---|---|
| 1 | DB migrations (Steps 1–7 above). Regenerate types. | Yes — all new columns are nullable, old code is unaffected. |
| 2 | Backend: `EmbeddingService` + `JobSummaryService` + unit tests | Yes — services standalone |
| 3 | Backend: `ProfileService` + `routes/profiles.ts` | Yes — new routes additive |
| 4 | Backend: `MatchingPipeline` + `CacheService` + `routes/matches.ts` + `routes/jobs.ts` + updated cron | Yes — old routes still mounted |
| 5 | Data backfill scripts (`scripts/backfill-summaries.ts`, `scripts/backfill-embeddings.ts`) + create IVFFlat index post-backfill | Yes |
| 6 | Frontend: `/profile` page + shared types + sidebar link | Yes — old dashboard unchanged |
| 7 | Frontend: updated `/dashboard` + `/matches/[jobId]` detail page | Yes — old `/search` can be removed here |
| 8 | Remove old routes (`/searches`, `/results`) and old frontend `/search` wizard. Add auth middleware. | v2 complete |

---

## 6. Key Risks

| Risk | Mitigation |
|---|---|
| IVFFlat index built on empty table | Create index only after backfill. Track as explicit post-backfill step. |
| Mistral embedding rate limits during backfill | Process in batches of 10–20 with 1s delay. `embedded_at IS NULL` acts as safe resume checkpoint. |
| Batch LLM JSON malformed | Use `response_format: { type: 'json_object' }`. Wrap parse in try/catch; assign score=0 to unscored jobs. Write unit test with fixture for the prompt/parse cycle. |
| No auth middleware on backend routes | Implement JWT validation middleware in Sprint 4/8. All mutating routes must verify user identity before production launch. |
| Heroku Scheduler timing | Scheduler runs in separate one-off dynos, so the basic dyno doesn't need to stay alive for crons. HTTP cron endpoints handle each task independently. Add the `CRON_SECRET` env var to Heroku config vars. |
| `scraped_jobs.id` is `integer`, not `uuid` | Be explicit: `job_id: number` in all TypeScript interfaces for `match_cache`. Type generator enforces this post-migration. |

---

## 7. Verification

1. **DB:** Run `SELECT * FROM user_profiles LIMIT 1` and `SELECT embedding IS NOT NULL FROM scraped_jobs LIMIT 5` after backfill to confirm data is present.
2. **Embedding service:** Unit test `embedText()` with a fixture to confirm a `number[1024]` is returned.
3. **Matching pipeline:** Create a test user profile, run `runForUser(userId)`, query `match_cache` — expect rows with non-null scores.
4. **API:** `curl GET /matches/:userId` should return ranked job list with `score`, `reasoning`, `is_hidden_gem`.
5. **Frontend `/profile`:** Submit form → check Supabase `user_profiles` table has a new row with `embedded_at` set.
6. **Frontend `/dashboard`:** Should show `MatchCard` components with scores after a matching run.
7. **Hidden gems:** Manually verify 1–2 match_cache rows where `is_hidden_gem = true` have high similarity but no exact skill keyword overlap.

---

## Critical Files

- [supabase.types.ts](apps/backend/src/lib/supabase.types.ts) — regenerate after every DB migration
- [matching.pipeline.ts](apps/backend/src/services/matching/matching.pipeline.ts) — core v2 logic (new)
- [supabase.ts](apps/backend/src/lib/supabase.ts) — add new TS interfaces
- [packages/types/index.ts](packages/types/index.ts) — add `UserProfile`, `MatchResult`, `StructuredSummary`
- [dashboard/_lib/queries.ts](apps/frontend/src/app/(authenticated)/dashboard/_lib/queries.ts) — switch from searches to matches query
