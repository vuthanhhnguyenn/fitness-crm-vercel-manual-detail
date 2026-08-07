# Contract: GET /api/crm/studios/{id}

**Feature**: 011-studio-detail-page (FR-003 Studio Detail Display)
**Phase**: Phase 1 mock route handler
**Purpose**: Provide complete read-only data for studio detail page rendering.

---

## Request

`GET /api/crm/studios/{id}`

### Path Parameters

| Param | Type   | Required | Description       |
| ----- | ------ | -------- | ----------------- |
| `id`  | string | yes      | Studio identifier |

No query parameters.

---

## Response 200

```json
{
  "data": {
    "id": "STD-0001",
    "name": "Studio A",
    "studio_type": "studio_lesson",
    "status": "active",
    "capacity": 30,
    "buffer_value": 2,
    "usage_hours": "10:00-21:00",
    "store_id": "STORE-001",
    "store_name": "Shibuya",
    "equipment_notes": "Mirrors + sound system",
    "internal_notes": null,
    "created_at": "2026-01-15T00:00:00.000Z",
    "updated_at": "2026-06-01T00:00:00.000Z",
    "assigned_lesson_count": 3,
    "change_history_enabled": false
  },
  "linked_lessons": [
    {
      "lesson_id": "LSN-0001",
      "lesson_name": "Yoga Basic",
      "category": "Yoga",
      "schedule_text": "Mon/Wed 19:00",
      "reservation_rate": 82,
      "reservation_tier": "success"
    }
  ],
  "images": [
    {
      "image_id": "IMG-001",
      "url": "/mock/studios/studio-a-1.jpg",
      "alt": "Studio A main view",
      "sort_order": 0
    }
  ],
  "layout": {
    "state": "configured",
    "rows": 5,
    "columns": 6,
    "cells": [
      { "x": 0, "y": 0, "kind": "normal_seat" },
      { "x": 1, "y": 0, "kind": "equipment_seat" },
      { "x": 2, "y": 0, "kind": "fixed_object" }
    ],
    "configure_path": "/studios/STD-0001/edit"
  },
  "utilization": {
    "day_rate": 71,
    "week_rate": 68,
    "month_rate": 64,
    "trend": "up"
  }
}
```

---

## Response 404

Returned when `id` does not exist or is outside role scope.

```json
{
  "error": "Studio not found"
}
```

---

## Response 500

```json
{
  "error": "Failed to fetch studio detail"
}
```

---

## Behavioral Rules

1. Action visibility is not returned as explicit booleans; UI derives it from authenticated user role and authority matrix.
2. `assigned_lesson_count > 0` indicates delete confirmation must be blocked/disabled.
3. `linked_lessons` can be empty. In that case, UI still renders linked-lessons card with empty-state message.
4. Reservation tiers must match thresholds:

- `>= 80` => `success`
- `>= 60 && < 80` => `warning`
- `< 60` => `default`

5. `layout.state = not_configured` requires `rows`, `columns`, and `cells` to be null/empty while `configure_path` remains present.
6. Change History tab fetches `GET /crm/studios/{id}/history` when active; empty entries array shows empty-state message.

---

## Contract Tests (minimum)

- Happy path: configured layout + linked lessons + image set returned.
- Happy path: `layout.state = not_configured` returned with configure path.
- Happy path: zero linked lessons returns empty array (not error).
- Guard path: in-use studio returns `assigned_lesson_count > 0`.
- Error path: unknown ID returns 404.
- Error path: simulated internal failure returns 500.
