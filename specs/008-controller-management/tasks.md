# Tasks: E-02 Contact-Control Device (接点制御装置) Management

**Input**: Design documents from `/specs/008-controller-management/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/controller-management-api.md  
**Branch**: working on `feat/equipment` (no new branch; feature id `008-controller-management`)  
**Created**: 2026-06-26

**Tests**: Not requested as TDD — verification is mock-route curl checks (happy + error, incl. 409 delete-guard) + manual UAT per `quickstart.md` (matches 006/007 precedent).

**Scope**: FR-007 only — list (search/filter/sort/paginate), detail (basic info + connected-devices + read-only history), create/edit form, delete-with-guard, status-change. Clarifications applied: Q1 (Observer view-only), Q2 (enforced required set incl. ポート番号), Q3 (status-change updates 状態 only, history seed/read-only).

## Format: `[ID] [P?] [Story] Description`

- **[P]** = parallelizable (different files, no dependency on incomplete tasks)
- **[Story]** = US1–US5 (user-story phases only)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Permissions and constants before API/UI work

- [x] T001 [P] Add `ControllerView = 'controller.view'`, `ControllerEdit = 'controller.edit'`, `ControllerDelete = 'controller.delete'` to the `Permission` enum in `src/types/permission.type.ts` (append after the equipment block)
- [x] T002 [P] Create `src/app/(private)/controllers/_constants/constants.ts`: controller list column headers, 変更種別 options (`ステータス変更`/`故障報告`/`点検完了`), and form helper texts (IP format / FW format / 制御ポート数 / ポート番号). Re-export `EQUIPMENT_STATUS_LABELS` + `EQUIPMENT_STATUS_BADGE_MAP` from the equipment constants for controller status reuse

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schemas, mock-db, API routes, and generated client — **MUST complete before any UI story**

**⚠️ CRITICAL**: No controller UI work until T009 passes (`generate-api` + `type-check` succeed)

- [x] T003 Extend `src/app/api/_schemas/controller.schema.ts` per data-model.md: add `store_code`, `location`, `firmware_version` (nullable), `control_port_count` (int 1–64), `created_at`, `updated_at` to `ControllerSchema`; add `ControllerListItemSchema` (+`device_count`), `ControllerDeviceSummarySchema`, `ControllerDetailSchema` (+`device_count`+`device_summary`), `ControllerConnectedDeviceSchema`, `ControllerHistoryItemSchema`; replace `GetControllersQuerySchema` (search/status/store_id/sort_by/sort_order/page/limit≤50) and `GetControllersResponseSchema` (paginated `items/total/page/limit/total_pages`); add `GetControllerDevicesResponseSchema`, `GetControllerHistoryResponseSchema`, `UpsertControllerRequestSchema` (IP regex, control_port_count 1–64), `PatchControllerRequestSchema` (= partial Upsert), and `CreateControllerResponseSchema`/`UpdateControllerResponseSchema`/`GetControllerDetailResponseSchema` (+ inferred types)
- [x] T004 Register all new controller schemas in `src/app/api/_scripts/register-schemas.ts` (extend the existing `controllerSchemas` registrations: list item/detail/devices/history/upsert/patch/create/update responses)
- [x] T005 Extend `SEED_CONTROLLERS` in `src/app/api/_mock-db.ts`: backfill the 8 rows with `store_code` (cover ≥ 3 stores), `location`, `firmware_version`, `control_port_count`, `created_at`, `updated_at` (keep existing `controller_number`/`port`/`status`/`name`)
- [x] T006 Add controller history seed to `src/app/api/_mock-db.ts`: `buildControllerHistorySeed(controllerId, createdAt)` (genesis `created` row + 1–2 `status_change`/`inspection` rows) and `SEED_CONTROLLER_HISTORY: Record<string, ControllerHistoryItem[]>` keyed by `controller_id` (mirror `buildEquipmentHistorySeed`)
- [x] T007 Extend `db.controllers` in `src/app/api/_mock-db.ts` with `_historyByControllerId` and methods: `list(query)` (filter by search[name/ip]/status/store_id, sort via a `CONTROLLER_SORTERS` map, paginate ≤50 → `{items,total,page,limit,total_pages}` with derived `device_count`), `getDetailById(id)` (+`device_count`+`device_summary`), `getConnectedDevices(id)` (scan `db.equipment._rows` matching meta `controller_id` then `controller_number` → devices + summary; `gate_type` best-effort per research R5), `getHistory(id)` (read-only), `create(input)` (auto-number `CTRL-####`, next `controller_number`, set timestamps), `update(id, input)` (shallow-merge incl. status-only, touch `updated_at`, **no** history append), `delete(id)` (guard: `{ok:false, reason:'has_connected_devices', device_count}` when devices exist, else remove row + history `{ok:true}`)
- [x] T008 Implement controller route handlers (auth via `getAuthUserFromRequest`, Zod `safeParse`, `registerRoute` per method) per `contracts/controller-management-api.md`:
  - `src/app/api/crm/controllers/route.ts` — extend `GET` (validate `GetControllersQuerySchema` → `db.controllers.list`) + add `POST` (validate `UpsertControllerRequestSchema` → `create` → 201)
  - `src/app/api/crm/controllers/[id]/route.ts` — `GET` detail (404), `PATCH` (validate `PatchControllerRequestSchema` → `update` → 200/404), `DELETE` (guard → **409** `{error,reason,device_count}` when devices exist, else 204)
  - `src/app/api/crm/controllers/[id]/devices/route.ts` — `GET` connected devices (404 unknown controller)
  - `src/app/api/crm/controllers/[id]/history/route.ts` — `GET` read-only history (404 unknown controller)
  - Register all new routes in `src/app/api/_routes/index.ts`
