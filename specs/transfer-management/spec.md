# Feature Specification: Transfer Management List — A-02 移籍管理一覧

**Feature Branch**: `feat/transfer-management-list`
**Base Branch**: `feat/implement-prototype`
**Feature ID**: A-02 (FR-001)
**Created**: 2026-04-24
**Status**: Clarified
**Document Version**: 260424_v1
**Project**: Move to Happy — 会員管理基盤システム（CRM）刷新
**Brands**: JOYFIT / FIT365 (共通)

---

## Scope

This spec covers **FR-001 移籍申請一覧の表示・絞り込み** only.
FR-002 (承認・否認操作) and FR-003 (JOYFIT自動移籍フロー) are **out of scope** for this iteration.

---

## Open Questions

> Items marked `[NEEDS CLARIFICATION]` must be resolved before implementation begins.

1. ✅ **Route path**: `/members/transfers` — Feature A-02 belongs to the A-series (会員管理), so the route is nested under members. The sidebar commented-out `/members/transfer` will be enabled.

2. ✅ **Pagination page size**: Default **20 rows/page** (same as Members list). — _Confirmed 2026-04-24_

3. ✅ **申請日 filter granularity**: **Preset-only** (`今月 / 先月 / 今年 / 全期間`). No custom date-range picker in this iteration. — _Confirmed 2026-04-24_

4. ✅ **Brand field**: `brand` is a **dedicated field** (`"joyfit" | "fit365"`) on the `TransferRequest` API entity — not inferred from store name prefix. — _Confirmed 2026-04-24_

5. ✅ **Row click / detail link**: **Navigate to `/members/transfers/[id]`**. A stub detail page must be included in this branch. — _Confirmed 2026-04-24_

---

## Feature Overview

| Item           | Detail                                            |
| -------------- | ------------------------------------------------- |
| Screen name    | 移籍管理一覧                                      |
| Route          | `/members/transfers`                              |
| Nav section    | 会員管理 group in `AppSidebar`                    |
| Access roles   | Headquarter, Manager, Staff, Observer (read-only) |
| Excluded roles | Trainer                                           |

### Purpose

The screen gives staff a consolidated view of all transfer requests (移籍申請).
Users can filter, sort, and navigate to individual transfer cases.
Approval/denial actions (FR-002) are deferred to a later sprint.

> **Source**: `A-02.md §概要` — "本画面はA-01-01のステータス変更で申請された移籍案件を一覧で俯瞰・管理する専用画面である。"

### Business Context (from A-02.md)

| Brand  | 移籍方式                                  |
| ------ | ----------------------------------------- |
| JOYFIT | 自動移籍（移籍元承認 → システム自動実行） |
| FIT365 | 手動移籍（移籍元・移籍先双方の2段階承認） |

Both brands share the same list screen; operational flow differences are handled in FR-002/FR-003 (out of scope here).

---

## User Scenarios & Acceptance Criteria

### Story 1 — Transfer List Display (Priority: P1)

**As** a Headquarter user,
**I need** to see a paginated table of all transfer requests,
**So that** I can monitor ongoing and historical transfers across all stores.

**Acceptance Criteria**:

1. **Given** an HQ user navigates to `/members/transfers`,
   **Then** a `<DataTable>` renders with columns in this order:
   `[申請ID, 会員名, 移籍元店舗, 移籍先店舗, 申請日, 移籍予定日, ステータス, actions (…)]`.

2. **Given** the API returns transfer records,
   **Then** each `ステータス` cell renders a colour-coded `<Badge>`:
   - `申請中` → blue outline badge with dot
   - `店舗承認済` → amber outline badge with dot (※ UI label for spec status "移籍元承認待ち")
   - `承認済` → green outline badge with dot
   - `却下` → destructive outline badge with dot
   - `移籍完了` → muted secondary badge (no dot)

3. **Given** the page loads with no data,
   **Then** an empty-state message `該当のデータがありません。` is shown inside the table body spanning all columns. If active filters exist, a `条件をクリア` button is also shown.

4. **Given** a Manager user navigates to `/members/transfers`,
   **Then** only rows where `fromStore` or `toStore` belongs to the Manager's branch are shown.

5. **Given** a Staff user navigates to `/members/transfers`,
   **Then** only rows where `fromStore` or `toStore` is the Staff's own store are shown.

6. **Given** a Trainer navigates to `/members/transfers`,
   **Then** they are redirected to `/403`.

7. **Given** an Observer user navigates to `/members/transfers`,
   **Then** they can view the list (read-only) but no mutation actions are available.

---

### Story 2 — Quick Search (Priority: P2)

**As** a Headquarter or Manager user,
**I need** to type a member name or application ID to narrow the list instantly,
**So that** I can find a specific case without scrolling.

**Acceptance Criteria**:

1. **Given** the user types in the search input,
   **Then** the table filters showing only rows where `申請ID` or `会員名` contains the search string (case-insensitive). The search is query-param driven via `nuqs`.

2. **Given** the search input is cleared,
   **Then** all rows within the current filter scope are shown again.

