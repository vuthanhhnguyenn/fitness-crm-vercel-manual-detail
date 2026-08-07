# Tasks: Visit/Experience Management — Detail Page

**Input**: Design documents from `specs/003-visit-experience-detail/`  
**Branch**: `003-visit-experience-detail`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

---

## Format: `[ID] [P?] [Story?] Description — file path`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[US#]**: Which user story this task belongs to
- Tasks without a story label are Setup or Foundational

---

## Phase 1: Setup

**Purpose**: Create the new directory structure needed before any code is written.

- [x] T001 Create permit sub-route directory `src/app/api/crm/visit-experiences/[id]/permit/`

**Checkpoint**: Directory structure ready — foundational work can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, schemas, seed data, and the detail GET endpoint that every user story depends on. No user story work begins until this phase is complete.

**⚠️ CRITICAL**: All US1–US4 components import from these files. Complete in order T002 → T003 → T004/T005/T006 (last three can run in parallel).

- [x] T002 Append `VisitTimelineEntry`, `VisitExperienceDetail`, `PermitVisitExperienceResponse` interfaces to `src/types/api/visit-experience.type.ts` — full block in `data-model.md § TypeScript Type Additions`
- [x] T003 Append `VisitTimelineEntrySchema`, `VisitExperienceDetailSchema`, `PermitVisitExperienceResponseSchema` Zod schemas to `src/app/api/_schemas/visit-experience.schema.ts` — full block in `data-model.md § Zod Schema Additions`
- [x] T004 [P] Upgrade `src/app/api/_mock-db.ts`: (a) change `SEED_VISIT_EXPERIENCES` type from `VisitExperience[]` to `VisitExperienceDetail[]`; (b) add all detail fields to every existing seed record covering all 7 status states per `data-model.md § Mock DB Seed`; (c) add `update(id, record)` method to the `visitExperiences` collection
- [x] T005 [P] Upgrade `src/app/api/crm/visit-experiences/[id]/route.ts`: replace the "coming soon" stub with a full `GET` handler that returns `VisitExperienceDetail` — contract in `contracts/GET-visit-experience-detail.md`
- [x] T006 [P] Add `getCrmVisitExperienceDetailOptions(id: string)` to `src/lib/api/@tanstack/visit-experience.query.ts` — returns `VisitExperienceDetail`; mirrors the interface of what Phase 2 generated hooks will produce

**Checkpoint**: Foundation ready — all user stories can now be implemented. `GET /api/crm/visit-experiences/VE-001` must return the full `VisitExperienceDetail` shape before proceeding.

---

## Phase 3: User Story 1 — Review applicant info and issue visit permit (Priority: P1) 🎯 MVP

**Goal**: Staff can open the detail page for a permit-ready (`application_received`) reservation, verify all information panels (personal info, identity doc, BL result), issue a 30-minute permit via the confirmation dialog, and see the updated status and timeline entry.

**Independent Test**: Open detail for a seed record with `status: "application_received"`, `face_photo_registered: true`, `bl_match: false`. Confirm all left-column cards render (個人情報 with 登録済み face photo badge, BL照合結果 cleared, タイムライン), the ステータス card shows the all-clear alert + active permit button below a `Separator`, clicking the button opens the confirmation dialog, confirming transitions the record to `visiting`, and the timeline gains a new "管理者A" entry at the top.

### Implementation for User Story 1

- [x] T007 Add `usePermitVisitExperienceMutation(id: string)` to `src/lib/api/@tanstack/visit-experience.query.ts` — `useMutation` calling `POST /api/crm/visit-experiences/[id]/permit`, with `invalidateQueries` on success
- [x] T008 Create `src/app/api/crm/visit-experiences/[id]/permit/route.ts` — `POST` handler: validate permittable status (`application_received` | `bl_checking`), mutate record in mock DB (status → `visiting`, set `permit_issued_at`, `b01_gate`, `b01_auth_method`, prepend timeline entry), return `PermitVisitExperienceResponse` — contract in `contracts/POST-visit-experience-permit.md`
- [x] T009 [P] [US1] Created `personal-info-card.tsx`, `blacklist-result-card.tsx`, `reservation-info-card.tsx` — left-column cards with inline status-aware rendering; `personal-info-card.tsx` includes face photo placeholder with 登録済み/未登録 badge (v3: no separate id-document card)
- [x] T010 [P] [US1] Create `detail-skeleton.tsx` — skeleton placeholder matching the 2-column layout
- [x] T011 [P] [US1] ~~id-document-card blocking-alert~~ — **Removed in v3**: face photo unregistered state handled inside `personal-info-card.tsx` (warning border + icon on placeholder)
- [x] T012 [P] [US1] ~~id-document-card.tsx~~ — **Removed in v3**: `personal-info-card.tsx` handles face photo registration status; no separate eKYC card
- [x] T013 [P] [US1] Covered in T009 — `blacklist-result-card.tsx` handles BL-match destructive variant
- [x] T014 [P] [US1] Created `status-panel.tsx` — toned icon circle + status `Badge` + 予約受付 datetime + `Separator` + inline action section (ステータス and 操作 merged per v3 prototype); no `VisitingCountdown`
- [x] T015 [P] [US1] Created `timeline-card.tsx` — sorted timeline entries with vertical connector
- [x] T016 [US1] Created `permit-actions.tsx` — all status branches (`application_received`, `bl_checking`, `visiting`, `visit_completed`), controlled `AlertDialog` state, `RoleGatedButton`, `usePermitVisitExperienceMutation`; rendered inside `status-panel.tsx` below `Separator`
- [x] T017 [US1] Replaced `page.tsx` stub with full `'use client'` page: `useQuery`, `DataStateBoundary`, 2-column flex layout, `PageHeader`, `BackLink`

