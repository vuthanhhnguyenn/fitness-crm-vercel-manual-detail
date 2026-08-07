# Tasks: D-01 Lesson Schedule Management

**Input**: Design documents from `/specs/005-lesson-management/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Contract verification tasks are included because the project constitution requires mock API route contract coverage. UI test automation is not included; manual verification is captured in `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other marked tasks in the same phase after phase prerequisites are met
- **[Story]**: Which user story this task belongs to (`US1` through `US6`)
- Each task includes exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create feature file structure and route/API placeholders.

- [x] T001 Create private route directory and empty page file in `src/app/(private)/lesson-schedules/page.tsx`
- [x] T002 [P] Create feature component directory placeholders under `src/app/(private)/lesson-schedules/_components/`
- [x] T003 [P] Create feature context and hook directories under `src/app/(private)/lesson-schedules/_contexts/` and `src/app/(private)/lesson-schedules/_hooks/`
- [x] T004 [P] Create lesson schedule API schema placeholder in `src/app/api/_schemas/lesson-schedule.schema.ts`
- [x] T005 [P] Create mock API route directories under `src/app/api/crm/lesson-schedules/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared typed data, mock API contracts, generated clients, and route registration that all user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Define Zod enums and schemas for lesson schedules, summaries, query params, and change requests in `src/app/api/_schemas/lesson-schedule.schema.ts`
- [x] T007 Add D-01 lesson schedule mock seed data and helper selectors to `src/app/api/_mock-db.ts`
- [x] T008 Implement shared schedule filter, sort, and aggregation helpers in `src/app/api/crm/lesson-schedules/_lib/lesson-schedule-response.util.ts`
- [x] T009 Register lesson schedule route imports in `src/app/api/_routes/index.ts`
- [x] T010 Implement lesson schedules list mock route in `src/app/api/crm/lesson-schedules/route.ts`
- [x] T011 Implement lesson schedule KPI summary mock route in `src/app/api/crm/lesson-schedules/summary/route.ts`
- [x] T012 Implement all-store schedule summary mock route in `src/app/api/crm/lesson-schedules/stores/summary/route.ts`
- [x] T013 Implement schedule change mock route in `src/app/api/crm/lesson-schedules/[id]/change/route.ts`
- [x] T014 Generate OpenAPI and API client artifacts using `src/lib/api/types.gen.ts` and `src/lib/api/@tanstack/react-query.gen.ts`
- [x] T015 Generate route config for `/lesson-schedules` in `src/lib/routes/routes.config.ts`
- [ ] T016 Add route-handler contract coverage for lesson schedule endpoints in `src/app/api/crm/lesson-schedules/lesson-schedules.contract.test.ts`
- [x] T017 Create shared display helpers for booking labels, statuses, and lesson type labels in `src/app/(private)/lesson-schedules/_components/lesson-schedule-display.util.ts`
- [x] T018 Create feature skeleton components for page, KPI, timeline, calendar, and table regions in `src/app/(private)/lesson-schedules/_components/lesson-schedule-skeletons.tsx`

**Checkpoint**: Foundation ready; user story implementation can now begin.

---

## Phase 3: User Story 1 - View Store Lesson Operations (Priority: P1) MVP

**Goal**: Non-Trainer users can open the D-01 Phase 1 screen and monitor store lesson operations with KPI cards, alert counts, and the default day timeline.

**Independent Test**: Open `/lesson-schedules` as a non-Trainer user and verify the shared shell, "Reservation Management" title, store/my-schedule tabs, KPI summary cards, toolbar shell, default day timeline, alert badges, studio/personal labels, payment labels, current-time indicator, full-page skeleton, component skeletons, and timeline empty state.

### Implementation for User Story 1

- [x] T019 [P] [US1] Implement KPI summary cards in `src/app/(private)/lesson-schedules/_components/kpi-summary.tsx`
- [x] T020 [P] [US1] Implement timeline item rendering in `src/app/(private)/lesson-schedules/_components/timeline-item.tsx`
- [x] T021 [US1] Implement day timeline view with alert counts, legend, current-time indicator, empty state, and skeleton support in `src/app/(private)/lesson-schedules/_components/timeline-view.tsx`
- [x] T022 [US1] Implement the main lesson schedules page composition with React Query data loading in `src/app/(private)/lesson-schedules/page.tsx`
- [x] T023 [US1] Wrap page and day timeline API-backed regions with `DataStateBoundary` in `src/app/(private)/lesson-schedules/page.tsx`
- [x] T024 [US1] Wire default schedule and summary queries from generated option factories in `src/app/(private)/lesson-schedules/page.tsx`
- [ ] T025 [US1] Verify US1 quickstart checks 1-4, 11-12 in `specs/005-lesson-management/quickstart.md`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Switch Between Schedule Views (Priority: P1)

**Goal**: Users can switch between day, weekly calendar, and list views, with each view rendering the same schedule data in the appropriate format.

**Independent Test**: Open `/lesson-schedules`, switch from day to weekly to list and back, and verify only the selected view is displayed with correct schedule data.

### Implementation for User Story 2

- [x] T026 [P] [US2] Implement weekly lesson card rendering in `src/app/(private)/lesson-schedules/_components/weekly-lesson-card.tsx`
- [x] T027 [US2] Implement weekly calendar view with seven-day columns, today highlight, Sunday styling, empty-day messages, and daily footers in `src/app/(private)/lesson-schedules/_components/weekly-calendar-view.tsx`
- [x] T028 [P] [US2] Implement list view columns with sortable headers and badges in `src/app/(private)/lesson-schedules/_components/schedule-list-columns.tsx`
- [x] T029 [US2] Implement list view with `DataTable`, manual sorting state, loading skeleton, and row navigation entry point in `src/app/(private)/lesson-schedules/_components/schedule-list-view.tsx`
- [x] T030 [US2] Add day/week/list view switching in `src/app/(private)/lesson-schedules/_components/lesson-schedule-toolbar.tsx`
- [x] T031 [US2] Integrate selected view rendering in `src/app/(private)/lesson-schedules/page.tsx`
- [ ] T032 [US2] Verify US2 quickstart checks 5 and 10 in `specs/005-lesson-management/quickstart.md`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Navigate Dates and Apply Schedule Filters (Priority: P1)

**Goal**: Users can navigate dates/weeks and apply store, studio, and instructor filters that narrow displayed schedule data.

**Independent Test**: Use Today, previous, next, calendar picker, store filter, studio filter, and instructor filter, then verify the toolbar state and displayed schedule data update.

### Implementation for User Story 3

- [x] T033 [P] [US3] Implement URL-backed filter context in `src/app/(private)/lesson-schedules/_contexts/lesson-schedule-filters-context.tsx`
- [x] T034 [US3] Implement `nuqs` filter, date, view, focus, and sorting hook in `src/app/(private)/lesson-schedules/_hooks/use-lesson-schedule-filters.hook.ts`
- [x] T035 [US3] Implement date navigation controls, calendar picker, store filter, studio filter, and instructor filter in `src/app/(private)/lesson-schedules/_components/lesson-schedule-toolbar.tsx`
- [x] T036 [US3] Map URL-backed filters into generated schedule query params in `src/app/(private)/lesson-schedules/page.tsx`
- [x] T037 [US3] Ensure mock API applies store, studio, instructor, date/week, and sort filters in `src/app/api/crm/lesson-schedules/_lib/lesson-schedule-response.util.ts`
- [ ] T038 [US3] Verify US3 quickstart checks 6-7 in `specs/005-lesson-management/quickstart.md`

**Checkpoint**: User Stories 1-3 are independently functional.

---

## Phase 6: User Story 4 - Review Area-Level Store Summary (Priority: P2)

**Goal**: All-store users can review area KPIs, sort the store summary table, and focus the schedule display on a selected store.

**Independent Test**: Open `/lesson-schedules` in all-store context with store axis and all-store filter, verify area KPI cards and store summary table render, sort the table, click a store row, and verify focused-store state updates.

### Implementation for User Story 4

- [x] T039 [P] [US4] Implement area KPI summary cards in `src/app/(private)/lesson-schedules/_components/area-kpi-summary.tsx`
- [x] T040 [P] [US4] Implement sortable area summary columns in `src/app/(private)/lesson-schedules/_components/area-summary-columns.tsx`
- [x] T041 [US4] Implement area summary table with focused row styling and click handling in `src/app/(private)/lesson-schedules/_components/area-summary-table.tsx`
- [x] T042 [US4] Integrate all-store summary mode, focused-store header, and focused-store queries in `src/app/(private)/lesson-schedules/page.tsx`
- [ ] T043 [US4] Verify all-store summary sort and focus behavior against `src/app/api/crm/lesson-schedules/stores/summary/route.ts`
- [ ] T044 [US4] Verify US4 quickstart checks 8-10 in `specs/005-lesson-management/quickstart.md`

**Checkpoint**: All-store summary mode works independently after foundation.

---

## Phase 7: User Story 5 - View My Assigned Schedule (Priority: P2)

**Goal**: Trainer users are locked to my-schedule view and can see assigned sessions with limited booked member names.

**Independent Test**: Open `/lesson-schedules` as a Trainer, verify the screen starts in my-schedule mode, store tab is disabled, and timeline rows show assigned session details and booked names when available.

### Implementation for User Story 5

- [x] T045 [US5] Add current-user role detection and Trainer axis lock in `src/app/(private)/lesson-schedules/page.tsx`
- [x] T046 [US5] Disable the store axis tab for Trainer users in `src/app/(private)/lesson-schedules/page.tsx`
- [x] T047 [US5] Include limited booked member names in my-schedule timeline rendering in `src/app/(private)/lesson-schedules/_components/timeline-item.tsx`
- [x] T048 [US5] Ensure mock API returns only assigned sessions for `axis=my_schedule` in `src/app/api/crm/lesson-schedules/_lib/lesson-schedule-response.util.ts`
- [x] T049 [US5] Verify role behavior with `src/hooks/use-current-user.ts` and generated query data in `src/app/(private)/lesson-schedules/page.tsx`
- [ ] T050 [US5] Verify role quickstart checks 1-4 in `specs/005-lesson-management/quickstart.md`

**Checkpoint**: Trainer my-schedule mode works independently after foundation.

---

## Phase 8: User Story 6 - Change an Existing Schedule from the List Screen (Priority: P3)

**Goal**: Permitted users can open the schedule-change modal from editable timeline or weekly items, close it, or confirm the Phase 1 non-validating flow.

**Independent Test**: Hover an editable timeline or weekly lesson, click the edit icon, verify modal content, close it, reopen it, confirm it, and verify the user returns to the schedule screen without additional validation.

### Implementation for User Story 6

- [x] T051 [P] [US6] Implement schedule change modal UI in `src/app/(private)/lesson-schedules/_components/schedule-change-modal.tsx`
- [x] T052 [US6] Add edit icon affordance and event propagation handling in `src/app/(private)/lesson-schedules/_components/timeline-item.tsx`
- [x] T053 [US6] Add edit icon affordance and event propagation handling in `src/app/(private)/lesson-schedules/_components/weekly-lesson-card.tsx`
- [x] T054 [US6] Wire modal open, close, and confirm mutation state in `src/app/(private)/lesson-schedules/page.tsx`
- [x] T055 [US6] Connect confirm action to generated schedule-change mutation in `src/app/(private)/lesson-schedules/page.tsx`
- [x] T056 [US6] Ensure Phase 1 confirm mutation completes without validation in `src/app/api/crm/lesson-schedules/[id]/change/route.ts`
- [ ] T057 [US6] Verify US6 quickstart checks 13-15 in `specs/005-lesson-management/quickstart.md`

**Checkpoint**: Schedule-change modal flow works independently after foundation.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, generated artifacts, quality gates, and out-of-scope safeguards.

- [x] T058 Regenerate route config after page creation using `src/lib/routes/routes.config.ts`
- [x] T059 Regenerate OpenAPI and API client artifacts in `src/lib/api/types.gen.ts` and `src/lib/api/@tanstack/react-query.gen.ts`
- [x] T060 [P] Confirm no create/detail implementation leaked into `src/app/(private)/lesson-schedules/page.tsx`
- [x] T061 [P] Confirm all user-visible copy remains Japanese in `src/app/(private)/lesson-schedules/`
- [x] T062 [P] Confirm no raw color values or non-lucide icons were introduced in `src/app/(private)/lesson-schedules/`
- [x] T063 Run type checking and fix issues reported from `tsconfig.typecheck.json`
- [x] T064 Run linting and fix issues reported by `eslint.config.mjs`
- [ ] T065 Run full quickstart validation from `specs/005-lesson-management/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **US1 (Phase 3)**: Depends on Foundation; MVP story.
- **US2 (Phase 4)**: Depends on Foundation and benefits from US1 page composition.
- **US3 (Phase 5)**: Depends on Foundation and should integrate with US1/US2 views.
- **US4 (Phase 6)**: Depends on Foundation and can proceed after the filter hook from US3 or use the same URL-state contract.
- **US5 (Phase 7)**: Depends on Foundation and can proceed in parallel with US4 once page composition exists.
- **US6 (Phase 8)**: Depends on Foundation and the timeline/weekly item components from US1/US2.
- **Polish (Phase 9)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on other user stories; suggested MVP.
- **US2 (P1)**: Can be built after foundational data and alongside US1 components, but final integration uses page composition from US1.
- **US3 (P1)**: Can be built after foundation; verifies filters across US1/US2 views.
- **US4 (P2)**: Can be implemented after foundation; uses URL focus/filter state.
- **US5 (P2)**: Can be implemented after foundation; uses role and my-schedule query behavior.
- **US6 (P3)**: Requires editable timeline/weekly item components from US1/US2.

