# Blacklist Detail — Technical Plan

> **Spec**: `specs/blacklist-management/detail/spec.md`
> **Branch**: `feature/blacklist-detail`
> **Created**: 2026-05-08
> **Depends on**: `feature/blacklist-list` (already merged — list page, schema, mock-db, and list route exist)

---

## UI Prototype Registry

| Branch                     | Screen name        | UI slug            | Cache path                                             | Spec IDs      |
| -------------------------- | ------------------ | ------------------ | ------------------------------------------------------ | ------------- |
| `feature/blacklist-detail` | ブラックリスト詳細 | `blacklist-detail` | `.cache/fitness-crm-ui/src/pages/blacklist-detail.tsx` | FR-015-detail |

---

## 1. High-Level Approach

Follow the **transfer detail page** (`/members/transfers/[id]`) as the closest implementation reference:

- RSC route file with `'use client'` page component
- `useParams` → `useQuery` with generated React Query options
- `DataStateBoundary` for loading/error/empty states
- `BreadcrumbNav` back-link + `h1` title + source-badge in header
- 60/40 two-column layout: left = info cards, right = sticky `StatusCard`
- No mutations — pure read-only screen

The implementation touches the **schema → mock-db → API route → OpenAPI regen → page + components** layers.

---

## 2. Existing Infrastructure (do not re-create)

| Asset                                                  | Status                                                   |
| ------------------------------------------------------ | -------------------------------------------------------- |
| `src/app/api/_schemas/blacklist.schema.ts`             | ✅ exists — `BlacklistItemSchema`, enums already defined |
| `src/app/api/_mock-db.ts` — `memberBlacklist`          | ✅ exists — `getList()` and `create()` already seeded    |
| `src/app/api/crm/blacklist/route.ts`                   | ✅ exists — GET list + POST manual register              |
| `src/app/(private)/members/blacklist/`                 | ✅ exists — list page                                    |
| `src/app/(private)/members/blacklist/_constants/`      | ✅ exists — label maps                                   |
| `src/lib/routes/routes.config.ts` `/members/blacklist` | ✅ exists                                                |
| `src/components/common/status-card.tsx`                | ✅ exists                                                |
| `src/components/common/breadcrumb-nav.tsx`             | ✅ exists                                                |
| `src/components/common/data-state-boundary/`           | ✅ exists                                                |

---

## 3. New Files

```
src/
├── app/
│   ├── api/
│   │   └── crm/
│   │       └── blacklist/
│   │           └── [id]/
│   │               └── route.ts              # GET /crm/blacklist/{id}
│   └── (private)/
│       └── members/
│           └── blacklist/
│               └── [id]/
│                   ├── page.tsx              # Detail page entry point ('use client')
│                   └── _components/
│                       ├── blacklist-detail-info.tsx      # 登録情報 card
│                       ├── blacklist-match-conditions.tsx # 照合条件 card
│                       ├── blacklist-unpaid-card.tsx      # 未納金 card
│                       ├── blacklist-detail-skeleton.tsx  # Loading skeleton
│                       └── blacklist-source-badge.tsx     # Shared registration-source badge
```

---

## 4. Modified Files

| File                                       | Change                                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `src/app/api/_schemas/blacklist.schema.ts` | Add `BlacklistDetailSchema`, `GetBlacklistByIdResponseSchema`, and related Zod types                            |
| `src/app/api/_mock-db.ts`                  | Extend `BlacklistRow` seed data with `registeredBy` + `matchConditions`; add `getById()` if not already present |
| `src/app/api/_routes/index.ts`             | Add `import '@/app/api/crm/blacklist/[id]/route'`                                                               |
| `src/lib/routes/routes.config.ts`          | Add `/members/blacklist/[id]` dynamic route entry                                                               |

> `src/lib/api/` files are **regenerated** via `npm run generate-openapi && npm run generate-api` — never edited manually.

---

## 5. Data Model Changes

