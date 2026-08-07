# Feature Specification: Studio Registration & Space Layout Management

**Feature Branch**: `012-studio-create-edit`  
**Created**: 2026-07-03  
**Status**: Draft  
**PO Spec**: `D-03` — スタジオ管理  
**Source**: `pages/lesson-studio.tsx` (StudioFormView + SpaceLayoutEditor) + `requirements/D-03.md`  
**Input**: User description: "FR-002: スタジオの新規登録 / FR-006: スペースレイアウトの設定・管理 in D-03 スタジオ管理"  
**Clarified**: 2026-07-03 — Q1: Use D-03.md as spec reference; Q2: バッファ値 field in scope (max 500); Q3: Dynamic grid resize for Phase 1

## Clarifications

### Session 2026-07-03

- Q: Input spec reference: should it be D-02.md or D-03.md? → A: Use D-03.md as the spec reference (confirmed).
- Q: Is the "バッファ値" (buffer capacity) field in scope for Phase 1? → A: Yes, include it under 収容人数, with max value of 500 for both fields.
- Q: Should grid dimension changes dynamically resize the grid? → A: Yes, implement dynamic resizing for Phase 1 — grid immediately updates when columns (6/8/10) or rows (2/3/4/5) are changed.

## User Scenarios _(mandatory)_

### User Story 1 - Register a New Studio (Priority: P1)

A Headquarter or Manager/Staff user navigates to the studio management page, clicks "新規スタジオ登録", fills in the required fields (studio name, store, type, capacity, operating hours), configures the space layout, and submits the form to register a new studio.

**Why this priority**: Studio registration is the foundational operation — without registered studios, no scheduling or space management is possible.

**Verification**: Navigate to studio list page, click "新規スタジオ登録", fill all required fields, click submit, confirm the detail page shows the correct information and the studio appears in the list.

**Acceptance Scenarios**:

1. **Given** the user is on the studio list page with create permission, **When** they click "新規スタジオ登録", **Then** a blank studio creation form is displayed with all required fields marked.

2. **Given** the user has filled all required fields, **When** they click "入力内容を確認する", **Then** a confirmation dialog displays the entered information for review.

3. **Given** the user has reviewed the confirmation dialog, **When** they click "この内容で登録する", **Then** the system saves the studio and navigates to the studio detail page.

4. **Given** any required field is empty, **When** the user attempts to submit, **Then** validation messages indicating the missing required fields are shown.

---

### User Story 2 - Edit an Existing Studio (Priority: P1)

A user with edit permission navigates to a studio's detail page, clicks "編集", modifies the desired fields, and saves changes.

**Why this priority**: Studio information changes over time (capacity, equipment, operating hours) and must be updatable without recreating the studio record.

**Verification**: Open a studio detail page, click "編集", modify a field, save, and verify the changes appear on the detail page.

**Acceptance Scenarios**:

1. **Given** the user is viewing a studio's detail page with edit permission, **When** they click "編集", **Then** the form pre-populates with the studio's current values and the title reads "スタジオ編集".

2. **Given** the user modifies fields and clicks "変更を保存する", **When** the confirmation dialog appears and they click "この内容で保存する", **Then** the system saves the changes and navigates to the detail page.

3. **Given** the user edits a studio that has active scheduled lessons, **When** they modify pricing or restriction fields, **Then** a warning alert is shown: "料金や制限条件を変更すると、予約済みの会員にも影響する場合があります。"

---

### User Story 3 - Configure Space Layout (Priority: P1)

During studio registration or editing, the user configures the studio's floor layout by placing seat types, equipment, and fixtures on a grid.

**Why this priority**: The space layout powers the visual reservation grid in the schedule management module (D-01 FR-007) and is essential for reservation operations.

**Verification**: Open the studio form, interact with the space layout editor grid, change cell types, modify grid dimensions, verify the summary counts update correctly.

**Acceptance Scenarios**:

1. **Given** the user is on the studio create or edit form, **When** they view the right panel, **Then** the space layout editor is displayed with a default 2-row x 8-column grid.

2. **Given** the user selects a placement mode ("通常席", "器材席", "固定物", "未使用"), **When** they click a grid cell, **Then** that cell changes to the selected type.

3. **Given** the user has placed cells on the grid, **When** they view the summary section, **Then** "総スペース数", "予約可能スペース", and "利用不可スペース" counts are correctly calculated and displayed.

---

### Edge Cases

