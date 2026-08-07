# Implementation Plan: Staff List — Y-01 スタッフ・権限管理

**Branch**: `001-staff-list` | **Date**: 2026-04-08 | **Spec**: [spec.md](./spec.md)  
**Input**: `specs/staff-management/spec.md`

---

## Summary

Implement the Y-01 Staff List feature (`FR-001`) — a paginated, filterable, sortable management
table at `/settings/staff`. The screen allows HQ users to view all staff accounts, search by
name/email, filter by 職位/ブランド/ステータス, sort by key columns, delete accounts via an
`<AlertDialog>`, and send bulk invitations via a `<Dialog>`. Manager-role users see only staff
within their Branch; non-management roles are redirected to `/403`.

**Technical approach**: New Next.js App Router page (`src/app/(private)/settings/staff/page.tsx`)
backed by four new API routes under `src/app/api/crm/staff/`. Data layer uses Zod schemas
→ `registerRoute` → OpenAPI spec → `@hey-api/openapi-ts` generated client → React Query
option-factories consumed by the page. URL state via `nuqs`. All UI from existing shadcn components.
Traditional page-based pagination (not infinite scroll) — see `research.md` §1.

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Next.js 16 App Router, Node.js ≥ 24.0.0  
**Primary Dependencies**: React Query (`@tanstack/react-query`), `nuqs`, `zod`, `@asteasolutions/zod-to-openapi`, `@hey-api/openapi-ts`, `sonner`, `date-fns` v4, `lucide-react`, Radix UI via shadcn  
**Storage**: In-memory mock DB (`src/app/api/_mock-db.ts`) extended with Branch / Staff / Position seed data  
**Testing**: Contract tests required (SC-005); framework TBD by existing test setup in project  
**Target Platform**: Web (Chromium / WebKit / Firefox); responsive desktop-first  
**Project Type**: Next.js web application (CRM — internal management tool)  
**Performance Goals**: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (Constitution Principle V)  
**Constraints**: Bundle chunk ≤ 250 kB gzip; page size ≤ 50 records; `no-any` enforced  
**Scale/Scope**: ~8 mock records; production target ~hundreds of staff per organisation

---

## Constitution Check

_GATE: All 5 principles evaluated below. All pass — no violations._

| Principle                                 | Gate Status | Implementation Decision                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Strict Type Safety**                 | ✅ Pass     | `StaffListItemSchema` + `GetStaffQuerySchema` in `src/app/api/_schemas/staff.schema.ts`. Types flow from Zod → OpenAPI → `types.gen.ts` → component props. No `any` in new files. `StaffRole`, `StaffStatus` enums in `src/types/staff.type.ts`.                                                                                                                                        |
| **II. Component Purity & UI Consistency** | ✅ Pass     | All UI from `src/components/ui/` (`<DataTable>`, `<Badge>`, `<Select>`, `<AlertDialog>`, `<Dialog>`, `<DropdownMenu>`, `<Button>`, `<Textarea>`) and `src/components/common/` (`<BreadcrumbNav>`, `<TextWithTooltip>`, `<DataStateBoundary>`). WCAG 2.1 AA: `有効` badge green, `無効` badge muted — both pass contrast ratio at shadcn defaults. No inline styles, no custom dropdown. |
| **III. Server-State via React Query**     | ✅ Pass     | `getStaffOptions` (generated) via `useQuery`; `getStaffPositionsOptions` (lazy, `enabled: isPanelOpen`); `useMutation` for delete (optimistic) and invite. URL state via `nuqs`. No raw `fetch` calls in components.                                                                                                                                                                    |
| **IV. Schema-Contract Testing**           | ✅ Pass     | 8 contract test scenarios documented in `research.md` §11; required before PR merge (SC-005).                                                                                                                                                                                                                                                                                           |
| **V. Performance Budget**                 | ✅ Pass     | Page size = 50 (FR-001-H); page-based pagination (not infinite scroll) avoids DOM growth; RSC default where possible; `<TextWithTooltip>` prevents layout shift from long text; `last_login_at` formatted with `date-fns` (no extra lib); route chunk budget tracked via `npm run build`.                                                                                               |

---

## Project Structure

### Documentation (this feature)

```text
specs/staff-management/
├── spec.md              # Feature specification (fully clarified)
├── plan.md              # This file
├── research.md          # Phase 0 — research & decisions
├── data-model.md        # Phase 1 — entities, schemas, mock DB
├── quickstart.md        # Phase 1 — dev setup guide
├── contracts/
│   └── api-contracts.md # Phase 1 — API contract documentation
└── tasks.md             # Phase 2 — NOT YET CREATED (speckit.tasks)
```

### Source Code

