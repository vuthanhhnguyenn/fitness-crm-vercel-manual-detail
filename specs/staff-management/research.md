# Research: Staff List — Y-01 スタッフ・権限管理

**Feature**: `001-staff-list`  
**Date**: 2026-04-08  
**Phase**: 0 — Research & Pattern Archaeology

---

## 1. Pagination Strategy: Infinite Scroll vs. Traditional Pagination

**Decision**: Traditional pagination (page-number) for the staff list.

**Rationale**: The members list uses `useInfiniteQuery` with infinite-scroll (IntersectionObserver). However, the staff list is a management screen (not an exploratory consumer list) where HR/Operations users need to jump to a specific page or share a URL representing page N. Page-based URL params (`page=3`) make this possible with nuqs, while infinite scroll does not expose a page anchor. The spec already calls out `nuqs` `page` param for this reason. Page size of 50 is consistent with Constitution Principle V.

**Implementation**: `useQuery` with `getCrmStaffOptions` passing `{ page, limit: 50, ...queryParams }`. Pagination UI uses the existing `<Pagination>` component from `src/components/ui/pagination.tsx`. The `DataTable` component already accepts `totalRows` and `totalRowsFetched` for the footer counter.

**Alternatives considered**:

- `useInfiniteQuery` (members pattern): rejected — no deep-link to page N; scroll position lost on filter change.
- Cursor-based pagination: rejected — overkill for a bounded internal dataset; `page` param is simpler.

---

## 2. Sorting: Client-side vs. Server-side

**Decision**: Server-side sorting via `sort_by` + `sort_order` query params.

**Rationale**: Page size 50 means the client only holds one page of data at a time; sorting the 50 visible rows client-side would give wrong results (items 51–N are not loaded). Server-side sorting ensures correctness across all records. The API mirrors the members pattern where `sort_by`/`sort_order` params are passed to a filter function over the mock DB.

**Default**: `sort_by=staff_id&sort_order=asc` (Q-08 confirmed).

**Sortable columns**: `staff_id`, `name_kanji`, `position_name`, `status`, `last_login_at`.

---

## 3. Filter Panel: Open/Closed State Management

**Decision**: Local `useState<boolean>` — NOT nuqs.

**Rationale**: The spec explicitly states "The collapsed/expanded state of the filter panel is NOT persisted in the URL; it always opens collapsed on hard reload." A simple `useState(false)` in the page component (or filter component) is sufficient. Filter _values_ are URL-persisted via nuqs.

**Active-filter indicator**: Track `activeFilterCount` by counting non-null/non-default values among `position_id`, `brand`, `sub_brand`, `status`. Render a numeric `<Badge>` inside the `詳細フィルター` button when `activeFilterCount > 0` and panel is collapsed (Q-05 deferred; default to numeric count badge matching pattern used on members page if one exists, otherwise a simple dot indicator).

---

## 4. Role Scoping: How `branch_id` Filter Is Applied

**Decision**: Server-side scope injection — client sends no explicit scope param.

**Rationale** (Q-09 confirmed): `GET /crm/staff` handler reads the session JWT to determine the caller's role and `branch_id`. For HQ: no filter applied. For Manager: resolve `manager.branch_id → Branch.store_ids[]` and filter `staff.store_id IN (store_ids)`. The client is unaware of this filter. This mirrors how `src/middleware.ts` injects session info — the route handler reads `getServerSession` or equivalent.

In the mock environment: `db.branches` table will store `{ branch_id, name, store_ids[] }`. The Manager seed record will have a `branch_id` pointing to a branch with a subset of stores; the route handler filters mock data accordingly.

---

## 5. Delete Flow: Optimistic vs. Pessimistic UI

**Decision**: Optimistic removal with rollback on error.

**Rationale**: Standard React Query mutation pattern. `useMutation` with `onMutate` (remove from queryData cache), `onError` (restore row), `onSuccess` (invalidate query to refetch fresh data). This gives instant UI feedback without needing a loading spinner on the row.

**Cache key**: `getStaffOptions({ query: { ...currentParams } })`. On delete success, call `queryClient.invalidateQueries({ queryKey: getStaffQueryKey() })` to refresh the paginated list.

---

## 6. Invite Dialog: State Management

**Decision**: Component-local state for 招待リスト staging.

**Rationale**: The invite dialog is self-contained — position select, brand select, email textarea, and staging list are all ephemeral UI state that should reset when the dialog closes. No need for nuqs or context; `useState` in `StaffInviteDialog` is sufficient.

**Mutation**: `useMutation` calling `POST /crm/staff/invitations`. On success: `onSuccess` handler calls `toast.success(...)` and closes dialog (parent passes `open`/`onOpenChange`).

