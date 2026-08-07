# Feature Specification: D-01 Lesson Schedule Management

**Feature Branch**: `005-lesson-management`  
**Created**: 2026-06-22  
**Status**: Draft  
**PO Spec**: `D-01` — Lesson Management  
**Source**: `.cache/fitness-crm-ui/src/pages/lesson-schedule.tsx` + `.cache/fitness-crm-ui/public/requirements/D-01.md`  
**Input**: Create a Phase 1 screen specification for "D-01 レッスン管理" / lesson-schedule Management. Active scope excludes create functions and detail screens; those flows will be specified separately.

## Clarifications

### Session 2026-06-22

- Q: Should the Phase 1 screen name remain "Reservation Management" or be changed to "Lesson Management"? -> A: Keep the Phase 1 UI version, using "Reservation Management".
- Q: Should studio and instructor filters be functional in Phase 1? -> A: Keep filters in Phase 1 and apply them to displayed schedule data.
- Q: Should sort controls be functional in Phase 1? -> A: Keep sorting in Phase 1.
- Q: Should an empty day timeline state be added? -> A: Yes, add an empty timeline state.
- Q: Are loading states required for Phase 1? -> A: Yes, use skeleton loading for the full page and per API-backed component.
- Q: What should happen on schedule change confirmation? -> A: In Phase 1, no validation is required; keep the modal flow working.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Store Lesson Operations (Priority: P1)

Headquarters, managers, and store staff need to open the lesson schedule screen and understand the current day's lesson operation status for a store, including lesson counts, booking occupancy, same-day changes, staff coverage, active alerts, and the day's lesson timeline.

**Why this priority**: This is the primary Phase 1 store-facing workflow in D-01 FR-001, allowing staff to monitor lesson operations and respond to same-day issues.

**Independent Test**: Can be tested by opening the lesson schedule screen as a non-Trainer user in store-view mode and verifying that summary cards, the date/view toolbar, and the selected schedule view all render from available schedule data.

**Acceptance Scenarios**:

1. **Given** a non-Trainer user opens the D-01 screen, **When** the page renders, **Then** the user sees the shared navigation shell, page header, store/my-schedule axis tabs, KPI summary cards, schedule toolbar, and the default day timeline view.
2. **Given** a day timeline contains lessons with alert text, **When** the timeline renders, **Then** those lessons are visually marked as requiring attention and the timeline header shows the number of alert items.
3. **Given** a lesson has type `studio`, **When** it appears in the timeline, weekly calendar, or list view, **Then** it is labeled as a studio lesson and uses the studio visual treatment.
4. **Given** a lesson has type `personal`, **When** it appears in the timeline, weekly calendar, or list view, **Then** it is labeled as personal training and displays the payment type when present.

---

### User Story 2 - Switch Between Schedule Views (Priority: P1)

A permitted user needs to switch between day, weekly calendar, and list views to review the same lesson schedule data in the format best suited to the current task.

**Why this priority**: D-01 FR-001 requires a weekly calendar view and grid/list switching, while the UI adds a day timeline view for operational monitoring.

**Independent Test**: Can be tested by using the view toggle in the schedule toolbar and confirming that the day timeline, weekly calendar, and list table are shown one at a time.

**Acceptance Scenarios**:

1. **Given** the screen is in day view, **When** the user selects "Weekly", **Then** a seven-day calendar grid is displayed with lessons grouped by day.
2. **Given** the screen is in weekly view, **When** the user selects "List", **Then** a table is displayed with date, time, lesson name, type, instructor, reservation status, alert, and publication status columns.
3. **Given** the screen is in list view, **When** the user selects "Day", **Then** the day timeline is displayed again.

---

### User Story 3 - Navigate Dates and Apply Schedule Filters (Priority: P1)

A permitted user needs to move between dates or weeks and narrow the schedule by store, studio, or instructor where those controls are available.

**Why this priority**: D-01 FR-001 requires filtering by studio and instructor, and the UI provides date navigation plus a store filter for all-store contexts.

**Independent Test**: Can be tested by using "Today", previous/next buttons, the calendar picker, and select filters, then confirming the control state changes and the displayed context reflects the selected date/week or filter value where implemented.

**Acceptance Scenarios**:

