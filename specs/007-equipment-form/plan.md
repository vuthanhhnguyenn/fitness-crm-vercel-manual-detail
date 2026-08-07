# Implementation Plan: E-02 Connected Equipment Form (Create / Edit)

**Branch**: `007-equipment-form` | **Date**: 2026-06-25 | **Spec**: [spec.md](./spec.md)  
**Status**: Ready for task breakdown (`/speckit.tasks`)

---

## Summary

Implement the **接続機器 新規登録 / 編集** form for Phase 1 scope: **FR-003** (create), **FR-005** (edit), **FR-008** (usage-control rule configuration), **FR-009** (authentication method). Two routes (`/equipment/create`, `/equipment/[id]/edit`) share one `EquipmentForm` component (react-hook-form + Zod). Follow the established **locker create/edit** pattern: Zod form schema → mock-db `create`/`update` helpers → Next.js route handlers (`POST /crm/equipment`, `PATCH /crm/equipment/{id}`) → OpenAPI regen → React Query mutations → form pages.

A minimal read-only **controller picker source** (`GET /crm/controllers`) is added because no FR-007 controller list API exists yet. The controller seed is refactored from a `Record` (`CONTROLLER_SUMMARY_SEED`) into an array-backed mock entity (`db.controllers`, seed `SEED_CONTROLLERS`) consistent with the other mock objects. This is the single controlled deviation, justified in Complexity Tracking and [research.md](./research.md).

---

## Technical Context

| Item                     | Value                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| **Language/Version**     | TypeScript 5.x, Node ≥ 22.14.0, Next.js 15.3.1 (App Router)                                            |
| **Primary Dependencies** | React Query, react-hook-form, `@hookform/resolvers/zod`, Zod, shadcn/ui, hey-api generated client      |
| **Storage**              | `src/app/api/_mock-db.ts` (Phase 1 mock)                                                               |
| **Testing**              | Contract tests per mock route (happy + 1 error path); manual UAT per spec acceptance scenarios         |
| **Target Platform**      | CRM web app (staff browsers, min 768 px)                                                               |
| **Performance Goals**    | Form load (edit prefill) and submit < 1 s on mock API; meet constitution Principle VI budgets          |
| **Constraints**          | Phase 1 mock only; no direct `fetch`; no manual edits to `src/lib/api/`; `tsc --noEmit` and lint clean |
| **Scale/Scope**          | 2 routes (create/edit), 1 shared form (~4 sections), 3 API routes (POST, PATCH, GET controllers)       |

---

## Constitution Check

_GATE: must pass before Phase 0 and re-checked after design._

| Principle                             | Status | Notes                                                                                                      |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| I. Spec-first                         | ✅     | `specs/007-equipment-form/spec.md` clarified (Session 2026-06-25)                                          |
| II. Two-phase (mock now)              | ✅     | Mock route handlers in `src/app/api/crm/equipment/`; mock-db compiles against generated types              |
| III. Strict type safety               | ✅     | Zod schemas in `_schemas/`; form schema reused for client validation; no `any`                             |
| IV. Component purity & UI consistency | ✅     | shadcn `Form`/`Input`/`Select`/`RadioGroup`/`Checkbox`/`Textarea`, `DatePicker`, lucide icons, tokens only |
| V. Server state via React Query       | ✅     | Generated mutation/query factories; no raw fetch; query-key invalidation on success                        |
| VI. Performance budget                | ✅     | Client form is a leaf route; sections kept lean; no large bundles introduced                               |

**Controlled deviation**: new read-only `GET /crm/controllers` (FR-007 is out of Phase 1 scope but the Q7 picker needs a controller source). Tracked in Complexity Tracking; does not violate any principle.

**Post-design re-check**: ✅ No violations.

---

## UI Prototype Registry

| Screen                   | UI slug          | Cache path                                           |
| ------------------------ | ---------------- | ---------------------------------------------------- |
| 接続機器 新規登録 / 編集 | `equipment-form` | `.cache/fitness-crm-ui/src/pages/equipment-form.tsx` |

