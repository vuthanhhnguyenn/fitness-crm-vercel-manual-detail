# Data Model: E-02 Connected Equipment Form (Create / Edit)

**Feature**: `007-equipment-form`  
**Date**: 2026-06-25

Builds on the 006 equipment data model. Adds the **write** shapes (create/update request), structured usage-control-rule input, and the controller-picker option.

---

## 1. Enums (existing — reuse)

| Enum                            | Values                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `EquipmentStatus`               | `normal` \| `error` \| `maintenance` \| `discarded`                                                                       |
| `EquipmentType`                 | `entry_gate` \| `hydrogen_water_server` \| `body_composition_monitor` \| `tanning_machine` \| `protein_server` \| `other` |
| `EquipmentAuthenticationMethod` | `member_qr_scan` \| `device_qr_scan` \| `none`                                                                            |
| `EquipmentContractLinkType`     | `main` \| `option` \| `per_use`                                                                                           |

---

## 2. EquipmentUsageControlRuleInput (new)

Structured FR-008 rule captured by the form. All judgments optional (Q3); a type value is required only when its flag is `true` (Q4).

| Field                 | Type             | Required               | Notes                                                         |
| --------------------- | ---------------- | ---------------------- | ------------------------------------------------------------- |
| `main_enabled`        | `boolean`        | ✓ (default false)      | 主契約判定 checkbox                                           |
| `main_contract_type`  | `string \| null` | when `main_enabled`    | スタンダード / プレミアム / ライト (single, Q-design)         |
| `option_enabled`      | `boolean`        | ✓ (default false)      | オプション契約判定 checkbox                                   |
| `option_type`         | `string \| null` | when `option_enabled`  | 水素水 / プロテイン / タンニング / その他                     |
| `per_use_enabled`     | `boolean`        | ✓ (default false)      | 都次オプション判定 checkbox                                   |
| `per_use_option_type` | `string \| null` | when `per_use_enabled` | 水素水都次 / プロテイン都次 / タンニング都次 / コラーゲン都次 |

**Validation (Zod `superRefine`)**: if `*_enabled` is `true`, the matching type field MUST be non-null/non-empty; otherwise it is ignored and cleared before persistence.

---

## 3. UpsertEquipmentRequest (new — create & update body)

| Field                   | Type                                    | Required (submit-blocking) | Source / Notes                                                                        |
| ----------------------- | --------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `name`                  | `string` (1..255)                       | ✓                          | 機器名 — FR-003                                                                       |
| `equipment_type`        | `EquipmentType`                         | ✓                          | 機器タイプ — FR-003                                                                   |
| `serial_number`         | `string` (1..255)                       | ✓                          | シリアルナンバー — FR-003                                                             |
| `install_location`      | `string` (1..255)                       | ✓                          | 設置場所 — FR-003                                                                     |
| `installed_on`          | `string` (ISO `YYYY-MM-DD`)             | ✓                          | 設置日 — FR-003 (DatePicker)                                                          |
| `controller_number`     | `number \| string`                      | ✓                          | 接続先ポート番号 (form) = 接点制御先番号 (list/detail) — single field, required (Q2)  |
| `status`                | `EquipmentStatus`                       | ✓ (default `normal`)       | 状態 — all 4 selectable on create (Q5)                                                |
| `authentication_method` | `EquipmentAuthenticationMethod \| null` | ✓ (Update 2026-06-30)      | 認証方式 — FR-009; field-level required (must select one of the radio options)        |
| `controller_id`         | `string \| null`                        | ✓ (Update 2026-06-30)      | 接続先接点制御装置 — picker value (Q7); field-level required (must pick a controller) |
| `ip_address`            | `string \| null`                        | ✗ (optional)               | IPアドレス — FR-003                                                                   |
| `mac_address`           | `string \| null`                        | ✗ (optional)               | MACアドレス — FR-003                                                                  |
| `usage_control_rule`    | `EquipmentUsageControlRuleInput`        | ✗ (optional, Q3)           | FR-008 — may be empty (no judgment)                                                   |
| `remarks`               | `string \| null` (max 1000)             | ✗ (optional)               | 備考 — FR-003                                                                         |

**Not in payload**: `id` (system-assigned, read-only), gate-stop conditions (display-only, Q6), QRコードID (not a form field).