1. **Given** day view is active, **When** the user selects a date from the calendar picker, **Then** the toolbar displays the selected single date and closes the picker.
2. **Given** weekly or list view is active, **When** the user selects a date from the calendar picker, **Then** the toolbar displays the week range beginning on the Monday of the selected week and closes the picker.
3. **Given** store filtering is available, **When** the user selects a store other than "all stores", **Then** the all-store area summary mode is not shown and the normal schedule layout is shown.
4. **Given** studio or instructor filters are changed, **When** the user selects an option, **Then** the selected filter value is retained in the toolbar and the displayed schedule data is narrowed to matching lessons.

---

### User Story 4 - Review Area-Level Store Summary (Priority: P2)

Headquarters or another all-store user needs to see a cross-store operational summary and focus the schedule display on a selected store without leaving the screen.

**Why this priority**: The source spec includes all-store visibility for headquarters and manager-scoped visibility, and the UI implements a cross-store summary when the header store context is all stores.

**Independent Test**: Can be tested by opening the screen with the current store context set to all stores, staying on the store axis with the screen store filter set to all stores, and selecting a row in the store summary table.

**Acceptance Scenarios**:

1. **Given** the user is in all-store context and store-view axis, **When** the screen renders with the screen store filter set to all stores, **Then** the screen shows area KPI cards for managed store count, alert count, and abnormal store count.
2. **Given** the area store summary table is visible, **When** the user clicks a store row, **Then** that store becomes the focused store and the focused-store label and schedule display update to that store context.
3. **Given** the area store summary table contains more than three stores, **When** it renders, **Then** the table body is scrollable and indicates that all stores can be shown by scrolling.

---

### User Story 5 - View My Assigned Schedule (Priority: P2)

A Trainer needs to view only their assigned lessons and booking names, while non-Trainer users may switch into their own schedule view.

**Why this priority**: D-01 FR-002 defines the Trainer-focused schedule view and data scope.

**Independent Test**: Can be tested by opening the page as a Trainer and verifying that the screen starts on "My Schedule", the store-view tab is disabled, and assigned-session rows include required session details.

**Acceptance Scenarios**:

1. **Given** the logged-in user has the Trainer role, **When** the screen opens, **Then** the active axis is "My Schedule" and the "Store" axis tab is disabled.
2. **Given** my-schedule view is active, **When** the timeline renders, **Then** each item displays start time, end time, lesson name, store, instructor, reservation count/status, and booked member names when available.
3. **Given** a non-Trainer user selects "My Schedule", **When** the selection is accepted, **Then** the same my-schedule timeline structure is shown.

---

### User Story 6 - Change an Existing Schedule from the List Screen (Priority: P3)

A permitted user needs to open a schedule change modal from an existing lesson item and review the impact before confirming a schedule change.

**Why this priority**: D-01 FR-003 requires schedule changes with impact count, notification content, refund necessity, and a required change reason when existing reservations are affected.

**Independent Test**: Can be tested by hovering a timeline or weekly calendar lesson, clicking the edit icon, and verifying that the change modal opens with lesson information, change-scope controls, editable change fields, reason field, impact summary, notification checkbox, cancel action, and confirm action.

**Acceptance Scenarios**:

1. **Given** a timeline or weekly calendar item is visible, **When** the user clicks its edit icon, **Then** the schedule change modal opens and the underlying page is non-interactive.
2. **Given** the change modal is open, **When** the user clicks cancel or close, **Then** the modal closes and the schedule screen becomes interactive again.
3. **Given** the change modal is open, **When** the user reviews the modal, **Then** it displays the target lesson, reservation count, change scope, time fields, instructor field, studio field, required reason field, affected reservation count, notification description, refund necessity, notification opt-in checkbox, and confirm button.
4. **Given** the change modal confirm button is clicked, **When** the user confirms the change in Phase 1, **Then** the modal flow completes without additional validation and returns the user to the schedule screen.

### Edge Cases

