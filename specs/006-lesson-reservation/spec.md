# Feature Specification: FR-007 予約一覧・詳細表示 (Lesson Reservation)

**Feature Branch**: `006-lesson-reservation-spec`
**Created**: 2026-06-23
**Status**: Draft
**PO Spec**: `D-01 FR-007` — 予約一覧・詳細表示
**Source**: `.cache/fitness-crm-ui/src/pages/lesson-reservation.tsx` (UI prototype) + `.cache/fitness-crm-ui/public/requirements/D-01.md` (requirements)
**Input**: FR-007: 予約一覧・詳細表示 in D-01 レッスン管理 (Lesson reservation page)

## User Scenarios & Testing

### User Story 1 - View Lesson Reservation Detail and Space Grid (Priority: P1)

Staff or Trainer selects a specific session from the schedule list and is taken to the reservation detail page. They see the lesson metadata (date, time, studio, instructors) and the space reservation grid with color-coded occupancy, plus a reservation list table and a reservation statistics panel.

**Why this priority**: This is the primary purpose of FR-007 — giving staff and trainers a comprehensive view of who is booked for a specific session.

**Independent Test**: Can be fully tested by navigating from the schedule list to any session's reservation detail and verifying all metadata, the grid, the list, and the stats panel render correctly.

**Acceptance Scenarios**:

1. **Given** a session has been scheduled, **When** a staff member selects it from the schedule list, **Then** the reservation detail page opens showing the PageHeader (title: lesson name; subtitle: date, time range, studio, and instructor names prefixed with "担当:"; badge: remaining seats or "中止済み") and a "予約管理に戻る" breadcrumb link.
2. **Given** the reservation detail page is open for a studio lesson, **When** the page loads, **Then** a space reservation grid is displayed with color-coded cells: reserved (blue), available (white), equipment (orange), fixed structures/pillars (grey).
3. **Given** the reservation detail page is open, **When** the page loads, **Then** a reservation list table is shown with columns: No, member name, plan type, space number, reservation date, status, attendance, and cancel action.
4. **Given** the reservation detail page is open, **When** the page loads, **Then** the right sidebar shows a "レッスン情報" card with: header link "レッスン内容管理で編集 →" (navigates to D-02 lesson content management), lesson name (clickable, primary color), date, time, studio, instructor(s) with profile photo avatar(s), 定員 and 予約数, a separator, then 繰り返し (recurrence pattern). Remaining seats (残席) are NOT shown in this card — they appear in the page header badge instead. A separate "予約統計" card shows bar charts for each of the 5 statuses (confirmed, tentative, attended, no-show, cancelled).
5. **Given** there are more than 7 reservations, **When** the reservation list is rendered, **Then** pagination controls (page numbers, prev/next buttons) are displayed showing "1-7 / N件".

---

### User Story 2 - Add a Manual Reservation (Priority: P1)

Staff or Trainer manually adds a reservation for a member from the reservation detail page. This supports Mode B operation (notification-based scheduling).

**Why this priority**: Manual reservation input (FR-006) is a Phase 1 Must requirement and is directly accessible from the reservation detail page.

**Independent Test**: Can be fully tested by opening the "予約を追加" dialog, searching for a member, selecting a space, and confirming the reservation.

**Acceptance Scenarios**:

1. **Given** the reservation detail page is open, **When** the user clicks "予約を追加" button or clicks an available cell in the space grid, **Then** the "予約を追加する" dialog opens with session info (date, time, lesson name, remaining seats).
2. **Given** the "予約を追加する" dialog is open, **When** the user types a member name or ID in the search field, **Then** the system queries a backend API and matching members are displayed in a table showing ID, name, remaining session count, and penalty status.
3. **Given** a member with remaining count = 0 is selected, **When** the user clicks "追加", **Then** a warning "残回数が不足しています" is shown and the member is not added.
4. **Given** a member with an active penalty is selected, **When** the user clicks "追加", **Then** a warning "予約不可期間中の会員です（〇月〇日まで）" is shown and the member is not added.
5. **Given** an eligible member is selected, **When** the user clicks "追加", **Then** the member appears in the "追加予定" list and the remaining seats count decreases.
6. **Given** 1+ members are in the "追加予定" list, **When** the user clicks "追加確定（N名）", **Then** the dialog closes and the reservations are created.
7. **Given** the "予約を追加する" dialog, **When** the user checks "予約確定通知を送信する", **Then** a notification is sent upon confirmation.