```text
src/
├── types/
│   └── staff.type.ts                            [NEW] StaffRole, StaffStatus enums + interfaces
│
├── app/
│   ├── api/
│   │   ├── _mock-db.ts                          [EXTEND] + Branch, Staff, Position seed data
│   │   ├── _schemas/
│   │   │   └── staff.schema.ts                  [NEW] Zod schemas (StaffListItemSchema, GetStaffQuerySchema, ...)
│   │   └── crm/
│   │       └── staff/
│   │           ├── route.ts                     [NEW] GET /crm/staff
│   │           ├── positions/
│   │           │   └── route.ts                 [NEW] GET /crm/staff/positions
│   │           ├── [id]/
│   │           │   └── route.ts                 [NEW] DELETE /crm/staff/[id]
│   │           └── invitations/
│   │               └── route.ts                 [NEW] POST /crm/staff/invitations
│   │
│   └── (private)/
│       └── settings/
│           ├── layout.tsx                       [NEW] Pass-through layout wrapper
│           └── staff/
│               ├── page.tsx                     [NEW] Main staff list page
│               ├── _components/
│               │   ├── staff-table-columns.tsx  [NEW] ColumnDef[] factory (8 columns)
│               │   ├── staff-filters.tsx        [NEW] Filter bar (search + collapsible panel)
│               │   ├── staff-delete-dialog.tsx  [NEW] AlertDialog with 削除理由 textarea
│               │   └── staff-invite-dialog.tsx  [NEW] Invite Dialog with staging list
│               ├── _contexts/
│               │   └── staff-filters-context.tsx [NEW] React context for filter state
│               └── _hooks/
│                   └── use-staff-filters.ts     [NEW] nuqs filter/sort/page hook
│
└── lib/
    └── api/                                     [REGENERATE] npm run generate-openapi && npm run generate-api
        ├── types.gen.ts
        └── @tanstack/
            └── react-query.gen.ts
```

---

## Complexity Tracking

> No Constitution violations. This section is empty — all principles pass with no exceptions.

---

## Phase 0: Research Findings

> Full findings in [`research.md`](./research.md). Key decisions:

| Topic                        | Decision                                                          | Reference       |
| ---------------------------- | ----------------------------------------------------------------- | --------------- |
| Pagination                   | Page-based (`useQuery` + `<Pagination>`) — not infinite scroll    | research.md §1  |
| Sorting                      | Server-side via `sort_by` + `sort_order` query params             | research.md §2  |
| Filter panel open/close      | `useState<boolean>` — NOT nuqs (spec explicit)                    | research.md §3  |
| Role scoping                 | Server-side scope injection (JWT → `branch_id → store_ids[]`)     | research.md §4  |
| Delete UX                    | Optimistic removal + `useMutation` rollback                       | research.md §5  |
| Invite state                 | Component-local `useState` in `StaffInviteDialog`                 | research.md §6  |
| Position options             | Lazy fetch (`enabled: isPanelOpen`); shared with Invite Dialog    | research.md §7  |
| /settings layout             | New pass-through `layout.tsx` — route group does not yet exist    | research.md §8  |
| nuqs hook shape              | Single `useStaffFilters` hook + Context (mirrors members pattern) | research.md §9  |
| Mock DB                      | 8 staff + 2 branches + 11 positions + accessor methods            | research.md §10 |
| Contract tests               | 8 scenarios — required pre-merge (SC-005)                         | research.md §11 |
| Q-02 (职位 single/multi)     | Single-select `<Select>` — deferred multi-select                  | research.md §12 |
| Q-04 (role-scoped positions) | Show all 11 to all roles                                          | research.md §12 |
| Q-05 (filter indicator)      | Numeric count badge                                               | research.md §12 |

---

## Phase 1: Design & Contracts

> Full designs in [`data-model.md`](./data-model.md) and [`contracts/api-contracts.md`](./contracts/api-contracts.md).

### 1a. Data Model Summary

**New TypeScript types** (`src/types/staff.type.ts`):

- `StaffRole` enum — 6 values: `system | headquarter | manager | staff | trainer | observer`
- `StaffStatus` enum — `active | inactive`
- `StaffBrand` type — `'joyfit' | 'fit365' | null`
- `SubBrand` type — `'joyfit_plus' | 'joyfit_yoga' | 'joyfit24'`
- `StaffListItem` interface — 13 fields (see `data-model.md` §1)
- `StaffPosition`, `Branch`, `StaffInvitationEntry` interfaces

**New Zod schemas** (`src/app/api/_schemas/staff.schema.ts`):

| Schema                       | Usage                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `StaffListItemSchema`        | GET response item validation + OpenAPI type generation                                                  |
| `GetStaffQuerySchema`        | GET query param validation (page, limit, q, position_id, brand, sub_brand, status, sort_by, sort_order) |
| `GetStaffResponseSchema`     | GET response envelope (`staff[]` + `pagination`)                                                        |
| `GetPositionsResponseSchema` | GET positions response                                                                                  |
| `DeleteStaffBodySchema`      | DELETE request body (`reason?`)                                                                         |
| `DeleteStaffResponseSchema`  | DELETE success response                                                                                 |
| `InviteStaffBodySchema`      | POST invitations body (`invitations: [{email, position_id, brand}]`)                                    |
| `InviteStaffResponseSchema`  | POST invitations response (`invited_count`, per-entry status)                                           |

