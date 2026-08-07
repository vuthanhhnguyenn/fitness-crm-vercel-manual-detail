# Implementation Plan: E-02 Connected Equipment Detail

**Branch**: `006-equipment-detail` | **Date**: 2026-06-24 | **Spec**: [spec.md](./spec.md)  
**Status**: Ready for task breakdown (`/speckit.tasks`)

---

## Summary

Implement the **接続機器詳細** screen at `/equipment/[id]` for Phase 1 scope: **FR-004** (read-only detail), **FR-006** (delete), **FR-012** (status history table), and **manual status change**. Follow the established **locker detail** pattern: Zod schemas → mock-db → Next.js route handlers → OpenAPI regen → React Query hooks → client page with tabbed layout.

---

## Technical Context

| Item                     | Value                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| **Language/Version**     | TypeScript, Node v22.14.0, Next.js 15.3.1                                                         |
| **Primary Dependencies** | React Query, shadcn/ui, Zod, hey-api generated client                                             |
| **Storage**              | `src/app/api/_mock-db.ts` (Phase 1)                                                               |
| **Testing**              | Manual UAT per spec acceptance scenarios                                                          |
| **Target Platform**      | CRM web app (staff browsers, min 768px)                                                           |
| **Performance Goals**    | Detail load & status change < 1s on mock API                                                      |
| **Constraints**          | Phase 1 mock only; no direct `fetch`; no manual edits to `src/lib/api/`                           |
| **Scale/Scope**          | 1 detail page, **3 new API routes** + reuse `POST /crm/equipment/bulk-status`, ~12 new components |

---

## Constitution Check

| Gate                       | Status | Notes                                                                |
| -------------------------- | ------ | -------------------------------------------------------------------- |
| Spec-first                 | ✅     | `specs/006-equipment-detail/spec.md` clarified                       |
| Phase 1 mock API           | ✅     | Route handlers in `src/app/api/crm/`                                 |
| Mock DB type-safe          | ✅     | Extend `equipment.schema.ts`; mock compiles against generated types  |
| Generated API hooks        | ✅     | `generate-openapi` → `generate-api` after routes                     |
| UI from project components | ✅     | `PageHeader`, `DataStateBoundary`, shadcn — not prototype copy-paste |
| Permission route gate      | ✅     | `/equipment/[id]` → `Permission.EquipmentView`                       |

**Post-design re-check**: ✅ No violations.

---

## UI Prototype Registry

| Screen       | UI slug            | Cache path                                             |
| ------------ | ------------------ | ------------------------------------------------------ |
| 接続機器詳細 | `equipment-detail` | `.cache/fitness-crm-ui/src/pages/equipment-detail.tsx` |

**Deviations from prototype (per clarified spec)**:

- No history summary footer
- Status select excludes current status
- 編集 button disabled with `編集機能は準備中です`
- Gate-stop info box only for `entry_gate` type
- `maintenance` badge uses `warning` (not `info`)

---

## Existing Infrastructure

| Asset                                                 | Status                                                   |
| ----------------------------------------------------- | -------------------------------------------------------- |
| `src/app/(private)/equipment/page.tsx`                | ✅ List + bulk status                                    |
| `GET /crm/equipment`                                  | ✅                                                       |
| `POST /crm/equipment/bulk-status`                     | ✅                                                       |
| `src/app/api/_schemas/equipment.schema.ts`            | ✅ List schemas — extend                                 |
| `db.equipment.getById`                                | ✅ Returns list item only — extend                       |
| `src/app/(private)/equipment/_constants/constants.ts` | ✅ Labels + badges                                       |
| `RoleGatedButton`                                     | ✅                                                       |
| `PageHeader`, `BackLink`, `DataStateBoundary`         | ✅                                                       |
| `/equipment/[id]` route                               | ❌ Create                                                |
| Detail/history/delete API                             | ❌ Create                                                |
| Status change on detail                               | ✅ Reuse `POST /crm/equipment/bulk-status` (`ids: [id]`) |

---

## Plan Decision — Status change API (2026-06-24)

Reuse existing **`POST /crm/equipment/bulk-status`** for single-item status change from the detail dialog (`ids: [equipmentId]`).

| Topic                                  | Decision                                                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| New `PATCH /crm/equipment/{id}/status` | **Not created**                                                                                     |
| History on status change               | **Not written** — 変更履歴 tab shows **seed data only** (read-only FR-012)                          |
| Response after status change           | Use existing bulk response; **refetch detail** via `invalidateQueries(getCrmEquipmentByIdQueryKey)` |
| `change_reason` in dialog              | UI field retained per spec; **not persisted** in Phase 1 (bulk route ignores it today)              |
| `last_status_confirmed_at`             | Derive from `updated_at` on detail response (updated by `bulkUpdateStatus`)                         |

