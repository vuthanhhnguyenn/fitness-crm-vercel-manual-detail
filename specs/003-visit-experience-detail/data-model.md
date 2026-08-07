# Data Model: Visit/Experience Management — Detail Page

**Branch**: `003-visit-experience-detail` | **Phase**: 1 — Design & Contracts  
**Generated**: 2026-06-18  
**Extends**: `specs/001-visit-experience-list/data-model.md`

---

## Entities

### 1. `VisitTimelineEntry` (new)

A single audit event in the visit reservation lifecycle.

| Field       | Type     | Nullable | Description                                             |
| ----------- | -------- | -------- | ------------------------------------------------------- |
| `timestamp` | `string` | No       | ISO 8601 datetime of the event                          |
| `operator`  | `string` | No       | `"システム"` for automated events; staff name otherwise |
| `content`   | `string` | No       | Plain-language description of the event                 |

**Display rules**:

- `operator === "システム"` → neutral dot indicator (muted colour)
- `operator !== "システム"` → primary dot indicator
- Entries are displayed in **reverse-chronological** order (newest first)

---

### 2. `VisitExperienceDetail` (new — extends `VisitExperience`)

Represents the full detail record for one visit/experience reservation. Extends the list type with all personal information, identity document, B-01, and timeline fields.

| Field                            | Type                   | Nullable | Description                                                                           |
| -------------------------------- | ---------------------- | -------- | ------------------------------------------------------------------------------------- |
| _(all `VisitExperience` fields)_ | —                      | —        | See `data-model.md` from `001-visit-experience-list`                                  |
| `customer_name_kana`             | `string`               | No       | Applicant name in katakana furigana                                                   |
| `birth_date`                     | `string`               | No       | Birth date formatted `YYYY/MM/DD`                                                     |
| `phone`                          | `string \| null`       | Yes      | Phone number; `null` in `info_missing` state                                          |
| `email`                          | `string \| null`       | Yes      | Email address; `null` in `info_missing` state                                         |
| `address`                        | `string \| null`       | Yes      | Full address; `null` in `info_missing` state                                          |
| `id_document_type`               | `string \| null`       | Yes      | Document type (e.g., `"運転免許証"`); `null` when not submitted                       |
| `id_document_verified`           | `boolean`              | No       | `true` when eKYC-equivalent check passed                                              |
| `bl_match_reason`                | `string \| null`       | Yes      | Match reason text (e.g., `"氏名＋生年月日一致"`); non-null only when `bl_match: true` |
| `permit_issued_at`               | `string \| null`       | Yes      | ISO 8601 datetime when permit was issued; `null` before issuance                      |
| `b01_auth_method`                | `string \| null`       | Yes      | Entry authentication method (e.g., `"顔認証"`); `null` before entry                   |
| `b01_gate`                       | `string \| null`       | Yes      | Permitted gate name (e.g., `"メインエントランス"`); `null` before entry               |
| `b01_entry_at`                   | `string \| null`       | Yes      | ISO 8601 datetime of actual facility entry; `null` before entry                       |
| `b01_exit_at`                    | `string \| null`       | Yes      | ISO 8601 datetime of actual facility exit; `null` before exit                         |
| `timeline`                       | `VisitTimelineEntry[]` | No       | Audit trail; always has ≥ 1 entry; newest entry first                                 |

**Validation rules**:

- `bl_match_reason !== null` implies `bl_match === true`
- `permit_issued_at !== null` implies `status` is one of: `visiting`, `visit_completed`, `membership_applied`
- `b01_entry_at !== null` implies `permit_issued_at !== null`
- `b01_exit_at !== null` implies `b01_entry_at !== null`
- `id_document_verified === false` when `id_document_type === null`

**Display rules**:

- `phone === null` or `address === null` → render `"未登録"` in warning colour (not `—`)
- `id_document_verified === false` and `id_document_type === null` → show blocking alert, hide document fields
- `bl_match === true` → destructive-toned card, match reason listed, BL detail link shown
- `b01_entry_at !== null` → show B-01 連携情報 card (visiting / completed states)
- All other nullable fields → render `—` placeholder when null

---

### 3. `PermitVisitExperienceResponse` (new)

Response body returned by `POST /api/crm/visit-experiences/[id]/permit`.

| Field    | Type                    | Description                                                                            |
| -------- | ----------------------- | -------------------------------------------------------------------------------------- |
| `record` | `VisitExperienceDetail` | Updated record with status `visiting`, permit fields set, new timeline entry prepended |

---

### 4. `VisitExperienceStatus` (existing — no change)

No new status values are added. The detail page maps design variants to existing enum values:

| Design Variant | Status Enum Value      | Detail Page Label | Status Tone |
| -------------- | ---------------------- | ----------------- | ----------- |
| default        | `application_received` | 申込受付          | muted       |
| info-missing   | `info_missing`         | 確認待ち          | warning     |
| bl-match       | `bl_checking`          | BL照合中          | destructive |
| visiting       | `visiting`             | 見学中            | info        |
| completed      | `visit_completed`      | 見学終了          | muted       |
| —              | `membership_applied`   | 入会申請済        | success     |
| —              | `cancelled`            | キャンセル        | destructive |

> `bl_checking` + `bl_match: true` renders as the "BL照合中" variant with destructive styling.  
> `bl_checking` + `bl_match: false` renders as the default "申込受付" variant (BL check in progress but no match yet).

---

## State Transitions (detail page triggers)

