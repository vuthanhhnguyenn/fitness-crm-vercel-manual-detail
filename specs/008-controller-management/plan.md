# Implementation Plan: E-02 Contact-Control Device (接点制御装置) Management

**Branch**: `008-controller-management` (working on `feat/equipment`) | **Date**: 2026-06-26 | **Spec**: [spec.md](./spec.md)  
**Status**: Ready for task breakdown (`/speckit.tasks`)

---

## Summary

Implement the full **接点制御装置 (contact-control device) management** module for Phase 1 scope: **FR-007**. The controller list becomes **its own route group** (`/controllers`, `/controllers/[id]`, `/controllers/create`, `/controllers/[id]/edit`) — not a tab nested inside the equipment screen. Four capabilities are delivered: list (search + status filter + sortable columns), read-only detail (basic info + connected-devices list + read-only change history), create/edit form, and delete-with-guard + status-change.

The **equipment module (006/007) is the directly-mirrorable template** for every layer (layered Zod schemas → mock-db entity with CRUD/history/meta → Next.js route handlers → OpenAPI regen → React Query hooks → list/detail/form pages → shared `DataTable`/`DataStateBoundary`/`RoleGatedButton`/`SearchableSelect`/nuqs filter hook/dirty-only PATCH util/inline discard guard). The controller infrastructure today is only a **read-only `GET /crm/controllers`** lookup used by the equipment form's `ControllerPicker`; this plan extends it to a complete resource.

**Two net-new patterns with no existing precedent** (both justified in Complexity Tracking & [research.md](./research.md)):

1. A **connected-devices list keyed by controller** (the inverse of the existing equipment→controller link).
2. A **delete-with-guard** that blocks deletion while devices are still wired to the controller (FR-007 異常系).

The existing `Controller` schema/seed is **extended** (store, location, firmware, control-port count, port, timestamps, derived device count) to satisfy FR-007's field set — done in a backward-compatible way so the equipment `ControllerPicker` and `buildEquipmentDetail` matching keep working.

---

## Technical Context

| Item                     | Value                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Language/Version**     | TypeScript 5.x (strict, no-explicit-any), Node ≥ 24, Next.js (App Router only)                                                     |
| **Primary Dependencies** | TanStack React Query (generated option-factories), react-hook-form + `@hookform/resolvers/zod`, Zod, nuqs, shadcn/ui, lucide-react |
| **Storage**              | `src/app/api/_mock-db.ts` (Phase 1 mock); Zod schemas in `src/app/api/_schemas/`                                                   |
| **Testing**              | Contract test per mock route (happy + ≥1 error path); manual UAT against spec acceptance scenarios                                 |
| **Target Platform**      | CRM web app, staff browsers, min viewport 768 px                                                                                   |
| **Project Type**         | Single Next.js App-Router web project (mock-backed Phase 1)                                                                        |
| **Performance Goals**    | List load + form submit < 1 s on mock API; meet constitution Principle VI budgets (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1)           |
| **Constraints**          | Phase 1 mock only; no raw `fetch`; no manual edits to `src/lib/api/`; `tsc --noEmit` + eslint clean; history is **seed/read-only** |
| **Scale/Scope**          | 4 routes, ~3 pages + 1 shared form, ~6 API route handlers, 1 mock entity extension, ≤ 50 controllers/store                         |

No `NEEDS CLARIFICATION` remain — the spec was clarified in Session 2026-06-26 (Q1 view access, Q2 required-field set, Q3 status-change persistence).

---

## Constitution Check

_GATE: must pass before Phase 0 and re-checked after design._

| Principle                             | Status | Notes                                                                                                                                   |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| I. Spec-first                         | ✅     | `specs/008-controller-management/spec.md` clarified; traces to E-02 FR-007 + prototype files                                            |
| II. Two-phase (mock now)              | ✅     | All data via mock route handlers under `src/app/api/crm/controllers/`; mock-db compiles against `types.gen.ts`                          |
| III. Strict type safety               | ✅     | Layered Zod schemas in `_schemas/controller.schema.ts`; form schema reused for client validation; no `any`                              |
| IV. Component purity & UI consistency | ✅     | `DataTable`, `DataStateBoundary`, `RoleGatedButton`, shadcn `Form`/`Select`/`Input`/`Textarea`/`AlertDialog`, lucide icons, tokens only |
| V. Server state via React Query       | ✅     | Generated option-factories + mutations; no raw fetch; query-key invalidation on mutate; list uses server-side paging                    |
| VI. Performance budget                | ✅     | RSC-default pages with client leaves only where needed; no large bundles introduced                                                     |