---

## 7. Position Options: Lazy Fetch vs. Eager

**Decision**: Lazy fetch on panel first-expand; cached for session lifetime.

**Rationale**: The spec states "lazy-fetch only when the 詳細フィルター panel first expands." Using `useQuery` with `enabled: isPanelOpen` achieves this. The query result is cached by React Query's default `gcTime`, so subsequent collapses/expands do not re-fetch.

**Shared use**: The same position options are needed in the Invite Dialog's 招待時の職位 select. Both components can use the same `getStaffPositionsOptions` query key — React Query deduplicates the request.

---

## 8. /settings Layout Wrapper

**Decision**: Create `src/app/(private)/settings/layout.tsx` as a pass-through layout.

**Rationale**: The `/settings` route group does not yet exist. App Router requires a `layout.tsx` at each route segment. A minimal layout (simply wrapping children) is sufficient for now; future settings pages can share it.

---

## 9. nuqs Hook Architecture

**Decision**: Single `useStaffFilters` hook (mirrors `useMembersFilters` pattern) + `StaffFiltersContext` for shared access between page and filter component.

**Parameters** (from spec):

| nuqs key      | parser                                                        | default      |
| ------------- | ------------------------------------------------------------- | ------------ |
| `q`           | `parseAsString`                                               | `''`         |
| `position_id` | `parseAsString`                                               | `''`         |
| `brand`       | `parseAsStringEnum(['joyfit','fit365'])`                      | `null`       |
| `sub_brand`   | `parseAsStringEnum(['joyfit_plus','joyfit_yoga','joyfit24'])` | `null`       |
| `status`      | `parseAsStringEnum(['active','inactive'])`                    | `null`       |
| `sort_by`     | `parseAsString`                                               | `'staff_id'` |
| `sort_order`  | `parseAsStringEnum(['asc','desc'])`                           | `'asc'`      |
| `page`        | `parseAsInteger`                                              | `1`          |

**Debounce**: 300 ms for `q` only (all other filters fire immediately on select change).

---

## 10. Mock DB Extension

**Required additions to `_mock-db.ts`**:

1. **`db.branches`**: `Branch[]` — seed 2 branches (`BRN-001` with stores A,B,C; `BRN-002` with stores D,E)
2. **`db.staff`**: `StaffListItem[]` — seed 8 records matching spec screenshots (STF-001 … STF-008), covering both brands, multiple positions, both statuses, and both branches
3. **`db.positions`**: `Position[]` — 11 entries matching FR-001-E1 list with stable `pos-*` IDs
4. **`db.staff.delete(id, reason?)`** — removes by ID; stores deletion reason in a `StaffDeletion[]` audit log
5. **`db.staff.invitations.create(invitations[])`** — appends to a `StaffInvitation[]` log (mock; does not send real email)

---

## 11. Contract Test Requirements (Constitution IV)

The following test scenarios are required before PR merge (SC-005):

| Route                         | Scenario                         | Expected                                 |
| ----------------------------- | -------------------------------- | ---------------------------------------- |
| `GET /crm/staff`              | Happy path (HQ, no filters)      | 200 + `GetStaffResponseSchema` valid     |
| `GET /crm/staff`              | Zero results (aggressive filter) | 200 + empty `staff[]`, `total=0`         |
| `GET /crm/staff`              | Invalid `sort_by` value          | 400 + `ErrorResponseSchema`              |
| `GET /crm/staff/positions`    | Happy path                       | 200 + `GetPositionsResponseSchema` valid |
| `DELETE /crm/staff/[id]`      | HQ user, valid ID                | 200 + row removed                        |
| `DELETE /crm/staff/[id]`      | Non-existent ID                  | 404 + `ErrorResponseSchema`              |
| `POST /crm/staff/invitations` | Valid payload                    | 201 + `InviteStaffResponseSchema`        |
| `POST /crm/staff/invitations` | Empty invitations array          | 400 + `ErrorResponseSchema`              |

---

## 12. Deferred Questions (low impact)

| Question                            | Decision for implementation                                                                                                                                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q-02: 職位 single vs. multi-select  | **Single-select** — plain `<Select>`, scalar `position_id` param. Multi-select can be added later without breaking the API contract (the API already supports a scalar param).                                 |
| Q-04: 職位 filter role-scoping      | **Show all 11** for all roles. `GET /crm/staff/positions` returns the full list; Managers may see positions outside their scope but results will simply be empty for those (consistent with spec empty state). |
| Q-05: Active-filter indicator style | **Numeric count badge** — `<Badge variant="secondary" className="ml-1 h-4 w-4 ...">N</Badge>`. Consistent with how active states are signalled elsewhere in shadcn badge usage in this project.                |
