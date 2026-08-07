# Phase 0 Research: Lesson Content Master List & Search

**Feature**: 007-lesson-content-list | **Date**: 2026-06-25

This document resolves the unknowns in the Technical Context and records the key design
decisions, each grounded in the constitution and existing codebase patterns.

---

## D1. List page architecture (Suspense + nuqs + DataTable)

- **Decision**: Model the page on `src/app/(private)/members/page.tsx`. `page.tsx` is a thin
  server component that renders `<Suspense fallback={<Loading />}>` around a `'use client'`
  `LessonsPageContent`. nuqs `useQueryStates` (which requires Suspense) drives all toolbar state.
- **Rationale**: This is the established, constitution-compliant list pattern (Principle IV/V).
  Reusing it guarantees DataTable, pagination, and URL-state behavior are consistent.
- **Alternatives considered**: A fully server-rendered table (rejected — search/sort/filter are
  interactive and need client state); local React state instead of nuqs (rejected — Principle V
  mandates URL search params for state outliving a component tree).

## D2. Tabs (Studio / Personal / Body care)

- **Decision**: Use shadcn `Tabs/TabsList/TabsTrigger/TabsContent` (line style), with the active
  tab persisted as a nuqs `parseAsStringEnum<'studio' | 'personal' | 'bodycare'>` param defaulting
  to `studio`. Studio and Body care render `LessonTable`; Personal renders `PersonalTrainingTable`.
- **Rationale**: Matches the prototype's line-style tabs and the `lesson-schedules` tabbed-list
  precedent; URL-persisted tab keeps deep links and refresh stable.
- **Alternatives considered**: Three separate routes (rejected — spec defines one page with tabs);
  React state for active tab (rejected — Principle V).

## D3. Active search, sort, and filter (client vs server)

- **Decision**: Drive search/sort/filter/include-deleted/page through nuqs (template:
  `use-members-filters.ts`), and pass them as query params to the mock Route Handler, which applies
  filtering, sorting, and pagination server-side (mirroring `crm/members`). Search is debounced
  (~500 ms) before hitting the query. Sorting is controlled via DataTable `tableOptions`
  (`manualSorting`, `onSortingChange`, `state.sorting`) toggling asc/desc.
- **Rationale**: Keeps the hook signature identical to Phase 2 (where the real API performs these
  operations) and avoids leaking full datasets to the client. Reuses the proven members filter
  parsing (`z.preprocess` for arrays, `z.coerce.number` for page/limit).
- **Alternatives considered**: Pure client-side filtering of a fully-fetched list (rejected —
  would diverge from the Phase 2 hook contract and the constitution's React Query ownership model).

## D4. Loading / error / empty states

- **Decision**: Wrap each tab's table region in `DataStateBoundary` with `isLoading`/`isError`/
  `isEmpty` from the React Query result, passing a skeleton for the loading branch. The `DataTable`
  itself also renders skeleton rows on `isLoading`; the boundary's skeleton covers the full region
  for the first load (FR-001-P1-14). Errors use the shared `<Error onRetry />` (FR-001-P1-15);
  empty uses zero rendered rows / the shared `<Empty />` per the spec's empty-state note.
- **Rationale**: Constitution Principle IV requires skeleton placeholders for primary content and a
  `DataStateBoundary` (or equivalent) around fetching regions. These components already exist.
- **Alternatives considered**: Spinner-only loading (rejected — Principle IV bans spinner-only for
  primary content); building a new empty/error component (rejected — Principle IV component reuse).

## D5. Mock data model — enrich `_mock-db.ts`

- **Decision**: The existing `db.lessons` (`{ id, name, lesson_type, duration }`) is insufficient
  for FR-001-P1-02. Add two richer mock collections: `lessonContents` (studio + body care rows with
  id, name, brand, duration, pricingType, status, genderRestriction, lessonCategory, category,
  storeId, isDeleted, optional reservation metrics) and `personalPlans` (id, name, description,
  category, duration, price, reservations, maxReservations, brand, status, storeId, isDeleted).
  Each exposes `_rows`, `_seed()`, `getList()`. Seed ≥ 3 stores and ≥ 3 plans (Principle II).
- **Rationale**: Mock DB must compile against `types.gen.ts` and support every required column and
  the include-deleted / store-scope behavior. Reusing the thin `db.lessons` would block the spec.
- **Alternatives considered**: Extending `db.lessons` in place (rejected — its `lesson_type` /
  shape is already consumed by the existing `crm/lessons` schedule endpoint; a separate collection
  avoids regressions).

## D6. Mock endpoints + Zod schemas

- **Decision**: Add `GET /api/crm/lesson-contents` (studio + bodycare, filtered by `brand`/scope)
  and `GET /api/crm/personal-plans`. Define `lesson-content.schema.ts` in `src/app/api/_schemas/`
  with `Get*QuerySchema` (search, lesson_category, category, brand, status, include_deleted,
  store_id(s), sort_by, sort_order, page, limit) and `Get*ResponseSchema` (rows + pagination).
  Register both via `registerRoute()` and add imports to `src/app/api/_routes/index.ts`.
- **Rationale**: Follows the `crm/members` route + schema pattern exactly; schemas feed OpenAPI
  generation so the client types/hooks regenerate cleanly. Exported schemas are reusable client-side.
- **Alternatives considered**: One combined endpoint with a `tab` discriminator (rejected — the two
  tabs have different row shapes; separate endpoints keep response types clean and Phase-2 aligned).

## D7. Store scoping (FR-001-P1-07)

- **Decision**: There is **no global selected-store state** in the app today (the header store
  selector is static UI). Derive scope from `useAuthUser()` role (Headquarter/System/Manager =
  all stores) plus an optional page-local `store_id` filter passed as a query param, mirroring the
  `lesson-schedules` page approach. The mock handler scopes rows by `store_id`/role when provided.
- **Rationale**: Matches the only existing store-scoping precedent and avoids inventing a global
  store (Principle V forbids global stores without amendment). Recorded as an assumption in the plan.
- **Alternatives considered**: Introducing a global selected-store atom/context (rejected —
  requires a constitution amendment and is out of Phase 1 scope).

## D8. Navigation & routing

- **Decision**: Use the typed `navigate()` helper from `@/lib/routes/routes.util` for the row→detail
  link (`/lessons/[id]`) and the header "New Lesson Creation" action (`/lessons/create`). The route
  config regenerates automatically when the `/lessons` page folder is added. Detail/create pages
  themselves are out of scope (Phase 1 list only); navigation targets are wired but their pages are
  defined by FR-002/FR-003 in later features.
- **Rationale**: Constitution + workspace rule require `navigate()`; raw `router.push` with string
  literals is forbidden.
- **Alternatives considered**: Hardcoded hrefs (rejected — type-unsafe, violates routing rule).

---

## Open items / assumptions carried forward

- **Prototype not checked out**: `.specify/external/ui/src/pages/lesson.tsx` and `D-02.md` are
  empty submodules; column/layout details rely on the spec's traceability matrix. Run
  `git submodule update --init` if exact prototype fidelity is needed during implementation.
- **Detail/Create routes**: navigation entry points are in scope; their destination pages are not.
- **Pagination**: follow members' paginated `useQuery` + `TablePagination` (page size from
  `@/constants/app.constants`); infinite scroll is available but unnecessary for small masters.

**Result**: All NEEDS CLARIFICATION resolved. Ready for Phase 1 design.
