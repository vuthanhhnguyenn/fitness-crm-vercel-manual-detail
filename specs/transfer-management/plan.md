# Technical Plan: A-02 FR-001 — 移籍管理一覧

**Spec**: `specs/transfer-management/spec.md`
**Status**: Draft
**Created**: 2026-04-24
**Branch**: `feat/implement-prototype` (no new branch)

---

## 1. Scope Summary

Implement the Transfer Management List screen (`/members/transfers`) with:

- Paginated `<DataTable>` — 8 columns
- Quick search + 5-filter expandable bar (all state in URL via `nuqs`)
- `GET /crm/transfers` API route (mock DB, Zod schema, OpenAPI registration)
- Stub detail page at `/members/transfers/[id]`
- Sidebar `会員管理` sub-item un-commented and pointed at `/members/transfers`
- Route registration in `routes.config.ts` + `routes.util.ts`

---

## 2. Architecture Overview

The implementation follows the established Members list pattern exactly:

```
nuqs useQueryStates
  └─→ useTransferFilters (hook)
        └─→ TransferFiltersContext (provider)
              ├─→ TransferFilters component (toolbar + filter bar)
              └─→ page.tsx
                    └─→ getCrmTransfersOptions (React Query, generated)
                          └─→ GET /crm/transfers (Next.js route)
                                └─→ db.transfers (mock DB)
```

---

## 3. File Change Plan

### 3.1 New files

| File                                                                         | Purpose                               |
| ---------------------------------------------------------------------------- | ------------------------------------- |
| `src/types/transfer.type.ts`                                                 | `TransferStatus` enum                 |
| `src/app/api/_schemas/transfer.schema.ts`                                    | Zod schemas (query, response, entity) |
| `src/app/api/crm/transfers/route.ts`                                         | `GET /crm/transfers` handler          |
| `src/app/(private)/members/transfers/page.tsx`                               | List page (`'use client'`)            |
| `src/app/(private)/members/transfers/[id]/page.tsx`                          | Stub detail page                      |
| `src/app/(private)/members/transfers/_components/transfer-table-columns.tsx` | `ColumnDef[]`                         |
| `src/app/(private)/members/transfers/_components/transfer-filters.tsx`       | Toolbar + filter bar                  |
| `src/app/(private)/members/transfers/_contexts/transfer-filters-context.tsx` | Context + provider                    |
| `src/app/(private)/members/transfers/_hooks/use-transfer-filters.ts`         | nuqs state hook                       |

### 3.2 Modified files

| File                                    | Change                                                                |
| --------------------------------------- | --------------------------------------------------------------------- |
| `src/app/api/_mock-db.ts`               | Add `TRANSFER_MOCK_DATA` array (10 seed rows) + export `db.transfers` |
| `src/app/api/_routes/index.ts`          | Add `import '@/app/api/crm/transfers/route'`                          |
| `src/components/layout/app-sidebar.tsx` | Un-comment `会員管理` subItems; change href to `/members/transfers`   |
| `src/lib/routes/routes.config.ts`       | Add `/members/transfers` and `/members/transfers/[id]` routes         |

> **Note**: `src/lib/routes/routes.config.ts` is labelled "auto-generated" but is edited manually per project convention (no generator script exists for it). This file must be updated to enable type-safe `navigate()` calls.

---

## 4. Data Model

### 4.1 `TransferStatus` enum — `src/types/transfer.type.ts`

```ts
export enum TransferStatus {
  Pending = 'pending', // 申請中
  FromStoreApproved = 'from_store_approved', // 店舗承認済
  Approved = 'approved', // 承認済
  Rejected = 'rejected', // 却下
  Completed = 'completed', // 移籍完了
}
```

### 4.2 Zod schema — `src/app/api/_schemas/transfer.schema.ts`

**Entity schema** (`TransferRequestSchema`):

```
id, member_id, member_name,
from_store_id, from_store_name,
to_store_id, to_store_name,
brand: z.enum(['joyfit', 'fit365']),
applied_at: z.string(),          // ISO 8601
scheduled_date: z.string(),      // ISO 8601
status: z.nativeEnum(TransferStatus)
```

**Query schema** (`GetTransfersQuerySchema`):

```
page, limit, search, status, from_store_id, to_store_id,
brand, applied_period: z.enum(['this_month','last_month','this_year']).optional(),
sort_by (default: 'applied_at'), sort_order (default: 'desc')
```

**Response schema** (`GetTransfersResponseSchema`):

```json
{ "transfers": TransferRequest[], "pagination": { page, limit, total, total_pages } }
```

---

## 5. API Route

### `GET /crm/transfers` — `src/app/api/crm/transfers/route.ts`