**Spec note**: Acceptance scenario “new row appears in 変更履歴 after save” is **deferred** — history tab does not update live until history-write is implemented.

---

## Project Structure

### Documentation

```text
specs/006-equipment-detail/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/equipment-detail-api.md
└── tasks.md          # /speckit.tasks
```

### Source Code (new)

```text
src/
├── app/
│   ├── api/
│   │   ├── _schemas/equipment.schema.ts          # MODIFY — detail + history schemas
│   │   ├── _mock-db.ts                         # MODIFY — detail, history seed, delete
│   │   ├── _routes/index.ts                    # MODIFY — register 3 routes
│   │   └── crm/equipment/[id]/
│   │       ├── route.ts                        # GET detail, DELETE
│   │       └── history/route.ts                # GET history (seed only)
│   └── (private)/equipment/
│       ├── _components/equipment-table-columns.tsx  # MODIFY — name link
│       └── [id]/
│           ├── page.tsx
│           └── _components/
│               ├── equipment-detail-skeleton.tsx
│               ├── equipment-basic-info-tab.tsx
│               ├── equipment-info-card.tsx
│               ├── equipment-usage-rule-card.tsx
│               ├── equipment-status-card.tsx
│               ├── equipment-controller-card.tsx
│               ├── equipment-meta-card.tsx
│               ├── equipment-history-tab.tsx
│               ├── equipment-status-dialog.tsx
│               └── equipment-delete-dialog.tsx
└── lib/
    ├── permission.config.ts                    # MODIFY — /equipment/:id
    └── routes/routes.config.ts                 # MODIFY — /equipment/[id]
```

---

## 1. Data Model Changes

See [data-model.md](./data-model.md). Key additions to `equipment.schema.ts`:

```ts
UsageControlRuleDisplaySchema;
ControllerSummarySchema;
ConnectedEquipmentDetailSchema; // extends list fields
EquipmentStatusHistoryItemSchema;
GetEquipmentDetailResponseSchema;
GetEquipmentHistoryResponseSchema;
// No UpdateEquipmentStatus* — reuse BulkUpdateEquipmentStatusRequestSchema
```

Register new schemas in `register-schemas.ts`.

---

## 2. Mock DB Extensions

Extend `db.equipment`:

```ts
equipment: {
  _historyByEquipmentId: Record<string, EquipmentStatusHistoryItem[]>;  // seed only, read-only
  getDetailById(id: string): ConnectedEquipmentDetail | undefined;
  getHistory(id: string): EquipmentStatusHistoryItem[];
  delete(id: string): boolean;
  // existing: getAll, getById, bulkUpdateStatus (used for detail status change)
}
```

**Seed strategy**:

- `buildEquipmentDetail(listItem)` — adds `usage_control_rule`, `controller_summary`, `created_at`; `last_status_confirmed_at` = `updated_at`
- `CONTROLLER_SUMMARY_SEED` map by `controller_number`
- `SEED_EQUIPMENT_HISTORY` — static per-equipment arrays for 変更履歴 tab; **not mutated** on status change

**Status change**: Detail dialog calls `postCrmEquipmentBulkStatusMutation` with `{ ids: [id], status }` — same as list bulk flow. No `updateStatus` helper needed.

---

## 3. API Routes

See [contracts/equipment-detail-api.md](./contracts/equipment-detail-api.md).

| Method | Path                          | Handler                                               |
| ------ | ----------------------------- | ----------------------------------------------------- |
| GET    | `/crm/equipment/{id}`         | `db.equipment.getDetailById` → 404 if missing         |
| GET    | `/crm/equipment/{id}/history` | `db.equipment.getHistory` (seed data)                 |
| DELETE | `/crm/equipment/{id}`         | `db.equipment.delete` → 204                           |
| POST   | `/crm/equipment/bulk-status`  | **Existing** — detail status dialog sends `ids: [id]` |

Auth: use `getAuthUserFromRequest` pattern from locker routes.

---

## 4. OpenAPI Regeneration

```bash
npm run generate-openapi
npm run generate-api
```

Expected new exports in `@tanstack/react-query.gen`:

- `getCrmEquipmentByIdOptions`
- `getCrmEquipmentByIdHistoryOptions`
- `deleteCrmEquipmentByIdMutation`

Status change reuses existing:

- `postCrmEquipmentBulkStatusMutation`
- `getCrmEquipmentByIdQueryKey` — invalidate after bulk success

---

## 5. Routing & Permissions

**`routes.config.ts`**:

```ts
'/equipment/[id]': {
  router: '/equipment/[id]',
  filePath: '(private)/equipment/[id]',
  pattern: '/equipment/:id',
}
```

**`permission.config.ts`**:

```ts
'/equipment/:id': Permission.EquipmentView,
```

---

## 6. Frontend — Page Layout

**Reference**: `lockers/[id]/page.tsx`

```
PageHeader
  breadcrumb: BreadcrumbNav [{ /equipment, 接続機器 }, { 接続機器詳細 }]
  title: equipment.name
  subtitle: {store_name} — 接続機器ID: {id}
  badge: status badge
  actions: [削除 RoleGated] [編集 disabled + tooltip]

Tabs
  基本情報 → EquipmentBasicInfoTab (60/40 grid)
  変更履歴 → EquipmentHistoryTab
```

**States** (`DataStateBoundary`):

| State             | Copy                                                                             |
| ----------------- | -------------------------------------------------------------------------------- |
| Loading           | `EquipmentDetailSkeleton`                                                        |
| Error (incl. 404) | `errorTitle`: `接続機器の取得に失敗しました。` + `onRetry`; PageHeader back link |

Use `nuqs` for `?tab=basic|history` (optional; default `basic`).

---

## 7. Frontend — Components

### 7.1 `EquipmentBasicInfoTab`

Two-column layout (`lg:grid-cols-[3fr_2fr]`, sticky right):

| Left                     | Right                     |
| ------------------------ | ------------------------- |
| `EquipmentInfoCard`      | `EquipmentStatusCard`     |
| `EquipmentUsageRuleCard` | `EquipmentControllerCard` |
|                          | `EquipmentMetaCard`       |

### 7.2 `EquipmentInfoCard`

2-col grid: ID, name, type badge, serial, IP, MAC, location, install date, auth method, 接点制御先番号, QRコードID.

### 7.3 `EquipmentUsageRuleCard`

Read-only: 紐づき契約種別 badges, option/main/per-use labels, gate-stop info box (conditional).

### 7.4 `EquipmentStatusCard`

Status icon + badge, 最終確認日時 (`last_status_confirmed_at`), ステータス変更 button.

`RoleGatedButton` `allowedRoles={[System, Headquarter, Manager, Staff]}`.

### 7.5 `EquipmentStatusDialog`

- Read-only name + current status
- Select: filter `EQUIPMENT_STATUS_LABELS` keys excluding `equipment.status`
- Optional 変更理由 textarea (UI only — not persisted Phase 1)
- 変更を保存 disabled until `selectedStatus` set
- `useMutation(postCrmEquipmentBulkStatusMutation)` with `{ ids: [equipmentId], status }`
- **onSuccess**: `invalidateQueries({ queryKey: getCrmEquipmentByIdQueryKey({ path: { id } }) })` → header badge + status card refresh from refetch
- Error: `toast.error('ステータス変更に失敗しました')`, keep dialog open
- Do **not** invalidate history query (seed is static)

### 7.6 `EquipmentDeleteDialog`

`AlertDialog` — mirror prototype copy. `deleteCrmEquipmentByIdMutation` → `navigate('/equipment')` on success.

### 7.7 `EquipmentHistoryTab`

4-column table per spec. Status badges via shared `EQUIPMENT_STATUS_BADGE_MAP` (update maintenance → warning).

Creation row: `event_type === 'created'` → 新規作成 badge.

**No summary footer.**

### 7.8 Edit button placeholder

```tsx
<Button variant="outline" size="sm" disabled>
  <Tooltip>編集機能は準備中です</Tooltip>
  編集
</Button>
```

Visible for all page-access roles (including Observer).

---

## 8. List Page Integration

**`equipment-table-columns.tsx`**: Wrap name in `Link` via `navigate('/equipment/[id]', id)`.

---

## 9. Constants Update

**`EQUIPMENT_STATUS_BADGE_MAP.maintenance`**: Change from `info` to `warning` classes per research R4.

Add `EQUIPMENT_AUTHENTICATION_LABELS` if not present.

---

## 10. Implementation Phases

| Phase              | Tasks                                                   | Deliverable                         |
| ------------------ | ------------------------------------------------------- | ----------------------------------- |
| **A — API**        | Schema, mock-db, 3 routes, regen                        | Testable via OpenAPI / curl         |
| **B — Page shell** | Route, page, skeleton, states                           | Navigable detail with loading/error |
| **C — Basic tab**  | Info, usage, status, controller, meta cards             | FR-004 complete                     |
| **D — Mutations**  | Status dialog (bulk-status + invalidate), delete dialog | FR-SC-001, FR-006                   |
| **E — History**    | History tab + GET history (seed)                        | FR-012 read-only                    |
| **F — Polish**     | List link, badge fix, permission route                  | End-to-end flow                     |

---

## Complexity Tracking

No constitution violations requiring justification.

---

## Next Step

Run **`/speckit.tasks`** to generate `tasks.md` from this plan.
