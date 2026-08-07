# Phase 1 Data Model: Contact-Control Device (接点制御装置) Management

**Feature**: `008-controller-management` | **Date**: 2026-06-26 | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

All shapes are defined in `src/app/api/_schemas/controller.schema.ts` (Zod = runtime source of truth, constitution III) and registered with the OpenAPI registry. Status reuses `EquipmentStatusSchema` (`'normal' | 'error' | 'maintenance' | 'discarded'` → 正常 / 異常 / メンテナンス中 / 廃棄).

---

## 1. Entities

### Controller (接点制御装置) — extended

| Field                | Type                      | Required   | Notes                                                              |
| -------------------- | ------------------------- | ---------- | ------------------------------------------------------------------ |
| `controller_id`      | string                    | ✅ (sys)   | Read-only, system-assigned (`CTRL-####`)                           |
| `controller_number`  | int ≥ 0                   | ✅ (sys)   | Existing; used by equipment link / 接点制御先番号                  |
| `name`               | string \| null            | —          | 装置名 (form-required; nullable in lookup for legacy)              |
| `store_code`         | string                    | ✅ **NEW** | 店舗コード                                                         |
| `location`           | string                    | ✅ **NEW** | 設置場所                                                           |
| `ip_address`         | string                    | ✅         | IPアドレス (local-IP format)                                       |
| `port`               | int > 0                   | ✅         | ポート番号 (existing field; surfaced as required Phase 1 field Q2) |
| `firmware_version`   | string \| null            | — **NEW**  | ファームウェアバージョン (optional)                                |
| `control_port_count` | int (1–64)                | ✅ **NEW** | 制御ポート数                                                       |
| `status`             | EquipmentStatus           | ✅         | 状態 (default `normal`)                                            |
| `created_at`         | string (ISO/`YYYY/MM/DD`) | ✅ **NEW** | 作成日時 (read-only)                                               |
| `updated_at`         | string                    | ✅ **NEW** | 更新日時 (read-only)                                               |

> `device_count` (紐付き機器数) is **derived**, not stored — see ControllerListItem / ControllerDetail.

### ControllerListItem

Controller fields above **+** `device_count: int ≥ 0` (derived). Used in the paginated list response.

### ControllerDetail

Controller fields **+** `device_count: int ≥ 0` **+** `device_summary: { total: int; normal: int; error: int }`.

### ControllerConnectedDevice (read-only projection of equipment)

| Field               | Type            | Source                                             |
| ------------------- | --------------- | -------------------------------------------------- |
| `equipment_id`      | string          | equipment row `id`                                 |
| `name`              | string          | equipment `name`                                   |
| `controller_number` | int             | equipment `controller_number` (→ 接点番号)         |
| `gate_type`         | string \| null  | 決定不能時は null/その他 (decorative, research R5) |
| `status`            | EquipmentStatus | equipment `status`                                 |

### ControllerHistoryItem (read-only, seed only)

| Field         | Type                                                             | Notes                           |
| ------------- | ---------------------------------------------------------------- | ------------------------------- |
| `occurred_at` | string                                                           | 日時                            |
| `operator`    | string                                                           | 操作者                          |
| `change_type` | `'status_change' \| 'fault_report' \| 'inspection' \| 'created'` | 種別 (種別 labels in constants) |
| `from_status` | EquipmentStatus \| null                                          | null for `created`              |
| `to_status`   | EquipmentStatus \| null                                          | `created` shows 新規作成        |
| `memo`        | string \| null                                                   | メモ                            |

---

## 2. Zod Schemas (`controller.schema.ts`)

