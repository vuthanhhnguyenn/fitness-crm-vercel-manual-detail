# Tasks: E-02 Connected Equipment Form (Create / Edit)

**Input**: Design documents from `/specs/007-equipment-form/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/equipment-form-api.md  
**Branch**: `007-equipment-form`  
**Created**: 2026-06-25

**Tests**: Not requested — manual UAT per `quickstart.md` + curl verification (matches 006 precedent). Mock-route happy/error paths verified via curl in T013/T034.

**Scope**: FR-003 (create), FR-005 (edit), FR-008 (usage-control rule), FR-009 (authentication method), FR-NAV-001 (unsaved-changes guard). All clarifications Q1–Q7 applied.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Constants, routes, and permissions before form/API work

- [x] T001 [P] Add usage-control & form option constants in `src/app/(private)/equipment/_constants/constants.ts`: main-contract types (`スタンダード`/`プレミアム`/`ライト`), option types (`水素水`/`プロテイン`/`タンニング`/`その他`), per-use option types (`水素水都次`/`プロテイン都次`/`タンニング都次`/`コラーゲン都次`)
- [ ] T002 [P] Add `/equipment/create` and `/equipment/[id]/edit` entries (with `private: true`) to `src/lib/routes/routes.config.ts` and the `privateRoutes` / pattern arrays
- [x] T003 [P] Map `'/equipment/create': Permission.EquipmentEdit` and `'/equipment/:id/edit': Permission.EquipmentEdit` in `src/lib/permission.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schemas, mock-db, API routes, and generated client — **MUST complete before UI stories**

**⚠️ CRITICAL**: No form UI work until T013 passes (`generate-client` + `type-check` succeed)

### Controllers picker source (Q7) — ✅ ALREADY DONE

- [x] T004 Create `src/app/api/_schemas/controller.schema.ts` (`ControllerSchema`, `GetControllersQuerySchema`, `GetControllersResponseSchema` + types)
- [x] T005 Register `Controller` + `GetControllersResponse` in `src/app/api/_scripts/register-schemas.ts`
- [x] T006 Refactor `CONTROLLER_SUMMARY_SEED` (Record) → `SEED_CONTROLLERS` (array) and add `db.controllers` entity (`getAll`/`getById`); update `buildEquipmentDetail` to resolve controller summary by `controller_number` in `src/app/api/_mock-db.ts`
- [x] T007 Create `GET /crm/controllers` in `src/app/api/crm/controllers/route.ts`, register in `src/app/api/_routes/index.ts`, regenerate (`getCrmControllersOptions` available)

### Equipment create/update API — NEW

- [x] T008 Add upsert schemas to `src/app/api/_schemas/equipment.schema.ts`: `EquipmentUsageControlRuleInputSchema` (booleans + nullable type values), `UpsertEquipmentRequestSchema` (required: name/equipment_type/serial_number/install_location/installed_on/controller_number/status; optional: authentication_method/controller_id/ip_address/mac_address/usage_control_rule/remarks) with `superRefine` enforcing each `*_enabled` ⇒ matching type value, plus `CreateEquipmentResponseSchema` / `UpdateEquipmentResponseSchema` (`{ equipment }`)
- [x] T009 Register the new upsert/response schemas in `src/app/api/_scripts/register-schemas.ts`
- [x] T010 Extend `db.equipment` in `src/app/api/_mock-db.ts`: `create(input)` (auto-number `EQ-####` from `_rows` max), `update(id, input)` (404 if missing); write `controller_number` on the row and persist row meta (`controller_id`, `remarks`, structured `usage_control_rule`); update `buildEquipmentDetail` to prefer stored structured rule (fall back to label parsing for legacy seeds); `controller_number` = 接続先ポート番号 (also shown as 接点制御先番号)
- [x] T011 [P] Implement `POST` handler in `src/app/api/crm/equipment/route.ts` (validate `UpsertEquipmentRequestSchema` → `db.equipment.create` → 201 `{ equipment }`; 400 on invalid; auth via `getAuthUserFromRequest`) and `registerRoute` the POST
- [x] T012 [P] Implement `PATCH` handler in `src/app/api/crm/equipment/[id]/route.ts` (validate body → `db.equipment.update` → 200 `{ equipment }` / 404; 400 on invalid) and `registerRoute` the PATCH
- [x] T013 Run `npm run generate-openapi && npm run generate-client`; verify `postCrmEquipmentMutation` + `patchCrmEquipmentByIdMutation` exist in `src/lib/api/@tanstack/react-query.gen.ts`; run `npm run type-check` (exit 0)

