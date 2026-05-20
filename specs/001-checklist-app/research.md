# Research: Checklist App

**Phase**: 0 — Pre-design decisions
**Date**: 2026-05-20
**Branch**: `001-checklist-app`

All decisions below reflect the existing, production codebase. This document records the rationale
behind choices already made.

---

## AI Generation

**Decision**: Groq API with `llama-3.3-70b-versatile` via the official Groq SDK, wrapped in
`app/lib/ai.ts` (`generateWithFallback`).

**Rationale**: Groq inference is significantly faster than comparable OpenAI endpoints for
structured JSON generation tasks, making the sub-10-second UX target achievable. The model
produces well-structured output that can be extracted with a regex before `JSON.parse`, handling
cases where the model wraps JSON in prose.

**Alternatives considered**:
- OpenAI GPT-4o: Slower cold-start latency, higher cost per token.
- Self-hosted LLM: Operational complexity not justified at current scale.
- Anthropic Claude: Viable, but Groq's speed advantage is decisive for this use case.

---

## Client-Side File Parsing

**Decision**: PDF parsing via `pdfjs-dist`, spreadsheet parsing via `xlsx`, both executed in the
browser before submission.

**Rationale**: Parsing large files server-side would consume significant memory per request and
tie up server workers. Doing it client-side offloads the CPU work to the user's device and keeps
Server Actions lightweight. Extracted text is truncated to 16,000 characters before being sent,
capping payload size.

**Alternatives considered**:
- Server-side PDF parsing (pdf-parse, Puppeteer): Adds server memory pressure; complicates
  streaming and progress feedback.
- Cloud document parsing API: Adds a third-party dependency and latency; overkill for the
  supported document types.

---

## Authentication

**Decision**: Supabase Auth with OAuth callback route at `app/auth/callback/route.ts`.

**Rationale**: Supabase Auth integrates natively with the Supabase database, enabling RLS
policies that reference `auth.uid()` without any additional token validation layer. The SSR
client in `app/utils/supabase/server.ts` reads cookies, so authenticated sessions work
seamlessly in Server Components and Server Actions.

**Alternatives considered**:
- NextAuth.js: More auth providers out of the box, but requires a separate session table and
  loses the native RLS integration.
- Custom JWT + middleware: Higher implementation and maintenance burden.

---

## Database & Row-Level Security

**Decision**: Supabase (PostgreSQL) with RLS policies on both `checklists` and `checklist_items`
tables. All application queries filter by `user_id`. The admin client is reserved for
service-role operations that intentionally bypass RLS.

**Rationale**: RLS provides a defense-in-depth guarantee: even a query that omits a `user_id`
filter in application code will not return another user's data. This is essential for a
multi-tenant product.

**Alternatives considered**:
- Application-only filtering (no RLS): Single point of failure; a forgotten WHERE clause leaks
  data.
- Separate database per user: Operationally impractical at this scale.

---

## Rate Limiting

**Decision**: Query-based rate limiting: count rows in `checklists` where
`user_id = $user AND created_at >= NOW() - INTERVAL '1 hour'`. Enforced in
`generateChecklist` and `generateFromExtraction` Server Actions. Limit: 20 per hour.

**Rationale**: At current scale, a DB query is fast enough and adds no external dependency.
Manual entry and spreadsheet import are not rate-limited because they do not consume AI tokens.

**Alternatives considered**:
- Redis / Upstash rate limiter: Faster for high-throughput scenarios, but adds infrastructure
  cost and complexity not needed at this scale.
- Middleware-based limiting: Cannot distinguish between creation modes at the middleware layer.

---

## Error Monitoring

**Decision**: Sentry configured via `instrumentation.ts` (server/edge) and
`sentry.client.config.ts` (browser). The `onRequestError` hook in `instrumentation.ts` MUST NOT
be removed.

**Rationale**: Sentry provides cross-environment error capture (both server and client), source
map integration for readable stack traces in production, and alerting. The `onRequestError` hook
is the only mechanism for capturing server-side request errors in Next.js 16.

**Alternatives considered**:
- LogRocket, Datadog RUM: Higher cost; Sentry's free tier is adequate for current scale.
- Custom logging only: No alerting or aggregation.

---

## Testing Strategy

**Decision**: Vitest with co-located test files. External services (Supabase, Next.js
navigation/cache, Groq SDK) mocked via `vi.mock`. Tests cover happy path and error conditions
per Server Action.

**Rationale**: Vitest is lighter than Jest, has first-class TypeScript support, and integrates
well with the existing build toolchain. Mocking externals keeps tests fast and deterministic;
the constitution explicitly prohibits hitting real services in tests.

**Alternatives considered**:
- Jest: Heavier setup, slower for TypeScript projects.
- Playwright (e2e only): Valuable for future e2e coverage but not a replacement for unit tests.
- No tests: Violates Constitution Principle II.
