# Tasks: FR-003 Lesson Content Master Detail Display (D-02)

**Input**: Design documents from `/specs/008-lesson-content-detail/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Contract tests ARE requested for this feature (plan.md "Testing: Contract tests for each new mock route (happy path + ≥1 error/not-found path)" and the Definition of Done in all three contract files). Contract test tasks are therefore included in the Foundational phase, alongside the mock routes they verify.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Next.js 16 App Router web app. The detail screen is colocated under `src/app/(private)/lessons/[id]/`; Phase 1 mock API under `src/app/api/crm/lesson-contents/[id]/`. Generated client at `src/lib/api/` (never hand-edited). Permissions live in `src/types/permission.type.ts` + `src/lib/permission.config.ts`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the colocated `[id]` folder structure and detail-only constants for the detail screen.

- [ ] T001 Create the detail route folder structure: `src/app/(private)/lessons/[id]/_components/`, `src/app/(private)/lessons/[id]/_hooks/`, and `src/app/(private)/lessons/[id]/_constants/` (placeholder/ready for the files below)
- [ ] T002 [P] Create `src/app/(private)/lessons/[id]/_constants/constants.ts` with detail-only label maps: status tone map (active/inactive), lesson-type badge label + style (studio / personal / bodycare), time-row label selector (実施時間 vs セッション時間), history action labels, and a capacity-tone helper (full → destructive, ≥80% → warning, >0 → success, 0 → muted) per data-model.md / research D6

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Install the D-02 permission set, stand up the Phase 1 mock data/schemas/routes, regenerate the client, add contract tests, and create the shared nav hook. ALL user stories depend on this phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete (permissions gate US3/US4; data fetching and URL state are shared by all stories).

- [ ] T003 Add the D-02 `Permission` enum entries to `src/types/permission.type.ts`: `LessonContentsView = 'lesson-contents.view'`, `LessonContentsCreate = 'lesson-contents.create'`, `LessonContentsEdit = 'lesson-contents.edit'`, `LessonContentsDelete = 'lesson-contents.delete'`, `LessonContentsHistoryView = 'lesson-contents.history-view'` (do NOT reuse the existing D-01 `Lessons*` permissions — research D3)
- [ ] T004 Update `src/lib/permission.config.ts`: add `PAGE_PERMISSIONS` for `/lessons` + `/lessons/:id` → `LessonContentsView` and `/lessons/create` → `LessonContentsCreate`; add `ROLE_PERMISSIONS` grants — `Headquarter` gets all five, `Manager`/`Staff`/`Trainer`/`Observer` get `LessonContentsView` only (`System` inherits all). Map per the data-model grant table (depends on T003)
- [ ] T005 Enrich `src/app/api/_mock-db.ts` with a detail layer over the existing `lessonContents` / `personalPlans` collections: add `getDetail(id)` returning the full `LessonContentDetail` shape (images, description, internal_memo, restriction set, duration, pricing_type/per_use_fee, status, lesson_type, usage_count, schedule_total, store_id, timestamps), plus new `lessonContentSchedules` (recurring_patterns + sessions keyed by master id) and `lessonContentHistory` (change-log entries keyed by master id) collections. Seed ≥ 3 stores including: a studio record, a personal (`PLN-*`) record, an inactive/soft-deleted record, an in-use (`usage_count > 0`) record, an unused (`usage_count === 0`) record, a pay-per-use (`pricing_type: 'paid'`) record, a no-restriction record, and a multi-instructor schedule (Principle II / research D10 / quickstart step 1)
- [ ] T006 Create `src/app/api/_schemas/lesson-content-detail.schema.ts` with Zod schemas: `LessonImageSchema`, `RestrictionSetSchema`, `LessonContentDetailSchema`, `InstructorRefSchema`, `RecurringPatternSchema`, `ScheduleSessionSchema`, `ScheduleSummarySchema`, `ChangeHistoryEntrySchema`, `ChangeHistorySchema`, and the three response wrappers `GetLessonContentDetailResponseSchema` / `GetLessonContentSchedulesResponseSchema` / `GetLessonContentHistoryResponseSchema`. Reuse `LessonBrandSchema`, `LessonContentStatusSchema`, `LessonPricingTypeSchema` from `src/app/api/_schemas/lesson-content.schema.ts`; per_use_fee non-null only for `pricing_type: 'paid'` (data-model.md)
- [ ] T007 [P] Create `src/app/api/crm/lesson-contents/[id]/route.ts` — `registerRoute()` + `GET` resolving `id` against `lessonContents` (`LSN-*`) then `personalPlans` (`PLN-*`), returning `{ data }` as `GetLessonContentDetailResponse`, with a 404 branch (`{ "error": "Lesson content not found" }`) and 500 fallback (contract `get-lesson-content-detail.md`)
- [ ] T008 [P] Create `src/app/api/crm/lesson-contents/[id]/schedules/route.ts` — `registerRoute()` + `GET` returning `{ data: { recurring_patterns, sessions, total } }`, empty arrays + `total: 0` when none, 404 on unknown id (contract `get-lesson-content-schedules.md`)
- [ ] T009 [P] Create `src/app/api/crm/lesson-contents/[id]/history/route.ts` — `registerRoute()` + `GET` returning `{ data: { entries, total } }` newest-first, `detail` nullable, empty list when none, 404 on unknown id (contract `get-lesson-content-history.md`)
- [ ] T010 Register the three new routes in `src/app/api/_routes/index.ts` by importing `crm/lesson-contents/[id]/route`, `.../[id]/schedules/route`, and `.../[id]/history/route` (depends on T007, T008, T009)
- [ ] T011 Run `npm run generate-client` to regenerate `src/lib/api/types.gen.ts` and `src/lib/api/@tanstack/react-query.gen.ts`; verify the `getLessonContentsById` (detail), schedules, and history option-factories + query keys + types are emitted — do not hand-edit `src/lib/api/` (depends on T005, T006, T007, T008, T009, T010)
- [ ] T012 [P] Contract test for `GET /api/crm/lesson-contents/{id}` in `src/app/api/crm/lesson-contents/[id]/route.test.ts` covering: happy path studio (`lesson_type: 'studio'` + images), happy path personal (`PLN-*` → `lesson_type: 'personal'`), pay-per-use (non-null `per_use_fee`), inactive (`status: 'inactive'`), in-use vs unused (`usage_count`), and 404 on unknown id (contract Definition of Done)
- [ ] T013 [P] Contract test for `GET /api/crm/lesson-contents/{id}/schedules` in `src/app/api/crm/lesson-contents/[id]/schedules/route.test.ts` covering: happy path (patterns + sessions + correct `total`), multi-instructor (`instructors.length > 1`), empty (`recurring_patterns: []`, `sessions: []`, `total: 0`), and 404 on unknown id
- [ ] T014 [P] Contract test for `GET /api/crm/lesson-contents/{id}/history` in `src/app/api/crm/lesson-contents/[id]/history/route.test.ts` covering: happy path (entries newest-first + correct `total`), null `detail` on a 作成 entry, empty (`entries: []`, `total: 0`), and 404 on unknown id
- [ ] T015 Create `src/app/(private)/lessons/[id]/_hooks/use-lesson-detail-nav.ts` — nuqs/search-param helpers for the active `tab` (`parseAsStringEnum<'info'|'history'>`, default `info`) and `from` context (`parseAsStringEnum<'schedule'>`, optional), with `tab=history` coerced to `info` when `!canViewHistory` (data-model DetailNavState / research D8)

**Checkpoint**: Permissions installed, mock endpoints return seeded data, client hooks generated + tested, and shared URL state exists — user stories can now begin.

---

## Phase 3: User Story 1 - View a lesson content master in read-only detail (Priority: P1) 🎯 MVP

**Goal**: Replace the `/lessons/[id]` placeholder with a read-only detail screen: loading skeleton, error/not-found state, a `PageHeader` (back link + lesson name + status badge + lesson-type badge), and a Basic Info tab rendering the read-only text cards (description, basic info, restrictions & pricing, internal memo).

**Independent Test**: Open `/lessons/[id]` for a studio record and a `PLN-*` record; confirm the title, 有効 status badge, lesson-type badge, description, basic-info (実施時間 vs セッション時間), restrictions/pricing (制限なし when empty; per-use fee only for 有料（都次）), and internal-memo card all render read-only; confirm the skeleton on load and a not-found state for an unknown id; confirm the back link returns to `/lessons`.

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create `src/app/(private)/lessons/[id]/_components/lesson-detail-skeleton.tsx` — loading skeleton mirroring the header + two-column card layout (FR-003-P1-22)
- [ ] T017 [P] [US1] Create `src/app/(private)/lessons/[id]/_components/lesson-description-card.tsx` — read-only "レッスン内容説明" card from `detail.description` (FR-003-P1-06)
- [ ] T018 [P] [US1] Create `src/app/(private)/lessons/[id]/_components/lesson-basic-info-card.tsx` — "基本情報" card (ID, lesson type, brand, time row labeled 実施時間/セッション時間 via `_constants`, pricing type) (FR-003-P1-03)
- [ ] T019 [P] [US1] Create `src/app/(private)/lessons/[id]/_components/lesson-restriction-card.tsx` — "制限・料金" card showing restricted main/option contracts (or 制限なし when empty) and the per-use fee row only when `pricing_type === 'paid'` (FR-003-P1-04)
- [ ] T020 [P] [US1] Create `src/app/(private)/lessons/[id]/_components/lesson-internal-memo-card.tsx` — "内部メモ・備考" card labeled "会員には非表示" (FR-003-P1-07)
- [ ] T021 [US1] Create `src/app/(private)/lessons/[id]/_components/lesson-info-tab.tsx` — Basic Info tab two-column flex orchestration: left column (`flex-1`) hosts the description card; right column (`360px`) hosts basic-info, restriction, and internal-memo cards (image gallery, status card, and recent-schedule card are added in later stories) (depends on T017, T018, T019, T020)
- [ ] T022 [US1] Replace `src/app/(private)/lessons/[id]/page.tsx` (the 準備中 placeholder) with a `'use client'` detail page: read `id` via `useParams`, `useQuery` via the generated detail option-factory, render `LessonDetailSkeleton` while loading, `DataStateBoundary` for error/not-found (FR-003-P1-23), then `PageHeader` (back link via `navigate()` honoring `from` from the nav hook → `/lessons` or schedule context, lesson name title, 有効/無効 status badge, lesson-type badge) and shadcn `Tabs` (default `info`) containing `LessonInfoTab` (FR-003-P1-01/02/19/20; depends on T015, T016, T021)

**Checkpoint**: `/lessons/[id]` renders the read-only detail with header, badges, skeleton, error/not-found, and back navigation. MVP is functional.

---

## Phase 4: User Story 2 - Browse lesson images and recent schedules (Priority: P1)

**Goal**: Add the interactive image gallery (thumbnails, counter, prev/next), the recent-schedule card (top 3 + total badge), and the "show all" schedule `Sheet` (recurring summary with multi-instructor links + per-session list with capacity color coding), wiring schedule-row and instructor navigation.

**Independent Test**: Click thumbnails and prev/next arrows (arrows hidden for single-image); confirm the main image + counter update; view the top-3 recent schedules + total badge; click "全{n}件を表示" to open the sheet; confirm the recurring summary, instructor links, and full session list with capacity coloring; click a schedule row → reservation screen and an instructor → D-04 master.

### Implementation for User Story 2

- [ ] T023 [P] [US2] Create `src/app/(private)/lessons/[id]/_components/lesson-image-gallery.tsx` — main image + caption + position counter, prev/next navigation (wrapping; arrows only when image count > 1), thumbnail grid with "メイン" marker, all images via `next/image` (FR-003-P1-05 / edge case single-image)
- [ ] T024 [P] [US2] Create `src/app/(private)/lessons/[id]/_components/lesson-recent-schedule-card.tsx` — "直近のスケジュール" card: `useQuery` via the generated schedules option-factory, top 3 sessions (date/time, studio, booked/capacity with capacity-tone helper) + total badge, "全{n}件を表示" trigger, and row click → `/lesson-schedules/[id]/reservations` via `navigate()` (FR-003-P1-08/10)
- [ ] T025 [US2] Create `src/app/(private)/lessons/[id]/_components/lesson-schedule-sheet.tsx` — shadcn `Sheet` showing the recurring-pattern summary (days/time/studio/period + `instructors[]` rendered as link(s) to the D-04 instructor master, multi-instructor n名) and the full per-session list with capacity color coding; footer "スケジュールを追加" → `/lesson-schedules/create`; session row → reservation; reuses the schedules query from T024 (FR-003-P1-09/09a/10)
- [ ] T026 [US2] Integrate `LessonImageGallery` into the left column and `LessonRecentScheduleCard` + `LessonScheduleSheet` into the right column of `src/app/(private)/lessons/[id]/_components/lesson-info-tab.tsx` (depends on T023, T024, T025)

**Checkpoint**: Image browsing, recent-schedule card, the all-schedules sheet, instructor links, and schedule navigation all work on top of the US1 detail screen.

---

## Phase 5: User Story 3 - Perform master management actions as Headquarter/System (Priority: P1)

**Goal**: Add the role-gated header actions (Edit / Duplicate / Delete) and the role-gated 変更履歴 (Change History) tab, gated via the D-02 permission set so only Headquarter/System see them active/visible.

**Independent Test**: As Headquarter/System, confirm Edit/Duplicate/Delete buttons are active (Edit → edit form, Duplicate → create-as-copy) and the 変更履歴 tab is visible with the change-log table + total footer; as Manager/Staff/Trainer/Observer, confirm the buttons are disabled with a permission tooltip and the history tab is absent.

### Implementation for User Story 3

- [ ] T027 [P] [US3] Create `src/app/(private)/lessons/[id]/_components/lesson-detail-header-actions.tsx` — `RoleGatedButton` Delete (`requiredPermission={Permission.LessonContentsDelete}`), Duplicate (`LessonContentsCreate` → `/lessons/create?copyFrom={id}`), Edit (`LessonContentsEdit` → lesson edit form, variant by lesson type) via `navigate()`; disabled-with-tooltip for non-privileged roles (FR-003-P1-11/12/17)
- [ ] T028 [P] [US3] Create `src/app/(private)/lessons/[id]/_components/lesson-history-tab.tsx` — `useQuery` via the generated history option-factory, `enabled` only when `canViewHistory && tab === 'history'` (lazy), rendering a read-only shadcn `<Table>` (日時 / 操作者 / 操作 / 変更内容) with a total-count footer (FR-003-P1-18 / research D7)
- [ ] T029 [US3] Wire `LessonDetailHeaderActions` into the `PageHeader` actions slot in `src/app/(private)/lessons/[id]/page.tsx` (depends on T027)
- [ ] T030 [US3] Add the role-gated "変更履歴" `TabsTrigger` + `TabsContent` (rendered only when `canViewHistory` from `useAuthUser()` / `hasPermission(LessonContentsHistoryView)`) hosting `LessonHistoryTab` in `src/app/(private)/lessons/[id]/page.tsx`; ensure the nav hook coerces `tab=history` → `info` when not permitted (FR-003-P1-18; depends on T028, T015)

**Checkpoint**: Header management actions and the change-history tab are correctly permission-gated and functional on top of the US1/US2 screen.

---

## Phase 6: User Story 4 - Deactivate or delete a lesson content master (Priority: P2)

**Goal**: Add the right-column `StatusCard` with the role-gated 無効化/有効化 lifecycle control plus the deactivate and delete confirmation dialogs (reason required; delete blocked while in use). Phase 1 dialogs are UI-only (validate reason → toast → close; no backend write — research D9).

**Independent Test**: As Headquarter/System on an active master, click 無効化する → dialog requires a reason before confirm; on an inactive/soft-deleted master see 有効化する instead; open the delete dialog on an in-use record (blocking alert + disabled confirm + link to in-use schedules) and on an unused record (required reason + enabled confirm); confirm the in-use link closes the dialog and navigates to the schedule screen.

### Implementation for User Story 4

- [ ] T031 [P] [US4] Create `src/app/(private)/lessons/[id]/_components/lesson-deactivate-dialog.tsx` — `AlertDialog` with a required reason textarea (max 1000), explanatory copy (existing reservations remain valid; re-activation possible), Cancel / 無効化する (or 有効化する for re-activation) actions; UI-only confirm (validate → `sonner` toast → close) (FR-003-P1-14 / research D9)
- [ ] T032 [P] [US4] Create `src/app/(private)/lessons/[id]/_components/lesson-delete-dialog.tsx` — `AlertDialog` reading `usage_count`: when `> 0` render destructive alert "このレッスンはスケジュールで使用中のため削除できません", disable confirm, show "使用中のスケジュールを確認 ({n}件)" link that closes + navigates to `/lesson-schedules`; when `=== 0` show a required delete-reason textarea + enabled confirm (UI-only) (FR-003-P1-15/16 / research D5)
- [ ] T033 [US4] Create `src/app/(private)/lessons/[id]/_components/lesson-status-card.tsx` — `common/status-card.tsx` `StatusCard` wrapper showing status tone/label/meta with a role-gated (`requiredPermission={Permission.LessonContentsDelete}`) lifecycle action: 無効化する when active / 有効化する when inactive, opening `LessonDeactivateDialog` (FR-003-P1-17/21; depends on T031)
- [ ] T034 [US4] Integrate `LessonStatusCard` at the top of the right column in `src/app/(private)/lessons/[id]/_components/lesson-info-tab.tsx`, and wire the header Delete action (from `LessonDetailHeaderActions`) to open `LessonDeleteDialog` (depends on T032, T033, T026)

**Checkpoint**: The full lifecycle UI (status card + deactivate/re-activate + delete-with-guard) works; all four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and final validation across all stories.

- [ ] T035 [P] Run `npm run lint` and resolve all errors across the new `lessons/[id]/` and `api/crm/lesson-contents/[id]/` files (and the edited permission files)
- [ ] T036 [P] Run `npx tsc --noEmit` and resolve all type errors (no `any`; components consume generated `types.gen.ts` directly — no local `.type.ts` view types)
- [ ] T037 Execute the `quickstart.md` manual verification table (SC-001 … SC-008, FR-003-P1-22/23) against `npm run dev` at `http://localhost:3000/lessons/LSN-0001` and a `PLN-*` id, across Headquarter/System and a non-privileged role

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (permissions gate US3/US4; data + nav state shared by all).
- **User Stories (Phase 3–6)**: All depend on Foundational completion.
  - US1 (P1) is the MVP scaffold (page, header, info-tab, read-only cards).
  - US2 (P1) extends the US1 info-tab (gallery + schedules).
  - US3 (P1) extends the US1 page (header actions + history tab).
  - US4 (P2) extends the US1/US2 info-tab + US3 header (status card + dialogs).
