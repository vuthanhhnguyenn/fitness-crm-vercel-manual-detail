# Task Breakdown: 支払い履歴タブ（A-01-01-d）

> **Pipeline Step**: 4 / 5 — `speckit.tasks`
> **Plan Reference**: `specs/member-detail/payment-history/plan.md`
> **Branch**: `feat/member-detail-payment-history`
> **Date**: 2026-04-22
> **Total Tasks**: 14 (organized into 3 phases)

---

## Phase 1: Backend – Schema & Mock Data

### Task 1.1: Add Zod Schemas for Payment History API

**File**: `src/app/api/_schemas/member.schema.ts`

**Description**: Append three Zod schema blocks at the end of the file before any exports:

- `PaymentHistoryTypeSchema` = enum `['sale', 'refund']`
- `PaymentHistoryItemSchema` = object with fields: `date` (string YYYY/MM/DD), `type` (PaymentHistoryTypeSchema), `content` (string), `amount` (number, negative for refunds), `method` (string)
- `GetPaymentHistoryResponseSchema` = paginated response wrapper with `items`, `total`, `page`, `limit`
- Export the type: `export type GetPaymentHistoryResponse = z.infer<typeof GetPaymentHistoryResponseSchema>`

**Acceptance Criteria**:

- [ ] All four exports are in place
- [ ] OpenAPI metadata (`.openapi()`) is added to each schema
- [ ] File compiles without TypeScript errors

**Estimated Time**: 15 min

---

### Task 1.2: Add Zod Schemas for Billing List API

**File**: `src/app/api/_schemas/member.schema.ts`

**Description**: Append three more Zod schema blocks:

- `BillingStatusSchema` = enum `['pending', 'paid', 'uncollected', 'written-off']`
- `BillingTypeSchema` = enum `['monthly', 'oneTime']`
- `BillingItemSchema` = object with fields: `month` (string), `type`, `amount` (number), `status`, `billingDate` (string YYYY/MM/DD)
- `GetBillingResponseSchema` = paginated response wrapper with `items`, `total`, `page`, `limit`
- Export the type: `export type GetBillingResponse = z.infer<typeof GetBillingResponseSchema>`

**Acceptance Criteria**:

- [ ] All five exports are in place
- [ ] OpenAPI metadata added
- [ ] File compiles without TypeScript errors

**Estimated Time**: 15 min

---

### Task 1.3: Add Zod Schema for Payment Summary API

**File**: `src/app/api/_schemas/member.schema.ts`

**Description**: Append one more Zod schema block:

- `PaymentSummarySchema` = object with fields: `currentMonthAmount` (number), `unpaidTotal` (number), `lastPaymentDate` (string | null), `paymentMethod` (string)
- Export the type: `export type PaymentSummary = z.infer<typeof PaymentSummarySchema>`

**Acceptance Criteria**:

- [ ] Schema and type export in place
- [ ] OpenAPI metadata added
- [ ] File compiles without TypeScript errors

**Estimated Time**: 10 min

---

### Task 1.4: Add Mock Seed Data – Payment History

**File**: `src/app/api/_mock-db.ts`

**Description**: Add a constant array `MOCK_PAYMENT_HISTORY` with 10 seed records. Each record must have:

- `date`: varied dates across recent months (e.g., `"2026/04/01"`)
- `type`: mix of `"sale"` and `"refund"`
- `content`: descriptive text (e.g., `"月会費（4月分）"`, `"返金処理"`)
- `amount`: positive for sales, **negative for refunds** (e.g., `-2200`)
- `method`: varied (e.g., `"SBPS"`, `"JACCS"`, `"現金"`)

Include at least 3 refund records.

**Acceptance Criteria**:

- [ ] 10 records in array
- [ ] Mix of sale/refund types
- [ ] At least 3 negative amounts (refunds)
- [ ] Varied dates and methods

**Estimated Time**: 20 min

---

### Task 1.5: Add Mock Seed Data – Billing List

**File**: `src/app/api/_mock-db.ts`

**Description**: Add a constant array `MOCK_BILLING_LIST` with 8 seed records. Each record must have:

- `month`: format `"2026年4月"`
- `type`: mix of `"月次"` and `"都度"`
- `amount`: positive number (¥)
- `status`: distribute across all 4 statuses: `"pending"`, `"paid"`, `"uncollected"`, `"written-off"` (at least 1–2 of each)
- `billingDate`: format `"2026/04/01"`

At least 1 record with `status: "uncollected"` or `"written-off"` (for AC-15 testing).

**Acceptance Criteria**:

- [ ] 8 records in array
- [ ] At least 1–2 of each status represented
- [ ] Mix of monthly/oneTime types
- [ ] Dates are realistic

**Estimated Time**: 20 min

---

### Task 1.6: Add Mock Seed Data – Payment Summary Helper

**File**: `src/app/api/_mock-db.ts`

**Description**: Add a helper function to compute `PaymentSummary` from `MOCK_BILLING_LIST`:

- `currentMonthAmount`: sum of all `amount` where `month` is current month (2026年4月)
- `unpaidTotal`: sum of amounts where `status` is `"uncollected"` or `"written-off"`
- `lastPaymentDate`: most recent `billingDate` where `status` is `"paid"` (or `null`)
- `paymentMethod`: hardcoded for mock (e.g., `"SBPS"`)

Function signature: `getPaymentSummary(): PaymentSummary`

**Acceptance Criteria**:

- [ ] Function defined
- [ ] All four fields computed
- [ ] Returns `PaymentSummary` type
- [ ] Compiles without errors

**Estimated Time**: 15 min

---

## Phase 2: Backend – API Routes

### Task 2.1: Create Payment History Route

**File**: `src/app/api/crm/members/[id]/payment-history/route.ts` (new file, create directory if needed)

**Description**: Implement the GET handler:

1. Call `registerRoute()` with OpenAPI docs: method `get`, path `/crm/members/{id}/payment-history`, tags `['Members']`
2. Add three query parameters to the docs: `page` (default 1), `limit` (default 50), `period` and `type` as optional filters
3. Add response schemas for status 200 (GetPaymentHistoryResponseSchema), 404 (ErrorResponseSchema), 500 (ErrorResponseSchema)
4. Implement `GET` handler:
   - Parse and validate `?page`, `?limit`, `?period`, `?type` query params using Zod
   - Filter `MOCK_PAYMENT_HISTORY` by `period` and `type`
   - Apply pagination (slice records by page/limit)
   - Return paginated response: `{ items, total, page, limit }`
   - Return 400 on validation error, 404 if member not found (check member exists), 500 on server error

**Acceptance Criteria**:

- [ ] Directory created
- [ ] `registerRoute()` call includes all docs
- [ ] Query param validation via Zod
- [ ] Pagination logic correct
- [ ] Returns correct response shape
- [ ] Error handling (400/404/500) implemented
- [ ] Compiles without TypeScript errors

**Estimated Time**: 45 min

---

### Task 2.2: Create Billing List Route

**File**: `src/app/api/crm/members/[id]/billing/route.ts` (new file, create directory if needed)

**Description**: Implement the GET handler:

1. Call `registerRoute()` with OpenAPI docs: method `get`, path `/crm/members/{id}/billing`
2. Add two query parameters: `page`, `limit`
3. Add response schemas for 200 (GetBillingResponseSchema), 404, 500
4. Implement `GET` handler:
   - Parse and validate `?page`, `?limit` query params
   - Return paginated `MOCK_BILLING_LIST`
   - Return `{ items, total, page, limit }`
   - Error handling as above

**Acceptance Criteria**:

- [ ] Directory created
- [ ] `registerRoute()` call complete
- [ ] Query param validation
- [ ] Pagination logic correct
- [ ] Returns correct response shape
- [ ] Error handling (400/404/500)
- [ ] Compiles without TypeScript errors

**Estimated Time**: 35 min

---

### Task 2.3: Create Payment Summary Route

**File**: `src/app/api/crm/members/[id]/payment-summary/route.ts` (new file, create directory if needed)

**Description**: Implement the GET handler:

1. Call `registerRoute()` with OpenAPI docs: method `get`, path `/crm/members/{id}/payment-summary`
2. No query parameters
3. Add response schemas for 200 (PaymentSummarySchema), 404, 500
4. Implement `GET` handler:
   - Call `getPaymentSummary()` helper from mock DB
   - Return the computed summary object
   - Error handling (404 if member not found, 500 on error)

**Acceptance Criteria**:

- [ ] Directory created
- [ ] `registerRoute()` call complete
- [ ] Calls helper function
- [ ] Returns PaymentSummary object
- [ ] Error handling (404/500)
- [ ] Compiles without TypeScript errors

**Estimated Time**: 25 min

---

### Task 2.4: Generate OpenAPI Schema & Client Code

**Command**: `npm run generate-openapi && npm run generate-api`

**Description**: Regenerate TypeScript types and React Query option factories from the new routes.

**Location**: `src/lib/openapi.json`, `src/lib/api/types.gen.ts`, `src/lib/api/@tanstack/react-query.gen.ts`

**Acceptance Criteria**:

- [ ] Both commands execute successfully (no errors)
- [ ] New types appear in `types.gen.ts`: `GetPaymentHistoryResponse`, `GetBillingResponse`, `PaymentSummary`
- [ ] New option factories in `react-query.gen.ts`: `getCrmMembersByIdPaymentHistoryOptions`, `getCrmMembersByIdBillingOptions`, `getCrmMembersByIdPaymentSummaryOptions`
- [ ] No TypeScript errors in generated files

**Estimated Time**: 5 min (automated)

---

## Phase 3: Frontend – UI Components

### Task 3.1: Create Payment History Tab Shell

**File**: `src/app/(private)/members/[id]/_components/tabs/payment-history-tab/index.tsx` (new file, create directory)

**Description**: Implement the `PaymentHistoryTab` component:

1. Mark as `'use client'`
2. Accept props: `{ memberId: string }`
3. Declare local state (useState):
   - `paymentPeriod`: enum string, default `"all"`
   - `paymentType`: enum string, default `"all"`
   - `ledgerPage`: number, default `1`
   - `billingPage`: number, default `1`
4. Three independent `useQuery` calls:
   - `getCrmMembersByIdPaymentHistoryOptions({ path: { id: memberId }, query: { page: ledgerPage, limit: 50, period: paymentPeriod, type: paymentType } })`
   - `getCrmMembersByIdBillingOptions({ path: { id: memberId }, query: { page: billingPage, limit: 50 } })`
   - `getCrmMembersByIdPaymentSummaryOptions({ path: { id: memberId } })`
5. Render layout:
   - Outer `<div className="flex gap-4">`
   - Left column (60%): two cards (ledger + billing)
   - Right column (40%): one card (summary, sticky)
6. Render three cards as child components (import from sibling files)

**Acceptance Criteria**:

- [ ] Directory created
- [ ] `'use client'` directive
- [ ] All state variables declared
- [ ] All three queries execute
- [ ] Layout div with correct gap + column widths
- [ ] Cards imported and rendered
- [ ] Props passed down correctly
- [ ] Compiles without errors

**Estimated Time**: 30 min

---

### Task 3.2: Create Payment Ledger Card

**File**: `src/app/(private)/members/[id]/_components/tabs/payment-history-tab/payment-ledger-card.tsx` (new file)

**Description**: Implement `PaymentLedgerCard` component:

1. Props: `{ query result props (data, isLoading, isError, refetch), state (period, type, page), handlers (onPeriodChange, onTypeChange, onPageChange) }`
2. Wrap in `<DataStateBoundary>` with empty state `"入出金履歴はありません"`
3. Render `<Card>`:
   - `<CardHeader>`: title `"入出金明細"` + two `<Select>` dropdowns (period + type) to right
     - Period options: 全期間, 今月, 先月, 過去3ヶ月, 過去6ヶ月
     - Type options: 全種別, 売上, 返金
   - `<Table>` with columns: 日付 / 種別 / 内容 / 金額 / 決済方法
     - Date cell: format `YYYY/MM/DD`
     - Type cell: Badge (`variant="secondary"` for 返金, `default` for 売上)
     - Amount cell: format `¥9,900` or `-¥2,200`; negative → `className="text-destructive"`
     - Method cell: text
   - `<TablePagination>` at footer with current state + `onPageChange` callback

**Acceptance Criteria**:

- [ ] DataStateBoundary wrapping
- [ ] Card structure matches prototype
- [ ] Two Select dropdowns functional
- [ ] Table with all 5 columns
- [ ] Amount formatting correct (¥ symbol, locale string)
- [ ] Negative amounts in destructive color
- [ ] Type badges correct variant
- [ ] Pagination component integrated
- [ ] Compiles without errors

**Estimated Time**: 50 min

---

### Task 3.3: Create Billing List Card

**File**: `src/app/(private)/members/[id]/_components/tabs/payment-history-tab/billing-list-card.tsx` (new file)

**Description**: Implement `BillingListCard` component:

1. Props: `{ query result props (data, isLoading, isError, refetch), state (page), handlers (onPageChange) }`
2. Wrap in `<DataStateBoundary>` with empty state `"請求履歴はありません"`
3. Render `<Card>`:
   - `<CardHeader>`: title `"請求一覧"`
   - `<Table>` with columns: 請求月 / 請求種別 / 金額 / ステータス / 請求日
     - Month cell: text
     - Type cell: Badge (`variant="outline"` for 都度, `default` for 月次)
     - Amount cell: `¥` formatted, right-aligned
     - Status cell: use `<BillingStatusBadge>` component
     - Billing date cell: format `YYYY/MM/DD`
   - `<TablePagination>` at footer

