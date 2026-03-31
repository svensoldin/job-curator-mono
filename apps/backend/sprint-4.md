# Sprint 4 — MatchingPipeline + CacheService + routes

## Goal
Build the core v2 matching logic: a 3-tier pipeline (SQL filter → vector search → batch
LLM scoring), a cache read service, and HTTP endpoints for matches, jobs, and cron
triggers (replacing node-cron with Heroku Scheduler-friendly HTTP routes).

## Files to create
- `src/services/matching/matching.pipeline.ts`
- `src/services/matching/matching.pipeline.test.ts`
- `src/services/cache/cache.service.ts`
- `src/services/cache/cache.service.test.ts`
- `src/routes/matches.ts`
- `src/routes/jobs.ts`
- `src/routes/cron.ts`

## Files to modify
- `src/constants/supabase.ts` — add `SUPABASE_MATCH_CACHE_TABLE = 'match_cache'`
- `src/index.ts` — mount matches, jobs, cron routes; remove node-cron import
- `packages/types/index.ts` — add `MatchWithJob` interface

## Add `MatchWithJob` to `packages/types/index.ts`

```ts
export interface MatchWithJob extends MatchResult {
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    url: string;
    source: string;
    structured_summary: StructuredSummary | null;
  };
}
```

## MatchingPipeline (`src/services/matching/matching.pipeline.ts`)

### Unexported helper

**`computeIsHiddenGem(similarity, skillGraph, summary): boolean`**
- Returns `true` if `similarity >= 0.75` AND keyword overlap < 30%.
- Overlap = number of keys from `skillGraph` that appear (case-insensitive) in
  `summary.stack` / total keys in `skillGraph`.
- Returns `false` if `skillGraph` is null/empty or `summary` is null.

### Exported functions

**`runForUser(userId: string): Promise<void>`**
1. Fetch profile from `user_profiles WHERE user_id = userId` — select
   `embedding`, `hard_constraints`, `skill_graph`, `raw_profile_text`.
2. If `embedding` is null, throw an error — profile not ready.
3. Call `supabase.rpc('match_jobs_for_user', { query_embedding: profile.embedding,
   location_filter: profile.hard_constraints?.location ?? null,
   salary_min: profile.hard_constraints?.salary_min ?? null,
   match_count: 30 })`.
4. For each RPC result, call `computeIsHiddenGem(row.similarity, profile.skill_graph,
   row.structured_summary)`.
5. Build one batch prompt (use `structured_summary`, not full description):
   ```
   Candidate: ${profile.raw_profile_text}
   Jobs: [{ job_id, title, company, summary: structured_summary }, ...]
   Return JSON array: [{ job_id, score (0-100), reasoning, missing_skills, salary_alignment }]
   ```
6. Call Mistral (`mistral-small-latest`) with `response_format: { type: 'json_object' }`
   → parse JSON array.
7. Upsert each result into `match_cache` — ON CONFLICT `(user_id, job_id)` DO UPDATE:
   ```ts
   {
     user_id: userId,
     job_id: row.job_id,
     score: llmResult.score,
     reasoning: llmResult.reasoning,
     missing_skills: llmResult.missing_skills,
     salary_alignment: llmResult.salary_alignment,
     is_hidden_gem: computedIsHiddenGem,
     updated_at: new Date().toISOString(),
   }
   ```
- Throw on DB or Mistral error (callers catch and log).

**`runForAllUsers(): Promise<void>`**
- Fetch all profiles from `user_profiles WHERE embedding IS NOT NULL` — select
  `user_id`.
- Call `runForUser(userId)` for each sequentially (to avoid rate limits).
- Log progress per user via `logger`; catch per-user errors, log them, and continue.

## CacheService (`src/services/cache/cache.service.ts`)

### Exported functions

**`getMatchesForUser(userId: string, options?: { limit?: number; minScore?: number; hiddenGemsOnly?: boolean }): Promise<MatchWithJob[]>`**
- Query: `supabase.from('match_cache').select('*, scraped_jobs(id,title,company,location,url,source,structured_summary)').eq('user_id', userId).order('score', { ascending: false })`.
- Apply `.limit(options.limit ?? 50)`.
- Apply `.gte('score', options.minScore)` if `minScore` is provided.
- Apply `.eq('is_hidden_gem', true)` if `hiddenGemsOnly` is true.
- Map each row to `MatchWithJob` (rename the `scraped_jobs` nested object to `job`).
- Throw on DB error.

**`getMatchDetail(userId: string, jobId: number): Promise<MatchWithJob | null>`**
- Query: same select as above but `.eq('user_id', userId).eq('job_id', jobId).maybeSingle()`.
- Return the mapped `MatchWithJob` or `null`.
- Throw on DB error.

## routes/matches.ts

