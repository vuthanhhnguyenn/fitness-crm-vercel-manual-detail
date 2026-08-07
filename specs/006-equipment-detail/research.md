# Research: E-02 Connected Equipment Detail

**Feature**: `006-equipment-detail`  
**Date**: 2026-06-24

---

## R1 — Implementation reference pattern

| Decision     | Follow **locker detail** (`/lockers/[id]`) as the primary reference                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rationale    | Same patterns: tabs (info + history), `PageHeader`, `RoleGatedButton`, `DataStateBoundary`, mock-db + route handlers, generated React Query hooks |
| Alternatives | Transfer detail (approval flows — not applicable); prototype page (behavior only, not code structure)                                             |

---

## R2 — API surface (Phase 1 mock)

| Decision     | Three **new** endpoints + reuse existing bulk-status: `GET /crm/equipment/{id}`, `GET /crm/equipment/{id}/history`, `DELETE /crm/equipment/{id}`; status change via **`POST /crm/equipment/bulk-status`** (`ids: [id]`) |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rationale    | Bulk-status already exists; single PATCH adds little value when client refetches detail via `invalidateQueries`                                                                                                         |
| Alternatives | `PATCH /crm/equipment/{id}/status` returning detail — rejected (2026-06-24 plan decision)                                                                                                                               |

---

## R2b — Status change side effects

| Decision     | **No history write** on status change; **no detail in mutation response** — invalidate `getCrmEquipmentById` query after bulk success |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Rationale    | Phase 1 simplification; 変更履歴 tab uses static seed data only                                                                       |
| Alternatives | Append history + return detail from PATCH — rejected                                                                                  |

---

## R3 — Permission model for write actions

| Decision     | Use `RoleGatedButton` with `allowedRoles` per E-02 matrix (HQ, System, Manager, Staff for delete/status; Observer denied). Route gated by `Permission.EquipmentView` only. |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rationale    | `Permission` enum has only `EquipmentView`; granular `equipment.edit` / `equipment.delete` do not exist yet                                                                |
| Alternatives | Add new Permission enums — deferred; can align in a cross-module permissions pass                                                                                          |

---

## R4 — Deferred spec defaults (from clarify session)

| Topic                | Decision                                                                               |
| -------------------- | -------------------------------------------------------------------------------------- |
| Controller label     | **接点制御先番号** — display `controller_number`                                       |
| 備考                 | Omit on detail screen Phase 1                                                          |
| QRコードID           | Show field; em dash (`—`) when null                                                    |
| 最終確認日時         | `last_status_confirmed_at` = timestamp of last manual status change                    |
| メンテナンス中 badge | Use **warning** semantic (`border-warning/20 bg-warning/15 text-warning`) consistently |
| Delete constraints   | None — delete at any status                                                            |
| Dialog API errors    | `toast.error` + keep dialog open                                                       |

---

## R5 — Status change select behavior

| Decision     | Filter select options to exclude current status; disable 変更を保存 until selection |
| ------------ | ----------------------------------------------------------------------------------- |
| Rationale    | Clarified Q4 — prevents duplicate history rows without validation messaging         |
| Alternatives | Block save with inline error — rejected by PO                                       |

---

## R6 — History tab footer

| Decision     | **Omit** 直近1年の対応 / 平均対応間隔 footer  |
| ------------ | --------------------------------------------- |
| Rationale    | Clarified Q5 — FR-012 satisfied by table only |
| Alternatives | Include prototype metrics — rejected          |

---

## R7 — List → detail navigation

| Decision     | Make equipment **name** column a link to `/equipment/[id]`; add route entry    |
| ------------ | ------------------------------------------------------------------------------ |
| Rationale    | FR-004 entry point from FR-001 list; list page currently has no row navigation |
| Alternatives | Row click on entire row — name link is consistent with other CRM tables        |

---

## R8 — Controller summary card (Phase 1)

| Decision     | Embed `controller_summary` on detail response derived from mock lookup by `controller_number` |
| ------------ | --------------------------------------------------------------------------------------------- |
| Rationale    | FR-007 full page out of scope; prototype shows summary + link placeholder                     |
| Alternatives | Separate controller API call — unnecessary for Phase 1 mock                                   |

---

## R9 — Gate-stop info box visibility

| Decision     | Show static gate-stop explainer only when `equipment_type === 'entry_gate'`                          |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Rationale    | Prototype shows box on hydrogen water example (design oversight); E-02 ties gate-stop to entry gates |
| Alternatives | Always show — rejected as misleading for non-gate equipment                                          |