**Deviations from prototype (per clarified spec)**:

- 接続先ポート番号, 認証方式 & 接続先接点制御装置 are all **required** (validated, submit-blocking) — 認証方式 / 接続先接点制御装置 updated 2026-06-30 from the original Q1 "not submit-blocking" decision.
- 接続先接点制御装置 is a **picker bound to FR-007 controller records** (Q7) via `GET /crm/controllers`, not free text.
- Usage-control rule is **optional** (no "≥1 rule" enforcement); a checked judgment's Select is required, unchecking discards the value (Q3, Q4).
- All four statuses selectable on create (Q5); gate-stop note is display-only (Q6).
- Layout/components rebuilt from the project design system (not copied from the prototype).

---

## Existing Infrastructure

| Asset                                                           | Status                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------- |
| `src/app/(private)/equipment/page.tsx` (list)                   | ✅                                                         |
| `src/app/(private)/equipment/[id]/page.tsx` (detail)            | ✅ (006) — edit entry point from header 編集 button        |
| `GET /crm/equipment` / `GET /crm/equipment/{id}`                | ✅ — detail reused for edit prefill                        |
| `DELETE /crm/equipment/{id}`, `POST /crm/equipment/bulk-status` | ✅                                                         |
| `src/app/api/_schemas/equipment.schema.ts`                      | ✅ — extend with Upsert schemas                            |
| `src/app/api/_schemas/controller.schema.ts`                     | ✅ DONE — `Controller` + `GetControllersResponse`          |
| `db.equipment` (`getAll/getById/getDetailById/delete/...`)      | ✅ — add `create`, `update`                                |
| `db.controllers` (array entity) + `SEED_CONTROLLERS`            | ✅ DONE — refactored from `CONTROLLER_SUMMARY_SEED` Record |
| `_constants/constants.ts` (labels + badges)                     | ✅ — reuse; add per-use option labels if needed            |
| `src/components/ui/date-picker.tsx`                             | ✅                                                         |
| `src/components/common/role-gated-button.tsx`                   | ✅                                                         |
| `src/hooks/use-scroll-to-first-error.ts`                        | ✅                                                         |
| `Permission.EquipmentEdit`                                      | ✅ — already assigned to System/HQ/Manager/Staff           |
| `GET /crm/controllers` + `getCrmControllersOptions`             | ✅ DONE — controller picker source (route + regen)         |
| `/equipment/create`, `/equipment/[id]/edit` routes              | ❌ Create                                                  |
| `POST /crm/equipment`, `PATCH /crm/equipment/{id}`              | ❌ Create                                                  |
| `use-unsaved-changes` hook                                      | ❌ Not in repo (prototype-only) — see research R3          |

---

## Plan Decisions

| Topic                          | Decision                                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Routes                         | `/equipment/create` (create) + `/equipment/[id]/edit` (edit), mirroring `lockers/create` + `lockers/[id]/edit`                                                                 |
| Form library                   | react-hook-form + `zodResolver`, single `equipmentFormSchema` reused for create & edit (per constitution III)                                                                  |
| Persisting new fields          | `controller_number` stored on the row; `controller_id`, `remarks`, structured `usage_control_rule` kept in `_metaById` (see data-model)                                        |
| Usage-control rule persistence | Store the structured rule on the row; `buildEquipmentDetail` prefers stored rule, falls back to label-parsing for legacy seeds                                                 |
| Controller picker (Q7)         | `GET /crm/controllers` (own `db.controllers` entity, array seed `SEED_CONTROLLERS`); form stores `controller_id` + `controller_number`                                         |
| Validation (Q1/Q2/Q4)          | Field-level Zod required = name/type/serial/location/installed_on/controller_number/authentication_method/controller_id; `superRefine` only for each checked judgment's Select |
| Required (Update 2026-06-30)   | 認証方式, 接続先接点制御装置 are submit-blocking required; validated at the field level on 保存 (no longer optional)                                                           |
| Status on create (Q5)          | All four `EquipmentStatus` values selectable; default `normal`                                                                                                                 |
| Gate-stop note (Q6)            | Read-only info box shown when `equipment_type === 'entry_gate'`; not part of submitted payload                                                                                 |
| Unsaved-changes guard          | Reuse `isDirty` + cancel/back confirmation pattern; add small `AlertDialog` discard confirm (research R3)                                                                      |
| Status history on create/edit  | **Not written** in Phase 1 (consistent with 006 — history is seed-only)                                                                                                        |

