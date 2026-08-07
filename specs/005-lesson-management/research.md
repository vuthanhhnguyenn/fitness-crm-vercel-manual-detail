# Research: D-01 Lesson Schedule Management

## Decision: Implement Phase 1 with Mock CRM Route Handlers

**Decision**: Build the screen against local mock APIs under `/api/crm/lesson-schedules/*`, backed by `src/app/api/_mock-db.ts`, Zod schemas, OpenAPI registration, and generated React Query hooks.

**Rationale**: The constitution requires Phase 1 to be a complete UI using mock route handlers without a backend dependency. Existing modules use `src/app/api/crm/*`, `src/app/api/_schemas/*`, OpenAPI route registration, and generated React Query option factories.

**Alternatives considered**:

- Static client-side arrays copied from the prototype: rejected because Phase 1 must exercise local data interactions and loading states.
- Direct component `fetch` calls: rejected by constitution Principle V.
- Real backend integration: rejected because D-01 is still Phase 1 and backend OpenAPI is not the source for this plan.

## Decision: Use `/lesson-schedules` as the Private Route

**Decision**: Create a new private App Router route at `src/app/(private)/lesson-schedules/page.tsx` and display the Phase 1 UI title "Reservation Management".

**Rationale**: The feature is D-01 lesson schedule/list management, while clarification explicitly keeps the Phase 1 prototype title. The route name stays domain-specific and avoids implying a broader cross-category reservation-management screen, which is out of scope.

**Alternatives considered**:

- `/reservations`: rejected because the cross-category reservation list is out of scope for Phase 1.
- `/lessons`: rejected because this screen is specifically schedule/list management, not D-02 lesson content master.

## Decision: Use URL State for View, Filters, Sorting, and Focus

**Decision**: Store view axis, view mode, date/week, store filter, studio filter, instructor filter, sorting, and focused store in URL search params via `nuqs`.

**Rationale**: The constitution requires URL search params for client-side state that outlives a single component tree. Schedule filters and sorting should be shareable, restorable, and testable.

**Alternatives considered**:

- Local-only React state: rejected because filter/sort state should survive refresh and be linkable.
- Global store: rejected by constitution unless amended.

## Decision: Use DataTable for Sortable Tables

**Decision**: Use `src/components/common/data-table` for the list view and area summary table where sorting is required.

**Rationale**: The constitution requires `DataTable` when filtering, sorting, row selection, or query-state sync is needed. Existing list pages already wire `SortingState` to query/filter state through `DataTable` table options.

**Alternatives considered**:

- shadcn `<Table>` primitives with custom sort buttons: rejected because the table is no longer simple read-only rendering once sorting is functional.

## Decision: Use DataStateBoundary and Skeletons

**Decision**: Wrap API-backed page regions in `DataStateBoundary` and provide matching skeleton placeholders. Use full-page skeletons for page-level loading and component-level skeletons for independently loading regions.

**Rationale**: Clarification requires skeleton loading at both full-page and component levels, and constitution Principle IV requires loading states to use matching skeleton placeholders.

**Alternatives considered**:

- Spinner-only loading: rejected by constitution.
- A single blocking page loader for all fetches: rejected because clarification requires component-level loading when only one API-backed component is loading.

## Decision: Keep Schedule Change Confirmation Non-Validating in Phase 1

**Decision**: The schedule-change modal completes the flow and closes/returns to the schedule screen without additional validation in Phase 1.

**Rationale**: The clarified spec explicitly states no validation in this phase and "keep flow working". The modal remains a Phase 1 interaction from the list screen, while deeper reservation-impact and persistence details can be expanded in later implementation tasks if needed.

**Alternatives considered**:

- Enforce required reason validation: rejected by clarification.
- Implement full persistence and notification side effects: rejected because the list-screen spec only requires the modal flow, not downstream reservation/detail behavior.

## Decision: Defer Create and Detail Implementations

**Decision**: Provide navigation entry points to schedule creation and reservation detail routes only if needed for route reachability, but do not implement those screens as part of this feature.

**Rationale**: The user explicitly scoped out create and detail functions for follow-up tasks. The spec treats these as entry points only.

**Alternatives considered**:

- Implement minimal placeholder create/detail screens in this plan: rejected because it risks expanding scope beyond the user's restriction.
