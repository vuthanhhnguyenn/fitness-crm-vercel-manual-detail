# Contract: GET /api/crm/lesson-contents/{id}/history

**Feature**: 008-lesson-content-detail | **Phase 1 mock Route Handler**
**File**: `src/app/api/crm/lesson-contents/[id]/history/route.ts`
**Schemas**: `src/app/api/_schemas/lesson-content-detail.schema.ts`
**Serves**: 変更履歴 (Change History) tab — Headquarter/System only (FR-003-P1-18)

Returns the change-log entries for a lesson content master. Fetched lazily and only when the
current role can view history (`canViewHistory`).

## Request

`GET /api/crm/lesson-contents/{id}/history`

### Path parameters

| Param | Type   | Required | Description |
| ----- | ------ | -------- | ----------- |
| `id`  | string | yes      | Master ID   |

No query parameters in Phase 1 (the table renders the full list + total footer). Pagination params
may be added in Phase 2.

## Response 200 — `GetLessonContentHistoryResponse`

```json
{
  "data": {
    "entries": [
      {
        "id": "HIS-001",
        "timestamp": "2026-05-02T09:30:00.000Z",
        "operator": "本部 管理者",
        "action": "編集",
        "detail": "実施時間: 45分 → 60分"
      },
      {
        "id": "HIS-000",
        "timestamp": "2026-01-10T00:00:00.000Z",
        "operator": "本部 管理者",
        "action": "作成",
        "detail": null
      }
    ],
    "total": 2
  }
}
```

## Response 404 — not found

Returned when no master matches `id`. Body: `{ "error": "Lesson content not found" }`.

## Response 500 — internal error

Body: `{ "error": "Failed to fetch lesson history" }`.

## Behavior rules

1. `entries` are returned newest-first (descending `timestamp`).
2. `total` drives the table's total-count footer.
3. `detail` may be null (e.g. for a 作成 entry with no field diff).
4. A master with no history returns `entries: []`, `total: 0`.
5. The endpoint itself is not role-restricted at the mock layer (Phase 1); access control is enforced
   client-side by only rendering/fetching for Headquarter/System (the tab is not shown otherwise).

## Contract tests (Definition of Done)

- **Happy path**: returns entries (newest first) + correct `total`.
- **Null detail**: a 作成 entry returns `detail: null`.
- **Empty**: a master with no history returns `entries: []`, `total: 0`.
- **Error path**: an unknown id returns 404.
