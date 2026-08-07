# Feature Specification: FR-003 Lesson Content Master Detail Display (D-02 Lesson Content Management)

**Feature Branch**: `008-lesson-content-detail`  
**Created**: 2026-06-26  
**Status**: Draft  
**PO Spec**: `D-02` — Lesson Content Management (レッスン内容管理)  
**Source**: `dx-fitness/fitness-spec: crm/requirements/D-02.md` + `dx-fitness/fitness-crm-ui: src/pages/lesson-detail.tsx`  
**Input**: User description: "FR-003: レッスン内容マスタの詳細表示 -D-02 レッスン内容管理 (lessons Page)"

> **Scope note**: This specification covers **Phase 1 only** and is restricted to the **detail display screen** (`lesson-detail.tsx`). Fields, flows, and screens that belong to other FRs (creation form, edit form, list/search) are described only where they appear on the detail screen as entry points (buttons/navigation). Their internal behavior is listed under "Out of Scope for Phase 1".

## Clarifications

### Session 2026-06-26

- Q: Should the Deactivate ("無効化する") action be gated to Headquarter/System like the other management actions? → A: Yes — gate Deactivate to roles `["Headquarter", "System"]`, consistent with the `D-02.md` authority matrix (削除・無効化 restricted to System/Headquarter); for all other roles it is disabled with a permission tooltip.
- Q: Should gender / age / count restrictions be displayed on the detail screen? → A: No — follow the current UI; gender, age, and count limits are intentionally omitted from the detail view for Phase 1 (may be added later pending client confirmation).
- Q: Should the instructor in schedules be a clickable link to the D-04 master with multi-instructor support? → A: Yes — render the instructor as a link to the D-04 instructor master and support multiple instructors (n名) per schedule.
- Q: How should the detail screen render when the master status is inactive/deleted? → A: Deactivate and Delete are unified as a single soft-delete lifecycle action; soft-deleted masters are retained and can be displayed in the list via a filter; the detail screen reflects the inactive/deleted status and offers re-activation ("有効化する") in place of the deactivate control.
- Q: Should the detail screen include loading and error/not-found states in Phase 1? → A: Yes — implement a loading skeleton and an error/not-found state, consistent with the list screen (`007-lesson-content-list`) decision.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View a lesson content master in read-only detail (Priority: P1)

As any authenticated CRM user, I open a lesson content master record from the list and view all of its registered information in a read-only detail screen so I can confirm the program definition before using it in scheduling.

**Why this priority**: Read-only detail viewing is the core purpose of FR-003 and is available to every role; without it none of the management actions have a starting point.

**Independent Test**: Open the detail screen for a studio lesson and for a personal training program, and confirm the title, status/type badges, image gallery, description, basic info, restrictions/pricing, recent schedules, and internal memo are displayed.

**Acceptance Scenarios**:

1. **Given** a lesson content master exists, **When** the detail screen is opened, **Then** the screen header shows the lesson name, an "有効" (Active) status badge, and a lesson-type badge (Studio lesson / Personal training).
2. **Given** the detail screen is open, **When** the "基本情報" (Basic Info) tab is shown, **Then** the image gallery, description, status card, basic info card, restriction/pricing card, recent schedule card, and internal memo card are rendered read-only.
3. **Given** a studio-type record, **When** the basic info card renders, **Then** the implementation time (実施時間) row is shown; **and Given** a personal-type record, **Then** the session time (セッション時間) row is shown.
4. **Given** the detail screen is open, **When** the user clicks the back link, **Then** the user navigates back to the lesson content list (or to the reservation/schedule screen when arrived from a schedule context).

---

### User Story 2 - Browse lesson images and recent schedules (Priority: P1)

As a user viewing a lesson content master, I can browse the lesson images and review the program's recent and full schedule list so I understand how the program is being offered.

**Why this priority**: Image browsing and the recent-schedule panel are first-class, always-visible parts of the detail screen and require no special permission.

