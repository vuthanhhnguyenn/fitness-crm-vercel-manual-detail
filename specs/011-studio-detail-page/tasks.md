# Tasks: D-03 Studio Management — FR-003 Studio Detail Display

**Input**: Design documents from `/specs/011-studio-detail-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/get-studio-detail.md, quickstart.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature workspace and route/component skeleton for studio detail implementation.

- [ ] T001 Create feature component directory in src/app/(private)/studios/[id]/\_components/
- [ ] T002 Create feature hook directory in src/app/(private)/studios/[id]/\_hooks/
- [ ] T003 Verify typed detail route registration in src/lib/routes/routes.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build core API contract implementation and typed data source before any user-story UI work.

**CRITICAL**: User story implementation starts only after this phase is complete.

- [ ] T004 Create Studio detail Zod schemas in src/app/api/\_schemas/studio-detail.schema.ts
- [ ] T005 Export studio detail schemas from src/app/api/\_schemas/index.ts
- [ ] T006 Extend studio detail seed data in src/app/api/\_mock-db.ts
- [ ] T007 Implement getStudioDetailById role-scoped query in src/app/api/\_mock-db.ts
- [ ] T008 Implement GET detail mock route in src/app/api/crm/studios/[id]/route.ts
- [ ] T009 [P] Add detail endpoint contract tests in tests/contract/api/crm/studios/get-studio-detail.contract.test.ts
- [ ] T010 Generate latest OpenAPI document in openapi.json
- [ ] T011 Generate API client from openapi.json into src/lib/api/

**Checkpoint**: Foundation ready. User stories can be implemented.

---

## Phase 3: User Story 1 - View studio detail information (Priority: P1) 🎯 MVP

**Goal**: Render complete studio detail page content (header, basic info, linked lessons card, images, layout, utilization) with robust loading/error/not-found handling.

**Independent Test**: Open a studio from list and confirm detail header, basic information, linked lessons card, and studio image card render correctly with selected studio context.

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create detail loading skeleton component in src/app/(private)/studios/[id]/\_components/studio-detail-skeleton.tsx
- [ ] T013 [P] [US1] Create basic information card component in src/app/(private)/studios/[id]/\_components/studio-basic-info-card.tsx
- [ ] T014 [P] [US1] Create studio images card component in src/app/(private)/studios/[id]/\_components/studio-images-card.tsx
- [ ] T015 [P] [US1] Create layout card component with configured/not-configured branches in src/app/(private)/studios/[id]/\_components/studio-layout-card.tsx
- [ ] T016 [P] [US1] Create utilization summary card component in src/app/(private)/studios/[id]/\_components/studio-utilization-card.tsx
- [ ] T017 [P] [US1] Create linked lessons card base rendering in src/app/(private)/studios/[id]/\_components/studio-linked-lessons-card.tsx
- [x] T018 [US1] Create detail data hook with React Query in src/app/(private)/studios/[id]/\_hooks/use-studio-detail.ts
- [x] T019 [US1] Implement detail page orchestration (header, tabs, cards) in src/app/(private)/studios/[id]/page.tsx
- [x] T020 [US1] Implement loading/error/not-found state handling in src/app/(private)/studios/[id]/page.tsx
- [x] T021 [US1] Implement Change History tab with StudioHistoryTab in src/app/(private)/studios/[id]/page.tsx
- [x] T037 [US1] Add GET /crm/studios/{id}/history mock API, seed data, and React Query integration

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Assess linked lesson utilization at a glance (Priority: P2)

**Goal**: Show reservation-rate percentages with threshold color semantics and support lesson-row navigation from linked lessons.

**Independent Test**: Open a studio with multiple linked lessons and verify threshold colors for 80%+ and 60-79%, then click a lesson row to navigate to lesson detail.

### Implementation for User Story 2

- [ ] T022 [P] [US2] Add reservation tier mapping utility in src/lib/utils/studio-reservation-tier.util.ts
- [ ] T023 [US2] Add mixed reservation-rate seed scenarios in src/app/api/\_mock-db.ts
- [ ] T024 [US2] Apply threshold color rendering in src/app/(private)/studios/[id]/\_components/studio-linked-lessons-card.tsx
- [ ] T025 [US2] Implement lesson row navigation using typed routes in src/app/(private)/studios/[id]/\_components/studio-linked-lessons-card.tsx
- [ ] T026 [US2] Add linked-lesson threshold component tests in src/app/(private)/studios/[id]/\_components/**tests**/studio-linked-lessons-card.test.tsx

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Use detail page actions within authority constraints (Priority: P2)

**Goal**: Enforce role-based visibility for Edit/Delete actions and block destructive delete confirmation when studio is in use.

**Independent Test**: Validate action visibility matrix by role and confirm delete dialog warning+disabled destructive action for in-use studio.

### Implementation for User Story 3

- [ ] T027 [P] [US3] Add studio action permission helper in src/lib/utils/studio-action-permissions.util.ts
- [ ] T028 [P] [US3] Create role-gated header actions component in src/app/(private)/studios/[id]/\_components/studio-detail-header-actions.tsx
- [ ] T029 [P] [US3] Create delete confirmation dialog with in-use guard in src/app/(private)/studios/[id]/\_components/studio-delete-dialog.tsx
- [x] T030 [US3] Integrate header actions and delete dialog into src/app/(private)/studios/[id]/page.tsx
- [ ] T031 [US3] Add role-matrix visibility tests in src/app/(private)/studios/[id]/\_components/**tests**/studio-detail-header-actions.test.tsx
- [ ] T032 [US3] Add delete-guard behavior tests in src/app/(private)/studios/[id]/\_components/**tests**/studio-delete-dialog.test.tsx

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, documentation sync, and end-to-end validation across all stories.

- [ ] T033 [P] Update clarified edge cases in specs/011-studio-detail-page/spec.md
- [ ] T034 [P] Update implementation runbook and command order in specs/011-studio-detail-page/quickstart.md
- [ ] T035 Run lint/typecheck/test verification and record results in specs/011-studio-detail-page/quickstart.md
- [ ] T036 Validate all FR-003 acceptance scenarios and capture coverage notes in specs/011-studio-detail-page/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies.
- Foundational (Phase 2): Depends on Setup; blocks all user stories.
- User Stories (Phases 3-5): Depend on Foundational completion.
- Polish (Phase 6): Depends on completion of selected user stories.

### User Story Dependencies

- US1 (P1): Starts after Phase 2 and is MVP baseline.
- US2 (P2): Starts after Phase 2; depends on linked lessons card/data from US1 but remains independently testable.
- US3 (P2): Starts after Phase 2; can proceed in parallel with US2 once page shell exists.

### Critical Ordering Constraint

- T010 must run after mock API completion (T008).
- T011 must run after OpenAPI generation (T010).

---

## Parallel Opportunities

- Phase 2: T009 can run in parallel with T006-T008 after schemas are stable.
- US1: T012-T017 are parallel component tasks.
- US2: T022 can run in parallel with T023.
- US3: T027-T029 can run in parallel.
- Polish: T033 and T034 can run in parallel.

---

## Parallel Example: User Story 1

- Run T012, T013, T014, T015, T016, and T017 concurrently across separate component files.
- Run T018 after T011 is complete, then integrate through T019 and T020.

## Parallel Example: User Story 2

- Run T022 and T023 in parallel, then finish T024 and T025, followed by T026.

## Parallel Example: User Story 3

- Run T027, T028, and T029 in parallel, then integrate with T030 and finalize tests via T031 and T032.

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1).
3. Validate FR-003 core detail rendering before adding further stories.

### Incremental Delivery

1. Foundation complete (Phases 1-2).
2. Deliver US1 and validate.
3. Deliver US2 for utilization thresholds.
4. Deliver US3 for action security/guard behavior.
5. Finish with Phase 6 polish and documentation sync.

### Multi-Developer Parallel Strategy

1. Developer A: Phase 2 API/schema/mock-db foundation.
2. Developer B: US1 card components in parallel once contracts are stable.
3. Developer C: US3 role/dialog components once page shell exists.
4. Merge through page orchestration and shared verification in Phase 6.
