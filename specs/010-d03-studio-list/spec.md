# Feature Specification: D-03 Studio Management — FR-001 Studio List Display

**Feature Branch**: `010-d03-studio-list`  
**Created**: 2026-07-01  
**Status**: Draft  
**PO Spec**: `D-03` — スタジオ管理 (Studio Management)  
**Source**: `.cache/fitness-crm-ui/src/pages/lesson-studio.tsx` + `.cache/fitness-spec/crm/requirements/D-03.md`  
**Input**: User description: "Create spec for lesson form create/edit/duplicate lesson 'FR-001: スタジオ一覧表示' in D-03 スタジオ管理"

---

## Scope

This specification covers **FR-001: スタジオ一覧表示 (Studio List Display)** — the studio list screen that allows authorized users to browse, search, filter, and sort the list of studios registered in the system.

**In Scope (Phase 1):**

- Studio list table with sorting and pagination
- Keyword search by studio name
- Collapsible filter panel (store, type, brand, status)
- Role-scoped data display
- Action buttons per row (view detail, edit, delete) rendered according to role permissions
- "New Registration" button in page header (shown to authorized roles only)

**Out of Scope (Phase 1):**

- FR-002: Studio registration form
- FR-003: Studio detail view
- FR-004: Studio edit form
- FR-005: Studio delete / deactivation dialogs
- FR-006: Space layout management
- FR-007: Studio utilization KPI display (Should requirement — future phase)

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Authorized user browses the studio list (Priority: P1)

An authorized user (Headquarter, Manager, Staff, Trainer, or Observer) navigates to the Studio Management screen. The system presents a table listing studios within the user's data scope, each row showing key attributes at a glance.

**Why this priority**: The studio list is the entry point for all studio management workflows. Without it, no downstream actions (registration, editing, deletion) can be initiated.

**Independent Test**: Can be fully tested by loading the page as any authorized role and verifying that the correct studios appear with all required columns displayed.

**Acceptance Scenarios**:

1. **Given** a Headquarter user is on the Studio Management page, **When** the page loads, **Then** all studios across all stores and brands are displayed in the table.
2. **Given** a Manager user is on the Studio Management page, **When** the page loads, **Then** only studios belonging to the Manager's assigned stores are displayed.
3. **Given** a Staff user is on the Studio Management page, **When** the page loads, **Then** only studios belonging to the Staff's single assigned store are displayed.
4. **Given** a Trainer or Observer user is on the Studio Management page, **When** the page loads, **Then** only studios belonging to their assigned store are displayed (read-only access).
5. **Given** the page loads successfully, **When** the user views the table, **Then** each row displays: Studio ID, Studio Name, Store Name, Studio Type, Capacity, Available Hours, Brand, and Status.

---

### User Story 2 — User searches studios by name (Priority: P2)

A user needs to quickly find a specific studio and types a partial name into the search field. The table filters in real time to show only matching studios.

**Why this priority**: Search is the primary way to locate a studio in environments with many records, directly reducing navigation time.

**Independent Test**: Can be fully tested by entering a partial name in the search field and verifying that only rows whose studio name matches the input are shown, and clearing the field restores all rows.

**Acceptance Scenarios**:

1. **Given** the studio list is displayed, **When** the user types a partial studio name in the search field, **Then** the table updates to show only studios whose names contain the entered text (case-insensitive).
2. **Given** a search is active, **When** the user clears the search field, **Then** the full list is restored.
3. **Given** a search term matches no studios, **When** the table updates, **Then** an empty-state message is displayed and no rows appear.

---

### User Story 3 — User filters the studio list (Priority: P2)

A user expands the filter panel and selects one or more filter criteria (store, studio type, brand, status) to narrow the displayed studios.

**Why this priority**: Filters enable efficient navigation in large datasets, complementing keyword search.

**Independent Test**: Can be fully tested by expanding the filter panel, selecting a filter value, and verifying that only studios matching that criterion are shown; selecting "clear" restores all results.

**Acceptance Scenarios**:

1. **Given** the studio list is displayed, **When** the user clicks the filter toggle button, **Then** the filter panel expands to reveal store, type, brand, and status selects.
2. **Given** the filter panel is open, **When** the user selects a specific store from the Store filter, **Then** the table is filtered to show only studios associated with that store.
3. **Given** one or more filters are active, **When** the user clicks the clear button, **Then** all filter selections are reset and the full list is restored.
4. **Given** the filter panel is open, **When** the user closes it by clicking the toggle, **Then** the panel collapses while active filters remain applied.
5. **Given** the user applies multiple filters simultaneously, **When** the table updates, **Then** only studios matching ALL active filter criteria are shown.

---

### User Story 4 — User sorts the studio list (Priority: P3)

A user clicks a column header to sort the studio table ascending or descending by that column.

**Why this priority**: Sorting helps users quickly find patterns (e.g., all inactive studios, studios by capacity) without relying on search or filters.

**Independent Test**: Can be fully tested by clicking a sortable column header and verifying the table rows reorder accordingly; clicking again reverses the order.

**Acceptance Scenarios**:

1. **Given** the studio list is displayed, **When** the user clicks a sortable column header (ID, Name, Store, Type, Capacity), **Then** the table rows are sorted by that column in ascending order and the header shows a sort indicator.
2. **Given** a column is sorted ascending, **When** the user clicks the same column header again, **Then** the table rows are sorted in descending order.
3. **Given** no sort is active, **When** the page first loads, **Then** studios are displayed in their default order (by Studio ID ascending).

---

### User Story 5 — Authorized roles see contextual action buttons (Priority: P2)

Each table row displays action buttons appropriate to the current user's role. Actions unavailable to the user's role are hidden entirely.

**Why this priority**: Correct permission enforcement on action buttons prevents unauthorized operations and gives users clear affordances for what they can do.

**Independent Test**: Can be fully tested by logging in as each role and verifying the presence or absence of Edit and Delete action buttons in each row.

**Acceptance Scenarios**:

1. **Given** a Headquarter or Manager user views the list, **When** any row is displayed, **Then** view-detail, edit, and delete action buttons are visible.
2. **Given** a Staff user views the list, **When** any row is displayed, **Then** view-detail and edit action buttons are visible; delete button is hidden.
3. **Given** a Trainer or Observer user views the list, **When** any row is displayed, **Then** only the view-detail action is available; edit and delete buttons are hidden.
4. **Given** a Headquarter or Manager user views the header, **When** the page loads, **Then** the "+ 新規登録" (New Registration) button is visible in the page header.
5. **Given** a Staff user views the header, **When** the page loads, **Then** the "+ 新規登録" button is visible.
6. **Given** a Trainer or Observer user views the header, **When** the page loads, **Then** the "+ 新規登録" button is hidden.

---

### Edge Cases

