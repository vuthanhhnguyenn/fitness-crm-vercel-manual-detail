# Phase 0 Research: D-03 Studio Management — FR-001 Studio List Display

**Goal**: Resolve unknowns and establish best practices for Phase 1 design.

---

## Search & Filter State Management Pattern

### Decision: `nuqs` (Next.js URL Search Params)

**Finding**: The codebase uses `nuqs` for search/filter state management (confirmed in `visit-experience-list-section.tsx`).

**Implementation**:

- Use `useQueryStates` from `nuqs` to bind state to URL query parameters
- Define state schema using `parseAsString`, `parseAsInteger`, etc.
- Debounce search input at 300ms to avoid excessive API calls
- URL becomes bookmarkable and shareable; users can copy/paste filtered views

**Example Pattern**:

```typescript
const [queryStates, setQueryStates] = useQueryStates({
  search: parseAsString.withDefault(''),
  storeId: parseAsString.withDefault(''),
  studioType: parseAsString.withDefault(''),
  brand: parseAsString.withDefault(''),
  status: parseAsString.withDefault(''),
  sortBy: parseAsString.withDefault('id'),
  sortOrder: parseAsString.withDefault('asc'),
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(50),
});
```

**Rationale**: Allows users to bookmark/share filtered states; integrates seamlessly with Next.js App Router.

---

## API Data Fetching Pattern

### Decision: TanStack React Query + Generated Hooks

**Finding**: The codebase generates React Query hooks via OpenAPI (confirmed `getCrmVisitExperiencesOptions`).

**Implementation**:

- Phase 1: Mock API routes in `src/app/api/crm/studios/route.ts`
- Phase 2: Regenerate client via `npm run generate-api` or `npm run generate-client`
- Use generated hook: `getCrmStudiosOptions({ query: { ... } })`
- Leverage built-in `isLoading`, `error`, and `data` states

**Rationale**: Reduces boilerplate; ensures type safety across mock and real APIs.

---

## Zod Schemas for Validation

### Decision: Centralized Schemas in `src/app/api/_schemas/`

**Finding**: All schema definitions are centralized in `src/app/api/_schemas/` (e.g., `brand.schema.ts`, `equipment.schema.ts`).

**Implementation**:

- Create `src/app/api/_schemas/studio.schema.ts`
- Define schemas for:
  - `StudioListItemSchema` — read-only list view
  - `StudioDetailSchema` — full detail (for future FR-003)
  - `CreateStudioSchema`, `UpdateStudioSchema` — for forms (future FR-002, FR-004)
- Export all schemas for reuse in client-side form validation

**Rationale**: Single source of truth; client-side and server-side validation use the same schema.

---

## Role-Based Data Scoping

### Decision: Server-Side Scoping + Client-Side Permission Checks

**Finding**: The system has role-based access control. Data scope must be enforced per requirement FR-001-08.

**Implementation**:

- **Mock DB scoping**: Filter studios in `src/app/api/_mock-db.ts` based on user role:
  - System / Headquarter → all studios
  - Manager → studios in assigned stores only
  - Staff → studios in single assigned store only
  - Trainer / Observer → studios in assigned store only (read-only)
- **Client-side checks**: Render action buttons (edit, delete) based on `useAuth()` hook role
- Never expose studios outside user's scope in API response

**Rationale**: Defense in depth; prevents accidental exposure of unauthorized data.

---

## Pagination & Limits

### Decision: Page-Based Pagination with Configurable Limits

**Finding**: Visit Experience list uses `limit` ∈ {25, 50, 100, 200} (confirmed in `visit-experience-list-section.tsx`).

**Implementation**:

- Supported limits: 25, 50 (default), 100, 200
- Encode `page` and `limit` in URL query params via `nuqs`
- Display total count from API response
- Calculate max pages: `Math.ceil(total / limit)`

**Rationale**: Allows users to choose view density; balances performance and usability.

---

## Badge Components

### Decision: Reuse Existing Badge Components

**Finding**: Requirement FR-001-11, FR-001-12, FR-001-13 mention status badges, type badges, and brand badges. Similar badges already exist in the codebase.

**Implementation**:

- **Status Badge**: Display `active` (有効) in green, `inactive` (無効) in gray
- **Type Badge**: Use `TypeBadge` component for studio type (studio-lesson / pt / body-care)
- **Brand Badge**: Use `BrandBadge` component for brand (JOYFIT / JOYFIT24 / JOYFIT YOGA / JOYFIT+ / FIT365)

**Rationale**: Consistency with existing UI; reuses design system.

---

## Empty State Message

### Decision: Display Contextual Empty State

**Finding**: Requirement FR-001-07 requires empty-state messaging when no results match search/filter combination.

**Implementation**:

