# Quickstart: Checklist App

**Date**: 2026-05-20

## Prerequisites

- Node.js 20+
- A Supabase project (free tier is sufficient)
- A Groq API key (free tier available at console.groq.com)
- A Sentry project (optional for local dev)

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Copy `.env.local.example` to `.env.local` (or create it) and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
GROQ_API_KEY=<groq-api-key>
NEXT_PUBLIC_APP_URL=http://localhost:3001
SENTRY_DSN=                         # optional for local dev
```

## 3. Run the database migration

In the Supabase SQL Editor (or via the Supabase CLI), run:

```sql
-- See supabase/migration.sql
```

This creates the `checklists` and `checklist_items` tables and applies RLS policies.

## 4. Start the dev server

```bash
npm run dev
```

App runs at `http://localhost:3001`.

## 5. Run tests

```bash
npm test                 # single run
npm run test:watch       # watch mode
npm run test:coverage    # coverage report
```

## 6. Lint

```bash
npm run lint
```

All lint errors must be zero before committing.

## 7. Production build

```bash
npm run build
```

Build must succeed with zero errors before a PR is opened.

## Development notes

- Server Components are the default. Add `'use client'` only when browser APIs or event
  handlers are needed.
- All data mutations go through Server Actions in `app/actions/`. Never call Supabase
  directly from a Client Component.
- Use `app/utils/supabase/server.ts` in Server Components and Actions; use
  `app/utils/supabase/client.ts` in Client Components only.
- The admin client (`app/utils/supabase/admin.ts`) is reserved for service-role operations
  and must never be imported in browser-reachable code.
- Dynamic route params are a `Promise` in Next.js 16 — always `await params` before use.
- Do not remove the `onRequestError` hook in `instrumentation.ts`.