**Pattern**: identical to `crm/members/route.ts` — `registerRoute()` first, then `export async function GET`.

**Handler logic**:

1. Parse query with `GetTransfersQuerySchema.safeParse(queryObj)` → 400 on failure
2. Filter `db.transfers` in-memory:
   - `search` → case-insensitive match on `id` OR `member_name`
   - `status` → exact enum match
   - `from_store_id` / `to_store_id` → exact match
   - `brand` → exact match (`"joyfit"` | `"fit365"`)
   - `applied_period` → compare `applied_at` date:
     - `this_month`: same year + month as `new Date()`
     - `last_month`: previous month
     - `this_year`: same year
3. Sort by `sort_by` field, `sort_order` direction
4. Paginate with `page` / `limit` (default 20)
5. Return `{ transfers, pagination }` with status 200

**OpenAPI tags**: `['Transfers']`

---

## 6. Mock DB Seed

Add to `src/app/api/_mock-db.ts`:

```ts
export const TRANSFER_MOCK_DATA: TransferListItem[] = [
  // 10 rows covering all 5 statuses, both brands, various stores
  // applied_at dates spanning this_month / last_month / this_year / older
];
```

Export via the existing `db` object: `db.transfers = TRANSFER_MOCK_DATA`.

Seed breakdown (10 rows):

- 2× `pending` (JOYFIT + FIT365)
- 2× `from_store_approved` (both brands)
- 2× `approved`
- 2× `rejected`
- 2× `completed`

Date coverage: 4 rows `this_month`, 2 rows `last_month`, 2 rows `this_year` (not this month), 2 rows prior year.

---

## 7. Frontend Components

### 7.1 `use-transfer-filters.ts`

Mirrors `use-members-filters.ts`. State managed via `nuqs useQueryStates`:

| Param            | nuqs parser                                                  | Default        |
| ---------------- | ------------------------------------------------------------ | -------------- |
| `page`           | `parseAsInteger`                                             | `1`            |
| `search`         | `parseAsString`                                              | `''`           |
| `status`         | `parseAsStringEnum(TransferStatus values)`                   | `null`         |
| `from_store_id`  | `parseAsString`                                              | `null`         |
| `to_store_id`    | `parseAsString`                                              | `null`         |
| `brand`          | `parseAsStringEnum(['joyfit','fit365'])`                     | `null`         |
| `applied_period` | `parseAsStringEnum(['this_month','last_month','this_year'])` | `null`         |
| `sort_by`        | `parseAsString`                                              | `'applied_at'` |
| `sort_order`     | `parseAsStringEnum(['asc','desc'])`                          | `'desc'`       |

Exports: `filters`, `setFilters`, `searchInput`, `setSearchInput`, `updateFilter`, `clearFilters`, `hasActiveFilters`, `activeFilterCount`, `queryParams`, `currentPage`, `setCurrentPage`, `pageSize`.

Search input is **debounced 500 ms** before writing to URL (same pattern as members).

### 7.2 `transfer-filters-context.tsx`

Thin context wrapper — identical pattern to `members-filters-context.tsx`.

### 7.3 `transfer-filters.tsx`

- Top row: `<Input>` (search, max-w-[400px]) + `詳細フィルター` `<Button>` with active-count `<Badge>`
- Expandable row (5 `<Select>` controls, h-8 text-xs):
  1. ステータス (全ステータス / 申請中 / 店舗承認済 / 承認済 / 却下 / 移籍完了)
  2. 移籍元店舗 (全店舗（移籍元）/ store list)
  3. 移籍先店舗 (全店舗（移籍先）/ store list)
  4. ブランド (全ブランド / JOYFIT / FIT365)
  5. 申請日 (全期間 / 今月 / 先月 / 今年)
  6. `すべてクリア` ghost button (ml-auto)

Store options: use mock store list from `db.stores` (same stores as members). No dedicated `/crm/transfers/stores` endpoint needed.

### 7.4 `transfer-table-columns.tsx`

Returns `ColumnDef<TransferListItem>[]`:

| #   | `accessorKey`     | Header     | Notes                                         |
| --- | ----------------- | ---------- | --------------------------------------------- |
| 1   | `id`              | 申請ID     | `font-mono text-xs text-muted-foreground`     |
| 2   | `member_name`     | 会員名     | `font-medium`                                 |
| 3   | `from_store_name` | 移籍元店舗 | `text-xs`                                     |
| 4   | `to_store_name`   | 移籍先店舗 | `text-xs`                                     |
| 5   | `applied_at`      | 申請日     | `format(parseISO(v), 'yyyy/MM/dd')`           |
| 6   | `scheduled_date`  | 移籍予定日 | `format(parseISO(v), 'yyyy/MM/dd')`           |
| 7   | `status`          | ステータス | Badge (see colour map below)                  |
| 8   | (actions)         | —          | `<DropdownMenu>` with `詳細を表示` + Eye icon |

