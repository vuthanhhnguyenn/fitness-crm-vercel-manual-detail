# Task List: A-02 FR-001 — 移籍管理一覧

**Spec**: `specs/transfer-management/spec.md`  
**Plan**: `specs/transfer-management/plan.md`  
**Status**: ✅ Implemented — 2026-04-24  
**Created**: 2026-04-24

---

## Execution Sequence

Tasks are ordered to enable incremental testing at each stage:

1. **Types & schemas** (foundational)
2. **API route & mock DB** (backend ready)
3. **Route registration** (enable codegen)
4. **Codegen & client setup** (frontend ready)
5. **Frontend components** (list page)
6. **Sidebar navigation** (UI polishing)
7. **Stub detail page** (routing complete)

---

## Task 1: Create TransferStatus enum

**File**: `src/types/transfer.type.ts` (new)

**Subtasks**:

- [ ] Create file with TypeScript `enum TransferStatus`
- [ ] Export 5 values:
  - `Pending = 'pending'` (申請中)
  - `FromStoreApproved = 'from_store_approved'` (店舗承認済)
  - `Approved = 'approved'` (承認済)
  - `Rejected = 'rejected'` (却下)
  - `Completed = 'completed'` (移籍完了)

**Definition**:

```ts
export enum TransferStatus {
  Pending = 'pending',
  FromStoreApproved = 'from_store_approved',
  Approved = 'approved',
  Rejected = 'rejected',
  Completed = 'completed',
}
```

**Acceptance**: Enum exports correctly; can import in schema and test files.

---

## Task 2: Create transfer Zod schemas

**File**: `src/app/api/_schemas/transfer.schema.ts` (new)

**Subtasks**:

- [ ] Import `extendZodWithOpenApi`, `z`, and `TransferStatus` enum
- [ ] Create `TransferStatusSchema = z.nativeEnum(TransferStatus)`
- [ ] Create `TransferRequestSchema` (entity):
  - `id` (string), `member_id` (string), `member_name` (string)
  - `from_store_id` (string), `from_store_name` (string)
  - `to_store_id` (string), `to_store_name` (string)
  - `brand` (enum: 'joyfit' | 'fit365')
  - `applied_at` (ISO 8601 string), `scheduled_date` (ISO 8601 string)
  - `status` (TransferStatusSchema)
  - Add `.openapi()` metadata
- [ ] Create `GetTransfersQuerySchema` with optional params:
  - `page` (integer, default 1)
  - `limit` (integer, default 20)
  - `search` (string, optional)
  - `status` (enum, optional)
  - `from_store_id` (string, optional)
  - `to_store_id` (string, optional)
  - `brand` (enum, optional)
  - `applied_period` (enum: 'this_month' | 'last_month' | 'this_year', optional)
  - `sort_by` (string, default 'applied_at')
  - `sort_order` (enum: 'asc' | 'desc', default 'desc')
- [ ] Create `PaginationSchema` (page, limit, total, total_pages)
- [ ] Create `GetTransfersResponseSchema = { transfers: TransferRequest[], pagination: Pagination }`
- [ ] Export all schemas and inferred types (e.g., `type GetTransfersQuery = z.infer<...>`)

**Acceptance**: All schemas compile; can validate query objects; response type is exported.

---

## Task 3: Seed mock database with transfer data

**File**: `src/app/api/_mock-db.ts` (modified)

**Subtasks**:

- [ ] Create `TRANSFER_MOCK_DATA` array with 10 rows:
  - 2 rows: `status='pending'` (JOYFIT + FIT365)
  - 2 rows: `status='from_store_approved'`
  - 2 rows: `status='approved'`
  - 2 rows: `status='rejected'`
  - 2 rows: `status='completed'`
- [ ] Date distribution: 4 rows this month, 2 last month, 2 this year (not this month), 2 prior year
- [ ] Store pairs from existing `db.stores` (use JOYFIT/FIT365 prefixed store names)
- [ ] member_name: realistic Japanese names (varied)
- [ ] Export via `db.transfers = TRANSFER_MOCK_DATA`

**Sample data template**:

```ts
export const TRANSFER_MOCK_DATA: TransferListItem[] = [
  {
    id: 'TR-001',
    member_id: 'M-12345',
    member_name: '山田 太郎',
    from_store_id: 'store-001',
    from_store_name: 'JOYFIT池袋店',
    to_store_id: 'store-002',
    to_store_name: 'JOYFIT新宿店',
    brand: 'joyfit',
    applied_at: '2026-04-15T10:30:00Z',
    scheduled_date: '2026-05-01T00:00:00Z',
    status: TransferStatus.Pending,
  },
  // … 9 more rows
];
```

