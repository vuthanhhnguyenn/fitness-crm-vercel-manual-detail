# Blacklist Management — Task List

> **Plan**: `specs/blacklist-management/plan.md`
> **Spec**: `specs/blacklist-management/spec.md`
> **Branch**: `feature/blacklist-list`
> **Created**: 2026-05-07

---

## TASK-01 — Zod schema + TypeScript enums

**File**: `src/app/api/_schemas/blacklist.schema.ts` _(new)_

- [ ] Create file with `extendZodWithOpenApi(z)` header
- [ ] Define `BlacklistRegistrationSourceSchema = z.enum(['forced_withdrawal', 'manual'])`
- [ ] Define `BlacklistManualReasonSchema = z.enum(['nuisance', 'unpaid', 'fraudulent_use', 'other'])`
- [ ] Define `UnpaidFilterSchema = z.enum(['has_debt', 'no_debt'])`
- [ ] Define `BlacklistItemSchema` (id, memberId, memberName, storeName, registrationSource, manualReason nullable, unpaidAmount, registeredAt, memo nullable)
- [ ] Define `GetBlacklistQuerySchema` (search, reason, unpaid, page, limit with `.coerce`)
- [ ] Define `GetBlacklistResponseSchema` ({ blacklist: array, pagination })
- [ ] Define `PostBlacklistBodySchema` (memberId, memberName, reason, memo optional)
- [ ] Define `PostBlacklistResponseSchema` ({ blacklist: single item })
- [ ] Define `ErrorResponseSchema` (reuse pattern from `staff.schema.ts`)
- [ ] Export TypeScript enums: `BlacklistRegistrationSource`, `BlacklistManualReason`, `UnpaidFilter`
- [ ] Export inferred types: `BlacklistRow`, `GetBlacklistQuery`, `GetBlacklistResponse`, `PostBlacklistBody`, `PostBlacklistResponse`

---

## TASK-02 — Mock DB: `memberBlacklist` in `DbType` + `db`

**File**: `src/app/api/_mock-db.ts` _(modify)_

- [ ] Add import of `BlacklistRow` from `blacklist.schema.ts`
- [ ] Add `memberBlacklist` block to `DbType` type declaration:
  ```ts
  memberBlacklist: {
    _rows: BlacklistRow[];
    _seeded: boolean;
    _seed(): void;
    getList(): BlacklistRow[];
    getById(id: string): BlacklistRow | undefined;
    create(input: Omit<BlacklistRow, 'id' | 'registeredAt'>): BlacklistRow;
  };
  ```
- [ ] Implement `memberBlacklist` object inside `createDb()` after `memberLeaves`:
  - `_seed()` calls `db.members._seed()` first (same pattern as `memberLeaves`)
  - Filters `db.members._members` for `MemberStatus.FORCE_WITHDRAWN` → `registrationSource: 'forced_withdrawal'` rows, `manualReason: null`, `unpaidAmount` varied deterministically
  - Filters `db.members._members` for `MemberStatus.WITHDRAWN` (first 5) → `registrationSource: 'manual'`, `manualReason` cycled via `i % manualReasons.length`
  - IDs: `BL-FW-001…` for forced, `BL-MN-001…` for manual
  - `getList()`, `getById()`, `create()` accessors with `_seed()` guard

---

## TASK-03 — API route: `GET` + `POST /crm/blacklist`

**File**: `src/app/api/crm/blacklist/route.ts` _(new)_

- [ ] Register `GET /crm/blacklist` via `registerRoute(...)` with tag `Blacklist`, query schema `GetBlacklistQuerySchema`, response `GetBlacklistResponseSchema`
- [ ] Implement `GET` handler:
  - Parse + validate query via `GetBlacklistQuerySchema.safeParse(queryObj)` — return 400 on failure
  - `let rows = db.memberBlacklist.getList()`
  - Apply `search` filter: `memberId` case-insensitive OR `memberName` includes
  - Apply `reason` filter: `registrationSource === reason`
  - Apply `unpaid` filter: `has_debt` → `> 0`, `no_debt` → `=== 0`
  - Paginate: `slice((page-1)*limit, page*limit)`
  - Return `NextResponse.json({ blacklist: slice, pagination: { page, limit, total, total_pages } })`