### Within Each User Story

- API/schema helpers before endpoint behavior.
- Generated API client before UI query integration.
- Data components before page composition.
- Page integration before quickstart verification.

---

## Parallel Execution Examples

### User Story 1

```text
Task: "T019 Implement KPI summary cards in src/app/(private)/lesson-schedules/_components/kpi-summary.tsx"
Task: "T020 Implement timeline item rendering in src/app/(private)/lesson-schedules/_components/timeline-item.tsx"
```

### User Story 2

```text
Task: "T026 Implement weekly lesson card rendering in src/app/(private)/lesson-schedules/_components/weekly-lesson-card.tsx"
Task: "T028 Implement list view columns with sortable headers and badges in src/app/(private)/lesson-schedules/_components/schedule-list-columns.tsx"
```

### User Story 4

```text
Task: "T039 Implement area KPI summary cards in src/app/(private)/lesson-schedules/_components/area-kpi-summary.tsx"
Task: "T040 Implement sortable area summary columns in src/app/(private)/lesson-schedules/_components/area-summary-columns.tsx"
```

### User Story 6

```text
Task: "T051 Implement schedule change modal UI in src/app/(private)/lesson-schedules/_components/schedule-change-modal.tsx"
Task: "T052 Add edit icon affordance and event propagation handling in src/app/(private)/lesson-schedules/_components/timeline-item.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundation, including schemas, mock APIs, OpenAPI registration, generated client, and shared helpers.
3. Complete Phase 3 US1.
4. Stop and validate the store operations MVP independently.

### Incremental Delivery

1. US1 delivers the default monitorable store schedule page.
2. US2 adds alternate views without changing the core data contract.
3. US3 makes date/filter/sort query state functional.
4. US4 adds all-store operational summary.
5. US5 adds Trainer-specific my-schedule behavior.
6. US6 adds the Phase 1 schedule-change modal flow.

### Parallel Team Strategy

After Phase 2 foundation:

- Developer A: US1 and page composition.
- Developer B: US2 view components.
- Developer C: US3 URL filter state and API filter behavior.
- Developer D: US4/US5 role and summary variants.
- Developer E: US6 modal flow after timeline/weekly card components exist.

---

## Summary

- **Total tasks**: 65
- **US1 tasks**: 7
- **US2 tasks**: 7
- **US3 tasks**: 6
- **US4 tasks**: 6
- **US5 tasks**: 6
- **US6 tasks**: 7
- **Suggested MVP scope**: Phase 1 + Phase 2 + US1
- **Parallel opportunities**: Setup placeholders, foundational component/schema work, independent component files within US1/US2/US4/US6, and user stories after foundation where dependencies allow