**Checkpoint**: Create/update + controllers callable via mock API; client hooks generated

---

## Phase 3: User Story 1 — Register a New Connected Device (Priority: P1) 🎯 MVP

**Goal**: Staff register a new device at `/equipment/create` with all sections; saving persists and returns to the list (FR-003)

**Independent Test**: Open `/equipment/create`, fill required fields, submit → toast `接続機器を登録しました` → list shows new `EQ-####`; empty submit blocks on the 6 required fields incl. 接続先ポート番号

### Implementation for User Story 1

- [x] T014 [P] [US1] Create `src/app/(private)/equipment/_schemas/equipment-form.schema.ts` (`equipmentFormSchema` + `EquipmentFormValues`/`EquipmentFormSubmitValues`): required name/equipment_type/serial_number/install_location/installed_on/controller_number; status default `normal`; optional authentication_method/controller_id/ip_address/mac_address/remarks; `usage_control_rule` shape (flags + nullable type values)
- [x] T015 [P] [US1] Create `src/app/(private)/equipment/_utils/equipment-form.util.ts` with `emptyEquipmentFormDefaults` and `equipmentFormValuesToBody` (base mapping to `UpsertEquipmentRequest`)
- [x] T016 [P] [US1] Create `src/app/(private)/equipment/_components/controller-picker.tsx` (combobox/dialog using `getCrmControllersOptions`; stores `controller_id`; displays name / `IP:port` / status badge)
- [x] T017 [US1] Create `src/app/(private)/equipment/_components/equipment-form-basic-info.tsx` (接続機器ID readonly, 機器名, 機器タイプ Select, シリアルナンバー, 設置場所, 設置日 `DatePicker`, 状態 Select [4 options, Q5], 認証方式 RadioGroup [FR-009])
- [x] T018 [US1] Create `src/app/(private)/equipment/_components/equipment-form-connection.tsx` (ControllerPicker, 接続先ポート番号 [required], IPアドレス, MACアドレス) and `equipment-form-remarks.tsx` (Textarea, max 1000)
- [x] T019 [US1] Create `src/app/(private)/equipment/_components/equipment-form-usage-rule.tsx` (主契約判定/オプション契約判定/都次オプション判定 `Checkbox` + conditional `Select`; header note; gate-stop info box slot)
- [x] T020 [US1] Create `src/app/(private)/equipment/_components/equipment-form.tsx` (`mode: 'create' | 'edit'`) composing the four sections inside `Form` + `max-w-[960px]` + fixed footer (キャンセル / 登録｜更新), submit-error hint `未入力の項目があります`, `useScrollToFirstError`
- [x] T021 [US1] Create `src/app/(private)/equipment/create/page.tsx` (`useForm` + `postCrmEquipmentMutation`; success toast `接続機器を登録しました`; invalidate `getCrmEquipmentQueryKey`; `navigate('/equipment')`) and wire/add the 新規登録 button on `src/app/(private)/equipment/page.tsx` → `navigate('/equipment/create')`

**Checkpoint**: Full create form works end-to-end; FR-003 satisfied (FR-008/FR-009 controls render; deep behavior finalized in US3/US4)

---

## Phase 4: User Story 2 — Edit an Existing Connected Device (Priority: P1)

