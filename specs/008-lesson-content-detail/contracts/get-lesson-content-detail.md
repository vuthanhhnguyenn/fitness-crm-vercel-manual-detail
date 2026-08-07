# Contract: GET /api/crm/lesson-contents/{id}

**Feature**: 008-lesson-content-detail | **Phase 1 mock Route Handler**
**File**: `src/app/api/crm/lesson-contents/[id]/route.ts`
**Schemas**: `src/app/api/_schemas/lesson-content-detail.schema.ts`
**Serves**: Lesson content detail screen (`/lessons/[id]`) — header + Basic Info tab cards

Returns the full read-only detail for a single lesson content master. One unified shape covers
studio, body care, and personal records (discriminated by `lesson_type`). The handler resolves `id`
across both `db.lessonContents` (`LSN-*`) and `db.personalPlans` (`PLN-*`).

## Request

`GET /api/crm/lesson-contents/{id}`

### Path parameters

| Param | Type   | Required | Description                           |
| ----- | ------ | -------- | ------------------------------------- |
| `id`  | string | yes      | Master ID (`LSN-0001`, `PLN-0001`, …) |

No query parameters.

## Response 200 — `GetLessonContentDetailResponse`

```json
{
  "data": {
    "id": "LSN-0001",
    "name": "ヨガベーシック",
    "lesson_type": "studio",
    "brand": "joyfit",
    "status": "active",
    "duration": 60,
    "pricing_type": "included",
    "per_use_fee": null,
    "images": [
      { "url": "/mock/lessons/yoga-1.jpg", "caption": "スタジオA", "is_main": true },
      { "url": "/mock/lessons/yoga-2.jpg", "caption": null, "is_main": false }
    ],
    "description": "初心者向けのベーシックヨガです。",
    "internal_memo": "マットは各自持参を案内。",
    "restriction": {
      "restricted_main_contracts": ["プレミアム会員"],
      "restricted_option_contracts": [],
      "per_use_fee": null
    },
    "usage_count": 3,
    "schedule_total": 12,
    "store_id": "store-001",
    "created_at": "2026-01-10T00:00:00.000Z",
    "updated_at": "2026-05-02T00:00:00.000Z"
  }
}
```

## Response 404 — not found

Returned when no master matches `id` (drives the detail not-found state — FR-003-P1-23).
Body: `{ "error": "Lesson content not found" }`.

## Response 500 — internal error

Body: `{ "error": "Failed to fetch lesson content detail" }`.

## Behavior rules

1. Resolve `id` against `db.lessonContents` first, then `db.personalPlans`; 404 if neither matches.
2. `lesson_type` is `studio`/`bodycare` for `lessonContents` rows (from `kind`) and `personal` for
   `personalPlans` rows.
3. `per_use_fee` and `restriction.per_use_fee` are present (non-null) only when
   `pricing_type === 'paid'`; null/omitted otherwise (FR-003-P1-04).
4. Empty `restricted_main_contracts` / `restricted_option_contracts` arrays render as "制限なし".
5. `status: 'inactive'` represents a soft-deleted/retained master (Q4); the screen renders the
   inactive state + 有効化する control.
6. `usage_count` drives the delete guard (FR-003-P1-15/16); `schedule_total` drives the recent-card badge.

## Contract tests (Definition of Done)

- **Happy path (studio)**: returns a studio record with `lesson_type: 'studio'` and images.
- **Happy path (personal)**: a `PLN-*` id returns `lesson_type: 'personal'`.
- **Pay-per-use**: a record with `pricing_type: 'paid'` returns a non-null `per_use_fee`.
- **Inactive**: a soft-deleted record returns `status: 'inactive'`.
- **In-use vs unused**: one record returns `usage_count > 0`, another `usage_count === 0`.
- **Error path**: an unknown id returns 404.