**Checkpoint**: User Story 1 fully functional. Navigate to `/visit-experiences/VE-002` (seed record with `application_received`), verify all panels render (個人情報 with face photo badge, BL照合結果, タイムライン in left; ステータス merged card + 来店詳細情報 in right), issue permit, confirm status transitions to `visiting` and timeline updates.

---

## Phase 4: User Story 2 — Identify and handle blocked reservations (Priority: P2)

**Goal**: The detail page correctly renders the info-missing state (null fields flagged, permit button disabled) and the BL-match state (destructive card, match reason, risk-override permit button). No new components — all tasks extend components built in Phase 3.

**Independent Test**: Open detail for a seed record with `status: "info_missing"` — verify null phone/address show "未登録" in warning colour, face photo placeholder shows warning icon + border + "未登録" badge, ステータス card action section lists missing items and has a disabled permit button. Open detail for `status: "bl_checking"` + `bl_match: true` — verify destructive BL card shows match reason with detail link, ステータス card shows override permit button.

### Implementation for User Story 2

- [x] T018 [P] [US2] `personal-info-card.tsx` — info-missing `Alert` (warning tone) at card top + "未登録" warning text for null phone/address; face photo placeholder shows `AlertTriangle` icon + warning border when `face_photo_registered: false`
- [x] T019 [P] [US2] ~~id-document-card.tsx~~ — **Removed in v3**: covered by T018 (face photo status inside `personal-info-card.tsx`)
- [x] T020 [P] [US2] `blacklist-result-card.tsx` — BL-match destructive card with match reason + BL list link
- [x] T021 [US2] `permit-actions.tsx` / `status-panel.tsx` — `bl_checking` branch: destructive warning `Alert` + match reason text + `RoleGatedButton` "リスクを確認して見学を許可する（30分）" (outline variant, destructive text); shares same `AlertDialog` flow as default branch

**Checkpoint**: User Stories 1 + 2 both functional independently. Both `VE-006` (info_missing) and `VE-005` (bl_checking + BL match) must display correctly with no permit possible / risk-override possible respectively.

---

## Phase 5: User Story 3 — Monitor in-progress visit and initiate membership application (Priority: P3)

**Goal**: The detail page shows the remaining-time countdown for visiting records and the B-01 entry/exit information card. After a visit completes, staff can navigate to the enrollment form with data pre-filled.

**Independent Test**: Open detail for a `visiting` seed record — verify ステータス card shows "見学中" with info tone and "時間制限入館 有効" badge, 来店詳細情報 shows 来店予定日時 + 見学許可発行日時 (no countdown), B-01 card is visible in right column with entry time. Open detail for a `visit_completed` record — verify B-01 card shows entry AND exit times, ステータス card action section shows "入会申請へ誘導" button.

### Implementation for User Story 3

- [x] T022 [P] [US3] ~~VisitingCountdown~~ — **Removed in v3**: countdown abolished per FR-S001 v3. `status-panel.tsx` visiting branch shows only "B-01 連携状況" row + "時間制限入館 有効" badge; no `setInterval` or MM:SS display
- [x] T023 [P] [US3] Created `b01-info-card.tsx` — renders when `b01_entry_at !== null`; shows auth method, gate, entry/exit times; displayed in **right column** of `page.tsx` (not left column)
- [x] T024 [US3] `permit-actions.tsx` — `visiting` / `visit_completed` branches with 入会申請へ誘導 button pre-filling query params; `b01-info-card.tsx` rendered in right column of `page.tsx` below `reservation-info-card.tsx`

