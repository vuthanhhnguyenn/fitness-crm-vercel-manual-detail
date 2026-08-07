# Blacklist Management — Technical Plan

> **Spec**: `specs/blacklist-management/spec.md`
> **Branch**: `feature/blacklist-list`
> **Created**: 2026-05-07

---

## UI Prototype Registry

| Branch                   | Screen name        | UI slug          | Cache path                                           | Spec IDs |
| ------------------------ | ------------------ | ---------------- | ---------------------------------------------------- | -------- |
| `feature/blacklist-list` | ブラックリスト管理 | `blacklist-list` | `.cache/fitness-crm-ui/src/pages/blacklist-list.tsx` | FR-015   |

---

## 1. High-Level Approach

Follow the same pattern as the **staffs** list page (closest equivalent):

- `nuqs` URL state → context → components
- Generated React Query options from OpenAPI spec
- `DataTable` + `TablePagination` shared components
- `Sheet` (not `Dialog`) for the manual-registration form

The implementation spans: **schema → mock DB → API routes → OpenAPI regen → page + components**.

---

## 2. New Files

```
src/
├── app/
│   ├── api/
│   │   ├── _schemas/
│   │   │   └── blacklist.schema.ts               # Zod schemas + TypeScript enums
│   │   └── crm/
│   │       └── blacklist/
│   │           └── route.ts                      # GET + POST /crm/blacklist
│   └── (private)/
│       └── members/
│           └── blacklist/
│               ├── page.tsx                      # Page entry point
│               ├── _constants/
│               │   └── blacklist.constants.ts    # UI label maps (Japanese display strings)
│               ├── _components/
│               │   ├── blacklist-table-columns.tsx
│               │   ├── blacklist-filters.tsx
│               │   └── blacklist-register-sheet.tsx
│               ├── _contexts/
│               │   └── blacklist-filters-context.tsx
│               └── _hooks/
│                   └── use-blacklist-filters.ts
```

---

## 3. Modified Files

| File                                    | Change                                                                |
| --------------------------------------- | --------------------------------------------------------------------- |
| `src/app/api/_mock-db.ts`               | Add `BlacklistRow` type import + `blacklistItems` seed array (8 rows) |
| `src/app/api/_routes/index.ts`          | Register `@/app/api/crm/blacklist/route`                              |
| `src/lib/routes/routes.config.ts`       | Add `/members/blacklist` route entry                                  |
| `src/components/layout/app-sidebar.tsx` | Add "ブラックリスト管理" sub-item under 会員管理                      |

> `src/lib/api/` files (`types.gen.ts`, `react-query.gen.ts`) are **regenerated** by running  
> `npm run generate-openapi && npm run generate-api` — never edited manually.

---

## 4. Data Model

### 4.1 `src/app/api/_schemas/blacklist.schema.ts`

```ts
// Zod enum: BlacklistRegistrationSource — English keys stored in DB / API
z.enum(['forced_withdrawal', 'manual'])

// Zod enum: BlacklistManualReason — English keys stored in DB / API
z.enum(['nuisance', 'unpaid', 'fraudulent_use', 'other'])

// Zod enum: UnpaidFilter — English keys used in URL params
z.enum(['has_debt', 'no_debt'])

// BlacklistItemSchema — one row in the list
{
  id: z.string(),
  memberId: z.string(),       // "USR-00123"
  memberName: z.string(),
  storeName: z.string(),
  registrationSource: BlacklistRegistrationSource,   // 'forced_withdrawal' | 'manual'
  manualReason: BlacklistManualReason.nullable(),    // null for forced_withdrawal rows
  unpaidAmount: z.number().int().nonnegative(),      // JPY
  registeredAt: z.string(),   // ISO date
  memo: z.string().nullable(),
}

// GetBlacklistQuerySchema — query params for GET
{
  search: z.string().optional(),
  reason: BlacklistRegistrationSource.optional(),   // 'forced_withdrawal' | 'manual'
  unpaid: UnpaidFilter.optional(),                  // 'has_debt' | 'no_debt'
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}

// GetBlacklistResponseSchema
{
  blacklist: z.array(BlacklistItemSchema),
  pagination: { page, limit, total, total_pages }
}

// PostBlacklistBodySchema — manual registration
{
  memberId: z.string().min(1),
  memberName: z.string().min(1),
  reason: BlacklistManualReason,   // 'nuisance' | 'unpaid' | 'fraudulent_use' | 'other'
  memo: z.string().optional(),
}

// PostBlacklistResponseSchema
{
  blacklist: BlacklistItemSchema
}
```

