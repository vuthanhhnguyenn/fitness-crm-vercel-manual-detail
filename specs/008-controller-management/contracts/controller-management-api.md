# API Contracts: Contact-Control Device (接点制御装置) Management

**Feature**: `008-controller-management` | **Date**: 2026-06-26 | **Data model**: [../data-model.md](../data-model.md)

Phase 1 = Next.js mock Route Handlers under `src/app/api/crm/controllers/`. All handlers: `getAuthUserFromRequest` → Zod `safeParse` → `db.controllers.*` → `NextResponse.json`, and each method is mirrored via `registerRoute({...})` for OpenAPI. Validation errors → **400** with issue messages. Status reuses `EquipmentStatus` (`normal|error|maintenance|discarded`).

---

## GET /crm/controllers — List (search / filter / sort / paginate)

**Query** (`GetControllersQuerySchema`): `search?`, `status?`, `store_id?`, `sort_by?`, `sort_order?`, `page?`, `limit?` (≤ 50).

- `search` matches 装置名 (`name`) / IPアドレス (`ip_address`).
- Sorting via `CONTROLLER_SORTERS` map; default `sort_by=controller_id`, `sort_order=asc`.

**200** (`GetControllersResponseSchema`):

```json
{
  "items": [
    {
      "controller_id": "CTRL-001",
      "controller_number": 1,
      "name": "制御装置 新宿 1号",
      "store_code": "S-001",
      "location": "1F エントランス",
      "ip_address": "192.168.1.10",
      "port": 80,
      "firmware_version": "v2.4.1",
      "control_port_count": 16,
      "status": "normal",
      "device_count": 8,
      "created_at": "2024/06/15",
      "updated_at": "2026/03/01"
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 50,
  "total_pages": 1
}
```

**Errors**: 400 invalid query · 401 unauthenticated.

---

## POST /crm/controllers — Create

**Body** (`UpsertControllerRequestSchema`): `name`, `store_code`, `location`, `ip_address` (local-IP regex), `port`, `firmware_version?`, `control_port_count` (1–64), `status`.

**201** (`CreateControllerResponseSchema` = `ControllerDetail`): created controller with system-assigned `controller_id` (`CTRL-####`), `device_count: 0`, `device_summary: {0,0,0}`, timestamps set.

**Errors**: 400 validation (missing required / bad IP / port out of range) · 401 · 403 (lacks `ControllerEdit`).

---

## GET /crm/controllers/{id} — Detail

**200** (`GetControllerDetailResponseSchema` = `ControllerDetail`):

```json
{
  "controller_id": "CTRL-001",
  "controller_number": 1,
  "name": "制御装置 新宿 1号",
  "store_code": "S-001",
  "location": "1F エントランス",
  "ip_address": "192.168.1.10",
  "port": 80,
  "firmware_version": "v2.4.1",
  "control_port_count": 16,
  "status": "normal",
  "created_at": "2024/06/15",
  "updated_at": "2026/03/01",
  "device_count": 8,
  "device_summary": { "total": 8, "normal": 7, "error": 1 }
}
```

**Errors**: 404 not found · 401.

---

## PATCH /crm/controllers/{id} — Update / Status change

**Body** (`PatchControllerRequestSchema` = partial Upsert). Used for both full edit and the status-change dialog (`{ "status": "maintenance" }`).

- Updates provided fields + `updated_at`. **No** history entry is written (Q3); 変更種別/メモ from the dialog are **not** persisted.

**200** (`UpdateControllerResponseSchema` = `ControllerDetail`): updated controller.

**Errors**: 400 validation · 404 not found · 401 · 403 (lacks `ControllerEdit`).

---

## DELETE /crm/controllers/{id} — Delete (guarded, FR-007 異常系)

- **Guard**: if the controller has connected devices (`device_count > 0`) → **409 Conflict**.

**204** No Content — deleted (row + seed history removed) when no devices are connected.

**409** (guard):

```json
{
  "error": "接続機器が存在するため削除できません",
  "reason": "has_connected_devices",
  "device_count": 8
}
```

**Errors**: 404 not found · 401 · 403 (lacks `ControllerDelete`) · 409 has connected devices.

> The detail UI disables the 削除 button when `device_count > 0`; the 409 is the server-side backstop (research R3).

---

## GET /crm/controllers/{id}/devices — Connected devices

**200** (`GetControllerDevicesResponseSchema`):

```json
{
  "devices": [
    {
      "equipment_id": "EQ-0001",
      "name": "水素水サーバー",
      "controller_number": 1,
      "gate_type": "入口扉",
      "status": "normal"
    }
  ],
  "summary": { "total": 8, "normal": 7, "error": 1 }
}
```

- Derived by matching `db.equipment` rows to the controller (meta `controller_id` then `controller_number`). `gate_type` is decorative/best-effort (research R5).

**Errors**: 404 controller not found · 401.

---

## GET /crm/controllers/{id}/history — Change history (read-only)

**200** (`GetControllerHistoryResponseSchema`):

```json
{
  "items": [
    {
      "occurred_at": "2026/02/20 10:00",
      "operator": "山田太郎",
      "change_type": "inspection",
      "from_status": "maintenance",
      "to_status": "normal",
      "memo": "ファームウェア更新。全ポート疎通確認OK。"
    },
    {
      "occurred_at": "2024/06/15 10:00",
      "operator": "テストユーザー",
      "change_type": "created",
      "from_status": null,
      "to_status": null,
      "memo": null
    }
  ]
}
```

- **Seed/read-only** (Q3, FR-007-G). No create/update/delete endpoints for history.

**Errors**: 404 controller not found · 401.

---

## Generated React Query exports (after `npm run generate-api`)

| Hook/Option                           | Endpoint                     |
| ------------------------------------- | ---------------------------- |
| `getCrmControllersOptions`            | GET list (now paginated)     |
| `postCrmControllersMutation`          | POST create                  |
| `getCrmControllersByIdOptions`        | GET detail                   |
| `patchCrmControllersByIdMutation`     | PATCH update / status change |
| `deleteCrmControllersByIdMutation`    | DELETE (guarded)             |
| `getCrmControllersByIdDevicesOptions` | GET connected devices        |
| `getCrmControllersByIdHistoryOptions` | GET history                  |

Query-key invalidation on mutate: list key after create/delete; detail + list keys after update/status; devices key unaffected by controller mutations.

---

## Contract Tests (Definition of Done — happy + ≥1 error per route)

| Route                               | Happy                           | Error path(s)                       |
| ----------------------------------- | ------------------------------- | ----------------------------------- |
| GET `/crm/controllers`              | filtered/sorted/paged list      | 400 invalid `status`/`limit>50`     |
| POST `/crm/controllers`             | 201 + auto `CTRL-####`          | 400 missing required / bad IP       |
| GET `/crm/controllers/{id}`         | 200 detail w/ summary           | 404 unknown id                      |
| PATCH `/crm/controllers/{id}`       | 200 updated; status-only update | 404 unknown id / 400 invalid        |
| DELETE `/crm/controllers/{id}`      | 204 when no devices             | **409 when device_count > 0** / 404 |
| GET `/crm/controllers/{id}/devices` | 200 devices + summary           | 404 unknown controller              |
| GET `/crm/controllers/{id}/history` | 200 seeded history              | 404 unknown controller              |
