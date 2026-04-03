# Retry utility and testing strategy

## The `withRetry` helper

`packages/pipeline/src/utils/retry.ts` is a generic async retry wrapper used wherever a transient external call (e.g. a Mistral API request) can fail and is worth re-attempting.

```ts
withRetry(fn, maxAttempts?, onRetry?)
```

| Parameter | Default | Description |
|---|---|---|
| `fn` | — | Async function to execute |
| `maxAttempts` | `3` | Total number of attempts before giving up |
| `onRetry` | `undefined` | Called after each failure with `(attempt, error)` — use this to log, not to retry logic |

**Backoff**: each failed attempt (except the last) waits `500ms × 2^(attempt-1)` before the next try:

| Attempt | Delay before next |
|---|---|
| 1 → 2 | 500 ms |
| 2 → 3 | 1 000 ms |
| 3 (last) | — (throws immediately) |

On exhaustion, `withRetry` re-throws the last error unchanged, so callers see the original error type and message.

### Current usage

`summarizeJob` in `packages/pipeline/src/services/job-summary/job-summary.service.ts` wraps its Mistral chat call:

```ts
return withRetry(
  async () => { /* Mistral call + parse + validate */ },
  3,
  (attempt, err) => logger.warn(`summarizeJob attempt ${attempt} failed for job ${job.id}: ${err}`),
);
```

---

## Testing strategy for async retries with backoff

Because `withRetry` uses real `setTimeout` delays, tests that trigger retries would be slow (up to 1.5 s per test) without fake timers. We use Vitest's **fake timer** mode to collapse all delays to zero.

### Setup pattern

Fake timers are scoped to the `describe` block that needs them, not the whole file, to avoid interfering with unrelated tests:

```ts
describe('summarizeJob', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('...', async () => { /* ... */ });
});
```

### Test body pattern

Every test that expects retries (or expects a final throw after exhaustion) follows this three-step pattern:

```ts
// 1. Start the async operation — do NOT await it yet
const promise = summarizeJob({ id: 1, description: '...' });

// 2. Prevent Node from treating the eventual rejection as unhandled
//    (required before we advance timers, because the rejection may be
//    triggered by runAllTimersAsync before our expect() can attach a handler)
promise.catch(() => {});

// 3. Drain all pending timers, then assert
await vi.runAllTimersAsync();
await expect(promise).rejects.toThrow('...');
```

**Why `promise.catch(() => {})`?**  
Node records a promise as "unhandled" from the moment it rejects until a `.catch`/`.then(_, ...)` handler is attached. `vi.runAllTimersAsync()` runs all timers synchronously-ish inside an await, so by the time it returns the promise is already rejected — but we haven't called `expect()` yet. Without the no-op catch, Vitest surfaces this as an `UnhandledRejection` error and fails the test run even though the assertion itself would pass.

Attaching `promise.catch(() => {})` registers a handler immediately, so the rejection is never "unhandled". The subsequent `await expect(promise).rejects.toThrow(...)` still works because a promise can have multiple handlers.

### Success-path tests (no retries)

If the mock always resolves on the first call, no `setTimeout` fires and no timers need to be advanced. These tests can still use the simpler form:

```ts
const result = await summarizeJob({ id: 1, description: '...' });
expect(result).toMatchObject(FIXTURE_SUMMARY);
```

`vi.useFakeTimers()` is still active in the `beforeEach`, but it has no observable effect when no timers are scheduled.
