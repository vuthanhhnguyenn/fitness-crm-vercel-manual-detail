# Blacklist Detail — Task List

> **Plan**: `specs/blacklist-management/detail/plan.md`
> **Spec**: `specs/blacklist-management/detail/spec.md`
> **Branch**: `feature/blacklist-detail`
> **Created**: 2026-05-08

---

## TASK-D01 — Zod schema: add detail types to `blacklist.schema.ts`

**File**: `src/app/api/_schemas/blacklist.schema.ts` _(modify)_

- [ ] Add `MatchConditionsSchema` — `z.object({ nameAndBirthdate, email, phone, address })`, all `z.boolean()`
- [ ] Add `BlacklistDetailSchema` — `BlacklistItemSchema.extend({ registeredBy: z.string(), matchConditions: MatchConditionsSchema })`
- [ ] Export `type BlacklistDetail = z.infer<typeof BlacklistDetailSchema>`
- [ ] Add `GetBlacklistByIdResponseSchema = BlacklistDetailSchema`
- [ ] Export `type GetBlacklistByIdResponse = z.infer<typeof GetBlacklistByIdResponseSchema>`

---

## TASK-D02 — Mock DB: extend `BlacklistRow` type + enrich seed data

**File**: `src/app/api/_mock-db.ts` _(modify)_

- [ ] Change `export type BlacklistRow = BlacklistItem` → `export type BlacklistRow = BlacklistDetail`
  - Update import: add `BlacklistDetail` to the import from `blacklist.schema`; remove `BlacklistItem` if no longer needed directly
- [ ] In `memberBlacklist._seed()` inside `createDb()`, enrich each seeded row with:
  - `registeredBy`: `'System'` when `registrationSource === 'forced_withdrawal'`; cycle staff name string (e.g. `'佐藤 花子'`, `'鈴木 次郎'`) for `manual` rows
  - `matchConditions`: deterministically varied booleans using `i % 2`, `i % 3`, etc.
- [ ] Verify `getById(id: string): BlacklistRow | undefined` is implemented in `createDb()` (the `DbType` already declares it — ensure the `memberBlacklist` object inside `createDb()` has the matching method body using `this._rows.find(...)`)

---

## TASK-D03 — API route: `GET /crm/blacklist/[id]`

**File**: `src/app/api/crm/blacklist/[id]/route.ts` _(new)_

- [ ] Call `registerRoute({ method: 'get', path: '/crm/blacklist/{id}', summary: 'Get blacklist entry by ID', tags: ['Blacklist'], responses: [200, 404] })`
- [ ] Export `async function GET(_req, { params })`:
  - Destructure `params.id`
  - `const row = db.memberBlacklist.getById(id)`
  - Return 404 `{ error: 'Not found' }` when undefined
  - Return 200 `{ blacklist: row }`
- [ ] Use `GetBlacklistByIdResponseSchema` and `ErrorResponseSchema` in `registerRoute` response definitions

---

## TASK-D04 — Register new route in OpenAPI index

**File**: `src/app/api/_routes/index.ts` _(modify)_

- [ ] Add `import '@/app/api/crm/blacklist/[id]/route';` below the existing `import '@/app/api/crm/blacklist/route';` line

---

## TASK-D05 — Add route entry to `routes.config.ts`

**File**: `src/lib/routes/routes.config.ts` _(modify)_

- [ ] Add after the `/members/blacklist` entry:
  ```ts
  '/members/blacklist/[id]': {
    router: (id: string | number) => `/members/blacklist/${id}`,
    filePath: '(private)/members/blacklist/[id]',
    pattern: '/members/blacklist/:id',
    private: true,
  },
  ```
- [ ] Also add `'/members/blacklist/[id]'` to the `privateRoutes` array (if that array exists in the file)

---

## TASK-D06 — Regenerate OpenAPI spec and client

_No files to edit manually — run commands after TASK-D01 through TASK-D05 are complete._

- [ ] `npm run generate-openapi` — regenerates `src/lib/openapi.json`
- [ ] `npm run generate-api` — regenerates `src/lib/api/types.gen.ts` + `src/lib/api/@tanstack/react-query.gen.ts`
- [ ] Confirm `getCrmBlacklistByIdOptions` factory is present in `react-query.gen.ts`
- [ ] Confirm `BlacklistDetail`, `GetBlacklistByIdResponse`, `MatchConditions` types are present in `types.gen.ts`

---

## TASK-D07 — Constants: add `MATCH_CONDITION_LABEL`

**File**: `src/app/(private)/members/blacklist/_constants/blacklist.constants.ts` _(modify)_

- [ ] Import `MatchConditions` type (from `@/lib/api/types.gen` once generated - after TASK-D06 is complete)
- [ ] Add:
  ```ts
  export const MATCH_CONDITION_LABEL: Record<keyof MatchConditions, string> = {
    nameAndBirthdate: '氏名＆生年月日一致',
    email: 'メール一致',
    phone: '電話一致',
    address: '住所一致',
  };
  ```

---

## TASK-D08 — Shared component: `BlacklistSourceBadge`

**File**: `src/app/(private)/members/blacklist/_components/blacklist-source-badge.tsx` _(new)_