UI label maps live in `src/app/(private)/members/blacklist/_constants/blacklist.constants.ts` — **never** in the schema file:

```ts
export const BLACKLIST_REGISTRATION_SOURCE_LABEL: Record<BlacklistRegistrationSource, string> = {
  forced_withdrawal: '強制退会',
  manual: '手動登録',
};

export const BLACKLIST_MANUAL_REASON_LABEL: Record<BlacklistManualReason, string> = {
  nuisance: '迷惑行為',
  unpaid: '未納金',
  fraudulent_use: '不正利用',
  other: 'その他',
};

export const UNPAID_FILTER_LABEL: Record<UnpaidFilter, string> = {
  has_debt: '未納金：あり',
  no_debt: '未納金：なし',
};
```

### 4.2 Mock DB — `memberBlacklist` in `DbType`

`memberBlacklist` follows the same pattern as `stores` — living inside `DbType` with `_rows`, `_seeded`, `_seed()`, and accessor methods.

**Type declaration added to `DbType`:**

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

**Implementation inside `db` singleton** (same initialisation style as `stores`):

```ts
memberBlacklist: {
  _rows: [] as BlacklistRow[],
  _seeded: false,
  _seed() {
    if (this._seeded) return;
    this._seeded = true;

    // Depend on members being seeded first — same pattern as memberLeaves
    db.members._seed();

    // Pick members whose status is 'force_withdrawn' as forced-withdrawal candidates,
    // plus a few 'withdrawn' members to represent manual registrations.
    const forceWithdrawn = db.members._members.filter(
      (m) => m.profile.status === MemberStatus.FORCE_WITHDRAWN,
    );
    const withdrawn = db.members._members.filter(
      (m) => m.profile.status === MemberStatus.WITHDRAWN,
    );

    const manualReasons: BlacklistManualReason[] = [
      BlacklistManualReason.Nuisance,
      BlacklistManualReason.Unpaid,
      BlacklistManualReason.FraudulentUse,
      BlacklistManualReason.Other,
    ];

    const baseDate = new Date('2026-01-01');

    // Forced-withdrawal rows (registrationSource = 'forced_withdrawal', manualReason = null)
    forceWithdrawn.forEach((m, i) => {
      const registeredAt = new Date(baseDate);
      registeredAt.setDate(registeredAt.getDate() + i * 14);
      const unpaidAmount = i % 3 === 0 ? (i + 1) * 3300 : 0;

      this._rows.push({
        id: `BL-FW-${String(i + 1).padStart(3, '0')}`,
        memberId: m.basic_info.member_number,
        memberName: m.basic_info.name_kanji,
        storeName: m.profile.store_name,
        registrationSource: BlacklistRegistrationSource.ForcedWithdrawal,
        manualReason: null,
        unpaidAmount,
        registeredAt: registeredAt.toISOString(),
        memo: null,
      });
    });

    // Manual rows (registrationSource = 'manual', manualReason = one of the enum values)
    withdrawn.slice(0, 5).forEach((m, i) => {
      const registeredAt = new Date(baseDate);
      registeredAt.setDate(registeredAt.getDate() + i * 21 + 7);

      this._rows.push({
        id: `BL-MN-${String(i + 1).padStart(3, '0')}`,
        memberId: m.basic_info.member_number,
        memberName: m.basic_info.name_kanji,
        storeName: m.profile.store_name,
        registrationSource: BlacklistRegistrationSource.Manual,
        manualReason: manualReasons[i % manualReasons.length]!,
        unpaidAmount: i % 2 === 0 ? (i + 1) * 1100 : 0,
        registeredAt: registeredAt.toISOString(),
        memo: i % 2 === 0 ? '手動登録済み' : null,
      });
    });
  },
  getList() { this._seed(); return this._rows; },
  getById(id: string) { this._seed(); return this._rows.find(r => r.id === id); },
  create(input: Omit<BlacklistRow, 'id' | 'registeredAt'>): BlacklistRow {
    this._seed();
    const newRow: BlacklistRow = {
      ...input,
      id: `BL-${Date.now()}`,
      registeredAt: new Date().toISOString(),
    };
    this._rows.push(newRow);
    return newRow;
  },
},
```