- [x] T009 Run `npm run generate-openapi && npm run generate-api`; verify new exports in `src/lib/api/@tanstack/react-query.gen.ts` (`postCrmControllersMutation`, `getCrmControllersByIdOptions`, `patchCrmControllersByIdMutation`, `deleteCrmControllersByIdMutation`, `getCrmControllersByIdDevicesOptions`, `getCrmControllersByIdHistoryOptions`, updated `getCrmControllersOptions`); run `npm run type-check` (exit 0, mock-db compiles against `types.gen.ts`)
- [x] T010 Update the equipment `ControllerPicker` in `src/app/(private)/equipment/_components/controller-picker.tsx` to read the new paginated `items` shape from `getCrmControllersOptions` (pass `limit: 50`); confirm `buildEquipmentDetail` controller-summary match still resolves (no regression in equipment detail)

**Checkpoint**: All 7 controller routes callable via mock API; client hooks generated; equipment picker unbroken

---

## Phase 3: User Story 2 — Browse, Search & Filter Controllers (Priority: P1) 🎯 MVP

**Goal**: Authorized users view, search, status-filter, sort, and paginate the controller list at `/controllers`, and open a controller by row click (FR-007-A)

**Independent Test**: `/controllers` shows the 9 columns + count; search by name/IP narrows; status filter (異常) narrows + highlights 異常 rows; row click → detail; Observer can view, Trainer blocked

> US2 is sequenced first because the list is the entry point and the leanest independently-shippable slice. (US1 create is built next.)

### Implementation for User Story 2