---

### User Story 3 - Cancel or Change a Session (Priority: P2)

Staff or Trainer performs modifications to the session: cancelling individual reservations, changing instructor, changing time, changing studio, or cancelling the entire lesson.

**Why this priority**: Reservation changes (FR-007 L300) and cancellation (FR-008) are essential operational functions that directly impact member experience.

**Independent Test**: Each modification type can be tested independently via its own modal dialog.

**Acceptance Scenarios**:

1. **Given** the reservation detail page, **When** the user clicks the "取消" button next to a reservation in the list, **Then** the reservation cancel dialog opens with the member info, cancel type radio buttons (会員によるキャンセル / スタッフによるキャンセル / 指導者都合のキャンセル), and a "キャンセル通知を送信する" checkbox.
2. **Given** the reservation cancel dialog, **When** the user selects a cancel type and clicks "キャンセルを確定", **Then** the reservation is cancelled and the list updates.
3. **Given** the reservation detail page, **When** the user clicks "この回を変更" dropdown and selects "講師を変更する", **Then** the change instructor dialog opens showing current instructor(s), a searchable instructor list with photo/specialty, a multi-select chip interface, a "通知する" checkbox, a required change reason textarea, and an impact summary panel.
4. **Given** the change instructor dialog, **When** the user selects replacement instructor(s), enters a reason, and clicks "講師を変更する", **Then** the instructor is changed and affected members are notified.
5. **Given** the reservation detail page, **When** the user clicks "この回を変更" dropdown and selects "時間を変更する" or "スタジオを変更する", **Then** the corresponding change dialog opens with current values, new value inputs, notification checkbox, required reason textarea, and impact summary.
6. **Given** the reservation detail page, **When** the user clicks "中止にする", **Then** a 3-step cancel wizard opens: Step 1 (impact confirmation — shows affected reservations count, notification count, refund amount), Step 2 (reason input — cancel reason select, detail textarea, notification/refund/instructor notification toggles), Step 3 (final confirmation — summary of all choices).
7. **Given** the cancel wizard reaches Step 3, **When** the user clicks "この内容でレッスンを中止する", **Then** the lesson is marked as cancelled, a success toast is shown, and the header displays a "中止済み" badge, a "中止済み" status card appears in the left column, and the "中止にする" button is replaced with "中止を取り消す".

---

### User Story 4 - View Member Limited Profile (Priority: P3)

Staff or Trainer views a limited member profile by clicking a member name in the reservation list (available for all session types — studio lessons and PT) to see fitness-relevant information without accessing protected personal data.

**Why this priority**: FR-015 is a Should requirement (Phase 1) that enhances the trainer's ability to personalize sessions.

**Independent Test**: Can be tested by clicking any member name in the reservation list and verifying the popover content matches the limited profile specification.

**Acceptance Scenarios**:

1. **Given** a reservation list with member names, **When** the user clicks a member name, **Then** a popover opens showing the member's initial avatar, name, age, gender, visit frequency, last visit date, lesson history (own sessions with attendance badges), body data (height, weight, body fat %), plan type, and remaining session count.
2. **Given** the limited profile popover is open, **When** the user clicks "会員詳細を見る", **Then** the user is navigated to the member detail page.
3. **Given** the limited profile popover, **When** the user inspects the displayed fields, **Then** no protected personal data (address, phone, email, contract/payment info) is shown.
4. **Given** a member with active penalty status, **When** the reservation list renders, **Then** a "ペナルティ中" badge is shown next to the member name and the row has a red background tint.

