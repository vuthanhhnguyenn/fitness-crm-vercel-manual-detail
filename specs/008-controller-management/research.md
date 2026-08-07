# Phase 0 Research: Contact-Control Device (接点制御装置) Management

**Feature**: `008-controller-management` | **Date**: 2026-06-26 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

The spec has no open `NEEDS CLARIFICATION` (resolved Session 2026-06-26). The research below resolves the **technical unknowns** surfaced when mapping FR-007 onto the existing (equipment-derived) controller infrastructure. Format per decision: **Decision / Rationale / Alternatives considered**.

---

## R1 — Extend the existing `Controller` schema vs. create a new entity

**Context**: `ControllerSchema` today is a 6-field lookup (`controller_id`, `controller_number`, `name`, `ip_address`, `port`, `status`) used only by the equipment form's `ControllerPicker`. FR-007 requires 装置名, 店舗コード, 設置場所, IPアドレス, ファームウェアバージョン, 制御ポート数, ポート番号, 状態, plus derived 紐付き機器数 and 作成/更新日時.

**Decision**: **Extend** the existing `Controller` entity in place. Add `store_code: string`, `location: string`, `firmware_version: string | null`, `control_port_count: number (int 1–64)`, `created_at: string`, `updated_at: string`. Keep `port` (already present) as ポート番号. Add `device_count` only to the **detail/list response** shapes (derived, not stored).

**Rationale**:

- The equipment `ControllerPicker` and `buildEquipmentDetail` matching read only `controller_id`/`name`/`ip_address`/`port`/`status`; adding fields is non-breaking as long as all 8 seed rows are backfilled.
- A single source of truth avoids divergence between the picker's controller list and the management screens.

**Alternatives considered**:

- _New parallel `ControllerRecord` entity_: rejected — duplicates the seed and risks the picker and the management list disagreeing.
- _Store `device_count` on the row_: rejected — it is derived from equipment and would drift; compute on read.

---

## R2 — Connected-devices list keyed by controller (no existing precedent)

**Context**: FR-007 requires the detail to "reference the devices connected to a controller" (紐付き機器一覧 + summary counts). The only link today is the **forward** match in `buildEquipmentDetail` (equipment → its controller). There is no inverse query.

**Decision**: Add `db.controllers.getConnectedDevices(controllerId)` that iterates `db.equipment._rows`, matching by the equipment's `controller_id` (from equipment meta) first, then falling back to `controller_number` equality with the controller. Project each match to a connected-device row: `equipment_id`, `name`, `controller_number` (→ 接点番号), `gate_type` (→ ゲート種別, see R5), `status`. Expose at `GET /crm/controllers/{id}/devices`. Derive `device_summary` (total / normal / error) and `device_count` for the detail/list from the same matcher.

**Rationale**: Mirrors how `buildEquipmentDetail` already correlates the two entities, just inverted; keeps the controller detail query independent of equipment internals via a single helper.

**Alternatives considered**:

- _Embed the device array inside the detail response_: rejected for the full list — a separate endpoint keeps the detail payload light and matches the equipment-history split; `device_count`/`device_summary` are still embedded in the detail for the header/summary card.
- _Reverse-index map at seed time_: rejected for Phase 1 — linear scan over the small mock set is sufficient and simpler.

---

## R3 — Delete-with-guard (異常系: cannot delete while devices are connected)

**Context**: Equipment delete is unconditional. FR-007 異常系 requires blocking controller deletion while connected devices exist. No guard pattern exists in the repo.

**Decision**: `db.controllers.delete(id)` returns a discriminated result — `{ ok: true }` on success or `{ ok: false, reason: 'has_connected_devices', device_count }` when `getConnectedDevices(id).length > 0`. The `DELETE /crm/controllers/{id}` handler maps the guard failure to **HTTP 409 Conflict** with a Japanese message ("接続機器が存在するため削除できません"). The detail page **disables** the 削除 button when `device_count > 0` (primary UX guard); the 409 is the server-side backstop.

**Rationale**: Two-layer guard (disabled UI + server 409) follows defensive-design norms; 409 Conflict is the correct semantic for a state-based rejection.

**Alternatives considered**:

- _UI-only guard_: rejected — server must enforce the invariant (a direct API call could bypass the disabled button).
- _Cascade delete of devices_: rejected — contradicts FR-007 and the E-02 §制限事項 (store-scoped device lifecycle).

---

## R4 — Status-change persistence given seed-only history (Q3)

**Context**: Spec Q3 → A: the ステータス変更 dialog updates the controller's current 状態 **only**; it must **not** write a change-history entry. History is seed/read-only.

**Decision**: Implement status change through the standard `PATCH /crm/controllers/{id}` with a `status` field handled by `db.controllers.updateStatus(id, status)` (or `update` when other fields are also present). The dialog collects 変更種別 and メモ for UX parity with the prototype, but these are **not persisted** and **no** history row is appended. This matches the equipment precedent where `create`/`update`/`bulkUpdateStatus` do not append history.

**Rationale**: Honors Q3 exactly; reuses the single PATCH route rather than introducing a status-only endpoint.

**Alternatives considered**:

- _Dedicated `POST /crm/controllers/{id}/status` with history append_: rejected — would re-introduce history writes (Q3 option C), contradicting the resolution.
- _Drop the dialog entirely (Q3 option B)_: rejected — Q3 resolved to A (keep the dialog, status-only).

---

## R5 — `ゲート種別` (gate type) on the connected-devices list

**Context**: The prototype's connected-device sub-table shows a ゲート種別 column (入口扉 / 出口扉 / その他) that FR-007 does not define and `db.equipment` does not store (spec discrepancy N5).