- [ ] Register `POST /crm/blacklist` via `registerRoute(...)`, body schema `PostBlacklistBodySchema`, response `PostBlacklistResponseSchema` (201)
- [ ] Implement `POST` handler:
  - Parse body, validate via `PostBlacklistBodySchema.safeParse(body)` — return 400 on failure
  - Call `db.memberBlacklist.create({ ...body, registrationSource: BlacklistRegistrationSource.Manual, manualReason: body.reason, memo: body.memo ?? null })`
  - Return `NextResponse.json({ blacklist: newRow }, { status: 201 })`

---

## TASK-04 — Register route for OpenAPI generation

**File**: `src/app/api/_routes/index.ts` _(modify)_

- [ ] Add `import '@/app/api/crm/blacklist/route';` (sorted alphabetically with other crm routes)

---

## TASK-05 — Route config

**File**: `src/lib/routes/routes.config.ts` _(modify)_

- [ ] Add entry to `routes` object:
  ```ts
  '/members/blacklist': {
    router: '/members/blacklist',
    filePath: '(private)/members/blacklist',
    pattern: '/members/blacklist',
    private: true,
  },
  ```
- [ ] Add `'/members/blacklist'` to `routeKeys` array
- [ ] Add `'/members/blacklist'` to `routePatterns` array

---

## TASK-06 — Regenerate OpenAPI + API client

_Run in terminal after TASK-01 through TASK-04 are complete._

- [ ] `npm run generate-openapi`
- [ ] `npm run generate-api`
- [ ] Verify `src/lib/api/types.gen.ts` contains `BlacklistRow`, `GetBlacklistQuery`, `GetBlacklistResponse`, `PostBlacklistBody`
- [ ] Verify `src/lib/api/@tanstack/react-query.gen.ts` exports `getCrmBlacklistOptions`, `getCrmBlacklistQueryKey`, `postCrmBlacklistMutation`

---

## TASK-07 — UI constants (label maps)

**File**: `src/app/(private)/members/blacklist/_constants/blacklist.constants.ts` _(new)_

- [ ] Import `BlacklistRegistrationSource`, `BlacklistManualReason`, `UnpaidFilter` from generated `types.gen.ts`
- [ ] Export `BLACKLIST_REGISTRATION_SOURCE_LABEL: Record<BlacklistRegistrationSource, string>`:
  ```ts
  { forced_withdrawal: '強制退会', manual: '手動登録' }
  ```
- [ ] Export `BLACKLIST_MANUAL_REASON_LABEL: Record<BlacklistManualReason, string>`:
  ```ts
  { nuisance: '迷惑行為', unpaid: '未納金', fraudulent_use: '不正利用', other: 'その他' }
  ```
- [ ] Export `UNPAID_FILTER_LABEL: Record<UnpaidFilter, string>`:
  ```ts
  { all: '未納金：全件', has_debt: '未納金：あり', no_debt: '未納金：なし' }
  ```

---

## TASK-08 — `use-blacklist-filters.ts`

**File**: `src/app/(private)/members/blacklist/_hooks/use-blacklist-filters.ts` _(new)_

- [ ] Import `parseAsInteger`, `parseAsString`, `parseAsStringEnum`, `useQueryStates` from `nuqs`
- [ ] Import `BlacklistRegistrationSource`, `UnpaidFilter` from `@/lib/api/types.gen`
- [ ] Import `PAGE_SIZE` from `@/constants/app.constants`
- [ ] Define `BlacklistFilters` type (page, search, reason, unpaid)
- [ ] Implement `useBlacklistFilters()`:
  - `useQueryStates` with: `page: parseAsInteger.withDefault(1)`, `search: parseAsString.withDefault('')`, `reason: parseAsStringEnum<BlacklistRegistrationSource>(Object.values(BlacklistRegistrationSource))`, `unpaid: parseAsStringEnum<UnpaidFilter>(Object.values(UnpaidFilter))`
  - `history: 'push'`, `shallow: false`
  - `searchInput` local state + 500 ms debounce (same pattern as `use-staffs-filters.ts`)
  - Derive `queryParams` (omit `search` local state, use debounced value)
  - `currentPage` / `setCurrentPage` helpers
  - `pageSize = PAGE_SIZE`
  - `hasActiveFilters` boolean
  - `clearFilters()` resets reason + unpaid + page

---

## TASK-09 — `blacklist-filters-context.tsx`

**File**: `src/app/(private)/members/blacklist/_contexts/blacklist-filters-context.tsx` _(new)_