- What happens when a user tries to delete a studio that is linked to active scheduled lessons? The delete dialog shows a warning: "このスタジオは{N}件のレッスンで使用中のため削除できません。" and the delete button is disabled.
- What happens when the user closes the form without saving? The "キャンセル" button navigates back to the previous page via `window.history.back()`.
- What happens when the studio has no space layout configured? The detail view omits the space layout preview section entirely if the layout array is empty.
- How are grid dimension changes handled for the space layout? When row/column counts are changed via the dropdowns (columns: 6/8/10, rows: 2/3/4/5), the grid immediately resizes to the new dimensions. Existing cell data is preserved for cells that remain within the new grid bounds; cells outside the new bounds are discarded. Resetting restores the default 2x8 grid with empty cells.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-002-01**: System MUST provide a studio registration form accessible from a "新規スタジオ登録" button on the studio list page. [Source: D-03 FR-002 / UI: lesson-studio.tsx StudioListView]

- **FR-002-02**: The registration form MUST include the following input fields:
  - 店舗名 (Store Name) — Select, required. Options are populated from registered stores.
  - スタジオ名 (Studio Name) — Text input, required.
  - スタジオ区分 (Studio Type) — Select, required. Options: ノーマル, ホットヨガ, バーチャル.
  - 利用可能時間 (Operating Hours) — Time range input (start ~ end). Not explicitly marked required in UI but required per spec.
  - 収容人数 (Capacity / 物理定員) — Number input, required, with "名" suffix label. Max value: 500.
  - バッファ値 (Buffer Capacity) — Number input, required (default 0), placed below 収容人数, with "名" suffix label. Represents additional capacity for observers/trial participants beyond physical limit. Max value: 500.
  - 設備・備品 (Equipment) — Textarea, optional. Placeholder: "例: ヨガマット20枚、ミラー壁面、音響設備..."
  - スタジオ画像 (Studio Images) — Image upload area with drag-and-drop support. Preview of uploaded images in a 3-column grid. Recommended specs: 1200x800px (3:2), JPG/PNG/WebP, max 5MB per file.
  - 備考 (Notes) — Textarea, optional. Placeholder: "管理用のメモを入力してください..."
  - ステータス (Status) — Switch toggle with description: "無効にすると新規スケジュール登録時の選択肢に表示されません。"
  - [Source: D-03 FR-002 / UI: lesson-studio.tsx StudioFormView]

- **FR-002-03**: System MUST include a "バッファ値" (Buffer Capacity) field in the form. It MUST be a number input, required, with default value 0 and max value 500. It represents overflow capacity for observers/trial participants. Placed immediately below 収容人数. [Source: D-03 FR-002 / User clarification 2026-07-03]

- **FR-002-04**: The form MUST validate required fields on submission. Missing required fields must display validation messages in the format "{項目名}は必須です。". [Source: D-03 FR-002]

- **FR-002-05**: Upon clicking "入力内容を確認する" (create) or "変更を保存する" (edit), a confirmation dialog (AlertDialog) MUST be shown displaying key fields: スタジオ名, 所属店舗, スタジオ区分, 定員, 利用可能時間, ステータス. [Source: UI: lesson-studio.tsx StudioFormView / AlertDialog]

- **FR-002-06**: Confirming the dialog navigates to the studio detail page. Cancelling closes the dialog and returns to the form. [Source: UI: lesson-studio.tsx StudioFormView]

- **FR-004-01**: The edit form MUST pre-populate all fields with the current studio values. The page title MUST display "スタジオ編集". [Source: D-03 FR-004 / UI: lesson-studio.tsx StudioFormView]

- **FR-004-02**: The edit form applies the same validation rules as the create form (FR-002). [Source: D-03 FR-004]

- **FR-006-01**: The space layout editor MUST be displayed as a right panel alongside the studio form (create and edit modes). [Source: D-03 FR-006 / UI: lesson-studio.tsx SpaceLayoutEditor]

- **FR-006-02**: The editor MUST provide a placement mode selector with four cell types: "通常席" (available/绿色), "器材席" (equipment/橙色), "固定物" (pillar/灰色), "未使用" (empty/空白). The selected mode is visually highlighted with a ring indicator. [Source: UI: lesson-studio.tsx SpaceLayoutEditor]

