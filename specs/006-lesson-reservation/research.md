# Research: D-01 FR-007 Lesson Reservation Detail

## Decision: Use `/lesson-schedules/[scheduleId]/reservations` as the Private Route

**Decision**: Create the reservation detail page at `src/app/(private)/lesson-schedules/[scheduleId]/reservations/page.tsx`, nested under the existing lesson-schedules route group.

**Rationale**: The spec describes selecting a session from the schedule list (005) and being taken to the reservation detail page. Nesting under `/lesson-schedules/` makes the parent-child relationship explicit and lets the existing schedule list link directly to `[scheduleId]/reservations` without a separate top-level route.

**Alternatives considered**:

- `/reservations/[scheduleId]`: rejected because it separates the route from its schedule context; the "予約管理" menu item in the sidebar points to `/lesson-schedules`.
- `/lesson-schedules/[scheduleId]`: rejected because `[scheduleId]` could be confused with a single-schedule edit page; `/reservations` suffix makes the sub-page purpose explicit.

---

## Decision: Implement Phase 1 with Mock CRM Route Handlers

**Decision**: Build all data interactions against local mock APIs under `/api/crm/lesson-schedules/[scheduleId]/*`, backed by `src/app/api/_mock-db.ts`, new Zod schemas in `_schemas/lesson-reservation.schema.ts`, OpenAPI registration, and generated React Query hooks.

**Rationale**: The constitution requires Phase 1 to use mock route handlers without backend dependency. Existing modules (including 005-lesson-management) follow this exact pattern.

**Alternatives considered**:

- Static client-side sample data: rejected because Phase 1 must exercise loading states, error states, and data mutations.
- Real backend integration: rejected because DEV-BE has not published the reservation OpenAPI spec.

---

## Decision: New Zod Schema File for Reservation Entities

**Decision**: Create `src/app/api/_schemas/lesson-reservation.schema.ts` for all reservation-related schemas, separate from `lesson-schedule.schema.ts`.

**Rationale**: The reservation detail page introduces 15+ new request/response schemas across 14 API endpoints. Mixing these into the existing lesson-schedule schema file would create a 400+ line file with mixed concerns. A separate file keeps schema ownership clear.

**Alternatives considered**:

- Add schemas to the existing `lesson-schedule.schema.ts`: rejected because it couples the list screen's entities with the detail screen's entities.
- Split into multiple granular schema files (e.g., `reservation.schema.ts`, `memo.schema.ts`): rejected because Phase 1 does not yet warrant that level of granularity; can be refactored in Phase 2.

---

## Decision: Use URL Search Params for Pagination Only

**Decision**: Store only the pagination page number and page size in URL search params via `nuqs`. Dialog open/close state, selected member, and other ephemeral UI state remain in React state.

**Rationale**: Pagination state should survive page refresh and be linkable. Dialog states (add reservation, cancel, change instructor, etc.) are ephemeral and reset on navigation — URL-persisting them adds complexity without benefit. This matches how existing dialogs work in 005.

**Alternatives considered**:

- URL params for all state (including dialog mode): rejected because dialogs don't need bookmarkable URLs.
- Local state for all UI state: rejected because pagination should survive browser refresh.

---

## Decision: Parallel Data Fetching for Page Sections

**Decision**: Fetch lesson header metadata, space grid layout, reservation list (with pagination), and reservation stats as separate parallel queries using `useSuspenseQueries`. Each section has its own `DataStateBoundary` wrapper with matching skeleton.

**Rationale**: The spec defines 4 independently rendered sections (header, grid, list, stats). Parallel fetching minimizes time-to-interactive for sections that load independently. Component-level `DataStateBoundary` wrappers ensure partial loading states per the constitution (Principle IV).

**Alternatives considered**:

- Single monolithic API call returning all data: rejected because it couples loading of independent sections; the grid might load fast from cache while the list needs pagination logic.
- Client-side waterfall: rejected because it increases total load time.

---

## Decision: Dialog Components as Controlled Feature-Local Components

**Decision**: Implement all dialogs (add reservation, cancel reservation, change instructor/time/studio, cancel lesson wizard) as controlled React components within the route `_components/` directory. Each dialog receives `open`, `onClose`, and the relevant data as props.

**Rationale**: These dialogs are specific to the reservation detail page. Extracting them as shared common components would couple them to reservation-specific schemas.

**Alternatives considered**:

- Shared dialog components in `components/common/`: rejected because each dialog has unique reservation-specific business logic (penalty checks, cancel type selection, wizard steps).
- Server actions with `useActionState`: rejected because Phase 1 uses mock route handlers; actions would still call mock APIs.

---

## Decision: Include Attendance Status Override Dropdown in Phase 1

**Decision**: Implement the attendance status dropdown in the reservation list as clarified (FR-009-01), with 3 options: "未確認", "出席確認済", "無断キャンセル".

**Rationale**: The clarification (Session 2026-06-23, Q3) explicitly confirmed this is in scope for Phase 1.

**Alternatives considered**:

- Deferred to Phase 2: rejected by clarification.

---

## Decision: Space Grid Rendered from Studio Configuration Data

**Decision**: The space grid is rendered dynamically based on a studio's space configuration returned by the mock API. Each space has a type: `available`, `reserved`, `equipment`, or `fixed_structure`.

**Rationale**: The spec states "The space grid layout (16 spaces, 8 columns) is dynamic and depends on the studio's physical configuration." Mock data should simulate at least 2 different studio layouts (e.g., 8-column yoga studio, 6-column PT room).

**Alternatives considered**:

- Hardcoded 16-cell grid for all studios: rejected because it ignores the spec's assumption about dynamic layout.
- Client-side grid calculation from capacity alone: rejected because equipment/pillar placement requires explicit layout data.

---

## Decision: Limited Profile Popover as a HoverCard/Popover in the Table

**Decision**: Use shadcn `Popover` (triggered by click on member name in the list) to display the limited member profile. The popover fetches member-limited-profile data on open.

**Rationale**: The spec describes a click-to-open popover, not a hovercard. Lazy fetching avoids loading member data for all list entries on page load.

**Alternatives considered**:

- shadcn `HoverCard`: rejected because the spec says "clicking" not "hovering".
- Inline expanded row: rejected because the prototype shows a popover overlay.
- Pre-fetch all member profiles: rejected because the list could have many members.

---

## Decision: Mock DB Extension with Reservation Seed Data

**Decision**: Extend `_mock-db.ts` with reservation data covering all 5 statuses, at least 3 stores with different studio layouts, members with edge cases (penalty, 0 remaining sessions), and instructor data.

**Rationale**: The constitution requires seed data covering ≥ 3 stores and ≥ 3 contract plans. Reservation-specific edge cases (penalty, remaining count = 0, cancelled sessions) are explicitly tested in the spec's acceptance criteria.

**Alternatives considered**:

- Reuse member/instructor data from other feature mocks: partially done — member and instructor seeds already exist. Only reservation, space layout, and memo seeds need adding.
