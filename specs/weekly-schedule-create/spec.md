# Feature Specification: Weekly Schedule Registration & Publication Settings

**Feature Branch**: (working on current branch — no branch created per user instruction)
**Created**: 2026-06-24
**Status**: Draft
**PO Spec**: `D-01/FR-003` — 週次スケジュール登録・公開設定
**Source**: `.cache/fitness-crm-ui/src/pages/lesson-schedule-form.tsx` + `.cache/fitness-crm-ui/public/requirements/D-01.md`
**Input**: User description: "FR-003 週次スケジュール登録・公開設定 (D-01 レッスン管理)"

## User Scenarios & Testing

### User Story 1 - Create a Single Studio Lesson Schedule (Priority: P1)

A store staff member or instructor creates a one-time studio lesson schedule by selecting date/time, studio, lesson content, instructors, and configuring publication.

**Why this priority**: This is the most basic and frequent operation — creating a single lesson session. All other features (recurring, templates, PT) build on this flow.

**Independent Test**: Can be fully tested by selecting "単発" mode, choosing a studio lesson, filling required fields, and submitting the form. Delivers a single registered lesson schedule visible in the schedule list.

**Acceptance Scenarios**:

1. **Given** the user is on the schedule registration form in create mode, **When** they select "スタジオレッスン" as the lesson class, select a store, studio, date, start time, lesson content, at least one instructor, set capacity, and set publication to ON, **Then** the form submits successfully and a success toast "スケジュールを登録しました" is shown, navigating back to the schedule list.
2. **Given** the user has not filled required fields (date, time, instructors), **When** they click "スケジュールを登録する", **Then** inline validation errors appear below each missing field, the first invalid field scrolls into view, and a summary error "未入力の項目があります" appears in the footer.
3. **Given** the user selects a date that is a store holiday, **When** the date is confirmed, **Then** a yellow warning banner is displayed: "{storeName}は{date}が休業日です。それでも登録しますか？".
4. **Given** a user with the Trainer role opens the form, **When** the instructor selection step is shown, **Then** the インストラクター field is pre-filled with the logged-in trainer themselves, shown as a locked (read-only) chip with a "（あなた）" label and lock icon, and no combobox to add/remove instructors is available.
5. **Given** a user with a non-Trainer role (System / Headquarter / Manager / Staff) opens the form, **When** the instructor selection step is shown, **Then** the multi-select combobox is available and they can select any one or more instructors.

---

### User Story 2 - Create a Recurring Schedule Using Template (Priority: P1)

A store staff member or instructor creates a recurring (weekly/biweekly/monthly) schedule, optionally loading a saved template pattern to pre-fill fields.

**Why this priority**: Recurring schedules cover the majority of use cases (weekly classes). Templates reduce repetitive data entry.

**Independent Test**: Can be fully tested by selecting "繰り返し" mode, configuring days, end condition, and submitting. Template loading/saving can be tested independently as a sub-flow that pre-fills the recurring form.

**Acceptance Scenarios**:

1. **Given** the user is on the registration form, **When** they select "繰り返し" schedule mode, choose "毎週", select days (e.g., 月・水・金), set end condition as "指定日まで" with a date, enable "祝日はスキップする", **Then** a preview list of generated dates is shown with summary (date range, total count).
2. **Given** the user has a saved template, **When** they open the template popover and click "読込" on a template, **Then** the form fields (repeat type, days, end condition, holiday skip, start time, store, lesson class, studio, lesson content) are pre-filled from the template values.
3. **Given** the user wants to save the current recurring settings as a template, **When** they click "+ 現在の設定を保存" in the template popover, enter a template name, and click "保存", **Then** the template is saved and appears in the template list.

---

### User Story 3 - Create a Personal Training Session (Priority: P1)

An instructor creates a personal training session with course type selection.

**Why this priority**: Personal training sessions have a different flow from studio lessons (course type instead of studio/capacity) and must be supported equally.

