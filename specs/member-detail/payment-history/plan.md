# Technical Plan: 支払い履歴タブ（A-01-01-d）

> **Pipeline Step**: 3 / 5 — `speckit.plan`
> **Spec**: `specs/member-detail/payment-history/spec.md`
> **Branch**: `feat/member-detail-payment-history`
> **Date**: 2026-04-22
> **Author**: speckit.plan

---

## 0. Prerequisites

- Spec approved ✅
- All `[NEEDS CLARIFICATION]` items resolved ✅
- UI prototype reference: `fitness-crm-ui/src/pages/member-detail.tsx` → `PaymentTab()` (L1179–L1340)

---

## 1. Architectural Overview

This feature adds a new **"支払い履歴"** tab to the existing `MemberDetailPage` (`src/app/(private)/members/[id]/page.tsx`). It follows the established tab component pattern (see `UsageHistoryTab`, `PointsTab`) and introduces three new API endpoints under `/crm/members/[id]/`.

```
MemberDetailPage
  └── TabsTrigger value="payment"  (新規追加)
        └── PaymentHistoryTab          ← 新規コンポーネント
              ├── PaymentLedgerCard    (入出金明細 + フィルタ + ページネーション)
              ├── BillingListCard      (請求一覧 + ページネーション)
              └── PaymentSummaryCard   (支払いサマリー, sticky right column)
```

Three independent React Query calls (no shared loading state):

| Query            | Endpoint                                | Pagination                                        |
| ---------------- | --------------------------------------- | ------------------------------------------------- |
| `paymentHistory` | `GET /crm/members/{id}/payment-history` | page + limit (50/page), period+type filter params |
| `billing`        | `GET /crm/members/{id}/billing`         | page + limit (50/page)                            |
| `paymentSummary` | `GET /crm/members/{id}/payment-summary` | none                                              |

Filter state (period, type, page) is **local `useState`** — not URL params — because filters are scoped to this tab and do not need to be bookmarkable.

---

## 2. Data Model & Types

### 2.1 Zod Schemas — `src/app/api/_schemas/member.schema.ts` (append)

```typescript
// --- Payment History ---

export const PaymentHistoryTypeSchema = z.enum(['sale', 'refund']);

export const PaymentHistoryItemSchema = z
  .object({
    date: z.string().openapi({ example: '2026/04/01' }),
    type: PaymentHistoryTypeSchema,
    content: z.string().openapi({ example: '月会費（4月分）' }),
    amount: z.number().openapi({ description: '返金は負値' }),
    method: z.string().openapi({ example: 'SBPS' }),
  })
  .openapi({ title: 'PaymentHistoryItem' });

export const GetPaymentHistoryResponseSchema = z
  .object({
    items: z.array(PaymentHistoryItemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  })
  .openapi({ title: 'GetPaymentHistoryResponse' });

export type GetPaymentHistoryResponse = z.infer<typeof GetPaymentHistoryResponseSchema>;

// --- Billing List ---

export const BillingStatusSchema = z.enum(['pending', 'paid', 'uncollected', 'written-off']);
export const BillingTypeSchema = z.enum(['monthly', 'oneTime']);

export const BillingItemSchema = z
  .object({
    month: z.string().openapi({ example: '2026年4月' }),
    type: BillingTypeSchema,
    amount: z.number(),
    status: BillingStatusSchema,
    billingDate: z.string().openapi({ example: '2026/04/01' }),
  })
  .openapi({ title: 'BillingItem' });

export const GetBillingResponseSchema = z
  .object({
    items: z.array(BillingItemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  })
  .openapi({ title: 'GetBillingResponse' });

export type GetBillingResponse = z.infer<typeof GetBillingResponseSchema>;

// --- Payment Summary ---

export const PaymentSummarySchema = z
  .object({
    currentMonthAmount: z.number(),
    unpaidTotal: z.number(),
    lastPaymentDate: z.string().nullable(),
    paymentMethod: z.string(),
  })
  .openapi({ title: 'PaymentSummary' });

export type PaymentSummary = z.infer<typeof PaymentSummarySchema>;
```

### 2.2 TypeScript Types — `src/types/` (no new file needed)

Types derive from Zod schemas via `z.infer<>`. The generated `src/lib/api/types.gen.ts` will expose them after `npm run generate-api`.

---

## 3. API Routes

### 3.1 `GET /crm/members/{id}/payment-history`

**File**: `src/app/api/crm/members/[id]/payment-history/route.ts`

Query params (validated via Zod `.safeParse`):