**Controlled deviations** (see Complexity Tracking): (a) connected-devices-by-controller helper; (b) delete-with-guard (409 path). Neither violates a principle.

**Post-design re-check**: ✅ No violations (design keeps schemas in `_schemas/`, reuses shared components, no global store, no raw fetch).

---

## UI Prototype Registry

| Screen                 | UI slug             | Cache path                                                       |
| ---------------------- | ------------------- | ---------------------------------------------------------------- |
| 接点制御装置一覧       | `controller-list`   | `.cache/fitness-crm-ui/src/components/controller-list-panel.tsx` |
| 接点制御装置 新規/編集 | `controller-form`   | `.cache/fitness-crm-ui/src/pages/controller-form.tsx`            |
| 接点制御装置詳細       | `controller-detail` | `.cache/fitness-crm-ui/src/pages/controller-detail.tsx`          |

**Deviations from prototype (per clarified spec & constitution)**:

- The controllers list is a **dedicated route** (`/controllers`), not a tab inside `/equipment` (user direction). The equipment list's stub `接点制御装置一覧` tab and stub `接点制御装置を登録` dropdown item are repointed to the new route (or removed) during integration.
- Form validation is **enforced** (Q2): submit-blocking = 装置名 / 店舗コード / 設置場所 / IPアドレス / 制御ポート数 / ポート番号 / 状態; ファームウェアバージョン optional; IP must match local-IP pattern. (Prototype had no validation.)
- Observer may **view** list/detail; config actions gated to System/HQ/Manager/Staff (Q1).
- Status-change dialog updates **only** the controller's current 状態 — **no** history entry written (Q3). Change history is **seed/read-only**.
- Delete is blocked while connected devices exist (FR-007 異常系) — enforced both in UI (disabled button) and API (guard → 409).
- Layout/components rebuilt from the project design system (not copied from the prototype).

---

## Existing Infrastructure

| Asset                                                                                             | Status                                                                            |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `GET /crm/controllers` + `getCrmControllersOptions`                                               | ✅ — read-only list (no filter/paging); **extend** with query params + paging     |
| `src/app/api/_schemas/controller.schema.ts`                                                       | ✅ — `ControllerSchema`, `GetControllers{Query,Response}`; **extend** (see below) |
| `db.controllers` (`getAll`, `getById`)                                                            | ✅ — **extend** with detail/devices/history/create/update/delete/updateStatus     |
| `SEED_CONTROLLERS` (8 rows)                                                                       | ✅ — **extend** fields + add store/location/fw/ports/timestamps                   |
| `register-schemas.ts` registers `Controller`, `GetControllersResponse`                            | ✅ — **add** new controller schemas                                               |
| Equipment module (006/007) full CRUD/detail/history/form                                          | ✅ — **template to mirror** (mock-db, schemas, routes, pages, components, hooks)  |
| `db.equipment` rows carry `controller_number`; meta carries `controller_id`                       | ✅ — source for the connected-devices-by-controller helper                        |
| `buildEquipmentHistorySeed` / `SEED_EQUIPMENT_HISTORY` pattern                                    | ✅ — reference for `SEED_CONTROLLER_HISTORY` (read-only)                          |
| `DataTable`, `DataStateBoundary`, `RoleGatedButton`, `StatusCard`                                 | ✅ — reuse                                                                        |
| `SearchableSelect` + `getCrmStoresOptions` / `getCrmStoresByIdOptions`                            | ✅ — reuse for store filter & form store field (no dedicated `StoreCombobox`)     |
| `use-scroll-to-first-error`, `TablePaginationWithSize`, `PageHeader`, `BackLink`, `BreadcrumbNav` | ✅ — reuse                                                                        |
| `EQUIPMENT_STATUS_LABELS` / `EQUIPMENT_STATUS_BADGE_MAP`                                          | ✅ — reuse (controller status reuses the equipment status enum)                   |
| `Permission` enum (equipment block last)                                                          | ✅ — **add** `ControllerView/Edit/Delete`                                         |
| `src/app/(private)/controllers/` (pages)                                                          | ❌ Create (entire route group)                                                    |
| `controllers/[id]`, `bulk-status`/status route, `[id]/history`                                    | ❌ Create                                                                         |
| `POST/PATCH/DELETE /crm/controllers`                                                              | ❌ Create                                                                         |
| connected-devices-by-controller helper                                                            | ❌ Create (no precedent)                                                          |
| delete-with-guard                                                                                 | ❌ Create (no precedent)                                                          |
| dedicated `useUnsavedChanges` hook                                                                | ❌ Not in repo — use the inline `isDirty` + `AlertDialog` pattern (as equipment)  |

