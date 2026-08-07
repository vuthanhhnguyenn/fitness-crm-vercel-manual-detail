---
description: 'Task list for weekly schedule registration feature'
---

# Tasks: Weekly Schedule Registration & Publication Settings

**Input**: Design documents from `specs/weekly-schedule-create/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Not included — no test framework is configured in this project. Verification gates are `pnpm type-check` and `pnpm lint`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: All source under `src/` at repository root
- API mock routes under `src/app/api/crm/lesson-schedules/`
- Form page under `src/app/(private)/lesson-schedules/create/`
- Components under `src/app/(private)/lesson-schedules/_components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend mock API infrastructure with schemas, routes, and seed data for schedule creation.

- [x] T001 Extend `lesson-schedule.schema.ts` with `CreateLessonScheduleRequestSchema` in `src/app/api/_schemas/lesson-schedule.schema.ts`
- [x] T002 [P] Add studio master seed data (`SEED_STUDIOS`) with name, physical capacity, store_id in `src/app/api/_mock-db.ts`
- [x] T003 [P] Create POST `/api/crm/lesson-schedules/create` mock route handler in `src/app/api/crm/lesson-schedules/create/route.ts`
- [x] T004 Add schedule-creation helper to mock DB singleton in `src/app/api/_mock-db.ts`
- [x] T005 [P] Create template CRUD mock routes (GET/POST/DELETE) in `src/app/api/crm/lesson-schedules/templates/route.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared form infrastructure that all user stories depend on.

**⚠️ No user story work can begin until this phase is complete**

- [x] T006 Create `src/app/(private)/lesson-schedules/create/page.tsx` — page scaffold with route registration
- [x] T007 Create form validation schema in `src/app/(private)/lesson-schedules/_schemas/lesson-schedule-form.schema.ts`
- [x] T008 [P] Create shared form hook `use-lesson-schedule-form.hook.ts` (react-hook-form + zodResolver setup)
- [x] T009 [P] Create form-data-to-API mapper in `src/app/(private)/lesson-schedules/_schemas/lesson-schedule-form.mapper.ts`
- [x] T010 [P] Create form constants (lesson types, course types, repeat types, end conditions, capacities) in `src/app/(private)/lesson-schedules/_constants/constants.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Create Single Studio Lesson (Priority: P1) 🎯 MVP

**Goal**: A store staff member creates a one-time studio lesson schedule by selecting date/time, studio, lesson content, instructors, and capacity.

**Independent Test**: Select "単発" mode, fill required fields (date, time, studio, lesson, instructors, capacity), submit — success toast shown, navigated back to schedule list.

### Implementation

- [x] T011 [US1] Create `lesson-schedule-create-form.tsx` — main form wrapper component with step layout
- [x] T012 [P] [US1] Create `lesson-schedule-form-date-studio.tsx` — date picker, time input, store combobox, studio dropdown with physical capacity display
- [x] T013 [P] [US1] Create `lesson-schedule-form-lesson.tsx` — lesson combobox filtered by lesson class, with ID/duration reference in edit mode
- [x] T014 [P] [US1] Create `lesson-schedule-form-instructors.tsx` — multi-select chip combobox with instructor photo/name/role, filtered by role (インストラクター for studio)
- [x] T015 [P] [US1] Create `lesson-schedule-form-capacity.tsx` — numeric capacity input with physical capacity upper limit validation
- [x] T016 [US1] Create `use-create-lesson-schedule.hook.ts` — React Query mutation hook calling POST create route
- [x] T017 [US1] Wire form submission in `create/page.tsx` — validation, mutation call, success toast via sonner, navigate to schedule list

**Checkpoint**: Single studio lesson creation works end-to-end.

---

## Phase 4: User Story 3 — Create Personal Training Session (Priority: P1)

**Goal**: An instructor creates a personal training session with course type selection (30分/60分/体験), hiding studio/capacity fields.

**Independent Test**: Select "パーソナルトレーニング" as lesson class, verify studio/capacity hidden, course type dropdown visible, submit with course type.

### Implementation

- [ ] T018 [P] [US3] Add PT conditional logic to `lesson-schedule-form-date-studio.tsx` — hide studio selector, show course type dropdown when lesson_type=personal
- [ ] T019 [P] [US3] Add PT conditional logic to `lesson-schedule-form-capacity.tsx` — hide capacity field when lesson_type=personal
- [ ] T020 [P] [US3] Add PT instructor filtering to `lesson-schedule-form-instructors.tsx` — filter by トレーナー role for PT sessions
- [ ] T021 [US3] Add cross-field validation rules (course_type required for personal) to form schema

**Checkpoint**: Personal training session creation works independently.

---

## Phase 5: User Story 2 — Create Recurring Schedule Using Template (Priority: P1)

**Goal**: A staff member creates recurring schedules (weekly/biweekly/monthly) with template save/load.

**Independent Test**: Select "繰り返し" mode, configure weekly pattern with days and end condition, verify preview list, submit to create multiple schedules.

### Implementation

- [ ] T022 [P] [US2] Create `lesson-schedule-form-recurring.tsx` — repeat type dropdown, day toggle buttons (月火水木金土日), end condition radios (指定日まで/回数指定/無期限), holiday skip checkbox
- [ ] T023 [US2] Create `recurring-preview.tsx` — generated date list with date/day-of-week/time, summary bar, "さらに表示" load-more button
- [ ] T024 [US2] Create `template-popover.tsx` — template list popover with 読込 (load) and 削除 (delete) actions, + 現在の設定を保存 save dialog
- [ ] T025 [P] [US2] Add recurring-form to main create form — schedule mode toggle (単発/繰り返し) in the form
- [ ] T026 [US2] Create recurring date generation utility (generate dates from pattern, skip holidays) in `src/app/(private)/lesson-schedules/_utils/date-generation.util.ts`
- [ ] T027 [US2] Wire template API calls to `use-create-lesson-schedule.hook.ts` — load/save/delete templates
- [ ] T028 [US2] Add recurring validation rules to form schema (repeat_type required when recurring, end condition validation)