- **FR-006-03**: The editor MUST support grid dimension configuration with dynamic resize:
  - Column count: selectable from 6, 8, 10 columns (default: 8).
  - Row count: selectable from 2, 3, 4, 5 rows (default: 2).
  - When dimensions change, the grid MUST immediately update to reflect the new size. Existing cell data within the new bounds is preserved; cells outside the new bounds are discarded.
  - A "リセット" (Reset) link button to restore the default 2x8 grid with all cells empty.
  - [Source: D-03 FR-006 / UI: lesson-studio.tsx SpaceLayoutEditor / Clarified 2026-07-03]

- **FR-006-04**: The editor MUST display a summary section showing:
  - 総スペース数 (Total spaces) — total grid cell count.
  - 予約可能スペース (Bookable spaces) — count of "available" cells.
  - 利用不可スペース (Unavailable spaces) — count of equipment + pillar cells.
  - [Source: UI: lesson-studio.tsx SpaceLayoutEditor]

- **FR-006-05**: A legend MUST be displayed below the editor with color indicators matching the SpaceReservationGrid in lesson-reservation.tsx:
  - 通常席 (available) — green background.
  - 器材席 (equipment) — orange/warning background.
  - 固定物 (pillar) — muted/grey background.
  - [Source: UI: lesson-studio.tsx SpaceLayoutEditor]

- **FR-006-06**: The space layout data management method (JSON-based DB storage vs image reference) is undetermined. [Source: D-03 FR-006 / D-Q10 in D-03 spec]

- **FR-DELETE-01**: The delete action is available from the studio detail page. A confirmation dialog is shown with a warning if the studio is linked to active scheduled lessons. The delete button is disabled when the studio is in use. [Source: D-03 FR-005 / UI: lesson-studio.tsx StudioDetailView]

**Out of Scope for Phase 1 (deferred from UI code)**:

- **Studio list view** (StudioListView / StudioTable): FR-001 — list/search/filter for studios. Present in UI but scoped to Phase 1 only for navigation integration (back-link target).
- **Studio detail view** (StudioDetailView): FR-003 — full detail view with tabs, usage KPI (FR-007), linked lessons (FR-003). The detail view serves as the navigation target after form submission but its complete implementation is out of scope for Phase 1.
- **Change history tab** (StudioHistoryTab): Part of FR-007 (Should requirement).
- **Usage statistics KPI** (FR-007): Day/week/month usage metrics, linked lesson cards with reservation rate color coding.
- **Duplicate/copy feature**: FR-006 from D-02 spec — lesson content duplication, not applicable to studio management.

### Key Entities _(include if feature involves data)_

- **Studio**: Represents a physical room or space within a store where lessons are conducted. Key attributes: studio ID (auto-generated), studio name, store assignment, studio type (normal/hot-yoga/virtual), capacity (物理定員, max 500), buffer capacity (バッファ値, default 0, max 500), operating hours, equipment, notes, images, space layout grid, status (active/inactive).
- **Space Layout**: A 2D grid representation of the studio floor plan. Each cell has a type: available (bookable seat), equipment (fixed equipment, not bookable), pillar (structural fixture, not bookable), or empty (unused space). Grid dimensions are configurable (rows x columns).
- **Store (店舗)**: The store/facility to which the studio belongs. Studios are managed per-store with role-based data scope.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can complete studio registration (from clicking "新規スタジオ登録" to successful save) in under 3 minutes.
- **SC-002**: Users can complete studio editing and save changes in under 2 minutes.
- **SC-003**: The space layout editor allows users to configure a full studio grid (e.g., 4x8 = 32 cells) in under 1 minute.
- **SC-004**: Form validation catches all missing required fields and displays clear error messages on the first submission attempt.
- **SC-005**: The confirmation dialog accurately reflects all modified fields before saving.
- **SC-006**: Users with appropriate permissions can successfully create and edit studios; users without permission cannot access the create/edit forms.

## Assumptions

- The store selection dropdown population depends on the Y-02 (Store Management) data source.
- The space layout confirmation dialog for existing reservations (mentioned in D-03 FR-006) will be implemented in a later Phase when the space layout is modified for studios with active schedules.
- バッファ値 (buffer capacity) field was confirmed in scope per clarification (2026-07-03).
- Studio image storage and management follows the same pattern used elsewhere in the application for image uploads.
- The "キャンセル" button uses browser history back navigation (`window.history.back()`), consistent with the existing UI implementation.
- Authentication and authorization are handled by the existing user role system; the form implementation relies on role-based permissions to control access to create/edit/delete actions.
- The branch numbering in the feature branch label (012) uses sequential numbering as defined in the project's init-options configuration.