---

## Plan Decisions

| Topic                       | Decision                                                                                                                                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route group                 | Own `(private)/controllers/` group: `/controllers` (list), `/controllers/[id]` (detail), `/controllers/create`, `/controllers/[id]/edit` — mirrors equipment route layout                                                  |
| Controller schema extension | Extend `ControllerSchema` with `store_code`, `location`, `firmware_version` (nullable), `control_port_count`, `port`, `created_at`, `updated_at`; add `device_count` to detail/list                                        |
| Backward compatibility      | New fields seeded for all 8 `SEED_CONTROLLERS`; `ControllerPicker` & `buildEquipmentDetail` only read `controller_id/name/ip_address/port/status` — unaffected                                                             |
| List query                  | New `GetControllersQuerySchema`: `search` (name/IP), `status`, `store_id`, `sort_by`, `sort_order`, `page`, `limit` (≤ 50); response `{items,total,page,limit,total_pages}`                                                |
| Detail                      | `ControllerDetailSchema` = controller fields + `device_count` + `device_summary` (total/normal/error counts); connected devices fetched via a separate list endpoint                                                       |
| Connected devices           | New `db.controllers.getConnectedDevices(id)` iterating `db.equipment._rows` matching `controller_id` (meta) then `controller_number`; exposed at `GET /crm/controllers/{id}/devices`                                       |
| Change history              | `db.controllers.getHistory(id)` over `_historyByControllerId` seeded by `buildControllerHistorySeed` + `SEED_CONTROLLER_HISTORY`; **read-only** (no append on any mutation)                                                |
| Validation (Q2)             | Zod `superRefine`/required on form schema: 装置名, 店舗コード, 設置場所, IPアドレス (local-IP regex), 制御ポート数, ポート番号, 状態; ファームウェアバージョン optional                                                    |
| Create/Edit                 | Shared `ControllerForm` (`mode: create \| edit`); create → `POST`; edit → prefill via `GET detail` + dirty-only `PATCH`                                                                                                    |
| Delete + guard (異常系)     | `db.controllers.delete(id)` returns a guard result when `device_count > 0`; `DELETE` route → 409 with message; detail disables 削除 when `device_count > 0`                                                                |
| Status change (Q3)          | `db.controllers.updateStatus(id, status)` updates 状態 **only**; **no** history entry; surfaced via `PATCH /crm/controllers/{id}` (status field) — dialog sends status (+ optional reason/type captured but not persisted) |
| Access control (Q1)         | `ControllerView` (Sys/HQ/Mgr/Staff/Observer) for list+detail; `ControllerEdit` (Sys/HQ/Mgr/Staff) for create/edit/status; `ControllerDelete` (Sys/HQ/Mgr/Staff) for delete                                                 |
| Unsaved-changes guard       | Inline `isDirty` + `AlertDialog` discard confirm (matches equipment forms; no dedicated hook in repo)                                                                                                                      |

---

## Project Structure

### Documentation (this feature)