- **Polish (Phase 7)**: Depends on all desired user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational. Creates `page.tsx` + `lesson-info-tab.tsx` (the integration points later stories extend).
- **US2 (P1)**: Starts after US1 (edits `lesson-info-tab.tsx`). New components (T023–T025) are independent and can be built in parallel during US1.
- **US3 (P1)**: Starts after US1 (edits `page.tsx`). New components (T027, T028) are independent and can be built in parallel during US1/US2.
- **US4 (P2)**: Starts after US2 + US3 (edits `lesson-info-tab.tsx` for the status card and wires the header Delete action). Dialog components (T031, T032) are independent and can be built earlier.

### Within Each User Story

- Cards/components before the tab/page that composes them.
- Foundational schemas/routes before `generate-client`; `generate-client` before any component query.
- Permission enum (T003) before permission config (T004) before any `requiredPermission` gating (US3/US4).

### Parallel Opportunities

- T002 (constants) can run alongside Phase 1.
- T007, T008, T009 (the three route files) are parallel after T005 + T006.
- T012, T013, T014 (contract tests) are parallel after T011.
- US1 read-only cards T016–T020 are all parallel (different files).
- US2 components T023, T024 are parallel; US3 components T027, T028 are parallel; US4 dialogs T031, T032 are parallel.
- T035 and T036 (lint / tsc) are parallel.