- [ ] Accept prop `source: BlacklistRegistrationSource`
- [ ] Render `<Badge variant="outline" className={getRegistrationSourceBadgeClass(source)}>` with coloured dot `<span>` + label from `BLACKLIST_REGISTRATION_SOURCE_LABEL`
- [ ] Export as named export `BlacklistSourceBadge`

---

## TASK-D09 — Sub-component: `BlacklistDetailInfo`

**File**: `src/app/(private)/members/blacklist/[id]/_components/blacklist-detail-info.tsx` _(new)_

- [ ] Accept prop `blacklist: BlacklistDetail`
- [ ] Render `<Card>` with `<CardHeader><CardTitle>登録情報</CardTitle></CardHeader>`
- [ ] Inside `<CardContent>`, a 2-col grid (`grid grid-cols-2 gap-x-8 gap-y-4`):
  - Row 1: 会員ID (`font-mono text-sm font-medium`) | 氏名 (`<Button variant="link">` navigating to `/members/{memberId}` via `navigate`)
  - Row 2: 店舗名 | 登録理由 (`<BlacklistSourceBadge source={...} />`)
  - Row 3: 登録日時 (formatted `yyyy/MM/dd HH:mm` JST via `date-fns`) | 登録者
  - Row 4 (only when `memo !== null`): メモ spanning `col-span-2`

---

## TASK-D10 — Sub-component: `BlacklistMatchConditions`

**File**: `src/app/(private)/members/blacklist/[id]/_components/blacklist-match-conditions.tsx` _(new)_

- [ ] Accept prop `matchConditions: MatchConditions`
- [ ] Render `<Card>` with title `照合条件`
- [ ] 2-col grid of 4 condition rows (nameAndBirthdate, email, phone, address)
- [ ] Each row: `flex items-center justify-between` — label from `MATCH_CONDITION_LABEL` + `<Badge>` showing `一致` (destructive tint) or `不一致` (muted)

---

## TASK-D11 — Sub-component: `BlacklistUnpaidCard`

**File**: `src/app/(private)/members/blacklist/[id]/_components/blacklist-unpaid-card.tsx` _(new)_

- [ ] Accept prop `unpaidAmount: number`
- [ ] Render `<Card>` with title `未納金`
- [ ] Amount: `¥{unpaidAmount.toLocaleString()}` with `text-2xl font-bold`; `text-destructive` when > 0, `text-muted-foreground` when 0
- [ ] Show `未収` Badge (destructive tint) when `unpaidAmount > 0`

---

## TASK-D12 — Sub-component: `BlacklistDetailSkeleton`

**File**: `src/app/(private)/members/blacklist/[id]/_components/blacklist-detail-skeleton.tsx` _(new)_

- [ ] Mirror the 60/40 page layout using `<Skeleton>` blocks inside card-shaped containers
- [ ] Left column: three card skeletons (one tall for 登録情報, one medium for 照合条件, one short for 未納金)
- [ ] Right column: one status-card-shaped skeleton block

---

## TASK-D13 — Detail page entry point

**File**: `src/app/(private)/members/blacklist/[id]/page.tsx` _(new)_

- [ ] `'use client'` directive
- [ ] `const { id } = useParams<{ id: string }>()`
- [ ] `const { data, isPending, isError } = useQuery({ ...getCrmBlacklistByIdOptions({ path: { id } }) })`
- [ ] Wrap in `<DataStateBoundary isLoading={isPending} isError={isError} isEmpty={!data?.blacklist} skeleton={<BlacklistDetailSkeleton />}>`
- [ ] Inside boundary, render:
  - `<BreadcrumbNav items={[{ url: navigate('/members/blacklist'), label: 'ブラックリスト管理' }, { label: blacklist.memberId }]} />`
  - Heading row: `<h1>` with `memberId` + `<BlacklistSourceBadge source={blacklist.registrationSource} />`
  - 60/40 layout `<div className="flex gap-4">`:
    - Left `w-[60%]`: `<BlacklistDetailInfo>`, `<BlacklistMatchConditions>`, `<BlacklistUnpaidCard>`
    - Right `w-[40%]`: `<div className="sticky top-6">` wrapping `<StatusCard tone={…} icon={ShieldBan} label={…} meta={[…]} />`
- [ ] Map `registrationSource` to `tone` and `label` using constants

---

## TASK-D14 — Wire row click in the list table

**File**: `src/app/(private)/members/blacklist/_components/blacklist-table-columns.tsx` _(modify)_

- [ ] In the row definition (or `onRowClick` / cell `onClick` handler), add navigation to `/members/blacklist/${row.id}` via `router.push(navigate('/members/blacklist/[id]', row.id))`
- [ ] Ensure the 氏名 cell click still navigates to the member detail page (not overridden by row click) — use `e.stopPropagation()` on the name button

---

## Definition of Done

- [ ] `npm run type-check` — zero errors
- [ ] `npm run lint` — zero warnings/errors
- [ ] Dev server: navigating to `/members/blacklist` → clicking a row → arrives at `/members/blacklist/[id]` with correct data displayed
- [ ] All three cards render correctly (登録情報, 照合条件, 未納金)
- [ ] StatusCard in right column reflects correct tone and label
- [ ] Back link returns to list page
- [ ] 氏名 link navigates to `/members/[memberId]`

---

## Handoff

> ✅ **speckit.tasks complete** for Blacklist Detail screen.
>
> To proceed to implementation, trigger:
>
> ```
> speckit.implement
> ```
