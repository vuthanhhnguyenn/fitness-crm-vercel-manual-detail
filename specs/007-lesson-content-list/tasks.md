# Tasks: FR-001 Lesson Content Master List & Search (D-02)

**Input**: Design documents from `/specs/007-lesson-content-list/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Contract tests ARE requested for this feature (plan.md "Testing: Contract tests for each mock route (happy path + ≥1 error path)" and the Definition of Done in both contract files). Contract test tasks are therefore included in the Foundational phase, alongside the mock routes they verify.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Next.js 16 App Router web app. Feature page colocated under `src/app/(private)/lessons/`; Phase 1 mock API under `src/app/api/crm/`. Generated client at `src/lib/api/` (never hand-edited).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the colocated folder structure and shared constants for the `/lessons` feature.

- [ ] T001 Create the lessons route folder structure: `src/app/(private)/lessons/_components/`, `src/app/(private)/lessons/_hooks/`, and `src/app/(private)/lessons/_constants/` (empty dirs / placeholder ready for files below)
- [ ] T002 [P] Create `src/app/(private)/lessons/_constants/constants.ts` with tab keys (`studio` | `personal` | `bodycare`), Japanese label maps for status / brand / pricing_type / gender_restriction / category / lesson_category, sortable column keys per table, and the default page size (import from `@/constants/app.constants` per research.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Stand up the Phase 1 mock data layer, schemas, routes, regenerated client, and the shared nuqs filter hook. ALL user stories depend on this phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete (data fetching and URL state are shared by US1, US2, and US3).

- [ ] T003 Enrich `src/app/api/_mock-db.ts` with two new collections — `lessonContents` (studio + body care rows: `id`, `name`, `brand`, `duration`, `pricing_type`, `status`, `gender_restriction`, `lesson_category`, `category`, `store_id`, `is_deleted`, optional `reservation_count` / `max_reservation_count`) and `personalPlans` (`id`, `name`, `description`, `category`, `duration`, `price`, `reservations`, `max_reservations`, `brand`, `status`, `store_id`, `is_deleted`). Each exposes `_rows`, `_seed()`, `getList()`. Seed ≥ 3 stores and ≥ 3 plans, including some `inactive`/`is_deleted` rows (Principle II / data-model.md)
- [ ] T004 Create `src/app/api/_schemas/lesson-content.schema.ts` with Zod schemas: `GetLessonContentsQuerySchema`, `GetLessonContentsResponseSchema`, `GetPersonalPlansQuerySchema`, `GetPersonalPlansResponseSchema` (use `z.preprocess` for array params, `z.coerce.number` for `page`/`limit` with max 50, `z.enum(...).default(...)` for `sort_by`/`sort_order`, `include_deleted` boolean — per both contract files and the `crm/members` pattern)
- [ ] T005 [P] Create `src/app/api/crm/lesson-contents/route.ts` — `registerRoute()` + `GET` handler serving studio + body care rows; filter order store scope → `kind` → search → detailed filters → include-deleted → sort → paginate; return `{ data, pagination }`; 400 on invalid query (contract `get-lesson-contents.md`)
- [ ] T006 [P] Create `src/app/api/crm/personal-plans/route.ts` — `registerRoute()` + `GET` handler for personal plans with the same filter/sort/paginate behavior and 400 validation (contract `get-personal-plans.md`)
- [ ] T007 Register the two new routes in `src/app/api/_routes/index.ts` by importing `crm/lesson-contents/route` and `crm/personal-plans/route` (depends on T005, T006)
- [ ] T008 Run `npm run generate-client` to regenerate `src/lib/api/types.gen.ts` and `src/lib/api/@tanstack/react-query.gen.ts` (option-factories + query keys); verify the new `getLessonContents` / `getPersonalPlans` types and hooks are emitted — do not hand-edit `src/lib/api/` (depends on T004–T007)
- [ ] T009 [P] Contract test for `GET /api/crm/lesson-contents` covering happy path (`kind=studio`, default sort, page 1), search by partial name/ID, `brand`/`status`/`lesson_category` filters + `include_deleted` revealing inactive rows, `sort_by=name&sort_order=desc`, and 400 on invalid `sort_by`/`limit=999`
- [ ] T010 [P] Contract test for `GET /api/crm/personal-plans` covering happy path, search by partial name/ID, `category`/`brand`/`status` filters + `include_deleted`, `sort_by=price&sort_order=desc`, and 400 on invalid query
- [ ] T011 Create `src/app/(private)/lessons/_hooks/use-lessons-filters.ts` — nuqs `useQueryStates` for `tab`, `search`, `lesson_category`, `category`, `brand`, `status`, `include_deleted`, `store_id`, `sort_by`, `sort_order`, `page` with defaults from data-model.md, plus `clearFilters()` (resets all except `tab`) and `hasActiveFilters` (template: `src/app/(private)/members/_hooks/use-members-filters.ts`)

**Checkpoint**: Mock endpoints return seeded data, client hooks are generated, and shared URL state exists — user stories can now begin.

---

## Phase 3: User Story 1 - View lesson master list by tab (Priority: P1) 🎯 MVP

**Goal**: Render tab-separated lesson master lists (Studio / Personal / Body care), each in its own table with loading/error/empty states, and navigate from a row to the lesson detail screen.

**Independent Test**: Open `/lessons`, confirm the Studio table renders, switch tabs to see each table's content, and click a row to navigate to `/lessons/[id]`.

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create `src/app/(private)/lessons/_components/lesson-table-columns.tsx` — `ColumnDef[]` for studio/body care (ID, name, brand, duration, pricing_type, status, gender_restriction) using label maps from `_constants/constants.ts`, with sortable-header buttons wired for US2
- [ ] T013 [P] [US1] Create `src/app/(private)/lessons/_components/personal-table-columns.tsx` — `ColumnDef[]` for personal plans (ID, name, category, duration, price, reservations/max_reservations, brand, status) with sortable headers
- [ ] T014 [US1] Create `src/app/(private)/lessons/_components/lesson-table.tsx` — `'use client'` table for studio/body care: `useQuery` via generated `getLessonContents` option-factory (keyed by filter state + `kind`), shared `DataTable` + `TablePagination`, wrapped in `DataStateBoundary` (skeleton on loading per FR-001-P1-14, shared `<Error onRetry />` per FR-001-P1-15, zero-row empty state) (depends on T012)
- [ ] T015 [US1] Create `src/app/(private)/lessons/_components/personal-training-table.tsx` — `'use client'` table for the personal tab using the `getPersonalPlans` option-factory, same DataTable + DataStateBoundary composition (depends on T013)
- [ ] T016 [US1] Create `src/app/(private)/lessons/_components/lessons-page-content.tsx` — `'use client'` shadcn line-style `Tabs/TabsList/TabsTrigger/TabsContent` bound to the `tab` nuqs param; Studio + Body care render `LessonTable` (with `kind`), Personal renders `PersonalTrainingTable`; page header with title (レッスン内容管理) and total count (depends on T014, T015)
- [ ] T017 [US1] Create `src/app/(private)/lessons/page.tsx` — server route rendering `<Suspense fallback={<skeleton/>}>` around `LessonsPageContent`; confirm `/lessons` auto-registers in `src/lib/routes/routes.config.ts` (depends on T016)
- [ ] T018 [US1] Wire row-click navigation to the lesson detail route using `navigate()` from `@/lib/routes/routes.util` (`/lessons/[id]`) in both table components (depends on T014, T015)

**Checkpoint**: `/lessons` renders all three tabs with seeded data, loading/error/empty states work, and rows navigate to detail. MVP is functional.

---

## Phase 4: User Story 2 - Search, sort, and filter the list (Priority: P1)

**Goal**: Add the active toolbar — debounced text search (name/ID partial match), expandable detailed filters (lesson category / category / brand / status), "Include deleted" toggle, "Clear all", and ascending/descending column sorting — all driving the mock queries.

**Independent Test**: Type a query to narrow rows, click a column header to sort (toggle asc/desc), expand detailed filters and change selects to narrow rows, toggle "Include deleted" to reveal inactive rows, and click "Clear all" to reset.

### Implementation for User Story 2

- [ ] T019 [US2] Create `src/app/(private)/lessons/_components/lessons-toolbar.tsx` — search `Input` (debounced ~500 ms, writes `search` via the filter hook) plus a "Detailed Filter" toggle button controlling the filter panel's expanded state (FR-001-P1-03, FR-001-P1-11)
- [ ] T020 [US2] Create `src/app/(private)/lessons/_components/lessons-filters.tsx` — expandable shadcn `Select` controls for lesson_category / category / brand / status (using label maps), an "Include deleted" `Checkbox`, and a "Clear all" button calling `clearFilters()`; show/respect `hasActiveFilters` (FR-001-P1-04, FR-001-P1-05, FR-001-P1-13)
- [ ] T021 [US2] Ensure `search`, `lesson_category`, `category`, `brand`, `status`, `include_deleted`, and `store_id` from the filter hook are passed as query params into the `getLessonContents` / `getPersonalPlans` queries in `lesson-table.tsx` and `personal-training-table.tsx`, resetting `page` to 1 on filter change (depends on T019, T020)
- [ ] T022 [US2] Wire sortable column headers to actual sorting via DataTable `tableOptions` (`manualSorting`, `onSortingChange`, `state.sorting`) mapped to `sort_by`/`sort_order` nuqs params, toggling asc/desc, in both table components and their column defs (FR-001-P1-12, depends on T012, T013)
- [ ] T023 [US2] Integrate `LessonsToolbar` + `LessonsFilters` into `lessons-page-content.tsx` above the active tab's table, sharing the expanded/collapsed state (depends on T019, T020)

**Checkpoint**: Search, sort, filter, include-deleted, and clear-all all actively change the rendered rows across tabs.

---

## Phase 5: User Story 3 - Start creating a new lesson master (Priority: P2)

**Goal**: Provide the page-header "New Lesson Creation" action that navigates to the lesson creation screen.

**Independent Test**: Click "New Lesson Creation" in the page header and verify navigation to `/lessons/create`.

### Implementation for User Story 3

- [ ] T024 [US3] Add the "New Lesson Creation" (新規レッスン作成) primary action button to the page header in `src/app/(private)/lessons/_components/lessons-page-content.tsx`, navigating to `/lessons/create` via `navigate()` from `@/lib/routes/routes.util` (FR-001-P1-06)

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and final validation across all stories.

- [ ] T025 [P] Run `npm run lint` and resolve all errors across the new `lessons/` and `api/` files
- [ ] T026 [P] Run `npx tsc --noEmit` and resolve all type errors (no `any`; components consume generated `types.gen.ts` directly)
- [ ] T027 Execute `quickstart.md` manual verification table (SC-001 … SC-009) against `npm run dev` at `http://localhost:3000/lessons`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational completion.
  - US1 (P1) and US2 (P1) both consume the same tables/hook; US2 builds on US1's table components.
  - US3 (P2) edits the page-content header introduced in US1.