- When a weekly calendar day has no scheduled lessons, the day column displays "No lessons".
- When a lesson has reached capacity, the reservation label displays as full; when the booking rate is at least 85% but not full, it displays remaining seats; otherwise, it displays booked count over capacity.
- When a lesson capacity is one, the reservation label uses personal-training semantics: booked or available.
- When a lesson is marked internal/non-public, the weekly card uses a dashed muted treatment and displays an internal badge with a tooltip explaining that the slot is CRM-only / Mode B.
- When the day timeline contains completed lessons, those items appear visually de-emphasized.
- When no lessons exist in the day timeline, the day timeline displays an empty state message indicating that there are no lessons for the selected day.
- When the entire page is loading, the screen displays a full-page skeleton that preserves the page layout.
- When a specific API-backed component is loading, only that component area displays a skeleton while other already-loaded page areas remain usable.
- No additional custom error UI is specified for this Phase 1 screen beyond error handling defined by the API-backed component during implementation.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST display a D-01 schedule management screen for Phase 1 that covers schedule list/monitoring behavior only; create forms and reservation detail screens are excluded from this specification.
- **FR-002**: The system MUST display the page inside the shared application shell with the shared sidebar, shared header, and the Phase 1 page header title "Reservation Management".
- **FR-003**: The system MUST provide a schedule registration entry button only as an out-of-scope navigation entry point for this specification, gated to System, Headquarter, Manager, Staff, and Trainer roles and denied for users without schedule-registration permission.
- **FR-004**: The system MUST provide two screen axes: store view and my-schedule view.
- **FR-005**: The system MUST force Trainer users into my-schedule view and disable store view for Trainer users.
- **FR-006**: The system MUST allow non-Trainer users to switch between store view and my-schedule view.
- **FR-007**: The system MUST display KPI summary cards for today's lessons, booking occupancy rate, today's changes, and today's assigned staff in normal store schedule layouts.
- **FR-008**: The system MUST display today's lesson count with studio/personal breakdown.
- **FR-009**: The system MUST display booking occupancy rate with percentage, progress indicator, and week-over-week change indicator as shown in the UI.
- **FR-010**: The system MUST display today's change count with cancellation, time-change, and instructor-change breakdown.
- **FR-011**: The system MUST display today's assigned staff count with instructor/trainer breakdown.
- **FR-012**: The system MUST provide day, weekly, and list view modes through a toolbar view toggle.
- **FR-013**: The system MUST default the schedule view mode to day view.
- **FR-014**: The system MUST provide date navigation controls: Today, previous, next, and calendar picker.
- **FR-015**: The system MUST display a single selected date in day view and a Monday-to-Sunday week range in weekly/list contexts.
- **FR-016**: The system MUST provide a store filter when the current store context is all stores.
- **FR-017**: The system MUST provide studio and instructor filter controls with the options present in the UI code, and those filters MUST narrow the displayed timeline, calendar, and list data to matching lessons.
- **FR-018**: The system MUST show an all-store summary mode only when the current store context is all stores, the selected axis is store view, and the screen-level store filter is all stores.
- **FR-019**: In all-store summary mode, the system MUST display area KPI cards for managed store count, required-action alert count, and abnormal store count.
- **FR-020**: In all-store summary mode, the system MUST display a scrollable store summary table with store name, today's lesson count, average booking rate, staff count, alert count, and in-progress lesson.
- **FR-021**: The system MUST allow the user to click a store summary row to focus that store while staying in all-store summary mode.
- **FR-022**: The system MUST display the focused store name and a focused-state badge before showing that store's schedule.
- **FR-023**: The system MUST display a day timeline card with a header, total item count, required-action count when any alerts exist, and a legend distinguishing studio and personal lessons.
- **FR-024**: The system MUST display lesson timeline items with start/end time, lesson name, lesson type, location, instructor, reservation status, optional payment type, optional booked member names in my-schedule view, and optional alert text.
- **FR-025**: The system MUST visually mark alerted timeline items as requiring attention.
- **FR-026**: The system MUST insert a current-time indicator into the day timeline before the first in-progress or upcoming lesson when there are prior completed lessons.
- **FR-027**: The system MUST navigate to the reservation detail screen when a timeline item, weekly event card, or list row is clicked; this destination behavior is out of scope for this specification.
- **FR-028**: The system MUST display a weekly calendar as seven columns from Monday through Sunday, with today's column highlighted and Sunday visually distinguished.
- **FR-029**: The system MUST sort weekly events by start time within each day.
- **FR-030**: The system MUST display weekly event cards with type badge, name, time range, instructor, reservation status, optional payment type, optional alert badge, and public/internal status treatment.
- **FR-031**: The system MUST display "No lessons" inside a weekly day column when that day has no events.
- **FR-032**: The system MUST display a daily footer in each weekly day column containing event count and average booking rate when that day has events.
- **FR-033**: The system MUST display list view as a table with date, time, lesson name, type, instructor, reservation, alert, and publication columns.
- **FR-034**: The system MUST highlight today's rows in list view.
- **FR-035**: The system MUST display alert badges in list view when an event has an alert label, and a dash when no alert exists.
- **FR-036**: The system MUST display publication status in list view as public or internal.
- **FR-037**: The system MUST provide functional sorting for list and area-summary table headers that display sort icons and sort tooltips.
- **FR-038**: The system MUST expose an edit icon on timeline and weekly event cards when edit handling is available.
- **FR-039**: The system MUST open the schedule change modal when the user clicks an event edit icon.
- **FR-040**: The schedule change modal MUST display the selected lesson summary, warning that reservations exist, change-scope radio options, start/end time controls, instructor change controls, studio controls, a required change reason text area, impact summary, notification checkbox, cancel/close controls, and a confirm control.
- **FR-041**: The schedule change modal MUST allow users to close it via the close icon or cancel button.
- **FR-042**: In Phase 1, confirming the schedule change modal MUST complete the modal flow and return the user to the schedule screen without additional validation.
- **FR-043**: The system MUST display a day timeline empty state when the selected day has no lessons.
- **FR-044**: The system MUST display a full-page skeleton while the entire screen is loading.
- **FR-045**: The system MUST display component-level skeletons for API-backed sections that are loading independently, such as a table skeleton when only table data is loading.
- **FR-046**: The system MUST render no active Phase 2-only D-01 features in this screen specification.