---

## Project Structure

### Documentation

```text
specs/007-equipment-form/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── equipment-form-api.md
├── checklists/requirements.md
└── tasks.md             # /speckit.tasks (later)
```

### Source Code

```text
src/
├── app/
│   ├── api/
│   │   ├── _schemas/equipment.schema.ts          # MODIFY — Upsert schemas
│   │   ├── _schemas/controller.schema.ts          # DONE — Controller + GetControllersResponse
│   │   ├── _mock-db.ts                            # MODIFY — equipment create/update + meta; DONE: db.controllers + SEED_CONTROLLERS
│   │   ├── _scripts/register-schemas.ts           # DONE — register Controller schemas
│   │   ├── _routes/index.ts                        # MODIFY — register new routes (DONE: controllers)
│   │   ├── crm/controllers/route.ts               # DONE — GET controller picker source
│   │   └── crm/equipment/
│   │       ├── route.ts                            # MODIFY — add POST (create)
│   │       └── [id]/route.ts                       # MODIFY — add PATCH (update)
│   └── (private)/equipment/
│       ├── _schemas/equipment-form.schema.ts      # NEW — RHF + Zod form schema
│       ├── _utils/equipment-form.util.ts          # NEW — defaults, detail→form, form→body
│       ├── _components/
│       │   ├── equipment-form.tsx                  # NEW — shared form (sections)
│       │   ├── equipment-form-basic-info.tsx       # NEW — FR-003 + FR-009
│       │   ├── equipment-form-connection.tsx       # NEW — controller picker + port/IP/MAC
│       │   ├── equipment-form-usage-rule.tsx       # NEW — FR-008 checkboxes + selects
│       │   ├── equipment-form-remarks.tsx          # NEW — 備考
│       │   └── controller-picker.tsx               # NEW — Q7 picker (combobox/dialog)
│       ├── create/page.tsx                         # NEW — create page
│       └── [id]/edit/page.tsx                      # NEW — edit page (prefill via GET detail)
└── lib/
    ├── routes/routes.config.ts                     # MODIFY — add 2 routes
    └── permission.config.ts                        # MODIFY — map new routes → EquipmentEdit
```

**Structure Decision**: Single Next.js App-Router project. Form lives under the existing `(private)/equipment/` feature folder, following the locker module's `create` + `[id]/edit` + `_components` + `_schemas` + `_utils` layout.

---

## 1. Data Model Changes

See [data-model.md](./data-model.md). Summary:

- `controller_number` lives on the equipment row (single field behind 接続先ポート番号 / 接点制御先番号). Add a `_metaById` store for: `controller_id`, `remarks`, structured `usage_control_rule` (main/option/per_use enabled + labels).
- New Zod schemas in `equipment.schema.ts`:
  - `EquipmentUsageControlRuleInputSchema` (booleans + nullable type values)
  - `UpsertEquipmentRequestSchema` (create/update body) with cross-field `superRefine` for checked-judgment Selects
  - `CreateEquipmentResponseSchema` / `UpdateEquipmentResponseSchema`
- **DONE** — controller schemas in `controller.schema.ts`: `ControllerSchema` + `GetControllersResponseSchema` (registered in `register-schemas.ts`).
- Register new schemas with the OpenAPI registry.

---

## 2. Mock DB Extensions

Add to `db.equipment`:

```ts
create(input: UpsertEquipmentRequest): ConnectedEquipmentDetail;   // auto-number EQ-000N
update(id: string, input: UpsertEquipmentRequest): ConnectedEquipmentDetail | undefined;
```

