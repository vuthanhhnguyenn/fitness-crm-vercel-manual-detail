# Contract: GET /api/crm/visit-experiences

**Phase 1 mock** — `src/app/api/crm/visit-experiences/route.ts`  
**Phase 2 real** — `GET {BACKEND_BASE}/crm/visit-experiences` (not yet published)

---

## Request

```
GET /api/crm/visit-experiences
```

### Query Parameters

| Parameter    | Type      | Required | Default | Validation                                                                                                                      |
| ------------ | --------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `search`     | `string`  | No       | —       | Partial match on `id` or `customer_name` (case-insensitive)                                                                     |
| `status`     | `string`  | No       | —       | One of: `application_received`, `info_missing`, `bl_checking`, `visiting`, `visit_completed`, `membership_applied`, `cancelled` |
| `brand_name` | `string`  | No       | —       | Exact match                                                                                                                     |
| `store_name` | `string`  | No       | —       | Exact match                                                                                                                     |
| `date_range` | `string`  | No       | —       | One of: `today`, `last_3_days`, `last_7_days`                                                                                   |
| `page`       | `integer` | No       | `1`     | min: 1                                                                                                                          |
| `limit`      | `integer` | No       | `50`    | One of: 25, 50, 100, 200                                                                                                        |

---

## Responses

### 200 OK

```json
{
  "items": [
    {
      "id": "VE-2026-0001",
      "customer_name": "山田 太郎",
      "status": "visiting",
      "bl_match": false,
      "brand_name": "FIT365",
      "store_name": "FIT365八潮店",
      "reserved_at": "2026-06-17T10:00:00+09:00",
      "visit_start_at": "2026-06-17T10:05:00+09:00",
      "visit_end_scheduled_at": "2026-06-17T10:35:00+09:00",
      "visit_end_actual_at": null
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 50,
  "total_pages": 1
}
```

### 400 Bad Request

```json
{ "error": "Invalid query parameters", "details": ["limit must be one of 25, 50, 100, 200"] }
```

### 500 Internal Server Error

```json
{ "error": "Internal server error" }
```

---

## Filtering Logic (mock implementation)

1. Apply `search`: keep records where `id.includes(search)` OR `customer_name.includes(search)` (case-insensitive).
2. Apply `status`: keep records where `status === status`.
3. Apply `brand_name`: keep records where `brand_name === brand_name`.
4. Apply `store_name`: keep records where `store_name === store_name`.
5. Apply `date_range`:
   - `today`: `reserved_at` date equals today
   - `last_3_days`: `reserved_at` date within last 3 calendar days (today included)
   - `last_7_days`: `reserved_at` date within last 7 calendar days
6. Sort: `reserved_at` descending (most recent first).
7. Paginate: skip `(page - 1) * limit`, take `limit`.

---

## Contract Tests Required

- **Happy path**: Request with no filters returns all seed records paginated.
- **Search filter**: `?search=VE-2026-0001` returns exactly 1 record.
- **Status filter**: `?status=visiting` returns only `visiting` records.
- **Combined filters**: `?status=visiting&brand_name=FIT365` returns intersection.
- **Empty result**: `?status=cancelled&brand_name=JOYFIT` when no matching records → `items: [], total: 0`.
- **Invalid limit**: `?limit=99` → `400` response.
- **Pagination**: `?page=2&limit=25` when `total < 25` → `items: [], page: 2`.
