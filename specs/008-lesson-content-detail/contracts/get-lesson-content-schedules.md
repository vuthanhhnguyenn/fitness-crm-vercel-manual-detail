# Contract: GET /api/crm/lesson-contents/{id}/schedules

**Feature**: 008-lesson-content-detail | **Phase 1 mock Route Handler**
**File**: `src/app/api/crm/lesson-contents/[id]/schedules/route.ts`
**Schemas**: `src/app/api/_schemas/lesson-content-detail.schema.ts`
**Serves**: Recent-schedule card (top 3 sessions) + "show all" schedule `Sheet`

Returns the schedules associated with a lesson content master: a recurring-pattern summary and the
full per-session list, plus a total count.

## Request

`GET /api/crm/lesson-contents/{id}/schedules`

### Path parameters

| Param | Type   | Required | Description |
| ----- | ------ | -------- | ----------- |
| `id`  | string | yes      | Master ID   |

No query parameters in Phase 1 (the recent card takes the top 3 of `sessions` client-side; the sheet
shows all). A `limit` param may be added in Phase 2 if needed.

## Response 200 — `GetLessonContentSchedulesResponse`

```json
{
  "data": {
    "recurring_patterns": [
      {
        "id": "RPT-001",
        "days": ["月", "水", "金"],
        "time": "10:00–11:00",
        "studio": "スタジオA",
        "period": "2026/04–2026/09",
        "instructors": [
          { "instructor_id": "INS-001", "name": "山田 花子" },
          { "instructor_id": "INS-002", "name": "佐藤 太郎" }
        ]
      }
    ],
    "sessions": [
      {
        "id": "SCH-1001",
        "date": "2026-06-28",
        "time": "10:00–11:00",
        "studio": "スタジオA",
        "booked": 18,
        "capacity": 20
      }
    ],
    "total": 12
  }
}
```

## Response 404 — not found

Returned when no master matches `id`. Body: `{ "error": "Lesson content not found" }`.

## Response 500 — internal error

Body: `{ "error": "Failed to fetch lesson schedules" }`.

## Behavior rules

1. `total` is the total number of `sessions` for the master (drives the recent-card badge "全{n}件").
2. The recent-schedule card displays the first 3 `sessions` (upcoming order); the `Sheet` displays all
   `recurring_patterns` and all `sessions`.
3. Each `recurring_patterns[].instructors` is an array (multi-instructor / n名). Each entry links to the
   D-04 instructor master via `instructor_id` (FR-003-P1-09a / Q3).
4. Capacity color coding is computed client-side from `booked`/`capacity` (full → destructive,
   ≥80% → warning, >0 → success, 0 → muted).
5. A master with no schedules returns empty arrays and `total: 0`.

## Contract tests (Definition of Done)

- **Happy path**: returns recurring patterns + sessions + correct `total`.
- **Multi-instructor**: at least one recurring pattern returns `instructors.length > 1`.
- **Empty**: a master with no schedules returns `recurring_patterns: []`, `sessions: []`, `total: 0`.
- **Error path**: an unknown id returns 404.