- [x] T011 [P] [US2] Create `src/app/(private)/controllers/_hooks/use-controller-filters.ts` (nuqs `useQueryStates`, `controller_`-prefixed keys: search [debounced 300ms], status, store_id, sort_by, sort_order, page, limit; expose `queryParams` builder + `activeFilterCount`) — mirror `use-equipment-filters.ts`
- [x] T012 [P] [US2] Create `src/app/(private)/controllers/_components/controller-table-columns.tsx` (`ColumnDef[]`: 装置ID, 装置名, 店舗コード, 設置場所, IPアドレス, FW, 制御ポート数, 紐付き機器数, ステータス badge via `EQUIPMENT_STATUS_BADGE_MAP`; sortable headers via `DataTableColumnHeader`)
- [x] T013 [P] [US2] Create `src/app/(private)/controllers/_components/controller-filters.tsx` (search `Input` placeholder `装置名、IPアドレスで検索`; status `Select` [全ステータス + 4 states]; store `SearchableSelect` via `getCrmStoresOptions`, shown when ≥2 accessible stores; すべてクリア)
- [x] T014 [US2] Create `src/app/(private)/controllers/page.tsx` (`'use client'` + `Suspense`): `PageHeader` (title `接点制御装置一覧` + count badge + `RoleGatedButton`(`ControllerEdit`) `接点制御装置を登録` → `navigate('/controllers/create')`); `getCrmControllersOptions({ query })`; `DataTable` (`variant="simple"`, `manualSorting`, `getRowId`, `onRowClick → navigate('/controllers/[id]', row.id)`, red row when `status==='error'`) + `controller-filters` + `TablePaginationWithSize`
- [x] T015 [US2] Verify controller routes generated into `src/lib/routes/routes.config.ts` (`/controllers`, `/controllers/[id]`, `/controllers/create`, `/controllers/[id]/edit`, `private: true`); map permissions in `src/lib/permission.config.ts` (`/controllers`→`ControllerView`, `/controllers/:id`→`ControllerView`, `/controllers/create`→`ControllerEdit`, `/controllers/:id/edit`→`ControllerEdit`); grant `ControllerView` to System/HQ/Manager/Staff/Observer and `ControllerEdit`/`ControllerDelete` to System/HQ/Manager/Staff (Q1)

**Checkpoint**: Browsable/searchable/sortable/paginated list with role-gated create entry; FR-007-A satisfied

---

## Phase 4: User Story 1 — Register a New Controller (Priority: P1)

**Goal**: Authorized users register a controller at `/controllers/create` with enforced validation; saving persists and returns to the list (FR-007-B, FR-VAL-007)

**Independent Test**: `/controllers/create`: ID shows `（自動採番）`; fill 装置名/店舗コード/設置場所/IPアドレス/制御ポート数/ポート番号/状態 → 登録 → toast `接点制御装置を登録しました` → list shows new `CTRL-####`; empty/invalid-IP submit blocks on the required set (incl. ポート番号), FW may be empty

**Depends on**: Phase 2

### Implementation for User Story 1

- [x] T016 [P] [US1] Create `src/app/(private)/controllers/_schemas/controller-form.schema.ts` (`controllerFormSchema` + `ControllerFormValues`/`ControllerFormSubmitValues`): required 装置名/店舗コード(store_code)/設置場所/IPアドレス(local-IP regex)/制御ポート数(int 1–64)/ポート番号(int 1–65535)/状態(default `normal`); `firmware_version` optional; text maxes per `app.constants`
- [x] T017 [P] [US1] Create `src/app/(private)/controllers/_utils/controller-form.util.ts` with `emptyControllerFormDefaults` and `controllerFormValuesToBody` (→ `UpsertControllerRequest`)
- [x] T018 [US1] Create `src/app/(private)/controllers/[id]/_components/controller-form.tsx` (`mode: 'create' | 'edit'`) inside shadcn `Form`: 基本情報 card (接点制御装置ID readonly, 装置名, 店舗コード via `SearchableSelect`, 設置場所, info `Alert`, IPアドレス + helper, ファームウェアバージョン + helper, 制御ポート数 + helper, ポート番号 + helper) and ステータス card (状態 `Select`, 4 states); `max-w-[960px]` + fixed footer (キャンセル / 登録｜更新); `useScrollToFirstError` on invalid submit
- [x] T019 [US1] Create `src/app/(private)/controllers/create/page.tsx` (`useForm(controllerFormSchema)` + `postCrmControllersMutation`; success toast `接点制御装置を登録しました`; invalidate controllers list query key; `navigate('/controllers')`)

