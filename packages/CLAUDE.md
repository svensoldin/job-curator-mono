# Packages

Shared packages consumed by `apps/backend` and `apps/scraper`.

## `@repo/types`

Shared TypeScript interfaces used across all apps. No runtime code — types only.

Key types: `SearchTask`, `UserCriteria`, `JobPost`, `UserProfile`, `HardConstraints`, `StructuredSummary`.

## `@repo/pipeline`

The core data-processing pipeline. Contains three services:

- **embedding** — Embeds job description text into 1024-dimensional vectors using Mistral's `mistral-embed` model. Processes unembedded jobs in batches.
- **job-summary** — Generates structured summaries for scraped jobs that are pending processing.
- **matching** — Runs vector similarity matching between a user's embedded profile and scraped job vectors. Includes "hidden gem" detection (high semantic similarity but low keyword overlap with the user's skill graph).

Also exports a shared Supabase client and table name constants so both apps use identical database references.

## `@repo/typescript-config`

Shared `tsconfig` base (`base.json`) extended by all apps and packages.
