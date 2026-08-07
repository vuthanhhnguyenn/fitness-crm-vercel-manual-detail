# Feature Specification: E-03 Training Equipment Management (Phase 1)

**Feature Branch**: `010-training-equipment-phase1`  
**Created**: 2026-07-01  
**Status**: Draft  
**PO Spec**: `E-03` - Training Equipment Management  
**Source**: `.cache/fitness-crm-ui/src/pages/training-equipment-list.tsx`, `.cache/fitness-crm-ui/src/pages/training-equipment-detail.tsx`, `.cache/fitness-crm-ui/src/pages/training-equipment-form.tsx`, `.cache/fitness-crm-ui/public/requirements/E-03.md`  
**Input**: User description: "Create spec for screen E-03 Training Equipment Management. Phase 1 only. Exclude future scope. History is seed display only; no create/update/delete history."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browse and find equipment in store scope (Priority: P1)

As HQ or store-level staff, I can open the training equipment list, search by keyword, apply filters, sort columns, and page through results to quickly find relevant equipment.

**Why this priority**: Listing and retrieval is the primary entry point for all equipment management operations.

**Independent Test**: Open the list page, apply search/filter/sort/pagination actions, and verify the table updates accordingly without navigating to other screens.

**Acceptance Scenarios**:

1. **Given** the user opens the list page, **When** no additional filter is selected, **Then** the table excludes "Discarded" status rows by default and renders current page rows.
2. **Given** the user enters a keyword, **When** the keyword matches equipment name or installation area, **Then** only matched rows are shown and a filter result banner is displayed.
3. **Given** the user changes category, status, sorting, page size, or page number, **When** each control is used, **Then** the list updates and keeps UI state consistent.
4. **Given** no row matches current conditions, **When** the table is rendered, **Then** an empty state appears and the user can clear conditions.

---

### User Story 2 - Register and edit equipment records (Priority: P2)

As HQ or authorized staff, I can create a new equipment record and edit an existing one from the dedicated form screen.

**Why this priority**: Registration and maintenance of equipment master data is core business functionality.

**Independent Test**: From list page, open create form and edit form, fill fields, submit, and confirm navigation and confirmation behavior for each mode.

**Acceptance Scenarios**:

1. **Given** the user clicks "New Registration", **When** the create form opens and required fields are provided, **Then** the record can be submitted and user is routed to detail view.
2. **Given** the user opens edit form from detail page, **When** submit is clicked, **Then** a tool-type change confirmation dialog appears before final save.
3. **Given** the form is in edit mode, **When** viewing installation status field, **Then** status is read-only on form and user is guided to change status in detail page.

---

### User Story 3 - View equipment detail, status, links, and deletion guardrails (Priority: P3)

As HQ or store-level staff, I can open a specific equipment detail page to review full information, manage exercise links, open status change dialog, and perform role-based delete/edit actions.

**Why this priority**: Detail screen centralizes record verification and operational actions.

**Independent Test**: Open detail page and test each tab/dialog action (status change dialog, exercise add/unlink dialog, delete dialog behavior).

**Acceptance Scenarios**:

1. **Given** the user opens a row from list page, **When** detail page loads, **Then** basic information, installation information, status card, notes, and tab structure are displayed.
2. **Given** the user opens exercise-link tab, **When** adding or unlinking exercises, **Then** linked count and table content update.
3. **Given** the user attempts delete on a record with linked exercises, **When** delete is confirmed, **Then** the system blocks deletion and shows the linked-exercise warning dialog.
4. **Given** history tab is opened, **When** records are displayed, **Then** only seeded read-only history entries are shown for Phase 1.

### Edge Cases

- Search and filters produce zero result.
- Current page becomes greater than total pages after changing page size or filter.
- User selects rows for bulk status change and closes the dialog without applying.
- User selects exercise candidates with tool mismatch warning.
- User with unauthorized role clicks action buttons (CSV export, registration, edit, delete).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001 (List Rendering)**: System MUST provide a training equipment list page with table columns for equipment ID, name, tool type, quantity, installation area, installation status, linked exercise count, and last updated date.
- **FR-002 (Search and Filter)**: System MUST support keyword search (equipment name and installation area), tool-type filter, status filter, and clear-all actions.
- **FR-003 (Sorting and Pagination)**: System MUST support per-column sorting and pagination controls including page navigation and page-size selection.
- **FR-004 (Default Visibility Rule)**: System MUST hide "Discarded" rows by default and allow users to include them through status filter.
- **FR-005 (List Empty/Filtered States)**: System MUST show an empty/filtered state when no records are found and provide a direct action to clear conditions.
- **FR-006 (Create Equipment)**: System MUST provide a create form with required fields (equipment name, tool type, quantity, installation store, status defaulting to "Installed") and optional fields (manufacturer, model number, installation area, installation date, notes).
- **FR-007 (Edit Equipment)**: System MUST allow editing existing equipment and display a confirmation dialog when saving edits that affect tool type linkage assumptions.
- **FR-008 (Detail View)**: System MUST provide a detail page with tabbed sections for basic information, exercise linkage, and history.
- **FR-009 (Status Display and Change Entry)**: System MUST display current status, changed timestamp, and actor on a dedicated status card and allow opening a status-change dialog from detail page.
- **FR-010 (Exercise Link Management)**: System MUST support listing linked exercises, adding exercises from candidate list with search/filter, and unlinking linked exercises through confirmation dialog.
- **FR-011 (Delete Guardrails)**: System MUST provide role-gated delete action and block deletion when linked exercises exist.
- **FR-012 (Role-Gated Actions)**: System MUST apply role-based restrictions for CSV export, create, edit, and delete actions as represented in the UI.
- **FR-013 (History in Phase 1)**: System MUST provide read-only seeded history display (timestamp, operator, from-status, to-status, reason) in detail tab for Phase 1; creation, update, and deletion of history entries are out of scope.
- **FR-014 (Traceability)**: System MUST preserve the mapping between E-03 requirement items and implemented UI controls described in the traceability matrix below.
- **FR-015 (Status Change Validation)**: System MUST enforce validation for status-change reason as mandatory in status change flows, aligned with E-03 FR-007.
- **FR-016 (Default Sorting Responsibility)**: System MUST treat default ordering as API/mock-data responsibility; frontend list page does not apply default sorting on initial load.
- **FR-017 (Exercise Navigation Deferral)**: System MUST follow current UI behavior for Phase 1 and keep linked-exercise-detail navigation deferred until Y-08 is completed.

