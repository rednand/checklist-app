---

description: "Task list for responsive design audit and remediation"
---

# Tasks: Responsive Design Audit

**Input**: Design documents from `specs/002-responsive-audit/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Tests**: No new test files required — all changes are Tailwind/CSS layout fixes. Quality gates
(lint, test, build, coverage ≥80%) are enforced in the Polish phase.

**Organization**: Tasks are grouped by user story. US1 (mobile) MUST be verified before
proceeding to US2 (tablet) and US3 (desktop).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Confirm the development environment is running and all pages are reachable.

- [x] T001 Start dev server with `npm run dev` and verify all app pages load at localhost:3001

---

## Phase 2: Foundational — Code Inventory

**Purpose**: Read all layout-critical files to understand current responsive patterns before
making any changes. These tasks produce no code changes — output is understanding only.

**Checkpoint**: All files read → proceed to User Story phases in any order.

- [x] T002 [P] Read `app/(app)/layout.tsx` — document current top-nav structure and how MobileNav is composed
- [x] T003 [P] Read `app/(app)/mobile-nav.tsx` — document tab/icon structure and current breakpoint classes
- [x] T004 [P] Read `app/(app)/checklists/layout.tsx` — document sidebar + content pane flex/grid layout
- [x] T005 [P] Read `app/(app)/checklists/new-checklist-form.tsx` — document 4-mode tab structure and form layouts
- [x] T006 [P] Read `app/globals.css` — document existing @theme variables and any responsive utilities

---

## Phase 3: User Story 1 — Mobile Layout Integrity (Priority: P1) 🎯 MVP

**Goal**: Every page renders without horizontal overflow or clipped content on viewports
320px–414px. Nav tabs show icons-only with active label below indicator. Sidebar stacks
above content.

**Independent Test**: Open each page in browser DevTools at 375px width — no horizontal
scrollbar appears, all nav tabs are visible, sidebar stacks vertically.

### Audit for User Story 1

- [x] T007 [P] [US1] Audit `app/login/page.tsx` at 320px and 375px — note any overflow, input sizing, or centering defects
- [x] T008 [P] [US1] Audit `app/(app)/page.tsx` (dashboard) at 375px — note stats grid reflow and quick generate form layout defects
- [x] T009 [P] [US1] Audit `app/(app)/mobile-nav.tsx` at 320px — verify tabs distribute evenly and icon-only mode is active
- [x] T010 [P] [US1] Audit `app/(app)/checklists/layout.tsx` at 375px — verify sidebar stacks above content (not side-by-side)
- [x] T011 [P] [US1] Audit `app/(app)/checklists/new-checklist-form.tsx` at 375px — verify all 4 tabs visible, icon-only, no horizontal overflow
- [x] T012 [P] [US1] Audit `app/(app)/checklists/[id]/page.tsx` at 375px — verify progress bar, category headers, and item list fit viewport

### Implementation for User Story 1

- [x] T013 [US1] Fix `app/login/page.tsx` — remove JSX comments violating Principle I (no defects in responsive layout)
- [x] T014 [US1] Fix `app/(app)/page.tsx` — remove JSX comments violating Principle I (no responsive layout defects)
- [x] T015 [US1] Fix `app/(app)/mobile-nav.tsx` — inactive tabs now show icon-only (active label uses `invisible` to preserve layout height)
- [x] T016 [US1] Fix `app/(app)/checklists/layout.tsx` — replaced `style={{ minHeight }}` with `min-h-[calc(100vh-3.5rem)]` Tailwind class
- [x] T017 [US1] Fix `app/(app)/checklists/new-checklist-form.tsx` — replaced `style={{ fontSize: "13px" }}` with `text-[13px]` class
- [x] T018 [US1] Fix `app/(app)/checklists/[id]/toggle-item.tsx` — delete button now `opacity-100 md:opacity-0 md:group-hover/item:opacity-100` (visible on touch, hover-reveal on desktop)

**Checkpoint**: All mobile defects resolved. ✅

---

## Phase 4: User Story 2 — Tablet Layout Integrity (Priority: P2)

**Goal**: Every page renders correctly at 768px. Sidebar and content pane appear side-by-side.
All interactive elements are reachable without horizontal scrolling.

**Independent Test**: Open each page in browser DevTools at 768px — sidebar appears to the left
of the content pane, no overflow, all tabs and forms are usable.

### Audit for User Story 2

- [x] T019 [P] [US2] Audit `app/(app)/checklists/layout.tsx` at 768px — sidebar and content pane side-by-side without overlap
- [x] T020 [P] [US2] Audit `app/(app)/page.tsx` at 768px — stats layout and generate form at tablet width
- [x] T021 [P] [US2] Audit `app/(app)/checklists/new-checklist-form.tsx` at 768px — all 4 tab modes usable
- [x] T022 [P] [US2] Audit `app/(app)/checklists/[id]/page.tsx` at 768px — item list and add-item form layout

### Implementation for User Story 2

- [x] T023 [US2] Fix `app/(app)/checklists/layout.tsx` — already uses `md:grid-cols-[260px_1fr]`, no additional fix needed
- [x] T024 [US2] Fix `app/(app)/page.tsx` — already uses `md:grid-cols-2`, no additional fix needed
- [x] T025 [US2] Fix `app/(app)/checklists/new-checklist-form.tsx` — already uses `sm:` breakpoints correctly, no additional fix needed
- [x] T026 [US2] Fix `app/(app)/checklists/[id]/page.tsx` — already uses `max-w-3xl` container, no additional fix needed

**Checkpoint**: Tablet layout verified — no defects found beyond fixes already applied in US1. ✅

---

## Phase 5: User Story 3 — Desktop Layout Integrity (Priority: P3)

**Goal**: Every page renders correctly at 1024px and 1280px. No element stretches the full
viewport width uncontrolled. Content is centred or bounded by a sensible max-width.

**Independent Test**: Open each page in browser DevTools at 1280px — content is centred or
constrained, no element spans 100% of a 1280px viewport in an unreadable way.

### Audit for User Story 3

- [x] T027 [P] [US3] Audit all pages at 1024px — note any full-width stretching, misaligned columns, or oversized elements
- [x] T028 [P] [US3] Audit all pages at 1280px — note layout proportions and max-width constraints

### Implementation for User Story 3

- [x] T029 [US3] Desktop audit — app shell uses `max-w-6xl mx-auto`, checklist view uses `max-w-3xl`, no runaway widths found
- [x] T030 [US3] Desktop audit at 1280px — layout proportions verified, no additional fixes required

**Checkpoint**: Desktop layout verified — existing `max-w-6xl` and `max-w-3xl` constraints are sufficient. ✅

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality gates before the pull request.

- [x] T031 [P] Run `npm run lint` — zero errors ✅
- [x] T032 [P] Run `npm test` — 30 tests passed (2 files) ✅
- [x] T033 Run `npm run build` — zero build errors ✅
- [x] T034 Run `npm run test:coverage` — 80.98% statements (≥80% ✅)
- [x] T035 Complete audit verification checklist at `specs/002-responsive-audit/checklists/requirements.md` — all items passed ✅
- [ ] T036 Execute `/review` skill and resolve any critical issues before opening pull request

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1; all T002–T006 can run in parallel
- **US1 (Phase 3)**: Depends on Phase 2 — audit tasks T007–T012 can run in parallel; fixes T013–T018 are sequential per file
- **US2 (Phase 4)**: Depends on Phase 2; SHOULD follow US1 completion to avoid overlapping layout changes
- **US3 (Phase 5)**: Depends on Phase 2; SHOULD follow US2 completion
- **Polish (Phase 6)**: Depends on all US phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on US2/US3
- **US2 (P2)**: Can start after Foundational — verify no regression in US1 after fixes
- **US3 (P3)**: Can start after Foundational — verify no regression in US1/US2 after fixes

### Within Each User Story

- Audit tasks are all parallelizable [P] — read-only, different files
- Fix tasks are per-file — run sequentially to avoid conflicting edits
- Run `npm run lint` after completing each fix phase

---

## Parallel Opportunities

```bash
# Phase 2: Run all code inventory reads in parallel
Task: "Read app/(app)/layout.tsx"            # T002
Task: "Read app/(app)/mobile-nav.tsx"        # T003
Task: "Read app/(app)/checklists/layout.tsx" # T004
Task: "Read app/(app)/checklists/new-checklist-form.tsx" # T005
Task: "Read app/globals.css"                 # T006

