# Implementation Plan: Checklist App

**Branch**: `001-checklist-app` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-checklist-app/spec.md`

## Summary

An authenticated, multi-user web PWA where users describe a task in natural language and receive
an AI-generated, categorized checklist. Three alternative creation paths (document upload,
spreadsheet import, manual entry) complement the AI path. Users track completion via an
interactive checklist UI with a progress bar. All data is user-scoped; cross-user access is
forbidden at both the application and database layer.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 16 (App Router), React 19, Tailwind v4, Supabase (Auth +
PostgreSQL), Groq SDK (llama-3.3-70b-versatile), pdfjs-dist (client-side PDF parsing), xlsx
(client-side spreadsheet parsing), Sentry (error monitoring), Vitest (testing)

**Storage**: Supabase (PostgreSQL) — two tables: `checklists`, `checklist_items`. RLS active.
Service-role admin client available for privileged operations only.

**Testing**: Vitest with co-located test files. External deps (Supabase, Next.js cache/nav, Groq)
mocked via `vi.mock`. `npm test` gates all PRs.

**Target Platform**: Progressive Web App — modern desktop and mobile browsers. Installable via
Web App Manifest. Primary language: Brazilian Portuguese.

**Project Type**: Full-stack web application (Next.js App Router SSR + client components)

**Performance Goals**: AI checklist generation visible to user in under 10 seconds under normal
network conditions. Production build (`npm run build`) succeeds with zero errors.

**Constraints**: 20 AI/extraction checklists per user per hour (DB-query rate limiting). Extracted
text truncated to 16,000 characters before LLM submission. Server Action body limit 10 MB.
No `any` TypeScript types. No inline styles. No `console.log` in committed code.

**Scale/Scope**: Multi-user SaaS; single repository; per-user data isolation enforced via RLS.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Code Quality | TypeScript strict, no `any`, no `console.log`, Tailwind only, ESLint zero errors | PASS — tsconfig strict mode + eslint.config.mjs enforced |
| II. Testing Standards | Co-located tests, `vi.mock` for externals, happy + error path per Server Action | PASS — `app/lib/ai.test.ts` and `app/actions/checklists.test.ts` present |
| III. UX Consistency | Mobile-first, icons-only tabs on mobile, explicit loading/error states, `pt-BR` | PASS — PWA manifest, `<html lang="pt-BR">`, mobile-nav component |
| IV. Performance | Server Components default, client-side parsing, 16k truncation, rate limiting, build passes | PASS — all enforced in existing codebase |
| V. Security & Data Integrity | `user_id` filter on all queries, RLS active, admin client isolated, Server Actions only, Sentry hook preserved | PASS — RLS active, admin client in `app/utils/supabase/admin.ts` only |

**No violations.** Complexity Tracking section not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-checklist-app/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Phase 1 dev setup guide
├── contracts/           # Phase 1 Server Action contracts
│   └── server-actions.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
app/
├── (app)/                        # Authenticated route shell
│   ├── layout.tsx                # Top nav + MobileNav
│   ├── loading.tsx               # Route-level loading state
│   ├── mobile-nav.tsx            # Bottom navigation (mobile)
│   ├── nav-link.tsx              # Active-state nav link
│   ├── page.tsx                  # Dashboard (stats + quick generate)
│   └── checklists/
│       ├── layout.tsx            # Sidebar + content pane
│       ├── page.tsx              # Checklists list (no selection)
│       ├── checklists-sidebar.tsx
│       ├── new-checklist-form.tsx  # 4-tab creation form
│       ├── new/                  # New checklist route
│       └── [id]/
│           └── page.tsx          # Single checklist view
├── actions/
│   ├── auth.ts                   # Sign out action
│   ├── checklists.ts             # generateChecklist, generateFromExtraction,
│   │                             #   createFromSpreadsheet, createManualChecklist,
│   │                             #   toggleChecklistItem
│   └── checklists.test.ts
├── api/
│   └── sentry-example-api/       # Sentry test route
├── auth/
│   └── callback/
│       └── route.ts              # Supabase OAuth callback
├── lib/
│   ├── ai.ts                     # generateWithFallback (Groq wrapper)
│   └── ai.test.ts
├── login/
│   └── page.tsx
└── utils/
    └── supabase/
        ├── admin.ts              # Service-role client (server-only)
        ├── client.ts             # Browser client
        └── server.ts             # SSR client (cookies)

supabase/
└── migration.sql                 # Table definitions + RLS policies

public/
├── sw.js                         # Service worker (PWA)
├── icon-192.svg
├── icon-512.svg
└── robots.txt
```

**Structure Decision**: Single Next.js full-stack project. No separate backend or frontend
packages. Server Actions replace REST endpoints. All reusable UI components live in
`components/` (to be created when needed); route-specific components are co-located in their
route directory.