### Key Entities _(include if feature involves data)_

- **Schedule Lesson**: A scheduled lesson or personal training session shown in the timeline, weekly calendar, or list. Key attributes shown by the UI are time range, lesson name, location, instructor, booked count, capacity, type, status, alert, store, publication status, and optional payment type.
- **Timeline Lesson**: A day-level operational item with status values of upcoming, in-progress, or completed and optional alert details.
- **Schedule Event**: A week/list-view item with date placement, start/end time, instructor, reservation count, capacity, type, alert label, public/internal flag, and optional payment type.
- **Store Summary**: An all-store summary row containing store name, lesson count, booking rate, alert count, and in-progress lesson text.
- **Current User Context**: Determines whether the user is a Trainer and whether the selected store context is all stores.
- **Schedule Change Draft**: The modal state for a proposed schedule change, including change scope, time, instructor, studio, reason, notification choice, affected reservations, notification content, and refund necessity.

## UI Component Hierarchy and Layout

- **Application Shell**: Shared sidebar with current page set to lesson schedule, shared header, and a scrollable main content region.
- **Page Header**: Title "Reservation Management" and a role-gated "Schedule Registration" action. The action navigates to the create form and is out of active scope.
- **Axis Tabs**: Store view and my-schedule view. Trainer users are locked to my-schedule.
- **All-Store Summary Mode**: Area KPI summary, store summary table, focused-store header, focused-store KPI summary, toolbar, and selected schedule view.
- **Normal Schedule Mode**: KPI summary, toolbar, and selected schedule view.
- **Schedule Toolbar**: Date navigation, optional store filter, studio filter, instructor filter, and day/weekly/list view toggle.
- **Day Timeline View**: Timeline card header with legend and counts, current time indicator, timeline items, optional edit icons.
- **Weekly Calendar View**: Seven-day grid, day headers, event cards, empty-day messages, daily summary footers, optional edit icons.
- **List View**: Schedule table with sortable-looking headers and event rows.
- **Schedule Change Modal**: Fixed overlay that disables the underlying schedule content while open.

## UI States

