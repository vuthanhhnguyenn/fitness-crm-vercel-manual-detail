# Data Model: Visit/Experience Management — List Page

**Branch**: `001-visit-experience-list` | **Phase**: 1 — Design & Contracts  
**Generated**: 2026-06-17  
**Source file**: `src/types/api/visit-experience.type.ts`

---

## Entities

### 1. `VisitExperienceStatus` (enum)

Operational lifecycle phase of a visit reservation. Exactly 7 values.

| Value                  | Japanese   | Meaning                                  | Badge style       |
| ---------------------- | ---------- | ---------------------------------------- | ----------------- |
| `application_received` | 申込受付   | Application submitted, awaiting check-in | Muted (neutral)   |
| `info_missing`         | 確認待ち   | Required info incomplete                 | Warning (yellow)  |
| `bl_checking`          | BL照合中   | BL/blacklist check in progress           | Destructive (red) |
| `visiting`             | 見学中     | Currently in facility                    | Info (blue)       |
| `visit_completed`      | 見学終了   | Visit finished, not yet member           | Muted (neutral)   |
| `membership_applied`   | 入会申請済 | Membership application submitted         | Success (green)   |
| `cancelled`            | キャンセル | Reservation cancelled                    | Destructive (red) |

> **Note**: English enum values are used as API keys. Japanese labels are display-only in the UI layer.

---

### 2. `VisitExperience` (main entity)

Represents one visit/experience reservation record.

| Field                    | Type                    | Nullable | Description                                                       |
| ------------------------ | ----------------------- | -------- | ----------------------------------------------------------------- |
| `id`                     | `string`                | No       | Unique reservation identifier (e.g., `VE-2026-0001`)              |
| `customer_name`          | `string`                | No       | Full name of the applicant                                        |
| `status`                 | `VisitExperienceStatus` | No       | Current operational status                                        |
| `bl_match`               | `boolean`               | No       | `true` if blacklist match detected; applies visual risk treatment |
| `brand_name`             | `string`                | No       | Brand (`FIT365` or `JOYFIT`)                                      |
| `store_name`             | `string`                | No       | Store name (human-readable, e.g., `FIT365八潮店`)                 |
| `reserved_at`            | `string`                | No       | Reservation datetime (ISO 8601)                                   |
| `visit_start_at`         | `string \| null`        | Yes      | Actual check-in time; `null` when not yet started                 |
| `visit_end_scheduled_at` | `string`                | No       | Scheduled visit end datetime (ISO 8601)                           |
| `visit_end_actual_at`    | `string \| null`        | Yes      | Actual visit end datetime; `null` when visit not yet ended        |

**Validation rules**:

- `visit_end_scheduled_at` ≥ `reserved_at`
- `visit_end_actual_at` ≥ `visit_start_at` when both are set
- `bl_match` is independent of `status` — any status can be combined with `bl_match: true`

**Display rules**:

- `visit_start_at = null` → render `—` in 見学開始 column
- `visit_end_actual_at != null` → render actual with `（実績）` suffix
- `visit_end_actual_at = null` → render scheduled with `（予定）` suffix
- `bl_match = true` → row background `destructive/5`, `BL一致` badge with `AlertTriangle` icon

---

### 3. `GetVisitExperiencesQuery` (list query params)

| Field        | Type                                         | Default     | Description                                                            |
| ------------ | -------------------------------------------- | ----------- | ---------------------------------------------------------------------- |
| `search`     | `string?`                                    | `undefined` | Free-text; matches `id` or `customer_name` (partial, case-insensitive) |
| `status`     | `VisitExperienceStatus?`                     | `undefined` | Filter by status; omit for all statuses                                |
| `brand_name` | `string?`                                    | `undefined` | Filter by brand; omit for all brands                                   |
| `store_name` | `string?`                                    | `undefined` | Filter by store; omit for all stores                                   |
| `date_range` | `"today" \| "last_3_days" \| "last_7_days"?` | `undefined` | Filter `reserved_at`; omit for all time                                |
| `page`       | `number?`                                    | `1`         | 1-based page number                                                    |
| `limit`      | `25 \| 50 \| 100 \| 200?`                    | `50`        | Records per page                                                       |

---

### 4. `GetVisitExperiencesResponse` (list response)

| Field         | Type                | Description                            |
| ------------- | ------------------- | -------------------------------------- |
| `items`       | `VisitExperience[]` | Records for the current page           |
| `total`       | `number`            | Total records matching current filters |
| `page`        | `number`            | Current page (1-based)                 |
| `limit`       | `number`            | Page size used                         |
| `total_pages` | `number`            | `Math.ceil(total / limit)`             |

---

### 5. `GetVisitExperiencesSummaryResponse` (KPI response)

Always reflects the **full same-day dataset** (ignores any active list filters).