> No hardcoded `SEED_BLACKLIST_ROWS` const. All rows are derived from seeded members at runtime — same pattern as `memberLeaves._seed()`.

---

## 5. API Layer

### `GET /api/crm/blacklist`

Query params: `search`, `reason` (`BlacklistRegistrationSource`), `unpaid` (`UnpaidFilter`), `page`, `limit`

Logic:

1. `let rows = db.memberBlacklist.getList()`
2. Filter by `search` → `memberId` (case-insensitive) OR `memberName` contains
3. Filter by `reason` if provided (`rows.filter(r => r.registrationSource === reason)`)
4. Filter by `unpaid`: `has_debt` → `unpaidAmount > 0`; `no_debt` → `unpaidAmount === 0`
5. Paginate slice
6. Return `{ blacklist, pagination }`

### `POST /api/crm/blacklist`

Body: `PostBlacklistBody`

Logic:

1. Validate body with Zod `.safeParse()` — return 400 on failure
2. Call `db.memberBlacklist.create({ ...body, registrationSource: BlacklistRegistrationSource.Manual })`
3. Return 201 with created item

Both routes registered via `registerRoute(...)` with OpenAPI tags `['Blacklist']`.

---

## 6. Route Config

### `routes.config.ts` addition

```ts
'/members/blacklist': {
  router: '/members/blacklist',
  filePath: '(private)/members/blacklist',
  pattern: '/members/blacklist',
  private: true,
},
```

---

## 7. Frontend Components

### 7.1 `use-blacklist-filters.ts`

`useQueryStates` via `nuqs`:

| Param    | Parser                                                                           | Default |
| -------- | -------------------------------------------------------------------------------- | ------- |
| `page`   | `parseAsInteger`                                                                 | `1`     |
| `search` | `parseAsString`                                                                  | `''`    |
| `reason` | `parseAsStringEnum<BlacklistRegistrationSource>(['forced_withdrawal','manual'])` | `null`  |
| `unpaid` | `parseAsStringEnum<UnpaidFilter>(['all','has_debt','no_debt'])`                  | `null`  |

Returns: `{ filters, setFilters, queryParams, currentPage, setCurrentPage, pageSize }`  
`queryParams` maps directly to `GetBlacklistQuery` for passing to `getCrmBlacklistOptions({ query: queryParams })`.

### 7.2 `blacklist-filters-context.tsx`

Standard context wrapping the return value of `useBlacklistFilters`. Pattern identical to `staffs-filters-context.tsx`.

### 7.3 `blacklist-filters.tsx`

- Search `Input` (debounced 500 ms, max-w-[400px])
- **詳細フィルター** toggle `Button` with active-count `Badge`
- Collapsible section:
  - `登録理由` Select — options generated by iterating `BLACKLIST_REGISTRATION_SOURCE_LABEL`:
    ```ts
    // produces: [{ value: 'forced_withdrawal', label: '強制退会' }, { value: 'manual', label: '手動登録' }]
    Object.entries(BLACKLIST_REGISTRATION_SOURCE_LABEL).map(([value, label]) => ({ value, label }));
    ```
  - `未納金` Select — options generated from `UNPAID_FILTER_LABEL` (excluding `all`; `all` = no filter):
    ```ts
    Object.entries(UNPAID_FILTER_LABEL).map(([value, label]) => ({ value, label }));
    ```
  - **すべてクリア** ghost button

Active filter highlight: `border-primary bg-primary/10` on SelectTrigger when non-default value selected.

### 7.4 `blacklist-table-columns.tsx`

`ColumnDef<BlacklistItem>[]` factory. Columns:

| Column accessor      | Header   | Render                                                                                                         |
| -------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `memberId`           | 会員ID   | monospace `text-muted-foreground font-mono text-xs`                                                            |
| `memberName`         | 氏名     | `<span onClick stopPropagation → router.push('/members/[id]')>`                                                |
| `storeName`          | 店舗名   | plain `text-xs`                                                                                                |
| `registrationSource` | 登録理由 | `<Badge variant="outline">` with `getReasonBadgeVariant()` helper                                              |
| `unpaidAmount`       | 未納金額 | right-aligned; `¥{n.toLocaleString()}`; `text-destructive font-medium` when >0; `text-muted-foreground` when 0 |
| `registeredAt`       | 登録日   | `format(parseISO(val), 'yyyy/MM/dd')`                                                                          |

