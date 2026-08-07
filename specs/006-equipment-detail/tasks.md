# Tasks: E-02 Connected Equipment Detail

**Input**: Design documents from `/specs/006-equipment-detail/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/equipment-detail-api.md  
**Branch**: `006-equipment-detail` (or `feat/equipment`)  
**Created**: 2026-06-24

**Tests**: Not requested — manual UAT per `quickstart.md` only.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared constants and route scaffolding before API work

- [x] T001 [P] Update `EQUIPMENT_STATUS_BADGE_MAP.maintenance` to use `warning` classes in `src/app/(private)/equipment/_constants/constants.ts`
- [x] T002 [P] Add `EQUIPMENT_AUTHENTICATION_LABELS` map for `member_qr_scan` / `device_qr_scan` / `none` in `src/app/(private)/equipment/_constants/constants.ts`
- [x] T003 [P] Add `/equipment/[id]` entry to `src/lib/routes/routes.config.ts` and `privateRoutes` array
- [x] T004 [P] Add `'/equipment/:id': Permission.EquipmentView` to `src/lib/permission.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, mock-db, API routes, and generated client — **MUST complete before UI stories**

**⚠️ CRITICAL**: No user story UI work until T011 passes (`generate-api` succeeds)

- [x] T005 Add detail schemas (`UsageControlRuleDisplaySchema`, `ControllerSummarySchema`, `ConnectedEquipmentDetailSchema`, `EquipmentStatusHistoryItemSchema`, `GetEquipmentDetailResponseSchema`, `GetEquipmentHistoryResponseSchema`) to `src/app/api/_schemas/equipment.schema.ts`
- [x] T006 Register new equipment detail schemas in `src/app/api/_scripts/register-schemas.ts`
- [x] T007 Extend `db.equipment` in `src/app/api/_mock-db.ts`: `getDetailById`, `getHistory` (seed map `_historyByEquipmentId`), `delete`; add `buildEquipmentDetail`, `CONTROLLER_SUMMARY_SEED`, `SEED_EQUIPMENT_HISTORY` (static, not mutated on status change)
- [x] T008 [P] Implement `GET` handler in `src/app/api/crm/equipment/[id]/route.ts` using `db.equipment.getDetailById` → 404 / 200 `{ equipment }`
- [x] T009 Implement `DELETE` handler in `src/app/api/crm/equipment/[id]/route.ts` using `db.equipment.delete` → 404 / 204
- [x] T010 [P] Implement `GET` handler in `src/app/api/crm/equipment/[id]/history/route.ts` using `db.equipment.getHistory` → 404 / 200 `{ history }`
- [x] T011 Register routes in `src/app/api/_routes/index.ts`: `import '@/app/api/crm/equipment/[id]/route'` and `import '@/app/api/crm/equipment/[id]/history/route'`
- [x] T012 Run `npm run generate-openapi && npm run generate-api`; verify `getCrmEquipmentByIdOptions`, `getCrmEquipmentByIdHistoryOptions`, `deleteCrmEquipmentByIdMutation` exist in `src/lib/api/@tanstack/react-query.gen.ts`

**Checkpoint**: API layer ready — detail/history/delete callable; bulk-status unchanged

---

## Phase 3: User Story 1 — View Connected Equipment Detail (Priority: P1) 🎯 MVP

**Goal**: Staff can open `/equipment/[id]` and see read-only detail (FR-004)

**Independent Test**: Navigate from list → detail loads all Basic Info cards; 404/error states show correct copy

### Implementation for User Story 1

- [x] T013 [P] [US1] Create `src/app/(private)/equipment/[id]/_components/equipment-detail-skeleton.tsx`
- [x] T014 [P] [US1] Create `src/app/(private)/equipment/[id]/_components/equipment-info-card.tsx` (2-col grid: ID, name, type, serial, IP, MAC, location, install date, auth, 接点制御先番号, QRコードID)
- [x] T015 [P] [US1] Create `src/app/(private)/equipment/[id]/_components/equipment-usage-rule-card.tsx` (read-only rules; gate-stop box only when `equipment_type === 'entry_gate'`)
- [x] T016 [P] [US1] Create `src/app/(private)/equipment/[id]/_components/equipment-controller-card.tsx` (controller summary; link placeholder for controller detail)
- [x] T017 [P] [US1] Create `src/app/(private)/equipment/[id]/_components/equipment-meta-card.tsx` (作成日時 / 更新日時)
- [x] T018 [US1] Create `src/app/(private)/equipment/[id]/_components/equipment-basic-info-tab.tsx` composing T014–T017 in 60/40 layout (`lg:grid-cols-[3fr_2fr]`, sticky right column)
- [x] T019 [US1] Create `src/app/(private)/equipment/[id]/page.tsx`: `useQuery(getCrmEquipmentByIdOptions)`, `DataStateBoundary` (fetch error incl. 404 → `接続機器の取得に失敗しました。` + retry), `PageHeader` with breadcrumb + status badge, Basic Info tab
- [x] T020 [P] [US1] Add equipment name link to detail in `src/app/(private)/equipment/_components/equipment-table-columns.tsx` via `navigate('/equipment/[id]', id)`

**Checkpoint**: List → detail navigation works; all read-only fields render

---

## Phase 4: User Story 2 — Change Connected Equipment Status (Priority: P1)

**Goal**: Authorized users change status via dialog; UI refreshes via `invalidateQueries` (FR-SC-001)

**Independent Test**: Open ステータス変更 → current status excluded from select → save → header badge updates after refetch

### Implementation for User Story 2