**Goal**: Staff edit an existing device at `/equipment/[id]/edit` with prefilled values; saving updates and returns to the list (FR-005)

**Independent Test**: `/equipment/EQ-0001/edit` prefills all fields; change a value → toast `接続機器の変更を保存しました`; reopen shows the change (SC-004)

**Depends on**: US1 (shared `EquipmentForm`, schema, util)

### Implementation for User Story 2

- [x] T022 [US2] Add `equipmentDetailToFormValues` to `src/app/(private)/equipment/_utils/equipment-form.util.ts` (map `ConnectedEquipmentDetail` → form values incl. `usage_control_rule`, `controller_id`, `controller_number`)
- [x] T023 [US2] Create `src/app/(private)/equipment/[id]/edit/page.tsx` (`getCrmEquipmentByIdOptions` in `DataStateBoundary` — loading skeleton / error `接続機器の取得に失敗しました` + retry; inner form seeded via `equipmentDetailToFormValues`; `patchCrmEquipmentByIdMutation`; success toast `接続機器の変更を保存しました`; invalidate detail + list; `navigate`; submit gated by `isDirty`)
- [x] T024 [US2] Wire the 編集 button in `src/app/(private)/equipment/[id]/page.tsx` to `navigate('/equipment/[id]/edit', id)` for `EquipmentEdit` roles (replace the Phase-1 disabled placeholder from 006)

**Checkpoint**: Edit flow works; FR-005 satisfied; create + edit both functional

---

## Phase 5: User Story 3 — Configure Usage-Control Rules (Priority: P1)

**Goal**: Per-device FR-008 rule configuration with correct conditional behavior (Q3/Q4/Q6)

**Independent Test**: Check a judgment → its Select appears & is required; empty checked Select blocks submit; unchecking discards value; no-judgment submit allowed; 入退館ゲート shows gate-stop info box

**Depends on**: US1 (usage-rule section, schema, util)

### Implementation for User Story 3

- [x] T025 [US3] Extend `equipmentFormSchema` in `src/app/(private)/equipment/_schemas/equipment-form.schema.ts` with `superRefine`: when `main_enabled`/`option_enabled`/`per_use_enabled` is true, the matching type value is required (Q4); no minimum-one-rule constraint (Q3)
- [x] T026 [US3] Extend `equipmentFormValuesToBody` in `src/app/(private)/equipment/_utils/equipment-form.util.ts` to clear (null) type values of unchecked judgments before submit (Q4)
- [ ] T027 [US3] Finalize `src/app/(private)/equipment/_components/equipment-form-usage-rule.tsx`: conditional Select reveal per checkbox; read-only gate-stop info box (①ブラックリスト ②未納 ③家族会員利用中) shown only when `equipment_type === 'entry_gate'` (Q6)

**Checkpoint**: FR-008 behavior matches clarified spec (Q3/Q4/Q6)

---

## Phase 6: User Story 4 — Set Authentication Method (Priority: P2)

**Goal**: FR-009 authentication method captured and round-tripped

**Independent Test**: Select each of 会員読取型/機器読取型/なし; saved value appears on detail (SC-005) and prefills on edit

**Depends on**: US1 (basic-info section), US2 (edit prefill)

### Implementation for User Story 4

- [x] T028 [US4] Map 認証方式 labels ↔ enum (`member_qr_scan`/`device_qr_scan`/`none`) in `src/app/(private)/equipment/_utils/equipment-form.util.ts`; submit-blocking required (Update 2026-06-30) — field-level validation in `equipment-form.schema.ts`, red border on the radio group in `equipment-form-basic-info.tsx`
- [x] T029 [US4] Verify auth-method create→detail round-trip (curl-verified: PATCH/GET round-trips `authentication_method`) auth-method create→detail round-trip and edit prefill (manual check per `quickstart.md`); adjust mapping if mismatched

**Checkpoint**: FR-009 satisfied end-to-end

---

## Phase 7: Cross-Cutting — Unsaved-Changes Guard (FR-NAV-001)