- Show when `items.length === 0 && !isLoading`
- Differentiate two cases:
  1. **No studios at all** (user's first visit, no data in scope): "登録されたスタジオがありません。新しいスタジオを登録してください。" (with "+ 新規登録" button)
  2. **No results after search/filter**: "検索またはフィルタ条件に該当するスタジオはありません。" (with "Clear filters" button)

**Rationale**: Guides users toward next action (register new or clear filters).

---

## Studio List Columns & Sortability

### Decision: 8 Columns with Sortable Subset

**Columns** (from FR-001-02):

1. Studio ID — ✅ sortable
2. Studio Name — ✅ sortable
3. Store Name — ✅ sortable
4. Studio Type (区分) — ✅ sortable
5. Capacity (定員) — ✅ sortable
6. Available Hours (利用時間) — ❌ not sortable (read-only display)
7. Brand (ブランド) — ❌ not sortable
8. Status (ステータス) — ❌ not sortable

**Implementation**:

- Add sort indicators (↑ ↓) to sortable headers
- Toggle sort direction on click (ascending → descending → none)
- Encode sort state in URL: `sortBy=name&sortOrder=asc`
- Default sort on page load: Studio ID ascending (FR-001-04)

**Rationale**: Aligns with spec; prevents confusion on non-meaningful sorts.

---

## Filter Panel State Management

### Decision: Collapsible Filter Panel with Independent Filters

**Finding**: Requirement FR-001-05 defines 4 independent filters: Store, Type, Brand, Status.

**Implementation**:

- Filters are independent; all combinations apply as AND logic (FR-001-05, AS-005)
- "Clear" button resets all 4 filters in one action (FR-001-06)
- Filter options are pre-scoped to user's data access (Assumption from spec)
- Persist filter state in URL query params via `nuqs`

**Example Schema**:

```typescript
{
  storeId: string; // single select (scoped to user's stores)
  studioType: string; // single select from enum
  brand: string; // single select from enum
  status: 'active' | 'inactive' | ''; // single select or all
}
```

**Rationale**: Reduces complexity; independent filters easier to test and debug than combined WHERE clauses.

---

## Mock Data Seed Requirements

### Decision: ≥ 3 Stores × ≥ 3 Studios per Store

**Finding**: Constitution requirement: "Seed data MUST cover ≥ 3 stores and ≥ 3 contract plans to exercise multi-store paths."

**Implementation**:

- Create ≥ 3 brand/store combinations in mock DB
- Distribute studios across stores, types, brands, statuses
- Ensure all user roles (System, HQ, Manager, Staff, Trainer, Observer) can be tested with different data scopes
- Example seed structure:
  - Store A (JOYFIT): 5 studios (mixed types, brands, statuses)
  - Store B (FIT365): 4 studios
  - Store C (JOYFIT): 3 studios

**Rationale**: Validates multi-store filtering and role-based scoping logic early in Phase 1.

---

## Performance & Constraints

### Decision: Client-Side Filtering with Debounced Search

**Finding**: SC-001 requires page load ≤ 2 seconds; SC-003 requires search response ≤ 10 seconds.

**Implementation**:

- Mock API returns full dataset (Phase 1)
- Client-side filtering happens in React after fetch
- Search debounce: 300ms (prevent hammer requests)
- Pagination: load 50 items by default; user can change limit
- No infinite scroll; keep pagination simple

**Rationale**: Sufficient for mock DB (< 1000 studios per user scope); Phase 2 moves filtering to backend if needed.

---

## Unknowns Resolved ✅

| Unknown                                | Resolution                                                     |
| -------------------------------------- | -------------------------------------------------------------- |
| Which state library for search/filter? | `nuqs` (confirmed in visit-experience-list)                    |
| How to handle role-based scoping?      | Server-side filtering in mock route + client permission checks |
| Badge components available?            | Yes, `StatusBadge`, `TypeBadge`, `BrandBadge` patterns exist   |
| Pagination strategy?                   | Page-based with limit ∈ {25, 50, 100, 200}                     |
| Filter grouping logic?                 | Independent filters with AND logic; "Clear" resets all         |
| Empty state messaging?                 | Two cases: no data vs. no results                              |
| Mock seed data scale?                  | ≥ 3 stores × ≥ 3 studios (for role testing)                    |

---

## Next Steps (Phase 1)

1. ✅ Create `src/app/api/_schemas/studio.schema.ts` (Zod schemas)
2. ✅ Create mock data in `src/app/api/_mock-db.ts` with role scoping
3. ✅ Create `src/app/api/crm/studios/route.ts` (mock GET endpoint)
4. ✅ Create `src/app/crm/studios/page.tsx` (list page component)
5. ✅ Create `src/components/crm/studio-list/studio-list-table.tsx` (table + sort logic)
6. ✅ Create filter component with collapsible panel
7. ✅ Implement `nuqs` state management
8. ✅ Write acceptance tests for all 5 user stories