**Acceptance**: `db.transfers` is accessible; data passes Zod validation; date/status distribution is correct.

---

## Task 4: Implement GET /crm/transfers API route

**File**: `src/app/api/crm/transfers/route.ts` (new)

**Subtasks**:

- [ ] Copy structure from `members/route.ts` as template
- [ ] Register route via `registerRoute()` with OpenAPI tags `['Transfers']`
- [ ] Implement `export async function GET(request: NextRequest)`:
  1. Parse query with `GetTransfersQuerySchema.safeParse()` → 400 on error
  2. Extract `page`, `limit`, `search`, `status`, `from_store_id`, `to_store_id`, `brand`, `applied_period`, `sort_by`, `sort_order`
  3. Read auth context (role) from request headers/cookies
  4. Filter `db.transfers`:
     - `search`: case-insensitive match on `id` OR `member_name`
     - `status`: exact enum match (if set)
     - `from_store_id`: exact match (if set)
     - `to_store_id`: exact match (if set)
     - `brand`: exact match (if set)
     - `applied_period`: date range filter on `applied_at`:
       - `'this_month'`: same year + month as today
       - `'last_month'`: previous month
       - `'this_year'`: same year
     - Role-based filtering: `Staff` → only own store; `Manager` → only branch stores; others unrestricted
  5. Sort by `sort_by` field; apply `sort_order` direction
  6. Paginate: skip `(page - 1) * limit`, take `limit` items
  7. Calculate `total_pages = Math.ceil(total / limit)`
  8. Return `{ transfers: filtered[], pagination: { page, limit, total, total_pages } }` with 200

**Acceptance**: Route responds to GET requests; query validation works; filtering/sorting/pagination correct; returns proper shape.

---

## Task 5: Register GET /crm/transfers in route imports

**File**: `src/app/api/_routes/index.ts` (modified)

**Subtasks**:

- [ ] Add import statement: `import '@/app/api/crm/transfers/route'`
- [ ] Place it alphabetically in the members section (near other crm/members imports)

**Acceptance**: File compiles; import is in correct location.

---

## Task 6: Register routes in routes.config.ts

**File**: `src/lib/routes/routes.config.ts` (modified)

**Subtasks**:

- [ ] Add entry for `/members/transfers`:
  ```ts
  '/members/transfers': {
    router: '/members/transfers',
    filePath: '(private)/members/transfers',
    pattern: '/members/transfers',
    private: true,
  },
  ```
- [ ] Add entry for `/members/transfers/[id]`:
  ```ts
  '/members/transfers/[id]': {
    router: (id: string | number) => `/members/transfers/${id}`,
    filePath: '(private)/members/transfers/[id]',
    pattern: '/members/transfers/:id',
    private: true,
  },
  ```
- [ ] Insert alphabetically in the config object

**Acceptance**: Both routes compile; no TypeScript errors in routes.util.ts.

---

## Task 7: Run OpenAPI & codegen

**Terminal command**:

```bash
npm run generate-openapi && npm run generate-api
```

**Subtasks**:

- [ ] Execute command
- [ ] Verify no errors in output
- [ ] Check that `src/lib/api/types.gen.ts` includes `GetTransfersQuery`, `GetTransfersResponse`, `TransferRequest` types
- [ ] Check that `src/lib/api/@tanstack/react-query.gen.ts` exports `getCrmTransfersOptions` factory

**Acceptance**: Codegen completes without errors; generated types are valid; React Query factory exists.

---

## Task 8: Create transfer filters hook

**File**: `src/app/(private)/members/transfers/_hooks/use-transfer-filters.ts` (new)

**Subtasks**:

- [ ] Copy `use-members-filters.ts` as template
- [ ] Define `TransferFilters` type with fields:
  - `page`, `search`, `status`, `from_store_id`, `to_store_id`, `brand`, `applied_period`, `sort_by`, `sort_order`
- [ ] Initialize `useQueryStates()` with `nuqs` parsers:
  - `page`: `parseAsInteger.withDefault(1)`
  - `search`: `parseAsString.withDefault('')`
  - `status`: `parseAsStringEnum(TransferStatus values).withDefault(null)`
  - `from_store_id`: `parseAsString.withDefault(null)`
  - `to_store_id`: `parseAsString.withDefault(null)`
  - `brand`: `parseAsStringEnum(['joyfit','fit365']).withDefault(null)`
  - `applied_period`: `parseAsStringEnum(['this_month','last_month','this_year']).withDefault(null)`
  - `sort_by`: `parseAsString.withDefault('applied_at')`
  - `sort_order`: `parseAsStringEnum(['asc','desc']).withDefault('desc')`