- [ ] `'use client'`
- [ ] `createContext<BlacklistFiltersContextValue | undefined>(undefined)` (same pattern as `staffs-filters-context.tsx`)
- [ ] Export `BlacklistFiltersProvider` component
- [ ] Export `useBlacklistFiltersContext()` with guard throw

---

## TASK-10 — `blacklist-table-columns.tsx`

**File**: `src/app/(private)/members/blacklist/_components/blacklist-table-columns.tsx` _(new)_

- [ ] Import `ColumnDef` from `@tanstack/react-table`
- [ ] Import `BlacklistRow`, `BlacklistRegistrationSource` from `@/lib/api/types.gen`
- [ ] Import `BLACKLIST_REGISTRATION_SOURCE_LABEL` from `../_constants/blacklist.constants`
- [ ] Import `format`, `parseISO` from `date-fns`
- [ ] Import `Badge` from `@/components/ui/badge`
- [ ] Define `getReasonBadgeClass(source: BlacklistRegistrationSource): string`:
  - `forced_withdrawal` → `'bg-destructive/15 text-destructive border-destructive/20'`
  - `manual` → `'bg-warning/15 text-warning border-warning/20'`
- [ ] Export `BlacklistTableColumns({ onMemberClick }: { onMemberClick: (memberId: string) => void }): ColumnDef<BlacklistRow>[]` factory with columns:
  - `memberId` — `font-mono text-xs text-muted-foreground`, size 110
  - `memberName` — `<span>` with `onClick={e => { e.stopPropagation(); onMemberClick(row.memberId) }}` + hover underline
  - `storeName` — plain `text-xs`
  - `registrationSource` — `<Badge variant="outline" className={getReasonBadgeClass(val)}>` + label from `BLACKLIST_REGISTRATION_SOURCE_LABEL[val]`, size 110
  - `unpaidAmount` — right-aligned `text-xs`; `¥{n.toLocaleString()}` + `text-destructive font-medium` when >0; `text-muted-foreground` when 0, size 110
  - `registeredAt` — `format(parseISO(val), 'yyyy/MM/dd')` `text-xs`, size 110

---

## TASK-11 — `blacklist-filters.tsx`

**File**: `src/app/(private)/members/blacklist/_components/blacklist-filters.tsx` _(new)_

- [ ] `'use client'`
- [ ] Import `Search`, `SlidersHorizontal`, `ChevronDown`, `ChevronUp` from `lucide-react`
- [ ] Import `Button`, `Input`, `Select*`, `Badge` from `@/components/ui/*`
- [ ] Import `BlacklistRegistrationSource`, `UnpaidFilter` from `@/lib/api/types.gen`
- [ ] Import `BLACKLIST_REGISTRATION_SOURCE_LABEL`, `UNPAID_FILTER_LABEL` from `../_constants/blacklist.constants`
- [ ] Import `useBlacklistFiltersContext` from `../_contexts/blacklist-filters-context`
- [ ] Props: `{ isFilterOpen: boolean; onFilterOpenChange: (open: boolean) => void }`
- [ ] Search `Input` (max-w-[400px], left `Search` icon, debounced via `searchInput` / `setSearchInput`)
- [ ] **詳細フィルター** `Button` (outline; active style `variant="default"` when `hasActiveFilters`; shows count `Badge` when > 0; `ChevronUp/Down` icon)
- [ ] Collapsible filter row (conditional render when `isFilterOpen`):
  - `登録理由` Select: placeholder `全登録理由`; options from `Object.entries(BLACKLIST_REGISTRATION_SOURCE_LABEL)`; active trigger style when value set
  - `未納金` Select: placeholder `未納金：全件`; options from `Object.entries(UNPAID_FILTER_LABEL)` (include `all` as the "clear" option); active trigger style
  - **すべてクリア** ghost `Button` → `clearFilters()`

---

## TASK-12 — `blacklist-register-sheet.tsx`

**File**: `src/app/(private)/members/blacklist/_components/blacklist-register-sheet.tsx` _(new)_