**Independent Test**: Can be fully tested by selecting "パーソナルトレーニング" as the lesson class, selecting course type, and completing the form. Delivers a PT session registered in the system.

**Acceptance Scenarios**:

1. **Given** the user selects "パーソナルトレーニング" as lesson class, **When** the form updates, **Then** the studio selector and capacity input are hidden, and a "コース種別" dropdown appears with options "30分", "60分", "体験".
2. **Given** the user selects PT mode, selects a course type "60分", store, date, time, and instructor(s), **When** they submit, **Then** the session is registered with the selected course type.

---

### User Story 4 - Configure Publication and Trial Settings (Priority: P2)

A staff member configures whether the schedule is publicly bookable by members and whether trial slots are available.

**Why this priority**: Publication control (Mode A/B) and trial slots directly affect member-facing availability. The public/private toggle impacts reservation system behavior.

**Independent Test**: Can be tested by toggling the publication switch and observing the description text change, and by enabling trial slots and configuring their mode/limit.

**Acceptance Scenarios**:

1. **Given** the publication switch is ON, **When** the user views the setting, **Then** the label reads "公開（モードA）" with description "会員アプリから予約可能な枠として公開されます".
2. **Given** the publication switch is OFF, **When** the user views the setting, **Then** the label reads "非公開（モードB）" with description "CRM上のみで管理。指導者が手動で予約を入力します", and an info banner appears in the reservation settings card.
3. **Given** the user is in studio lesson mode, **When** they enable the "体験枠設定" switch, **Then** trial configuration options appear: "内数" / "外数" mode radio buttons and a trial capacity dropdown (1-5).

---

### User Story 5 - Edit an Existing Schedule (Priority: P2)

A staff member edits an existing schedule, with pre-filled values.

**Why this priority**: Editing is a core operational need. The edit mode reuses the same form with existing data pre-populated.

**Independent Test**: Can be tested by opening the form in edit mode with pre-filled mock data, modifying fields, and saving changes.

**Acceptance Scenarios**:

1. **Given** the form is in edit mode, **When** the user opens it, **Then** existing values are pre-filled: lesson class, store, studio, date, time, instructors, capacity, publication, and recurring settings.
2. **Given** the user modifies fields and clicks "変更を保存する", **When** validation passes, **Then** a success toast "スケジュールの変更を保存しました" is shown, navigating back to the schedule list.
3. **Given** the edited schedule has existing reservations, **When** the user clicks "変更を保存する", **Then** a confirmation dialog is displayed showing affected reservation count, notification summary, and refund status, with a mandatory "変更理由" input field.

---

### User Story 6 - Instructor Conflict Detection (Priority: P2)

The system warns the user when a selected instructor already has an overlapping schedule.

**Why this priority**: Prevents double-booking instructors, a critical operational safeguard.

**Independent Test**: Can be tested by selecting an instructor who already has a schedule at the same day-of-week and time.

**Acceptance Scenarios**:

1. **Given** the user has selected an instructor who is already booked at the same day-of-week and time, **When** the instructor is selected, **Then** a warning is displayed: "{instructorName} は同日時に「{lessonName}」を担当しています".

---

### Edge Cases

- What happens when the user tries to submit with no instructors selected? → Validation error "インストラクターを1名以上選択してください".
- What happens when capacity exceeds the studio physical limit? → Validation error "物理定員（{capacity}名）を超えています".
- What happens when no studio is selected for capacity input? → Guidance text "スタジオを選択すると物理定員の上限が表示されます".
- What happens when the recurring preview has no dates? → Guidance text "開始日を選択すると予定日が表示されます" or "曜日を選択すると予定日が表示されます".
- What happens when holidays overlap with recurring dates? → Warning "店舗休業日と重なる予定が {count} 件あります。そのまま登録すると登録後に個別修正が必要です".
- What happens in single mode when the selected date is a holiday? → Warning banner with confirmation prompt.
- What happens when the user tries to leave with unsaved changes? → Confirmation dialog "変更を破棄しますか？" appears.
- What happens when a template is loaded then the user has unsaved edits? → The form tracks dirty state via `useUnsavedChanges` hook.
- What happens when the user deletes a schedule with existing reservations? → Confirmation dialog showing affected reservation count, notification summary, and refund status.
- What happens when a Trainer opens the form? → The インストラクター field is pre-filled with themselves and locked (read-only); they cannot select other instructors (D-01 permission matrix: Trainer = 自分担当のみ).