- [ ] Implement search debounce (500 ms) on `searchInput` → `filters.search`
- [ ] Export: `filters`, `setFilters`, `searchInput`, `setSearchInput`, `updateFilter`, `clearFilters`, `hasActiveFilters`, `activeFilterCount`, `queryParams`, `currentPage`, `setCurrentPage`, `pageSize`
- [ ] `updateFilter` should reset `page` to 1 when filter changes (except `sort_*` and `page`)

**Acceptance**: Hook compiles; nuqs state persists to URL on mount/update; search debounce works; `clearFilters` resets all to defaults.

---

## Task 9: Create transfer filters context

**File**: `src/app/(private)/members/transfers/_contexts/transfer-filters-context.tsx` (new)

**Subtasks**:

- [ ] Create context: `TransferFiltersContext = createContext<ReturnType<typeof useTransferFilters> | undefined>()`
- [ ] Implement `TransferFiltersProvider` component accepting `children` and `value`
- [ ] Export `useTransferFiltersContext()` hook with error handling

**Acceptance**: Context/provider/hook compile; no TypeScript errors.

---

## Task 10: Create transfer-table-columns.tsx

**File**: `src/app/(private)/members/transfers/_components/transfer-table-columns.tsx` (new)

**Subtasks**:

- [ ] Import `ColumnDef`, `TransferRequest`, `Button`, `Badge`, `DropdownMenu`, `format`, `parseISO`, `navigate`
- [ ] Create `ColumnDef<TransferRequest>[]` with 8 columns:
  1. `id` (申請ID): accessor `id`, className `font-mono text-xs text-muted-foreground`
  2. `member_name` (会員名): accessor `member_name`, className `font-medium`
  3. `from_store_name` (移籍元店舗): accessor `from_store_name`, className `text-xs`
  4. `to_store_name` (移籍先店舗): accessor `to_store_name`, className `text-xs`
  5. `applied_at` (申請日): cell formatter `format(parseISO(v), 'yyyy/MM/dd')`, className `text-xs text-muted-foreground`
  6. `scheduled_date` (移籍予定日): cell formatter `format(parseISO(v), 'yyyy/MM/dd')`, className `text-xs`
  7. `status` (ステータス): render status `<Badge>` with colour mapping:
     - `pending` → `variant="outline"` + `bg-info/15 text-info border-info/20` + dot
     - `from_store_approved` → `variant="outline"` + `bg-warning/15 text-warning border-warning/20` + dot
     - `approved` → `variant="outline"` + `bg-success/15 text-success border-success/20` + dot
     - `rejected` → `variant="outline"` + `bg-destructive/15 text-destructive border-destructive/20` + dot
     - `completed` → `variant="secondary"` + (no dot)
  8. Actions: `<DropdownMenu>` with `詳細を表示` item (Eye icon) → `navigate('/members/transfers/[id]', row.id)`
- [ ] Row click event: `onClick={() => navigate('/members/transfers/[id]', row.id)}`

**Acceptance**: All 8 columns render correctly; status badges display with proper colours; row click and dropdown both navigate to detail page.

---

## Task 11: Create transfer-filters.tsx component

**File**: `src/app/(private)/members/transfers/_components/transfer-filters.tsx` (new)

**Subtasks**:

- [ ] Add `'use client'` directive
- [ ] Import: icons (Search, SlidersHorizontal, ChevronUp, ChevronDown), UI components (Badge, Button, Input, Select, etc.)
- [ ] Get stores from `db.stores` (or mock list) for dropdown options
- [ ] Create toolbar row:
  - [ ] Search `<Input>` (max-w-[400px], placeholder: `申請ID・会員名で検索`)
  - [ ] `詳細フィルター` `<Button>` (size sm, h-8 text-xs, toggle `isFilterOpen`)
  - [ ] Show `<Badge>` with active filter count if > 0; change button variant to `default` when active
- [ ] Create expandable filter bar (shown when `isFilterOpen`):
  - [ ] ステータス `<Select>` (options: 全ステータス + 5 status values)
  - [ ] 移籍元店舗 `<Select>` (options: 全店舗（移籍元） + store list)
  - [ ] 移籍先店舗 `<Select>` (options: 全店舗（移籍先） + store list)
  - [ ] ブランド `<Select>` (options: 全ブランド, JOYFIT, FIT365)
  - [ ] 申請日 `<Select>` (options: 全期間, 今月, 先月, 今年)
  - [ ] `すべてクリア` `<Button>` (ml-auto, ghost variant, size sm, h-8 text-xs)