```ts
// EXTEND existing ControllerSchema (backward-compatible additions)
export const ControllerSchema = z.object({
  controller_id: z.string(),
  controller_number: z.number().int().nonnegative(),
  name: z.string().nullable(),
  store_code: z.string(), // NEW
  location: z.string(), // NEW
  ip_address: z.string(),
  port: z.number().int().positive(),
  firmware_version: z.string().nullable(), // NEW
  control_port_count: z.number().int().min(1).max(64), // NEW
  status: EquipmentStatusSchema,
  created_at: z.string(), // NEW
  updated_at: z.string(), // NEW
});

export const ControllerListItemSchema = ControllerSchema.extend({
  device_count: z.number().int().nonnegative(),
});

export const ControllerDeviceSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  normal: z.number().int().nonnegative(),
  error: z.number().int().nonnegative(),
});

export const ControllerDetailSchema = ControllerSchema.extend({
  device_count: z.number().int().nonnegative(),
  device_summary: ControllerDeviceSummarySchema,
});

export const ControllerConnectedDeviceSchema = z.object({
  equipment_id: z.string(),
  name: z.string(),
  controller_number: z.number().int(),
  gate_type: z.string().nullable(),
  status: EquipmentStatusSchema,
});

export const ControllerHistoryItemSchema = z.object({
  occurred_at: z.string(),
  operator: z.string(),
  change_type: z.enum(['status_change', 'fault_report', 'inspection', 'created']),
  from_status: EquipmentStatusSchema.nullable(),
  to_status: EquipmentStatusSchema.nullable(),
  memo: z.string().nullable(),
});

// LIST query + response (replaces the store_id-only query)
export const GetControllersQuerySchema = z.object({
  search: z.string().optional(),
  status: EquipmentStatusSchema.optional(),
  store_id: z.string().optional(),
  sort_by: z
    .enum([
      'controller_id',
      'name',
      'store_code',
      'location',
      'ip_address',
      'firmware_version',
      'control_port_count',
      'device_count',
      'status',
    ])
    .optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export const GetControllersResponseSchema = z.object({
  items: z.array(ControllerListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total_pages: z.number().int().nonnegative(),
});

export const GetControllerDevicesResponseSchema = z.object({
  devices: z.array(ControllerConnectedDeviceSchema),
  summary: ControllerDeviceSummarySchema,
});

export const GetControllerHistoryResponseSchema = z.object({
  items: z.array(ControllerHistoryItemSchema),
});

// CREATE / UPDATE
export const UpsertControllerRequestSchema = z.object({
  name: z.string().min(1),
  store_code: z.string().min(1),
  location: z.string().min(1),
  ip_address: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/),
  port: z.number().int().positive(),
  firmware_version: z.string().nullable().optional(),
  control_port_count: z.number().int().min(1).max(64),
  status: EquipmentStatusSchema,
});

// PATCH = partial of Upsert (also carries status-only change, Q3)
export const PatchControllerRequestSchema = UpsertControllerRequestSchema.partial();

export const CreateControllerResponseSchema = ControllerDetailSchema;
export const UpdateControllerResponseSchema = ControllerDetailSchema;
export const GetControllerDetailResponseSchema = ControllerDetailSchema;

export type Controller = z.infer<typeof ControllerSchema>;
export type ControllerListItem = z.infer<typeof ControllerListItemSchema>;
export type ControllerDetail = z.infer<typeof ControllerDetailSchema>;
export type ControllerConnectedDevice = z.infer<typeof ControllerConnectedDeviceSchema>;
export type ControllerHistoryItem = z.infer<typeof ControllerHistoryItemSchema>;
export type UpsertControllerRequest = z.infer<typeof UpsertControllerRequestSchema>;
export type PatchControllerRequest = z.infer<typeof PatchControllerRequestSchema>;
// ...plus Get/Create/Update response & query types
```

> **GetControllersResponse shape changes** from `{ controllers: [...] }` to `{ items, total, ... }`. The equipment `ControllerPicker` consumes `getCrmControllersOptions`; update it to read `items` (and pass `limit: 50`) when the schema changes — tracked as an integration touch-point in tasks.

**Register** all new schemas in `src/app/api/_scripts/register-schemas.ts` (add to the existing `controllerSchemas` registrations).

---

## 3. Mock-DB Extensions (`_mock-db.ts`)

### Seed updates

