# Server Action Contracts: Checklist App

**Phase**: 1 — Design
**Date**: 2026-05-20
**Source**: `app/actions/checklists.ts`, `app/actions/auth.ts`

All mutations in this application go through Next.js Server Actions with `'use server'`. There
are no REST API endpoints for data mutations. The contracts below define the expected inputs,
outputs, and error conditions for each action.

---

## `generateChecklist`

**Purpose**: Generate a categorized checklist from a natural-language prompt using the AI service.

**Input**:
| Parameter | Type | Validation |
|-----------|------|------------|
| prompt | string | Non-empty; submitted as form data |

**Pre-conditions**:
- User must be authenticated (action reads session via SSR Supabase client)
- User must not have exceeded 20 AI/extraction checklists in the past hour

**Output** (success):
- Inserts one row into `checklists` and N rows into `checklist_items`
- Redirects to the new checklist's detail page

**Output** (error):
| Condition | Behavior |
|-----------|----------|
| Rate limit exceeded | Returns user-facing error message; no DB write |
| AI service unavailable / parse failure | Returns user-facing error message; no DB write |
| Unauthenticated | Redirects to login |

---

## `generateFromExtraction`

**Purpose**: Generate a categorized checklist from text extracted from a user-uploaded document.

**Input**:
| Parameter | Type | Validation |
|-----------|------|------------|
| extractedText | string | Non-empty; truncated to 16,000 chars client-side before submission |

**Pre-conditions**:
- User must be authenticated
- User must not have exceeded 20 AI/extraction checklists in the past hour

**Output** (success): Same as `generateChecklist`.

**Output** (error): Same as `generateChecklist`.

---

## `createFromSpreadsheet`

**Purpose**: Create a checklist by mapping spreadsheet rows to checklist items.

**Input**:
| Parameter | Type | Validation |
|-----------|------|------------|
| title | string | Non-empty |
| items | array of `{ text: string; category?: string }` | At least one item |

**Pre-conditions**:
- User must be authenticated
- Not subject to rate limiting

**Output** (success):
- Inserts one `checklists` row and N `checklist_items` rows
- Redirects to the new checklist's detail page

**Output** (error):
| Condition | Behavior |
|-----------|----------|
| Empty item array | Returns user-facing validation error |
| Unauthenticated | Redirects to login |

---

## `createManualChecklist`

**Purpose**: Create a checklist from items entered directly by the user.

**Input**:
| Parameter | Type | Validation |
|-----------|------|------------|
| title | string | Non-empty |
| items | array of `{ text: string; category?: string }` | At least one item |

**Pre-conditions**:
- User must be authenticated
- Not subject to rate limiting

**Output** (success): Same as `createFromSpreadsheet`.

**Output** (error): Same as `createFromSpreadsheet`.

---

## `toggleChecklistItem`

**Purpose**: Toggle the checked/unchecked state of a single checklist item.

**Input**:
| Parameter | Type | Validation |
|-----------|------|------------|
| itemId | UUID | Must reference an item owned by the current user |
| checked | boolean | New state |

**Pre-conditions**:
- User must be authenticated
- Item must belong to the authenticated user (enforced by RLS)

**Output** (success):
- Updates `checklist_items.checked` for the given item
- Triggers Next.js cache revalidation for the checklist page

**Output** (error):
| Condition | Behavior |
|-----------|----------|
| Item not found / not owned by user | RLS rejects the UPDATE; returns error |
| Unauthenticated | Redirects to login |

---

## `signOut` (auth)

**Purpose**: Sign out the current user and invalidate the session.

**Input**: None (reads session from cookie)

**Output**: Redirects to `/login`
