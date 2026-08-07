# Feature Specification: Visit/Experience Management — List Page

**Feature Branch**: `001-visit-experience-list`  
**Created**: 2026-06-17  
**Status**: Draft  
**PO Spec**: `FR-S001` — 見学・体験の管理 (Phase 1)  
**Source**: `dx-fitness/fitness-crm-ui` → `src/pages/visit-experience-list.tsx`  
**Input**: User description: "Create visit-experience-list page spec: FR-S001 見学・体験の管理 (Scope: phase 1)"

---

## External Context Loaded

**Repo**: `dx-fitness/fitness-crm-ui` (commit `05f9e0a`)  
**UI file**: `src/pages/visit-experience-list.tsx`

### UI Mockup Summary

The design presents a queue-management page for front-desk staff to handle same-day visit/experience reservations. Key regions observed:

- **KPI bar** (4 cards): 本日申込 · 見学中 · 入会申請済 · 当日キャンセル
- **Filter + search bar**: quick-search input + collapsible filter panel (status / brand / store / date range) with active-count badge and clear-all
- **Active filter banner**: alert strip showing current filter summary and result count when any filter is active
- **Data table**: 9 columns — 予約番号, 氏名, ステータス, BL照合, ブランド, 店舗, 予約日時, 見学開始, 見学終了（予定/実績）
- **Pagination footer**: record range display + page navigation + page-size selector (25 / 50 / 100 / 200)

**Visit statuses from design**:

| Status Label | Meaning                           |
| ------------ | --------------------------------- |
| 申込受付     | Application received              |
| 確認待ち     | Awaiting information confirmation |
| BL照合中     | BL risk check in progress         |
| 見学中       | Currently visiting                |
| 見学終了     | Visit completed                   |
| 入会申請済   | Membership application submitted  |
| キャンセル   | Cancelled                         |

**BL Match**: Rows with `blMatch: true` render with a destructive-toned row background and a badge `<AlertTriangle> BL一致`. These rows must be visually distinguished in all display states.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Process daily visit reservations queue (Priority: P1)

As front-desk staff, I can open a single list of visit/experience reservations and quickly identify who is waiting, who is currently visiting, and who needs immediate attention — so I can run same-day operations without missing any check-in actions.

**Why this priority**: This is the core operational value of FR-S001 Phase 1. Without a reliable queue list, staff cannot execute visit handling or decide next actions.

**Independent Test**: Can be fully tested by opening the page with mixed reservation statuses and confirming that list rows, status indicators, and row click-through are sufficient to run queue triage for the day.

**Acceptance Scenarios**:

1. **Given** same-day and past reservations exist, **When** staff opens the list page, **Then** the system shows each reservation row with: reservation ID, customer name, status badge, BL match indicator, brand, store, reserved datetime, visit start datetime, and scheduled/actual visit end datetime.
2. **Given** a reservation row is displayed, **When** staff clicks the row, **Then** the system navigates to that reservation's visit detail view.
3. **Given** a reservation has a BL match, **When** the row is displayed, **Then** the row has a visually distinct background (destructive tone) and a `BL一致` warning badge with an alert icon.
4. **Given** `visitEndActual` is recorded, **When** the visit end column renders, **Then** the actual datetime is shown with an `（実績）` label; otherwise the scheduled datetime is shown with a `（予定）` label.
5. **Given** `visitStartAt` is null, **When** the visit start column renders, **Then** a dash placeholder is shown instead of a blank.

---

### User Story 2 — Narrow down queue with search and filters (Priority: P2)

As staff, I can search and filter the visit queue by operational conditions (status, brand, store, date range) so I can locate the right reservation in seconds during busy hours.

**Why this priority**: Filtering drives speed and accuracy during peak operation, but the queue itself (P1) still provides baseline value if filters are temporarily unavailable.

**Independent Test**: Can be tested independently by applying each filter combination and verifying only matching rows appear, including empty-result handling and reset.

**Acceptance Scenarios**:

1. **Given** multiple reservation records exist, **When** staff types a reservation ID or customer name in the quick-search input, **Then** only matching rows are shown.
2. **Given** the filter panel is visible, **When** staff selects one or more values (status / brand / store / date range), **Then** the list updates immediately and an active-filter count badge is shown on the filter toggle button.
3. **Given** one or more filters are active, **When** the page renders, **Then** an alert banner appears above the table showing the result count and a plain-language summary of which filters are active.
4. **Given** filters produce zero matching rows, **When** the table renders, **Then** an empty-state message ("該当のデータがありません") appears with a "条件をクリア" button.
5. **Given** filters are active, **When** staff clicks clear-all (either in the filter panel or in the alert banner), **Then** all filter values and the search term reset to defaults and the full unfiltered list returns.

---

### User Story 3 — Monitor same-day queue health via KPI cards (Priority: P3)

As a shift lead, I can view at-a-glance summary counts for daily visit operations so I can monitor queue health and identify when intervention is needed.

**Why this priority**: Summary indicators improve situational awareness but core page usage remains possible through the table (P1, P2).

**Independent Test**: Can be tested independently by loading controlled data and verifying each KPI count reflects the correct same-day records.

**Acceptance Scenarios**:

1. **Given** same-day records exist, **When** staff opens the page, **Then** four KPI cards are visible: 本日申込 count, 見学中 count, 入会申請済 count (today only), and 当日キャンセル count.
2. **Given** same-day cancellation count is greater than zero, **When** the KPI cards render, **Then** the 当日キャンセル card uses destructive tone styling to attract attention.
3. **Given** 見学中 count is non-zero, **When** the KPI cards render, **Then** the 見学中 card uses warning tone styling.