## Requirements

### Functional Requirements

- **FR-003-001 (Step 1 - Date/Time & Studio)**: Users MUST be able to select a lesson class (スタジオレッスン / パーソナルトレーニング) via radio buttons. When "パーソナルトレーニング" is selected, users MUST be able to select a course type (30分 / 60分 / 体験) from a dropdown.
- **FR-003-002 (Store Selection)**: Users MUST be able to select an implementation store from a combobox populated from a dynamic store master list.
- **FR-003-003 (Studio Selection)**: For studio lessons, users MUST be able to select a studio from a dropdown that displays each studio's physical capacity (e.g., "Zumbaスタジオ（物理定員 16名）"). When a studio is selected, the physical capacity MUST be displayed as a reference.
- **FR-003-004 (Schedule Mode)**: Users MUST be able to choose between "単発" (single) and "繰り返し" (recurring) schedule modes via radio buttons.
- **FR-003-005 (Date/Time)**: Users MUST be able to select a date via a date picker and a start time via a time input. For recurring mode, this becomes a start date.
- **FR-003-006 (Single Date Holiday Warning)**: When "単発" mode is selected and the chosen date is a store holiday, a warning banner MUST be displayed.
- **FR-003-007 (Recurring Pattern)**: In recurring mode, users MUST be able to select a repeat type (毎週 / 隔週 / 毎月) from a dropdown.
- **FR-003-008 (Day Selection)**: For 毎週 and 隔週 patterns, users MUST be able to select one or more days of the week via toggle buttons (月・火・水・木・金・土・日).
- **FR-003-009 (End Condition)**: In recurring mode, users MUST be able to set an end condition via radio buttons: "指定日まで" (with date picker), "回数指定" (with numeric input), or "無期限".
- **FR-003-010 (Holiday Skip)**: In recurring mode, users MUST be able to enable "祝日はスキップする" (skip holidays) via a checkbox.
- **FR-003-011 (Recurring Preview)**: In recurring mode, a preview of generated dates MUST be displayed showing date, day-of-week, and time for each occurrence. A summary bar shows the date range and total count. A "さらに表示" button loads more items (20 at a time) when the list exceeds the visible count.
- **FR-003-012 (Recurring Holiday Conflict)**: When recurring dates overlap with store holidays, a warning MUST be shown with the count of affected dates.
- **FR-003-013 (Step 2 - Lesson Content)**: Users MUST be able to select a lesson from a combobox populated dynamically based on the lesson class (studio lessons or personal training lessons). In edit mode, the lesson ID and duration are displayed as reference.
- **FR-003-014 (Step 3 - Instructor Selection)**: Users MUST be able to select one or more instructors via a multi-select combobox (chip-based input). The available instructor list is filtered by role — "インストラクター" for studio lessons, "トレーナー" for personal training. Each instructor is shown with a photo, name, and role label. **Instructor selection is role-controlled per the D-01 permission matrix (Trainer = 自分担当のみ / own assignments only) — see FR-003-014a.**
- **FR-003-014a (Instructor Selection — Role-Based Control)**: Instructor assignment MUST be controlled by the logged-in user's role, following the D-01 permission matrix:
  - **Trainer (指導者)**: The インストラクター field MUST be pre-filled with the logged-in trainer themselves and locked (read-only). The trainer CANNOT add or remove instructors. The self chip is shown with a "（あなた）" label and a lock indicator, plus helper text: "ご自身が担当するスケジュールのみ登録できます。担当インストラクターはご自身に固定されます。". This applies to both the registration (create) and edit forms.
  - **All other roles (System / Headquarter / Manager / Staff)**: The multi-select combobox MUST remain unchanged — they can freely select any one or more instructors (subject to the role/lesson-class filter above).
  - The trainer is resolved from the authenticated user (the instructor whose `instructor_id` equals the current `user.id`).
  - Note: The original prototype lacked this control (any role could multi-select); the customer confirmed (2026-06-25) this was a defect, not an intentional design — the trainer self-lock is the correct behavior.