> **Single field for 接続先ポート番号 / 接点制御先番号**: the value labelled `接続先ポート番号` in the form and `接点制御先番号` in the list/detail is one and the same field, `controller_number`. There is no separate `controller_port`. The `接続先接点制御装置` picker (`controller_id` → `controller_summary`) is a distinct concept.

**Create vs Update**: identical body shape (`UpsertEquipmentRequest`). Create auto-numbers `id`; update targets `{id}` path param. 404 if update target missing.

---

## 4. Controller (new resource — picker source, Q7) — IMPLEMENTED

Own resource, returned by `GET /crm/controllers`. Schema: `src/app/api/_schemas/controller.schema.ts`. Backed by `db.controllers` (array entity) seeded from `SEED_CONTROLLERS` (refactored from the former `CONTROLLER_SUMMARY_SEED` Record).

| Field               | Type              | Notes                          |
| ------------------- | ----------------- | ------------------------------ |
| `controller_id`     | `string`          | e.g. `CTRL-002` (stored value) |
| `controller_number` | `number`          | maps to equipment row          |
| `name`              | `string \| null`  | e.g. 制御装置 新宿 2号         |
| `ip_address`        | `string`          | display                        |
| `port`              | `number`          | display / default port hint    |
| `status`            | `EquipmentStatus` | display badge                  |

Response: `{ controllers: Controller[] }`. Optional query `store_id` (best-effort filter; returns all when unmapped).

---

## 5. Persistence model (mock-db)

- `controller_number` is stored **directly on the equipment row** (`ConnectedEquipmentListItem`). It is the value entered as `接続先ポート番号` in the form and shown as `接点制御先番号` in the list/detail. On create/update it is written straight from `input.controller_number`.
- Additional form-only fields are kept in a parallel `_metaById` store:

| Field (`_metaById`)  | Type                      | Notes                                               |
| -------------------- | ------------------------- | --------------------------------------------------- |
| `controller_id`      | `string \| null`          | from picker (接続先接点制御装置)                    |
| `remarks`            | `string \| null`          | 備考                                                |
| `usage_control_rule` | structured rule (cleaned) | stored as entered; unchecked judgments cleared (Q4) |

`buildEquipmentDetail(item, meta)`:

1. If a stored structured `usage_control_rule` exists → map it to `UsageControlRuleDisplay`.
2. Else → existing `linked_contract_labels` parsing (legacy seeds).
3. `controller_summary` resolved from `meta.controller_id` (the picked controller), falling back to a `controller_number` match in `SEED_CONTROLLERS` for legacy seeds; mapped to `ControllerSummary` by dropping `controller_number`.

`controller_number` is **not** derived from the controller — it is the equipment's own port/contact number entered in the form (independent of `controller_id`).

---

## 6. ID generation

- New equipment `id` = `EQ-####`, next integer after current max in `db.equipment._rows` (e.g. existing seeds end at `EQ-0008` → next `EQ-0009`), zero-padded to 4 digits.

---

## 7. Validation Rules (summary)

| Operation        | Rule                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| POST create      | `UpsertEquipmentRequestSchema` valid; submit-blocking fields present; conditional rule selects present |
| PATCH update     | Same body schema; `{id}` must exist (else 404)                                                         |
| Usage-control    | `*_enabled=true` ⇒ matching type required; unchecked judgments cleared before persistence              |
| Controller field | Required at submit (Update 2026-06-30); must be a valid `controller_id` from the controllers list      |
| GET controllers  | Optional `store_id` filter; returns all when unmapped                                                  |

---

## 8. State / lifecycle

- **Create** → new row with `status` default `normal` (any of 4 selectable), `updated_at`/`created_at` = now, no history append (R6).
- **Edit** → mutate existing row fields; `updated_at` = now; no history append (R6).
- **Status** is set via this form on create/edit; ongoing status changes still flow through `POST /crm/equipment/bulk-status` (006) on the detail screen.

---

## 9. Mock seed requirements

- Existing `SEED_CONNECTED_EQUIPMENT` (EQ-0001..0008) remain valid; legacy rows without structured rule fall back to label parsing.
- `SEED_CONTROLLERS` (8 controllers, array) is exposed via `GET /crm/controllers` (`db.controllers`).
- Multi-store coverage already present (store-001/002/003) per constitution Phase-1 seed requirement.