**DONE — `db.controllers`** (array entity, refactored from the old `CONTROLLER_SUMMARY_SEED` Record):

```ts
controllers: {
  _rows: Controller[];                 // seeded from SEED_CONTROLLERS (now an array)
  getAll(): Controller[];
  getById(controllerId: string): Controller | undefined;
}
```

- `Controller` includes `controller_number` (used as a fallback match for legacy seeds).
- `buildEquipmentDetail` resolves `controller_summary` from the stored `meta.controller_id` (picked controller), falling back to a `controller_number` match in `SEED_CONTROLLERS`.
- **ID auto-numbering**: next `EQ-####` from existing `_rows` max.
- **Meta persistence**: store `controller_id`, `remarks`, structured `usage_control_rule` (`controller_number` is written directly on the row).
- **`buildEquipmentDetail`**: prefer stored structured `usage_control_rule`; fall back to existing label-parsing for legacy seeds.
- **No history append** on create/update (Phase 1; consistent with 006).
- Mock-db MUST keep compiling against `types.gen.ts` (verified — `npm run type-check` passes).

---

## 3. API Routes

See [contracts/equipment-form-api.md](./contracts/equipment-form-api.md).

| Method | Path                  | Handler                                                         |
| ------ | --------------------- | --------------------------------------------------------------- |
| POST   | `/crm/equipment`      | Validate `UpsertEquipmentRequestSchema` → `db.equipment.create` |
| PATCH  | `/crm/equipment/{id}` | Validate body → `db.equipment.update` → 404 if missing          |
| GET    | `/crm/controllers`    | **DONE** — `db.controllers.getAll()`                            |
| GET    | `/crm/equipment/{id}` | **Existing** — reused for edit prefill                          |

Auth: `getAuthUserFromRequest` pattern (as in `[id]/route.ts`). Validation errors → 400 with issue messages.

---

## 4. OpenAPI Regeneration

```bash
npm run generate-openapi
npm run generate-api
```

Expected new exports in `@tanstack/react-query.gen`:

- `postCrmEquipmentMutation`
- `patchCrmEquipmentByIdMutation`
- `getCrmControllersOptions` ✅ already generated (this change)

Reused: `getCrmEquipmentByIdOptions` (edit prefill), `getCrmEquipmentQueryKey` / `getCrmEquipmentByIdQueryKey` (invalidation).

---

## 5. Routing & Permissions

**`routes.config.ts`** (add, with `private: true`):

```ts
'/equipment/create': { router: '/equipment/create', filePath: '(private)/equipment/create', pattern: '/equipment/create', private: true },
'/equipment/[id]/edit': { router: (id) => `/equipment/${id}/edit`, filePath: '(private)/equipment/[id]/edit', pattern: '/equipment/:id/edit', private: true },
```

**`permission.config.ts`**:

```ts
'/equipment/create': Permission.EquipmentEdit,
'/equipment/:id/edit': Permission.EquipmentEdit,
```

---

## 6. Frontend — Pages

**Reference**: `lockers/create/page.tsx` and `lockers/[id]/edit/page.tsx`.

- **Create** (`create/page.tsx`): `useForm` with `emptyEquipmentFormDefaults`; `postCrmEquipmentMutation`; on success `toast.success('接続機器を登録しました')`, invalidate list, `navigate('/equipment')` (or detail). `useScrollToFirstError` on invalid submit.
- **Edit** (`[id]/edit/page.tsx`): `getCrmEquipmentByIdOptions` wrapped in `DataStateBoundary` (loading skeleton / error `接続機器の取得に失敗しました` + retry); inner form seeded by `equipmentDetailToFormValues`; `patchCrmEquipmentByIdMutation`; on success `toast.success('接続機器の変更を保存しました')`, invalidate detail + list, navigate. Submit guarded by `isDirty`.
- Layout: `BreadcrumbNav` header + `max-w-[960px]` container + fixed footer actions (キャンセル / 登録｜更新), matching locker form.

