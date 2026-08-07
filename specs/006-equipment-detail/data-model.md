# Data Model: E-02 Connected Equipment Detail

**Feature**: `006-equipment-detail`  
**Date**: 2026-06-24

---

## Entities

### ConnectedEquipmentDetail

Extends list item fields with detail-only data. Stored in mock-db as `ConnectedEquipmentDetail` (list fields + extensions).

| Field                      | Type                            | Required | Notes                                                        |
| -------------------------- | ------------------------------- | -------- | ------------------------------------------------------------ |
| `id`                       | `string`                        | ✓        | e.g. `EQ-0001`                                               |
| `name`                     | `string`                        | ✓        | Display title                                                |
| `store_id`                 | `string`                        | ✓        | Data scope check                                             |
| `store_name`               | `string`                        | ✓        | Subtitle                                                     |
| `controller_number`        | `number`                        | ✓        | Label: 接点制御先番号                                        |
| `qr_code_id`               | `string \| null`                |          | Em dash when null                                            |
| `equipment_type`           | `EquipmentType` enum            | ✓        |                                                              |
| `serial_number`            | `string`                        | ✓        | Monospace display                                            |
| `ip_address`               | `string \| null`                |          |                                                              |
| `mac_address`              | `string \| null`                |          | Monospace                                                    |
| `install_location`         | `string`                        | ✓        |                                                              |
| `installed_on`             | `string`                        | ✓        | ISO date `YYYY-MM-DD`                                        |
| `status`                   | `EquipmentStatus` enum          | ✓        | `normal` \| `error` \| `maintenance` \| `discarded`          |
| `authentication_method`    | `EquipmentAuthenticationMethod` | ✓        |                                                              |
| `linked_contract_labels`   | `string[]`                      | ✓        | Badge list (legacy list display)                             |
| `usage_control_rule`       | `UsageControlRuleDisplay`       | ✓        | Structured read-only FR-008 display                          |
| `controller_summary`       | `ControllerSummary`             | ✓        | Linked 接点制御装置 summary                                  |
| `created_at`               | `string`                        | ✓        | ISO 8601                                                     |
| `updated_at`               | `string`                        | ✓        | ISO 8601                                                     |
| `last_status_confirmed_at` | `string`                        | ✓        | Same as `updated_at` (bulk-status updates `updated_at` only) |

### UsageControlRuleDisplay

| Field                       | Type                                  | Notes                         |
| --------------------------- | ------------------------------------- | ----------------------------- |
| `contract_link_types`       | `('main' \| 'option' \| 'per_use')[]` | Maps to 紐づき契約種別 badges |
| `option_type_label`         | `string \| null`                      | e.g. 水素水                   |
| `main_contract_type_label`  | `string \| null`                      | Em dash when null             |
| `per_use_option_type_label` | `string \| null`                      | Em dash when null             |
| `show_gate_stop_info`       | `boolean`                             | `true` only for `entry_gate`  |

### ControllerSummary

| Field           | Type              | Notes                    |
| --------------- | ----------------- | ------------------------ |
| `controller_id` | `string`          | Display: 装置ID: {id}    |
| `ip_address`    | `string`          |                          |
| `port`          | `number`          | Display as `{ip}:{port}` |
| `status`        | `EquipmentStatus` | Same enum as equipment   |
| `name`          | `string \| null`  | Optional                 |

### EquipmentStatusHistoryItem

| Field           | Type                           | Notes                                     |
| --------------- | ------------------------------ | ----------------------------------------- |
| `id`            | `string`                       | Unique row id                             |
| `occurred_at`   | `string`                       | ISO 8601 — display `yyyy/MM/dd HH:mm` JST |
| `operator_name` | `string`                       | Staff name or システム                    |
| `event_type`    | `'created' \| 'status_change'` | `created` → 新規作成 badge                |
| `from_status`   | `EquipmentStatus \| null`      | Null for creation event                   |
| `to_status`     | `EquipmentStatus \| null`      | Null for creation (use `event_type`)      |
| `change_reason` | `string \| null`               | 変更理由; em dash when null               |

---

## State Transitions

### Equipment Status (`EquipmentStatus`)

Manual updates only (CRM). Valid values:

```
normal | error | maintenance | discarded
```

**Transition rule**: Any status → any other status (3 targets shown in UI, excluding current).

**Side effects on status change** (via `POST /crm/equipment/bulk-status`):

1. Update `equipment.status`
2. Set `updated_at` = now
3. **No** history append
4. Client refetches detail via `invalidateQueries`

### Delete

- Permitted at **any** status
- Removes equipment row and associated history from mock-db
- No prerequisite 廃棄 status

---

## Validation Rules

| Operation                 | Rule                                                             |
| ------------------------- | ---------------------------------------------------------------- |
| POST bulk-status (detail) | `ids: [singleId]`, `status` required; UI excludes current status |
| POST bulk-status          | `change_reason` in schema but **not persisted** Phase 1          |
| DELETE                    | Equipment must exist; no dependency checks Phase 1               |
| GET detail/history        | 404 if id not found                                              |

---

## Mock Seed Requirements

- Reuse `SEED_CONNECTED_EQUIPMENT` base rows; extend to `ConnectedEquipmentDetail` via helper
- Seed ≥1 history row per equipment (include creation + ≥1 status change for demo)
- `EQ-0001` (水素水サーバー) matches prototype demo fields where possible
- Controller summary lookup table keyed by `controller_number` (8 controllers for existing seeds)
