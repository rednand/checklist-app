<!--
Sync Impact Report
==================
Version change: 1.1.0 → 1.1.1
Bump type: PATCH — Principle II testing standard refined; mandatory per-unit test rule replaced
  with an 80% coverage floor. No principles added or removed.

Modified principles:
  - II. Testing Standards → testing bar changed from mandatory-test-per-new-unit to ≥80% coverage

Added sections:
  - None

Removed sections:
  - None

Templates status:
  - .specify/templates/plan-template.md ✅ No changes required (Constitution Check is dynamic)
  - .specify/templates/spec-template.md ✅ No changes required
  - .specify/templates/tasks-template.md ✅ Updated: test task labels reverted to optional guidance
  - .specify/templates/commands/ ✅ No outdated references found

Deferred items:
  - None
-->

# Checklist App Constitution

## Core Principles

### I. Code Quality

All code MUST be written in TypeScript with strict type safety. The `any` type is forbidden — use
`unknown` with type guards when the type cannot be statically determined. `console.log` statements
MUST NOT appear in committed code. Inline styles are forbidden; all styling MUST use Tailwind v4
utility classes. Code MUST pass `npm run lint` with zero errors before any commit. Comments in
source code are forbidden unless the rationale is non-obvious (hidden constraint, subtle invariant,
or workaround for a specific external bug).

### II. Testing Standards

Tests are co-located with their source files (e.g., `app/lib/ai.test.ts`). Supabase, Next.js
navigation/cache APIs, and the Groq SDK MUST be mocked via `vi.mock` — never hit external services
in unit or integration tests. Every Server Action that mutates data MUST have at least one test
covering the happy path and one covering an expected error condition. Overall test coverage MUST
remain at or above 80% — verified by `npm run test:coverage` before any pull request is opened.
`npm test` MUST pass before any pull request is created.

### III. Simple UX

The UI MUST be simple and purposeful — every element on screen MUST earn its place. Complexity MUST
NOT be added to satisfy hypothetical future needs. The application follows a mobile-first responsive
design approach. On mobile viewports, tabs MUST display icons only; the active tab label MUST appear
below the active indicator. Loading and error states MUST be handled explicitly — no unhandled
promise rejections or blank screens on failure. Every user-facing form MUST provide clear feedback
on submission (success confirmation, validation error messages, or loading indication). The
`<html lang="pt-BR">` attribute MUST be preserved — the UI language is Brazilian Portuguese.

### IV. Performance

Server Components are the default — `'use client'` MUST only be added when browser APIs or event
handlers are required. Client-side parsing (PDF via `pdfjs-dist`, spreadsheets via `xlsx`) MUST
remain on the client to avoid saturating the server. Extracted text submitted to the LLM MUST be
truncated to 16,000 characters. Rate limiting of 20 checklists per hour per user MUST be enforced
in all AI-generation and extraction Server Actions. Production builds (`npm run build`) MUST
succeed with zero errors.

### V. Security & Data Integrity

All Supabase queries MUST filter by `user_id` — cross-user data access is forbidden. Row-Level
Security (RLS) MUST remain active on all tables; bypassing it requires explicit justification and
review. The admin client (`app/utils/supabase/admin.ts`) MUST NEVER be imported or used from any
Client Component or browser-reachable path. All data mutations MUST go through Server Actions with
the `'use server'` directive. The `onRequestError` hook in `instrumentation.ts` MUST NOT be
removed — it is required for Sentry error capture on the server/edge runtime.

### VI. Responsible Design

Features MUST be designed with the user's wellbeing and data privacy in mind. The application MUST
NOT collect or expose data beyond what is strictly required to fulfil a user's explicit request.
AI-generated content MUST be clearly attributable as machine-generated where relevant to the user's
understanding. Error messages MUST be honest and actionable — they MUST NOT obscure failures or
mislead users about the state of their data. Any design decision that trades user trust for
convenience MUST be rejected.

### VII. Minimal Dependencies

New npm packages MUST NOT be added unless no reasonable implementation is achievable with the
existing dependency tree or the Next.js / React platform APIs. Before introducing a new dependency,
the author MUST document in the PR description: (a) what existing capability was evaluated and
found insufficient, and (b) the maintenance status and bundle impact of the proposed package.
Dependencies that duplicate capabilities already provided by the stack (e.g., adding a date library
when `Intl` suffices, or a fetch wrapper when native `fetch` works) MUST be rejected.

## Development Standards

- **Stack**: Next.js 16.x App Router only — no `pages/` directory. React 19. Tailwind v4 with
  CSS-first `@theme` configuration — no `tailwind.config.js`. TypeScript throughout.
- **File placement**: Reusable components in `components/`. Route UI in `app/(app)/`. Server
  Actions grouped by domain in `app/actions/`. Never place components inside `app/`.
- **Async params**: Dynamic route params are a `Promise` in Next.js 16 — always `await params`
  before accessing properties.
- **Supabase client selection**: SSR client for Server Components and Actions; browser client only
  in Client Components.
- **AI responses**: The Groq response MUST be extracted with a regex before `JSON.parse` — the
  model may wrap JSON in prose.

## Quality Gates

All of the following MUST be satisfied before a pull request is opened:

1. `npm run lint` completes with zero errors.
2. `npm test` completes with zero failures.
3. `npm run build` completes with zero errors.
4. No `any` types, `console.log`, inline styles, or source code comments introduced.
5. All Supabase queries include `user_id` filtering.
6. No admin client usage in client-accessible code paths.
7. `npm run test:coverage` reports ≥ 80% overall coverage.
8. No new dependency added without PR-description justification (Principle VII).
9. `/review` skill executed and critical issues resolved.

## Governance

This constitution supersedes all other development practices for this repository. Amendments MUST
be proposed with a clear rationale, reviewed by at least one team member, and committed with a
version bump following semantic versioning:

- **MAJOR**: Removal or redefinition of a principle that breaks existing workflows.
- **MINOR**: New principle or section added, or material expansion of existing guidance.
- **PATCH**: Clarifications, wording fixes, non-semantic refinements.

All pull requests and code reviews MUST verify compliance with this constitution. Complexity beyond
what a principle permits MUST be justified in the PR description.

**Version**: 1.1.1 | **Ratified**: 2026-05-20 | **Last Amended**: 2026-05-20
