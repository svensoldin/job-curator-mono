# Backend

Express/TypeScript backend. ESM modules — all local imports must use `.js` extensions.

## Stack

- **Runtime**: Node 22, ESM (`"type": "module"`)
- **Framework**: Express v5
- **LLM**: Mistral AI (`@mistralai/mistralai`) — model constants in `src/constants/ai-analyzer.ts`
- **DB**: Supabase (`@supabase/supabase-js`) — typed client in `src/lib/supabase.ts`
- **Logging**: Winston — shared instance in `src/utils/logger.ts`
- **Tests**: Vitest

## Commands

- `pnpm dev` — start with tsx watch
- `pnpm build` — compile TypeScript to `dist/`
- `pnpm test` — run Vitest

## Patterns

- Services are function-based exports in `src/services/<domain>/`
- Use the shared `logger` (not `console`) for all logging
- Supabase table names are in `src/constants/supabase.ts`
- Env vars: `MISTRAL_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
