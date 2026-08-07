# POST /api/crm/lesson-contents

Create a new lesson content master.

## Request

**Method**: `POST`
**Path**: `/api/crm/lesson-contents`
**Content-Type**: `application/json`

### Request Body

```ts
{
  name: string;                          // レッスン名 (required, max 255)
  lesson_type: 'studio' | 'bodycare';    // レッスン区分 (required)
  brand: 'joyfit' | 'fit365';            // ブランド (required)
  duration: number;                      // 所要時間 in minutes (required)
  pricing_type: 'free' | 'monthly' | 'per_use'; // 料金種別 (required)
  per_use_fee?: number | null;           // 都次利用料金 (required when pricing_type = 'per_use')
  restricted_main_contracts?: string[];  // 制限主契約 IDs
  restricted_option_contracts?: string[];// 制限オプション契約 IDs
  description?: string;                  // 説明 (HTML from QuillJS, max 10000)
  internal_memo?: string;                // 備考 (max 1000)
  status: 'active' | 'inactive';        // ステータス (required)
}
```

## Response

### 200 — Created

```ts
{
  message: 'レッスンを登録しました',
  data: LessonContentDetail  // from lesson-content-detail.schema.ts
}
```

### 400 — Validation Error

```ts
{
  error: string; // comma-separated Zod issue messages
}
```

### 500 — Internal Server Error

```ts
{
  error: 'Failed to create lesson content';
}
```

## Mock Implementation Notes

- Generate a new ID (`LSN-XXXX` for studio/bodycare, `PLN-XXXX` for personal).
- Add the new record to `db.lessonContents` / `db.personalPlans` in `_mock-db.ts`.
- Return the full detail object in the response.
- No real persistence in Phase 1 (in-memory only).

## Test Cases

1. **Happy path**: Valid payload → 200 with success message + data.
2. **Missing required field**: Omit `name` → 400 with validation error.
3. **Invalid enum value**: `brand: 'invalid'` → 400 with validation error.
4. **Conditional required**: `pricing_type: 'per_use'` with no `per_use_fee` → 400.