### 1b. API Contracts Summary

Full contracts in [`contracts/api-contracts.md`](./contracts/api-contracts.md):

| Endpoint                     | Method | Description                             |
| ---------------------------- | ------ | --------------------------------------- |
| `/api/crm/staff`             | GET    | List staff — filters, sort, pagination  |
| `/api/crm/staff/positions`   | GET    | 職位マスター list (11 items)            |
| `/api/crm/staff/[id]`        | DELETE | Delete staff by ID with optional reason |
| `/api/crm/staff/invitations` | POST   | Bulk invite staff by email              |

### 1c. Component Architecture

```
StaffPage ('use client')                   ← page.tsx
  StaffFiltersProvider                     ← _contexts/staff-filters-context.tsx
    BreadcrumbNav                          ← existing component
    [Page Title Row]                       ← inline (title, count badge, invite button)
    StaffFilters                           ← _components/staff-filters.tsx
      SearchInput                          ← HTML input + 300ms debounce
      DetailFilterToggleButton             ← useState for open/close
      [Collapsible Row 2]
        Select (職位)                      ← src/components/ui/select.tsx
        Select (ブランド)                  ← static options
        Select (ステータス)                ← static options
        Button (すべてクリア)              ← ghost variant
    DataTable                              ← src/components/common/data-table/index.tsx
      staffTableColumns                    ← _components/staff-table-columns.tsx
        DataTableColumnHeader              ← existing component
        TextWithTooltip                    ← existing component
        Badge (ステータス)                 ← success / secondary variant
        DropdownMenu (…)                   ← 編集 + 削除 (HQ) or 編集 only (Manager)
          StaffDeleteDialog                ← _components/staff-delete-dialog.tsx
            AlertDialog                    ← src/components/ui/alert-dialog.tsx
            Textarea (削除理由)
    Pagination                             ← src/components/ui/pagination.tsx
    StaffInviteDialog                      ← _components/staff-invite-dialog.tsx (controlled by page)
      Dialog                              ← src/components/ui/dialog.tsx
      Select (招待時の職位)
      Select (招待時のブランド)
      Textarea (メールアドレス)
      Button (+ リストに追加)
      [招待リスト table]
      Button (招待メールを送信)
```

### 1d. nuqs Parameter Map

| URL param     | nuqs parser         | Default      | Wired to                            |
| ------------- | ------------------- | ------------ | ----------------------------------- |
| `q`           | `parseAsString`     | `''`         | Search input (300ms debounce)       |
| `position_id` | `parseAsString`     | `''`         | 職位 Select                         |
| `brand`       | `parseAsStringEnum` | `null`       | ブランド Select (top-level)         |
| `sub_brand`   | `parseAsStringEnum` | `null`       | ブランド Select (sub-brand mapping) |
| `status`      | `parseAsStringEnum` | `null`       | ステータス Select                   |
| `sort_by`     | `parseAsString`     | `'staff_id'` | DataTable column header clicks      |
| `sort_order`  | `parseAsStringEnum` | `'asc'`      | DataTable column header clicks      |
| `page`        | `parseAsInteger`    | `1`          | Pagination component                |

### 1e. React Query Key Strategy

```typescript
// List query — re-fetches on any param change
getStaffOptions({
  query: { page, limit: 50, q, position_id, brand, sub_brand, status, sort_by, sort_order },
});

// Positions — lazy, shared across filter panel and invite dialog
getStaffPositionsOptions();

// Delete mutation
useMutation({
  mutationFn: (id) => deleteCrmStaffById({ path: { id } }),
  onMutate: (id) => optimisticRemove(id),
  onError: (_, __, context) => rollback(context),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['getCrmStaff'] }),
});

// Invite mutation
useMutation({
  mutationFn: (body) => postCrmStaffInvitations({ body }),
  onSuccess: () => {
    toast.success('招待メールを送信しました');
    closeDialog();
  },
  onError: () => toast.error('送信に失敗しました。再度お試しください。'),
});
```

---

## Post-Design Constitution Re-Check

| Principle                | Status After Design                                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **I. Type Safety**       | ✅ Zod schemas drive all types; no `any`; `null` vs `undefined` explicit in all interfaces                                   |
| **II. Component Purity** | ✅ All 16 files use only existing `src/components/` primitives; no new custom primitives introduced                          |
| **III. React Query**     | ✅ `useQuery` + `useMutation` only; no `useState` for server data; optimistic UI via `onMutate`/`onError`                    |
| **IV. Contract Tests**   | ✅ 8 test scenarios documented; contract test file stub planned in tasks.md                                                  |
| **V. Performance**       | ✅ Page-based pagination prevents DOM growth; lazy position fetch avoids eager waterfall; `date-fns` format only for display |