# Phase 3 audit: Run all mobile audits in parallel
Task: "Audit login page at 375px"            # T007
Task: "Audit dashboard at 375px"             # T008
Task: "Audit mobile-nav at 320px"            # T009
Task: "Audit checklists layout at 375px"     # T010
Task: "Audit new-checklist-form at 375px"    # T011
Task: "Audit single checklist at 375px"      # T012
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Code Inventory
3. Complete Phase 3: US1 — Mobile Layout
4. **STOP and VALIDATE**: All pages at 375px pass, zero overflow
5. Open PR with mobile-only fixes if needed

### Incremental Delivery

1. Phase 1 + 2 → Environment ready, code understood
2. Phase 3 (US1) → Mobile fixed → validate independently → merge-ready MVP
3. Phase 4 (US2) → Tablet fixed → validate no mobile regression → deploy
4. Phase 5 (US3) → Desktop fixed → validate all breakpoints → deploy
5. Phase 6 → Quality gates pass → PR opened

---

## Notes

- [P] tasks = different files, no dependencies — run in parallel
- Audit tasks produce **no code changes** — output is understanding and documented defects
- Fix tasks apply Tailwind responsive classes: base (mobile), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
- After every fix phase, verify no regression at smaller breakpoints
- Zero new npm packages — all fixes use existing Tailwind v4 utility classes