---

### User Story 5 - Record and Manage Session Memos (Priority: P3)

Trainer records session notes after a session and can delete erroneous entries.

**Why this priority**: FR-011 and FR-S001 are Phase 1 Should requirements that provide operational record-keeping.

**Independent Test**: Can be tested by typing in the session memo field, saving, and deleting existing memos.

**Acceptance Scenarios**:

1. **Given** the reservation detail page right sidebar, **When** the user views the "セッションメモ" card, **Then** existing memos are shown with date, author name, and a delete (Trash2) button.
2. **Given** the session memo card for a studio lesson, **When** the user sees the input area, **Then** a free-text textarea is shown with placeholder text for class recording.
3. **Given** the session memo card, **When** the user types content and clicks "メモを保存", **Then** the memo is saved.
4. **Given** an existing session memo, **When** the user clicks the delete button (Trash2 icon), **Then** the memo is deleted.

---

### Edge Cases

- What happens when the lesson has already been cancelled? The header shows a "中止済み" badge and a status card displays cancellation details (date/time, operator, reason). The "この回を変更" dropdown is disabled. The "中止にする" button is replaced with "中止を取り消す".
- What happens when available seats = 0 in AddReservationModal? The remaining seats count shows "残り0席", the "追加" button is disabled for all members, and the confirm button is hidden.
- What happens when a member has remainingCount = 0? A "残回数不足" badge appears next to the member name in the list, and the member cannot be added to new reservations.
- What happens when a member has an active penalty? A "ペナルティ中" badge appears, the reservation row gets a red background tint, and the member cannot be added to new reservations.
- What happens when search returns no results in instructor/studio/member modals? Each searchable list shows "該当する講師が見つかりません" or equivalent empty state.
- What happens when the "中止" wizard is closed midway? The wizard resets to Step 1 on next opening.
- How does the system handle attendance status changes? The attendance dropdown allows changing between "未確認", "出席確認済", and "無断キャンセル" statuses.

## Requirements

### Functional Requirements

- **FR-007-01**: System MUST display a PageHeader detail header with session metadata:
  - **Title**: lesson name.
  - **Subtitle** (pipe-separated): date with day of week, time range, studio name (if present), and instructor name(s) prefixed with `担当:` (multiple instructors joined with `・`, e.g. `3月5日（水） 9:00〜10:00 | Zumbaスタジオ | 担当: 山田太郎・佐藤花子`).
  - **Badge**: remaining seats count (`N/M 予約済（残りX席）`) or "中止済み" when cancelled.
  - Instructor profile photos are shown in the right-sidebar "レッスン情報" card (not in the PageHeader subtitle).
