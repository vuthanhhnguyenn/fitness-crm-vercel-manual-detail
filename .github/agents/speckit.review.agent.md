---
description: Post-implementation review agent — audits implemented code against project constitution and coding rules, then compares UI against the fitness-crm-ui prototype and fixes all violations.
---

## User Input

```text
$ARGUMENTS
```

If `$ARGUMENTS` is non-empty, treat it as a hint about which files or feature to review (e.g. a path, a feature name, or a spec ID). Use it to scope the review. If empty, review all files changed since the last commit.

---

## Scope Detection

Determine which files to review:

1. If `$ARGUMENTS` specifies a path or feature name → review those files.
2. Otherwise, detect changed files since the last commit:
   ```bash
   git diff --name-only HEAD
   ```
   If the working tree is clean (no unstaged changes), use:
   ```bash
   git diff --name-only HEAD~1 HEAD
   ```
3. Filter to source files under `src/` only. Ignore generated files (`src/lib/api/`).

---

## Phase 1 — Code Review

### 1.1 Load Rule Sources

Read all of the following files in full before building the checklist:

- `.specify/memory/constitution.md`
- `.cursor/rules/cursor-project-rules.mdc`
- `.cursor/rules/ui-rule.mdc`
- `.cursor/rules/form-rule.mdc`
- `.cursor/rules/call-api-rule.mdc`

### 1.2 Build and Evaluate Checklist

For each scoped file, check the following items. Mark each ✅ (pass) or ❌ (fail) after inspection.

```
## Code Review Checklist — <filename>

### I. Type Safety
- [ ] No `any` in production source (except generated `src/lib/api/`)
- [ ] All props typed via TypeScript interfaces or Zod-inferred types
- [ ] API types sourced exclusively from generated `types.gen.ts`
- [ ] Zod schemas co-located in `_schemas/[name].schema.ts`, not inline

### II. Component & UI
- [ ] Only shadcn primitives (`src/components/ui/`) or composites (`src/components/common/`)
- [ ] No raw hex / rgba / oklch / hsl color values in component files
- [ ] Colors reference CSS variables from `globals.css` or `tailwind.theme.css`
- [ ] All icons from `lucide-react` only (no other icon libraries)
- [ ] Responsive layout supports min-width 768px
- [ ] Date inputs use `Datepicker` component (no `<input type="date">`)
- [ ] Tables: `data-table` for stateful, shadcn `table` primitives for static-only
- [ ] Pages with API fetching wrapped in `DataStateBoundary`
- [ ] Loading states use skeleton placeholders matching the content shape
- [ ] Error states expose a user-visible recovery action (e.g. retry / refetch)

### III. Server State
- [ ] Data fetching via generated hooks from `src/lib/api/@tanstack/react-query.gen`
- [ ] `useQuery` for fetches, `useInfiniteQuery` for paginated lists, `useMutation` for writes
- [ ] No direct `fetch()` or third-party HTTP calls in components / hooks
- [ ] Query keys derived from generated option-factory helpers (no hand-crafted string keys)
- [ ] No Jotai / Zustand / Redux or any global state store
- [ ] Persistent cross-component state uses `nuqs` (URL search params)

### IV. Forms
- [ ] `react-hook-form` + `@hookform/resolvers/zod` for all multi-field forms
- [ ] Zod schema in dedicated `_schemas/[name].schema.ts` file
- [ ] Text inputs enforce `maxLength={TEXT_MAX_LENGTH}` (255)
- [ ] Textareas enforce `maxLength={TEXTAREA_MAX_LENGTH}` (1000)

### V. File & Routing Conventions
- [ ] File suffixes correct: `.type.ts` / `.hook.ts` / `.util.ts` / `.schema.ts` / `-context.tsx`
- [ ] Navigation via `navigate()` from `@/lib/routes/routes.util` (no raw `router.push()`)
- [ ] New routes declared in `src/lib/routes/routes.config.ts`
- [ ] `'use client'` only when component genuinely needs browser APIs / DOM events / hooks
- [ ] Images use `next/image` with explicit `width`/`height` or `fill` + `sizes` (no bare `<img>`)
- [ ] Date logic uses `date-fns` only (no moment / dayjs / luxon)

### VI. Import Order
- [ ] react → next → third-party → @/hooks → @/components → @/lib → @/types → relative
```

### 1.3 Fix Violations

