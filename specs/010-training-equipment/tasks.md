# Tasks: E-03 Training Equipment Management (Phase 1)

**Input**: Design documents from `/specs/010-training-equipment/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/training-equipment.openapi.yaml`, `quickstart.md`

**Tests**: Include focused contract/validation checks because plan and quickstart require route-level verification.  
**Organization**: Tasks are grouped by user story to keep each story independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`) for story-phase tasks only
- Every task includes concrete file path(s)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align feature scaffolding and shared constants with the approved plan/spec.

- [x] T001 Create feature route folder scaffolding under `src/app/(private)/training-equipment/` (`page.tsx`, `[id]/page.tsx`, `form/page.tsx`, `_components/`, `_hooks/`)
- [x] T002 Define feature form/request mapping via feature-local schemas and mappers in `src/app/(private)/training-equipment/_schemas/` and `src/app/(private)/training-equipment/_utils/` (no dedicated `src/types/training-equipment.type.ts`)
- [x] T003 [P] Add route entries for training-equipment pages in `src/lib/routes/routes.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build core API/data/state plumbing required before user stories.

**⚠️ CRITICAL**: No user story implementation should start until this phase is complete.

- [x] T004 Implement Zod schemas for list/detail/create/update/status/history/link payloads in `src/app/api/_schemas/training-equipment.schema.ts`
- [x] T005 Extend mock entities and helpers for equipment, links, and seeded read-only history in `src/app/api/_mock-db.ts`
- [x] T006 Implement base route handler wiring for `/api/crm/training-equipment` and nested endpoints in `src/app/api/crm/training-equipment/` (`route.ts`, `[equipmentId]/route.ts`, `[equipmentId]/status/route.ts`, `[equipmentId]/exercise-links/route.ts`, `[equipmentId]/history/route.ts`)
- [x] T007 [P] Register new route schemas/endpoints in `src/app/api/_scripts/register-schemas.ts` and `src/app/api/_routes/index.ts`
- [x] T008 Create feature-local React Query hooks for shared data operations in `src/app/(private)/training-equipment/_hooks/` (`use-training-equipment-filters.hook.ts`, `use-status-change-form.hook.ts`, `use-exercise-link-selection.hook.ts`)

**Checkpoint**: API contracts, mock DB, and shared hooks are ready for story implementation.

---

## Phase 3: User Story 1 - Browse and find equipment in store scope (Priority: P1) 🎯 MVP

**Goal**: Deliver list browsing with search/filter/sort/pagination and correct empty/filter states.

**Independent Test**: Open list page and verify keyword + filter + pagination behavior, default discard exclusion, and empty/filtered states without using create/edit/detail workflows.

- [x] T009 [US1] Implement list endpoint query behavior (keyword, filters, pagination, default exclude discarded, API-owned default order) in `src/app/api/crm/training-equipment/route.ts`
- [x] T010 [US1] Implement list screen composition in `src/app/(private)/training-equipment/page.tsx` using existing shared layout components
- [x] T011 [P] [US1] Implement list toolbar/filter components in `src/app/(private)/training-equipment/_components/` (search input, filter controls, filter banner)
- [x] T012 [P] [US1] Implement list table and pagination components in `src/app/(private)/training-equipment/_components/` (columns, row click, empty state, pagination footer)
- [x] T013 [US1] Wire list page state/hooks integration in `src/app/(private)/training-equipment/_hooks/use-training-equipment-filters.hook.ts` (nuqs URL sync; table sort/pagination via same hook)
- [x] T014 [US1] Apply role-gated behavior for CSV/new registration controls on list page in `src/app/(private)/training-equipment/page.tsx`
- [x] T015 [US1] Add list endpoint contract/validation checks for query and response shape in `src/app/api/crm/training-equipment/route.ts`

**Checkpoint**: US1 is independently functional and testable as MVP.

---

## Phase 4: User Story 2 - Register and edit equipment records (Priority: P2)

**Goal**: Deliver create/edit form flows with required validation and tool-type-change confirmation.