| Param    | Type                                                            | Default | Notes   |
| -------- | --------------------------------------------------------------- | ------- | ------- |
| `page`   | `number`                                                        | `1`     | 1-based |
| `limit`  | `number`                                                        | `50`    |         |
| `period` | `"all" \| "thisMonth" \| "lastMonth" \| "3months" \| "6months"` | `"all"` |         |
| `type`   | `"all" \| "sale" \| "refund"`                                   | `"all"` |         |

Response: `GetPaymentHistoryResponse`

Mock data: 10 seed records covering both `sale` and `refund` types, mixed methods (SBPS, JACCS, 現金).

### 3.2 `GET /crm/members/{id}/billing`

**File**: `src/app/api/crm/members/[id]/billing/route.ts`

Query params:

| Param   | Type     | Default |
| ------- | -------- | ------- |
| `page`  | `number` | `1`     |
| `limit` | `number` | `50`    |

Response: `GetBillingResponse`

Mock data: 8 seed records covering all 4 statuses (`pending`, `paid`, `uncollected`, `written-off`) and both billing types.

### 3.3 `GET /crm/members/{id}/payment-summary`

**File**: `src/app/api/crm/members/[id]/payment-summary/route.ts`

No query params.

Response: `PaymentSummary`

Mock data: Single object computed from mock billing seed (currentMonthAmount, unpaidTotal, lastPaymentDate, paymentMethod).

---

## 4. OpenAPI & Client Generation

After creating the three routes, run:

```bash
npm run generate-openapi   # writes src/lib/openapi.json
npm run generate-api       # writes src/lib/api/ (types.gen.ts + react-query.gen.ts)
```

Generated option factories will be named:

- `getCrmMembersByIdPaymentHistoryOptions`
- `getCrmMembersByIdBillingOptions`
- `getCrmMembersByIdPaymentSummaryOptions`

---

## 5. UI Components

### 5.1 Directory Structure

```
src/app/(private)/members/[id]/_components/tabs/
└── payment-history-tab/
    ├── index.tsx              ← PaymentHistoryTab (shell: layout, three queries)
    ├── payment-ledger-card.tsx  ← 入出金明細カード
    ├── billing-list-card.tsx    ← 請求一覧カード
    ├── payment-summary-card.tsx ← 支払いサマリーカード
    └── billing-status-badge.tsx ← ステータスバッジ (status → variant + label)
```

### 5.2 `index.tsx` — `PaymentHistoryTab`

- `'use client'`
- Props: `{ memberId: string }`
- Local state:
  - `paymentPeriod: PeriodFilter` (default `"all"`)
  - `paymentType: TypeFilter` (default `"all"`)
  - `ledgerPage: number` (default `1`)
  - `billingPage: number` (default `1`)
- Three independent `useQuery` calls using generated option factories
- Layout: `<div className="flex gap-4">` → 60% left column + 40% right column (sticky)
- Each section wrapped in `<DataStateBoundary>` for independent loading / error / empty states

### 5.3 `payment-ledger-card.tsx`

- Receives: `memberId`, `period`, `type`, `page`, callbacks `onPeriodChange`, `onTypeChange`, `onPageChange`, query result props
- Header with two `<Select>` dropdowns (period / type) — matches prototype exactly
- `<Table>` with columns: 日付 / 種別 / 内容 / 金額 / 決済方法
- Amount cell: negative → `text-destructive`, format `¥9,900` / `-¥2,200`
- Type badge: 返金 → `variant="secondary"`, 売上 → `variant="default"`
- `<TablePagination>` at card footer

### 5.4 `billing-list-card.tsx`

- `<Table>` with columns: 請求月 / 請求種別 / 金額 / ステータス / 請求日
- Type badge: 都度 → `variant="outline"`, 月次 → `variant="default"`
- Status badge: via `<BillingStatusBadge>` sub-component
- `<TablePagination>` at card footer

### 5.5 `billing-status-badge.tsx`

Maps internal status → Japanese label + CSS class:

| Status        | Label    | CSS                                                        |
| ------------- | -------- | ---------------------------------------------------------- |
| `pending`     | 未確定   | `text-blue-600 border-blue-200 bg-blue-50`                 |
| `paid`        | 入金済み | `text-green-600 border-green-200 bg-green-50`              |
| `uncollected` | 未回収   | `text-orange-600 border-orange-200 bg-orange-50`           |
| `written-off` | 貸倒     | `text-destructive border-destructive/30 bg-destructive/10` |

Uses `variant="outline"` + className override (CSS variable-safe, no raw hex in prod — use Tailwind semantic classes or CSS vars as needed).

### 5.6 `payment-summary-card.tsx`