### Key Entities _(include if feature involves data)_

- **Training Equipment**: Record representing one equipment item in a store (ID, name, tool type, quantity, manufacturer, model number, area, status, install date, notes, updated date, store context).
- **Installation Status**: Lifecycle status of equipment (`Installed`, `Maintenance`, `Removed`, `Discarded`) plus status metadata for last changed timestamp and actor.
- **Exercise Link**: Association between equipment and exercises, including linked count and unlink/add operations.
- **History Entry (Read-Only in Phase 1)**: Seeded log record containing status transition timestamp, operator, before/after status, and reason.

### Traceability Matrix (UI -> Source Requirement)

| UI Element / Behavior                               | Source Requirement (E-03)         | Phase 1 Inclusion                                         |
| --------------------------------------------------- | --------------------------------- | --------------------------------------------------------- |
| List table with equipment metadata and linked count | FR-001                            | In Scope                                                  |
| Keyword search + tool type/status filters           | FR-002                            | In Scope                                                  |
| "Discarded excluded" default filter                 | FR-001 (default hidden discarded) | In Scope                                                  |
| New registration form entry                         | FR-003                            | In Scope                                                  |
| Detail screen with status card metadata             | FR-004                            | In Scope                                                  |
| Edit action and form save confirmation              | FR-005                            | In Scope                                                  |
| Delete action with linked-exercise block            | FR-006                            | In Scope                                                  |
| Status change dialog                                | FR-007                            | In Scope (with mandatory reason validation)               |
| Exercise link tab add/unlink flow                   | FR-008                            | In Scope                                                  |
| Linked exercise name navigation to Y-08 detail      | FR-004 related                    | Out of Scope for Phase 1 (deferred until Y-08 completion) |
| Bulk status update bar/dialog on list               | FR-009 (Should)                   | Out of Scope for Phase 1                                  |
| CSV export action button                            | FR-010 (Should)                   | Out of Scope for Phase 1                                  |
| History tab full operational lifecycle              | FR-011 (Could)                    | Out of Scope for Phase 1 (seed display only)              |
| Cross-store summary                                 | FR-012 (Could)                    | Out of Scope for Phase 1                                  |

### Out of Scope for Phase 1

- Bulk status update execution (FR-009, Should).
- CSV export execution (FR-010, Should).
- Full history lifecycle operations (create/update/delete/audit management); only seeded read-only display is in scope.
- Cross-store summary dashboard (FR-012, Could).
- Any future placeholders in source notes such as unresolved installation-area master finalization beyond current UI options.
- Navigation from linked exercise names to Y-08 exercise detail (deferred dependency on Y-08 completion).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Authorized users can complete equipment discovery (search/filter/sort and open target detail) in under 60 seconds for standard datasets.
- **SC-002**: Authorized users can complete equipment registration from form open to submit confirmation in under 3 minutes.
- **SC-003**: 100% of detail pages display status metadata (current status, changed timestamp, changed by) and exercise-link count.
- **SC-004**: Deletion attempts on equipment with linked exercises are blocked in all tested cases.
- **SC-005**: For Phase 1, history tab consistently displays seeded read-only records with no editable controls exposed.

## Assumptions

- Phase 1 scope maps to E-03 Must items, while Should/Could items are excluded unless explicitly restated.
- API contracts for this feature will be derived from the provided backend design source during implementation, but this document remains behavior-focused.
- Current UI prototype text and role matrices are the source of truth when no conflicting requirement statement exists.
- Store scope filtering follows currently selected store context from authenticated user session.

## Clarification Resolutions

1. Status-change reason follows the source spec and is mandatory; add validation in status change flows.
2. Default list ordering is handled in mock/API logic; frontend does not apply initial default sorting.
3. Linked-exercise navigation to Y-08 is deferred and will be implemented after Y-08 is completed; Phase 1 follows current UI behavior.