**Checkpoint**: Create flow works end-to-end with Q2 validation; FR-007-B satisfied

---

## Phase 5: User Story 3 — View Controller Detail & Connected Devices (Priority: P1)

**Goal**: Read-only detail with basic info, status/summary cards, the connected-devices list, and read-only change history (FR-007-D, FR-007-G)

**Independent Test**: Detail renders 3 tabs; 基本情報 shows all fields incl. ポート番号 + status card + 紐付き機器サマリー + その他情報; 紐付き機器一覧 lists devices + summary footer; 変更履歴 shows seeded rows read-only (no add/edit/delete); 編集 (authorized) → edit page

**Depends on**: Phase 2

### Implementation for User Story 3

- [x] T020 [P] [US3] Create `src/app/(private)/controllers/[id]/_components/controller-detail-skeleton.tsx` (loading skeleton for the detail layout)
- [x] T021 [P] [US3] Create `src/app/(private)/controllers/[id]/_components/controller-basic-info-tab.tsx`: left = info card (接点制御装置ID, 装置名, 店舗コード, 設置場所, IPアドレス, FW, 制御ポート数, ポート番号 — read-only); right (sticky) = `StatusCard` (icon `Cpu`, status label, action `ステータス変更` button gated by `ControllerEdit`), 紐付き機器サマリー card (total/normal/error + link to 紐付き機器一覧 tab), その他情報 card (作成日時/更新日時)
- [x] T022 [P] [US3] Create `src/app/(private)/controllers/[id]/_components/controller-devices-tab.tsx` (`getCrmControllersByIdDevicesOptions`; `DataTable`/`Table` of 機器ID, 機器名, 接点番号, ゲート種別, ステータス + summary footer 合計/正常/異常)
- [x] T023 [P] [US3] Create `src/app/(private)/controllers/[id]/_components/controller-history-tab.tsx` (`getCrmControllersByIdHistoryOptions`; read-only `Table` of 日時/操作者/種別/ステータス変化 [from→to badges, 新規作成 for `created`]/メモ + summary footer). No write controls (Q3/FR-007-G)
- [x] T024 [US3] Create `src/app/(private)/controllers/[id]/page.tsx`: `PageHeader` (`BackLink` → `/controllers`, title `接点制御装置詳細`, subtitle `{store} — {ip}`, status badge) + `RoleGatedButton`s (削除 `ControllerDelete` [disabled when `device_count > 0`], 編集 `ControllerEdit` → `navigate('/controllers/[id]/edit', id)`); `getCrmControllersByIdOptions` wrapped in `DataStateBoundary` (skeleton/error `接点制御装置の取得に失敗しました`+retry/empty); `Tabs` (基本情報 / 紐付き機器一覧 / 変更履歴) synced to `?tab=`

**Checkpoint**: Detail + connected-devices + read-only history render; FR-007-D & FR-007-G satisfied

---

## Phase 6: User Story 4 — Edit Controller Settings (Priority: P2)

**Goal**: Authorized users edit a controller at `/controllers/[id]/edit` with prefilled values and dirty-only PATCH (FR-007-C)

**Independent Test**: `/controllers/CTRL-001/edit` prefills all fields (状態 default 正常); change a value → 更新 → toast `接点制御装置の変更を保存しました`; reopen reflects change; 更新 disabled unless dirty

**Depends on**: US1 (shared form/schema/util), US3 (detail 編集 entry + GET detail)

### Implementation for User Story 4