**Checkpoint**: Recurring schedule creation and template management works independently.

---

## Phase 6: User Story 4 — Configure Publication & Trial Settings (Priority: P2)

**Goal**: Staff configure public/private booking status and trial slots for studio lessons.

**Independent Test**: Toggle publication switch ON/OFF and verify label changes (モードA/モードB). Enable trial slots and configure mode/capacity.

### Implementation

- [ ] T029 [P] [US4] Create `lesson-schedule-form-publication.tsx` — publication Switch with mode labels (公開モードA / 非公開モードB), trial slot Switch, trial mode radios (内数/外数), trial capacity dropdown (1-5)
- [ ] T030 [P] [US4] Integrate publication component into main create form
- [ ] T031 [US4] Add trial validation rules to form schema (trial_mode and trial_capacity required when trial_enabled)

**Checkpoint**: Publication and trial settings work independently.

---

## Phase 7: User Story 6 — Instructor Conflict Detection (Priority: P2)

**Goal**: The system warns when a selected instructor already has an overlapping schedule.

**Independent Test**: Select an instructor already booked at the same day-of-week and time — conflict warning is displayed.

### Implementation

- [ ] T032 [P] [US6] Create `instructor-conflict-warning.tsx` — warning banner "{instructorName} は同日時に「{lessonName}」を担当しています"
- [ ] T033 [US6] Add conflict check integration to `lesson-schedule-form-instructors.tsx` — trigger check on instructor selection, display warning

**Checkpoint**: Instructor conflict detection works independently.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and edge-case handling that span multiple stories.

- [ ] T034 [P] Create `holiday-warning-banner.tsx` — yellow warning for store holidays: "{storeName}は{date}が休業日です。それでも登録しますか？"
- [ ] T035 [P] Create `use-unsaved-changes.hook.ts` — dirty state tracking, discard confirmation dialog "変更を破棄しますか？"
- [ ] T036 [P] Add holiday conflict warning integration to form — single mode (date-based) and recurring mode (count-based)
- [ ] T037 Add inline validation error scrolling (`use-scroll-to-first-error.hook.ts` pattern) — first invalid field scrolls into view on submit failure
- [ ] T038 Add recurring preview no-date guidance ("開始日を選択すると予定日が表示されます" / "曜日を選択すると予定日が表示されます")
- [ ] T039 [P] Add capacity guidance text ("スタジオを選択すると物理定員の上限が表示されます") when no studio is selected
- [x] T040 Run `pnpm type-check` and `pnpm lint` — fix all errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — MVP scope
- **US3 (Phase 4)**: Depends on Foundational, adds PT variant on top of US1 form structure
- **US2 (Phase 5)**: Depends on Foundational, adds recurring mode on top of US1 form
- **US4 (Phase 6)**: Depends on Foundational, integrates into form publication section
- **US6 (Phase 7)**: Depends on Foundational, integrates into instructor selector
- **Polish (Phase 8)**: Depends on all desired stories being complete

### User Story Dependencies

| Story    | Depends On | Independent                                            |
| -------- | ---------- | ------------------------------------------------------ |
| US1 (P1) | Phase 1+2  | ✅ Fully independent — single studio lesson            |
| US3 (P1) | Phase 1+2  | ✅ Independent — PT variant with different field set   |
| US2 (P1) | Phase 1+2  | ✅ Independent — recurring mode with templates         |
| US4 (P2) | Phase 1+2  | ✅ Independent — publication/trial toggle              |
| US6 (P2) | Phase 1+2  | ✅ Independent — conflict warning in instructor select |

### Within Each User Story

- Schema/models before components
- Components before integration/wiring
- Feature complete before moving to next priority

### Parallel Opportunities

- All Phase 1 tasks marked **[P]** can run in parallel
- All Phase 2 tasks marked **[P]** can run in parallel
- All user stories (Phases 3-7) are **independent** — can be implemented in parallel
- Within each story, **[P]** tasks can run in parallel

---

## Parallel Example: User Stories 3-7

```bash
# Launch all user stories in parallel (after Phase 1+2 complete):
Task: "Phase 3: US1 — Single Studio Lesson"
Task: "Phase 4: US3 — Personal Training Session"
Task: "Phase 5: US2 — Recurring Schedule"
Task: "Phase 6: US4 — Publication & Trial"
Task: "Phase 7: US6 — Instructor Conflict"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (single studio lesson creation)
4. **STOP and VALIDATE**: Test US1 independently — create a single studio lesson end-to-end
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (single studio lesson) → Test independently → Deploy/Demo (MVP!)
3. Add US3 (PT session) → Test independently → Deploy/Demo
4. Add US2 (recurring + templates) → Test independently → Deploy/Demo
5. Add US4 (publication/trial) → Test independently → Deploy/Demo
6. Add US6 (conflict detection) → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Single lesson)
   - Developer B: US3 (PT session) + US4 (Publication)
   - Developer C: US2 (Recurring + templates) + US6 (Conflicts)
3. Stories integrate into the same form but touch different sections

---

## Notes

- **[P]** tasks = different files, no dependencies
- **[Story]** label maps task to the specific user story
- Each user story is independently completable and testable
- No test tasks included — project has no test framework
- Verification gates: `pnpm type-check` and `pnpm lint`
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
