# API Contracts: E-02 Connected Equipment Form (Create / Edit)

**Feature**: `007-equipment-form`  
**Date**: 2026-06-25  
**Base path**: `/crm/equipment`

All routes registered via `registerRoute(...)` and auth-guarded with `getAuthUserFromRequest` (pattern from `crm/equipment/[id]/route.ts`). Request bodies validated with Zod; invalid input → `400` with issue messages.

---

## 1. POST `/crm/equipment` — Create connected equipment (FR-003)

**Request body**: `UpsertEquipmentRequest`

```jsonc
{
  "name": "タンニングマシン A",
  "equipment_type": "tanning_machine",
  "serial_number": "SN-20250101-001",
  "install_location": "1F入口",
  "installed_on": "2025-02-16",
  "controller_id": "CTRL-002",
  "controller_number": 1,
  "status": "normal",
  "authentication_method": "member_qr_scan",
  "ip_address": "192.168.1.101",
  "mac_address": null,
  "usage_control_rule": {
    "main_enabled": false,
    "main_contract_type": null,
    "option_enabled": true,
    "option_type": "タンニング",
    "per_use_enabled": true,
    "per_use_option_type": "タンニング都次",
  },
  "remarks": null,
}
```

**Validation**: `name`, `equipment_type`, `serial_number`, `install_location`, `installed_on`, `controller_number`, `authentication_method`, `controller_id` required (the last two updated 2026-06-30 — form-level field validation on 保存); each `*_enabled: true` requires its type value. `ip_address`, `mac_address`, `remarks` optional.

> `controller_number` is the single field behind both `接続先ポート番号` (form) and `接点制御先番号` (list/detail). There is no separate `controller_port`.

**Responses**:

| Status | Body                                      | When                        |
| ------ | ----------------------------------------- | --------------------------- |
| 201    | `{ equipment: ConnectedEquipmentDetail }` | Created; `id` auto-assigned |
| 400    | `{ error, details: string[] }`            | Validation failure          |
| 401    | `{ error }`                               | Unauthenticated             |
| 500    | `{ error }`                               | Unexpected                  |

---

## 2. PATCH `/crm/equipment/{id}` — Update connected equipment (FR-005)

Added to the existing `crm/equipment/[id]/route.ts` (alongside GET + DELETE).

**Path param**: `id` (string)  
**Request body**: `UpsertEquipmentRequest` (same shape as create)

**Responses**:

| Status | Body                                      | When                   |
| ------ | ----------------------------------------- | ---------------------- |
| 200    | `{ equipment: ConnectedEquipmentDetail }` | Updated                |
| 400    | `{ error, details: string[] }`            | Validation failure     |
| 401    | `{ error }`                               | Unauthenticated        |
| 404    | `{ error }`                               | Equipment id not found |
| 500    | `{ error }`                               | Unexpected             |

---

## 3. GET `/crm/controllers` — Controller picker source (Q7) — IMPLEMENTED

Own resource (not nested under equipment). Read-only list of selectable contact-control devices, backed by `db.controllers` (array entity, seed `SEED_CONTROLLERS`). Tag: `Controllers`.

**Query (optional)**: `store_id` — filter to a store when mapping is available (best-effort, R1).

**Responses**:

| Status | Body                            | When            |
| ------ | ------------------------------- | --------------- |
| 200    | `{ controllers: Controller[] }` | Success         |
| 401    | `{ error }`                     | Unauthenticated |
| 500    | `{ error }`                     | Unexpected      |

```jsonc
{
  "controllers": [
    {
      "controller_id": "CTRL-002",
      "controller_number": 2,
      "name": "制御装置 新宿 2号",
      "ip_address": "192.168.1.11",
      "port": 81,
      "status": "normal",
    },
  ],
}
```

---

## 4. GET `/crm/equipment/{id}` — Edit prefill (existing, reused)

Returns `{ equipment: ConnectedEquipmentDetail }`; `404` if not found. Used by the edit page to seed the form via `equipmentDetailToFormValues`. No change required beyond ensuring the structured `usage_control_rule` round-trips (data-model R2).

---

## Generated client (after `generate-openapi` + `generate-api`)

| Operation                 | Expected export (`@tanstack/react-query.gen`)            |
| ------------------------- | -------------------------------------------------------- |
| Create                    | `postCrmEquipmentMutation`                               |
| Update                    | `patchCrmEquipmentByIdMutation`                          |
| Controllers list          | `getCrmControllersOptions` ✅ generated                  |
| Edit prefill (reuse)      | `getCrmEquipmentByIdOptions`                             |
| Invalidation keys (reuse) | `getCrmEquipmentQueryKey`, `getCrmEquipmentByIdQueryKey` |

---

## Contract tests (Definition of Done)

| Route                       | Happy path                                   | Error path                                   |
| --------------------------- | -------------------------------------------- | -------------------------------------------- |
| POST `/crm/equipment`       | Valid body → 201 + detail with new `EQ-####` | Missing `controller_number` → 400            |
| PATCH `/crm/equipment/{id}` | Valid body on existing id → 200 + updated    | Unknown id → 404 (and/or invalid body → 400) |
| GET `/crm/controllers`      | Returns seeded controllers (200)             | Unauthenticated → 401                        |