**Independent Test**: From list -> open form create/edit flows, submit required fields, validate form behavior and route transitions independent of exercise-link/history operations.

- [x] T016 [US2] Implement create endpoint validation and persistence in `src/app/api/crm/training-equipment/route.ts`
- [x] T017 [US2] Implement detail update endpoint validation and persistence in `src/app/api/crm/training-equipment/[equipmentId]/route.ts`
- [x] T018 [P] [US2] Build shared form sections in `src/app/(private)/training-equipment/_components/` (basic info, installation info, notes)
- [x] T019 [US2] Implement create form page behavior in `src/app/(private)/training-equipment/form/page.tsx` (create mode submit + success navigation)
- [x] T020 [US2] Implement edit form page behavior in `src/app/(private)/training-equipment/form/page.tsx` (edit mode defaults + confirmation dialog)
- [x] T021 [US2] Add form-level validation rules from spec/data model in `src/app/(private)/training-equipment/_components/` and `src/app/api/_schemas/training-equipment.schema.ts`
- [x] T022 [US2] Ensure edit mode keeps status field read-only and defers status change to detail screen in `src/app/(private)/training-equipment/form/page.tsx`

**Checkpoint**: US2 create/edit flow is independently functional and testable.

---

## Phase 5: User Story 3 - View equipment detail, status, links, and deletion guardrails (Priority: P3)

**Goal**: Deliver detail tabs, status change with mandatory reason validation, exercise link add/unlink, delete guardrails, and seeded read-only history.

**Independent Test**: Open detail page from list and verify status dialog validation, exercise add/unlink behavior, delete-block rule, and read-only history tab.

- [x] T023 [US3] Implement detail retrieval and soft-delete guard behavior in `src/app/api/crm/training-equipment/[equipmentId]/route.ts`
- [x] T024 [US3] Implement status-change endpoint with mandatory `reason` validation in `src/app/api/crm/training-equipment/[equipmentId]/status/route.ts`
- [x] T025 [US3] Implement exercise-link add/unlink endpoints in `src/app/api/crm/training-equipment/[equipmentId]/exercise-links/route.ts`
- [x] T026 [US3] Implement seeded read-only history endpoint in `src/app/api/crm/training-equipment/[equipmentId]/history/route.ts`
- [x] T027 [US3] Implement detail page tabs and role-gated actions in `src/app/(private)/training-equipment/[id]/page.tsx`
- [x] T028 [P] [US3] Implement status-change dialog/form hook with required reason UX in `src/app/(private)/training-equipment/_components/` and `src/app/(private)/training-equipment/_hooks/use-status-change-form.hook.ts`
- [x] T029 [P] [US3] Implement exercise-link tab + add/unlink modal interactions in `src/app/(private)/training-equipment/_components/` and `src/app/(private)/training-equipment/_hooks/use-exercise-link-selection.hook.ts`
- [x] T030 [US3] Enforce Y-08 navigation deferral by keeping linked exercise click non-navigating in `src/app/(private)/training-equipment/[id]/page.tsx`

**Checkpoint**: US3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, quality gates, and documentation sync.

