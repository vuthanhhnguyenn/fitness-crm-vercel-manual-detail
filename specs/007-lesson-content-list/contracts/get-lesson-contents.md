# Contract: GET /api/crm/lesson-contents

**Feature**: 007-lesson-content-list | **Phase 1 mock Route Handler**
**File**: `src/app/api/crm/lesson-contents/route.ts`
**Schemas**: `src/app/api/_schemas/lesson-content.schema.ts`
**Serves**: Studio tab and Body care tab (`LessonTable`)

Returns a filtered, sorted, paginated page of lesson master records (studio + body care).
Distinguish the two tabs via the `brand`/`lesson_category` filter or a `kind` param (see below).

## Request

`GET /api/crm/lesson-contents?{query}`

### Query parameters

| Param             | Type                             | Default     | Description                                                  |
| ----------------- | -------------------------------- | ----------- | ------------------------------------------------------------ |
| `kind`            | `studio` \| `bodycare`           | `studio`    | Which lesson set to return (maps to Studio vs Body care tab) |
| `search`          | string                           | —           | Partial match on `name` or `id` (case-insensitive)           |
| `lesson_category` | string[] (comma-sep or repeated) | —           | Filter by lesson category                                    |
| `category`        | string[]                         | —           | Filter by category                                           |
| `brand`           | (`joyfit` \| `fit365`)[]         | —           | Filter by brand                                              |
| `status`          | (`active` \| `inactive`)[]       | —           | Filter by status                                             |
| `include_deleted` | boolean                          | `false`     | When false, exclude `is_deleted` / `inactive` rows           |
| `store_id`        | string                           | —           | Scope to a store (omitted = all accessible stores)           |
| `sort_by`         | string                           | `id`        | One of: `id`, `name`, `duration`, `status`, `brand`          |
| `sort_order`      | `asc` \| `desc`                  | `asc`       | Sort direction                                               |
| `page`            | number (≥1)                      | `1`         | Page index                                                   |
| `limit`           | number (1–50)                    | `PAGE_SIZE` | Page size (≤ 50 per Principle V)                             |

Parsing rules follow `crm/members`: `z.preprocess` for array params, `z.coerce.number` for
`page`/`limit`, `z.enum(...).default(...)` for sort/order.

## Response 200 — `GetLessonContentsResponse`

```json
{
  "data": [
    {
      "id": "LSN-0001",
      "name": "ヨガベーシック",
      "brand": "joyfit",
      "duration": 60,
      "pricing_type": "included",
      "status": "active",
      "gender_restriction": "none",
      "lesson_category": "yoga",
      "category": "studio",
      "store_id": "ST-001",
      "is_deleted": false,
      "reservation_count": 12,
      "max_reservation_count": 20
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 37, "total_pages": 2 }
}
```

## Response 400 — validation error

Returned when query params fail Zod validation (e.g. `sort_by` not in the allowed enum,
`limit` > 50). Body: `{ "error": "Invalid query parameters", "details": [...] }`.

## Behavior rules

1. Filter order: store scope → `kind` → search → detailed filters → include-deleted → sort → paginate.
2. `include_deleted=false` excludes rows where `is_deleted === true` OR `status === 'inactive'`.
3. Store scope: if caller role is all-store and no `store_id`, return all stores; otherwise scope to `store_id`.
4. Empty result returns `data: []` with correct `pagination.total = 0` (drives empty state).

## Contract tests (Definition of Done)

- **Happy path**: returns rows for `kind=studio`, default sort, page 1.
- **Search**: `search` filters by partial name and ID.
- **Filter**: `brand`/`status`/`lesson_category` narrow results; `include_deleted` reveals inactive rows.
- **Sort**: `sort_by=name&sort_order=desc` reorders rows.
- **Error path**: invalid `sort_by` (or `limit=999`) returns 400.