**Independent Test**: Click image thumbnails and navigation arrows; view the top 3 recent schedules; open the "all schedules" sheet and review the recurring-pattern summary and the per-session list.

**Acceptance Scenarios**:

1. **Given** the image gallery has multiple images, **When** a thumbnail or the prev/next arrow is clicked, **Then** the main image and the position counter (current/total) update accordingly.
2. **Given** the recent schedule card is shown, **When** it renders, **Then** the top 3 upcoming schedules are listed with date/time, studio, and booked/capacity counts.
3. **Given** the recent schedule card is shown, **When** "全{n}件を表示" (Show all) is clicked, **Then** a side sheet opens listing the recurring-pattern summary and the full per-session schedule list.
4. **Given** a schedule row (card or sheet) is clicked, **When** the user activates it, **Then** the user navigates to the lesson reservation screen.

---

### User Story 3 - Perform master management actions as Headquarter/System (Priority: P1)

As a Headquarter or System user, I can edit, duplicate, deactivate, or delete the lesson content master from its detail screen, while Manager/Staff/Trainer/Observer see these actions as restricted.

**Why this priority**: Permission-correct management entry points are an explicit FR-003 + authority-matrix requirement and are the main reason a privileged user opens the detail screen.

**Independent Test**: As a Headquarter/System user, confirm Edit, Duplicate, Delete buttons are active and navigate/open the correct flows; as a non-privileged role, confirm the same actions are disabled with a permission tooltip.

**Acceptance Scenarios**:

1. **Given** the current user role is Headquarter or System, **When** the detail header renders, **Then** the Delete, Duplicate, and Edit buttons are active.
2. **Given** the current user role is Manager, Staff, Trainer, or Observer, **When** the detail header renders, **Then** the Delete, Duplicate, and Edit buttons are shown disabled with a permission tooltip.
3. **Given** a privileged user clicks "編集" (Edit), **When** activated, **Then** the user navigates to the lesson edit form (edit / edit-personal variant per lesson type).
4. **Given** a privileged user clicks "複製" (Duplicate), **When** activated, **Then** the user navigates to the lesson creation form pre-seeded as a copy with the name suffixed "（コピー）".
5. **Given** the current user role is Headquarter or System, **When** the change-history tab renders, **Then** it is visible; **and Given** any other role, **Then** the change-history tab is not rendered.

---

### User Story 4 - Deactivate or delete a lesson content master (Priority: P2)

As a Headquarter/System user, I can deactivate a master (with a required reason) or delete an unused master (with a required reason), while a master in use by schedules is protected from deletion. Deactivate and Delete are unified as a single soft-delete lifecycle action, and the deactivate/re-activate control is gated to Headquarter/System.

**Why this priority**: Deactivate/delete are the lifecycle controls (FR-005). They are guarded by usage state and reason capture, which is essential to data integrity but secondary to viewing.

**Independent Test**: Open the deactivate dialog and confirm the reason field is required; open the delete dialog for an in-use record (deletion blocked) and for an unused record (reason required, delete enabled).

**Acceptance Scenarios**:

1. **Given** the status card is shown, **When** "無効化する" (Deactivate) is clicked, **Then** a confirmation dialog opens requiring a deactivation reason and explaining existing reservations remain valid and re-activation is possible later.
2. **Given** the delete dialog is opened for a master with usage count > 0, **When** it renders, **Then** a destructive alert "このレッスンはスケジュールで使用中のため削除できません" is shown, the confirm button is disabled, and a link to the in-use schedules (with count) is provided.
3. **Given** the delete dialog is opened for a master with usage count = 0, **When** it renders, **Then** a required delete-reason field is shown and the confirm button is enabled.
4. **Given** the in-use schedules link in the delete dialog is clicked, **When** activated, **Then** the dialog closes and the user navigates to the lesson schedule screen.

---

### Edge Cases

