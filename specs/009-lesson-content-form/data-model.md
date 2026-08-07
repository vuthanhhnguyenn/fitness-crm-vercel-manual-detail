# Data Model: Lesson Content Master Form (009)

> Phase 1 output — defines entities, fields, validation rules, and Zod schemas.

## Entities

### LessonContentMaster (form state)

The central entity captured by the form. Used for create, edit, and duplicate flows.

| Field                       | Type             | Required    | Constraints                                                               | Notes                                   |
| --------------------------- | ---------------- | ----------- | ------------------------------------------------------------------------- | --------------------------------------- |
| `name`                      | `string`         | Yes         | Max 255 chars                                                             | レッスン名                              |
| `lessonType`                | `enum`           | Yes         | `'studio' \| 'personal' \| 'bodycare'`                                    | レッスン区分                            |
| `brand`                     | `enum`           | Yes         | `'joyfit' \| 'fit365'`                                                    | ブランド                                |
| `duration`                  | `number`         | Yes         | Minutes; personal → 30\|60; studio/bodycare → 15\|30\|45\|50\|60\|90\|120 | 所要時間                                |
| `pricingType`               | `enum`           | Yes         | `'free' \| 'monthly' \| 'per_use'`                                        | 料金種別                                |
| `perUseFee`                 | `number \| null` | Conditional | Required only when `pricingType === 'per_use'`; null otherwise            | 都次利用料金（税込）                    |
| `restrictedMainContracts`   | `string[]`       | No          | Array of contract IDs                                                     | 制限主契約                              |
| `restrictedOptionContracts` | `string[]`       | No          | Array of option IDs                                                       | 制限オプション契約                      |
| `images`                    | `ImageItem[]`    | No          | Max N items (Phase 1: visual only)                                        | レッスン画像                            |
| `description`               | `string`         | No          | Max 1000 chars (HTML from QuillJS)                                        | レッスン内容説明 / トレーニング内容説明 |
| `notes`                     | `string`         | No          | Max 1000 chars                                                            | 備考 (internal memo)                    |
| `status`                    | `enum`           | Yes         | `'active' \| 'inactive'`; default `'active'`                              | ステータス                              |

### ImageItem

| Field   | Type     | Required | Notes                      |
| ------- | -------- | -------- | -------------------------- |
| `id`    | `string` | Yes      | Temporary client-side ID   |
| `url`   | `string` | Yes      | Image URL                  |
| `alt`   | `string` | No       | Alt text for accessibility |
| `order` | `number` | Yes      | Position; first = "メイン" |

### FormMode

```ts
type FormMode = 'create' | 'edit' | 'duplicate';
```

Not an entity per se, but a discriminant that governs:

| Behaviour            | Create                                     | Edit                                                  | Duplicate                                                        |
| -------------------- | ------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------- |
| Page title           | "新規レッスン作成"                         | "スタジオレッスン編集" / "パーソナルトレーニング編集" | "新規レッスン作成"                                               |
| Submit button        | "入力内容を確認する"                       | "変更を保存する"                                      | "入力内容を確認する"                                             |
| Confirm dialog title | "以下の内容で登録します。よろしいですか？" | "この内容で変更を保存しますか？"                      | "以下の内容で登録します。よろしいですか？"                       |
| Confirm action label | "この内容で登録する"                       | "この内容で保存する"                                  | "この内容で登録する"                                             |
| Success toast        | "レッスンを登録しました"                   | "レッスンの変更を保存しました"                        | "レッスンを登録しました"                                         |
| Warning banner       | Hidden                                     | Visible                                               | Hidden                                                           |
| API method           | `POST`                                     | `PATCH`                                               | `POST`                                                           |
| Pre-fill source      | None (empty defaults)                      | `GET /api/crm/lesson-contents/{id}`                   | `GET /api/crm/lesson-contents/{id}` (name suffixed "（コピー）") |

## Validation Rules

### Required fields (always)