---

## 7. Frontend — Form & Sections

`EquipmentForm` (`mode: 'create' | 'edit'`) renders four sections via shadcn `Form` context:

1. **基本情報** — 機器名, 機器タイプ (Select), シリアルナンバー, 設置場所, 設置日 (`DatePicker`), 状態 (Select, 4 options), 認証方式 (RadioGroup, FR-009). 接続機器ID read-only.
2. **接続情報** — `ControllerPicker` (Q7, via `getCrmControllersOptions`), 接続先ポート番号 (required), IPアドレス, MACアドレス.
3. **利用制御ルール** (FR-008) — three `Checkbox` + conditional `Select` (主契約タイプ / オプション種別 / 都次オプション種別); gate-stop info box when `entry_gate`.
4. **備考** — `Textarea` (max 1000 chars per constitution).

**Validation** (`equipmentFormSchema` + `superRefine`):

- Required: `name`, `equipment_type`, `serial_number`, `install_location`, `installed_on`, `controller_number` (接続先ポート番号), `authentication_method`, `controller_id` (Update 2026-06-30).
- Conditional: when `rule.main_enabled` → `rule.main_contract_type` required; same for option/per_use (Q4).
- Optional: `ip_address`, `mac_address`, `remarks`.
- On submit error → `useScrollToFirstError` focuses first invalid field; footer shows error hint.

**Form → body util**: drop hidden (unchecked) judgment values before submit (Q4); map labels/enums to request shape.

---

## 8. Constants

Reuse `EQUIPMENT_TYPE_LABELS`, `EQUIPMENT_STATUS_LABELS`, `EQUIPMENT_AUTHENTICATION_LABELS`, `EQUIPMENT_CONTRACT_LINK_TYPE_LABELS`. Add option/per-use type option lists (水素水/プロテイン/タンニング/その他; 〜都次/コラーゲン都次) and main-contract type options (スタンダード/プレミアム/ライト) as constants if not already present (sourced from prototype Selects; confirm against G-01/G-02 in tasks).

---

## 9. Implementation Phases

| Phase                | Tasks                                                                                                                                        | Deliverable                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **A — API**          | Upsert schema, mock-db `create/update`; (DONE: controller schema, `db.controllers`, `GET /crm/controllers`, regen); POST/PATCH routes, regen | Testable via OpenAPI / curl        |
| **B — Form shell**   | Form schema, util, routes, permissions, create + edit pages (prefill/states)                                                                 | Navigable create & edit forms      |
| **C — Sections**     | Basic info (+FR-009), connection (+controller picker), usage rule (FR-008), remarks                                                          | FR-003/005/008/009 fields rendered |
| **D — Validation**   | Zod `superRefine`, scroll-to-error, footer hint, dirty/discard guard                                                                         | Clarified validation behavior      |
| **E — Integration**  | Wire detail 編集 button + list 新規登録 to routes; toasts; invalidation                                                                      | End-to-end create/edit flow        |
| **F — Polish/tests** | Contract tests (POST/PATCH/GET controllers), `tsc`/lint, a11y, perf check                                                                    | Definition-of-Done gates           |

---

## Complexity Tracking

| Deviation                                                  | Why Needed                                                                         | Simpler Alternative Rejected Because                                                                                                                                              |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New `GET /crm/controllers` (own resource)                  | Q7 requires a controller picker tied to FR-007 records, which have no list API yet | Free-text controller entry (prototype) rejected — spec mandates a picker bound to real controllers; placed at `/crm/controllers` (not nested under equipment) as its own resource |
| New row meta (`controller_id`, `remarks`, structured rule) | Prototype/base list item lacks these; create/edit must persist them                | Deriving rule from `linked_contract_labels` (006) is lossy and can't round-trip create/edit input                                                                                 |

No constitution principle violations.

---

## Next Step

Run **`/speckit.tasks`** to generate `tasks.md` from this plan.