```text
specs/008-controller-management/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── controller-management-api.md
├── checklists/requirements.md
└── tasks.md             # /speckit.tasks (later)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   ├── _schemas/controller.schema.ts          # MODIFY — extend Controller; add List/Detail/Devices/History/Upsert/Patch/StatusChange schemas
│   │   ├── _mock-db.ts                             # MODIFY — extend SEED_CONTROLLERS; controller history seed; db.controllers CRUD + detail + devices + history + delete-guard + updateStatus
│   │   ├── _scripts/register-schemas.ts           # MODIFY — register new controller schemas
│   │   ├── _routes/index.ts                        # MODIFY — register new controller routes for OpenAPI
│   │   └── crm/controllers/
│   │       ├── route.ts                            # MODIFY — GET (add filter/sort/paging) + POST (create)
│   │       ├── [id]/route.ts                       # NEW — GET detail, PATCH (update + status), DELETE (guarded)
│   │       ├── [id]/devices/route.ts               # NEW — GET connected devices
│   │       └── [id]/history/route.ts               # NEW — GET read-only change history
│   └── (private)/controllers/
│       ├── page.tsx                                # NEW — list (DataTable + filters + paging)
│       ├── _hooks/use-controller-filters.ts        # NEW — nuqs filter state (search/status/store)
│       ├── _constants/constants.ts                 # NEW — controller-specific labels (reuse equipment status labels/badges)
│       ├── _components/
│       │   ├── controller-filters.tsx              # NEW — search + status + store filter row
│       │   └── controller-table-columns.tsx        # NEW — ColumnDef[] (9 columns)
│       ├── _schemas/controller-form.schema.ts      # NEW — RHF + Zod form schema (Q2 validation)
│       ├── _utils/controller-form.util.ts          # NEW — defaults, detail→form, form→body, dirty→patch
│       ├── create/page.tsx                         # NEW — create page
│       └── [id]/
│           ├── page.tsx                            # NEW — detail (tabs + header actions)
│           ├── edit/page.tsx                       # NEW — edit page (prefill + dirty PATCH)
│           └── _components/
│               ├── controller-basic-info-tab.tsx   # NEW — info card + status card + device summary + meta
│               ├── controller-devices-tab.tsx      # NEW — connected-devices DataTable + summary footer
│               ├── controller-history-tab.tsx       # NEW — read-only history table
│               ├── controller-status-dialog.tsx     # NEW — status change (status only, no history)
│               ├── controller-delete-dialog.tsx      # NEW — AlertDialog (only when device_count = 0)
│               ├── controller-detail-skeleton.tsx    # NEW — loading skeleton
│               └── controller-form.tsx              # NEW — shared create/edit form
└── lib/
    ├── routes/routes.config.ts                     # AUTO/MODIFY — controller routes generated when pages added
    └── permission.config.ts                        # MODIFY — map /controllers* → Controller permissions
src/types/permission.type.ts                        # MODIFY — add ControllerView/Edit/Delete to Permission enum
```

**Structure Decision**: Single Next.js App-Router project. The controller module lives in its own `(private)/controllers/` feature folder (dedicated route per user direction), following the equipment module's `page` + `[id]` + `create` + `[id]/edit` + `_components`/`_schemas`/`_utils`/`_hooks`/`_constants` layout.

---

## 1. Data Model Changes

See [data-model.md](./data-model.md). Summary:

- **Extend `Controller`** with `store_code`, `location`, `firmware_version` (nullable), `control_port_count`, `port`, `created_at`, `updated_at`; seed all rows.
- **New schemas** in `controller.schema.ts`: `GetControllersQuerySchema` (search/status/store/sort/paging), paginated `GetControllersResponseSchema` (items+total+page+limit+total_pages), `ControllerDetailSchema` (+ `device_count` + `device_summary`), `ControllerConnectedDeviceSchema` + `GetControllerDevicesResponseSchema`, `ControllerHistoryItemSchema` + `GetControllerHistoryResponseSchema`, `UpsertControllerRequestSchema` / `PatchControllerRequestSchema` (status-change reuses PATCH), and `Create/Update/GetDetail/Delete` responses.
- **Mock-db**: extend `db.controllers` with `getDetailById`, `getConnectedDevices`, `getHistory`, `create` (auto-number `CTRL-####`), `update`, `updateStatus`, `delete` (guarded). Add `_historyByControllerId` + `SEED_CONTROLLER_HISTORY` via `buildControllerHistorySeed`.
- Register all new schemas with the OpenAPI registry; mock-db MUST keep compiling against `types.gen.ts`.

---

## 2. API Routes

See [contracts/controller-management-api.md](./contracts/controller-management-api.md).

| Method | Path                            | Handler                                                                          |
| ------ | ------------------------------- | -------------------------------------------------------------------------------- |
| GET    | `/crm/controllers`              | Validate `GetControllersQuerySchema` → filter/sort/paginate → list response      |
| POST   | `/crm/controllers`              | Validate `UpsertControllerRequestSchema` → `db.controllers.create` → 201         |
| GET    | `/crm/controllers/{id}`         | `db.controllers.getDetailById` → 404 if missing                                  |
| PATCH  | `/crm/controllers/{id}`         | Validate `PatchControllerRequestSchema` → `db.controllers.update`/`updateStatus` |
| DELETE | `/crm/controllers/{id}`         | Guard: 409 if `device_count > 0`; else `db.controllers.delete` → 204             |
| GET    | `/crm/controllers/{id}/devices` | `db.controllers.getConnectedDevices` → connected-device list                     |
| GET    | `/crm/controllers/{id}/history` | `db.controllers.getHistory` → read-only history                                  |

