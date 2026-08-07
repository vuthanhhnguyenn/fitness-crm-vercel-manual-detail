# Feature Specification: D-03 Studio Management - FR-003 Studio Detail Display (Phase 1)

**Feature Branch**: `011-studio-detail-page`  
**Created**: 2026-07-02  
**Status**: Draft  
**PO Spec**: `D-03` - スタジオ管理 (Studio Management)  
**Source**: `.cache/fitness-crm-ui/src/pages/lesson-studio.tsx` + `.cache/fitness-spec/crm/requirements/D-03.md`  
**Input**: User description: "Create spec for screen FR-003 スタジオの詳細表示 (D-03 スタジオ管理) - studio detail page"

## Scope

This specification covers **FR-003: Studio Detail Display** for the studio detail screen (`lesson-studio` detail variant) in **Phase 1**.

**In Scope (Phase 1):**

- Display of selected studio detail information from the list selection flow
- Display of registered studio fields rendered in the detail page basic information area
- Display of linked lessons card including reservation rate percentage and color thresholds
- Display of studio images card with multiple images
- Display of space layout preview block when layout data exists
- Detail-header actions (Edit/Delete) with permission-based visibility requirements from D-03 authority matrix
- Delete dialog behavior that blocks physical deletion when studio is in use

**Out of Scope for Phase 1:**

- FR-004 edit form behavior itself (beyond entry-point button visibility)
- FR-005 full deactivation/delete workflow completion (beyond entry-point and in-use deletion guard presentation)
- FR-006 layout editing operations (detail page includes preview only)
- FR-007 KPI analytics module (day/week/month utilization panel is present in UI but belongs to Should requirement)
- Display of change history tab with field-level diffs (read-only)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View studio detail information (Priority: P1)

An authorized user opens a studio from the list and verifies the studio's key details, attached images, and linked lessons from one page.

**Why this priority**: FR-003 exists to provide complete visibility of a selected studio and acts as the decision point before edit/delete actions.

**Independent Test**: Open any row from the studio list and verify that detail header, basic information, linked lessons card, and studio image card are rendered with the selected studio context.

**Acceptance Scenarios**:

1. **Given** a studio row is selected from the list, **When** the detail page opens, **Then** the page header shows studio name, studio type badge, and studio status badge.
2. **Given** the detail page is displayed, **When** the user reviews the basic information card, **Then** the page shows studio ID, studio name, type, physical capacity (物理定員), buffer value (バッファ値), usage hours, store, created date, updated date, and optional equipment/notes blocks.
3. **Given** linked lessons exist for the studio, **When** the linked lessons card is rendered, **Then** each lesson row shows lesson name, category, schedule text, and reservation rate percentage.
4. **Given** studio images exist, **When** the image card is rendered, **Then** the page shows image count and all available thumbnails.

---

### User Story 2 - Assess linked lesson utilization at a glance (Priority: P2)

An operator checks reservation rates in the linked lessons card to quickly judge studio demand.

**Why this priority**: FR-003 explicitly includes reservation-rate percentage display with color thresholds to support operations monitoring.

**Independent Test**: Open a studio detail page with multiple linked lessons and verify all lesson rows display reservation percentage with required color categories.

**Acceptance Scenarios**:

1. **Given** a lesson has reservation rate 80% or higher, **When** the linked lesson row is shown, **Then** the rate is displayed with success color.
2. **Given** a lesson has reservation rate between 60% and 79%, **When** the linked lesson row is shown, **Then** the rate is displayed with warning color.
3. **Given** a lesson row is clicked, **When** the user selects the lesson, **Then** navigation to lesson detail is triggered.

---

### User Story 3 - Use detail page actions within authority constraints (Priority: P2)

Authorized roles access edit/delete entry points from the detail header, while unauthorized roles are blocked from restricted actions.

**Why this priority**: D-03 authority matrix requires strict separation of who can edit and who can delete/deactivate.

**Independent Test**: Validate detail header actions per role and verify delete dialog behavior for in-use studios.

**Acceptance Scenarios**:

1. **Given** user role is System, Headquarter, or Manager, **When** the detail page is rendered, **Then** Edit and Delete actions are visible.
2. **Given** user role is Staff, **When** the detail page is rendered, **Then** Edit is visible and Delete is hidden.
3. **Given** user role is Trainer or Observer, **When** the detail page is rendered, **Then** Edit and Delete actions are hidden.
4. **Given** the studio is already assigned to lessons, **When** Delete is opened, **Then** a warning is shown and destructive deletion is disabled.

### Edge Cases

- Studio has no layout data: layout preview card is not displayed.
- Studio has empty equipment or notes: corresponding optional sections are not displayed.
- Studio is inactive: status badges and status card render inactive visuals.
- Studio is in use by one or more lessons: delete action remains blocked in dialog.
- Studio has zero linked lessons: [NEED CLARIFICATION] Expected UI state is not defined in the current detail card implementation (empty card vs message vs hidden).
- Page-level loading, not-found, and API error states: [NEED CLARIFICATION] These states are not represented in the current UI code for the detail variant.

## Requirements _(mandatory)_

### Component Hierarchy & Layout Structure (Grounded from UI Code)

- Page container: shared sidebar + shared header + detail content area.
- Page header region: back link, studio title, type/status badges, action buttons.
- Content tabs: `Basic Information` tab and `Change History` tab.
- Basic tab, left column:
  - Basic information card
  - Space layout preview card (conditional)
  - Studio images card
- Basic tab, right column:
  - Status card
  - Utilization summary card (day/week/month)
  - Linked lessons card
- Delete confirmation dialog is available at page level.

### Functional Requirements

- **FR-003-01**: The system MUST display studio detail content for the selected studio from the list flow.
- **FR-003-02**: The detail header MUST include: studio name, studio type badge, studio status badge, and a back navigation control.
- **FR-003-03**: The detail page MUST display basic studio fields currently rendered in the UI: studio ID, studio name, type, physical capacity (物理定員), buffer value (バッファ値), usage hours, store, created date, updated date, and optional equipment/notes sections.
- **FR-003-04**: The detail page MUST display a linked lessons card that includes lesson name, lesson category badge, lesson schedule text, and reservation rate percentage per lesson.
- **FR-003-05**: Reservation rate color coding in linked lessons MUST follow D-03 FR-003 thresholds: 80% and above in success color; 60% and above in warning color.
- **FR-003-06**: The detail page MUST display a studio images card with image count and multiple image thumbnails.
- **FR-003-07**: When layout data exists, the detail page MUST display a read-only layout preview grid and legend for normal seat, equipment seat, and fixed object.
- **FR-003-08**: Delete action MUST open a confirmation dialog and MUST disable destructive deletion when the studio is assigned to one or more lessons.
- **FR-003-09**: Detail action visibility MUST follow the D-03 authority matrix:
  - System / Headquarter / Manager: view + edit + delete
  - Staff: view + edit (no delete)
  - Trainer / Observer: view only (no edit, no delete)
- **FR-003-10**: Features not allocated to Phase 1 MUST be excluded from active scope even if shown in the prototype: KPI analytics panel (FR-007), full edit workflow (FR-004), full delete/deactivation workflow (FR-005), and layout editing operations (FR-006).
- **FR-003-11**: The Change History tab MUST display a read-only table of studio change records with columns: 更新日時, 操作者, 変更フィールド, 変更前, 変更後.
- **FR-003-12**: Create actions (`作成`) MUST render a 新規作成 badge with optional note instead of before/after values.
- **FR-003-13**: Update actions with multiple field diffs MUST expand into one table row per changed field.

### UI States (Grounded from UI Code)

- Data-rendered state: default detail presentation with cards and tabs.
- Conditional state: layout preview appears only when layout data is present.
- Conditional state: equipment/notes blocks appear only when data exists.
- Dialog state: delete confirmation dialog opens from delete button.
- Restricted state: delete confirm action is disabled when assigned lesson count is greater than zero.
- Toggled state: active/inactive visual status card can be toggled in prototype.
- Missing in code: [NEED CLARIFICATION] Page-level loading, empty entity, and backend error states are not explicitly modeled.

### Traceability Matrix (UI Element -> Source Requirement)