- Receives `PaymentSummary` data + loading/error props
- Sticky right column per prototype: `sticky top-6`
- `未回収合計` row: if `unpaidTotal > 0`, value shown with `text-destructive font-bold`
- `最終入金日`: null → `"-"`
- `CreditCard` icon from `lucide-react` next to payment method label

### 5.7 Empty & Error States

Each card uses `<DataStateBoundary>` for loading skeleton, error with retry button, and empty text:

| Card          | Empty message                |
| ------------- | ---------------------------- |
| 入出金明細    | 「入出金履歴はありません」   |
| 請求一覧      | 「請求履歴はありません」     |
| フィルタ後0件 | 「該当する履歴はありません」 |

---

## 6. Integration into `MemberDetailPage`

**File**: `src/app/(private)/members/[id]/page.tsx`

Changes:

1. Add import: `import { PaymentHistoryTab } from './_components/tabs/payment-history-tab';`
2. Add `TabsTrigger` in the tab list:
   ```tsx
   <TabsTrigger value="payment">支払い履歴</TabsTrigger>
   ```
   Position: after `contracts` (`契約情報`), before `points` (`ポイント`) — matching the spec hierarchy order.
3. Add `TabsContent`:
   ```tsx
   <TabsContent value="payment">
     <PaymentHistoryTab memberId={memberId} />
   </TabsContent>
   ```

---

## 7. Mock DB Seed Data

**File**: `src/app/api/_mock-db.ts`

Add two seed arrays:

```typescript
MOCK_PAYMENT_HISTORY: PaymentHistoryItem[]   // 10 records, mixed types/methods
MOCK_BILLING_LIST:    BillingItem[]          // 8 records, all 4 statuses represented
```

Mock summary is computed dynamically from `MOCK_BILLING_LIST` in the route handler.

---

## 8. Access Control

- No additional middleware changes required
- The tab is unconditionally rendered (FR-009-d: always accessible)
- The API route returns data for any member the calling user can already access via the existing auth middleware (`src/middleware.ts`)
- 403 for unauthorized member access is already handled at the member level

---

## 9. File Change Summary

| File                                                                                           | Action     | Notes                                     |
| ---------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------- |
| `src/app/api/_schemas/member.schema.ts`                                                        | Edit       | Append 3 Zod schema blocks                |
| `src/app/api/_mock-db.ts`                                                                      | Edit       | Add payment history + billing seed arrays |
| `src/app/api/crm/members/[id]/payment-history/route.ts`                                        | **New**    | GET handler                               |
| `src/app/api/crm/members/[id]/billing/route.ts`                                                | **New**    | GET handler                               |
| `src/app/api/crm/members/[id]/payment-summary/route.ts`                                        | **New**    | GET handler                               |
| `src/lib/openapi.json` _(generated)_                                                           | Regenerate | `npm run generate-openapi`                |
| `src/lib/api/types.gen.ts` _(generated)_                                                       | Regenerate | `npm run generate-api`                    |
| `src/lib/api/@tanstack/react-query.gen.ts` _(generated)_                                       | Regenerate | `npm run generate-api`                    |
| `src/app/(private)/members/[id]/_components/tabs/payment-history-tab/index.tsx`                | **New**    | Tab shell                                 |
| `src/app/(private)/members/[id]/_components/tabs/payment-history-tab/payment-ledger-card.tsx`  | **New**    |                                           |
| `src/app/(private)/members/[id]/_components/tabs/payment-history-tab/billing-list-card.tsx`    | **New**    |                                           |
| `src/app/(private)/members/[id]/_components/tabs/payment-history-tab/billing-status-badge.tsx` | **New**    |                                           |
| `src/app/(private)/members/[id]/_components/tabs/payment-history-tab/payment-summary-card.tsx` | **New**    |                                           |
| `src/app/(private)/members/[id]/page.tsx`                                                      | Edit       | Add tab trigger + content                 |

Total: 3 route files (new), 5 UI component files (new), 3 edits.

---

## 10. UI Prototype Registry Update

| Branch                               | Screen name    | UI slug         | Cache path                                                                  | Spec IDs    |
| ------------------------------------ | -------------- | --------------- | --------------------------------------------------------------------------- | ----------- |
| `feat/member-detail-payment-history` | 支払い履歴タブ | `member-detail` | `.cache/remote-ui/fitness-crm-ui/src/pages/member-detail.tsx` (L1179–L1340) | A-01 FR-009 |

---

## 11. Out of Scope

- Edit / delete of payment records (read-only per spec)
- Cross-brand billing aggregation
- URL state for filters (local state only; no `nuqs` needed here)
- F-01 actual backend integration (mock data only in this iteration)

---

## Handoff

> Plan complete. Please review and approve, then trigger the next step:
>
> **"Follow instructions in speckit.tasks.prompt.md"**
