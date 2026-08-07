# Developer Quickstart: Visit/Experience Management — List Page

**Branch**: `001-visit-experience-list`  
**Route**: `/visit-experiences`  
**Phase**: 1 (mock API — no backend required)

---

## Prerequisites

- Node.js ≥ 24.0.0
- Repo cloned and `npm install` run
- On branch `001-visit-experience-list`

---

## Implementation Order

Work through files in this order to ensure dependencies are satisfied before consumers.

### Step 1 — Types

**File**: `src/types/api/visit-experience.type.ts`

Copy the TypeScript type block from [data-model.md](./data-model.md#typescript-type-file). This file defines `VisitExperience`, `VisitExperienceStatus`, `GetVisitExperiencesQuery`, `GetVisitExperiencesResponse`, `GetVisitExperiencesSummaryResponse`, and `VISIT_EXPERIENCE_STATUS_LABELS`.

---

### Step 2 — Zod Schemas

**File**: `src/app/api/_schemas/visit-experience.schema.ts`

Copy the Zod schema block from [data-model.md](./data-model.md#zod-schema-file). Used by Route Handlers for request validation and OpenAPI registration.

---

### Step 3 — Mock seed data

**File**: `src/app/api/_mock-db.ts`

Add a `visitExperiences` array to the mock DB export. Requirements:

- ≥ 10 records
- All 7 statuses represented
- ≥ 1 record with `bl_match: true`
- ≥ 2 brands: `FIT365` and `JOYFIT`
- ≥ 3 stores (e.g., `FIT365八潮店`, `FIT365草加店`, `JOYFIT24越谷店`)
- Mixed `reserved_at` dates: today + 2–3 past days
- Mix of `visit_start_at = null` and populated values
- Mix of `visit_end_actual_at = null` and populated values

Date helper: use `new Date().toISOString()` shifted by minutes/days.

---

### Step 4 — Route Handlers

#### `src/app/api/crm/visit-experiences/route.ts`

Implements `GET /api/crm/visit-experiences`. Refer to [contracts/GET-visit-experiences.md](./contracts/GET-visit-experiences.md) for filtering logic, parameter validation, and required contract tests.

Pattern to follow: `src/app/api/crm/membership-applications/route.ts`

Key steps:

1. Parse and validate query params with `GetVisitExperiencesQuerySchema`
2. Filter `db.visitExperiences` in-memory
3. Sort by `reserved_at` descending
4. Paginate and return `GetVisitExperiencesResponseSchema` payload

#### `src/app/api/crm/visit-experiences/summary/route.ts`

Implements `GET /api/crm/visit-experiences/summary`. Refer to [contracts/GET-visit-experiences-summary.md](./contracts/GET-visit-experiences-summary.md).

Key steps:

1. No query params — always compute from full `db.visitExperiences`
2. Compute the 4 KPI counts (today = `DATE(reserved_at) === today`)
3. Return `GetVisitExperiencesSummaryResponseSchema` payload

#### `src/app/api/crm/visit-experiences/[id]/route.ts`

Implements `GET /api/crm/visit-experiences/:id`. Phase 1 stub — find by `id` in `db.visitExperiences`, return 404 if not found.

---

### Step 5 — Phase 1 React Query option-factories

**File**: `src/lib/api/@tanstack/visit-experience.query.ts`

Create option-factory functions that call the mock Route Handlers. These functions have the same public interface as what Phase 2 generated hooks would produce.

```typescript
// Example — fill in full implementation
import { queryOptions } from '@tanstack/react-query';

import type {
  GetVisitExperiencesQuery,
  GetVisitExperiencesResponse,
  GetVisitExperiencesSummaryResponse,
} from '@/types/api/visit-experience.type';

export const getCrmVisitExperiencesOptions = (params?: GetVisitExperiencesQuery) =>
  queryOptions<GetVisitExperiencesResponse>({
    queryKey: ['crm', 'visit-experiences', params ?? {}],
    queryFn: async () => {
      const qs = new URLSearchParams();
      // append params to qs ...
      const res = await fetch(`/api/crm/visit-experiences?${qs}`);
      if (!res.ok) throw new Error('Failed to fetch visit experiences');
      return res.json();
    },
  });

export const getCrmVisitExperiencesSummaryOptions = () =>
  queryOptions<GetVisitExperiencesSummaryResponse>({
    queryKey: ['crm', 'visit-experiences', 'summary'],
    queryFn: async () => {
      const res = await fetch('/api/crm/visit-experiences/summary');
      if (!res.ok) throw new Error('Failed to fetch summary');
      return res.json();
    },
  });
```

> **Phase 2 migration**: Delete this file and switch components to import from `src/lib/api/@tanstack/react-query.gen` after running `npm run generate-api`.

---

### Step 6 — Route registration

Run the route generation script to add `/visit-experiences` and `/visit-experiences/[id]` to `routes.config.ts`:

```bash
npm run generate-routes
```

This must be run **after** creating the page folders in Step 7.

---

### Step 7 — Page and components

Create the following files. Refer to the spec for behaviour and the design mockup (`fitness-crm-ui:src/pages/visit-experience-list.tsx`) for visual layout reference.

#### `src/app/(private)/visit-experiences/page.tsx`

RSC. Renders `<VisitExperienceHeader>`, wraps `<VisitExperienceKpi>` and `<VisitExperienceListSection>` in `<Suspense>`.

#### `src/app/(private)/visit-experiences/[id]/page.tsx`

RSC stub for Phase 1. Displays a "coming soon" placeholder or redirects back. This route must exist so row click-through navigation resolves without a 404.

#### `src/app/(private)/visit-experiences/_components/visit-experience-header.tsx`

`'use client'`. Breadcrumb (`BreadcrumbNav` variant `section`) with `Eye` icon. No data fetching.

#### `src/app/(private)/visit-experiences/_components/visit-experience-kpi.tsx`

`'use client'`. Fetches `getCrmVisitExperiencesSummaryOptions()` via `useQuery`. Renders 4 KPI cards using `Card + CardContent` from shadcn/ui. Applies tone classes:

- 見学中: `text-warning`
- 入会申請済: `text-success`
- 当日キャンセル: `text-destructive` when count > 0, else `text-foreground`
- 本日申込: `text-foreground`
  Includes skeleton loading state.

#### `src/app/(private)/visit-experiences/_components/visit-experience-list-section.tsx`

`'use client'`. The main section containing:

1. All filter state via `nuqs` (see [research.md Decision 3](./research.md#decision-3))
2. Active filter banner (`Alert`) when any filter/search is active
3. Search input + filter toggle button with active-count badge
4. Collapsible filter panel (4 `Select` dropdowns) + clear-all button
5. `DataTable` or shadcn `Table` with 9 columns (see spec FR-002)
6. Empty state when `items.length === 0`
7. Pagination footer: record summary + `TablePagination` + page-size `Select`

Fetches `getCrmVisitExperiencesOptions(queryParams)` via `useQuery`. Wraps data region in `DataStateBoundary` (or equivalent skeleton).

---

### Step 8 — Sidebar navigation

**File**: `src/components/layout/app-sidebar.tsx`

Add a menu item for 見学・体験管理:

```typescript
{
  label: '見学・体験管理',
  icon: Eye,           // from lucide-react
  href: '/visit-experiences',
},
```

Import `Eye` from `lucide-react`. Insert the item in appropriate position in `menuItems`.

---

### Step 9 — Type check + lint

```bash
npm run type-check   # must exit 0
npm run lint         # must exit 0
```

Fix any errors before opening a PR.

---

## Phase 2 Migration Checklist (future)

When DEV-BE publishes the OpenAPI spec for visit-experiences:

- [ ] Run `npm run generate-api` to regenerate `src/lib/api/`
- [ ] Delete `src/lib/api/@tanstack/visit-experience.query.ts`
- [ ] Update component imports to use generated option-factories from `react-query.gen`
- [ ] Remove manual types from `src/types/api/visit-experience.type.ts` (now covered by `types.gen.ts`)
- [ ] Remove mock Route Handlers in `src/app/api/crm/visit-experiences/`
- [ ] Remove seed data from `src/app/api/_mock-db.ts`
- [ ] Run contract tests against real API