```ts
import express, { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as CacheService from '../services/cache/cache.service.js';
import { runForUser } from '../services/matching/matching.pipeline.js';

const router: Router = express.Router();

// GET /matches/:userId — returns cached matches for the user
router.get('/:userId', requireAuth, async (req, res) => {
  // requireAuth must own userId (req.user.id === req.params.userId)
  const { limit, minScore, hiddenGemsOnly } = req.query;
  const matches = await CacheService.getMatchesForUser(req.params.userId, {
    limit: limit ? Number(limit) : undefined,
    minScore: minScore ? Number(minScore) : undefined,
    hiddenGemsOnly: hiddenGemsOnly === 'true',
  });
  return res.json({ data: matches });
});

// GET /matches/:userId/job/:jobId — returns a single match detail
router.get('/:userId/job/:jobId', requireAuth, async (req, res) => {
  const match = await CacheService.getMatchDetail(
    req.params.userId,
    Number(req.params.jobId),
  );
  if (!match) return res.status(404).json({ error: 'Match not found' });
  return res.json({ data: match });
});

// POST /matches/trigger/:userId — fire-and-forget pipeline run, returns 202
router.post('/trigger/:userId', requireAuth, async (req, res) => {
  runForUser(req.params.userId).catch((err) =>
    logger.error('Background matching failed', { error: err }),
  );
  return res.status(202).json({ data: { message: 'Matching triggered' } });
});

export default router;
```

Wrap each handler body in try/catch returning `{ error: string }` on failure.

## routes/jobs.ts

```ts
// GET /jobs — requireAuth
// Query params: location?, source?, limit? (default 50), offset? (default 0)
```
- Query `scraped_jobs` table.
- Apply `.ilike('location', `%${location}%`)` if `location` param provided.
- Apply `.eq('source', source)` if `source` param provided.
- Apply `.range(offset, offset + limit - 1)` for pagination.
- Return `{ data: jobs[] }`.

Wrap handler in try/catch returning `{ error: string }` on failure.

## routes/cron.ts

### Cron auth middleware

```ts
function cronAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-cron-secret'];
  if (!secret || secret !== process.env.CRON_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
```

### Routes (all protected by `cronAuthMiddleware`)

```ts
// POST /cron/scrape — runs the scraper
router.post('/scrape', cronAuthMiddleware, async (req, res) => {
  await scrapeJobs(SCRAPE_CRITERIA);
  return res.json({ data: { message: 'ok' } });
});

// POST /cron/process-jobs — summarizes then embeds pending jobs
router.post('/process-jobs', cronAuthMiddleware, async (req, res) => {
  await processPendingSummaries(50);
  await processUnembeddedJobs(50);
  return res.json({ data: { message: 'ok' } });
});

// POST /cron/run-matching — runs matching pipeline for all users
router.post('/run-matching', cronAuthMiddleware, async (req, res) => {
  await runForAllUsers();
  return res.json({ data: { message: 'ok' } });
});
```

Wrap each handler in try/catch returning `{ error: string }` on failure.

## Mount in `src/index.ts`

```ts
import matchesRoutes from './routes/matches.js';
import jobsRoutes from './routes/jobs.js';
import cronRoutes from './routes/cron.js';
// ...
app.use('/matches', matchesRoutes);
app.use('/jobs', jobsRoutes);
app.use('/cron', cronRoutes);
```

Remove the `import './services/scraper/cron.js'` (or equivalent node-cron import).

## Tests

### `src/services/matching/matching.pipeline.test.ts` (Vitest)

- **`computeIsHiddenGem`** — pure unit tests, no mocks:
  - `similarity = 0.74` → returns `false`
  - `similarity = 0.75`, overlap = 0% → returns `true`
  - `similarity = 0.75`, overlap = 29% → returns `true`
  - `similarity = 0.75`, overlap = 30% → returns `false`
  - `skillGraph = null` → returns `false`
  - `summary = null` → returns `false`

- **`runForUser`**:
  - Mock `supabase.from('user_profiles')` to return a fixture profile with non-null
    embedding.
  - Mock `supabase.rpc('match_jobs_for_user')` to return 2 fixture job rows.
  - Mock Mistral client to return a fixture JSON array (2 scored results).
  - Mock `supabase.from('match_cache').upsert` to succeed.
  - Assert RPC called with correct `query_embedding`, `location_filter`, `salary_min`.
  - Assert upsert called with correct `user_id`, `job_id`, `score`, `is_hidden_gem`.
  - Test error path: if `embedding` is null, assert function throws.

- **`runForAllUsers`**:
  - Mock `supabase.from('user_profiles')` to return 2 profiles.
  - Mock `runForUser` (spy) to resolve for user 1, reject for user 2.
  - Assert `runForUser` called for both users; assert the rejection is caught and
    does not propagate.

### `src/services/cache/cache.service.test.ts` (Vitest)

- **`getMatchesForUser`** — mock the supabase select chain:
  - Default options → assert `.limit(50)` applied, no `.gte` or `.eq('is_hidden_gem')`.
  - `{ minScore: 70 }` → assert `.gte('score', 70)` applied.
  - `{ hiddenGemsOnly: true }` → assert `.eq('is_hidden_gem', true)` applied.
  - Assert returned array maps `scraped_jobs` nested object to `job` key.

- **`getMatchDetail`**:
  - Mock returning a row → assert `MatchWithJob` returned.
  - Mock returning `null` → assert `null` returned.

## Verification
1. `pnpm build` passes with no TS errors
2. Unit tests pass: `pnpm test`
3. Manual smoke tests:
   - `POST /cron/process-jobs` with `x-cron-secret` header → jobs get summarized
     and embedded in Supabase
   - `POST /cron/run-matching` with `x-cron-secret` header → `match_cache` rows
     appear in Supabase
   - `GET /matches/:userId` → returns ranked list with `score`, `reasoning`,
     `is_hidden_gem`
   - `GET /jobs?location=Paris` → returns filtered jobs
   - `POST /matches/trigger/:userId` → returns 202, `match_cache` updated
     asynchronously