- [x] T025 [US4] Add `controllerDetailToFormValues` and `controllerFormValuesToPatchBody` (dirty-only via RHF `dirtyFields`) to `src/app/(private)/controllers/_utils/controller-form.util.ts`
- [x] T026 [US4] Create `src/app/(private)/controllers/[id]/edit/page.tsx` (`getCrmControllersByIdOptions` in `DataStateBoundary`; inner `controller-form` seeded via `controllerDetailToFormValues`; `patchCrmControllersByIdMutation` with dirty body; success toast `接点制御装置の変更を保存しました`; invalidate detail + list; `navigate('/controllers')`; 更新 gated by `isDirty`)

**Checkpoint**: Edit/prefill/update works; FR-007-C satisfied

---

## Phase 7: User Story 5 — Delete a Controller (with guard) (Priority: P2)

**Goal**: Authorized users delete a controller only after confirmation, blocked while connected devices exist (FR-007-E, 異常系)

**Independent Test**: Controller with devices → 削除 disabled; controller w/o devices → dialog `接点制御装置を削除しますか？` → 削除する → back to list; direct `DELETE` API returns **409** when devices exist; Observer/Trainer see no 削除

**Depends on**: US3 (detail header + `device_count`)

### Implementation for User Story 5

- [x] T027 [US5] Create `src/app/(private)/controllers/[id]/_components/controller-delete-dialog.tsx` (`AlertDialog` `接点制御装置を削除しますか？` / `「{ip}」を削除します。この操作は取り消せません。` / キャンセル / 削除する → `deleteCrmControllersByIdMutation` → toast + invalidate list + `navigate('/controllers')`; surface 409 guard error as a toast). Wire it into `controllers/[id]/page.tsx`; keep the 削除 button disabled when `device_count > 0`

**Checkpoint**: Guarded delete works at UI + API; FR-007-E satisfied

---

## Phase 8: Status Change (FR-007-F, Q3)

**Goal**: Quick status change from the detail status card — updates 状態 only, writes no history

**Independent Test**: Open ステータス変更 → choose 変更種別/新しいステータス/メモ → 変更を保存 → status badge updates; 変更履歴 gains **no** new row

**Depends on**: US3 (status card + detail)

- [x] T028 Create `src/app/(private)/controllers/[id]/_components/controller-status-dialog.tsx` (`Dialog`: 対象装置情報 readonly [装置ID + 現在のステータス], 変更種別 `Select` [ステータス変更/故障報告/点検完了], 新しいステータス `Select` [4 states], メモ `Textarea` optional; 変更を保存 → `patchCrmControllersByIdMutation({ status })` — status only, **no** history; invalidate detail). Mount in `controller-basic-info-tab.tsx`, opened from the `StatusCard` action

**Checkpoint**: FR-007-F satisfied per Q3 (status-only, no history write)

---

## Phase 9: Integration & Polish