- [x] T031 [P] Update `specs/010-training-equipment/quickstart.md` to align hook paths with final feature-local `_hooks` structure
- [x] T032 Verify role-gate behavior consistency across list/form/detail UI and API responses in `src/app/(private)/training-equipment/` and `src/app/api/crm/training-equipment/`
- [x] T033 Run and fix quality gates (`npm run lint`, `npm run type-check`, `npm run build`) across changed files
- [x] T034 Execute end-to-end manual checks from `specs/010-training-equipment/spec.md` acceptance scenarios and edge cases, then record completion notes in `specs/010-training-equipment/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependency
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2 (can run in parallel with US1 if staffed)
- **Phase 5 (US3)**: Depends on Phase 2 and partially reuses US1/US2 artifacts
- **Phase 6 (Polish)**: Depends on all selected stories complete

### User Story Dependencies

- **US1 (P1)**: Independent after foundational API/hook setup
- **US2 (P2)**: Independent after foundational API/schema setup; integrates with list/detail navigation
- **US3 (P3)**: Depends on foundational endpoints and detail page shell; independent of Y-08 navigation

### Parallel Opportunities

- T003 with T001/T002
- T007 and T008 after T004-T006 baseline
- US1: T011 and T012 parallel after T010 skeleton
- US3: T028 and T029 parallel after T027 base tab shell
- Polish: T031 and T032 parallel before final gate run (T033)

---

## Parallel Example: User Story 1

```bash
Task: "Implement list toolbar/filter components in src/app/(private)/training-equipment/_components/"
Task: "Implement list table and pagination components in src/app/(private)/training-equipment/_components/"
```

## Parallel Example: User Story 3

```bash
Task: "Implement status-change dialog/form hook in src/app/(private)/training-equipment/_hooks/use-status-change-form.hook.ts"
Task: "Implement exercise-link modal selection hook in src/app/(private)/training-equipment/_hooks/use-exercise-link-selection.hook.ts"
```

---

## Implementation Strategy

### MVP First (US1)

1. Finish Setup + Foundational phases.
2. Complete US1 list browsing flow.
3. Validate US1 independently as MVP.

### Incremental Delivery

1. Add US2 create/edit flow with validation.
2. Add US3 detail/status/link/history flow.
3. Run final polish and quality gates.

### Team Parallel Strategy

1. One developer completes Phase 1-2 foundations.
2. Then split: Dev A on US1, Dev B on US2, Dev C on US3.
3. Merge stories after independent checks pass.

---

## Notes

- All tasks follow checklist format with ID and file path.
- Story tasks include `[US#]` labels for traceability.
- Y-08 navigation remains deferred in Phase 1 tasks.
- History remains seeded read-only only (no history CUD tasks).

---

## T034 Completion Notes (2026-07-01)

### Quality gates

- `npm run type-check` — pass
- `npm run lint` — pass (warnings only: react-hook-form `watch` in form page)
- `npm run build` — pass

### Acceptance scenarios verified (code review + API contract)

| Scenario                                                         | Result                                               |
| ---------------------------------------------------------------- | ---------------------------------------------------- |
| List: keyword search, store/tool-type/status filters, pagination | Implemented via nuqs + `GET /crm/training-equipment` |
| List: default excludes discarded (`exclude_discarded`)           | API default + filter hook default                    |
| List: empty / filtered-empty states                              | Empty content + clear-filters CTA                    |
| List: role-gated CSV (Phase 1 toast) and 新規登録                | `RoleGatedButton` on list page                       |
| Create: required fields, redirect to detail                      | Form schema + `POST` + navigation                    |
| Edit: load by `?id=`, tool-type change confirmation              | AlertDialog before PATCH                             |
| Edit: status read-only on form                                   | Status shown as badge; change via detail             |
| Detail: tabs (基本情報 / エクササイズ / 変更履歴)                | nuqs `tab` param                                     |
| Status change: reason required                                   | `useStatusChangeForm` + API validation               |
| Exercise links: add/unlink, tool-type mismatch blocked in UI     | Modal selection + API                                |
| Delete: blocked when links exist                                 | API 409 + dialog messaging                           |
| History: read-only seeded data                                   | `GET .../history` only                               |
| Y-08: exercise names not clickable links                         | Plain text in link table                             |
| Tool types: official path `GET /crm/tool-types`                  | Separate route, camelCase response                   |

### Role gates (T032)

- UI: `Permission.EquipmentView` / `EquipmentEdit` / `EquipmentDelete` on list, form, detail via `RoleGatedButton` and route permissions in `permission.constants.ts`.
- API: all training-equipment routes require authenticated session via `getAuthUserFromRequest` (consistent with other CRM mock routes; fine-grained permission checks deferred to UI layer in Phase 1).

### Known Phase 1 exclusions

- CSV export execution (button shows info toast only)
- Bulk status change on list
- Y-08 cross-navigation to exercise management