3. The search input placeholder text is `申請ID・会員名で検索`.

---

### Story 3 — Advanced Filters (Priority: P2)

**As** a Headquarter user,
**I need** to filter by ステータス, 移籍元店舗, 移籍先店舗, ブランド, and 申請日範囲,
**So that** I can focus on a specific subset of transfer cases.

**Acceptance Criteria**:

1. **Given** the user clicks `詳細フィルター`,
   **Then** a filter bar expands below the search row, showing five `<Select>` controls in this order: ステータス, 移籍元店舗, 移籍先店舗, ブランド, 申請日.

2. **Given** a filter is set to a non-default value,
   **Then** the `詳細フィルター` button changes to the `default` variant and shows an active-filter count badge.

3. **Given** the user clicks `すべてクリア`,
   **Then** all filters reset to their default values.

4. All filter state is persisted in URL search params via `nuqs` so that refreshing the page preserves the filter state.

5. **Filter options**:

   | Filter     | Default label    | Options                                                      |
   | ---------- | ---------------- | ------------------------------------------------------------ |
   | ステータス | 全ステータス     | 申請中, 店舗承認済, 承認済, 却下, 移籍完了                   |
   | 移籍元店舗 | 全店舗（移籍元） | Store list from API                                          |
   | 移籍先店舗 | 全店舗（移籍先） | Store list from API                                          |
   | ブランド   | 全ブランド       | JOYFIT, FIT365                                               |
   | 申請日     | 全期間           | 今月, 先月, 今年 (preset-only — no custom date-range picker) |

---

### Story 4 — Pagination (Priority: P3)

**As** any authorised user,
**I need** paginated results with previous/next navigation,
**So that** the page remains performant with large datasets.

**Acceptance Criteria**:

1. **Given** results exceed one page,
   **Then** the footer shows `全 N 件中 X–Y 件を表示` and prev/next buttons.

2. **Given** the user is on page 1,
   **Then** the `前へ` button is disabled.

3. **Given** the user is on the last page,
   **Then** the `次へ` button is disabled.

4. Page state lives in URL search param `page` via `nuqs`.

---

### Story 5 — Row Actions Menu (Priority: P3)

**As** a Headquarter or Manager user,
**I need** a `…` actions menu per row,
**So that** I can access detail view quickly.

**Acceptance Criteria**:

1. **Given** the user opens the `…` menu on a row,
   **Then** a `<DropdownMenu>` appears with item `詳細を表示` (Eye icon).

2. **Given** the user clicks `詳細を表示` (or clicks the row itself),
   **Then** they navigate to `/members/transfers/[id]`. A stub detail page must exist at this route in the branch.

---

## UI Reference

- **Prototype file**: `src/pages/transfer-list.tsx` in `fitness-crm-ui` repo
- **Cache path**: `.cache/fitness-crm-ui/`
- **UI slug**: `transfer-list`

### Layout Description (from prototype)

```
<AppSidebar>  (shared)
<SidebarInset>
  <AppHeader>  (shared)
  <main class="p-6 bg-muted/40">
    ┌── Page Header ──────────────────────────────────┐
    │  h1: 移籍管理    Badge: N件                      │
    └─────────────────────────────────────────────────┘
    ┌── Card ──────────────────────────────────────────┐
    │  Toolbar:                                        │
    │    [ Search input (max-w-400px) ]  [ 詳細フィルター btn ] │
    │  (expandable filter bar)                         │
    │    [ ステータス ] [ 移籍元店舗 ] [ 移籍先店舗 ]   │
    │    [ ブランド ] [ 申請日 ]  [ すべてクリア ]       │
    │  ─────────────────────────────────────────────  │
    │  Table:                                          │
    │    申請ID | 会員名 | 移籍元店舗 | 移籍先店舗      │
    │    申請日 | 移籍予定日 | ステータス | (…)          │
    │  ─────────────────────────────────────────────  │
    │  Pagination footer                               │
    └─────────────────────────────────────────────────┘
  </main>
</SidebarInset>
```

### Status Badge Colour Mapping

| ステータス | Variant   | CSS classes                                                                       |
| ---------- | --------- | --------------------------------------------------------------------------------- |
| 申請中     | outline   | `bg-info/15 text-info border-info/20` + dot `bg-info`                             |
| 店舗承認済 | outline   | `bg-warning/15 text-warning border-warning/20` + dot `bg-warning`                 |
| 承認済     | outline   | `bg-success/15 text-success border-success/20` + dot `bg-success`                 |
| 却下       | outline   | `bg-destructive/15 text-destructive border-destructive/20` + dot `bg-destructive` |
| 移籍完了   | secondary | (default muted, no dot)                                                           |

---

## Data Model

### TransferRequest (API response item)