- **FR-007-02**: System MUST display a color-coded space reservation grid showing: reserved spaces (blue), available spaces (white/green), equipment spaces (orange), and fixed structures/pillars (grey). Each cell must show the space number.
- **FR-007-03**: System MUST display a legend below the space grid explaining each color code.
- **FR-007-04**: System MUST display a reservation statistics panel showing a bar chart with count and percentage for each of the 5 statuses: confirmed (予約済), tentative (仮予約), attended (出席確認済), no-show (無断キャンセル), cancelled (キャンセル済).
- **FR-007-05**: System MUST display a reservation list table with columns: sequence number (sortable), member name (sortable, clickable for profile popover), plan type, space number (sortable), reservation date/time (sortable), status (sortable), attendance status (dropdown for manual update), and cancel action button.
- **FR-007-06**: System MUST display reservation status using distinct badges with color coding: confirmed (blue), tentative (yellow/warning), attended (green), no-show (red/destructive), cancelled (grey).
- **FR-007-07**: System MUST support pagination for the reservation list when the number of reservations exceeds the page size (7 per page).
- **FR-007-08**: System MUST display a "予約者はいません" empty state when no reservations exist for the session.
- **FR-007-09**: System MUST allow changing the session instructor via a dialog with: current instructor display, searchable instructor list (by name or specialty) with photo, multi-select with chip display, notification checkbox, required change reason textarea, and impact summary (affected reservations, notification content, refund status).
- **FR-007-10**: System MUST allow changing the session time via a dialog with: current time display, start/end time inputs, studio conflict warning, notification checkbox, required change reason textarea, and impact summary.
- **FR-007-11**: System MUST allow changing the session studio via a dialog with: current studio display, searchable studio list with capacity badge, layout change warning, notification checkbox, required change reason textarea, and impact summary.
- **FR-007-12**: System MUST support 3 reservation status change types when cancelling a single reservation: member-initiated (会員によるキャンセル), staff-initiated (スタッフによるキャンセル), instructor-initiated (指導者都合のキャンセル). Each type must display its specific consequence description.
- **FR-007-13**: System MUST support a 3-step lesson cancellation wizard: Step 1 (impact confirmation — affected reservations count, notification count, refund amount; scope selection: "この回のみ" or "以降すべて"), Step 2 (reason input — predefined reason select, detail textarea, notification/refund/instructor-notification toggles), Step 3 (final confirmation summary).
- **FR-007-14**: After lesson cancellation, System MUST display a "中止済み" badge in the header, a cancelled status card (cancellation date/time, operator, reason), disable the "この回を変更" dropdown, and show a "中止を取り消す" button.
- **FR-007-15**: System MUST allow cancelling a specific space reservation from the grid via a popover showing member name and providing "会員詳細" and "予約取消" buttons.
- **FR-007-16**: System MUST display the remaining available seats count in the page header badge (e.g., "12/14 予約済(残り2席)"). The lesson info card MUST NOT duplicate the remaining seats field.
- **FR-007-17**: System MUST display a "レッスン情報" card in the right sidebar with the following layout and behavior:
  - **Header**: Card title "レッスン情報" with a "レッスン内容管理で編集 →" link that navigates to the D-02 lesson content management page for the associated lesson.
  - **Fields (in order)**: lesson name (clickable, `text-primary`, links to the same D-02 destination), date (`yyyy/M/d(E)` format), time range (`H:mm 〜 H:mm` with spaces around 〜), studio name, instructor(s) displayed right-aligned with profile photo avatar and name (supports multiple instructors stacked vertically).
  - **Capacity section**: 定員 and 予約数 displayed before a separator.
  - **Recurrence section**: After the separator, display 繰り返し with the schedule's recurrence pattern label (e.g., "毎週 月・水・金・土・日" for recurring sessions, "単発" for one-off sessions).
- **FR-006-01** (Manual reservation): System MUST allow staff to add manual reservations via a dialog with: session info header, member search (by name or ID) querying a backend API, member result table showing ID/name/remaining count/penalty status, space number assignment (auto or manual), notification toggle, and added members chip list.
- **FR-006-02**: System MUST prevent adding a member with 0 remaining sessions ("残回数が不足しています" warning).
- **FR-006-03**: System MUST prevent adding a member under active penalty ("予約不可期間中の会員です（〇月〇日まで）" warning).
- **FR-011-01** (Session memo): System MUST provide a session memo card in the right sidebar with: existing memo display (date, author, content, delete button), and an input area for new memos.
- **FR-015-01** (Limited profile): System MUST display a member profile popover when a member name is clicked, for all session types (studio lessons and PT), showing: name, age, gender, visit frequency, last visit date, lesson history (own sessions with attendance badges), body data (height, weight, body fat %), plan type, remaining session count.
- **FR-015-02**: Limited profile popover MUST NOT display protected personal data (address, phone, email, contract/payment information).
- **FR-015-03**: System MUST show a "ペナルティ中" badge for members under penalty in the reservation list.
- **FR-015-04**: System MUST show a "残回数不足" badge for members with 0 remaining sessions in the reservation list.
- **FR-S001-01** (Memo delete): System MUST provide a delete button on existing session memos.
- **FR-009-01** (Manual attendance override): System MUST allow staff to manually update a reservation's attendance status in the reservation list dropdown, with options: "未確認" (unconfirmed), "出席確認済" (attended), and "無断キャンセル" (no-show). This is in scope for Phase 1 alongside QR-based check-in.
- **FR-008-01** (Reservation cancellation): System MUST support individual reservation cancellation with cancel type selection, notification toggle, and confirmation.