- [ ] `'use client'`
- [ ] Import `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription` from `@/components/ui/sheet`
- [ ] Import `Alert`, `AlertDescription` from `@/components/ui/alert`
- [ ] Import `TriangleAlert` from `lucide-react`
- [ ] Import `useForm`, `Controller` from `react-hook-form`; `zodResolver` from `@hookform/resolvers/zod`
- [ ] Import `PostBlacklistBodySchema`, `BlacklistManualReason` from `@/lib/api/types.gen`
- [ ] Import `BLACKLIST_MANUAL_REASON_LABEL` from `../_constants/blacklist.constants`
- [ ] Import `useMutation`, `useQueryClient` from `@tanstack/react-query`
- [ ] Import `postCrmBlacklistMutation`, `getCrmBlacklistQueryKey` from `@/lib/api/@tanstack/react-query.gen`
- [ ] Import `toast` from `sonner`
- [ ] Props: `{ open: boolean; onOpenChange: (open: boolean) => void; queryParams: GetBlacklistQuery }`
- [ ] Form fields: `memberId` (Input), `memberName` (Input), `reason` (Select from `BLACKLIST_MANUAL_REASON_LABEL`), `memo` (Textarea rows=4)
- [ ] Warning `Alert`: `TriangleAlert` icon + `bg-warning/10 border-warning/20 text-warning` + message
- [ ] Footer: キャンセル (`outline`, closes + resets) + 登録 (`destructive`, disabled when `!isValid || isPending`)
- [ ] On success: `toast.success('ブラックリストに登録しました')` + `queryClient.invalidateQueries(getCrmBlacklistQueryKey(...))` + close + reset
- [ ] On error: `toast.error('登録に失敗しました。もう一度お試しください。')`

---

## TASK-13 — `page.tsx`

**File**: `src/app/(private)/members/blacklist/page.tsx` _(new)_

- [ ] `'use client'`
- [ ] Import `Suspense` from `react`; `useRouter` from `next/navigation`
- [ ] Import `useQuery` from `@tanstack/react-query`
- [ ] Import `getCrmBlacklistOptions` from `@/lib/api/@tanstack/react-query.gen`
- [ ] Import `DataTable` from `@/components/common/data-table`
- [ ] Import `TablePagination` from `@/components/common/table-pagination`
- [ ] Import `Badge`, `Button`, `Card` from `@/components/ui/*`
- [ ] Import `Plus` from `lucide-react`
- [ ] Import `Loading` from `@/components/common/data-state-boundary/loading`
- [ ] Import `navigate` from `@/lib/routes/routes.util`
- [ ] Import all local components, context, hooks
- [ ] `BlacklistPageContent`:
  - `useBlacklistFilters()` → `{ filters, queryParams, currentPage, setCurrentPage, pageSize }`
  - `useState` for `isFilterOpen` and `isRegisterSheetOpen`
  - `useQuery({ ...getCrmBlacklistOptions({ query: queryParams }) })`
  - Page header: `<h1>ブラックリスト管理</h1>` + `<Badge>{total}件</Badge>` + `<Button onClick={() => setIsRegisterSheetOpen(true)}><Plus />手動登録</Button>`
  - Wrap in `<BlacklistFiltersProvider value={filtersHook}>`
  - `<Card>` containing `<BlacklistFilters>`, `<DataTable>`, `<TablePagination>`
  - `<BlacklistRegisterSheet open={isRegisterSheetOpen} onOpenChange={setIsRegisterSheetOpen} queryParams={queryParams} />`
  - `onRowClick` → navigate to `/members/blacklist/{id}` (no-op for now, future detail)
  - Column `onMemberClick` → `router.push(navigate('/members/[id]', memberId))`
- [ ] Default export `BlacklistPage` wrapping content in `<Suspense fallback={<Loading />}>`

---

## TASK-14 — Sidebar entry

**File**: `src/components/layout/app-sidebar.tsx` _(modify)_

- [ ] Add `{ label: 'ブラックリスト管理', href: '/members/blacklist' }` to `subItems` of the 会員管理 menu item (after 休会・退会管理)

---

## Definition of Done

- [ ] `npm run type-check` passes with 0 errors
- [ ] `npm run lint` passes
- [ ] `npm run dev` — navigating to `/members/blacklist` renders the list with seeded data
- [ ] Search, 登録理由 filter, and 未納金 filter all update URL params and filter the table
- [ ] 手動登録 Sheet opens, validates required fields, submits, and shows success toast
- [ ] すべてクリア resets all filters

---

## Handoff

> ✅ **speckit.tasks complete.**
>
> To proceed with implementation, trigger:
>
> ```
> speckit.implement
> ```