**Checkpoint**: User Stories 1 + 2 + 3 all functional. VE-001 (visiting) shows ステータス card with "見学中" + "時間制限入館 有効" badge and B-01 card in right column (no countdown). VE-003 (visit_completed) shows 入会申請へ誘導 button.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Terminal read-only states, contract tests, accessibility, and final quality gates.

- [x] T025 [P] `permit-actions.tsx` returns `null` for `membership_applied` and `cancelled` (no action buttons — terminal read-only states)
- [ ] T026 [P] Contract test for `GET /api/crm/visit-experiences/[id]` — deferred to post-implementation
- [ ] T027 [P] Contract test for `POST /api/crm/visit-experiences/[id]/permit` — deferred to post-implementation
- [ ] T028 [P] Accessibility audit — deferred to post-implementation
- [x] T029 Run `tsc --noEmit` — exit 0 ✅
- [x] T030 Run `eslint` on all changed files — exit 0, 0 errors 0 warnings ✅

**Checkpoint**: All 30 tasks complete. All 7 status states verified. Type-check and lint green. Contract tests passing.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001. T002 first → then T003 → then T004/T005/T006 in parallel. **BLOCKS all user stories.**
- **User Story Phases (3–5)**: All depend on Phase 2 completion
  - US1 (Phase 3): No dependency on US2/US3
  - US2 (Phase 4): Extends components from US1 — begin after Phase 3 checkpoint
  - US3 (Phase 5): Extends components from US1/US2 — begin after Phase 4 checkpoint
- **Polish (Phase 6)**: Depends on all US phases complete

### Within Phase 3

```
T007 ──┐
T008 ──┤
T009 ──┼──→ T016 ──→ T017
T010 ──┘
T011, T012, T013, T014, T015  ← all parallel [P] tasks
```

### Within Phase 4

```
T018, T019, T020  ← parallel [P]
T021              ← depends on T018, T019
```

### Within Phase 5

```
T022, T023  ← parallel [P]
T024        ← depends on T022, T023
```

### Parallel Opportunities Per Phase

**Phase 2** (after T002 → T003):

```
Run in parallel: T004, T005, T006
```

**Phase 3** (US1 — after Phase 2):

```
Run in parallel: T009, T010, T011, T012, T013, T014, T015
Then: T016 (needs T007, T009)
Then: T017 (needs T009, T010, T016)
```

**Phase 4** (US2 — after Phase 3):

```
Run in parallel: T018, T019, T020
Then: T021
```

**Phase 5** (US3 — after Phase 4):

```
Run in parallel: T022, T023
Then: T024
```

**Phase 6** (Polish — after Phase 5):

```
Run in parallel: T025, T026, T027, T028
Then: T029
Then: T030
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T006)
3. Complete Phase 3: User Story 1 (T007–T017)
4. **STOP and VALIDATE**: Navigate to `/visit-experiences/VE-002`, issue permit, confirm timeline update
5. Demo to PO — default permit-issuance flow is fully working

### Incremental Delivery

1. Setup + Foundational → foundation ready (T001–T006)
2. Add User Story 1 → permit flow working for normal reservations → Demo MVP
3. Add User Story 2 → blocked states handled → Demo US2
4. Add User Story 3 → visiting + completed states + B-01 card → Demo US3
5. Polish → contract tests + accessibility + quality gates

### Single-Developer Suggested Order

```
T001 → T002 → T003 → T004, T005, T006 (parallel)
→ T007 → T008
→ T009, T010, T011, T012, T013, T014, T015 (parallel)
→ T016 → T017    ← US1 done, validate here
→ T018, T019, T020 (parallel) → T021    ← US2 done
→ T022, T023 (parallel) → T024    ← US3 done
→ T025, T026, T027, T028 (parallel) → T029 → T030
```

---

## Summary

| Phase                         | Tasks        | Parallelizable        | User Story |
| ----------------------------- | ------------ | --------------------- | ---------- |
| 1 — Setup                     | T001         | —                     | —          |
| 2 — Foundational              | T002–T006    | T004, T005, T006      | —          |
| 3 — US1 Permit flow           | T007–T017    | T009–T015             | P1 🎯 MVP  |
| 4 — US2 Blocked states        | T018–T021    | T018, T019, T020      | P2         |
| 5 — US3 Visiting + conversion | T022–T024    | T022, T023            | P3         |
| 6 — Polish                    | T025–T030    | T025–T028             | —          |
| **Total**                     | **30 tasks** | **18 parallelizable** |            |
