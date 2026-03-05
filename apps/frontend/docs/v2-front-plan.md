# Sprint 8 & 9: Frontend v2 — Profile + Dashboard + Match Detail

## Context

The backend v2 pipeline (matching, profiles, match_cache) is complete. The frontend still shows the v1 search wizard. These sprints replace it with a profile creation form (Sprint 8) and a v2 dashboard showing ranked matches + a match detail page (Sprint 9). The DB migration (dropping v1 tables, adding UNIQUE on `scraped_jobs.url`) is deferred to AFTER the frontend is shipped.

---

## Implementation Order

**Sprint 8** — Profile page → Sidebar update
**Sprint 9** — Dashboard refactor → Match detail page → Delete /search

---

## Confirmed APIs & Components

- `Button`: accepts `variant`, `size`, `isLoading`, `href` (internal Link). For external URLs use a plain `<a>`.
- `Input`: accepts `label`, `error`, `helperText`, all native `input` props.
- `Text`: renders a `<p className="text-gray-400">`.
- Auth token: `createClient()` (browser) → `supabase.auth.getSession()` → `session?.access_token`.
- UserID: `useUser()` client-side, `getUser()` server-side.

---

## Files to Create / Modify

### Foundation (both sprints need this)

**CREATE** `apps/frontend/src/lib/api/getAuthHeaders.ts`
Browser-side auth header helper.
```ts
import { createClient } from '@/lib/supabase/client';
export async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${session?.access_token ?? ''}`,
  };
}
```

**CREATE** `apps/frontend/src/lib/api/getAuthHeadersServer.ts`
Server-side version (same shape, imports from `@/lib/supabase/server`).
Must be a separate file — Next.js bundler errors if browser and server Supabase imports coexist.

**MODIFY** `apps/frontend/src/constants/routes.ts`
Add: `export const PROFILE = '/profile';`
Add: `export const MATCHES = '/matches';` (used to build `/matches/[jobId]` URLs; no index page)
Remove: `SEARCH` (after /search is deleted)

---

### Sprint 8 — `/profile` page

**CREATE** `apps/frontend/src/app/(authenticated)/profile/_lib/queries.ts`
- `ProfileNotFoundError extends Error` (message `'PROFILE_NOT_FOUND'`)
- `prefetchProfileByUser(queryClient, userId)` — server prefetch, stores 404 as error
- `useProfile(userId)` — client hook, `retry: (_, err) => !(err instanceof ProfileNotFoundError)`
- Query key: `['profile', userId]`
- Endpoint: `GET ${BASE}/profiles/${userId}` → `json.data` as `UserProfile`

**CREATE** `apps/frontend/src/app/(authenticated)/profile/_lib/mutations.ts`
- `useUpsertProfile()` — `useMutation` wrapping `POST ${BASE}/profiles`
- Payload type: `{ userId, hardConstraints?, skillGraph?, seniority?, culturePreference? }`
- Uses `getAuthHeaders()` (browser helper)

**CREATE** `apps/frontend/src/app/(authenticated)/profile/page.tsx`
Server component.
1. `getUser()` → redirect to LOGIN if null
2. `prefetchProfileByUser(queryClient, user.id)` (silent; 404 stored as error state, not thrown)
3. Wrap `ProfileForm` in `HydrationBoundary`

**CREATE** `apps/frontend/src/app/(authenticated)/profile/_components/SkillGraphInput.tsx`
`'use client'` component. Props: `value: Record<string, number>`, `onChange`.
- Internal state: `skillName: string`, `years: string`
- Renders existing skills as removable tags: `"{skill} · {n}y"`
- Two `<Input>` fields side-by-side + "Add" button
- Enter key triggers add
- On add: validates non-empty name + valid integer ≥ 0, then calls `onChange({ ...value, [skill]: years })`

**CREATE** `apps/frontend/src/app/(authenticated)/profile/_components/ProfileForm.tsx`
`'use client'`. The core of Sprint 8.

Steps (0–4):
- **0 — Hard constraints**: `Input label="Location"`, remote checkbox (styled toggle), `Input type="number" label="Min salary (k€)"`, `Input type="number" label="Max salary (k€)"`
- **1 — Skills**: `<SkillGraphInput>` with heading "Add your skills and years of experience"
- **2 — Seniority**: radio group: `junior / mid / senior / lead` (styled as cards or labeled radio buttons)
- **3 — Culture**: radio group: `startup / scale-up / big_corp`
- **4 — Review**: read-only summary of all steps + submit button

State:
```ts
const [formData, setFormData] = useState<ProfileFormData>(() => initFormData(profile));
```
where `initFormData(profile?)` maps `UserProfile | undefined` to form defaults (empty strings / false / {}).

Pre-population: `const { data: profile } = useProfile(user.id)`. Since HydrationBoundary makes the data synchronously available on mount, the lazy `useState` initializer has access to the cached profile.

Navigation:
- Simple inline Back/Next `<button>` elements at the bottom (no dependency on /search components that will be deleted)
- "Next" enabled when: step 2 requires seniority selected, step 3 requires culture selected; steps 0,1,4 always allow Next

On submit (step 4):
```ts
mutate({
  userId: user.id,
  hardConstraints: { location: ..., remote: ..., salary_min: ..., salary_max: ... },
  skillGraph: formData.skill_graph,
  seniority: formData.seniority || undefined,
  culturePreference: formData.culture_preference || undefined,
});
```
On `onSuccess`: `router.push(DASHBOARD)`.
On `isPending`: disable submit button + show loading state.
On `isError`: `throw error` (caught by `error.tsx` boundary).

**MODIFY** `apps/frontend/src/components/ui/Sidebar/SidebarNavigation.tsx`
- Remove `{ name: 'Search', href: '/search', icon: LuSearch }`
- Add `{ name: 'Profile', href: '/profile', icon: LuUser }` (from `react-icons/lu`)
- Remove unused `LuSearch` import

---

### Sprint 9 — Dashboard + Match Detail + Cleanup

**CREATE** `apps/frontend/src/app/(authenticated)/dashboard/_lib/matchQueries.ts`
- `prefetchMatchesByUser(queryClient, userId)` — server prefetch
- `useMatchesByUser(userId)` — client hook
- Query key: `['userMatches', userId]`
- Endpoint: `GET ${BASE}/matches/${userId}?limit=50&minScore=0&hiddenGemsOnly=false` → `json.data` as `MatchWithJob[]`
- Returns empty array `[]` when no matches (no 404); no ProfileNotFoundError here

**CREATE** `apps/frontend/src/app/(authenticated)/dashboard/_lib/matchMutations.ts`
- `useTriggerMatching()` — `useMutation` wrapping `POST ${BASE}/matches/trigger/${userId}`
- On success: `queryClient.invalidateQueries()` is already handled globally by `mutationCache.onSuccess`

**MODIFY** `apps/frontend/src/app/(authenticated)/dashboard/page.tsx`
Replace entirely:
1. `getUser()` → redirect to LOGIN if null
2. `prefetchProfileByUser(queryClient, user.id)` — server prefetch profile
3. Check `queryClient.getQueryState(['profile', user.id])?.error` → if truthy, `redirect(PROFILE)` (server-side, no flash)
4. `prefetchMatchesByUser(queryClient, user.id)`
5. Wrap `<Dashboard user={user} />` in `<HydrationBoundary state={dehydrate(queryClient)}>`

Note: current page.tsx lacks HydrationBoundary — add it.

**CREATE** `apps/frontend/src/app/(authenticated)/dashboard/_components/MatchCard.tsx`
Presentational, links to `/matches/${job.id}`.
Props: `match: MatchWithJob`.
Displays:
- Score badge (circular, colour-coded: green ≥80%, yellow ≥60%, red <60%)
- Job title + company + location
- "Hidden Gem" purple badge when `is_hidden_gem`
- `reasoning` snippet (2-line clamp via `overflow-hidden` + fixed max-height if `line-clamp-2` unavailable)
- `missing_skills` chips (first 5, then "+N more" label)
- Hover: `-translate-y-1` transition

Score normalisation: API returns `score` as 0–100 integer (per `MatchResult` type); display as-is with `%`.

**MODIFY** `apps/frontend/src/app/(authenticated)/dashboard/_components/Dashboard.tsx`
Replace body. Remove all `useSearchTasksByUser` / `TasksList` imports. Import and render `<MatchList />`.

**CREATE** `apps/frontend/src/app/(authenticated)/dashboard/_components/MatchList.tsx`
`'use client'`.
- Calls `useMatchesByUser(user.id)` and `useTriggerMatching()`
- Profile check: calls `useProfile(user.id)`. On `isError && error instanceof ProfileNotFoundError`: `router.replace(PROFILE)` in `useEffect`.
- Loading: render `<TasksListSkeleton />` (reuse existing component)
- Empty: card with "No matches yet" + conditional "Matching started" text or `<Button onClick={() => trigger(user.id)}>Run now</Button>`
- Populated: header row with match count + "Refresh matches" button, then 3-column grid of `<MatchCard>`

**CREATE** `apps/frontend/src/app/(authenticated)/matches/[jobId]/_lib/queries.ts`
- `prefetchMatchDetail(queryClient, userId, jobId)` — server
- `useMatchDetail(userId, jobId)` — client
- Query key: `['matchDetail', userId, jobId]`
- Endpoint: `GET ${BASE}/matches/${userId}/job/${jobId}` → `json.data` as `MatchWithJob`

**CREATE** `apps/frontend/src/app/(authenticated)/matches/[jobId]/page.tsx`
Server component. Standard pattern: auth check → prefetch → HydrationBoundary → `<MatchDetailClient jobId={jobId} />`.

**CREATE** `apps/frontend/src/app/(authenticated)/matches/[jobId]/_components/MatchDetailClient.tsx`
`'use client'`. Two-column layout on `lg:`.

Left (2/3):
- Title card: job title, company, location, score (large number), hidden gem badge
- "Why this match?" card: `reasoning`
- "Skills to develop" card: `missing_skills` chips
- "Salary alignment" card: `salary_alignment` text
- "View job posting" → plain `<a href={job.url} target="_blank" rel="noopener noreferrer">` styled with Button primary classes

Right sidebar (1/3):
- "Job Summary" card from `job.structured_summary`: tech stack chips, seniority, culture, salary, responsibilities
- Source label at bottom

Back navigation: `<Link href={DASHBOARD}>← Back to matches</Link>` (DASHBOARD, not MATCHES — no index page at /matches)

---

### Cleanup (end of Sprint 9)

**DELETE** `apps/frontend/src/app/(authenticated)/search/` — entire directory (all files)
**DELETE** `apps/frontend/src/app/(authenticated)/dashboard/_lib/queries.ts` — old v1 searches queries
**DELETE** `apps/frontend/src/app/(authenticated)/dashboard/_components/TasksList/SearchCard.tsx`
Remove `SEARCH` from `constants/routes.ts`

---

## Edge Cases

| Scenario | Handling |
|---|---|
| New user, no profile | Server-side redirect in `dashboard/page.tsx` via query state check |
| Profile exists, no matches yet | Empty state in `MatchList` with "Run now" trigger button |
| Trigger clicked | Button replaced with "Matching started" green text; no polling |
| Profile fetch fails (non-404) | Thrown error caught by `error.tsx` boundary |
| Match detail jobId not found | `error.tsx` boundary (404 from API throws in query fn) |

---

## Deferred (post-frontend)

- Apply DB migration `supabase/migrations/20260228_cleanup.sql` (drop `job_results`/`job_searches`, add UNIQUE on `scraped_jobs.url`)
- Regenerate `supabase.types.ts` after migration

---

## Verification

1. Create a user account → should redirect to `/profile` when navigating to `/dashboard`
2. Fill profile form → submit → redirected to `/dashboard`
3. Dashboard shows "No matches yet" empty state with "Run now" button
4. Click "Run now" → shows success message
5. Manually seed `match_cache` for the user → refresh dashboard → `MatchCard` components appear
6. Click a `MatchCard` → navigates to `/matches/[jobId]` with full detail
7. Edit profile → navigate to `/profile` via sidebar → form pre-populated with existing values
8. Sidebar: "Profile" link visible, "Search" link gone

---

## Critical Files

- `profile/_components/ProfileForm.tsx` — most complex new component
- `dashboard/page.tsx` — server-side profile guard + HydrationBoundary
- `dashboard/_components/MatchList.tsx` — client-side no-profile redirect + trigger flow
- `matches/[jobId]/_components/MatchDetailClient.tsx` — detail page layout
- `lib/api/getAuthHeaders.ts` + `getAuthHeadersServer.ts` — must be created first (all queries depend on them)