For each ❌ item:

1. Locate the file and exact line(s) violating the rule.
2. Apply the minimal fix that brings the code into compliance.
3. Mark the item ✅ after fixing.
4. If a violation cannot be fixed without breaking functionality, add an inline comment:
   ```
   // TODO(CONSTITUTION-<PRINCIPLE>): <reason> — follow-up issue required
   ```

Do **not** refactor compliant code. Touch only the violations.

---

## Phase 2 — UI Review

### 2.1 Ensure Prototype Cache is Available

The prototype repository is cached at `.cache/fitness-crm-ui`.

Check if the cache exists:

```bash
ls .cache/fitness-crm-ui 2>/dev/null || echo "MISSING"
```

If missing or stale, refresh it:

```bash
# Clone (first time)
git clone git@github.com:dx-fitness/fitness-crm-ui.git .cache/fitness-crm-ui

# Or fetch latest (subsequent runs)
git -C .cache/fitness-crm-ui fetch --all --prune
git -C .cache/fitness-crm-ui checkout --detach origin/main
```

### 2.2 Map CRM Files to Prototype Pages

For each page or component in scope, locate the prototype equivalent:

1. List all prototype pages:

   ```bash
   git -C .cache/fitness-crm-ui ls-files src/pages/
   ```

2. Use the spec registry to map spec IDs → page files:

   ```bash
   git -C .cache/fitness-crm-ui show HEAD:src/data/requirements.ts
   ```

3. Apply the mapping heuristic:

   | CRM file                               | Prototype search strategy                           |
   | -------------------------------------- | --------------------------------------------------- |
   | `src/app/(private)/<feature>/page.tsx` | Match `<feature>` keyword in `src/pages/` filenames |
   | `src/components/<name>/`               | Match in `src/components/` by name                  |

   Example: `src/app/(private)/members/page.tsx` → `src/pages/member-list.tsx`

4. Read the matched prototype file:
   ```bash
   git -C .cache/fitness-crm-ui show HEAD:<relative-path>
   ```

### 2.3 Build and Evaluate UI Checklist

For each CRM page mapped to a prototype page, produce:

```
## UI Comparison Checklist
Prototype : <prototype-file-path>
CRM file  : <crm-file-path>

### Layout & Structure
- [ ] Page-level layout (header, content area, action bar) matches prototype
- [ ] Section order (filters → table/list → pagination) matches prototype

### Components & Props
For each major shadcn component in the prototype, verify the CRM uses the same component with equivalent props:
- [ ] <ComponentName> variant / size matches prototype
- [ ] (repeat per component)

### Table / List
- [ ] Column count and column labels match prototype
- [ ] Sort indicators present where prototype shows them
- [ ] Row actions (edit / delete / view) match prototype in type and placement

### Filters & Search
- [ ] Filter controls match prototype (dropdowns, date pickers, search input)
- [ ] Filter layout (inline vs. collapsible panel) matches prototype

### Actions & Buttons
- [ ] Primary action button label, variant (`default` / `destructive` / `outline` etc.), and placement match prototype
- [ ] Secondary / destructive actions styled consistently with prototype

### Empty & Loading States
- [ ] Empty-state copy and layout match prototype
- [ ] Skeleton shape matches the loaded content dimensions

### Typography & Spacing
- [ ] Heading levels and text-size classes consistent with prototype
- [ ] Gap / padding values produce equivalent visual density
```

### 2.4 Fix UI Discrepancies

For each ❌ UI item:

1. Read the relevant prototype component to understand exact shadcn props / variants.
2. Update the CRM component to match — **visual output only**.
3. Preserve all CRM-specific logic (API calls, state, routing, form handling).
4. Do **not** copy prototype patterns that violate the project constitution (e.g. direct fetch, global state).
5. Mark the item ✅ after fixing.

---

## Completion Report

After both phases are done, output:

```
## Review & Fix — Summary

### Phase 1 — Code Review
✅ Passed  : <N> items
🔧 Fixed   : <N> items (list each: file:line — rule violated — fix applied)
⚠️  Deferred: <N> items (list each with TODO comment reference)

### Phase 2 — UI Review
Prototype  : <file>
CRM file   : <file>
✅ Matched : <N> items
🔧 Fixed   : <N> items (list each: element — what changed)
⚠️  Deviation: <N> items (list each with justification)
```