---

## Parallel Example: Foundational mock routes

```bash
# After T005 (mock db) + T006 (schemas):
Task: "Create src/app/api/crm/lesson-contents/[id]/route.ts"            # T007
Task: "Create src/app/api/crm/lesson-contents/[id]/schedules/route.ts"  # T008
Task: "Create src/app/api/crm/lesson-contents/[id]/history/route.ts"    # T009

# After T011 (generate-client):
Task: "Contract test for GET /api/crm/lesson-contents/{id}"             # T012
Task: "Contract test for GET /api/crm/lesson-contents/{id}/schedules"   # T013
Task: "Contract test for GET /api/crm/lesson-contents/{id}/history"     # T014
```

## Parallel Example: User Story 1 read-only cards

```bash
Task: "Create lesson-detail-skeleton.tsx"     # T016
Task: "Create lesson-description-card.tsx"     # T017
Task: "Create lesson-basic-info-card.tsx"      # T018
Task: "Create lesson-restriction-card.tsx"     # T019
Task: "Create lesson-internal-memo-card.tsx"   # T020
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (permissions, mock data/schemas/routes, generate-client, contract tests, nav hook).
3. Complete Phase 3: User Story 1 (page + header + read-only cards + skeleton + error/not-found).
4. **STOP and VALIDATE**: Open `/lessons/[id]` (studio + `PLN-*`), confirm read-only render, skeleton, not-found, and back link.
5. Demo the read-only detail MVP.

### Incremental Delivery

1. Setup + Foundational → permission set, data layer, nav state ready.
2. US1 → read-only detail screen (MVP).
3. US2 → image gallery + recent schedules + all-schedules sheet.
4. US3 → role-gated header actions + change-history tab.
5. US4 → status card lifecycle + deactivate/delete dialogs.
6. Polish → lint, tsc, quickstart validation.

---

## Notes

- [P] tasks = different files, no dependencies.
- All user-visible labels in Japanese; identifiers/comments in English.
- Use `navigate()` from `@/lib/routes/routes.util` for all links — no raw `router.push` strings.
- Loading via `LessonDetailSkeleton`; error/not-found via `DataStateBoundary`; status block via `common/status-card.tsx`.
- Action gating via `RoleGatedButton requiredPermission={Permission.LessonContents*}` + `useAuthUser()` (D-02 set).
- Gallery images via `next/image` (Principle VI); history tab uses a plain `<Table>`.
- Gender/age/count restrictions are intentionally NOT rendered (Q2). Lifecycle dialogs are UI-only in Phase 1 (no backend write — research D9).
- No `any`; no global state store; URL state via nuqs only. Never hand-edit `src/lib/api/` — regenerate via `npm run generate-client`.

```

```