- [x] T029 [US-int] Repoint the equipment list stub in `src/app/(private)/equipment/page.tsx`: the `接点制御装置を登録` dropdown item → `navigate('/controllers/create')` and the `接点制御装置一覧` tab → link/redirect to `/controllers` (or remove the embedded empty tab) per the dedicated-route decision
- [x] T030 Enable the equipment-detail controller link: in `src/app/(private)/equipment/[id]/_components/equipment-controller-card.tsx`, replace the disabled `装置詳細を見る` placeholder with `navigate('/controllers/[id]', controller_id)`
- [x] T031 [P] curl-verify mock routes per `contracts/controller-management-api.md`: `GET /crm/controllers` (200 + 400 invalid `limit>50`), `POST` (201 + 400 missing required / bad IP), `GET /{id}` (200 + 404), `PATCH /{id}` (200 + 404), `DELETE /{id}` (**409 with devices** + 204 without), `GET /{id}/devices` (200 + 404), `GET /{id}/history` (200 + 404)
- [x] T032 [P] Run `npm run type-check` and `npm run lint`; fix all issues in new/changed files (no `any`, design tokens only, lucide icons, `SearchableSelect` for store, React Query — no raw fetch)
- [x] T033 [P] Confirm a11y (labeled controls, keyboard nav on dialogs/table) and min-768px layout; add inline `isDirty` discard `AlertDialog` (`変更を破棄しますか？`) to the create/edit form per research R8
- [x] T034 Run the manual UAT checklist in `specs/008-controller-management/quickstart.md` (list / create / detail+devices+history / edit / delete-guard / status-change / Q1 access / Q2 validation / Q3 no-history); document Constitution Check I–VI in the PR (note connected-devices helper + delete-guard deviations)

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Setup) ─► Phase 2 (Foundational) ─► Phase 3 (US2 list, MVP) ─► Phases 4–8 ─► Phase 9 (Integration/Polish)
```

### User Story Dependencies

| Story                | Depends on       | Notes                                                        |
| -------------------- | ---------------- | ------------------------------------------------------------ |
| US2 (List)           | Phase 2          | MVP — entry point; stands up filters + table + routing/perms |
| US1 (Create)         | Phase 2          | Shared `controller-form` + schema + util                     |
| US3 (Detail/Devices) | Phase 2          | Detail + devices + read-only history                         |
| US4 (Edit)           | US1, US3         | Reuses form; adds prefill + dirty PATCH + detail 編集 entry  |
| US5 (Delete guard)   | US3              | Detail header + `device_count` guard                         |
| Status change (FR-F) | US3              | Status card + dialog (no history, Q3)                        |
| Integration/Polish   | US1–US5 + Status | Repoint equipment stubs; verification; DoD gates             |

### Parallel Opportunities

- **Phase 1**: T001 + T002 in parallel
- **Phase 2**: mostly sequential (shared `_mock-db.ts` / `controller.schema.ts`): T003 → T004 → T005 → T006 → T007 → T008 → T009; T010 after T009
- **US2**: T011 + T012 + T013 in parallel → T014 → T015
- **US1**: T016 + T017 in parallel → T018 → T019
- **US3**: T020 + T021 + T022 + T023 in parallel → T024
- **Polish**: T031 + T032 + T033 in parallel

### Parallel Example: User Story 3

```bash
# After Phase 2, launch the detail sub-components in parallel:
T020 controller-detail-skeleton.tsx
T021 controller-basic-info-tab.tsx
T022 controller-devices-tab.tsx
T023 controller-history-tab.tsx
# then compose:
T024 controllers/[id]/page.tsx
```

---

## Implementation Strategy

### MVP First (User Story 2 — List)

1. Complete Phase 1 + Phase 2 (schemas, mock-db, routes, regen).
2. Complete Phase 3 (US2) → browsable/searchable list with role-gated create entry.
3. **STOP and VALIDATE**: `/controllers` lists, filters, sorts, paginates; row → detail stub.

### Incremental Delivery

1. US1 (Create) → register a controller.
2. US3 (Detail/Devices/History) → full read surface.
3. US4 (Edit) → prefill + dirty update.
4. US5 (Delete guard) → guarded deletion (UI + 409).
5. Status change (FR-007-F) → status-only, no history.
6. Phase 9 → repoint equipment stubs + type-check/lint/UAT sign-off.

---

## Task Summary

| Metric                 | Count |
| ---------------------- | ----- |
| **Total tasks**        | 34    |
| Phase 1 Setup          | 2     |
| Phase 2 Foundational   | 8     |
| US2 List               | 5     |
| US1 Create             | 4     |
| US3 Detail/Devices     | 5     |
| US4 Edit               | 2     |
| US5 Delete guard       | 1     |
| Status change (FR-F)   | 1     |
| Integration & Polish   | 6     |
| **Parallelizable [P]** | 14    |

**Suggested MVP scope**: Phase 1 + Phase 2 + Phase 3 (US2 list)  
**Next command**: `/speckit.implement` (or `/speckit.analyze` for a consistency pass)
