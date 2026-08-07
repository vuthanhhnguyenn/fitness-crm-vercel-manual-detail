# Tasks: FR-007 予約一覧・詳細表示 (Lesson Reservation)

**Input**: Design documents from `specs/006-lesson-reservation-spec/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/lesson-reservations.openapi.yaml, quickstart.md

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on other tasks in the same phase)
- **[Story]**: Maps to user story from spec.md (US1–US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared schema, route registration, and seed data that all phases depend on.

- [x] T001 Create `src/app/api/_schemas/lesson-reservation.schema.ts` with all Zod schemas for reservations, studio spaces, memos, member search, change/cancel requests, and error responses (map from data-model.md entities and contracts/lesson-reservations.openapi.yaml schemas)
- [x] T002 [P] Register all 14 reservation API route imports in `src/app/api/_routes/index.ts` under the `LessonReservations` section (lesson-schedules/[scheduleId]/\* endpoints)
- [x] T003 [P] Extend `src/app/api/_mock-db.ts` with reservation seed data: at least 3 stores, 5+ sessions with varying reservation counts, all 5 statuses, members with penalty/zero-remaining edge cases, studio space layouts, instructor data, and session memo examples

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core page structure that MUST be complete before ANY user story can be implemented.

- [x] T004 Create the reservation list API route handler at `src/app/api/crm/lesson-schedules/[scheduleId]/reservations/route.ts` (GET with pagination/sorting, POST to add reservation) using `registerRoute` pattern from existing routes
- [x] T005 [P] Create reservation stats API route handler at `src/app/api/crm/lesson-schedules/[scheduleId]/reservations/stats/route.ts` (GET returning ReservationStatsResponse)
- [x] T006 [P] Create studio spaces API route handler at `src/app/api/crm/lesson-schedules/[scheduleId]/spaces/route.ts` (GET returning StudioSpaceGridResponse)
- [x] T007 [P] Create member search API route handler at `src/app/api/crm/lesson-schedules/[scheduleId]/members/search/route.ts` (GET with `q` query param returning MemberSearchResponse)
- [x] T008 [P] Create cancel reservation API route handler at `src/app/api/crm/lesson-schedules/[scheduleId]/reservations/[reservationId]/cancel/route.ts` (POST returning CancelReservationResponse)
- [x] T009 [P] Create attendance update API route handler at `src/app/api/crm/lesson-schedules/[scheduleId]/reservations/[reservationId]/attendance/route.ts` (PATCH returning Reservation)
- [x] T010 [P] Create instructor change API route handler at `src/app/api/crm/lesson-schedules/[scheduleId]/instructor/change/route.ts` (PATCH returning ChangeResponse)
- [x] T011 [P] Create time change API route handler at `src/app/api/crm/lesson-schedules/[scheduleId]/time/change/route.ts` (PATCH returning ChangeResponse)
- [x] T012 [P] Create studio change API route handler at `src/app/api/crm/lesson-schedules/[scheduleId]/studio/change/route.ts` (PATCH returning ChangeResponse)
- [x] T013 [P] Create cancel lesson API route handler at `src/app/api/crm/lesson-schedules/[scheduleId]/cancel/route.ts` (POST returning CancelLessonResponse)
- [x] T014 [P] Create memos API route handler at `src/app/api/crm/lesson-schedules/[scheduleId]/memos/route.ts` (GET list, POST create)
- [x] T015 [P] Create memo delete API route handler at `src/app/api/crm/lesson-schedules/[scheduleId]/memos/[memoId]/route.ts` (DELETE)
- [x] T016 Create the private route page at `src/app/(private)/lesson-schedules/[scheduleId]/reservations/page.tsx` with parallel data fetching skeleton layout using `DataStateBoundary` wrappers for each section

**Checkpoint**: All mock API routes and page shell are ready — user story implementation can begin.

---

## Phase 3: User Story 1 — View Reservation Detail and Space Grid (Priority: P1) 🎯 MVP

**Goal**: Staff/Trainer selects a session from the schedule list and sees the full reservation detail page with metadata header, space grid, reservation list table, and stats panel.

**Independent Test**: Navigate to `/lesson-schedules/[scheduleId]/reservations` and verify header (name, date, time, studio, instructors), color-coded space grid with legend, reservation list table with sortable columns (No, member name, plan type, space number, date, status, attendance, cancel), right sidebar stats panel with bar charts, pagination when > 7 reservations, reserved cell popover, and "予約者はいません" empty state.

- [x] T017 [P] [US1] Create `lesson-header.tsx` in `src/app/(private)/lesson-schedules/[scheduleId]/reservations/_components/` — displays session name, date (with day of week), time range, studio name, instructor names with profile photos, breadcrumb link "予約管理に戻る", remaining seats count, and "中止済み" badge for cancelled sessions
- [x] T018 [P] [US1] Create `space-reservation-grid.tsx` in `_components/` — renders a dynamic grid from studio space data with color-coded cells: blue (reserved), white/green (available), orange (equipment), grey (fixed_structure). Each cell shows space number. Handles clicking reserved cells to open `space-cell-popover` and clicking available cells to open add-reservation dialog
- [x] T019 [P] [US1] Create `grid-legend.tsx` in `_components/` — displays color code legend below the space grid with labels for each space type
- [x] T020 [P] [US1] Create `space-cell-popover.tsx` in `_components/` — popover on reserved grid cells showing member name, "会員詳細" button (navigates to member detail), "予約取消" button (opens cancel dialog)
- [x] T021 [P] [US1] Create `reservation-list-columns.tsx` in `_components/` — defines DataTable column configuration with sortable columns: sequence number, member name (clickable -> profile popover), plan type, space number, reservation date/time, status (color-coded badge), attendance status (dropdown), cancel action button. Includes penalty/remaining-count badges and red row tint
- [x] T022 [US1] Create `reservation-list-table.tsx` in `_components/` — wraps DataTable with reservation list columns, pagination controls (7 per page, "1-7 / N件" display, page numbers, prev/next), URL-synced page state via nuqs, and "予約者はいません" empty state
- [x] T023 [P] [US1] Create `reservation-stats-panel.tsx` in `_components/` — renders right sidebar with lesson info card (name, date, time, studio, instructors, capacity, reservation count, recurrence) and statistics panel showing bar chart with count and percentage for each of the 5 statuses
- [x] T024 [P] [US1] Create `reservation-page-layout.tsx` in `_components/` — composes all US1 components in the page layout: left-column header + grid + list table, right-column sidebar with info + stats, uses `DataStateBoundary` + skeleton placeholders for each section

**Checkpoint**: Reservation detail page renders completely with header, grid, list table, and stats panel. Navigation from schedule list works. MVP is ready.

---

## Phase 4: User Story 2 — Add a Manual Reservation (Priority: P1)

**Goal**: Staff/Trainer opens the add-reservation dialog from the "予約を追加" button or by clicking an available grid cell, searches for a member, and adds them to the session.

**Independent Test**: Click "予約を追加" or an available grid cell, confirm dialog opens with session info. Search a member by name, verify results table. Select a member with 0 remaining sessions — confirm warning and blocked addition. Select a member with active penalty — confirm warning and blocked addition. Select an eligible member — confirm they appear in "追加予定" list. Confirm with "追加確定（N名）" — verify dialog closes and reservation appears in list.

- [x] T025 [P] [US2] Create `add-reservation-member-search.tsx` in `_components/` — member search input with debounced API query to `/api/crm/lesson-schedules/[scheduleId]/members/search`, displays results table (ID, name, remaining sessions, penalty status), handles empty results with "該当する会員が見つかりません"
- [x] T026 [P] [US2] Create `add-reservation-dialog.tsx` in `_components/` — dialog with session info header (date, time, lesson name, remaining seats), member search and selection, "追加予定" chip list for selected members, remaining seats decrement, "予約確定通知を送信する" toggle, "追加確定（N名）" confirm button. Validates: remaining sessions > 0 (else "残回数が不足しています"), no active penalty (else "予約不可期間中の会員です（〇月〇日まで）"). Disabled confirm when no members selected or seats exhausted

**Checkpoint**: Manual reservation flow works end-to-end. Dialog validates business rules (penalty, remaining count). New reservations appear in the list.

---

## Phase 5: User Story 3 — Cancel or Change a Session (Priority: P2)

**Goal**: Staff/Trainer performs session modifications: cancel individual reservations (3 cancel types), change instructor/time/studio via dialogs, or cancel the entire lesson via 3-step wizard.

**Independent Test**: Cancel individual reservation — select cancel type, confirm, verify list updates. Change instructor — search/replace instructor, enter reason, confirm success. Change time — enter new times, enter reason, confirm. Change studio — search/select new studio, enter reason, confirm. Cancel lesson — step through 3-step wizard with scope/reason/confirmation, verify "中止済み" state with badge, status card, disabled change dropdown, and "中止を取り消す" button.

- [x] T027 [P] [US3] Create `cancel-reservation-dialog.tsx` in `_components/` — dialog with member info display, 3 cancel type radio buttons (会員によるキャンセル / スタッフによるキャンセル / 指導者都合のキャンセル) each with consequence description, "キャンセル通知を送信する" checkbox, "キャンセルを確定" confirm button. Posts to `/api/crm/lesson-schedules/[scheduleId]/reservations/[reservationId]/cancel`
- [x] T028 [P] [US3] Create `change-instructor-dialog.tsx` in `_components/` — dialog with current instructor display, searchable instructor list (name/specialty) with photo, multi-select chip interface, "通知する" checkbox, required change reason textarea, impact summary panel. Patches `/api/crm/lesson-schedules/[scheduleId]/instructor/change`
- [x] T029 [P] [US3] Create `change-time-dialog.tsx` in `_components/` — dialog with current time display, start/end time inputs, studio conflict warning, "通知する" checkbox, required change reason textarea, impact summary. Patches `/api/crm/lesson-schedules/[scheduleId]/time/change`
- [x] T030 [P] [US3] Create `change-studio-dialog.tsx` in `_components/` — dialog with current studio display, searchable studio list with capacity badge, layout change warning, "通知する" checkbox, required change reason textarea, impact summary. Patches `/api/crm/lesson-schedules/[scheduleId]/studio/change`
- [x] T031 [P] [US3] Create `cancel-lesson-wizard.tsx` in `_components/` — 3-step cancellation wizard: Step 1 (impact confirmation — affected reservations count, notification count, refund amount; scope: "この回のみ" / "以降すべて"), Step 2 (reason — predefined reason select, detail textarea, notification/refund/instructor-notification toggles), Step 3 (final confirmation summary). Confirms via POST to `/api/crm/lesson-schedules/[scheduleId]/cancel`. Displays "中止済み" state on completion. Wizard resets to Step 1 if closed midway

**Checkpoint**: All session modification dialogs work. Lesson cancellation shows correct "中止済み" state with disabled change actions.

---

## Phase 6: User Story 4 — View Member Limited Profile (Priority: P3)

**Goal**: Staff/Trainer clicks a member name in the reservation list and sees a limited profile popover with fitness-relevant data (no protected personal data).

**Independent Test**: Click a member name in the reservation list — confirm popover shows avatar, name, age, gender, visit frequency, last visit, lesson history with attendance badges, body data (height/weight/body fat %), plan type, remaining sessions. Confirm no address/phone/email/payment info. Confirm "会員詳細を見る" navigates to member detail. Confirm "ペナルティ中" badge and red row tint for penalized members.

- [x] T032 [P] [US4] Create `member-limited-profile-popover.tsx` in `_components/` — popover component triggered by clicking member name in the list. Displays: initial avatar, name, age, gender, visit frequency, last visit date, lesson history (own sessions with attendance badges), body data (height, weight, body fat %), plan type, remaining session count. Links to member detail page via "会員詳細を見る". Explicitly excludes protected personal data (address, phone, email, contract/payment info). Fetches limited profile data from a dedicated mock API endpoint (can reuse existing member API or add a lightweight limited-profile endpoint)

**Checkpoint**: Member profile popover renders complete limited data. Privacy rules enforced. Navigation to member detail works.

---

## Phase 7: User Story 5 — Record and Manage Session Memos (Priority: P3)

**Goal**: Trainer records session notes and can delete erroneous entries.

**Independent Test**: View the "セッションメモ" card in the right sidebar — confirm existing memos show date, author name, content, delete button. Type content in textarea, click "メモを保存" — confirm memo is saved and appears. Click delete button on a memo — confirm it is removed.

- [x] T033 [P] [US5] Create `session-memo-card.tsx` in `_components/` — card component in the right sidebar showing existing memos (date, author name, content, Trash2 delete button), input textarea with placeholder text, "メモを保存" button. Fetches memos from GET `/api/crm/lesson-schedules/[scheduleId]/memos`, creates via POST, deletes via DELETE

**Checkpoint**: Session memos are fully functional — create, read, delete.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Code generation, type safety, and quality gates.

- [x] T034 [P] Run `npm run generate-routes` to register `/lesson-schedules/[scheduleId]/reservations` in `src/lib/routes/routes.config.ts`
- [ ] T035 [P] Run `npm run generate-openapi` and `npm run generate-client` to regenerate OpenAPI spec and React Query option factories in `src/lib/api/`
- [x] T036 Run `npm run type-check` and fix any TypeScript errors
- [x] T037 Run `npm run lint` and fix any ESLint violations
- [ ] T038 Run through all quickstart.md manual verification steps and confirm each user story is independently testable

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — starts first
- **Foundational (Phase 2)**: Depends on Setup — blocks all user stories
- **US1 — View Detail (Phase 3)**: Depends on Foundational — MVP, no story deps
- **US2 — Add Reservation (Phase 4)**: Depends on Foundational + US1 (needs reservation list to show new entries)
- **US3 — Cancel/Change (Phase 5)**: Depends on Foundational + US1 (needs reservation list to modify entries)
- **US4 — Member Profile (Phase 6)**: Depends on Foundational + US1 (needs list with member name links)
- **US5 — Session Memos (Phase 7)**: Depends on Foundational + US1 (needs right sidebar panel)
- **Polish (Phase 8)**: Depends on all prior phases complete

### User Story Dependencies

| Story | Priority | Depends On | Independently Testable |
| ----- | -------- | ---------- | ---------------------- |
| US1   | P1       | Phase 1+2  | Yes — core page load   |
| US2   | P1       | US1        | Yes — dialog only      |
| US3   | P2       | US1        | Yes — dialogs only     |
| US4   | P3       | US1        | Yes — popover only     |
| US5   | P3       | US1        | Yes — sidebar card     |

### Within Each User Story

- API route handlers (Phase 2) before feature components
- Independent components marked [P] can be built in parallel
- Dialogs (US2, US3) integrate into reservation page layout after built

### Parallel Opportunities

- All Phase 1 `[P]` tasks can run in parallel (T002, T003)
- All Phase 2 mock API route handler tasks marked `[P]` can run in parallel (T005–T015)
- Within each user story phase, all `[P]` components can be built in parallel
- US4 and US5 can run in parallel with each other (both depend on US1 only, not on each other)

---

## Parallel Example: User Story 1

```bash
# Launch all US1 components together:
Task: "Create lesson-header.tsx (T017)"
Task: "Create space-reservation-grid.tsx (T018)"
Task: "Create grid-legend.tsx (T019)"
Task: "Create space-cell-popover.tsx (T020)"
Task: "Create reservation-list-columns.tsx (T021)"
Task: "Create reservation-stats-panel.tsx (T023)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (API routes + page shell)
3. Complete Phase 3: User Story 1 (header, grid, list, stats)
4. **STOP and VALIDATE**: Navigate `/lesson-schedules/LS001/reservations`, verify all sections render
5. Deploy/demo if ready — this is the MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → MVP: reservation detail page with header, grid, list, stats
3. Add US2 → Add reservation dialog
4. Add US3 → Cancel/change dialogs
5. Add US4 → Member profile popover
6. Add US5 → Session memos
7. Polish → Code generation, quality gates

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done, US1 is the critical path (must be first)
3. After US1:
   - Developer A: US2 (Add reservation — P1, high priority)
   - Developer B: US3 (Cancel/change — P2)
   - Developer C: US4 + US5 (P3 — both can be done sequentially or split)

---

## Notes

- 38 total tasks across 8 phases
- 5 user stories mapped from spec.md
- No automated test tasks (not requested in spec; manual verification follows quickstart.md)
- US1 is the MVP — everything else is incremental
- [P] tasks = different files, no dependencies between them
- [Story] label maps task to specific user story for traceability
- All tasks include exact file paths
- Mock API routes (Phase 2) use `registerRoute` pattern matching existing conventions
