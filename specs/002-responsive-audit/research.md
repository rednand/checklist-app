# Research: Responsive Design Audit

## Breakpoint Strategy

**Decision**: Six breakpoints for the audit matrix.

| Label | Width | Represents |
|-------|-------|------------|
| mobile-sm | 320px | iPhone SE, smallest supported Android |
| mobile-md | 375px | iPhone 14 standard — primary mobile target |
| mobile-lg | 414px | iPhone Plus / large Android |
| tablet | 768px | iPad portrait, standard tablet |
| desktop-sm | 1024px | Small laptop, iPad landscape |
| desktop-md | 1280px | Standard desktop / HD laptop |

**Rationale**: These six widths cover the full range of devices used with web applications in
Brazil. 375px is the most common mobile screen width and is the primary pass/fail threshold.

**Alternatives considered**: Testing at every 50px interval — rejected as disproportionate effort
with diminishing returns for a Tailwind-based layout.

## Pages & Components Under Audit

### Audit Matrix

| File | Key Responsive Concerns |
|------|------------------------|
| `app/login/page.tsx` | Form width, centering, input sizing on mobile |
| `app/(app)/layout.tsx` | Top nav visibility, MobileNav integration |
| `app/(app)/mobile-nav.tsx` | Icon-only tabs, active label below indicator |
| `app/(app)/nav-link.tsx` | Touch target size (≥44px) |
| `app/(app)/page.tsx` | Dashboard stats grid reflow, quick generate form |
| `app/(app)/checklists/layout.tsx` | Sidebar/content stacking on mobile vs side-by-side on tablet+ |
| `app/(app)/checklists/checklists-sidebar.tsx` | Scrollable sidebar, overflow handling |
| `app/(app)/checklists/new-checklist-form.tsx` | 4-mode tab icons on mobile, form inputs, file upload areas |
| `app/(app)/checklists/[id]/page.tsx` | Progress bar, category headers, item list |
| `app/(app)/checklists/[id]/add-item-form.tsx` | Inline form layout, button sizing |
| `app/(app)/checklists/[id]/toggle-item.tsx` | Checkbox touch target |

### High-Risk Areas

1. **`new-checklist-form.tsx`** — four tabs with different form layouts; tab icons vs. labels on
   mobile is an existing known behaviour (constitution Principle III). Risk: label overflow on
   smaller screens, file input areas not reflowing on mobile.

2. **`checklists/layout.tsx`** — sidebar + content pane. If `flex` is used without a `flex-wrap`
   or a `md:` breakpoint guard, the sidebar and content will compete for space on mobile.

3. **`mobile-nav.tsx`** — already implemented to show icons-only on mobile with active label
   below. Risk: tab widths not distributing evenly across very narrow screens (320px).

## Tailwind v4 Responsive Conventions

**Decision**: Use Tailwind v4 mobile-first breakpoint prefixes (`sm:`, `md:`, `lg:`) directly in
className strings. Custom properties in `app/globals.css` can be used for shared values.

**Tailwind v4 breakpoints** (defaults, CSS-first):

| Prefix | Min-width |
|--------|-----------|
| `sm:`  | 640px |
| `md:`  | 768px |
| `lg:`  | 1024px |
| `xl:`  | 1280px |

**Mapping to audit breakpoints**:
- 320px / 375px / 414px → base (no prefix) — mobile styles
- 768px → `md:` — tablet styles
- 1024px → `lg:` — desktop-sm styles
- 1280px → `xl:` — desktop-md styles

**Rationale**: Tailwind v4 ships with these breakpoints by default. No additional configuration
needed.

## Fix Methodology

1. Open the dev server (`npm run dev` → localhost:3001).
2. Open browser DevTools → Responsive mode.
3. For each file in the audit matrix, test at all six widths.
4. Record each defect as a task in `tasks.md` before fixing it.
5. Apply the fix using Tailwind responsive utility classes.
6. Verify the fix at the affected breakpoints and confirm no regression at other breakpoints.
7. Run `npm run lint` after each file is fixed.

## Out of Scope

- Cross-browser testing (only Chromium DevTools used for the audit)
- Landscape mobile orientation
- Accessibility audit (WCAG compliance)
- Dark mode responsiveness
- Animated transitions
