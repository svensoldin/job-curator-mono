# Plan: Split Backend into API + Scraper App

**What:** Extract the pipeline services (`job-summary`, `embedding`, `matching`) into a new `packages/pipeline` shared package, create a standalone `apps/scraper` CLI script that runs the full pipeline end-to-end, and shrink `apps/backend` to a pure API. Daily triggering is handled by a GitHub Actions scheduled workflow that checks out the repo and executes the scraper script directly — no persistent server, no HTTP endpoints.

**Why:** Running the scraper as a GitHub Actions job eliminates the need for a dedicated Heroku dyno for the scraper. The workflow installs Chromium, runs the pipeline sequentially, and exits. Costs nothing outside of GitHub Actions minutes.

---

## Steps

### 1. Create `packages/pipeline`

New package `@repo/pipeline` at `packages/pipeline/`. Structure:

```
package.json       (name: @repo/pipeline, deps: @mistralai/mistralai, @supabase/supabase-js, winston, dotenv, @repo/types)
tsconfig.json      (mirrors packages/types/tsconfig.json pattern)
index.ts           (re-exports all public symbols)
src/
  lib/
    supabase.ts         ← move from apps/backend/src/lib/supabase.ts (drop legacy Job* interfaces, keep typed client export)
    supabase.types.ts   ← move from apps/backend/src/lib/supabase.types.ts
  utils/
    logger.ts           ← copy from apps/backend/src/utils/logger.ts
  constants/
    supabase.ts         ← move from apps/backend/src/constants/supabase.ts
  services/
    job-summary.service.ts  ← move from apps/backend/src/services/job-summary/
    embedding.service.ts    ← move from apps/backend/src/services/embedding/
    matching.pipeline.ts    ← move from apps/backend/src/services/matching/
```

Update all internal relative imports in the moved files (e.g. `../../lib/supabase.js` → `../lib/supabase.js`). The `index.ts` exports: `embedText`, `embedBatch`, `processUnembeddedJobs`, `processPendingSummaries`, `runForUser`, `runForAllUsers`, `supabase`, `logger`.

### 2. Create `apps/scraper`

New CLI-only script (no HTTP server):

```
apps/scraper/
  package.json     (name: scraper, deps: @repo/pipeline, @repo/types, puppeteer, dotenv, winston; scripts: { "start": "tsx src/index.ts" })
  tsconfig.json    (same compiler options as apps/backend/tsconfig.json)
  src/
    index.ts       (top-level async runner: loads env, runs scrape → process-jobs → run-matching sequentially, exits with code 0/1)
    services/
      scraper/     ← move entire apps/backend/src/services/scraper/ directory here
    constants/
      scraper.ts   ← move from apps/backend/src/constants/scraper.ts
    types.ts       ← move apps/backend/src/types.ts (ScrapeCriteria, JobPosting — scraper-local types)
    utils/
      logger.ts    ← copy or re-export from @repo/pipeline (or import directly)
```

`src/index.ts` imports `scrapeJobs` from local `./services/scraper/scraper.js` and pipeline functions (`processPendingSummaries`, `processUnembeddedJobs`, `runForAllUsers`) from `@repo/pipeline`. Each step is `await`ed in sequence; any uncaught error causes a non-zero exit so the GitHub Actions step is marked as failed.

No Express, no routes, no `CRON_SECRET`, no Procfile, no Dockerfile.

### 3. Update `apps/backend`

- `apps/backend/package.json`: add `"@repo/pipeline": "workspace:*"`, remove `puppeteer`, remove `node-cron` (unused)
- `apps/backend/src/index.ts`: remove `/cron` route mount, remove `CRON_SECRET` from required env vars
- `apps/backend/src/routes/matches.ts`: update `runForUser` import → `import { runForUser } from '@repo/pipeline'`
- `apps/backend/src/services/profile/profile.service.ts`: update `embedText` import → `import { embedText } from '@repo/pipeline'`; update `supabase` and `supabase.types` imports → `from '@repo/pipeline'`
- `apps/backend/src/services/cache/cache.service.ts`: update `supabase` + constants imports → from `@repo/pipeline`
- Delete: `src/routes/cron.ts`, `src/services/scraper/`, `src/services/job-summary/`, `src/services/embedding/`, `src/services/matching/`, `src/lib/supabase.ts`, `src/lib/supabase.types.ts`, `src/constants/supabase.ts`, `src/types.ts`, `src/utils/logger.ts`

The `lib/supabase.ts` legacy interfaces (`JobSearch`, `JobResult`, etc.) should be checked — if `routes/searches.ts` still uses them, keep them in `apps/backend/src/lib/` as a thin wrapper or inline them into the routes.

### 4. Add `@repo/pipeline` to Turborepo pipeline

`turbo.json`: ensure `build` task includes `packages/pipeline` or `dependsOn: ["^build"]` is already set (likely already works via the default).
`pnpm-workspace.yaml`: already covers `packages/*` — no change needed.

### 5. GitHub Actions — cron trigger workflow

New `.github/workflows/scraper-cron.yml`:

```yaml
on:
  schedule:
    - cron: '0 8 * * *'
  workflow_dispatch:

jobs:
  run-pipeline:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install Chromium dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 \
            libgbm1 libasound2 libxrandr2 libxdamage1 libpangocairo-1.0-0

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build pipeline package
        run: pnpm --filter @repo/pipeline build

      - name: Run scraper pipeline
        run: pnpm --filter scraper start
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          MISTRAL_API_KEY: ${{ secrets.MISTRAL_API_KEY }}
          PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: true
          PUPPETEER_EXECUTABLE_PATH: /usr/bin/chromium-browser
```

Secrets needed in GitHub: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MISTRAL_API_KEY`. The script exits with a non-zero code on failure, which marks the workflow run as failed.

### 6. Remove scraper deploy workflow

No Dockerfile, no Heroku app, and no deploy workflow are needed for the scraper. Delete (or never create) `scraper-deploy.yml`. The only CI artefact is the cron workflow above.

---

## Verification

- `pnpm --filter @repo/pipeline build` — confirms the package compiles
- `pnpm --filter scraper start` — scraper runs locally end-to-end (requires real env vars)
- `pnpm --filter ai-job-hunter dev` — API boots without cron routes or Puppeteer
- `workflow_dispatch` on `scraper-cron.yml` to test end-to-end GitHub Actions trigger

---

## Decisions

- `supabase.types.ts` (generated DB types) moves to `packages/pipeline` rather than `packages/types` — it's a DB-layer concern, not a domain type
- `logger.ts` is duplicated per-app (each app writes its own `logs/`) rather than shared — avoids the `process.cwd()` / filesystem path ambiguity in a package context
- Legacy `JobSearch`/`JobResult` interfaces in `supabase.ts` stay in `apps/backend` unless they're unused (to be confirmed during implementation)
- The scraper has no HTTP layer and no deployment target — it is a pure CLI script executed by GitHub Actions
- `CRON_SECRET` is no longer needed anywhere
- Chromium is installed via `apt-get` in the Actions runner; `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` + `PUPPETEER_EXECUTABLE_PATH` point Puppeteer at the system binary
