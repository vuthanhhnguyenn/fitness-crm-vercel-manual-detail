# PATCH /api/crm/lesson-contents/{id}

Update an existing lesson content master.

## Request

**Method**: `PATCH`
**Path**: `/api/crm/lesson-contents/{id}`
**Content-Type**: `application/json`

### Path Parameters

| Parameter | Type     | Required | Description                              |
| --------- | -------- | -------- | ---------------------------------------- |
| `id`      | `string` | Yes      | Master ID (e.g., `LSN-0001`, `PLN-0001`) |

### Request Body

All fields optional — only provided fields are updated.

```ts
{
  name?: string;                          // レッスン名 (max 255)
  lesson_type?: 'studio' | 'bodycare';    // レッスン区分
  brand?: 'joyfit' | 'fit365';            // ブランド
  duration?: number;                      // 所要時間 in minutes
  pricing_type?: 'free' | 'monthly' | 'per_use'; // 料金種別
  per_use_fee?: number | null;           // 都次利用料金
  restricted_main_contracts?: string[];  // 制限主契約 IDs
  restricted_option_contracts?: string[];// 制限オプション契約 IDs
  description?: string;                  // 説明 (HTML from QuillJS, max 10000)
  internal_memo?: string;                // 備考 (max 1000)
  status?: 'active' | 'inactive';        // ステータス
}
```

## Response

### 200 — Updated

```ts
{
  message: 'レッスンの変更を保存しました',
  data: LessonContentDetail  // from lesson-content-detail.schema.ts
}
```

### 400 — Validation Error

```ts
{
  error: string; // comma-separated Zod issue messages
}
```

### 404 — Not Found

```ts
{
  error: 'Lesson content not found';
}
```

### 500 — Internal Server Error

```ts
{
  error: 'Failed to update lesson content';
}
```

## Mock Implementation Notes

- Look up by ID in `db.lessonContents` or `db.personalPlans`.
- Merge provided fields with existing record.
- No real persistence in Phase 1 (in-memory only).

## Test Cases

1. **Happy path**: Valid partial payload → 200 with updated data.
2. **Not found**: Non-existent ID → 404.
3. **Invalid field value**: `status: 'invalid'` → 400.
4. **Full update**: All fields provided → 200 with complete update.
