# Contract: GET /api/crm/studios/{id}/history

**Feature**: 011-studio-detail-page (FR-003 Studio Detail Display — Change History tab)
**Phase**: Phase 1 mock route handler
**Purpose**: Provide read-only change-log entries for the studio detail history tab.

---

## Request

`GET /api/crm/studios/{id}/history`

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
    "entries": [
      {
        "timestamp": "2026-03-01T14:22:00.000Z",
        "user": "管理者",
        "action": "更新",
        "diffs": [
          {
            "field": "備考",
            "before": "（空欄）",
            "after": "土日は利用者が多いため、清掃スケジュールを追加"
          }
        ]
      },
      {
        "timestamp": "2025-02-10T11:00:00.000Z",
        "user": "管理者",
        "action": "作成",
        "note": "Zumbaスタジオを新規登録"
      }
    ],
    "total": 2
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
  "error": "Failed to fetch studio history"
}
```

---

## Behavioral Rules

1. Entries are returned newest-first (as stored in seed).
2. `作成` entries have no `diffs`; UI renders 新規作成 badge + optional `note`.
3. `更新` entries with multiple `diffs` are expanded to one table row per diff in the UI.
4. Studios without history return `{ "data": { "entries": [], "total": 0 } }` (not 404).
5. History fetch is lazy-loaded when the Change History tab is active.

---

## Contract Tests (minimum)

- Happy path: studio with history returns entries + total.
- Happy path: studio without history returns empty entries array.
- Error path: unknown ID returns 404.
- Error path: simulated internal failure returns 500.
