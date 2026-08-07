# Tasks: Visit/Experience Management — List Page

**Input**: Design documents from `specs/001-visit-experience-list/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅  
**Branch**: `001-visit-experience-list`  
**Route**: `/visit-experiences`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies between them)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every task description

---

## Phase 1: Setup — Types & Schemas & Seed Data

**Purpose**: Define all data shapes and populate mock DB. Must complete before any API or UI work.

- [x] T001 [P] Create `src/types/api/visit-experience.type.ts` — export `VisitExperienceStatus`, `VISIT_EXPERIENCE_STATUS_LABELS`, `VisitExperience`, `VisitExperienceDateRangeFilter`, `GetVisitExperiencesQuery`, `GetVisitExperiencesResponse`, `GetVisitExperiencesSummaryResponse` per data-model.md TypeScript type block
- [x] T002 [P] Create `src/app/api/_schemas/visit-experience.schema.ts` — export `VisitExperienceStatusSchema`, `VisitExperienceSchema`, `GetVisitExperiencesQuerySchema`, `GetVisitExperiencesResponseSchema`, `GetVisitExperiencesSummaryResponseSchema` per data-model.md Zod schema block
- [x] T003 Add `visitExperiences: VisitExperience[]` seed array to `src/app/api/_mock-db.ts` — ≥10 records, all 7 statuses represented, ≥1 `bl_match: true`, brands FIT365 + JOYFIT, ≥3 stores, mixed dates (today + 2–3 past days), mix of null/non-null `visit_start_at` and `visit_end_actual_at`

**Checkpoint**: Types compile, schemas validate, mock DB exports `visitExperiences`

---

## Phase 2: Foundational — Mock API & Option-Factories & Page Shell

**Purpose**: Wire the data pipeline (Route Handlers → React Query → page) before any UI component work begins. All user stories depend on this phase.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [x] T004 Create `src/app/api/crm/visit-experiences/route.ts` — `GET` handler: validate query via `GetVisitExperiencesQuerySchema`, filter `db.visitExperiences` (search / status / brand_name / store_name / date_range), sort by `reserved_at` desc, paginate, return `GetVisitExperiencesResponseSchema` payload; register OpenAPI via `registerRoute()` per contracts/GET-visit-experiences.md
- [x] T005 [P] Create `src/app/api/crm/visit-experiences/summary/route.ts` — `GET` handler: compute the 4 KPI counts from full `db.visitExperiences` (no query params), return `GetVisitExperiencesSummaryResponseSchema` payload; register OpenAPI via `registerRoute()` per contracts/GET-visit-experiences-summary.md
- [x] T006 [P] Create `src/app/api/crm/visit-experiences/[id]/route.ts` — `GET` stub: find by `id` in `db.visitExperiences`, return 404 `{ error: "Not found" }` when missing
- [x] T007 Create `src/lib/api/@tanstack/visit-experience.query.ts` — export `getCrmVisitExperiencesOptions(params?)` and `getCrmVisitExperiencesSummaryOptions()` and `getCrmVisitExperiencesByIdOptions(id)` using `queryOptions` from `@tanstack/react-query`, typed with types from `src/types/api/visit-experience.type.ts`, fetching from `/api/crm/visit-experiences` per quickstart.md Step 5
- [x] T008 Create `src/app/(private)/visit-experiences/page.tsx` — RSC page shell: `<Eye>` icon + `BreadcrumbNav` header row, `<Suspense>` wrapping `<VisitExperienceKpi />` and `<VisitExperienceListSection />` (components referenced but not yet implemented)
- [x] T009 Create `src/app/(private)/visit-experiences/[id]/page.tsx` — RSC stub page (Phase 1 placeholder) so navigation from list row resolves without 404; display minimal "準備中" message with back link to `/visit-experiences`

> After T008 and T009 are created, run `npm run generate-routes` to register `/visit-experiences` and `/visit-experiences/[id]` in `src/lib/routes/routes.config.ts`.

**Checkpoint**: `GET /api/crm/visit-experiences` and `GET /api/crm/visit-experiences/summary` return correct responses from mock data. Routes `/visit-experiences` and `/visit-experiences/[id]` resolve in the browser.

---

## Phase 3: User Story 1 — Process Daily Visit Reservations Queue (P1) 🎯 MVP

**Goal**: Staff can open the page, see all reservation rows with correct columns and BL-match treatment, and click through to the detail stub.

**Independent Test**: Load the page with mixed status mock data → table renders 9 columns → BL-match rows show destructive background + `BL一致` badge → `visit_end_actual_at` rows show `（実績）` suffix, others show `（予定）` → `visit_start_at = null` rows show `—` → clicking any row navigates to `/visit-experiences/:id`.

- [x] T010 [P] [US1] Create `src/app/(private)/visit-experiences/_components/visit-experience-header.tsx` — `'use client'` component: `Eye` icon + `BreadcrumbNav variant="section"` with label `見学・体験管理` (no parent link); matches breadcrumb pattern from `membership-applications-header.tsx`
- [x] T011 [US1] Create `src/app/(private)/visit-experiences/_components/visit-experience-list-section.tsx` — `'use client'` component (US1 scope — table + pagination only, filters added in Phase 4):
  - `useQuery(getCrmVisitExperiencesOptions(queryParams))` for list data
  - Wrap data region in skeleton loading state (`DataStateBoundary` or `Skeleton` fallback)
  - shadcn `<Table>` with 9 columns: 予約番号 / 氏名 / ステータス (Badge with status-specific class per `VISIT_EXPERIENCE_STATUS_LABELS`) / BL照合 (`AlertTriangle` + `BL一致` Badge when `bl_match = true`, dash when false) / ブランド / 店舗 / 予約日時 / 見学開始 (dash when null) / 見学終了（予定/実績）
  - Row `onClick` → `navigate('/visit-experiences/[id]', row.id)` using `navigate` from `@/lib/routes/routes.util`
  - BL match row: `bg-destructive/5 hover:bg-destructive/10`; normal row: `hover:bg-muted/50`; all rows: `cursor-pointer`
  - Pagination footer: record range text `全 N 件 / P ページ / X–Y を表示` + `TablePagination` component + page-size `Select` (25/50/100/200); page and limit via `nuqs` `useQueryState`
  - Empty state (no filter active): `<p>データがありません。</p>` centered in table

- [x] T012 [US1] Update `src/app/(private)/visit-experiences/page.tsx` to import and render `<VisitExperienceHeader />` and `<VisitExperienceListSection />` inside Suspense

**Checkpoint (US1 complete)**: Page at `/visit-experiences` renders table with all mock records, BL-match rows are highlighted, datetime columns display correctly, row click navigates to `/visit-experiences/:id` stub.

---

## Phase 4: User Story 2 — Search & Filter the Queue (P2)

**Goal**: Staff can search by ID/name and filter by status/brand/store/date range; active filters show a count badge and summary banner; clearing resets state and returns full list.

**Independent Test**: Apply `?status=visiting` → only `見学中` rows visible + active-filter count badge shows `1` + banner shows filter summary → clear-all resets to full list → `?status=cancelled&brand_name=JOYFIT` with no match → empty state + "条件をクリア" button.

- [x] T013 [US2] Add nuqs URL state to `src/app/(private)/visit-experiences/_components/visit-experience-list-section.tsx` — declare all filter params via `useQueryStates`: `search` (string, default `""`), `status` (`VisitExperienceStatus | ""`, default `""`), `brand_name` (string, default `""`), `store_name` (string, default `""`), `date_range` (`VisitExperienceDateRangeFilter | ""`, default `""`); reset `page` to `1` on any filter change; wire all params into `getCrmVisitExperiencesOptions(queryParams)` call
- [x] T014 [US2] Add search input + filter toggle to `src/app/(private)/visit-experiences/_components/visit-experience-list-section.tsx` — `<Input>` with `<Search>` icon (debounce 300 ms) bound to `search` nuqs state; `<Button variant="outline">` filter toggle showing `<SlidersHorizontal>` icon + `フィルター`; when `activeFilterCount > 0` show numeric badge on button
- [x] T015 [US2] Add collapsible filter panel to `src/app/(private)/visit-experiences/_components/visit-experience-list-section.tsx` — `showFilters` via local `useState` (ephemeral UI state per research.md Decision 9); panel contains 4 `<Select>` dropdowns: ステータス (7 options + "全ステータス"), ブランド (FIT365 / JOYFIT / "全ブランド"), 店舗 (stores from seed + "全店舗"), 期間 (本日 / 直近3日 / 直近7日 / "全期間"); `すべてクリア` ghost button calls `clearAllFilters()`
- [x] T016 [US2] Add active-filter Alert banner + empty-state recovery to `src/app/(private)/visit-experiences/_components/visit-experience-list-section.tsx` — when `activeFilterCount > 0 || search !== ""`: show `<Alert>` banner above table with `全 N 件中 M 件を抽出中` message + filter summary string + `<X>` clear button; when `items.length === 0` and filters active: show `該当のデータがありません。` + `<Button variant="outline">条件をクリア</Button>` in empty table row

**Checkpoint (US2 complete)**: All filter combinations produce correct results; active-count badge tracks correctly; banner appears/disappears correctly; clear-all resets URL params; empty state shows recovery button.

---

## Phase 5: User Story 3 — Same-Day KPI Summary Cards (P3)

**Goal**: Staff can see 4 same-day KPI counts at the top of the page; 当日キャンセル card turns destructive when count > 0; 見学中 card uses warning tone.

**Independent Test**: Load page with seed data containing today's records → 本日申込 count matches today's `reserved_at` records → 見学中 count matches all `visiting` records → 入会申請済 count matches today's `membership_applied` records → 当日キャンセル count matches today's `cancelled` records → card tones match spec (warning / success / destructive when > 0 / default).

- [x] T017 [US3] Create `src/app/(private)/visit-experiences/_components/visit-experience-kpi.tsx` — `'use client'` component: `useQuery(getCrmVisitExperiencesSummaryOptions())` with skeleton loading state (4 `<Skeleton>` placeholders); render 4 `<Card><CardContent>` KPI cards: 本日申込 (`text-foreground`) / 見学中 (`text-warning`) / 入会申請済 (`text-success`) / 当日キャンセル (`text-destructive` when count > 0 else `text-foreground`); each card shows title, count + `件`, sub-label
- [x] T018 [US3] Update `src/app/(private)/visit-experiences/page.tsx` to import and render `<VisitExperienceKpi />` inside its own `<Suspense>` above `<VisitExperienceListSection />`

**Checkpoint (US3 complete)**: KPI cards display correct counts from mock summary endpoint; tone changes correctly for non-zero cancellations; loading skeletons appear during fetch.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Sidebar navigation, type safety, lint hygiene.

- [x] T019 [P] Add `見学・体験管理` navigation item to `src/components/layout/app-sidebar.tsx` — insert `{ label: '見学・体験管理', icon: Eye, href: '/visit-experiences' }` in `menuItems` array; import `Eye` from `lucide-react`
- [x] T020 Run `npm run type-check` from repo root and fix all TypeScript errors (zero errors required before PR)
- [x] T021 Run `npm run lint` from repo root and fix all ESLint errors (zero errors required before PR)

**Checkpoint**: `tsc --noEmit` exits 0, `eslint` exits 0. Page navigates from sidebar. All 3 user stories verified end-to-end.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — T001 and T002 can start immediately in parallel
- **Phase 2 (Foundational)**: T003 (from Phase 1) must complete before T004/T005/T006; T001 must complete before T007; T008/T009 have no data dependencies — can start alongside Phase 1
- **Phase 3 (US1)**: Depends on T004, T007, T009 — all three foundational tasks must be done
- **Phase 4 (US2)**: T013–T016 all extend the same `visit-experience-list-section.tsx` file created in T011 — must run sequentially after T011
- **Phase 5 (US3)**: T017 depends on T005 (summary route) and T007 (option-factory); T018 depends on T017
- **Phase 6 (Polish)**: T019 is independent; T020/T021 run last after all implementation is done

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 completion (T004, T007, T008, T009)
- **US2 (P2)**: Depends on US1 completion (T011 creates the file US2 extends)
- **US3 (P3)**: Depends on Phase 2 (T005, T007) — independent of US1 and US2

### Within Each User Story

- T011 (US1 table) before T013–T016 (US2 filter additions) — same file, must be sequential
- T017 (US3 KPI component) before T018 (add to page)
- T010 (header) and T011 (list section) can be done in parallel (different files)

### Parallel Opportunities

| Group             | Parallel tasks                                                           |
| ----------------- | ------------------------------------------------------------------------ |
| Phase 1 start     | T001, T002 (different files)                                             |
| Phase 2 handlers  | T005, T006 after T003 (different route files)                            |
| Phase 3 start     | T010 (header), T011 (list section) after T007/T009 complete              |
| Phase 5 + Phase 6 | T017 (KPI) can start as soon as T005+T007 done, parallel to Phase 4 work |
| Polish            | T019 (sidebar) parallel to T020/T021 lint/typecheck                      |

---

## Parallel Execution Example: Phase 2

```
# Once T001+T002+T003 complete:
Task A: T004 — visit-experiences/route.ts (list handler)
Task B: T005 — visit-experiences/summary/route.ts (KPI handler) [P]
Task C: T006 — visit-experiences/[id]/route.ts (detail stub) [P]
Task D: T007 — visit-experience.query.ts (option-factories)
Task E: T008 + T009 — page shells
```

## Parallel Execution Example: Phase 3

```
# Once T007+T009 complete:
Task A: T010 — visit-experience-header.tsx [P]
Task B: T011 — visit-experience-list-section.tsx (table + pagination)
# T010 finishes quickly; T012 follows T011
```

---

## Implementation Strategy

### MVP First (US1 Only — Phases 1–3)

1. Complete Phase 1: Types + Schemas + Seed data
2. Complete Phase 2: Mock API + option-factories + page shell + routes
3. Complete Phase 3 (US1): Header + table + pagination + detail stub
4. **STOP and VALIDATE**: Open `/visit-experiences` → table renders → BL rows highlighted → click navigates
5. Demo-ready minimal queue view without filtering

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ✅
2. Phase 3 (US1) → Basic queue list ✅ — staff can see and navigate reservations
3. Phase 4 (US2) → Search & filters ✅ — staff can find reservations quickly
4. Phase 5 (US3) → KPI cards ✅ — shift lead can monitor queue health
5. Phase 6 (Polish) → Sidebar nav + type/lint clean ✅ — production ready

---

## Task Summary

| Phase                  | Tasks     | Parallel?                                     | Story |
| ---------------------- | --------- | --------------------------------------------- | ----- |
| Phase 1 — Setup        | T001–T003 | T001, T002 in parallel                        | —     |
| Phase 2 — Foundational | T004–T009 | T005, T006 in parallel; T008/T009 independent | —     |
| Phase 3 — US1 (P1) 🎯  | T010–T012 | T010, T011 in parallel                        | US1   |
| Phase 4 — US2 (P2)     | T013–T016 | Sequential (same file)                        | US2   |
| Phase 5 — US3 (P3)     | T017–T018 | T017 parallel to Phase 4                      | US3   |
| Phase 6 — Polish       | T019–T021 | T019 parallel; T020/T021 sequential           | —     |

**Total tasks**: 21  
**Parallelisable tasks**: 10 marked [P]  
**MVP scope**: T001–T012 (12 tasks, Phases 1–3)

---

## Notes

- `[P]` tasks touch different files with no blocking dependencies — safe to run concurrently
- All `[US1]` / `[US2]` / `[US3]` tasks are traceable to spec.md user stories
- US2 tasks (T013–T016) all extend `visit-experience-list-section.tsx` created in T011 — they MUST run sequentially
- Phase 2 hint: run `npm run generate-routes` after T008+T009 so `navigate('/visit-experiences/[id]', id)` compiles
- Phase 2 migration: when DEV-BE publishes OpenAPI, delete T007's file and replace with generated hooks per quickstart.md Phase 2 checklist