- **Polish (Phase 6)**: Depends on all desired user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational. The MVP — tables, tabs, page, detail navigation.
- **US2 (P1)**: Starts after Foundational; reuses US1's table components (T012–T015) for sorting/filter wiring. Toolbar/filter files (T019, T020) are independent and can start in parallel with US1.
- **US3 (P2)**: Starts after US1 (edits `lessons-page-content.tsx`).

### Within Each User Story

- Column defs before tables; tables before page-content; page-content before page.
- Foundational schemas/routes before `generate-client`; `generate-client` before any component query.

### Parallel Opportunities

- T002 (constants) can run alongside Phase 1.
- T005 and T006 (the two route files) are parallel; T009 and T010 (contract tests) are parallel.
- T012 and T013 (column defs) are parallel.
- T019 and T020 (toolbar / filters files) are parallel and can begin during US1.
- T025 and T026 (lint / tsc) are parallel.

---

## Parallel Example: Foundational mock routes

```bash
# After T003 (mock db) + T004 (schemas):
Task: "Create src/app/api/crm/lesson-contents/route.ts"      # T005
Task: "Create src/app/api/crm/personal-plans/route.ts"        # T006

# After T008 (generate-client):
Task: "Contract test for GET /api/crm/lesson-contents"        # T009
Task: "Contract test for GET /api/crm/personal-plans"         # T010
```

## Parallel Example: User Story 1 column defs

```bash
Task: "Create lesson-table-columns.tsx"      # T012
Task: "Create personal-table-columns.tsx"    # T013
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (mock data, schemas, routes, generate-client, filter hook).
3. Complete Phase 3: User Story 1 (tabs + tables + detail navigation).
4. **STOP and VALIDATE**: Open `/lessons`, switch tabs, click a row → detail.
5. Demo the list MVP.

### Incremental Delivery

1. Setup + Foundational → data layer ready.
2. US1 → tabbed lists + navigation (MVP).
3. US2 → active search / sort / filter / include-deleted / clear-all.
4. US3 → "New Lesson Creation" entry point.
5. Polish → lint, tsc, quickstart validation.

---

## Notes

- [P] tasks = different files, no dependencies.
- All user-visible labels in Japanese; identifiers/comments in English.
- Use `navigate()` from `@/lib/routes/routes.util` for all links — no raw `router.push` strings.
- Loading/error/empty via `DataStateBoundary`; tables via shared `DataTable` + `TablePagination`.
- No `any`; no global state store; URL state via nuqs only.
- Never hand-edit `src/lib/api/` — regenerate via `npm run generate-client`.
