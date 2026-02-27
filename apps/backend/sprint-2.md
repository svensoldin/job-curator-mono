# Sprint 2 — EmbeddingService + JobSummaryService

## Goal
Process scraped jobs: generate Mistral embeddings and structured summaries.
Both services are standalone and idempotent.

## Files to create
- `src/services/embedding/embedding.service.ts`
- `src/services/job-summary/job-summary.service.ts`

## EmbeddingService (`src/services/embedding/embedding.service.ts`)

### Functions

**`embedText(text: string): Promise<number[]>`**
- Call `client.embeddings.create({ model: 'mistral-embed', inputs: [text] })`
- Return `response.data[0].embedding`
- Throw on error (caller handles)

**`embedBatch(texts: string[]): Promise<number[][]>`**
- Send texts in chunks of 20 with 1s delay between chunks
- Return flat array of embeddings in input order

**`processUnembeddedJobs(batchSize = 50): Promise<void>`**
- Query `scraped_jobs WHERE embedded_at IS NULL LIMIT batchSize`
- For each job: call `embedText(job.description)`
- Update row: `embedding = result, embedded_at = now()`
- Log progress; on per-job error log + continue (don't abort batch)

## JobSummaryService (`src/services/job-summary/job-summary.service.ts`)

### Types
- Uses `StructuredSummary` from `@job-curator/types`

### Functions

**`summarizeJob(job: { id: number; description: string }): Promise<StructuredSummary>`**
- Call `client.chat.complete({ model: 'mistral-small-latest', responseFormat: { type: 'json_object' }, messages: [...] })`
- System prompt: instruct to extract `{ stack: string[], seniority, culture, responsibilities, salary }`
- Parse response content as JSON; throw on malformed output
- Return typed `StructuredSummary`

**`processPendingSummaries(batchSize = 50): Promise<void>`**
- Query `scraped_jobs WHERE summarized_at IS NULL LIMIT batchSize`
- For each job: call `summarizeJob(job)`
- Update row: `structured_summary = result, summarized_at = now()`
- Log progress; on per-job error log + continue

## Mistral Client Setup
Both services instantiate `new Mistral({ apiKey: process.env.MISTRAL_API_KEY })` locally
(no shared singleton needed at this stage).

## Tests (Vitest)
- `src/services/embedding/embedding.service.test.ts`
  - Mock Mistral client; assert `embedText` returns `number[]` of length 1024
  - Assert `processUnembeddedJobs` calls update on each unembedded job
- `src/services/job-summary/job-summary.service.test.ts`
  - Mock Mistral client with fixture JSON response
  - Assert `summarizeJob` returns valid `StructuredSummary` shape
  - Assert malformed JSON throws

## Verification
1. `pnpm build` passes with no TS errors
2. Unit tests pass: `pnpm test`
3. Manual smoke test: call `processUnembeddedJobs(1)` with a real job in DB,
   verify `embedding IS NOT NULL` and `embedded_at` is set in Supabase