- **FR-003-015 (Instructor Conflict Check)**: When a selected instructor is already assigned to another schedule at the same day-of-week and start time, the system MUST display a conflict warning listing the instructor name and conflicting lesson name.
- **FR-003-016 (Capacity Setting)**: For studio lessons, users MUST be able to enter a capacity as a numeric value, with the studio's physical capacity as the upper limit. If the entered value exceeds the physical capacity, an error message MUST be shown.
- **FR-003-017 (Publication Toggle)**: Users MUST be able to toggle publication ON/OFF via a Switch. ON = "公開（モードA）" — members can book via the app. OFF = "非公開（モードB）" — CRM-only management for manual reservation entry.
- **FR-003-018 (Buffer Settings)**: Users MUST see the buffer settings (最小受付期間, 前バッファ, 後バッファ) displayed in the reservation settings card. These values are linked to the instructor's profile (D-04). A link to the instructor profile page is provided.
- **FR-003-019 (Form Submission)**: On submit, the system MUST validate that: start date, start time, and at least one instructor are provided. On validation failure, inline error messages MUST be shown and the first invalid field scrolled into view. On success, a toast notification is shown and the user navigates to the schedule list.
- **FR-003-020 (Unsaved Changes Protection)**: When the user attempts to navigate away with unsaved changes, a confirmation dialog "変更を破棄しますか？" MUST be shown with options to discard or continue editing.
- **FR-003-021 (Change/Delete Confirmation for Existing Reservations) [Phase 1 - Must]**: When editing or deleting a schedule that has existing reservations, the system MUST display a confirmation dialog showing: affected reservation count, notification content summary, and refund status (if applicable). For changes, a "変更理由" (change reason) text input MUST be required before confirming. This applies to edit and delete operations from the schedule list screen.

- **FR-013-001 (Template Loading) [Phase 1 - Should]**: Users MUST be able to open a template popover from the recurring schedule section. The popover lists saved templates with name, repeat type, days, and start time. Each template has a "読込" button to pre-fill the form.
- **FR-013-002 (Template Saving) [Phase 1 - Should]**: Users MUST be able to save the current recurring configuration as a template via a dialog. The user enters a template name and can choose to overwrite the currently loaded template or save as new. Saved templates include: repeat type, days, end condition, holiday skip, start time, store, lesson class, studio, lesson content. Instructors are NOT included in templates.
- **FR-013-003 (Template Deletion) [Phase 1 - Should]**: Users MUST be able to delete saved templates via a dropdown menu with a "削除" option.

- **FR-016-001 (Trial Slot Enable) [Phase 1 - Should]**: For studio lessons, users MUST be able to enable trial slot settings via a Switch toggle, placed inside the 公開設定 card (collocated with the publication toggle per prototype).
- **FR-016-002 (Trial Mode) [Phase 1 - Should]**: When trial slots are enabled, users MUST be able to select between "内数" (inclusive — within capacity) and "外数" (additional — beyond capacity) modes via radio buttons.
- **FR-016-003 (Trial Capacity) [Phase 1 - Should]**: Users MUST be able to set a trial slot capacity (1-5) from a dropdown.

- **FR-004-001 (Buffer Display) [Phase 1 - Must]**: The reservation settings card MUST display three buffer parameters: "最短受付期間" (minimum lead time, options: 0/1/2/3/6/12/24/48/72 hours), "前バッファ" (pre-buffer, options: 0/15/30/45/60 min), "後バッファ" (post-buffer, options: 0/15/30/45/60 min). A note indicates these values are from the instructor profile (D-04) and changes reflect there.