| UI Element / Behavior (lesson-studio detail)                   | Source Requirement in D-03               | Traceability Result                                              |
| -------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| Header title, type badge, status badge                         | FR-003 detailed information display      | Matched                                                          |
| Back link to studio list                                       | FR-003 detail display navigation context | Matched                                                          |
| Basic info card fields (物理定員 + バッファ値)                 | FR-003 show registered fields            | Matched                                                          |
| Linked lessons card list                                       | FR-003 linked lessons card               | Matched                                                          |
| Reservation rate % in linked lessons                           | FR-003 reservation rate display          | Matched                                                          |
| Reservation rate color thresholds (>=80 success, >=60 warning) | FR-003 color rule                        | Matched                                                          |
| Studio image card with multiple images                         | FR-003 studio image card                 | Matched                                                          |
| Space layout block shown in detail                             | FR-003 show FR-006 setting status        | Partial match (preview exists, explicit status labeling unclear) |
| Edit/Delete header actions                                     | FR-003 action visibility by permission   | Partial match (role gating not implemented in current UI code)   |
| Delete guard when in use                                       | FR-005 deletion restriction              | Matched                                                          |
| Status card with activate/deactivate button                    | FR-005 deactivation operation            | Present in UI, out of scope for this FR-003 spec                 |
| Utilization KPI card (day/week/month, trend, hourly rates)     | FR-007 Should requirement                | Present in UI, out of scope for Phase 1                          |
| Change History tab                                             | Studio detail change-log display         | Matched                                                          |

### Key Entities _(include if feature involves data)_

- **Studio**: Core detail entity containing identity fields, type, status, physical capacity (物理定員), buffer value (バッファ値), hours, store relation, optional equipment/notes, images, and layout preview data.
- **Linked Lesson**: Lessons associated with the studio; each entry includes lesson label, schedule expression, category, and reservation rate percentage.
- **Studio Image**: Image assets attached to a studio and displayed as a multi-item thumbnail set.
- **Studio Layout Cell**: Read-only layout representation for seat/equipment/fixed-object classification in the preview grid.
- **User Role**: Authority context controlling visibility of edit/delete actions in the detail header.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of studio detail visits show the expected core blocks (header, basic info, linked lessons, studio images) for a valid studio record.
- **SC-002**: 100% of linked lesson rows display reservation rate percentages with color category matching the FR-003 thresholds.
- **SC-003**: For each role in the authority matrix, action visibility on the detail header is correct in 100% of role-based acceptance tests.
- **SC-004**: 100% of deletion attempts for in-use studios are blocked at confirmation stage.
- **SC-005**: Operators can identify whether a studio has layout preview data within 5 seconds after opening the detail page.

## Assumptions

- This specification is restricted to the Phase 1 scope requested by the user and does not include future-phase modules present in the prototype.
- The selected studio context is provided by navigation from the studio list flow.
- The authority matrix in D-03 is the source of truth for role-based action visibility on the detail page.
- The detail prototype is treated as a UI reference for structure and interactions, while requirement text is the source of truth for scope and permissions.

## Q&A / Clarification Needed

1. **Permission enforcement mismatch**  
   The detail header currently renders Edit and Delete actions without role-based conditions in the UI code. D-03 authority matrix requires role-specific visibility (Staff: no delete; Trainer/Observer: no edit/delete).  
   **Tag**: [NEED CLARIFICATION] Confirm whether the prototype should be updated to enforce role gating in FR-003 Phase 1.

2. **Physical capacity and buffer value in detail fields**  
   **Status**: Resolved (2026-07-03, Kyota) — 案一: display two fields — 物理定員 (required) and バッファ値 (required, default 0). Applies to create, edit, and detail views.

3. **Layout "status" interpretation gap**  
   D-03 FR-003 requires display of FR-006 layout setting status. Current UI shows layout preview only when layout exists, without explicit status label for "configured/not configured."  
   **Tag**: [NEED CLARIFICATION] Define expected explicit status representation for layout configuration in detail view.

4. **History tab scope**  
   The detail UI Change History tab is implemented with read-only seed data via `GET /crm/studios/{id}/history`.  
   **Status**: Resolved — in scope for FR-003 Phase 1.

5. **KPI panel phase allocation**  
   The detail UI includes day/week/month utilization content that maps to D-03 FR-007 (Should).  
   **Tag**: [NEED CLARIFICATION] Confirm that KPI panel remains out of scope for FR-003 Phase 1 and is tracked under FR-007.
