# Quickstart: Responsive Design Audit

## Prerequisites

- Node.js installed, `npm install` already run
- A valid `.env.local` with Supabase and Groq credentials (needed to log in and see real data)

## 1. Start the dev server

```bash
npm run dev
```

App runs at `http://localhost:3001`.

## 2. Open browser DevTools in Responsive mode

In Chrome or Edge:
1. Open DevTools (F12)
2. Click the "Toggle device toolbar" icon (or Ctrl+Shift+M)
3. Set width manually using the dimension input at the top

## 3. Audit each page at every breakpoint

Test at these widths in order: **320 → 375 → 414 → 768 → 1024 → 1280**

For each page:

| Page | URL path |
|------|----------|
| Login | `/login` |
| Dashboard | `/` |
| Checklist list | `/checklists` |
| New checklist form | `/checklists/new` |
| Single checklist | `/checklists/<any-id>` |

## 4. What to check at each breakpoint

- [ ] No horizontal scrollbar / no `overflow-x` scroll on `<body>`
- [ ] No content clipped or hidden outside the viewport
- [ ] No overlapping elements
- [ ] All buttons and links are reachable (not hidden behind other elements)
- [ ] Touch targets (buttons, links, checkboxes) appear at least 44px tall
- [ ] Text is legible (not smaller than ~14px equivalent)
- [ ] On mobile (≤414px): nav tabs show icons only; active tab label appears below the indicator
- [ ] On mobile (≤414px): sidebar stacks above content (not side-by-side)
- [ ] On tablet+ (≥768px): sidebar and content pane appear side-by-side

## 5. Record defects

For each defect found, note:

```
Page: <page name>
Viewport: <width>px
Component/file: <file path>
Description: <what is broken>
```

Add these to `tasks.md` before applying fixes.

## 6. Apply fixes

Edit the relevant `.tsx` file. Use Tailwind v4 responsive prefixes:

- Base (no prefix) = mobile
- `md:` = tablet (≥768px)
- `lg:` = desktop (≥1024px)

Common fix patterns:

```tsx
// Sidebar stacks on mobile, side-by-side on tablet+
<div className="flex flex-col md:flex-row">

// Element hidden on mobile, visible on tablet+
<div className="hidden md:block">

// Full width on mobile, fixed width on tablet+
<div className="w-full md:w-64">

// Icon-only tab on mobile, with label on tablet+
<span className="hidden md:inline">Label</span>
```

## 7. Verify the fix

After each fix:
1. Check the fixed breakpoint — defect resolved
2. Check adjacent breakpoints — no regression introduced
3. Run `npm run lint` — zero errors

## 8. Final verification

After all defects are fixed:

```bash
npm run lint      # zero errors
npm test          # zero failures
npm run build     # zero errors
npm run test:coverage  # ≥80% coverage
```

Open the app at each of the six breakpoints and confirm the audit checklist in
`checklists/requirements.md` passes.