---

### Edge Cases

- **No results after filter**: Empty table shows message + "条件をクリア" action; clear button fully resets state.
- **Null visit start**: Column shows `—` placeholder; no blank cells.
- **Actual vs. scheduled end**: Column must correctly pick `visitEndActual` when set, falling back to `visitEndScheduled` with appropriate label.
- **BL match with normal-looking status**: BL warning badge and row background apply regardless of the status value — status and BL match are independent indicators.
- **Rapid filter toggle**: Opening and closing the filter panel must preserve any already-selected filter values.
- **All optional timestamps absent**: Page must remain stable and display placeholders when all nullable datetime fields are null.
- **Zero same-day records**: KPI cards all show 0; 当日キャンセル card uses default (non-destructive) tone when count is 0.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a dedicated "見学・体験管理" list page. Per the C-01 権限マトリクス (申請一覧/詳細参照), page access MUST be restricted to the System, Headquarter, Manager, Staff, and Observer roles; the Trainer role MUST NOT be able to access this page (page-level permission `visit-experiences.view`).
- **FR-002**: System MUST display a tabular reservation queue with, at minimum, the following columns per row: 予約番号, 氏名, ステータス, BL照合, ブランド, 店舗, 予約日時, 見学開始, and 見学終了（予定/実績）.
- **FR-003**: System MUST support reservation lookup by reservation ID and customer name from a single quick-search input field.
- **FR-004**: System MUST support detailed filtering by status, brand, store, and date range, with each filter independently combinable.
- **FR-005**: System MUST indicate when one or more non-default filters are active, including a visible active-filter count badge on the filter toggle.
- **FR-006**: System MUST display an alert banner when any filter or search is active, showing the result count and a plain-language summary of active conditions.
- **FR-007**: System MUST provide a one-action clear that resets all filters and the search term to default values.
- **FR-008**: System MUST visually differentiate all seven reservation statuses (申込受付 / 確認待ち / BL照合中 / 見学中 / 見学終了 / 入会申請済 / キャンセル) with distinct badge styles.
- **FR-009**: System MUST apply BL match visual treatment (destructive-toned row background + `BL一致` badge with alert icon) to any row where `blMatch` is true, independently of the row's status.
- **FR-010**: System MUST allow staff to navigate to a reservation's detail view by clicking anywhere on its table row.
- **FR-011**: System MUST show an empty-state message and a "clear filters" recovery action when search/filter returns zero results.
- **FR-012**: System MUST show four same-day KPI cards: 本日申込, 見学中, 入会申請済, and 当日キャンセル.
- **FR-013**: System MUST apply a destructive tone to the 当日キャンセル KPI card when the same-day cancellation count is greater than zero.
- **FR-014**: System MUST apply a warning tone to the 見学中 KPI card to signal active in-facility visitors.
- **FR-015**: System MUST support paginated display with a user-selectable page size (25 / 50 / 100 / 200 records per page) and page navigation controls.
- **FR-016**: System MUST show a record range summary (e.g., "全 N 件 / P ページ / X–Y を表示") in the pagination footer.
- **FR-017**: System MUST display null visit-start and other optional datetime fields as a dash (`—`) placeholder, never as a blank cell.
- **FR-018**: System MUST show visit-end column with an `（実績）` suffix when the actual end time is recorded, and a `（予定）` suffix when only the scheduled end time is available.

### Key Entities

- **Visit Experience Reservation**: A record for one visit/experience application. Key attributes: reservation ID, customer name, status, BL match flag, brand, store, reservation datetime, visit start datetime, scheduled visit end datetime, actual visit end datetime.
- **Visit Status**: Operational phase in the reservation lifecycle. Possible values: 申込受付, 確認待ち, BL照合中, 見学中, 見学終了, 入会申請済, キャンセル.
- **BL Match Flag**: Boolean risk-screening result. When true, applies additional visual emphasis independent of status.
- **Queue Filter Set**: The active search/filter conditions narrowing the visible reservation list. Dimensions: search keyword, status, brand, store, date range.
- **Daily Visit KPI Snapshot**: Same-day aggregate counts: applications, currently visiting, membership-applied, cancellations.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In usability validation with operational staff, at least 95% of target reservations are located within 30 seconds using search and/or filters.
- **SC-002**: In same-day operation review, staff correctly identifies all BL-match reservations from the list without opening detail in at least 99% of sampled shifts.
- **SC-003**: In UAT scenarios, 100% of tested reservations can be navigated from list to the corresponding detail view without ambiguity.
- **SC-004**: In pilot operation, at least 90% of users report that KPI cards are sufficient to understand same-day queue health within 10 seconds of page load.
- **SC-005**: In usability testing, at least 90% of staff successfully reset all filters in a single action without assistance.

---

## Assumptions

- The primary users are operational front-desk staff who already have access to enrollment and visit-related back-office pages.
- Phase 1 scope is limited to queue visibility, search/filtering, BL-risk indication, KPI summary, and row-level navigation to detail. Editing or updating reservations directly from this list is out of scope.
- Visit reservation records are created by an upstream intake flow and are available for list rendering.
- The date range filter operates over the `reservedAt` field. Options: 本日, 直近3日, 直近7日, 全期間.
- Brand options available in the filter are: FIT365 and JOYFIT.
- Gate-entry enforcement and detailed time-tracking are handled by the entry/exit management module; this page focuses on operational visibility only.
- Detailed membership conversion analytics beyond the immediate "入会申請済" status count are handled by the analytics/reporting scope.
- Phase 1 does not include bulk actions, export, or inline editing.