Badge variant helper (uses `BLACKLIST_REGISTRATION_SOURCE_LABEL` from `_constants/blacklist.constants.ts`):

```ts
function getReasonBadgeClass(source: BlacklistRegistrationSource) {
  if (source === BlacklistRegistrationSource.ForcedWithdrawal)
    // 'forced_withdrawal'
    return 'bg-destructive/15 text-destructive border-destructive/20';
  return 'bg-warning/15 text-warning border-warning/20'; // 'manual'
}
// Badge text: BLACKLIST_REGISTRATION_SOURCE_LABEL[source]  →  '強制退会' | '手動登録'
```

### 7.5 `blacklist-register-sheet.tsx`

`Sheet` (right side, `w-[480px]`). Controlled open state passed as prop.

Form managed by `react-hook-form` + `zodResolver(PostBlacklistBodySchema)`.

Fields: 会員ID (`Input`), 氏名 (`Input`), 登録理由 (`Select` — options generated from `BLACKLIST_MANUAL_REASON_LABEL`):

```ts
Object.entries(BLACKLIST_MANUAL_REASON_LABEL).map(([value, label]) => ({ value, label }));
// → [{ value: 'nuisance', label: '迷惑行為' }, { value: 'unpaid', label: '未納金' }, ...]
```

メモ (`Textarea` rows=4).

Warning `Alert` (`TriangleAlert` icon, `bg-warning/10 border-warning/20 text-warning`).

Footer: キャンセル (`outline`) + 登録 (`destructive`, disabled while `!isDirty || !isValid || isPending`).

Mutation: `useMutation({ ...postCrmBlacklistMutation() })` → on success: `toast.success(...)` + `queryClient.invalidateQueries(getCrmBlacklistQueryKey(...))` + close + reset.

### 7.6 `page.tsx`

`'use client'` — wraps `<Suspense>` + `<BlacklistPageContent>`.

```
BlacklistPageContent
├── Page header: title + Badge(total件) + 手動登録 Button
├── BlacklistFiltersProvider
│   └── Card
│       ├── BlacklistFilters (toolbar)
│       ├── DataTable (columns, data, isLoading, onRowClick → future detail)
│       └── TablePagination
└── BlacklistRegisterSheet (open, onOpenChange)
```

Query: `useQuery({ ...getCrmBlacklistOptions({ query: queryParams }) })`

---

## 8. Sidebar

Add under 会員管理 `subItems`:

```ts
{ label: 'ブラックリスト管理', href: '/members/blacklist' }
```

---

## 9. Generate Commands

After implementing API schema + routes:

```bash
npm run generate-openapi   # rebuilds openapi.json from registerRoute calls
npm run generate-api       # rebuilds src/lib/api/types.gen.ts + react-query.gen.ts
```

The generated functions used in the page:

- `getCrmBlacklistOptions(...)` — for `useQuery`
- `getCrmBlacklistQueryKey(...)` — for `queryClient.invalidateQueries`
- `postCrmBlacklistMutation()` — for `useMutation`

---

## 10. Implementation Order

1. `blacklist.schema.ts` — define all Zod schemas + enum exports
2. `_mock-db.ts` — add `BlacklistRow` type to `DbType`, implement `memberBlacklist` object inside `db` singleton with dynamic `_seed()` that derives rows from seeded members (no hardcoded seed const)
3. `crm/blacklist/route.ts` — GET + POST handlers using `db.memberBlacklist`
4. `_routes/index.ts` — register route
5. `routes.config.ts` — add `/members/blacklist` route
6. Run `generate-openapi && generate-api`
7. `use-blacklist-filters.ts` + `blacklist-filters-context.tsx`
8. `blacklist-table-columns.tsx`
9. `blacklist-filters.tsx`
10. `blacklist-register-sheet.tsx`
11. `page.tsx`
12. `app-sidebar.tsx` — add sidebar entry

---

## Handoff

> ✅ **speckit.plan complete.**
>
> To proceed, trigger the next step:
>
> ```
> speckit.tasks
> ```
