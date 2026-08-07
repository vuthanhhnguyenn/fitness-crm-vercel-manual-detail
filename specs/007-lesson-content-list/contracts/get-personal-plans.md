# Contract: GET /api/crm/personal-plans

**Feature**: 007-lesson-content-list | **Phase 1 mock Route Handler**
**File**: `src/app/api/crm/personal-plans/route.ts`
**Schemas**: `src/app/api/_schemas/lesson-content.schema.ts`
**Serves**: Personal training tab (`PersonalTrainingTable`)

Returns a filtered, sorted, paginated page of personal training plan records.

## Request

`GET /api/crm/personal-plans?{query}`

### Query parameters

| Param             | Type                             | Default     | Description                                           |
| ----------------- | -------------------------------- | ----------- | ----------------------------------------------------- |
| `search`          | string                           | —           | Partial match on `name` or `id` (case-insensitive)    |
| `category`        | string[] (comma-sep or repeated) | —           | Filter by plan category                               |
| `brand`           | (`joyfit` \| `fit365`)[]         | —           | Filter by brand                                       |
| `status`          | (`active` \| `inactive`)[]       | —           | Filter by status                                      |
| `include_deleted` | boolean                          | `false`     | When false, exclude `is_deleted` / `inactive` rows    |
| `store_id`        | string                           | —           | Scope to a store (omitted = all accessible stores)    |
| `sort_by`         | string                           | `id`        | One of: `id`, `name`, `category`, `duration`, `price` |
| `sort_order`      | `asc` \| `desc`                  | `asc`       | Sort direction                                        |
| `page`            | number (≥1)                      | `1`         | Page index                                            |
| `limit`           | number (1–50)                    | `PAGE_SIZE` | Page size (≤ 50 per Principle V)                      |

## Response 200 — `GetPersonalPlansResponse`

```json
{
  "data": [
    {
      "id": "PLN-0001",
      "name": "パーソナル60",
      "description": "60分のマンツーマン指導",
      "category": "weight-loss",
      "duration": 60,
      "price": 8000,
      "reservations": 5,
      "max_reservations": 10,
      "brand": "fit365",
      "status": "active",
      "store_id": "ST-001",
      "is_deleted": false
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 14, "total_pages": 1 }
}
```

## Response 400 — validation error

Returned when query params fail Zod validation. Body:
`{ "error": "Invalid query parameters", "details": [...] }`.

## Behavior rules

1. Filter order: store scope → search → detailed filters → include-deleted → sort → paginate.
2. `include_deleted=false` excludes rows where `is_deleted === true` OR `status === 'inactive'`.
3. Store scope identical to `lesson-contents`.
4. Empty result returns `data: []` with `pagination.total = 0`.

## Contract tests (Definition of Done)

- **Happy path**: returns plans, default sort, page 1.
- **Search**: `search` filters by partial name and ID.
- **Filter**: `category`/`brand`/`status` narrow results; `include_deleted` reveals inactive rows.
- **Sort**: `sort_by=price&sort_order=desc` reorders rows.
- **Error path**: invalid `sort_by` (or `limit=999`) returns 400.