- `name` — error: "レッスン名は必須です。"
- `brand` — error: "ブランドは必須です。"
- `duration` — error: "所要時間は必須です。"
- `pricingType` — error: "料金種別は必須です。"

### Conditional required

- `perUseFee` — required when `pricingType === 'per_use'`; error: "都次利用料金は必須です。"

### Not required (no validation errors)

- `lessonType` — always has a value via Select (no empty state), so no error needed.

### Duration option sets

- Personal → `[30, 60]`
- Studio & Bodycare → `[15, 30, 45, 50, 60, 90, 120]`

## State Transitions

```
[Empty Form] ──(create mode)──> [Filled Form] ──(submit + confirm)──> [Success Toast] ──> [Lesson List]

[Draft loaded via GET] ──(edit mode)──> [Filled Form] ──(submit + confirm)──> [Success Toast] ──> [Lesson List]

[Draft loaded via GET] ──(duplicate mode)──> [Filled Form (name + "（コピー）")] ──(submit + confirm)──> [Success Toast] ──> [Lesson List]
```

No intermediate persistence in Phase 1. All state is client-side until the final submit mutation.

## Zod Schemas

### Client-side: `lesson-form.schema.ts`

```ts
const LessonFormSchema = z
  .object({
    name: z.string().min(1, 'レッスン名は必須です。').max(255),
    lessonType: z.enum(['studio', 'personal', 'bodycare']),
    brand: z.enum(['joyfit', 'fit365'], { required_error: 'ブランドは必須です。' }),
    duration: z.number({ required_error: '所要時間は必須です。' }),
    pricingType: z.enum(['free', 'monthly', 'per_use'], { required_error: '料金種別は必須です。' }),
    perUseFee: z.number().nullable().optional(),
    restrictedMainContracts: z.array(z.string()).default([]),
    restrictedOptionContracts: z.array(z.string()).default([]),
    images: z.array(ImageItemSchema).default([]),
    description: z.string().max(10000).optional().default(''), // HTML from QuillJS
    notes: z.string().max(1000).optional().default(''),
    status: z.enum(['active', 'inactive']).default('active'),
  })
  .superRefine((data, ctx) => {
    if (
      data.pricingType === 'per_use' &&
      (data.perUseFee === null || data.perUseFee === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '都次利用料金は必須です。',
        path: ['perUseFee'],
      });
    }
  });
```

### Server-side: `lesson-content-form.schema.ts`

```ts
// Reuses enums from lesson-content.schema.ts
const CreateLessonContentSchema = z.object({
  name: z.string().min(1).max(255),
  lesson_type: LessonKindSchema, // studio | bodycare (personal handled separately)
  brand: LessonBrandSchema, // joyfit | fit365
  duration: z.number(),
  pricing_type: LessonPricingTypeSchema, // free | monthly | per_use
  per_use_fee: z.number().nullable().optional(),
  restricted_main_contracts: z.array(z.string()).optional(),
  restricted_option_contracts: z.array(z.string()).optional(),
  description: z.string().max(10000).optional(), // HTML from QuillJS
  internal_memo: z.string().max(1000).optional(),
  status: LessonContentStatusSchema, // active | inactive
});

const UpdateLessonContentSchema = CreateLessonContentSchema.partial();

const CreateLessonContentResponseSchema = z.object({
  message: z.string(),
  data: LessonContentDetailSchema, // from lesson-content-detail.schema.ts
});

const UpdateLessonContentResponseSchema = z.object({
  message: z.string(),
  data: LessonContentDetailSchema,
});
```

> Note: Personal plans use a separate schema (`PersonalPlanItem`) on the API side. The form hides this complexity — the page layer determines whether to POST/PATCH to the studio/bodycare lesson content endpoint or a personal plan endpoint based on `lessonType`.

## Relationships

```
LessonContentMaster (form)
  ├── has many → ImageItem (ordered; first = "メイン")
  ├── has many → restrictedMainContracts (references G-01 主契約)
  └── has many → restrictedOptionContracts (references G-02 オプション契約)
```

No foreign key enforcement in Phase 1 (mock data only).