**Goal**: Discard confirmation when leaving with unsaved changes; no prompt after successful save

**Independent Test**: Edit a field then click キャンセル / back → dialog `変更を破棄しますか？` (編集を続ける / 破棄する); successful submit navigates without prompt

- [x] T030 Add an `isDirty`-gated discard `AlertDialog` (`変更を破棄しますか？` / `編集を続ける` / `破棄する`) to `src/app/(private)/equipment/_components/equipment-form.tsx` triggered by キャンセル and the back link; clear dirty before navigation on successful submit (research R3)

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T031 [P] curl-verify mock routes: `POST /crm/equipment` (201 + 400 when `controller_number` missing), `PATCH /crm/equipment/{id}` (200 + 404 unknown id), `GET /crm/controllers` (200) — see `contracts/equipment-form-api.md`
- [x] T032 [P] Run `npm run type-check` and `npm run lint`; fix all issues in new/changed files (no `any`, tokens-only colors, lucide icons, `DatePicker` for dates)
- [ ] T033 Run the manual UAT checklist in `specs/007-equipment-form/quickstart.md` (Create / Edit / Usage-rule / Auth / Controller picker / Nav guard)
- [x] T034 [P] Confirm a11y (labeled controls, keyboard nav) and min-768px layout; document Constitution Check I–VI in the PR (note `/crm/controllers` deviation)

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Setup) ──► Phase 2 (Foundational) ──► Phase 3 (US1) ──► Phases 4–7 ──► Phase 8 (Polish)
```

### User Story Dependencies

| Story              | Depends on | Notes                                                   |
| ------------------ | ---------- | ------------------------------------------------------- |
| US1 (Register)     | Phase 2    | MVP — stands up the shared `EquipmentForm` + create     |
| US2 (Edit)         | US1        | Reuses form/schema/util; adds edit page + detail wiring |
| US3 (Usage rules)  | US1        | Layers FR-008 conditional behavior into US1 files       |
| US4 (Auth method)  | US1, US2   | FR-009 mapping + round-trip verification                |
| FR-NAV-001 (Guard) | US1        | Cross-cutting on the shared form                        |

### Parallel Opportunities

- **Phase 1**: T001–T003 in parallel
- **Phase 2**: T011 + T012 in parallel after T010 (T004–T007 already done)
- **US1**: T014 + T015 + T016 in parallel; then T017/T018/T019 (sections); then T020 (composition); then T021
- **Polish**: T031 + T032 + T034 in parallel

### Parallel Example: User Story 1

```bash
# After Phase 2, launch in parallel:
T014 equipment-form.schema.ts
T015 equipment-form.util.ts
T016 controller-picker.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1 + Phase 2 (controllers already done; finish equipment create/update API)
2. Complete Phase 3 (US1) → create form works end-to-end
3. **STOP and VALIDATE**: register a device at `/equipment/create`

### Incremental Delivery

1. US2 (Edit) → edit/prefill/update
2. US3 (Usage rules) → FR-008 conditional behavior
3. US4 (Auth) → FR-009 round-trip
4. FR-NAV-001 → discard guard
5. Phase 8 → type-check/lint/UAT sign-off

---

## Task Summary

| Metric                 | Count         |
| ---------------------- | ------------- |
| **Total tasks**        | 34            |
| Phase 1 Setup          | 3             |
| Phase 2 Foundational   | 10 (4 done)   |
| US1 Register           | 8             |
| US2 Edit               | 3             |
| US3 Usage rules        | 3             |
| US4 Auth method        | 2             |
| FR-NAV-001 Guard       | 1             |
| Polish                 | 4             |
| **Parallelizable [P]** | 12            |
| **Already complete**   | 4 (T004–T007) |

**Suggested MVP scope**: Phase 1 + Phase 2 + Phase 3 (through T021)  
**Next command**: `/speckit.implement` (or `/speckit.analyze` for a consistency pass)