**Acceptance Criteria**:

- [ ] DataStateBoundary wrapping
- [ ] Card structure correct
- [ ] Table with all 5 columns
- [ ] Type badges correct variant
- [ ] Amount formatting (¥ symbol, right-aligned)
- [ ] Status badge integration
- [ ] Pagination component integrated
- [ ] Compiles without errors

**Estimated Time**: 40 min

---

### Task 3.4: Create Billing Status Badge Component

**File**: `src/app/(private)/members/[id]/_components/tabs/payment-history-tab/billing-status-badge.tsx` (new file)

**Description**: Implement `BillingStatusBadge` component:

1. Props: `{ status: "pending" | "paid" | "uncollected" | "written-off" }`
2. Map status → Japanese label + CSS:
   - `pending` → 未確定, info color (blue)
   - `paid` → 入金済み, success color (green)
   - `uncollected` → 未回収, warning color (orange)
   - `written-off` → 貸倒, destructive color (red)
3. Render `<Badge variant="outline" className={statusClass}>` with label
4. Use `cn()` utility for className composition

**Acceptance Criteria**:

- [ ] All 4 status mappings defined
- [ ] Badge variant correct (outline)
- [ ] Color classes correct (using Tailwind semantic classes or CSS vars)
- [ ] Japanese labels accurate
- [ ] `cn()` used for className
- [ ] Compiles without errors

**Estimated Time**: 20 min

---

### Task 3.5: Create Payment Summary Card

**File**: `src/app/(private)/members/[id]/_components/tabs/payment-history-tab/payment-summary-card.tsx` (new file)

**Description**: Implement `PaymentSummaryCard` component:

1. Props: `{ data: PaymentSummary, isLoading: boolean, isError: boolean, refetch: () => void }`
2. Wrap in `<DataStateBoundary>` (empty state N/A for this endpoint)
3. Render sticky `<Card className="sticky top-6">`:
   - `<CardHeader>`: title `"支払いサマリー"`
   - `<CardContent>`:
     - Section 1: `今月請求額` (large bold amount)
     - Divider (`border-t`)
     - Section 2: three rows:
       - `未回収合計`: value in `text-destructive` if > 0, else normal; right-aligned
       - `最終入金日`: display date or `"-"` if null
       - `決済方法`: with `CreditCard` icon from lucide-react

**Acceptance Criteria**:

- [ ] Sticky positioning correct (`top-6`)
- [ ] Current month amount displayed large + bold
- [ ] Unpaid total: destructive color if > 0
- [ ] Last payment date: null → `"-"`
- [ ] CreditCard icon rendered
- [ ] All three rows right-aligned properly
- [ ] Compiles without errors

**Estimated Time**: 30 min

---

### Task 3.6: Integrate Payment History Tab into MemberDetailPage

**File**: `src/app/(private)/members/[id]/page.tsx`

**Description**:

1. Add import: `import { PaymentHistoryTab } from './_components/tabs/payment-history-tab';`
2. Add `<TabsTrigger value="payment">支払い履歴</TabsTrigger>` in the `<TabsList>` after `contracts` trigger
3. Add `<TabsContent value="payment"><PaymentHistoryTab memberId={memberId} /></TabsContent>` in the `<ScrollArea>` after contracts content

**Acceptance Criteria**:

- [ ] Import added
- [ ] TabsTrigger in correct position (after contracts, before points)
- [ ] TabsContent with correct props
- [ ] File compiles without TypeScript errors
- [ ] Dev server starts without errors

**Estimated Time**: 15 min

---

## Phase 4: Testing & Validation

### Task 4.0: (Meta) Run Dev Server & Verify No Errors

**Command**: `npm run dev`

**Description**: Start the development server and verify:

- No TypeScript errors in terminal
- No runtime errors in browser console
- Member detail page loads

**Acceptance Criteria**:

- [ ] Dev server starts successfully
- [ ] No terminal errors (TypeScript or runtime)
- [ ] Browser console clean
- [ ] Member detail page accessible at `/members/[id]`

**Estimated Time**: 5 min

---

## Summary

| Phase                           | Task Count   | Estimated Time |
| ------------------------------- | ------------ | -------------- |
| 1: Backend – Schema & Mock Data | 6 tasks      | 1h 35m         |
| 2: Backend – API Routes         | 4 tasks      | 1h 50m         |
| 3: Frontend – UI Components     | 6 tasks      | 3h 05m         |
| **Total**                       | **16 tasks** | **~6h 30m**    |

---

## Handoff

> Tasks complete. Please review and approve, then trigger the next step:
>
> **"Follow instructions in speckit.implement.prompt.md"**