**Decision**: Treat ゲート種別 as a **best-effort display attribute**. For Phase 1, derive it heuristically from the equipment type (e.g., 入退館ゲート → 入口扉/出口扉 where determinable, otherwise その他) or render a neutral その他/— placeholder. Do not add a persisted field. The connected-devices list's authoritative columns are 機器ID, 機器名, 接点番号, ステータス; ゲート種別 is decorative.

**Rationale**: Reproduces the prototype column without inventing a requirement or a stored field; keeps the data model grounded in FR-007.

**Alternatives considered**:

- _Add a stored `gate_type` to equipment_: rejected — out of FR-007 scope and would touch the equipment data model.
- _Omit the column_: acceptable fallback; kept as a decorative column to match the prototype unless DEV decides otherwise in tasks.

---

## R6 — Store field source (no `StoreCombobox` in repo)

**Context**: FR-007 needs 店舗コード on the form and as a list filter. The spec referenced a store combobox, but the repo has no dedicated `StoreCombobox`; equipment uses the generic `SearchableSelect` + `getCrmStoresOptions` / `getCrmStoresByIdOptions`.

**Decision**: Use `SearchableSelect` bound to `getCrmStoresOptions` for both the form's 店舗コード field and the list's store filter (the latter shown only when the user has ≥ 2 accessible stores), exactly as `equipment-filters.tsx`. Store the store **code** on the controller.

**Rationale**: Reuses an established, type-safe pattern; avoids introducing a new component (constitution IV).

**Alternatives considered**:

- _Free-text store code input_: rejected — error-prone and inconsistent with equipment.

---

## R7 — List query, sorting, and pagination

**Context**: `GET /crm/controllers` currently returns the full array with no filter/sort/paging (and ignores its declared `store_id`). FR-007 requires search + status filter; the list has sortable headers and a pagination footer.

**Decision**: Extend `GetControllersQuerySchema` to `{ search?, status?, store_id?, sort_by?, sort_order?, page?, limit? }` and return a paginated `{ items, total, page, limit, total_pages }`, mirroring `GetEquipmentResponseSchema`. `search` matches device name / IP address (per the prototype placeholder). Define a `CONTROLLER_SORTERS` map for the sortable columns. Default `limit` ≤ 50 (constitution V).

**Rationale**: Server-side filter/sort/paginate matches the equipment list and constitution V; keeps the client thin.

**Alternatives considered**:

- _Client-side filter on the full array (prototype)_: rejected — violates the ≤ 50 server page-size rule and won't scale.

---

## R8 — Unsaved-changes guard

**Context**: The prototype controller form has no discard guard, and the repo has no `useUnsavedChanges` hook. Equipment forms implement the guard inline.

**Decision**: Implement the discard confirmation **inline** in the create/edit pages using RHF `isDirty` + a local `AlertDialog` (変更を破棄しますか？), matching the equipment forms. No new hook.

**Rationale**: Consistency with the existing equipment forms; avoids speculative shared abstractions. (Adding the guard slightly exceeds the bare prototype but improves UX and matches the sibling module; documented as a minor, beneficial deviation.)

**Alternatives considered**:

- _No guard (match prototype exactly)_: rejected — diverges from the equipment UX and risks silent data loss; spec assumption already allows Plan to add it.
- _New `useUnsavedChanges` hook_: deferred — not worth a shared abstraction for two forms.

---

## R9 — Permissions model

**Context**: Spec access control (Q1): view = Sys/HQ/Mgr/Staff/Observer; configure (create/edit/delete/status) = Sys/HQ/Mgr/Staff; Trainer none. Equipment uses `EquipmentView/Edit/Delete`.

**Decision**: Add `ControllerView`, `ControllerEdit`, `ControllerDelete` to the `Permission` enum. Map routes (`/controllers`, `/controllers/:id` → View; `/controllers/create`, `/controllers/:id/edit` → Edit). Grant View to Sys/HQ/Mgr/Staff/Observer; Edit & Delete to Sys/HQ/Mgr/Staff. Status-change action uses `ControllerEdit`.

**Rationale**: Mirrors the equipment permission triplet and honors Q1 precisely.

**Alternatives considered**:

- _Reuse `EquipmentView/Edit/Delete`_: rejected — controllers are a distinct resource and Observer's view rights differ in intent; separate permissions keep the role matrix explicit.

---

## Summary of decisions

| #   | Topic                  | Decision                                                                                       |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| R1  | Controller schema      | Extend in place (+store/location/fw/control-port-count/timestamps); `device_count` derived     |
| R2  | Connected devices      | `getConnectedDevices(id)` inverse match over equipment; separate `/devices` endpoint + summary |
| R3  | Delete guard           | Discriminated delete result → 409 when `device_count > 0`; disabled UI button as primary guard |
| R4  | Status change (Q3)     | PATCH `status` only; capture-but-don't-persist 変更種別/メモ; no history append                |
| R5  | ゲート種別             | Decorative/best-effort derived column; no stored field                                         |
| R6  | Store field            | `SearchableSelect` + `getCrmStoresOptions`; store the store code                               |
| R7  | List query/sort/paging | Extend query + paginated response (≤ 50/page) + sorter map, mirroring equipment                |
| R8  | Unsaved-changes guard  | Inline `isDirty` + `AlertDialog` (no new hook)                                                 |
| R9  | Permissions            | New `ControllerView/Edit/Delete`; grants per Q1                                                |

All unknowns resolved → proceed to Phase 1 design.