- [x] T021 [P] [US2] Create `src/app/(private)/equipment/[id]/_components/equipment-status-card.tsx` (icon, badge, 最終確認日時 from `updated_at`, ステータス変更 trigger; `RoleGatedButton` for HQ/System/Manager/Staff)
- [x] T022 [US2] Create `src/app/(private)/equipment/[id]/_components/equipment-status-dialog.tsx`: filter status options excluding current; optional 変更理由 (UI only); `postCrmEquipmentBulkStatusMutation` with `ids: [equipmentId]`; `onSuccess` → `invalidateQueries(getCrmEquipmentByIdQueryKey)`; toast on error, keep dialog open
- [x] T023 [US2] Wire status card + dialog into `equipment-basic-info-tab.tsx` and `page.tsx` header badge (shared equipment data from parent query)

**Checkpoint**: Status change works without new PATCH endpoint; history tab unchanged

---

## Phase 5: User Story 3 — Delete Connected Equipment (Priority: P2)

**Goal**: Authorized users delete equipment with confirmation (FR-006)

**Independent Test**: 削除 → confirm → redirect to `/equipment`; Observer sees disabled button

### Implementation for User Story 3

- [x] T024 [US3] Create `src/app/(private)/equipment/[id]/_components/equipment-delete-dialog.tsx` (`AlertDialog`, prototype copy, `deleteCrmEquipmentByIdMutation`, navigate to `/equipment` on success)
- [x] T025 [US3] Add 削除 `RoleGatedButton` to `page.tsx` actions (allowedRoles HQ/System/Manager/Staff; denyTooltip `削除権限がありません`)

**Checkpoint**: Delete at any status; no 廃棄 prerequisite

---

## Phase 6: User Story 4 — Review Status Change History (Priority: P2)

**Goal**: 変更履歴 tab shows seed history table (FR-012 read-only; no live append on status change)

**Independent Test**: History tab renders 4 columns; no summary footer; rows unchanged after status save

### Implementation for User Story 4

- [x] T026 [US4] Create `src/app/(private)/equipment/[id]/_components/equipment-history-tab.tsx`: `useQuery(getCrmEquipmentByIdHistoryOptions)`; table 日時/操作者/ステータス変化/変更理由; `event_type === 'created'` → 新規作成 badge; **no** footer stats
- [x] T027 [US4] Add 変更履歴 tab to `page.tsx` (`Tabs`: 基本情報 | 変更履歴); optional `nuqs` for `?tab=`

**Checkpoint**: FR-012 display satisfied with static seed data

---

## Phase 7: User Story 5 — Edit Button Placeholder (Priority: P3)

**Goal**: 編集 button visible, disabled, tooltip `編集機能は準備中です` (FR-UI-001)

**Independent Test**: All page-access roles see disabled 編集 with tooltip; no navigation on click

### Implementation for User Story 5

- [x] T028 [US5] Add disabled 編集 `Button` with `Tooltip` (`編集機能は準備中です`) to `page.tsx` header actions for all roles with page access (including Observer)

**Checkpoint**: Edit placeholder matches clarified spec

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation and consistency

- [x] T029 [P] Verify `last_status_confirmed_at` displays `updated_at` on status card after bulk-status refetch
- [x] T030 Run manual UAT checklist in `specs/006-equipment-detail/quickstart.md` (all 8 steps)
- [x] T031 [P] Confirm `maintenance` badge uses `warning` on list page, detail, dialog, and history tab consistently

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Setup) ──► Phase 2 (Foundational) ──► Phases 3–7 (User Stories) ──► Phase 8 (Polish)
```

### User Story Dependencies

| Story                  | Depends on                            | Notes                               |
| ---------------------- | ------------------------------------- | ----------------------------------- |
| US1 (View)             | Phase 2                               | MVP — no other stories required     |
| US2 (Status)           | US1 page shell + US1 status card slot | Reuses bulk-status API from Phase 2 |
| US3 (Delete)           | US1 page shell                        | DELETE API from Phase 2             |
| US4 (History)          | US1 tabs shell                        | History API from Phase 2            |
| US5 (Edit placeholder) | US1 page header                       | Independent of US2–US4              |

### Parallel Opportunities

**Phase 1** (all [P]): T001–T004 in parallel  
**Phase 2**: T008 + T010 in parallel after T007  
**US1 components**: T013–T017 in parallel, then T018–T019  
**US2**: T021 parallel with T022 start; T023 after both  
**Polish**: T029 + T031 in parallel

### Parallel Example: User Story 1

```bash
# After Phase 2 complete, launch card components together:
T014 equipment-info-card.tsx
T015 equipment-usage-rule-card.tsx
T016 equipment-controller-card.tsx
T017 equipment-meta-card.tsx
T013 equipment-detail-skeleton.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1 + Phase 2
2. Complete Phase 3 (US1) + T020 list link
3. **STOP and VALIDATE**: `/equipment/EQ-0001` renders all detail fields

### Incremental Delivery

1. - Phase 4 (US2) → status change via bulk-status
2. - Phase 5 (US3) → delete flow
3. - Phase 6 (US4) → history tab
4. - Phase 7 (US5) → edit placeholder
5. Phase 8 → UAT sign-off

---

## Task Summary

| Metric                 | Count |
| ---------------------- | ----- |
| **Total tasks**        | 31    |
| Phase 1 Setup          | 4     |
| Phase 2 Foundational   | 8     |
| US1 View detail        | 8     |
| US2 Status change      | 3     |
| US3 Delete             | 2     |
| US4 History            | 2     |
| US5 Edit placeholder   | 1     |
| Polish                 | 3     |
| **Parallelizable [P]** | 15    |

**Suggested MVP scope**: Phase 1 + Phase 2 + Phase 3 (T001–T020)  
**Next command**: `/speckit.implement` or implement phases sequentially