| Field             | Type                   | Description                                    |
| ----------------- | ---------------------- | ---------------------------------------------- |
| `id`              | `string`               | Application ID (e.g., `TR-001`)                |
| `member_id`       | `string`               | Member ID                                      |
| `member_name`     | `string`               | Member full name                               |
| `from_store_id`   | `string`               | 移籍元店舗 ID                                  |
| `from_store_name` | `string`               | 移籍元店舗 display name                        |
| `to_store_id`     | `string`               | 移籍先店舗 ID                                  |
| `to_store_name`   | `string`               | 移籍先店舗 display name                        |
| `brand`           | `"joyfit" \| "fit365"` | Brand — dedicated API field on TransferRequest |
| `applied_at`      | `string` (ISO 8601)    | Application date                               |
| `scheduled_date`  | `string` (ISO 8601)    | Planned transfer date                          |
| `status`          | `TransferStatus`       | See enum below                                 |

### TransferStatus Enum

```ts
enum TransferStatus {
  Pending = 'pending', // 申請中
  FromStoreApproved = 'from_store_approved', // 店舗承認済
  Approved = 'approved', // 承認済
  Rejected = 'rejected', // 却下
  Completed = 'completed', // 移籍完了
}
```

> **Note on status labels** (from `A-02.md`): The business spec names statuses as "移籍元承認待ち" / "移籍先承認待ち". The UI prototype consolidates these into the display label `店舗承認済`. Confirm with PO whether this consolidation is intentional.

---

## API Design

### GET /crm/transfers

**Query parameters** (all optional):

| Param            | Type                                          | Description                              |
| ---------------- | --------------------------------------------- | ---------------------------------------- |
| `page`           | `number`                                      | Page number (default: 1)                 |
| `limit`          | `number`                                      | Page size (default: **20**)              |
| `search`         | `string`                                      | Free-text search on `id` + `member_name` |
| `status`         | `TransferStatus`                              | Filter by status                         |
| `from_store_id`  | `string`                                      | Filter by 移籍元店舗                     |
| `to_store_id`    | `string`                                      | Filter by 移籍先店舗                     |
| `brand`          | `"joyfit" \| "fit365"`                        | Filter by brand                          |
| `applied_period` | `"this_month" \| "last_month" \| "this_year"` | Filter by 申請日 period                  |
| `sort_by`        | `string`                                      | Column to sort (default: `applied_at`)   |
| `sort_order`     | `"asc" \| "desc"`                             | Sort direction (default: `desc`)         |

**Response shape**:

```json
{
  "transfers": [ TransferRequest ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "total_pages": 3
  }
}
```

---

## File & Directory Plan

```
src/
├── types/
│   └── transfer.type.ts             # TransferStatus enum, TransferListItem interface
│
├── app/
│   ├── api/
│   │   ├── _schemas/
│   │   │   └── transfer.schema.ts   # Zod schemas for transfer feature
│   │   └── crm/
│   │       └── transfers/
│   │           └── route.ts         # GET /crm/transfers
│   │
│   └── (private)/
│       └── members/
│           └── transfers/
│               ├── page.tsx                          # List page
│               ├── [id]/
│               │   └── page.tsx                      # Stub detail page (navigable from list)
│               ├── _components/
│               │   ├── transfer-table-columns.tsx
│               │   └── transfer-filters.tsx
│               ├── _contexts/
│               │   └── transfer-filters-context.tsx
│               └── _hooks/
│                   └── use-transfer-filters.ts
```

### Sidebar navigation change

Enable the commented-out `移籍` nav item in `app-sidebar.tsx`, pointing to `/members/transfers`.

---

## Constraints & Rules

- No FR-002 or FR-003 functionality (承認・否認, 自動移籍) in this scope.
- Row click / `詳細を表示` link: navigate to `/members/transfers/[id]`. A stub detail page at this route is in scope for this branch.
- Filter & pagination state must use `nuqs` URL search params.
- All data fetches via generated React Query option-factories (`@tanstack/react-query.gen.ts`).
- No raw `fetch` calls inside components.
- Brand filter: `"joyfit"` → stores with prefix `JOYFIT…`; `"fit365"` → prefix `FIT365…` (server-side filtering).
- Scope rules (権限マトリクス) enforced server-side; client respects role from auth context.
- Zod schema is the single source of truth for request/response types.
- Run `npm run generate-openapi && npm run generate-api` after adding the new route.
- No `git checkout` to a new branch required — work directly on `feat/implement-prototype`.

---

## Permissions Matrix (from A-02.md)

| Role        | 一覧参照 | 閲覧スコープ         | 承認・否認操作  |
| ----------- | -------- | -------------------- | --------------- |
| Headquarter | ○        | 全店舗・全ブランド   | ○ (FR-002 のみ) |
| Manager     | ○        | 管轄店舗             | ○ (FR-002 のみ) |
| Staff       | ○        | 所属店舗関連         | ○ 所属店舗分    |
| Observer    | ○        | 所属店舗（参照のみ） | ×               |
| Trainer     | ×        | —                    | ×               |

---

## Out of Scope

- FR-002: 承認・否認操作
- FR-003: JOYFIT自動移籍フロー
- Transfer detail page (`/members/transfers/[id]`)
- Notification / email flow
- Export / download functionality

---

## Remaining Open Questions

✅ All open questions resolved on 2026-04-24. Spec is **Clarified** and ready for `speckit.plan`.