- [ ] All selects have h-8 text-xs className
- [ ] Apply `filterActiveClass()` styling when filter differs from default

**Acceptance**: Filters render correctly; `詳細フィルター` expands/collapses bar; active count badge shows; `すべてクリア` resets all filters to defaults.

---

## Task 12: Create transfer list page

**File**: `src/app/(private)/members/transfers/page.tsx` (new)

**Subtasks**:

- [ ] Add `'use client'` directive
- [ ] Import necessary hooks, components, and API factories
- [ ] Create `TransferListPageContent()` component:
  - [ ] Initialize `useTransferFilters()` hook
  - [ ] Query: `getCrmTransfersOptions(queryParams)` via React Query
  - [ ] Render:
    - [ ] Page header: `<h1>移籍管理</h1>` + `<Badge>{total}件</Badge>`
    - [ ] `<Card>` with:
      - [ ] `<TransferFilters>` component
      - [ ] `<DataTable>` with columns from `transfer-table-columns.tsx`
      - [ ] Empty state: "該当のデータがありません。" with optional `条件をクリア` button
      - [ ] `<TablePagination>` (page / limit controls at bottom)
  - [ ] Row click handler → `navigate('/members/transfers/[id]', id)`
- [ ] Wrap in `<Suspense>` with fallback
- [ ] Create default export `TransferListPage()` that wraps content in `<TransferFiltersProvider>`

**Acceptance**: Page loads without errors; data displays in table; filters work (update URL params); pagination controls functional; row click navigates to detail.

---

## Task 13: Create stub transfer detail page

**File**: `src/app/(private)/members/transfers/[id]/page.tsx` (new)

**Subtasks**:

- [ ] Add `'use client'` directive
- [ ] Import: `useParams`, `useRouter`, `BreadcrumbNav`, `Card`, `Button`, `navigate`
- [ ] Extract `id` from `useParams()`
- [ ] Render:
  - [ ] `<BreadcrumbNav>` items: ホーム → 移籍管理 → `[id]`
  - [ ] `<Card>` with:
    - [ ] Heading: "詳細ページ準備中"
    - [ ] Message: "この機能の詳細ページはまだ準備中です。"
    - [ ] `<Button>` "← 移籍管理一覧に戻る" → `navigate('/members/transfers')`

**Acceptance**: Page loads; breadcrumb renders; "準備中" message visible; back button navigates to list.

---

## Task 14: Uncomment sidebar navigation item

**File**: `src/components/layout/app-sidebar.tsx` (modified)

**Subtasks**:

- [ ] Locate the `会員管理` menu item (has commented `subItems`)
- [ ] Uncomment and update the `subItems` block:
  ```tsx
  subItems: [
    {
      label: '移籍',
      href: '/members/transfers',
    },
  ],
  ```
- [ ] Ensure `休会・退会` and other items remain commented

**Acceptance**: Sidebar renders; `会員管理` expands to show `移籍` sub-item; clicking navigates to `/members/transfers`.

---

## Task 15: Verify all files created and tests passing

**Terminal commands**:

```bash
npm run type-check    # TypeScript check
npm run lint          # ESLint + Prettier
```

**Subtasks**:

- [ ] Type-check passes with no errors
- [ ] Lint passes with no errors
- [ ] All 13 new files exist in expected locations
- [ ] 4 modified files have proper syntax
- [ ] `npm run dev` starts without errors (optional: verify in browser at `http://localhost:3000/members/transfers`)

**Acceptance**: All checks pass; dev server runs; transfer list page loads.

---

## Summary

**Total tasks**: 15  
**New files**: 9  
**Modified files**: 4  
**Estimated lines of code**: ~1,500 (schemas + API route + 6 components + 2 pages)

**Breakdown by category**:

- **Type system** (Tasks 1–2): 50 lines
- **Backend** (Tasks 3–5): 350 lines
- **Codegen** (Task 6–7): automatic
- **Frontend hooks** (Tasks 8–9): 200 lines
- **Components** (Tasks 10–13): 900 lines
- **Navigation** (Task 14): 5 lines
- **Verification** (Task 15): automated

---

## Handoff to `speckit.implement`

Ready for implementation. All tasks are concrete, testable, and ordered for incremental development.

> `@speckit.implement` — Please execute the task list starting from **Task 1** and proceeding sequentially through **Task 15**.