| Field                    | Type     | Description                                                               |
| ------------------------ | -------- | ------------------------------------------------------------------------- |
| `today_applications`     | `number` | Count of records with `reserved_at` today                                 |
| `visiting_count`         | `number` | Count of records with `status = "visiting"`                               |
| `today_membership_count` | `number` | Count of `status = "membership_applied"` records with `reserved_at` today |
| `today_cancelled_count`  | `number` | Count of `status = "cancelled"` records with `reserved_at` today          |

---

## State Transitions

```
申込受付
  └→ 確認待ち      (info found incomplete)
  └→ BL照合中      (BL check triggered)
  └→ 見学中        (staff checks in the visitor)
  └→ キャンセル    (reservation cancelled)

確認待ち
  └→ 申込受付      (info now confirmed)
  └→ キャンセル

BL照合中
  └→ 申込受付      (BL check passed)
  └→ キャンセル    (BL check failed — reservation cancelled)

見学中
  └→ 見学終了      (staff marks visit end)
  └→ キャンセル

見学終了
  └→ 入会申請済    (member application submitted after visit)
  └→ (terminal — no further transition from this page)

入会申請済         (terminal on this page)
キャンセル         (terminal)
```

> Note: Status transitions are documented for completeness. **The list page is read-only — it does not trigger transitions.** Transitions occur in the detail page (out of scope for Phase 1 list).

---

## TypeScript Type File

**Location**: `src/types/api/visit-experience.type.ts`

```typescript
export type VisitExperienceStatus =
  | 'application_received'
  | 'info_missing'
  | 'bl_checking'
  | 'visiting'
  | 'visit_completed'
  | 'membership_applied'
  | 'cancelled';

export const VISIT_EXPERIENCE_STATUS_LABELS: Record<VisitExperienceStatus, string> = {
  application_received: '申込受付',
  info_missing: '確認待ち',
  bl_checking: 'BL照合中',
  visiting: '見学中',
  visit_completed: '見学終了',
  membership_applied: '入会申請済',
  cancelled: 'キャンセル',
};

export interface VisitExperience {
  id: string;
  customer_name: string;
  status: VisitExperienceStatus;
  bl_match: boolean;
  brand_name: string;
  store_name: string;
  reserved_at: string;
  visit_start_at: string | null;
  visit_end_scheduled_at: string;
  visit_end_actual_at: string | null;
}

export type VisitExperienceDateRangeFilter = 'today' | 'last_3_days' | 'last_7_days';

export interface GetVisitExperiencesQuery {
  search?: string;
  status?: VisitExperienceStatus;
  brand_name?: string;
  store_name?: string;
  date_range?: VisitExperienceDateRangeFilter;
  page?: number;
  limit?: 25 | 50 | 100 | 200;
}

export interface GetVisitExperiencesResponse {
  items: VisitExperience[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface GetVisitExperiencesSummaryResponse {
  today_applications: number;
  visiting_count: number;
  today_membership_count: number;
  today_cancelled_count: number;
}
```

---

## Zod Schema File

**Location**: `src/app/api/_schemas/visit-experience.schema.ts`

Mirrors the TypeScript types above for runtime validation in mock Route Handlers.

```typescript
import { z } from 'zod';

export const VisitExperienceStatusSchema = z.enum([
  'application_received',
  'info_missing',
  'bl_checking',
  'visiting',
  'visit_completed',
  'membership_applied',
  'cancelled',
]);

export const VisitExperienceSchema = z.object({
  id: z.string(),
  customer_name: z.string(),
  status: VisitExperienceStatusSchema,
  bl_match: z.boolean(),
  brand_name: z.string(),
  store_name: z.string(),
  reserved_at: z.string().datetime({ offset: true }),
  visit_start_at: z.string().datetime({ offset: true }).nullable(),
  visit_end_scheduled_at: z.string().datetime({ offset: true }),
  visit_end_actual_at: z.string().datetime({ offset: true }).nullable(),
});

export const GetVisitExperiencesQuerySchema = z.object({
  search: z.string().optional(),
  status: VisitExperienceStatusSchema.optional(),
  brand_name: z.string().optional(),
  store_name: z.string().optional(),
  date_range: z.enum(['today', 'last_3_days', 'last_7_days']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .refine((v) => [25, 50, 100, 200].includes(v))
    .default(50),
});

export const GetVisitExperiencesResponseSchema = z.object({
  items: z.array(VisitExperienceSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int(),
  total_pages: z.number().int().nonnegative(),
});

export const GetVisitExperiencesSummaryResponseSchema = z.object({
  today_applications: z.number().int().nonnegative(),
  visiting_count: z.number().int().nonnegative(),
  today_membership_count: z.number().int().nonnegative(),
  today_cancelled_count: z.number().int().nonnegative(),
});

export type GetVisitExperiencesQuery = z.infer<typeof GetVisitExperiencesQuerySchema>;
export type GetVisitExperiencesResponse = z.infer<typeof GetVisitExperiencesResponseSchema>;
export type GetVisitExperiencesSummaryResponse = z.infer<
  typeof GetVisitExperiencesSummaryResponseSchema
>;
```