- **Data-rendered State**: The UI renders from static schedule, timeline, my-schedule, and area-store arrays in the provided code.
- **All-Store Summary State**: Active when current store context is all stores, axis is store, and screen store filter is all stores.
- **Focused Store State**: Within all-store summary mode, a selected store row is highlighted and its name is shown as the schedule focus.
- **Trainer State**: Active axis is my-schedule and store axis is disabled.
- **Day View State**: Shows the day timeline with current-time indicator behavior.
- **Weekly View State**: Shows seven-day calendar columns.
- **List View State**: Shows flattened weekly events in a table.
- **Modal Open State**: Underlying page content has pointer interactions disabled and the schedule change modal is shown.
- **Weekly Empty-Day State**: A day column with no events shows "No lessons".
- **Timeline Empty State**: When the selected day has no lessons, the day timeline displays an empty state indicating that there are no lessons for the selected day.
- **Full-Page Loading State**: When the full screen is loading, a full-page skeleton preserves the overall layout until the page can render.
- **Component Loading State**: When only one API-backed component is loading, that component displays its own skeleton while other loaded page sections remain visible.
- **Error State**: No additional custom error UI is specified for this Phase 1 screen beyond component/API-level handling during implementation.

## Traceability Matrix

| UI Element / Behavior                             | Source UI Code                                         | Source Requirement Mapping                                                                            | Phase 1 Status                                  |
| ------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Page shell with sidebar/header                    | `SharedSidebar`, `SharedHeader`, `SidebarInset`        | General CRM screen structure; not explicitly specified in D-01                                        | Active                                          |
| Page title "Reservation Management"               | `PageHeader title="予約管理"`                          | Prototype review notes mention reservation management naming; D-01 metadata says lesson management    | Active; Phase 1 keeps UI title                  |
| Schedule registration button                      | `RoleGatedButton` navigating to `lesson-schedule-form` | D-01 FR-003 schedule registration; permission matrix registration/edit roles                          | Out of scope for this spec except entry point   |
| Store/my-schedule tabs                            | `Tabs` for `store`, `my-schedule`                      | D-01 FR-001 and FR-002 view switching                                                                 | Active                                          |
| Trainer locked to my-schedule                     | `isTrainer`, disabled store tab                        | D-01 permission matrix and FR-002 Trainer own sessions                                                | Active                                          |
| KPI summary cards                                 | `KpiSummary`                                           | D-01 FR-001 KPI summary                                                                               | Active                                          |
| Area KPI summary                                  | `AreaKpiSummary`                                       | D-01 data scope for headquarters/manager all-store visibility; FR-001 store view                      | Active                                          |
| Area store summary table                          | `AreaSummary`                                          | D-01 FR-001 store schedule overview; data scope                                                       | Active                                          |
| Store row focus behavior                          | `handleSelectStore`, `focusStoreId`                    | D-01 FR-001 store view                                                                                | Active                                          |
| Toolbar date navigation                           | `ScheduleToolbar` date controls                        | D-01 FR-001 schedule list/calendar operation                                                          | Active                                          |
| Store filter                                      | `ScheduleToolbar` store select                         | D-01 FR-001 filtering; all-store data scope                                                           | Active                                          |
| Studio filter                                     | `studioFilter` select                                  | D-01 FR-001 studio filtering                                                                          | Active; must filter displayed data              |
| Instructor filter                                 | `instructorFilter` select                              | D-01 FR-001 instructor filtering                                                                      | Active; must filter displayed data              |
| Day/weekly/list toggle                            | `Tabs` values `day`, `week`, `list`                    | D-01 FR-001 weekly calendar and grid/list switching                                                   | Active                                          |
| Day timeline                                      | `TodayTimeline`, `TimelineItem`                        | D-01 FR-001 today's timeline; FR-002 my sessions                                                      | Active                                          |
| Alert count and alert badges                      | `alertCount`, alert labels                             | D-01 FR-001 required-action alerts                                                                    | Active                                          |
| Studio/personal color legend and badges           | `LESSON_TYPE_STYLES`                                   | D-01 definitions for studio lessons and PT                                                            | Active                                          |
| Payment type display for personal sessions        | `paymentType` badge                                    | D-01 FR-014 monthly plan remaining count/payment mode context; definitions for monthly/ticket payment | Active as display only                          |
| Booked names in my-schedule                       | `bookedNames` display                                  | D-01 FR-002 display items; FR-015 limited profile                                                     | Active as limited names only                    |
| Current-time indicator                            | `CurrentTimeIndicator`                                 | D-01 FR-001 current-time indicator in today's timeline                                                | Active                                          |
| Weekly calendar                                   | `WeeklyCalendar`                                       | D-01 FR-001 weekly calendar view                                                                      | Active                                          |
| Weekly empty-day message                          | `events.length === 0` message                          | D-01 FR-001 abnormal/empty state for no lessons                                                       | Active                                          |
| Weekly daily footer                               | `DailyFooter`                                          | D-01 FR-001 operational summary; not explicitly detailed                                              | Active                                          |
| Internal/non-public badge and tooltip             | `isPublic` false handling                              | D-01 FR-003 public OFF / Mode B CRM-only slots                                                        | Active                                          |
| List table                                        | `ScheduleListView`                                     | D-01 FR-001 list view                                                                                 | Active                                          |
| List publication status                           | public/internal badges                                 | D-01 FR-003 public setting ON/OFF                                                                     | Active                                          |
| Header sort affordances                           | `ArrowUpDown` buttons/tooltips                         | D-01 FR-001 list/table review behavior                                                                | Active; sorting must work in Phase 1            |
| Row/card click navigation to reservation detail   | `navigate("lesson-reservation")`                       | D-01 FR-007 reservation detail                                                                        | Out of scope for this spec except entry point   |
| Edit icon on timeline/weekly cards                | `onEditClick` button                                   | D-01 FR-003 schedule change/edit                                                                      | Active                                          |
| Schedule change modal                             | `ScheduleChangeModal`                                  | D-01 FR-003 schedule change with reservations; FR-012 notification; F-01 refund linkage               | Active                                          |
| Day timeline empty state                          | Not currently rendered in `TodayTimeline`              | D-01 FR-001 no-lessons empty state                                                                    | Active; must be added                           |
| Loading skeletons                                 | Not currently rendered in UI code                      | Required by clarification for Phase 1 data loading                                                    | Active; full-page and component-level skeletons |
| Monthly template modal removal comment            | comment referencing FR-013 form integration            | D-01 FR-013 template integrated into registration form                                                | Out of scope because create form is excluded    |
| LINE notification                                 | Not rendered                                           | D-01 FR-017 / Phase 2; D-01 FR-012 says LINE is Phase 2 fallback                                      | Out of scope for Phase 1                        |
| App messaging, workout delivery, note handoff     | Not rendered                                           | D-01 FR-018 to FR-020                                                                                 | Out of scope for Phase 1                        |
| Cross-type reservation management for visit/trial | Not rendered as a separate list                        | D-01 prototype review says Phase 2 future cross-category reservation list                             | Out of scope for Phase 1                        |

