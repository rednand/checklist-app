# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run lint     # ESLint — fix all errors before committing
```

No test suite exists in this project.

## Architecture

**Checklist App** — users describe a task and AI generates an organized checklist with categories. Requires authentication (Supabase Auth).

### Route structure

- `app/layout.tsx` — root layout, PWA metadata, `<html lang="pt-BR">`
- `app/(app)/` — authenticated shell. `layout.tsx` redirects unauthenticated users and renders the top nav + `<MobileNav>`
- `app/(app)/page.tsx` — dashboard (stats + quick generate form)
- `app/(app)/checklists/layout.tsx` — fetches all user checklists, renders sidebar + content pane side-by-side
- `app/(app)/checklists/[id]/page.tsx` — single checklist view with progress bar, items grouped by category
- `app/login/page.tsx` — unauthenticated entry point
- `app/auth/callback/route.ts` — Supabase OAuth callback handler

### Data model

Two Supabase tables:
- `checklists` — `id, title, prompt, user_id, created_at`
- `checklist_items` — `id, checklist_id, user_id, text, category, position, checked`

All queries filter by `user_id` — never fetch rows across users. RLS is active.

### Server Actions (`app/actions/`)

All mutations live here. The four creation paths all call the same insert pattern:

| Action | Entry point |
|---|---|
| AI generation (prompt) | `generateChecklist` |
| Document/text extraction | `generateFromExtraction` |
| Spreadsheet import | `createFromSpreadsheet` |
| Manual entry | `createManualChecklist` |

Rate limit: 20 checklists per hour per user — enforced in `generateChecklist` and `generateFromExtraction` by querying `created_at >= 1 hour ago`.

### AI integration

Uses **Groq SDK** (`groq-sdk`) with model `llama-3.3-70b-versatile`. The LLM is prompted to return only a JSON object `{ title, items[] }`. The response is extracted with a regex before `JSON.parse` because the model may wrap the JSON in prose.

### Supabase clients

- `app/utils/supabase/server.ts` — SSR client (reads cookies); use in Server Components and Server Actions
- `app/utils/supabase/client.ts` — browser client; use only in Client Components
- `app/utils/supabase/admin.ts` — service-role client; never expose to browser

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GROQ_API_KEY
NEXT_PUBLIC_APP_URL
```
