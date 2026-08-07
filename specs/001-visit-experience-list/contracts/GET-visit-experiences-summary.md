# Contract: GET /api/crm/visit-experiences/summary

**Phase 1 mock** — `src/app/api/crm/visit-experiences/summary/route.ts`  
**Phase 2 real** — `GET {BACKEND_BASE}/crm/visit-experiences/summary` (not yet published)

---

## Request

```
GET /api/crm/visit-experiences/summary
```

No query parameters. Returns same-day KPI counts for the **full dataset** — independent of any filters applied to the list.

---

## Response

### 200 OK

```json
{
  "today_applications": 7,
  "visiting_count": 2,
  "today_membership_count": 1,
  "today_cancelled_count": 0
}
```

| Field                    | Calculation                                                                   |
| ------------------------ | ----------------------------------------------------------------------------- |
| `today_applications`     | `COUNT` where `DATE(reserved_at) = TODAY`                                     |
| `visiting_count`         | `COUNT` where `status = "visiting"` (all dates, not just today)               |
| `today_membership_count` | `COUNT` where `status = "membership_applied"` AND `DATE(reserved_at) = TODAY` |
| `today_cancelled_count`  | `COUNT` where `status = "cancelled"` AND `DATE(reserved_at) = TODAY`          |

### 500 Internal Server Error

```json
{ "error": "Internal server error" }
```

---

## Important: Filter Independence

The summary endpoint **always returns full same-day totals**. It must NOT be influenced by any filter state from the list endpoint. This is why it has its own endpoint rather than being embedded in the list response.

---

## Contract Tests Required

- **Happy path**: Returns correct counts matching seed data for today's date.
- **Zero cancellations**: When no `cancelled` records exist for today, `today_cancelled_count = 0`.
- **All-zero**: When seed has no same-day records, all counts return 0.
