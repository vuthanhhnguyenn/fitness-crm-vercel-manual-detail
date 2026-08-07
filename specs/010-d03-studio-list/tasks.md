# Tasks: D-03 Studio Management — FR-001 Studio List Display

**Input**: Design documents from `specs/010-d03-studio-list/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/✅ quickstart.md ✅
**Branch**: `010-d03-studio-list`
**Route**: `/studios`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies between them)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every task description

---

## Phase 1: Setup — Schemas & Seed Data

**Purpose**: Define all data shapes and populate mock DB. Must complete before any API or UI work.

- [x] T001 [P] Create `src/app/api/_schemas/studio.schema.ts` — export `StudioTypeSchema` (enum `studio-lesson`/`pt`/`body-care`), `BrandSchema` (JOYFIT/JOYFIT24/JOYFIT_YOGA/JOYFIT_PLUS/FIT365), `StudioStatusSchema`, `StudioListItemSchema`, `StudioListResponseSchema`, `GetStudiosQuerySchema` (page, limit ∈ {25,50,100,200}, search, store_id, studio_type, brand, status, sort_by ∈ {id,name,store_name,studio_type,capacity}, sort_order) with Zod defaults per data-model.md
- [x] T002 Add `studios: Studio[]` seed data to `src/app/api/_mock-db.ts` — ≥9 studios across ≥3 stores (Shibuya/Shinjuku/Ikebukuro), all 3 studio types, ≥2 brands, both active/inactive statuses; add `db.studios.list(query, role, userStoreIds)` method with role-based scoping, search/filter/sort/pagination logic per data-model.md mock data requirements

**Checkpoint**: Schemas compile, mock DB exports `studios.list()` with correct filtering

---

## Phase 2: Foundational — Mock API & Hooks & Page Shell

**Purpose**: Wire the data pipeline (Route Handler → nuqs state → page) before any UI component work begins. All user stories depend on this phase.

- [x] T003 Create `src/app/api/crm/studios/route.ts` — `GET` handler: parse & validate query via `GetStudiosQuerySchema`, get current user role & store IDs from auth, call `db.studios.list(query, role, storeIds)`, return `StudioListResponse`; error handling for 400 (invalid params), 401 (unauthenticated), 500 per contracts/studio-api.md
- [x] T004 [P] Create `src/hooks/useStudioList.ts` — `'use client'` hook wrapping `nuqs` `useQueryStates` with `parseAsString`/`parseAsInteger` for: `search`, `store_id`, `studio_type`, `brand`, `status`, `sort_by` (default `id`), `sort_order` (default `asc`), `page` (default `1`), `limit` (default `50`); include `resetFilters()` helper that clears all filter/search params and resets page to 1 per research.md Decision 1
- [x] T005 [P] Create `src/lib/utils/studio-permissions.ts` — export `canPerformAction(role: StaffRole, action: 'view' | 'edit' | 'delete'): boolean` mapping: system/hq/manager → all actions, staff → view+edit, trainer/observer → view only; export `canRegister(role: StaffRole): boolean` for new-registration button visibility per FR-001-09/FR-001-10
- [x] T006 Create `src/app/(private)/studios/page.tsx` — page shell: `<Suspense>` wrapping a `<StudioListSection />` component (referenced but implemented in Phase 3)

**Checkpoint**: `GET /api/crm/studios` returns correct data scoped by role. Route `/studios` resolves in browser.

---

## Phase 3: User Story 1 — Browse Studio List (P1) 🎯 MVP

**Goal**: Authorized user opens the page and sees a paginated, sortable table of studios scoped to their role, with `DataStateBoundary` for loading/error/empty and row click navigation.

**Independent Test**: Load `/studios` as Headquarter → table renders all 8 columns (Studio ID, Name, Store, Type, Capacity, Available Hours, Brand, Status) with all mock studios → sort by Name ascending/descending → click page 2 → row click navigates to detail stub.

- [ ] T007 [P] [US1] Create `src/components/crm/studio-list/studio-list-table.tsx` — `'use client'` component: shadcn `<Table>` with 8 columns (ID / スタジオ名 / 店舗名 / 区分 / 定員 / 利用時間 / ブランド / ステータス); sortable columns render sort indicator via `onSort(field)` prop; status column uses `<Badge>` with active=green/inactive=gray; BrandBadge for brand; type badge for studio type
- [ ] T009 [US1] Create `src/app/(private)/studios/_components/studio-list-section.tsx` — `'use client'` section component: `useQuery` fetching `GET /api/crm/studios` via `queryFn`; `DataStateBoundary` wrapping `DataTable` from common components; `PageHeader` with count badge and `RoleGatedButton` for "新規スタジオ登録"; `navigate()` for routes; `TablePagination` from common; row click navigates to detail stub (FR-003); search + filter toggle in same header row per prototype layout

**Checkpoint (US1 complete)**: Page at `/studios` renders table with all mock records, sort works, pagination navigates, `DataStateBoundary` shows skeleton on load and empty state when no results.

---

## Phase 4: User Story 2 — Search Studios by Name (P2)

**Goal**: User can type a partial studio name and see real-time filtered results; clearing search restores full list.

**Independent Test**: Type "studio" in search → only matching rows shown → clear input → full list restored → search term matching zero studios → empty-state appears with "条件をクリア" button.

- [ ] T011 [P] [US2] Create `src/components/crm/studio-list/studio-search.tsx` — `<Input>` with `<Search>` icon from lucide-react, placeholder `スタジオ名を検索`; debounce 300ms via `useDebounce` hook; bound to `search` param from `useStudioList` via `onSearch(value)` callback; resets `page` to 1 on search change
- [ ] T012 [US2] Integrate search into `src/app/(private)/studios/_components/studio-list-section.tsx` — render `<StudioSearch>` in the toolbar row alongside filter toggle; wire `search` state from `useStudioList`; `DataStateBoundary` handles empty state when no results match

**Checkpoint (US2 complete)**: Search input renders at top of page; typing filters table in real-time; empty state shows for no matches; clearing restores full list.

---

## Phase 5: User Story 3 — Filter Studio List (P2)

**Goal**: User can expand filter panel and select store, type, brand, and/or status to narrow results; clear button resets all filters simultaneously.

**Independent Test**: Open filter panel → select store=渋谷店 → only Shibuya studios visible → add type=pt → only PT studios in Shibuya → clear filters → full list restored → select brand=JOYFIT+status=inactive → only inactive JOYFIT studios visible.

- [ ] T013 [P] [US3] Create `src/components/crm/studio-list/studio-filters.tsx` — `'use client'` component with toggle button (`フィルター` + `<SlidersHorizontal>` icon); collapsible panel with 4 `<Select>` controls: 店舗 (Store — single-select, options from `storeOptions` prop), 区分 (Type — `studio-lesson`/`pt`/`body-care` with Japanese labels), ブランド (Brand — all brand enum values), ステータス (Status — `active`/`inactive`/empty for all); `すべてクリア` ghost button resets all 4 filters; filter values bound via `useStudioList` state; panel collapse state managed via local `useState` per research.md filter panel decision
- [ ] T014 [US3] Integrate filters into `src/app/(private)/studios/_components/studio-list-section.tsx` — render `<StudioFilters>` below search+toggle row; wire filter state from `useStudioList`; show active filter count badge on filter toggle button when any filter is non-empty; pass pre-scoped store options to filter component

**Checkpoint (US3 complete)**: Filter panel toggles open/closed; each filter independently narrows results; filters combine with AND logic; clear button resets all filters; active filter count badge appears on toggle.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Sidebar navigation, type safety, lint hygiene.

- [x] T015 [P] Add `スタジオ管理` navigation item to sidebar — insert `{ label: 'スタジオ管理', icon: Building2, href: '/studios' }` in the appropriate section of the sidebar menu; import `Building2` from `lucide-react`
- [ ] T016 Run `npm run type-check` from repo root and fix all TypeScript errors (zero errors required before PR)
- [ ] T017 Run `npm run lint` from repo root and fix all ESLint errors (zero errors required before PR)

**Checkpoint**: `tsc --noEmit` exits 0, `eslint` exits 0. Page navigates from sidebar. All 3 user stories verified end-to-end.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — T001 and T002 can start in parallel
- **Phase 2 (Foundational)**: T001 must complete before T003 (route needs schema); T002 must complete before T003; T004 has no data dependencies — can start alongside T003
- **Phase 3 (US1)**: Depends on T003+T004+T006 — all foundational tasks must be done
- **Phase 4 (US2)**: T011 is independent (new file); T012 extends `studio-list-section.tsx` from T009 — must wait for T009
- **Phase 5 (US3)**: T013 is independent (new file); T014 extends `studio-list-section.tsx` from T009 — must wait for T009
- **Phase 6 (Polish)**: T015 independent; T016/T017 run last after all implementation

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 1 + Phase 2 completion
- **US2 (P2)**: Depends on US1 (extends `studio-list-section.tsx`)
- **US3 (P2)**: Depends on US1 (extends `studio-list-section.tsx`)
- **US2 and US3 are independent of each other** — can be built in parallel

### Within Each User Story

- T007 (table) is independent
- T009 (section integration) depends on T007+T004 (hook)
- T011 (search component) is independent — can start before US1 if schema and hook are done
- T013 (filters component) is independent — can start before US1 if schema and hook are done

### Parallel Opportunities

| Group             | Parallel tasks                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Phase 1 start     | T001, T002 (different files)                                                             |
| Phase 2 start     | T003, T004 after T001+T002                                                               |
| Phase 3 start     | T007 (table) is independent; T009 follows T007+T004                                      |
| Phase 4 + Phase 5 | T011 (search) and T013 (filters) can start as soon as schemas done — parallel to Phase 3 |
| Phase 6 start     | T015 (sidebar) can start in parallel to Phase 3–5                                        |

---

## Parallel Execution Example: Phase 2

```
# Once T001+T002 complete:
Task A: T003 — studios/route.ts (mock handler)
Task B: T004 — useStudioList.ts (nuqs hook) [P]
Task C: T005 — studio-permissions.ts (role checks) [P]
# T006 follows T005 (needs canRegister)
```

## Parallel Execution Example: Phase 3

```
# Once T003+T004+T006 complete:
Task A: T007 — studio-list-table.tsx
# T009 follows (integrates into page with DataStateBoundary + DataTable)
```

---

## Implementation Strategy

### MVP First (US1 Only — Phases 1–3)

1. Complete Phase 1: Schemas + Seed data
2. Complete Phase 2: Mock API + hook + page shell
3. Complete Phase 3 (US1): Table + section integration with DataStateBoundary
4. **STOP and VALIDATE**: Open `/studios` → table renders → sort works → pagination works → DataStateBoundary handles loading/empty states → row click navigates to detail stub
5. Demo-ready minimal studio list without search/filter

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ✅
2. Phase 3 (US1) → Basic studio list ✅ — staff can browse and navigate
3. Phase 4 (US2) → Search ✅ — staff can find studios by name
4. Phase 5 (US3) → Filters ✅ — staff can narrow by store/type/brand/status
5. Phase 6 (Polish) → Sidebar nav + type/lint clean ✅ — production ready

---

## Task Summary

| Phase                  | Tasks      | Parallel?                           | Story |
| ---------------------- | ---------- | ----------------------------------- | ----- |
| Phase 1 — Setup        | T001–T002  | T001, T002 in parallel              | —     |
| Phase 2 — Foundational | T003–T006  | T004 independent                    | —     |
| Phase 3 — US1 (P1) 🎯  | T007, T009 | T007 independent; T009 follows      | US1   |
| Phase 4 — US2 (P2)     | T011–T012  | T011 independent; T012 after T009   | US2   |
| Phase 5 — US3 (P2)     | T013–T014  | T013 independent; T014 after T009   | US3   |
| Phase 6 — Polish       | T015–T017  | T015 parallel; T016/T017 sequential | —     |

**Total tasks**: 15
**MVP scope**: T001–T009 (9 tasks, Phases 1–3)

---

## Notes

- `[P]` tasks touch different files with no blocking dependencies — safe to run concurrently
- All `[US1]` / `[US2]` / `[US3]` tasks are traceable to spec.md user stories
- US2 and US3 extend `studio-list-section.tsx` created in T010 — they are independent of each other and can run in parallel
- Phase 2 hint: run `npm run generate-routes` after T006 so `/crm/studios` route resolves
- Phase 2 migration: when DEV-BE publishes OpenAPI, replace mock route handler with generated client hooks per quickstart.md Phase 2