**Status badge colour map** (from spec):

| Value                 | `variant`   | Extra classes                                                                     |
| --------------------- | ----------- | --------------------------------------------------------------------------------- |
| `pending`             | `outline`   | `bg-info/15 text-info border-info/20` + dot `bg-info`                             |
| `from_store_approved` | `outline`   | `bg-warning/15 text-warning border-warning/20` + dot `bg-warning`                 |
| `approved`            | `outline`   | `bg-success/15 text-success border-success/20` + dot `bg-success`                 |
| `rejected`            | `outline`   | `bg-destructive/15 text-destructive border-destructive/20` + dot `bg-destructive` |
| `completed`           | `secondary` | (default muted, no dot)                                                           |

Row click → `router.push(navigate('/members/transfers/[id]', row.id))`.
`詳細を表示` DropdownMenuItem → same navigation.

### 7.5 `page.tsx` (list)

Structure mirrors `members/page.tsx`:

```tsx
'use client';
function TransferListPageContent() {
  const filtersHook = useTransferFilters();
  // query via getCrmTransfersOptions(queryParams)
  // render: page header (h1 + total Badge) + Card(TransferFilters + DataTable + TablePagination)
}
export default function TransferListPage() {
  return (
    <TransferFiltersProvider value={filtersHook}>
      <Suspense>
        <TransferListPageContent />
      </Suspense>
    </TransferFiltersProvider>
  );
}
```

**Page header**: `h1: 移籍管理` + `<Badge>N件</Badge>`

Uses existing `<DataTable variant="simple">` + `<TablePagination>` components.

### 7.6 `transfers/[id]/page.tsx` (stub detail)

Minimal stub — no data fetch required:

```tsx
'use client';
// BreadcrumbNav: ホーム > 移籍管理 > [id]
// Card with "この画面は現在準備中です。" message
// Button: ← 移籍管理一覧 に戻る → navigate('/members/transfers')
```

---

## 8. Route Registration

### `routes.config.ts` additions

```ts
'/members/transfers': {
  router: '/members/transfers',
  filePath: '(private)/members/transfers',
  pattern: '/members/transfers',
  private: true,
},
'/members/transfers/[id]': {
  router: (id: string | number) => `/members/transfers/${id}`,
  filePath: '(private)/members/transfers/[id]',
  pattern: '/members/transfers/:id',
  private: true,
},
```

---

## 9. Sidebar Change

In `app-sidebar.tsx`, replace the commented-out `会員管理` subItems block:

```tsx
// BEFORE (commented out):
// subItems: [
//   { label: '移籍', href: '/members/transfer' },
//   { label: '休会・退会', href: '/members/leave-withdrawal' },
// ],

// AFTER (active):
subItems: [
  { label: '移籍', href: '/members/transfers' },
],
```

Note: `休会・退会` remains commented out (not in scope).

---

## 10. OpenAPI & Client Codegen

After the route is implemented:

```bash
npm run generate-openapi   # rebuilds src/lib/openapi.json
npm run generate-api       # regenerates src/lib/api/types.gen.ts + @tanstack/react-query.gen.ts
```

The generated `getCrmTransfersOptions` factory will be consumed by `page.tsx`.

---

## 11. Permissions / Access Control

Server-side filtering in the route handler:

- Read user role from auth context (cookie/header — same pattern as other routes)
- `Trainer` → return 403
- `Staff` → filter `db.transfers` to rows where `from_store_id` or `to_store_id` equals the staff's `store_id`
- `Manager` → filter to rows where store belongs to the manager's branch
- `Headquarter` / `Observer` → no filter (all rows)

Client does not implement role checks — relies entirely on API scope.

---

## 12. UI Prototype Registry Update

| Branch                          | Screen name  | UI slug         | Cache path                                          | Spec IDs    |
| ------------------------------- | ------------ | --------------- | --------------------------------------------------- | ----------- |
| `feat/transfer-management-list` | 移籍管理一覧 | `transfer-list` | `.cache/fitness-crm-ui/src/pages/transfer-list.tsx` | A-02 FR-001 |

---

## 13. Excluded from this plan

- FR-002: 承認・否認操作 (approval/denial actions)
- FR-003: JOYFIT自動移籍フロー
- Notification / email flows
- Export / download functionality
- Custom date-range picker for 申請日 filter

---

## Handoff to `speckit.tasks`

All architectural decisions are complete. Ready for task breakdown.
