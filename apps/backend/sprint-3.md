# Sprint 3 — ProfileService + routes/profiles.ts

## Goal
Build the user profile CRUD service and expose it via three HTTP endpoints.
The service builds a plain-text representation of the profile and stores a
Mistral embedding in `user_profiles.embedding` via the existing EmbeddingService.

## Files to create
- `src/services/profile/profile.service.ts`
- `src/services/profile/profile.service.test.ts`
- `src/routes/profiles.ts`

## Files to modify
- `src/constants/supabase.ts` — add `SUPABASE_USER_PROFILES_TABLE = 'user_profiles'`
- `src/index.ts` — import and mount `/profiles` router

## ProfileService (`src/services/profile/profile.service.ts`)

### Input type (local, not exported from package)
```ts
interface ProfileInput {
  hardConstraints?: HardConstraints;
  skillGraph?: Record<string, number>;
  seniority?: UserProfile['seniority'];
  culturePreference?: UserProfile['culture_preference'];
  techStackWeights?: Record<string, number>;
}
```
Import `HardConstraints` and `UserProfile` from `@job-curator/types`.

### Functions

**`buildProfileText(userId: string, input: ProfileInput): string`**
- Convert structured input into a human-readable paragraph used for embedding.
- Example output: `"Senior frontend engineer with React (5), Node.js (3), looking
  for a startup, located in Paris, salary 65–80k (remote ok)."`
- Include all non-null fields; omit missing ones gracefully.
- Pure function — no I/O.

**`createOrUpdate(userId: string, input: ProfileInput): Promise<UserProfile>`**
1. Call `buildProfileText(userId, input)` → `rawText`
2. Call `embedText(rawText)` from `embedding.service.ts` → `embedding: number[]`
3. Upsert into `user_profiles` (ON CONFLICT `user_id` DO UPDATE):
   ```ts
   {
     user_id: userId,
     hard_constraints: input.hardConstraints ?? null,
     skill_graph: input.skillGraph ?? null,
     seniority: input.seniority ?? null,
     culture_preference: input.culturePreference ?? null,
     tech_stack_weights: input.techStackWeights ?? null,
     raw_profile_text: rawText,
     embedding: embedding as unknown as string,
     embedded_at: new Date().toISOString(),
     updated_at: new Date().toISOString(),
   }
   ```
4. Return the upserted row (`.select().single()`).
- Throw on DB or embedding error (route handler catches and returns 500).

**`getByUserId(userId: string): Promise<UserProfile | null>`**
- Query `user_profiles WHERE user_id = userId`.
- Return the row or `null` if not found (`.maybeSingle()`).
- Throw on DB error.

**`deleteByUserId(userId: string): Promise<void>`**
- Delete `user_profiles WHERE user_id = userId`.
- Throw on DB error.

## routes/profiles.ts

```ts
import express, { Router } from 'express';
import * as ProfileService from '../services/profile/profile.service.js';

const router: Router = express.Router();

// GET /profiles/:userId
router.get('/:userId', async (req, res) => {
  const profile = await ProfileService.getByUserId(req.params.userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  return res.json({ data: profile });
});

// POST /profiles
router.post('/', async (req, res) => {
  const { userId, hardConstraints, skillGraph, seniority,
          culturePreference, techStackWeights } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  const profile = await ProfileService.createOrUpdate(userId, {
    hardConstraints, skillGraph, seniority, culturePreference, techStackWeights,
  });
  return res.json({ data: profile });
});

// DELETE /profiles/:userId
router.delete('/:userId', async (req, res) => {
  await ProfileService.deleteByUserId(req.params.userId);
  return res.status(204).send();
});

export default router;
```

Wrap each handler body in try/catch returning `{ error: string }` on failure.

## Mount in `src/index.ts`

```ts
import profilesRoutes from './routes/profiles.js';
// ...
app.use('/profiles', profilesRoutes);
```

## Tests (`src/services/profile/profile.service.test.ts`, Vitest)

- **`buildProfileText`** — pure unit test, no mocks:
  - Full input → assert output contains seniority, skills, culture, location
  - Minimal input (only userId) → assert no undefined/null in output string

- **`createOrUpdate`**:
  - Mock `embedText` (from `embedding.service.ts`) to return `Array(1024).fill(0)`
  - Mock `supabase` upsert to return a fixture profile
  - Assert `embedText` called with the string returned by `buildProfileText`
  - Assert upsert called with correct `user_id` and `embedded_at` set

- **`getByUserId`**:
  - Mock supabase returning a row → expect `UserProfile` returned
  - Mock supabase returning `null` → expect `null` returned

- **`deleteByUserId`**:
  - Mock supabase delete → assert no error thrown

## Verification
1. `pnpm build` passes with no TS errors
2. Unit tests pass: `pnpm test`
3. Manual smoke test:
   - `POST /profiles` with a JSON body → check `user_profiles` row in Supabase
     with `embedded_at` set and `embedding` non-null
   - `GET /profiles/:userId` → returns the row
   - `DELETE /profiles/:userId` → 204, row gone from Supabase