```
application_received
  └→ visiting           POST /permit (staff issues permit — all checks pass)

bl_checking (bl_match:true)
  └→ visiting           POST /permit (staff issues permit — risk override)

visiting
  └→ visit_completed    (automatic via B-01 exit detection — Phase 2)

visit_completed
  └→ membership_applied (staff clicks "入会申請へ誘導" — navigation only, no API call on this page)
```

> `info_missing` → no transition available from detail page; visit cannot proceed until info is complete.  
> `membership_applied`, `cancelled` → terminal read-only states on this page.

---

## TypeScript Type Additions

**Extend file**: `src/types/api/visit-experience.type.ts`

```typescript
export interface VisitTimelineEntry {
  timestamp: string;
  operator: string;
  content: string;
}

export interface VisitExperienceDetail extends VisitExperience {
  customer_name_kana: string;
  birth_date: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  id_document_type: string | null;
  id_document_verified: boolean;
  bl_match_reason: string | null;
  permit_issued_at: string | null;
  b01_auth_method: string | null;
  b01_gate: string | null;
  b01_entry_at: string | null;
  b01_exit_at: string | null;
  timeline: VisitTimelineEntry[];
}

export interface PermitVisitExperienceResponse {
  record: VisitExperienceDetail;
}
```

---

## Zod Schema Additions

**Extend file**: `src/app/api/_schemas/visit-experience.schema.ts`

```typescript
export const VisitTimelineEntrySchema = z.object({
  timestamp: z.string().datetime({ offset: true }),
  operator: z.string(),
  content: z.string(),
});

export const VisitExperienceDetailSchema = VisitExperienceSchema.extend({
  customer_name_kana: z.string(),
  birth_date: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  id_document_type: z.string().nullable(),
  id_document_verified: z.boolean(),
  bl_match_reason: z.string().nullable(),
  permit_issued_at: z.string().datetime({ offset: true }).nullable(),
  b01_auth_method: z.string().nullable(),
  b01_gate: z.string().nullable(),
  b01_entry_at: z.string().datetime({ offset: true }).nullable(),
  b01_exit_at: z.string().datetime({ offset: true }).nullable(),
  timeline: z.array(VisitTimelineEntrySchema),
});

export const PermitVisitExperienceResponseSchema = z.object({
  record: VisitExperienceDetailSchema,
});

export type VisitTimelineEntry = z.infer<typeof VisitTimelineEntrySchema>;
export type VisitExperienceDetail = z.infer<typeof VisitExperienceDetailSchema>;
export type PermitVisitExperienceResponse = z.infer<typeof PermitVisitExperienceResponseSchema>;
```

---

## Mock DB Seed (detail fields — additions to existing records)

Each record in `SEED_VISIT_EXPERIENCES` must add the following fields. Representative examples:

### VE-001 (visiting — normal)

```typescript
customer_name_kana: 'ヤマダ タロウ',
birth_date: '1990/04/15',
phone: '090-1234-5678',
email: 'yamada.taro@example.com',
address: '東京都渋谷区渋谷1-1-1',
id_document_type: '運転免許証',
id_document_verified: true,
bl_match_reason: null,
permit_issued_at: makeVeDate(0, 9, 3),    // 2 min before visit_start_at
b01_auth_method: '顔認証',
b01_gate: 'メインエントランス',
b01_entry_at: makeVeDate(0, 9, 5),
b01_exit_at: null,
timeline: [
  { timestamp: makeVeDate(0, 9, 5), operator: 'システム', content: '施設入館（顔認証）— 30分見学開始' },
  { timestamp: makeVeDate(0, 9, 3), operator: '管理者A', content: '見学許可を発行（30分間の時間制限入館）' },
  { timestamp: makeVeDate(0, 9, 0), operator: 'システム', content: '見学申込受信（アプリ経由）' },
]
```

### VE-006 (info_missing)

```typescript
customer_name_kana: 'ワタナベ ナナ',
birth_date: '1998/11/03',
phone: null,
email: 'watanabe.nana@example.com',
address: null,
id_document_type: null,
id_document_verified: false,
bl_match_reason: null,
permit_issued_at: null,
b01_auth_method: null,
b01_gate: null,
b01_entry_at: null,
b01_exit_at: null,
timeline: [
  { timestamp: makeVeDate(0, 15, 1), operator: 'システム', content: '情報不足を検出: 電話番号・住所・本人確認書類が未登録' },
  { timestamp: makeVeDate(0, 15, 0), operator: 'システム', content: '見学申込受信（アプリ経由）' },
]
```

### VE-005 (bl_checking + bl_match: true)

```typescript
customer_name_kana: 'イトウ タクヤ',
birth_date: '1985/07/22',
phone: '080-9876-5432',
email: 'ito.takuya@example.com',
address: '東京都渋谷区広尾3-2-1',
id_document_type: '運転免許証',
id_document_verified: true,
bl_match_reason: '氏名＋生年月日一致',
permit_issued_at: null,
b01_auth_method: null,
b01_gate: null,
b01_entry_at: null,
b01_exit_at: null,
timeline: [
  { timestamp: makeVeDate(0, 14, 3), operator: 'システム', content: 'ブラックリスト照合: 一致あり（氏名＋生年月日）' },
  { timestamp: makeVeDate(0, 14, 1), operator: 'システム', content: '個人情報・顔写真の登録確認完了' },
  { timestamp: makeVeDate(0, 14, 0), operator: 'システム', content: '見学申込受信（アプリ経由）' },
]
```
