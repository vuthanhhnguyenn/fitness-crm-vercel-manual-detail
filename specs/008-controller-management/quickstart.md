# Quickstart: Contact-Control Device (接点制御装置) Management

**Feature**: `008-controller-management` | **Date**: 2026-06-26 | **Plan**: [plan.md](./plan.md)

A practical build/verify guide for the `/controllers` module. Phase 1 is fully mock-backed — no running backend needed.

---

## Prerequisites

- Node ≥ 24, repo deps installed (`npm install`).
- Working on branch `feat/equipment` (no new branch per direction). Spec dir: `specs/008-controller-management/`.
- Equipment module (006/007) present — the mirror template.

---

## Build order (matches plan Phases A–G)

### A. Data + API (mock)

1. Extend `src/app/api/_schemas/controller.schema.ts` per [data-model.md](./data-model.md) (Controller fields + list/detail/devices/history/upsert/patch schemas).
2. Register new schemas in `src/app/api/_scripts/register-schemas.ts`.
3. In `src/app/api/_mock-db.ts`: backfill `SEED_CONTROLLERS` (≥ 3 stores), add `buildControllerHistorySeed` + `SEED_CONTROLLER_HISTORY`, extend `db.controllers` (`list`, `getDetailById`, `getConnectedDevices`, `getHistory`, `create`, `update`, `delete`-guard).
4. Route handlers: extend `crm/controllers/route.ts` (GET filter/sort/page + POST); add `crm/controllers/[id]/route.ts` (GET/PATCH/DELETE), `[id]/devices/route.ts`, `[id]/history/route.ts`. Register routes in `_routes/index.ts`.
5. Regenerate the client:

```bash
npm run generate-openapi
npm run generate-api
npm run type-check   # mock-db MUST compile against types.gen.ts
```

**Verify A** (mock server / curl):

```bash
curl 'http://localhost:3000/api/crm/controllers?status=error&limit=50'
curl 'http://localhost:3000/api/crm/controllers/CTRL-001'
curl 'http://localhost:3000/api/crm/controllers/CTRL-001/devices'
curl 'http://localhost:3000/api/crm/controllers/CTRL-001/history'
curl -X DELETE 'http://localhost:3000/api/crm/controllers/CTRL-001'   # expect 409 (has devices)
```

### B. List page

1. `controllers/_hooks/use-controller-filters.ts` (nuqs: search/status/store, debounced, `queryParams`, `activeFilterCount`).
2. `controllers/_components/controller-filters.tsx` + `controller-table-columns.tsx` (9 columns).
3. `controllers/page.tsx` — `DataTable` + filters + `TablePaginationWithSize`; `PageHeader` with `RoleGatedButton(ControllerEdit)` → `/controllers/create`.
4. Permissions: add `ControllerView/Edit/Delete` to `src/types/permission.type.ts`; map `/controllers*` in `src/lib/permission.config.ts`; grant per Q1 (View incl. Observer). Confirm routes generated into `routes.config.ts`.

### C. Detail + delete + status

1. `[id]/page.tsx` + `controller-detail-skeleton.tsx`, `DataStateBoundary`, `Tabs` (`?tab=`).
2. `controller-basic-info-tab.tsx` (info card + `StatusCard` + 紐付き機器サマリー + その他情報).
3. `controller-delete-dialog.tsx` (disabled when `device_count > 0`) and `controller-status-dialog.tsx` (PATCH `status` only — no history).

### D. Devices + history tabs

1. `controller-devices-tab.tsx` (`DataTable` + summary footer).
2. `controller-history-tab.tsx` (read-only table + footer).

### E. Create/Edit form

1. `_schemas/controller-form.schema.ts` (Q2 validation) + `_utils/controller-form.util.ts` (defaults / detail→form / form→body / dirty→patch).
2. `controller-form.tsx` (基本情報 + ステータス cards, store `SearchableSelect`, info `Alert`, helper texts).
3. `create/page.tsx` (POST) and `[id]/edit/page.tsx` (prefill + dirty PATCH + discard `AlertDialog`).

### F. Integration

- Repoint the equipment list stub `接点制御装置一覧` tab / `接点制御装置を登録` dropdown item to `/controllers` (or remove the embedded tab).
- Enable the equipment-detail `equipment-controller-card` "装置詳細を見る" link → `/controllers/[id]`.
- Update the equipment `ControllerPicker` to read the new `items` list shape (pass `limit: 50`).

### G. Polish + tests

- Contract tests for all 7 routes (incl. **409** delete-guard).
- `npm run type-check`, `npm run lint`, a11y (keyboard/ARIA on dialogs & table), perf check.

---

## Manual verification (maps to spec acceptance scenarios)

| Spec scenario                    | Check                                                                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| US2 — list/search/filter         | `/controllers` shows 9 columns + count; search by name/IP narrows; status filter works; 異常 row highlighted; row click → detail       |
| US1 — create                     | `/controllers/create`: ID 「（自動採番）」; fill all required; 登録 → toast 接点制御装置を登録しました → back to list                  |
| US3 — detail + connected devices | Detail 3 tabs render; 基本情報 shows all fields incl. ポート番号; 紐付き機器一覧 lists devices + summary; 変更履歴 seeded, read-only   |
| US4 — edit                       | Edit prefilled; change + 更新 → toast 接点制御装置の変更を保存しました; update disabled unless dirty                                   |
| US5 — delete guard               | Controller with devices → 削除 disabled; controller w/o devices → dialog → 削除する → back to list; API returns 409 when devices exist |
| Q1 — access                      | Observer can view list/detail but sees no 登録/編集/削除/ステータス変更; Trainer blocked                                               |
| Q2 — validation                  | Empty required field blocks submit (incl. ポート番号); bad IP blocked; FW may be empty                                                 |
| Q3 — status change               | ステータス変更 saves new 状態; 変更履歴 gains **no** new row                                                                           |

---

## Definition of Done (constitution)

- [ ] Every FR-007 sub-capability reachable & exercisable on mock (Principle I/II).
- [ ] `tsc --noEmit` exits 0; mock-db compiles against `types.gen.ts` (III).
- [ ] No raw `fetch`; React Query option-factories + invalidation; list ≤ 50/page (V).
- [ ] shadcn/common components + design tokens only; lucide icons; min 768 px; a11y (IV).
- [ ] Contract tests pass for all 7 routes incl. 409 guard.
- [ ] Lighthouse budgets met on `/controllers` routes (VI).
- [ ] PR lists Principle I–VI pass/N-A/justified-exception.
