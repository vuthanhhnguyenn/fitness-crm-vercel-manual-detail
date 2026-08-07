# Quickstart: E-02 Connected Equipment Form (Create / Edit)

**Feature**: `007-equipment-form`  
**Date**: 2026-06-25

How to build, run, and verify the connected-equipment create/edit form (Phase 1, mock API).

---

## Prerequisites

- Node ≥ 22.14.0, repo deps installed (`npm install`)
- On branch `007-equipment-form`
- Familiarity with the locker form pattern (`src/app/(private)/lockers/create`, `lockers/[id]/edit`)

---

## Build order

1. **Schemas** — extend `src/app/api/_schemas/equipment.schema.ts`:
   `EquipmentUsageControlRuleInputSchema`, `UpsertEquipmentRequestSchema` (+ `superRefine`),
   create/update response schemas. Register them in the OpenAPI registry.
   _(DONE: `src/app/api/_schemas/controller.schema.ts` — `Controller` + `GetControllersResponse`, registered.)_
2. **Mock DB** — add `db.equipment.create`, `update`; write `controller_number` on the row and
   add row meta (`controller_id`, `remarks`, structured `usage_control_rule`); update
   `buildEquipmentDetail` to prefer stored rule.
   _(DONE: `db.controllers` array entity + `SEED_CONTROLLERS`, refactored from `CONTROLLER_SUMMARY_SEED`.)_
3. **Routes** — `POST /crm/equipment` (in `crm/equipment/route.ts`),
   `PATCH /crm/equipment/{id}` (in `crm/equipment/[id]/route.ts`).
   _(DONE: `GET /crm/controllers` at `crm/controllers/route.ts`, registered in `_routes/index.ts`.)_
4. **Regenerate client**:

   ```bash
   npm run generate-openapi
   npm run generate-api
   ```

5. **Form schema + util** — `_schemas/equipment-form.schema.ts`, `_utils/equipment-form.util.ts`
   (`emptyEquipmentFormDefaults`, `equipmentDetailToFormValues`, `equipmentFormValuesToBody`).
6. **Form component + sections** — `_components/equipment-form.tsx` (+ basic-info, connection,
   usage-rule, remarks, controller-picker).
7. **Pages** — `create/page.tsx`, `[id]/edit/page.tsx`.
8. **Routing/permissions** — add routes to `routes.config.ts`; map to `Permission.EquipmentEdit`
   in `permission.config.ts`.
9. **Wire entry points** — list 新規登録 → `/equipment/create`; detail 編集 → `/equipment/[id]/edit`.

---

## Run

```bash
npm run dev
```

- Create: open `/equipment/create`
- Edit: open `/equipment/<id>/edit` (e.g. `/equipment/EQ-0001/edit`)

---

## Manual verification (maps to spec acceptance scenarios)

### Create (FR-003)

- [ ] Title 接続機器 新規登録; submit button 登録; 接続機器ID shows （自動採番）.
- [ ] Submitting empty form blocks with errors on 機器名/機器タイプ/シリアルナンバー/設置場所/設置日 **and 接続先ポート番号**; view scrolls to first invalid (US1-2, Q2).
- [ ] 認証方式 and 接続先接点制御装置 left empty **block submit** and show a red border + error message (Update 2026-06-30).
- [ ] All four 状態 options selectable (Q5).
- [ ] Filling required fields → toast 接続機器を登録しました → redirect to list; new `EQ-####` appears.
- [ ] Submitting with no usage-control judgment selected is allowed (Q3).

### Edit (FR-005)

- [ ] `/equipment/EQ-0001/edit` prefills all fields; title 接続機器 編集; button 更新.
- [ ] Changing a value + 更新 → toast 接続機器の変更を保存しました → redirect; change persists on reopen (SC-004).
- [ ] Loading shows skeleton; fetch error shows 接続機器の取得に失敗しました + retry.

### Usage-control rule (FR-008)

- [ ] Checking 主契約判定 reveals 主契約タイプ (スタンダード/プレミアム/ライト).
- [ ] Checking オプション契約判定 reveals オプション種別 (水素水/プロテイン/タンニング/その他).
- [ ] Checking 都次オプション判定 reveals 都次オプション種別 (…都次 / コラーゲン都次).
- [ ] Checked judgment with empty Select blocks submit (Q4); unchecking discards the value (Q4).
- [ ] 入退館ゲート shows the read-only gate-stop info box (Q6).

### Authentication (FR-009)

- [ ] 認証方式 offers 会員読取型 / 機器読取型 / なし; selection saved and shown on detail (SC-005).

### Controller picker (Q7)

- [ ] 接続先接点制御装置 opens a picker listing controllers from `GET /crm/controllers` (`getCrmControllersOptions`); selection stored.

### Navigation guard (FR-NAV-001)

- [ ] Editing then キャンセル/back shows 変更を破棄しますか？; 破棄する leaves, 編集を続ける stays.
- [ ] Successful submit navigates without a discard prompt.

---

## Definition of Done gates

- [ ] `npx tsc --noEmit` exits 0 (mock-db compiles against `types.gen.ts`).
- [ ] `npm run lint` clean.
- [ ] Contract tests: POST (201 + 400), PATCH (200 + 404), GET controllers (200) — see contracts.
- [ ] Constitution Check I–VI documented in PR (controller endpoint deviation noted).
- [ ] No raw colors/icons; date input via `DatePicker`; min-width 768 px; a11y on form controls.