## Out of Scope for Phase 1 / This Specification

- Schedule creation form behavior, including the three-step registration flow, repeat/template toolbar, capacity input, public setting persistence, instructor conflict checks, buffer settings, and automatic reservation-slot generation. The list screen exposes only a navigation entry point.
- Reservation detail behavior, including reservation list/detail, seat grid, reservation statistics panel, booking status transitions, manual reservation input, cancellation, attendance confirmation, penalties, session notes, and limited profile detail. The list screen exposes only navigation to the detail route.
- Monthly template creation, save, management, and bulk application behavior, because the UI code states this is integrated into `lesson-schedule-form.tsx`, which is outside this screen specification.
- LINE notification integration, in-app messaging, workout program delivery, note handoff between instructors, and multi-store movement buffer auto-extension, because D-01 marks these as Phase 2 or later.
- Cross-category reservation management for lesson/PT/visit/trial as a standalone reservation list, because the PO spec's prototype review notes identify that broader reservation-management concept as Phase 2.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A permitted non-Trainer user can identify today's lesson count, booking occupancy, same-day changes, staff coverage, and required-action count within 30 seconds of opening the screen.
- **SC-002**: A permitted user can switch among day, weekly, and list views with one action per view switch.
- **SC-003**: A Trainer user cannot access store-view scheduling from this screen and can see their assigned schedule immediately on page load.
- **SC-004**: In all-store context, a permitted user can focus any displayed store from the store summary table with one row click and see the focused-store label update.
- **SC-005**: A permitted user can open and close the schedule change modal from an editable timeline or weekly event without leaving the list screen.

## Assumptions

- The active scope is limited to the lesson schedule/list management screen in `lesson-schedule.tsx`; create and detail destinations are intentionally deferred.
- D-01 Must and Should items are Phase 1 unless explicitly listed as Phase 2 or later in the source requirement.
- UI labels in Japanese are represented in English in this specification while preserving their meaning.
- The provided UI code uses static data arrays; this specification describes observable UI behavior and required states from that code, not backend integration behavior.
