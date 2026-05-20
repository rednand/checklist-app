# Implementation Plan: Responsive Design Audit

**Branch**: `002-responsive-audit` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-responsive-audit/spec.md`

## Summary

Audit every page and component in the Checklist App for responsive layout correctness across six
breakpoints (320px → 1280px). Document all defects found during the audit, then apply Tailwind v4
fixes to achieve zero horizontal overflow, correct tab behavior on mobile, and proper
sidebar/content-pane stacking across all viewports. No new dependencies or data changes are
required.

## Technical Context

**Language/Version**: TypeScript 5.x

**Primary Dependencies**: Next.js 16, React 19, Tailwind v4 (CSS-first `@theme`)

**Storage**: N/A — no data model changes

**Testing**: Manual browser DevTools at each breakpoint; Vitest for overall coverage gate (≥80%)

**Target Platform**: Web application — mobile (320–414px), tablet (768–1023px), desktop (1024px+)

**Project Type**: Web application — responsive design audit and remediation

**Performance Goals**: Zero Cumulative Layout Shift introduced by fixes; instant rendering at all
breakpoints

**Constraints**: Tailwind v4 CSS-first only (no `tailwind.config.js`); no new npm packages;
all fixes MUST use existing Tailwind utility classes or `app/globals.css` custom properties

**Scale/Scope**: 6 pages, 8 components, 6 viewport breakpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Code Quality | All fixes use TypeScript + Tailwind v4 utilities. No `any`, no inline styles, no `console.log` introduced. | PASS |
| II. Testing Standards | Coverage ≥80% maintained. Responsive layout is CSS — manual DevTools verification is the audit methodology. No vitest unit tests apply to pure Tailwind layout changes. | PASS |
| III. Simple UX | This feature directly enforces the mobile-first responsive mandate from the constitution. | REQUIRED |
| IV. Performance | Server Components default preserved throughout; no new `'use client'` directives needed for layout fixes. | PASS |
| V. Security & Data Integrity | No data access or mutation changes. | PASS |
| VI. Responsible Design | Improving layout for all device types aligns with user wellbeing principle. | PASS |
| VII. Minimal Dependencies | Zero new npm packages. All fixes use existing Tailwind v4 utility classes. | PASS |

## Project Structure

### Documentation (this feature)

```text
specs/002-responsive-audit/
├── plan.md              # This file
├── research.md          # Phase 0 output — audit findings per page/component
├── quickstart.md        # Phase 1 output — how to run and verify the audit
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (files under audit)

```text
app/
├── globals.css                                   # Tailwind @theme — responsive utilities
├── login/
│   └── page.tsx                                  # Login page — audit
├── (app)/
│   ├── layout.tsx                                # App shell — top nav + MobileNav
│   ├── page.tsx                                  # Dashboard — stats + quick generate form
│   ├── mobile-nav.tsx                            # Mobile navigation bar
│   ├── nav-link.tsx                              # Individual nav link component
│   ├── checklists/
│   │   ├── layout.tsx                            # Sidebar + content pane shell
│   │   ├── new/page.tsx                          # New checklist redirect
│   │   ├── checklists-sidebar.tsx                # Scrollable checklist list sidebar
│   │   ├── new-checklist-form.tsx                # 4-mode form (AI/extract/spreadsheet/manual)
│   │   └── [id]/
│   │       ├── page.tsx                          # Single checklist view
│   │       ├── add-item-form.tsx                 # Add item inline form
│   │       └── toggle-item.tsx                   # Item checkbox toggle
```

**Structure Decision**: Single web application project. All fixes are applied in-place to existing
files. No new files or directories are created unless a shared responsive utility must be added to
`app/globals.css`.

## Complexity Tracking

> No constitution violations — complexity tracking not required.