- Single-image gallery: prev/next arrows are hidden when there is only one image (arrows render only when image count > 1).
- Empty restrictions: when no restricted main contract / option contract is set, "制限なし" (No restriction) is displayed instead of badges.
- Per-use fee row appears only when the pricing type is "有料（都次）" (Pay-per-use); it is hidden for other pricing types.
- Navigation context: when the screen is reached with `from=schedule`, the back link and active sidebar entry point to the schedule/reservation context instead of the lesson list.
- Schedule capacity coloring: booked/capacity counts are color-coded (full = destructive, ≥80% = warning/high, >0 = success, 0 = muted) in the all-schedules sheet.
- Delete confirm button stays disabled while the master is in use even if the dialog is reopened.

## Requirements _(mandatory)_

### Component Hierarchy & Layout Structure

- App shell: `SharedSidebar` (active entry depends on `from` context) + `SidebarInset` containing `SharedHeader` + `PageHeader` (outside) + scrollable `main`.
- `PageHeader`:
  - Breadcrumb: `BackLink` ("レッスン内容に戻る" or "予約管理に戻る" when `from=schedule").
  - Title: lesson name.
  - Badges: Active status badge ("有効") + lesson-type badge (Studio / Personal styling).
  - Actions (right): `RoleGatedButton` Delete, `RoleGatedButton` Duplicate, `RoleGatedButton` Edit — all gated to roles `["Headquarter", "System"]`.
- `main` → `Tabs` (default `info`):
  - `TabsList` (line variant): "基本情報" (Basic Info) tab; "変更履歴" (Change History) tab rendered only when `canViewHistory` (role Headquarter/System).
  - `TabsContent value="info"`: two-column flex layout.
    - Left column (flex-1): `ImageGallery` card (main image with caption/counter/prev-next + thumbnail grid with "メイン" marker) and "レッスン内容説明" (Description) card.
    - Right column (360px): `StatusCard` (status with a role-gated lifecycle action — "無効化する" when active / "有効化する" when inactive, gated to `["Headquarter", "System"]`), "基本情報" (Basic Info) card, "制限・料金" (Restrictions & Pricing) card, "直近のスケジュール" (Recent Schedule) card, schedule `Sheet`, and "内部メモ・備考" (Internal Memo) card marked "会員には非表示" (Hidden from members).
  - `TabsContent value="history"` (gated): change-history `Table` (日時 / 操作者 / 操作 / 変更内容) with a total-count footer.
- Overlays:
  - Deactivate `AlertDialog` (required reason textarea, Cancel / "無効化する" actions).
  - Delete `AlertDialog` (in-use: destructive alert + disabled confirm + link to schedules; unused: required reason + enabled confirm).
  - Schedule `Sheet` (recurring-pattern summary with instructor(s) rendered as clickable link(s) to the D-04 instructor master and multi-instructor (n名) support, per-session list, footer "スケジュールを追加" button).

### Functional Requirements

- **FR-003-P1-01 (Mapped: D-02 FR-003)**: System MUST render a read-only detail screen for a single lesson content master, displaying its registered information.
- **FR-003-P1-02 (Mapped: D-02 FR-003)**: System MUST display the lesson name as the screen title, an Active ("有効") status badge, and a lesson-type badge (Studio lesson / Personal training).
- **FR-003-P1-03 (Mapped: D-02 FR-003)**: System MUST display the basic info card with ID, lesson type, brand, time (実施時間 for studio / セッション時間 for personal), and pricing type.
- **FR-003-P1-04 (Mapped: D-02 FR-003, FR-002 restriction fields)**: System MUST display the restrictions & pricing card showing restricted main contracts and restricted option contracts (or "制限なし" when none), and the per-use fee row only when pricing type is "有料（都次）".
- **FR-003-P1-05 (Mapped: D-02 FR-003)**: System MUST display lesson images in a gallery with a selectable main image, thumbnail grid, image position counter, a "メイン" (main) marker on the first thumbnail, and prev/next navigation when more than one image exists.
- **FR-003-P1-06 (Mapped: D-02 FR-003)**: System MUST display the lesson description in read-only form.
- **FR-003-P1-07 (Mapped: D-02 FR-003)**: System MUST display the internal memo/notes in a card labeled as hidden from members ("会員には非表示").
- **FR-003-P1-08 (Mapped: D-02 FR-003)**: System MUST display a recent-schedule card with the top 3 upcoming schedules (date/time, studio, booked/capacity) and a total-count badge.
- **FR-003-P1-09 (Mapped: D-02 FR-003)**: System MUST provide a "show all schedules" sheet listing a recurring-pattern summary and the full per-session schedule list with capacity-based color coding.
- **FR-003-P1-09a (Mapped: D-02 FR-S003)**: System MUST render each schedule's instructor(s) as clickable link(s) to the D-04 instructor master and MUST support displaying multiple instructors (n名) per schedule.
- **FR-003-P1-10 (Mapped: D-02 FR-003)**: System MUST allow navigating from a schedule row (card or sheet) to the lesson reservation screen.
- **FR-003-P1-11 (Mapped: D-02 FR-003, FR-004)**: System MUST show an Edit action that, for permitted roles, navigates to the lesson edit form (edit / edit-personal variant by lesson type).
- **FR-003-P1-12 (Mapped: D-02 FR-003, FR-006)**: System MUST show a Duplicate action that, for permitted roles, navigates to the lesson creation form pre-seeded as a copy with the name suffixed "（コピー）".
- **FR-003-P1-13 (Mapped: D-02 FR-003, FR-005)**: System MUST show a Delete action and a Deactivate action that open the corresponding confirmation dialogs. Deactivate and Delete are treated as a single soft-delete lifecycle action: both set the master to an inactive/soft-deleted state and the master record is retained (not physically removed).
- **FR-003-P1-14 (Mapped: D-02 FR-005)**: System MUST require a deactivation reason in the deactivate dialog before confirmation and inform the user that existing reservations remain valid and re-activation is possible.
- **FR-003-P1-15 (Mapped: D-02 FR-005)**: System MUST block deletion of a master that is in use by schedules (usage count > 0), showing a blocking message, disabling the confirm action, and offering a link to the in-use schedules.
- **FR-003-P1-16 (Mapped: D-02 FR-005)**: System MUST require a delete reason for an unused master (usage count = 0) before enabling the delete confirmation.
- **FR-003-P1-17 (Mapped: D-02 authority matrix / FR-003 permission rules)**: System MUST gate Edit, Duplicate, Delete, and Deactivate (including the status-card "無効化する" / "有効化する" lifecycle control) actions to roles Headquarter and System; for all other roles these actions MUST be disabled with a permission tooltip.
- **FR-003-P1-18 (Mapped: D-02 FR-007, authority matrix)**: System MUST render the change-history tab (timestamp, operator, action, change content) only for Headquarter and System roles.
- **FR-003-P1-19 (Mapped: D-02 FR-003)**: System MUST provide a back-navigation link that returns to the lesson content list, or to the schedule/reservation context when the screen is opened from a schedule (`from=schedule`).
- **FR-003-P1-20 (Mapped: D-02 FR-003 read-only)**: System MUST present all detail content as read-only on this screen (no inline editing); modification is performed only via the Edit form.
- **FR-003-P1-21 (Mapped: D-02 FR-005)**: When the master is inactive/soft-deleted, System MUST reflect the inactive/deleted status in the header badge and status card, and MUST offer a re-activation control ("有効化する") in place of the deactivate control (gated to Headquarter/System). Soft-deleted masters are retained and remain viewable; they are surfaced in the list screen via a filter (list-screen behavior is out of scope here).
- **FR-003-P1-22 (Mapped: list-screen consistency)**: System MUST display a loading skeleton while the detail data is loading.
- **FR-003-P1-23 (Mapped: list-screen consistency)**: System MUST display an error/not-found state when the detail data cannot be loaded or the master does not exist.

### UI Interaction Scenarios (Code-Grounded)

- Click "基本情報" / "変更履歴" tab → switch tab content panel (history tab only present for Headquarter/System).
- Click thumbnail → set that image as the main image.
- Click left/right arrow → step to previous/next image (wraps around), updating the counter.
- Click recent-schedule row → navigate to lesson reservation.
- Click "全{n}件を表示" → open the schedule sheet.
- Click "スケジュール追加" / "スケジュールを追加" → navigate to the lesson schedule form.
- Click a schedule row inside the sheet → navigate to lesson reservation.
- Click "無効化する" (status card, active master, Headquarter/System only) → open the deactivate dialog.
- Click "有効化する" (status card, inactive/soft-deleted master, Headquarter/System only) → open the re-activation confirmation.
- Click an instructor link (schedule sheet) → navigate to the D-04 instructor master.
- Click "削除" (header) → open the delete dialog.
- Click "複製" (header) → navigate to creation form as a copy.
- Click "編集" (header) → navigate to edit form (variant by lesson type).
- In delete dialog (in-use), click "使用中のスケジュールを確認 ({n}件)" → close dialog and navigate to lesson schedule.
- Click `BackLink` → navigate to list or schedule context per `from` parameter.

### UI States (Loading / Empty / Data / Error)

- **Data-rendered**: The detail screen renders fully populated detail data per lesson type (studio/personal). (Prototype uses hardcoded sample data; the actual data-source binding contract is defined in a later phase.)
- **Active status**: When the master is active, the header badge and status card render the Active ("有効") state with the role-gated "無効化する" (Deactivate) control.
- **Inactive / soft-deleted status**: When the master is inactive/soft-deleted (Deactivate and Delete are unified as soft-delete), the header badge and status card reflect the inactive/deleted status and expose a role-gated re-activation control ("有効化する") in place of deactivate. The record is retained and remains viewable (surfaced in the list via a filter — list behavior out of scope here).
- **Empty (sub-sections)**: Restriction rows render "制限なし" when no restriction values exist; per-use fee row is hidden for non pay-per-use pricing.
- **Loading**: A loading skeleton is shown while detail data loads (consistent with the list screen `007-lesson-content-list`).
- **Error**: An error/not-found state is shown when the data cannot be loaded or the master does not exist (consistent with the list screen `007-lesson-content-list`).

### Traceability Matrix (UI Element → Source Requirement)

| UI Element / Behavior in `lesson-detail.tsx`                     | Requirement Mapping in `D-02.md`               | Notes                                                                                   |
| ---------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| Read-only detail screen for one master                           | FR-003 概要 (read-only display of all items)   | Direct alignment                                                                        |
| Title + status badge + lesson-type badge                         | FR-003 (status & type display)                 | Active ("有効") or inactive/soft-deleted status rendered (Q4 resolved)                  |
| Basic info card (ID, type, brand, time, pricing)                 | FR-003 / FR-002 registered fields              | Time field differs by studio/personal                                                   |
| Restrictions & pricing card (main/option contracts, per-use fee) | FR-003 + FR-002 予約制限 / 都次利用料金        | Gender/age/count restrictions intentionally NOT displayed in Phase 1 (Q2 resolved)      |
| Image gallery (main, thumbnails, counter, prev/next)             | FR-003 / FR-002 レッスン画像                   | Read-only viewing (no reorder/upload on detail)                                         |
| Description card                                                 | FR-003 / FR-002 レッスン説明                   | Read-only text                                                                          |
| Internal memo card "会員には非表示"                              | FR-003 備考 (内部メモ・会員には表示されません) | Direct alignment                                                                        |
| Recent-schedule card (top 3) + total count                       | FR-003 直近のスケジュール (直近3件)            | Direct alignment                                                                        |
| Show-all schedule sheet (recurring summary + per-session list)   | FR-003 「全件表示」Sheet                       | Direct alignment                                                                        |
| Schedule instructor display (sheet)                              | FR-S003 複数インストラクター対応表示           | Rendered as link(s) to D-04 master with multi-instructor (n名) support (Q3 resolved)    |
| "スケジュール追加" buttons                                       | FR-003 スケジュール追加導線 (links to D-01)    | Navigation only; D-01 scope for actual scheduling                                       |
| Edit / Duplicate / Delete role-gated buttons                     | FR-004 / FR-006 / FR-005 + authority matrix    | Gated to Headquarter + System                                                           |
| Deactivate ("無効化する") button + dialog                        | FR-005 削除・無効化 (無効化 + 理由必須)        | Role-gated to Headquarter/System; unified with Delete as soft-delete (Q1 + Q4 resolved) |
| Delete dialog in-use block + delete reason                       | FR-005 (利用中は削除不可 / 削除理由必須)       | Direct alignment                                                                        |
| Change-history tab (HQ/System only)                              | FR-007 変更履歴表示 (本部のみ)                 | UI also allows System role                                                              |
| Back link (list vs schedule context)                             | FR-003 detail entry/return                     | `from=schedule` context handling                                                        |

### Out of Scope for Phase 1

The following are excluded because this request is restricted to the Phase 1 **detail display screen**; they belong to other screens/FRs reached only via navigation from this screen:

- FR-001 list/search screen behavior (`lesson.tsx`).
- FR-002 creation form fields, validation, and confirmation flow (`lesson-form.tsx`).
- FR-004 edit form fields and validation (edit / edit-personal forms).
- FR-006 duplication form behavior beyond the navigation seed ("（コピー）").
- FR-S002 preview display (member-app preview) — not present on this screen.
- D-01 lesson scheduling/reservation behavior reached via schedule navigation (`lesson-schedule`, `lesson-schedule-form`, `lesson-reservation`).
- Actual persistence of deactivation/deletion (the prototype dialogs only close on confirm; no backend write contract is defined).

### Key Entities _(include if feature involves data)_

- **LessonContentMaster (detail)**: A single program master with attributes used in the detail UI — id, name, lesson type, type badge, brand, time (duration / session duration), pricing type, images, description, internal notes, and restriction set.
- **RestrictionSet**: Restricted main contracts, restricted option contracts, count limit, per-use fee, gender limit, age limit (count/gender/age limits exist in data but are intentionally NOT rendered on the detail screen in Phase 1 — Q2 resolved; may be added later pending client confirmation).
- **ScheduleSummaryItem**: A schedule row used in the recent-schedule card and all-schedules sheet — date, time, studio, booked, capacity (and recurring-pattern entries include days, instructor, period).
- **ChangeHistoryEntry**: A change-log record — timestamp, operator, action, optional field diffs (before → after), optional note.
- **UserContext / Role**: Current user role used to gate management actions and the change-history tab (privileged: Headquarter, System).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can open the lesson content detail screen and view the title, status/type badges, and all read-only information cards without errors.
- **SC-002**: Users can browse all lesson images via thumbnails and prev/next navigation, with the position counter staying accurate.
- **SC-003**: Users can view the top 3 recent schedules and open the full schedule sheet to review the recurring summary and per-session list.
- **SC-004**: Headquarter/System users see active Edit, Duplicate, and Delete actions; all other roles see these actions disabled with a permission tooltip.
- **SC-005**: Headquarter/System users see the change-history tab; all other roles do not.
- **SC-006**: When deactivating, users must provide a reason before confirmation succeeds.
- **SC-007**: When deleting an in-use master, deletion is blocked with a clear message and a link to the in-use schedules; deleting an unused master requires a reason.
- **SC-008**: Users can return to the correct previous screen (list or schedule context) using the back link.

## Assumptions

- This specification describes the detail-display screen behavior, using `src/pages/lesson-detail.tsx` as the authoritative UI source for visible components, layout, and interactions.
- The authority matrix in `D-02.md` (Headquarter allowed; Manager/Staff/Trainer/Observer view-only) is honored; the UI additionally treats the System role as privileged (consistent with the matrix's System ○ column).
- Phase 1 scope does not include implementing non-detail FRs even when referenced in `D-02.md`; navigation entry points are in scope, target screens are not.
- Sample/mock values in the prototype (image URLs, schedule lists, usage counts, change history) represent data shape only; the actual data source binding is defined in later phases.
- The change-history tab (FR-007, a "Should" requirement) is included because it is fully implemented in the detail prototype and gated by role.

## Q&A / Clarification Needed

The following discrepancies and ambiguities were found between `D-02.md` and `lesson-detail.tsx`. All have been **resolved** in the `## Clarifications` session above (2026-06-26).

### Q1. Deactivate button is not permission-gated in the UI — RESOLVED

**Context**: `D-02.md` authority matrix restricts 削除・無効化 (delete/deactivate) to System and Headquarter only. In the UI, the header Delete/Duplicate/Edit buttons use `RoleGatedButton(allowedRoles=["Headquarter","System"])`, but the "無効化する" (Deactivate) button in the status card is a plain `<Button>` with no role gating.

**Resolution**: Gate the Deactivate / re-activate lifecycle control to `["Headquarter", "System"]`, consistent with the `D-02.md` authority matrix; disabled with a permission tooltip for all other roles. (See FR-003-P1-17.)

### Q2. Gender / age / count restrictions are in data but not displayed — RESOLVED

**Context**: `D-02.md` FR-003 states all registered items are displayed read-only, and FR-001 explicitly highlights 性別制限 (gender restriction). The sample data in the detail screen contains `genderLimit`, `ageLimit`, and `countLimit`, but the "制限・料金" card only renders restricted main contracts, restricted option contracts, and (conditionally) the per-use fee. Gender, age, and count limits are not displayed.

**Resolution**: Follow the current UI — gender, age, and count limits are intentionally omitted from the detail view for Phase 1. May be added later pending client confirmation.

### Q3. Instructor display in schedules is plain text, not a D-04 link — RESOLVED

**Context**: `D-02.md` FR-S003 states instructors should be shown as links to the D-04 instructor master, with multi-instructor (n名) support. In the schedule sheet, the instructor is rendered as plain text (single value per recurring pattern) and is absent from the per-session list.

**Resolution**: Render the instructor as a clickable link to the D-04 instructor master and support multiple instructors (n名) per schedule. (See FR-003-P1-09a.)

### Q4. Inactive/deleted master detail rendering is undefined — RESOLVED

**Context**: `D-02.md` FR-005 allows masters to be deactivated (無効) or soft-deleted. The detail prototype always renders the Active ("有効") status in both the header badge and the status card, with the deactivate action assuming an active record. There is no rendering for an inactive/deleted master (e.g., an "有効化する" re-activation action or a deleted indicator).

**Resolution**: Deactivate and Delete are unified as a single soft-delete lifecycle action; soft-deleted masters are retained and surfaced in the list via a filter. The detail screen reflects the inactive/deleted status and offers a re-activation control ("有効化する") in place of deactivate. (See FR-003-P1-21.)

### Q5. Loading and error states are not present in the prototype — RESOLVED

**Context**: The detail prototype renders synchronously from in-file sample data and has no loading skeleton or error/not-found state. The related list spec (`007-lesson-content-list`) decided to add loading (skeleton) and error states for Phase 1.

**Resolution**: Implement a loading skeleton and an error/not-found state for Phase 1, consistent with the list screen decision. (See FR-003-P1-22, FR-003-P1-23.)