Auth via `getAuthUserFromRequest`; validation errors → 400 with issue messages; each method wrapped in `registerRoute({...})` for OpenAPI.

---

## 3. OpenAPI Regeneration

```bash
npm run generate-openapi
npm run generate-api
```

Expected new exports in `@tanstack/react-query.gen`:

- `postCrmControllersMutation`, `patchCrmControllersByIdMutation`, `deleteCrmControllersByIdMutation`
- `getCrmControllersByIdOptions`, `getCrmControllersByIdDevicesOptions`, `getCrmControllersByIdHistoryOptions`
- Updated `getCrmControllersOptions` (now accepts the richer query)

The generated `src/lib/api/` subtree is never hand-edited.

---

## 4. Routing & Permissions

- **Routes**: created automatically by the route-generation lib when the `(private)/controllers/` pages are added; verify entries land in `routes.config.ts` (`/controllers`, `/controllers/[id]`, `/controllers/create`, `/controllers/[id]/edit`, all `private: true`).
- **Permission enum** (`src/types/permission.type.ts`): append `ControllerView = 'controller.view'`, `ControllerEdit = 'controller.edit'`, `ControllerDelete = 'controller.delete'`.
- **`permission.config.ts`** route→permission map:
  - `/controllers` → `ControllerView`
  - `/controllers/:id` → `ControllerView`
  - `/controllers/create` → `ControllerEdit`
  - `/controllers/:id/edit` → `ControllerEdit`
- **Role grants** (per spec Q1): `ControllerView` → System/HQ/Manager/Staff/Observer; `ControllerEdit` & `ControllerDelete` → System/HQ/Manager/Staff. Trainer: none.
- Use the typed `navigate` helper for all controller navigation.

---

## 5. Frontend — Pages

**Reference**: equipment list / `[id]` / `create` / `[id]/edit`.

- **List** (`controllers/page.tsx`): `useControllerFilters` (nuqs) → `getCrmControllersOptions({ query })` → `DataTable` (`variant="simple"`, `manualSorting`, `onRowClick → navigate('/controllers/[id]', row.id)`, red row for `status==='error'`) + `controller-filters` + `TablePaginationWithSize`. `PageHeader` with count + `RoleGatedButton`(`ControllerEdit`) `接点制御装置を登録` → `/controllers/create`. No CSV (out of scope).
- **Detail** (`[id]/page.tsx`): `PageHeader` (`BackLink` → `/controllers`, status badge) + `RoleGatedButton`s: 削除 (`ControllerDelete`, disabled when `device_count > 0`) and 編集 (`ControllerEdit`) → `/controllers/[id]/edit`. `DataStateBoundary` (skeleton/error/empty) wraps `Tabs` synced to `?tab=`: 基本情報 / 紐付き機器一覧 / 変更履歴.
- **Create** (`create/page.tsx`): `ControllerForm` mode `create`; `postCrmControllersMutation`; success toast `接点制御装置を登録しました`, invalidate list, `navigate('/controllers')`.
- **Edit** (`[id]/edit/page.tsx`): load via `getCrmControllersByIdOptions` in `DataStateBoundary`; `patchCrmControllersByIdMutation` (dirty fields only); success toast `接点制御装置の変更を保存しました`, invalidate detail + list, navigate. Update disabled unless `isDirty`; inline discard guard.

---

## 6. Frontend — Components