### 5.1 Schema additions — `blacklist.schema.ts`

```ts
// MatchConditions sub-schema
export const MatchConditionsSchema = z
  .object({
    nameAndBirthdate: z.boolean(),
    email: z.boolean(),
    phone: z.boolean(),
    address: z.boolean(),
  })
  .openapi({ title: 'MatchConditions' });

// Detail schema — extends BlacklistItemSchema with detail-only fields
export const BlacklistDetailSchema = BlacklistItemSchema.extend({
  registeredBy: z.string().openapi({ example: 'System', description: '登録者名' }),
  matchConditions: MatchConditionsSchema,
}).openapi({ title: 'BlacklistDetail' });

export type BlacklistDetail = z.infer<typeof BlacklistDetailSchema>;

// GET /crm/blacklist/{id} response
export const GetBlacklistByIdResponseSchema = BlacklistDetailSchema.openapi({
  title: 'GetBlacklistByIdResponse',
});

export type GetBlacklistByIdResponse = z.infer<typeof GetBlacklistByIdResponseSchema>;
```

> **Note**: `BlacklistItem` (existing) covers list fields. `BlacklistDetail` adds `registeredBy`
> and `matchConditions` required only by the detail screen.

### 5.2 Mock DB changes — `_mock-db.ts`

Extend `BlacklistRow` type alias to include detail fields by expanding the seed data:

```ts
// BlacklistRow type (already = BlacklistItem) must be extended to include detail fields.
// Option A (preferred): declare BlacklistRow = BlacklistDetail (superset of BlacklistItem).
// Option B: keep BlacklistRow = BlacklistItem and add a separate _blacklistDetails Record.
//
// → Use Option A: redefine BlacklistRow = BlacklistDetail so getById() returns full detail
//   without a separate store. Update the import at top of _mock-db.ts.
```

Seed data for each row must be enriched with:

- `registeredBy: string` — `"System"` for `forced_withdrawal`, staff name for `manual`
- `matchConditions: { nameAndBirthdate, email, phone, address }` — varied deterministically

The `getById(id: string): BlacklistRow | undefined` method already exists in the `DbType`
declaration — just ensure the implementation is added in `createDb()`.

### 5.3 Routes config — `routes.config.ts`

```ts
'/members/blacklist/[id]': {
  router: (id: string | number) => `/members/blacklist/${id}`,
  filePath: '(private)/members/blacklist/[id]',
  pattern: '/members/blacklist/:id',
  private: true,
},
```

---

## 6. API Route — `GET /crm/blacklist/{id}`

**File**: `src/app/api/crm/blacklist/[id]/route.ts`

```
registerRoute({
  method: 'get',
  path: '/crm/blacklist/{id}',
  summary: 'Get blacklist entry by ID',
  tags: ['Blacklist'],
  responses: [
    { status: 200, schema: GetBlacklistByIdResponseSchema },
    { status: 404, schema: ErrorResponseSchema },
  ],
});

export async function GET(_req, { params }) {
  const row = db.memberBlacklist.getById(params.id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ blacklist: row });
}
```

---

## 7. Page Component — `[id]/page.tsx`

Pattern mirrors `transfers/[id]/page.tsx`:

```tsx
'use client';
// useParams → id
// useQuery(getCrmBlacklistByIdOptions({ path: { id } }))
// DataStateBoundary wrapper
// BreadcrumbNav + h1 + BlacklistSourceBadge
// 60/40 layout:
//   Left: BlacklistDetailInfo | BlacklistMatchConditions | BlacklistUnpaidCard
//   Right: <div sticky> StatusCard
```

### StatusCard props mapping

| `registrationSource` | `tone`        | `label`    |
| -------------------- | ------------- | ---------- |
| `forced_withdrawal`  | `destructive` | `強制退会` |
| `manual`             | `warning`     | `手動登録` |