- What happens when a user's store assignment changes mid-session and the list is refreshed? The system should re-apply the data scope to the new store assignment.
- How does the system handle a store filter selection for a store outside the current user's data scope? This state should not be reachable — the Store filter options are limited to the user's scoped stores.
- What happens when the studio list is empty (no studios registered for the user's store)? An empty-state view should be displayed with a prompt to register the first studio (for roles that can register).
- What happens if the user applies a combination of filters and search that yields no results? The table shows an empty-state message indicating no matching studios.
- How does status filtering work when the user's default view shows all statuses? By default, both active and inactive studios are shown; the Status filter allows narrowing to one.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001-01**: The system MUST display a paginated table of studios scoped to the current user's role and store assignment.
- **FR-001-02**: The table MUST include the following columns for each studio: Studio ID, Studio Name, Store Name, Studio Type (区分), Capacity (定員), Available Hours (利用時間), Brand (ブランド), and Status (ステータス). Row click navigates to the studio detail view (FR-003).
- **FR-001-03**: The table MUST support ascending/descending sort on the following columns: Studio ID, Studio Name, Store Name, Studio Type, and Capacity. Columns for Available Hours, Brand, and Status are non-sortable.
- **FR-001-04**: The page MUST provide a keyword search input that filters the visible rows by studio name (case-insensitive, partial match).
- **FR-001-05**: The page MUST provide a collapsible filter panel with four independent filter controls: Store (店舗), Studio Type (区分), Brand (ブランド), and Status (ステータス).
- **FR-001-06**: The filter panel MUST include a "Clear" button that resets all four filters simultaneously.
- **FR-001-07**: When no studios match the active search/filter combination, the table MUST display an empty-state message.
- **FR-001-08**: Data scope MUST be enforced per role:
  - System / Headquarter: all studios across all stores and brands
  - Manager: studios in assigned (管轄) stores only
  - Staff: studios in the single assigned store only
  - Trainer / Observer: studios in the assigned store only (read-only)
- **FR-001-09**: The "+ 新規登録" button in the page header MUST be visible for System, Headquarter, Manager, and Staff roles; it MUST be hidden for Trainer and Observer roles.
- **FR-001-10**: Row click navigates to the studio detail view (FR-003). Action buttons (edit, delete) are rendered in the detail view header only, not inline in the list table.
- **FR-001-11**: Studio status MUST be displayed using a visual badge differentiating active (有効) from inactive (無効) states.
- **FR-001-12**: Studio type MUST be displayed using a type badge (TypeBadge component) with distinct visual treatment per type (studio-lesson / pt / body-care).
- **FR-001-13**: Brand associated with each studio MUST be displayed using the shared BrandBadge component.

### Key Entities

- **Studio**: A room or space within a store where lessons take place. Key attributes: ID, name, associated store, studio type, physical capacity, available hours, brand, status (active/inactive), equipment notes, remarks.
- **Store**: The facility to which a studio belongs. Studios are scoped and filtered by store.
- **Role**: The current user's authorization role that governs data scope and available actions (System, Headquarter, Manager, Staff, Trainer, Observer).

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can load and view the studio list within 2 seconds under normal network conditions.
- **SC-002**: The studio list correctly reflects the data scope for each role — zero studios outside a user's scope are ever shown.
- **SC-003**: Users can find a specific studio by name in under 10 seconds using the search input.
- **SC-004**: Action buttons (edit, delete, register) are rendered correctly for each role — 100% accuracy in permission enforcement verified across all 6 roles.
- **SC-005**: Applying any single filter reduces the displayed rows to only matching studios, with no incorrect inclusions.
- **SC-006**: Sorting by any sortable column produces a correctly ordered list on the first click.

---

## Assumptions

- The Store filter options shown to the user are pre-scoped to the user's data access (e.g., a Staff user only sees their own store in the Store filter dropdown).
- Brand values are drawn from a fixed enum: `JOYFIT`, `JOYFIT24`, `JOYFIT YOGA`, `JOYFIT+`, `FIT365`.
- Studio Type values are drawn from a fixed enum: `studio-lesson` (スタジオレッスン用), `pt` (PT用), `body-care` (ボディケア用). Additional enum values may be added per the spec note in D-03 v260624_v2.
- The "Delete" action button visible in the list row for authorized roles navigates to or triggers the delete/deactivation flow defined in FR-005 — this flow is out of scope for this spec.
- The "Edit" action button navigates to the edit form defined in FR-004 — out of scope for this spec.
- The "View detail" action navigates to the detail view defined in FR-003 — out of scope for this spec.
- Default sort order on initial page load is Studio ID ascending.
- Both active and inactive studios are shown by default; users can filter by status to narrow results.
- Backend data connectivity for Phase 1 is limited to mock/seed data; full live-data integration is a later phase.

---

## Clarifications

### Session 2026-07-01

- Q: Which studio type enum is authoritative for Phase 1 — the UI prototype values (normal/hot-yoga/virtual) or the requirement spec values (スタジオレッスン用/PT用/ボディケア用)? → A: Use the requirement spec values (スタジオレッスン用/PT用/ボディケア用).
- Q: Should Available Hours and Brand be included as columns in the studio list table, as shown in the UI prototype, even though FR-001 does not explicitly list them? → A: Yes, include Available Hours and Brand as columns.