### Key Entities

- **Lesson Schedule**: A single occurrence of a lesson session. Attributes: store, studio (for studio lessons), date, start time, lesson content, instructors (1+), capacity (studio only), publication status, lesson class (studio/personal), course type (personal only), trial slot configuration.
- **Repeat Template (FR-013)**: A saved recurring pattern. Attributes: name, repeat type, days, end condition, end value, holiday skip, start time, store, studio, lesson content, lesson class. Does NOT contain instructors or dates.
- **Instructor Assignment**: The association between a schedule and an instructor. Multiple instructors can be assigned to the same schedule without main/sub distinction.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A user can complete a single studio lesson schedule registration (selecting all required fields) in under 3 minutes on first use.
- **SC-002**: A user can create a recurring weekly schedule from a saved template (load → review → submit) in under 1 minute.
- **SC-003**: Instructor double-booking conflicts are detected and displayed as warnings for 100% of overlapping assignments.
- **SC-004**: 100% of validation error cases prevent form submission with specific, actionable inline error messages.
- **SC-005**: Unsaved changes are never lost without user confirmation — the discard dialog is shown in all navigation-away scenarios with dirty state.

## Assumptions

- Store and studio master data (including physical capacities) are maintained in external systems (D-03) and available via API.
- Instructor master data (including role classification and profile photos) is maintained in D-04 and available via API.
- Template data is persisted server-side; mock data in the UI code represents initial seed data.
- The buffer settings displayed in the form are read/write linked to the instructor's profile (D-04) — changes made in this form propagate to the instructor profile.
- The store's holiday calendar is available from Y-02 (営業カレンダー) to enable holiday conflict detection.
- The schedule list navigation target (予約管理 / lesson-schedule) is the FR-001/FR-002 entry point.
- The "体験" course type for PT sessions follows the D-02 lesson content master definition for details (time, price).

## Q&A / Clarification Needed

The following items required clarification because of discrepancies or ambiguities between the requirement spec (D-01.md) and the UI code (`lesson-schedule-form.tsx`). All have been resolved — see [Clarifications](#clarifications) section.

### Q1: Schedule Change/Delete Confirmation Dialog for Existing Reservations

**Status**: Resolved → Implement in Phase 1.

### Q2: Trial Slot Card Placement

**Status**: Resolved → Keep inside 公開設定 card (matching prototype).

### Q3: Instructor Conflict Warning Wording

**Status**: Resolved → Use detailed message format that names conflicting instructor and lesson (matching prototype — better UX).

### Q4: Multi-Instructor Selection for Trainer Role — Intentional or Defect?

**Status**: Resolved (2026-06-25, 山内さん) → Defect, not intentional. The form lacked role-based control. For the Trainer role the インストラクター field MUST pre-fill the trainer themselves and lock it (read-only); other roles (店舗スタッフ / 本部 etc.) keep selecting any instructor as before. The prototype has been updated to reflect this. See FR-003-014a.

## Clarifications

### Session 2026-06-24

- Q: Should the schedule change/delete confirmation dialog be implemented in Phase 1? → A: Yes, implement in Phase 1.
- Q: Should trial slot settings remain inside the 公開設定 card or be extracted into a dedicated card? → A: Keep inside 公開設定 card (matching prototype).
- Q: Should the instructor conflict warning use the generic spec wording or the detailed implementation format? → A: Use detailed format naming the instructor and conflicting lesson (matching prototype — better UX).

### Session 2026-06-25

- Q: Is the multi-instructor selection UI an intentional design for the Trainer role? → A: No. It was a defect — the registration/edit form lacked role-based control. The spec's permission matrix (Trainer = 自分担当のみ) is correct.
- Q: For the Trainer role, should the インストラクター field auto-fill the trainer themselves and be locked (read-only)? → A: Yes — pre-fill self + lock. Other roles (店舗スタッフ / 本部) keep selecting any instructor as before.