`meta`: `["登録日: yyyy/MM/dd HH:mm"]` — formatted via `date-fns` `format(parseISO(...), 'yyyy/MM/dd HH:mm', { timeZone: 'Asia/Tokyo' })`

---

## 8. Sub-Components

### 8.1 `BlacklistSourceBadge`

Extracted shared badge (reused in page header and inside 登録情報 card). Accepts
`registrationSource: 'forced_withdrawal' | 'manual'`. Reads label maps from
`_constants/blacklist.constants.ts`. Used instead of inline ternaries to keep templates clean.

### 8.2 `BlacklistDetailInfo`

Card `登録情報` — 2-col grid:

| Row | Col 1                          | Col 2                                                  |
| --- | ------------------------------ | ------------------------------------------------------ |
| 1   | 会員ID (mono)                  | 氏名 (`Button variant="link"` → `/members/{memberId}`) |
| 2   | 店舗名                         | 登録理由 (`BlacklistSourceBadge`)                      |
| 3   | 登録日時                       | 登録者                                                 |
| 4   | メモ (col-span-2, conditional) |                                                        |

Date format: `format(parseISO(registeredAt), 'yyyy/MM/dd HH:mm', { timeZone: 'Asia/Tokyo' })` — matches the app-wide `date.util.ts` pattern.

### 8.3 `BlacklistMatchConditions`

Card `照合条件` — 2-col grid. Each condition row:

```tsx
<div className="flex items-center justify-between">
  <span className="text-muted-foreground text-xs">{label}</span>
  <Badge variant="outline" className={matched ? 'bg-destructive/15 ...' : 'bg-muted ...'}>
    {matched ? '一致' : '不一致'}
  </Badge>
</div>
```

Conditions in order: `nameAndBirthdate` / `email` / `phone` / `address`.

### 8.4 `BlacklistUnpaidCard`

Card `未納金`:

- `text-2xl font-bold text-destructive` when `> 0`, `text-muted-foreground` when `=== 0`
- `未収` badge (destructive tint) shown when `> 0`

### 8.5 `BlacklistDetailSkeleton`

Full-page skeleton matching the 60/40 layout. Uses `Skeleton` from `@/components/ui/skeleton`.
Mirrored structure: two skeleton card blocks (left) + one status-card block (right).

---

## 9. Constants & Label Maps

The existing `_constants/blacklist.constants.ts` already has:

- `BLACKLIST_REGISTRATION_SOURCE_LABEL` — used by `BlacklistSourceBadge`
- `BLACKLIST_MANUAL_REASON_LABEL`

Add to the same file:

```ts
export const MATCH_CONDITION_LABEL: Record<keyof MatchConditions, string> = {
  nameAndBirthdate: '氏名＆生年月日一致',
  email: 'メール一致',
  phone: '電話一致',
  address: '住所一致',
};
```

---

## 10. Row Click — List → Detail Navigation

The blacklist list table (`blacklist-table-columns.tsx`) currently has row-click navigation noted as
`/members/blacklist/{id}` (out of scope in the list spec). This must be wired up:

- In `BlacklistTableColumns`, the `memberId` link cell already navigates to the member detail.
- Row click → `router.push(navigate('/members/blacklist/[id]', row.id))`.

This is a **small change to an existing file**, not a new file.

---

## 11. Regeneration Steps (after all code is written)

```bash
npm run generate-openapi   # rebuilds src/lib/openapi.json from route registrations
npm run generate-api        # regenerates src/lib/api/types.gen.ts + react-query.gen.ts
```

The generated `getCrmBlacklistByIdOptions` factory will be used in the page component.

---

## 12. Out of Scope

- Any mutation (edit / delete / unblacklist) on this screen
- FR-016 auto-registration system batch
- Personal information deletion block UI (enforced at member detail level)
- Auth guard enforcement (assumed handled by the existing middleware)

---

## Handoff

> ✅ **speckit.plan complete** for Blacklist Detail screen.
>
> To proceed, trigger the next step:
>
> ```
> speckit.tasks
> ```