### Out of Scope for Phase 1

- LINE notification integration (FR-017) — Phase 2+
- App-based messaging between PT and members (FR-018) — Phase 2+
- Workout program creation and distribution (FR-019) — Phase 2+
- Memo handover between instructors (FR-020) — Phase 2+
- Multi-store movement buffer auto-extension (FR-021) — Phase 2+
- Reservation list cross-type consolidation (studio, PT, visit, trial under unified "予約管理") — Phase 2 per prototype decision
- Independent "ブランド" field in forms (brand is determined by selected studio) — out of scope for Phase 1 per prototype decision

### Key Entities

- **Session (レッスン枠)**: A scheduled lesson occurrence with date, time range, studio, instructor(s), lesson content, capacity, and public/private status.
- **Reservation (予約)**: A booking made by a member for a specific session, with status (confirmed/tentative/attended/no-show/cancelled), space number, plan type, and penalty information.
- **Member (会員)**: A gym member with personal and fitness profile data (name, age, gender, visit frequency, body data, plan type, remaining sessions, penalty status). Protected personal data is restricted.
- **Studio (スタジオ)**: A physical room with name, capacity, and space layout (grid of numbered spots with equipment/pillar markers).
- **Instructor (指導者/講師)**: A trainer or instructor with name, specialty, and photo.
- **Session Memo (セッションメモ)**: A textual record associated with a session, containing training notes, member observations, and handover information.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Staff can view reservation details (header, grid, list, stats) within 3 seconds of selecting a session from the schedule list.
- **SC-002**: Staff can add a manual reservation in under 60 seconds (from opening the dialog to confirming).
- **SC-003**: Staff can cancel an individual reservation in under 30 seconds.
- **SC-004**: Staff can change instructor/time/studio with the 3-step wizard in under 2 minutes.
- **SC-005**: Membership profile popover renders complete limited profile data within 1 second of clicking a member name.
- **SC-006**: 100% of reservation status changes are reflected in the list immediately upon confirmation.
- **SC-007**: Session memo save and delete operations complete within 2 seconds.

## Assumptions

- Staff and Trainer roles have access to this screen based on the D-01 permission matrix (Staff: own studio, Trainer: own sessions only).
- The space grid layout (16 spaces, 8 columns) is dynamic and depends on the studio's physical configuration from D-03.
- Member data (search results, profile) is loaded from the CRM member database via API integration.
- Reservation data is loaded from the backend system; the prototype uses sample data for demonstration.
- The "中止を取り消す" (undo cancellation) button reverts the lesson to active status.
- Page size of 7 items per page in the reservation list is the Phase 1 default.
- Session memo persistence is handled via backend API (save/delete operations).
- Notification toggles in all modals initiate notification sending per the notification framework (FR-012).
- All instructors are available in the system via D-04 instructor master.
- The lesson info card's "レッスン内容管理で編集" link and clickable lesson name navigate to D-02 lesson content management. Until D-02 is implemented, the link may be a placeholder.
- Recurrence pattern (`recurrence_label`) is derived from the schedule's recurrence settings at registration time. When no recurrence is configured, display "単発".

## Clarifications

### Session 2026-06-23

- Q: Should the limited profile popover (FR-015) be shown for PT sessions only or all session types? → A: All session types (studio lessons and PT).
- Q: Should the member search in AddReservationModal use client-side filtering or server-side API query? → A: Server-side API query.
- Q: Should the manual attendance status override dropdown be included in Phase 1 or deferred? → A: Include manual attendance override in Phase 1.