- **`controller-filters.tsx`**: search `Input` (装置名、IPアドレスで検索) + status `Select` (全ステータス + 4 states) + store `SearchableSelect` (shown when ≥2 accessible stores) + clear-all.
- **`controller-table-columns.tsx`**: `ColumnDef[]` — 装置ID, 装置名, 店舗コード, 設置場所, IPアドレス, FW, 制御ポート数, 紐付き機器数, ステータス (badge via `EQUIPMENT_STATUS_BADGE_MAP`), sortable via `DataTableColumnHeader`.
- **`controller-form.tsx`**: shadcn `Form` with two cards — 基本情報 (装置名, 店舗コード via `SearchableSelect`, 設置場所, info `Alert`, IPアドレス, FW, 制御ポート数, ポート番号) and ステータス (状態 Select). Footer actions (キャンセル / 登録｜更新); `useScrollToFirstError`; discard `AlertDialog` on dirty.
- **`controller-basic-info-tab.tsx`**: left = info card (all read-only fields incl. ポート番号); right (sticky) = `StatusCard` (icon `Cpu`, action `ステータス変更` → dialog, `ControllerEdit`-gated), 紐付き機器サマリー card (total/normal/error + link to 紐付き機器一覧 tab), その他情報 card (作成日時/更新日時).
- **`controller-devices-tab.tsx`**: `DataTable` of connected devices (機器ID, 機器名, 接点番号, ゲート種別, ステータス) + summary footer (合計/正常/異常). `ゲート種別` derived/best-effort (see research R5).
- **`controller-history-tab.tsx`**: read-only `Table` (日時, 操作者, 種別, ステータス変化 from→to badges / 新規作成, メモ) + summary footer. No write controls.
- **`controller-status-dialog.tsx`**: 変更種別 Select + 新しいステータス Select + メモ `Textarea` (optional); 変更を保存 → `patchCrmControllersByIdMutation({ status })` — updates 状態 only, no history (Q3).
- **`controller-delete-dialog.tsx`**: `AlertDialog`; confirm → `deleteCrmControllersByIdMutation` → toast + navigate to list. Only reachable when `device_count = 0`.

---

## 7. Constants

Reuse `EQUIPMENT_STATUS_LABELS` / `EQUIPMENT_STATUS_BADGE_MAP` (controller status shares the enum). Add controller-specific labels in `controllers/_constants/constants.ts`: column headers, 変更種別 options (ステータス変更 / 故障報告 / 点検完了), and helper texts (IP format, FW format, control-port count, port number) sourced from the prototype.

---

## 8. Implementation Phases

| Phase                | Tasks                                                                                                                                                                                                                                                                                                  | Deliverable                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **A — Data/API**     | Extend `Controller` schema + seed; add list/detail/devices/history/upsert/patch schemas + register; controller history seed; `db.controllers` detail/devices/history/create/update/updateStatus/delete-guard; route handlers (GET+POST list, `[id]` GET/PATCH/DELETE, devices, history); OpenAPI regen | Testable via OpenAPI / curl          |
| **B — List**         | `use-controller-filters`, `controller-filters`, `controller-table-columns`, `/controllers` page, routes + permissions                                                                                                                                                                                  | Browsable, searchable, sortable list |
| **C — Detail**       | Detail page + skeleton, 基本情報 tab (info + status card + summary + meta), delete dialog (guard), status dialog                                                                                                                                                                                       | Read-only detail + delete + status   |
| **D — Devices/Hist** | Connected-devices tab (table + summary), read-only history tab                                                                                                                                                                                                                                         | FR-007 device reference + history    |
| **E — Form**         | Form schema + util, `controller-form`, create + edit pages (prefill, dirty PATCH, discard guard, validation Q2)                                                                                                                                                                                        | Create & edit flows                  |
| **F — Integration**  | Repoint equipment list stub tab/button to `/controllers`; enable equipment-detail "装置詳細を見る" link; toasts; invalidation                                                                                                                                                                          | End-to-end controller management     |
| **G — Polish/tests** | Contract tests (all routes, incl. 409 delete-guard), `tsc`/lint, a11y, perf                                                                                                                                                                                                                            | Definition-of-Done gates             |

---

## Complexity Tracking

| Deviation                                         | Why Needed                                                                                     | Simpler Alternative Rejected Because                                                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Connected-devices-by-controller helper + endpoint | FR-007 requires referencing devices wired to a controller; no inverse link exists today        | Reusing `buildEquipmentDetail`'s forward match is the wrong direction; a dedicated `getConnectedDevices` keeps the detail query simple |
| Delete-with-guard (409 path)                      | FR-007 異常系: a controller with connected devices MUST NOT be deletable                       | Unconditional delete (equipment pattern) would orphan device→controller links and violate the requirement                              |
| `Controller` schema/seed extension                | Prototype/FR-007 fields (store, location, FW, control-port count, port, timestamps) are absent | Keeping the minimal lookup shape can't satisfy FR-007 list/detail/form; extension is backward-compatible for the equipment picker      |

No constitution principle violations.

---

## Next Step

Run **`/speckit.tasks`** to generate `tasks.md` from this plan.
