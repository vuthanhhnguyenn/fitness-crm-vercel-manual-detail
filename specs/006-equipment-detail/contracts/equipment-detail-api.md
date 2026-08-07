# API Contract: Connected Equipment Detail

**Base path**: `/crm/equipment`  
**Phase**: 1 (mock route handlers)

---

## GET `/crm/equipment/{id}`

**Summary**: Get connected equipment detail  
**Tags**: `Equipment`

### Path parameters

| Name | Type     | Required |
| ---- | -------- | -------- |
| `id` | `string` | ✓        |

### Responses

| Status | Schema                       | Description                               |
| ------ | ---------------------------- | ----------------------------------------- |
| 200    | `GetEquipmentDetailResponse` | `{ equipment: ConnectedEquipmentDetail }` |
| 404    | `ErrorResponse`              | Equipment not found                       |

---

## GET `/crm/equipment/{id}/history`

**Summary**: Get equipment status change history (seed data, read-only)  
**Tags**: `Equipment`

### Path parameters

| Name | Type     | Required |
| ---- | -------- | -------- |
| `id` | `string` | ✓        |

### Responses

| Status | Schema                        | Description                                 |
| ------ | ----------------------------- | ------------------------------------------- |
| 200    | `GetEquipmentHistoryResponse` | `{ history: EquipmentStatusHistoryItem[] }` |
| 404    | `ErrorResponse`               | Equipment not found                         |

> Static seed only — **not updated** when status changes via bulk-status. No pagination. No summary footer.

---

## POST `/crm/equipment/bulk-status` (existing — reused for detail)

**Summary**: Update status of one or more equipment records  
**Tags**: `Equipment`

Used by detail **ステータス変更** dialog with a single id:

```json
{ "ids": ["EQ-0001"], "status": "maintenance" }
```

### Responses

| Status | Schema                              | Description                             |
| ------ | ----------------------------------- | --------------------------------------- |
| 200    | `BulkUpdateEquipmentStatusResponse` | `{ success, updated_count, results[] }` |

**Client behavior after success**:

```ts
queryClient.invalidateQueries({
  queryKey: getCrmEquipmentByIdQueryKey({ path: { id: equipmentId } }),
});
```

Do not expect updated detail in the response body.

---

## DELETE `/crm/equipment/{id}`

**Summary**: Delete connected equipment  
**Tags**: `Equipment`

### Path parameters

| Name | Type     | Required |
| ---- | -------- | -------- |
| `id` | `string` | ✓        |

### Responses

| Status | Schema          | Description          |
| ------ | --------------- | -------------------- |
| 204    | —               | Deleted successfully |
| 404    | `ErrorResponse` | Not found            |

---

## Schema references

**New** in `src/app/api/_schemas/equipment.schema.ts`:

- `ConnectedEquipmentDetailSchema`
- `UsageControlRuleDisplaySchema`
- `ControllerSummarySchema`
- `EquipmentStatusHistoryItemSchema`
- `GetEquipmentDetailResponseSchema`
- `GetEquipmentHistoryResponseSchema`

**Reused** (no new status endpoint schemas):

- `BulkUpdateEquipmentStatusRequestSchema`
- `BulkUpdateEquipmentStatusResponseSchema`

**Generated hooks**:

- `getCrmEquipmentByIdOptions`
- `getCrmEquipmentByIdHistoryOptions`
- `deleteCrmEquipmentByIdMutation`
- `postCrmEquipmentBulkStatusMutation` (existing)
