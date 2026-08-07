# Quickstart: Lesson Content Master List & Search

**Feature**: 007-lesson-content-list | **Phase 1 (mock, no backend)**

This guide shows how to build, run, and verify the feature locally. It assumes Node ≥ 24 and the
repo dependencies are installed (`npm install`).

## Build order (recommended)

1. **Mock data** — add `lessonContents` and `personalPlans` collections to
   `src/app/api/_mock-db.ts` (`_rows`, `_seed()`, `getList()`); seed ≥ 3 stores and ≥ 3 plans.
2. **Zod schemas** — create `src/app/api/_schemas/lesson-content.schema.ts` with
   `GetLessonContentsQuerySchema`, `GetLessonContentsResponseSchema`,
   `GetPersonalPlansQuerySchema`, `GetPersonalPlansResponseSchema`.
3. **Mock routes** — create `src/app/api/crm/lesson-contents/route.ts` and
   `src/app/api/crm/personal-plans/route.ts` (`registerRoute()` + `GET`), then add both imports to
   `src/app/api/_routes/index.ts`.
4. **Generate client** — `npm run generate-client` (or `npm run generate-api`) to regenerate
   `src/lib/api/types.gen.ts` and `react-query.gen.ts` (option-factories + query keys). Never edit
   `src/lib/api/` by hand. Components import the generated types from `types.gen.ts` directly — do
   not create local `.type.ts` view types.
5. **Filter hook** — create `src/app/(private)/lessons/_hooks/use-lessons-filters.ts` (nuqs;
   template = `members/_hooks/use-members-filters.ts`).
6. **Components** — build `lesson-table-columns.tsx`, `personal-table-columns.tsx`, the two table
   components, `lessons-toolbar.tsx`, `lessons-filters.tsx`, and `lessons-page-content.tsx`.
7. **Page** — create `src/app/(private)/lessons/page.tsx` (server) wrapping the client content in
   `<Suspense>`. The route auto-registers in `src/lib/routes/routes.config.ts`.

## Run

```bash
npm run dev
# open http://localhost:3000/lessons
```

## Manual verification (maps to spec Success Criteria)

| Step                                | Expected                                         | Spec                 |
| ----------------------------------- | ------------------------------------------------ | -------------------- |
| Open `/lessons`                     | Studio tab table renders without error           | SC-001               |
| Switch to Personal / Body care tabs | Each tab renders its own table                   | SC-002, FR-001-P1-10 |
| Type in search input                | Rows narrow by name/ID partial match (debounced) | SC-006, FR-001-P1-11 |
| Click a sortable column header      | Rows reorder; click again toggles asc/desc       | SC-007, FR-001-P1-12 |
| Click "Detailed Filter"             | Filter controls expand/collapse                  | SC-003, FR-001-P1-03 |
| Change a select filter              | Rows narrow to matching records                  | SC-008, FR-001-P1-13 |
| Toggle "Include deleted"            | Inactive/deleted rows appear                     | SC-004, FR-001-P1-04 |
| Click "Clear all"                   | Filters reset; full non-deleted list returns     | SC-003, FR-001-P1-05 |
| Click a row                         | Navigates to `/lessons/[id]`                     | SC-005               |
| Click "New Lesson Creation"         | Navigates to `/lessons/create`                   | SC-005, FR-001-P1-06 |
| First load                          | Skeleton loading state shows                     | SC-009, FR-001-P1-14 |
| Force API failure                   | Error state with retry shows                     | SC-009, FR-001-P1-15 |
| Empty filter result                 | Zero rows / empty state                          | Edge cases           |

## Quality gates (Definition of Done)

```bash
npm run lint        # 0 errors
npx tsc --noEmit    # exits 0
# contract tests for both new mock routes (happy path + error path)
```

## Notes

- Use `navigate()` from `@/lib/routes/routes.util` for all links — no raw `router.push` strings.
- Loading/error/empty via `DataStateBoundary`; tables via shared `DataTable` + `TablePagination`.
- All user-visible labels in Japanese; identifiers/comments in English.
- No `any`; no global state store; URL state via nuqs only.