- Backfill the 8 `SEED_CONTROLLERS` with `store_code`, `location`, `firmware_version`, `control_port_count`, `created_at`, `updated_at` (cover ≥ 3 stores per constitution II). Keep existing `controller_number`/`port`/`status`/`name`.
- Add `buildControllerHistorySeed(controllerId, createdAt)` → `ControllerHistoryItem[]` (a `created` genesis row + 1–2 `status_change`/`inspection` rows), mirroring `buildEquipmentHistorySeed`.
- Add `SEED_CONTROLLER_HISTORY: Record<string, ControllerHistoryItem[]>` keyed by `controller_id`.

### `db.controllers` entity (extend)

```ts
controllers: {
  _rows: Controller[];                       // existing
  _historyByControllerId: Record<string, ControllerHistoryItem[]>; // NEW
  getAll(): Controller[];                     // existing (kept)
  getById(id): Controller | undefined;        // existing

  // NEW
  list(query: GetControllersQuery): { items: ControllerListItem[]; total; page; limit; total_pages };
  getDetailById(id): ControllerDetail | undefined;     // controller + device_count + device_summary
  getConnectedDevices(id): { devices: ControllerConnectedDevice[]; summary: ControllerDeviceSummary };
  getHistory(id): ControllerHistoryItem[];             // read-only
  create(input: UpsertControllerRequest): ControllerDetail;     // auto-number CTRL-####, set timestamps
  update(id, input: PatchControllerRequest): ControllerDetail | undefined; // updates fields incl. status; touch updated_at
  delete(id): { ok: true } | { ok: false; reason: 'has_connected_devices'; device_count: number }; // GUARD
}
```

**Helper logic**:

- `device_count` / `device_summary` / `getConnectedDevices`: scan `db.equipment._rows`, match by equipment meta `controller_id` then `controller_number` (research R2). `summary.total = devices.length`, `normal`/`error` counted by status.
- `create`: next `CTRL-####` from max existing; `created_at = updated_at = now`; `controller_number` = next available number.
- `update`: shallow-merge provided fields; set `updated_at = now`; **no** history append (Q3). Status-only change uses the same path with just `{ status }`.
- `delete`: if `getConnectedDevices(id).devices.length > 0` → `{ ok:false, reason:'has_connected_devices', device_count }`; else remove row + history.
- **No history mutation anywhere** — `_historyByControllerId` is seed/read-only (Q3, FR-007-G).
- Mock-db MUST keep compiling against `types.gen.ts` (`npm run type-check`).

---

## 4. Validation Rules (form — Q2)

Client form schema (`controllers/_schemas/controller-form.schema.ts`, RHF + Zod):

| Field                             | Rule                                                |
| --------------------------------- | --------------------------------------------------- |
| 装置名 `name`                     | required, non-empty (≤ 255)                         |
| 店舗コード `store_code`           | required, non-empty                                 |
| 設置場所 `location`               | required, non-empty (≤ 255)                         |
| IPアドレス `ip_address`           | required + local-IP regex `^\d{1,3}(\.\d{1,3}){3}$` |
| 制御ポート数 `control_port_count` | required int 1–64                                   |
| ポート番号 `port`                 | required int 1–65535                                |
| 状態 `status`                     | required; default `normal`                          |
| FW `firmware_version`             | optional (≤ 255)                                    |

On invalid submit → `useScrollToFirstError` focuses the first invalid field; submit blocked. `controller_id` is read-only/system (「（自動採番）」 on create).

---

## 5. State Transitions (status)

`正常 (normal) ⇄ 異常 (error) ⇄ メンテナンス中 (maintenance) → 廃棄 (discarded)`

- Any state is selectable on create and via edit/status-change (no enforced transition graph in Phase 1; mirrors equipment).
- Changing status updates `status` + `updated_at` only; no history entry (Q3).
- `廃棄` does not auto-delete; deletion is a separate guarded action (R3).

---

## 6. Relationships

- **Controller 1 — N Connected Equipment**: an equipment row references a controller via `controller_id` (meta) / `controller_number`. `device_count` and `device_summary` are derived from this relation; deletion is blocked while N > 0 (R3).
- **Controller 1 — N History entries**: seed-only, read-only (Q3).
- **Controller N — 1 Store**: via `store_code` (store master Y-02, out of scope; selected through `SearchableSelect` + stores API).
