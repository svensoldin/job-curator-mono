# Auth Migration Plan: Remove Supabase from Frontend

**Status:** Deferred — out of scope for Sprint 8 & 9. Reference for a future sprint.

---

## Current State

Supabase is used in the frontend **only for authentication** — there are no direct Supabase database queries from the frontend. All data flows through the backend API (`NEXT_PUBLIC_JOB_SCRAPER_URL`).

Supabase currently handles:
- Email/password sign-in and sign-up (via Server Actions in `app/login/actions.ts`)
- GitHub OAuth (callback in `app/auth/callback/route.ts`)
- Email OTP confirmation (in `app/auth/confirm/route.ts`)
- Session management via HTTP-only cookies (`@supabase/ssr`)
- Route protection in middleware (`src/lib/supabase/middleware.ts` → `updateSession`)

The backend validates Supabase JWTs on every protected route via `requireAuth` middleware (`apps/backend/src/middleware/auth.ts`), which calls `supabase.auth.getUser(token)`.

Two environment variables are currently exposed to the browser:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the anon key)

---

## Why Decouple

- **Architectural cleanness**: the frontend should not need to know which database or auth provider the backend uses.
- **Vendor flexibility**: swapping auth providers in the future would only require backend changes.
- **Reduced frontend surface**: one fewer third-party SDK (`@supabase/ssr`) and no Supabase credentials in the browser bundle.

> Note: this is **not a security issue**. The publishable/anon key is intentionally safe to expose. Supabase RLS policies and the backend's `requireAuth` middleware already fully protect all data.

---

## What Full Decoupling Requires

### Backend — new auth routes

The backend currently has **no auth endpoints**. These would need to be added to `apps/backend/src/routes/auth.ts`:

| Endpoint | Purpose |
|---|---|
| `POST /auth/login` | Email/password sign-in → calls Supabase internally, returns session |
| `POST /auth/signup` | User registration |
| `POST /auth/logout` | Invalidates session |
| `GET /auth/me` | Validate current token, return user object |
| `GET /auth/callback?code=` | GitHub OAuth code exchange → redirect to frontend |

The backend's `requireAuth` middleware in `apps/backend/src/middleware/auth.ts` does **not** need to change — it still validates Supabase JWTs passed as `Authorization: Bearer <token>`. The backend simply becomes the middleman that proxies auth to Supabase and hands the token back to the frontend.

### Frontend — replace Supabase auth

| File | Change |
|---|---|
| `src/app/login/actions.ts` | Replace `supabase.auth.*` calls with `fetch` to backend auth endpoints |
| `src/middleware.ts` | Read token from cookie, call `GET /auth/me` to validate session |
| `src/context/UserContext.tsx` | Source user from backend session response, not Supabase user object |
| `src/app/auth/callback/route.ts` | Delete — OAuth callback now handled by backend |
| `src/app/auth/confirm/route.ts` | Delete — email OTP handled by backend |
| `src/lib/supabase/` | Delete entire directory |
| `package.json` | Remove `@supabase/ssr` |
| `.env.local` | Remove `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

The `getAuthHeaders.ts` helper (introduced in Sprint 8) would be simplified to read the token from the cookie set by a Next.js Server Action after login, rather than calling `supabase.auth.getSession()`.

---

## Recommended Approach

**Option A: Backend proxies Supabase auth, returns Supabase JWT.**

The backend calls Supabase internally on login/signup and returns the `access_token` and `refresh_token` to the frontend. The frontend stores the `access_token` in an HTTP-only cookie (set via a Server Action). All subsequent API calls send `Authorization: Bearer <token>` as before — backend `requireAuth` is unchanged.

This is the lowest-risk path because:
- Backend data routes require no changes
- `requireAuth` middleware is unchanged
- The Supabase JWT format is preserved end-to-end
- Token refresh: expose `POST /auth/refresh` which calls `supabase.auth.refreshSession()`

```
Browser → POST /auth/login → Backend → Supabase signInWithPassword
                          ← { access_token, refresh_token, user }
         Store access_token in HTTP-only cookie (Next.js Server Action)

Browser → GET /dashboard → middleware reads cookie → GET /auth/me (backend) → 200 OK
Browser → GET /matches/userId → Authorization: Bearer <cookie token> → backend requireAuth → OK
```

---

## Why This Is Deferred

Implementing this cleanly requires:
1. New backend auth routes covering login, signup, logout, OAuth callback, and token refresh
2. Rewriting all frontend auth flows (Server Actions, middleware, UserContext)
3. Handling OAuth redirect coordination between backend and frontend
4. Testing all auth flows end-to-end

This is a standalone sprint's worth of work, independent of the Sprint 8 & 9 UI work. The `getAuthHeaders.ts` abstraction introduced in Sprint 8 already isolates the token-fetching logic, so when this migration happens, only that helper and the auth-specific files need to change — the queries and mutations are unaffected.

---

## Verification (when implemented)

1. Sign up with email → confirmation email arrives, OTP flow completes
2. Login with email/password → session set, redirected to dashboard
3. Login with GitHub → OAuth flow completes via backend callback, session valid
4. Refresh page → middleware validates session, user stays logged in
5. Logout → session cleared, redirected to login
6. Token expiry → refresh endpoint called automatically, session extended
7. All backend API calls (profiles, matches) authenticate correctly with the new cookie token
