# Feature Specification: FR-002 / FR-004 / FR-006 Lesson Content Master Create · Edit · Duplicate Form (D-02 Lesson Content Management)

**Feature Branch**: `009-lesson-content-form`  
**Created**: 2026-06-29  
**Updated**: 2026-06-29 (re-grounded against the latest `lesson-form.tsx`; Q1–Q4 resolved, Q5/Q6 narrowed)  
**Status**: Draft  
**PO Spec**: `D-02` — Lesson Content Management (レッスン内容管理)  
**Source**: `dx-fitness/fitness-crm-ui: src/pages/lesson-form.tsx` + `dx-fitness/fitness-spec: crm/requirements/D-02.md`  
**Input**: User description: "FR-002: レッスン内容マスタの新規登録 / FR-004: レッスン内容マスタの編集 / FR-006: レッスン内容マスタの複製: Populate information of the lesson to be copied into FR-002 — D-02 レッスン内容管理"

> **Scope note**: This specification covers **Phase 1 only** and is restricted to the **lesson content master form screen** (`lesson-form.tsx`), which serves three modes — **Create** (FR-002), **Edit** (FR-004), and **Duplicate** (FR-006, a pre-filled Create). Fields, flows, and screens belonging to other FRs (list/search, read-only detail, delete/deactivate, change history, member-app preview) are described only where they appear on the form screen as entry points (navigation). Their internal behavior is listed under "Out of Scope for Phase 1".

## Clarifications

### Session 2026-06-29

- Q: Should the list-screen "新規レッスン作成" button be gated to match the detail entry points? → A: Yes — wrap it in `RoleGatedButton allowedRoles={["Headquarter", "System"]}`; the form screen itself stays ungated (entry-point gating only).
- Q: Should the form add loading / submit-error states for Phase 1? → A: Add **skeleton loading** for edit/duplicate pre-fill (consistent with `007`/`008`); submit stays toast + navigate (no dedicated submit-error UI in Phase 1).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Register a new lesson content master (Priority: P1)

As a Headquarter or System user, I open the lesson content form from the list, enter the program definition (name, type, brand, duration, pricing, restrictions, images, description, notes, status), review it in a confirmation dialog, and commit it so the new master becomes selectable when scheduling lessons (D-01).

**Why this priority**: Creation (FR-002) is the foundational action — without it there are no masters to edit, duplicate, schedule, or display. The form layout it defines is reused by Edit and Duplicate.

**Independent Test**: Open the form in create mode for a studio lesson and for a personal training program; fill the required fields; trigger the confirmation dialog; confirm; verify the user returns to the lesson list.

**Acceptance Scenarios**:

1. **Given** a permitted user opens the form in create mode, **When** the screen renders, **Then** the page title is "新規レッスン作成", the submit button reads "入力内容を確認する", all fields are empty/default (status toggle defaults to 有効), and the edit-mode warning banner is **not** shown.
2. **Given** the lesson type is "パーソナルトレーニング", **When** the 所要時間 (duration) select opens, **Then** only 30分 and 60分 are offered; **and Given** the lesson type is "スタジオレッスン" or "ボディケア", **Then** the duration options are 15分 / 30分 / 45分 / 50分 / 60分 / 90分 / 120分.
3. **Given** the pricing type is set to "有料（都次）" (pay-per-use), **When** the basic-info section re-renders, **Then** the 都次利用料金（税込） (per-use fee) field with a "円" suffix appears and is required; **and Given** any other pricing type, **Then** that field is hidden.
4. **Given** the user clicks the submit button with one or more required fields empty, **When** validation runs, **Then** the commit is blocked, each empty required field shows the message "{項目名}は必須です。" beneath it, and a summary "入力内容に不備があります。エラー表示の項目をご確認ください。" appears near the footer; the confirmation dialog does **not** open.
5. **Given** all required fields are filled, **When** the submit button is clicked, **Then** a confirmation dialog opens summarizing lesson type, lesson name, pricing type, and status (有効/無効).
6. **Given** the confirmation dialog is open, **When** "この内容で登録する" is clicked, **Then** the dialog closes, a success toast "レッスンを登録しました" is shown, and the user navigates back to the lesson content list.
7. **Given** the form is open, **When** the user clicks "キャンセル" or the "レッスン内容管理に戻る" back link, **Then** the user leaves the form without committing changes.

---

### User Story 2 - Edit an existing lesson content master (Priority: P1)

As a Headquarter or System user, I open the same form in edit mode from a master's detail screen, see the current values pre-populated and editable, adjust them, confirm, and save the update.

**Why this priority**: Edit (FR-004) reuses the full create form and is the primary maintenance action for existing masters; it is required to keep the catalog accurate over time.

**Independent Test**: Open the form in edit mode for a studio lesson and for a personal program; verify pre-filled values, the warning banner, the edit-specific labels, and the save confirmation flow.

**Acceptance Scenarios**:

1. **Given** a permitted user opens the form in edit mode, **When** the screen renders, **Then** the page title is "パーソナルトレーニング編集" (personal) or "スタジオレッスン編集" (studio and ボディケア), the submit button reads "変更を保存する", and a warning banner "料金や制限条件を変更すると、予約済みの会員にも影響する場合があります。" is shown at the top.
2. **Given** edit mode for a studio lesson, **When** the form loads, **Then** the fields are pre-populated with the existing master values (e.g., name "ヨガ基礎クラス", brand JOYFIT, duration 60分, pricing type 月払, description) in editable controls.
3. **Given** edit mode for a personal program, **When** the form loads, **Then** the restriction section is pre-populated with the master's existing restricted main contract(s) and option contract(s) as removable badges.
4. **Given** the user has changed values, **When** the submit button is clicked (and validation passes), **Then** a confirmation dialog titled "この内容で変更を保存しますか？" opens; **and When** "この内容で保存する" is clicked, **Then** the dialog closes, a success toast "レッスンの変更を保存しました" is shown, and the user navigates back to the lesson content list.

---

### User Story 3 - Duplicate a lesson content master into a new draft (Priority: P2)

As a Headquarter or System user, I trigger "複製" (Duplicate) from a master, which opens the create form pre-seeded from the source master with the lesson name suffixed "（コピー）", so I can quickly produce a near-identical master without re-entering everything.

**Why this priority**: Duplicate (FR-006) accelerates catalog creation but depends entirely on the create flow (US1); it is a convenience layered on top of creation.

**Independent Test**: Open the form via the duplicate entry (create mode with `copy=1` and a `name` parameter); verify the lesson name is pre-filled with the copied name and the screen otherwise behaves like a create form, ending in the registration confirmation flow.

**Acceptance Scenarios**:

1. **Given** the form is opened in duplicate mode (create mode with `copy=1` and a `name` query parameter), **When** the screen renders, **Then** the lesson name field is pre-filled with the passed copied name and the title/submit labels are the create-mode labels ("新規レッスン作成" / "入力内容を確認する").
2. **Given** duplicate mode, **When** the user reviews and adjusts the pre-filled values and submits, **Then** the standard create confirmation dialog ("以下の内容で登録します。よろしいですか？") is shown and confirmation registers a new master.
3. **Given** the name suffix "（コピー）" is expected per FR-006, **When** the duplicate entry is invoked, **Then** the copied name carrying the "（コピー）" suffix is the source of the pre-filled name. The suffix is appended by the originating detail screen — `lesson-detail.tsx` navigates with `name: <sourceName> + "（コピー）"` — and `lesson-form.tsx` renders it verbatim from the `name` query parameter.

---

### User Story 4 - Manage reservation restrictions, images, description, and status (Priority: P2)

As a permitted user filling the form, I can attach reservation restrictions (restricted main contracts / option contracts via multi-select), add and reorder lesson images, write a description with basic rich-text formatting, record internal notes, and toggle the active/inactive status.

**Why this priority**: These optional sections complete the master definition and are shared across create/edit/duplicate; they are secondary to the required basic-info fields but are explicitly part of FR-002.

**Independent Test**: In any mode, add/remove restriction badges via the searchable popovers, add/remove/reorder images, type a description, enter notes, and toggle the status switch.

**Acceptance Scenarios**:

1. **Given** the 予約制限 (reservation restriction) section, **When** no restriction is selected, **Then** each control shows "制限なし（複数選択可）"; **and When** items are selected from the searchable popover list, **Then** they appear as removable badges and the corresponding row in the popover shows a check mark.
2. **Given** a selected restriction badge, **When** its "X" is clicked, **Then** that restriction is removed from the selection.
3. **Given** the restriction search popover is open, **When** a search term matches no entries, **Then** "該当する契約がありません" (main) / "該当するオプションがありません" (option) is displayed.
4. **Given** the レッスン画像 (lesson images) section with one or more images, **When** an image is dragged over another, **Then** the drop target is highlighted; **and When** dropped, **Then** the image order updates and the first image shows a "メイン" (main) marker.
5. **Given** an image card, **When** its delete (trash) control is clicked, **Then** that image is removed from the list.
6. **Given** the description section, **When** the lesson type is personal, **Then** the section heading reads "トレーニング内容説明" and the placeholder targets personal training; **and Given** a studio lesson, **Then** the heading reads "レッスン内容説明".
7. **Given** the ステータス (status) section, **When** the form renders, **Then** a "現在のステータス" label, a status `Switch` (default on/active), and a state badge are shown — 有効 (green) when active or 無効 (muted) when off — with the helper text "無効にすると、新規スケジュール登録時の選択肢に表示されません。既存のスケジュールは引き続き有効です。"; **and When** the switch is toggled, **Then** the badge updates accordingly.

---

### Edge Cases

- **Lesson-type switch changes duration options**: switching to personal narrows 所要時間 to 30分 / 60分; switching to studio or bodycare restores the full set 15/30/45/50/60/90/120分. (Capacity is no longer part of the master — see Out of Scope / Assumptions.)
- **Per-use fee visibility**: the per-use fee field exists only while pricing type is "有料（都次）"; changing away from it hides the field (and a previously entered value is not retained once hidden).
- **Empty image list**: when no images exist, only the drag-and-drop upload zone is shown (no image grid); the "メイン" marker applies only to the first image once at least one exists.
- **Required-field omission**: clicking submit with an empty required field (name, brand, duration, pricing type, and — when pricing type is 有料（都次） — per-use fee) blocks the commit, renders "{項目名}は必須です。" under each offending field, and shows a footer summary "入力内容に不備があります。エラー表示の項目をご確認ください。". The error on a field clears as soon as that field is edited.
- **Duration option set**: the duration dropdown for studio/bodycare includes 120分 (aligned with D-02); the personal set is intentionally limited to 30分 / 60分 per D-01 (PT 月次プラン60分 / 都度払い30分・60分).
- **Permission gating**: the form screen itself has no role gating, but the create/edit/duplicate **entry points** are gated to Headquarter and System (see FR-009-P1-01). The list-screen "新規レッスン作成" button MUST be wrapped in `RoleGatedButton allowedRoles={["Headquarter", "System"]}` to match the detail-screen entry points (Q5 resolved).
- **Unsaved-changes navigation**: clicking "キャンセル"/back/confirm-cancel discards entered data with no unsaved-changes warning in the prototype.

## Requirements _(mandatory)_

### Component Hierarchy & Layout Structure

- App shell: `SharedSidebar` (active entry `lesson-form`) + `SidebarInset` containing `SharedHeader` + a scrollable `main` (muted background).
- `PageHeader` (max-width 960px, centered):
  - Breadcrumb: `BackLink` "レッスン内容管理に戻る" → navigates to the lesson list.
  - Title: dynamic — "新規レッスン作成" (create/duplicate) or "スタジオレッスン編集" / "パーソナルトレーニング編集" (edit).
- Edit-only `Alert` warning banner (shown only in edit mode): "料金や制限条件を変更すると、予約済みの会員にも影響する場合があります。"
- Form body (max-width 960px, vertical stack of `Card`s), each with a numbered `SectionHeader`:
  - **Section 1 — 基本情報 (Basic Info)** (2-column grid):
    - レッスン名 (Lesson name) — `Input`, full width, required marker; shows error "レッスン名は必須です。" when empty on submit.
    - レッスン区分 (Lesson type) — `Select`: スタジオレッスン / パーソナルトレーニング / ボディケア; drives `lessonType`, `isPersonal`, `isBodycare` (duration options, description heading, edit-mode title).
    - ブランド (Brand) — `Select`: JOYFIT / FIT365; required, placeholder "選択してください"; error "ブランドは必須です。".
    - 所要時間 (Duration) — `Select`, required: personal → 30分 / 60分; studio & bodycare → 15分 / 30分 / 45分 / 50分 / 60分 / 90分 / 120分; error "所要時間は必須です。".
    - 料金種別 (Pricing type) — `Select`: 無料 / 有料（月払） / 有料（都次）; required, drives per-use fee visibility; error "料金種別は必須です。".
    - 都次利用料金（税込） (Per-use fee) — `Input` + "円" suffix; conditional on pricing type = 有料（都次）, required when shown; error "都次利用料金は必須です。".
    - (定員 / capacity is **not** present — finalized on the schedule side per D-02.)
  - **Section 2 — 予約制限 (Reservation Restriction)** (2-column grid): 制限主契約 and 制限オプション契約, each a `Popover` + `Command` searchable multi-select rendering selected values as removable `Badge`s.
  - **Section 3 — レッスン画像 (Lesson Images)**: sortable image grid (drag handle, "メイン" marker on first image, delete button per card) + dashed drag-and-drop upload zone with "画像を追加" button and guidance text (推奨 1200×800px 3:2; JPG/PNG/WebP; 最大5MB; 複数枚対応).
  - **Section 4 — レッスン内容説明 / トレーニング内容説明 (Description)**: simple rich-text toolbar (block-style `Select`: 標準 / 見出し1 / 見出し2; B/I/U/S buttons) + `Textarea`; heading & placeholder vary by lesson type.
  - **Section 5 — 備考 (Notes)**: `Textarea`, placeholder "内部メモ・備考を入力（会員には表示されません）".
  - **Section 6 — ステータス (Status)**: a "現在のステータス" label, a state `Badge` (有効 green / 無効 muted) that reflects the toggle, and a `Switch` (default checked), with helper text "無効にすると、新規スケジュール登録時の選択肢に表示されません。既存のスケジュールは引き続き有効です。".
- Footer actions (right-aligned, top border): `Button` "キャンセル" (outline → browser back) and `Button` submit (label "入力内容を確認する" / "変更を保存する"). When validation fails, a destructive summary line "入力内容に不備があります。エラー表示の項目をご確認ください。" is shown beneath the footer.
- Overlay: confirmation `AlertDialog` whose title varies by mode ("以下の内容で登録します。よろしいですか？" create / "この内容で変更を保存しますか？" edit), summarizing レッスン区分, レッスン名, 料金種別, and ステータス (有効/無効). Cancel ("キャンセル") closes it; confirm ("この内容で登録する" / "この内容で保存する") fires a success toast and navigates to the lesson list.

### Functional Requirements

- **FR-002-P1-01 (Mapped: D-02 FR-002)**: System MUST provide a lesson content master form screen for creating a new master, presenting all registration fields in editable controls grouped into the six sections (Basic Info, Reservation Restriction, Images, Description, Notes, Status).
- **FR-002-P1-02 (Mapped: D-02 FR-002)**: System MUST render the page title as "新規レッスン作成" and the submit button as "入力内容を確認する" in create mode (including duplicate mode).
- **FR-002-P1-03 (Mapped: D-02 FR-002)**: System MUST provide a レッスン名 (lesson name) text input marked as required.
- **FR-002-P1-04 (Mapped: D-02 FR-002)**: System MUST provide a レッスン区分 (lesson type) select with options スタジオレッスン, パーソナルトレーニング, ボディケア, marked required.
- **FR-002-P1-05 (Mapped: D-02 FR-002)**: System MUST provide a ブランド (brand) select with options JOYFIT and FIT365, marked required.
- **FR-002-P1-06 (Mapped: D-02 FR-002 / 260615_v3)**: System MUST NOT include a 定員 (capacity) field in the master form; capacity is finalized on the schedule side (D-01), consistent with D-02 260615_v3.
- **FR-002-P1-07 (Mapped: D-02 FR-002 / D-01)**: System MUST provide a 所要時間 (duration) select, marked required. For パーソナルトレーニング the options MUST be 30分 / 60分; for スタジオレッスン and ボディケア the options MUST be 15分 / 30分 / 45分 / 50分 / 60分 / 90分 / 120分.
- **FR-002-P1-08 (Mapped: D-02 FR-002)**: System MUST provide a 料金種別 (pricing type) select with options 無料, 有料（月払）, 有料（都次）, marked required.
- **FR-002-P1-09 (Mapped: D-02 FR-002)**: System MUST display a 都次利用料金 (per-use fee) numeric input with a "円" suffix only when pricing type is 有料（都次）, and hide it otherwise.
- **FR-002-P1-10 (Mapped: D-02 FR-002)**: System MUST provide a 予約制限 (reservation restriction) section allowing optional multi-selection of restricted main contracts and restricted option contracts via searchable lists, each displaying selected items as removable badges and showing "制限なし（複数選択可）" when empty.
- **FR-002-P1-11 (Mapped: D-02 FR-002)**: System MUST show empty-search feedback ("該当する契約がありません" / "該当するオプションがありません") when a restriction search yields no matches.
- **FR-002-P1-12 (Mapped: D-02 FR-002)**: System MUST provide a レッスン画像 (lesson images) section supporting multiple optional images with add, delete, and drag-and-drop reordering, marking the first image as "メイン" (main).
- **FR-002-P1-13 (Mapped: D-02 FR-002)**: System MUST provide a description section (レッスン内容説明 / トレーニング内容説明 by lesson type) with a basic formatting toolbar (block style select + Bold/Italic/Underline/Strikethrough controls) and a multi-line text area; the section is optional.
- **FR-002-P1-14 (Mapped: D-02 FR-002)**: System MUST provide an optional 備考 (notes) text area presented as an internal memo not shown to members.
- **FR-002-P1-15 (Mapped: D-02 FR-002 / FR-005 status)**: System MUST provide a ステータス (status) section with a "現在のステータス" label, a state badge (有効/無効) that reflects the toggle, and a `Switch` (default active), with helper text "無効にすると、新規スケジュール登録時の選択肢に表示されません。既存のスケジュールは引き続き有効です。".
- **FR-002-P1-16 (Mapped: D-02 FR-002)**: System MUST show a confirmation dialog summarizing the lesson type, lesson name, pricing type, and status (有効/無効) before committing a creation, and MUST register the master only upon explicit confirmation ("この内容で登録する"), after which it MUST display a success toast ("レッスンを登録しました") and navigate to the lesson list.
- **FR-002-P1-17 (Mapped: D-02 FR-002)**: System MUST allow the user to cancel the form (via "キャンセル", the back link, or the confirmation dialog cancel) without committing, returning to the prior screen / lesson list.
- **FR-002-P1-18 (Mapped: D-02 FR-002 必須チェック)**: System MUST validate required fields (レッスン名, ブランド, 所要時間, 料金種別, and — when pricing type is 有料（都次）— 都次利用料金) before opening the confirmation dialog, presenting "{項目名}は必須です。" beneath each empty field and a footer summary "入力内容に不備があります。エラー表示の項目をご確認ください。"; a field's error MUST clear when that field is edited. (レッスン区分 always carries a value and needs no error.)
- **FR-004-P1-01 (Mapped: D-02 FR-004)**: System MUST reuse the same form (all FR-002 fields, editable) for editing an existing master, pre-populated with the master's current values.
- **FR-004-P1-02 (Mapped: D-02 FR-004)**: System MUST render the page title as "スタジオレッスン編集" / "パーソナルトレーニング編集" (by lesson type) and the submit button as "変更を保存する" in edit mode.
- **FR-004-P1-03 (Mapped: D-02 FR-004)**: System MUST display an edit-mode warning that changing pricing or restriction conditions may affect already-reserved members.
- **FR-004-P1-04 (Mapped: D-02 FR-004)**: System MUST apply the same validation as create (see FR-002-P1-18) when saving an edit.
- **FR-004-P1-05 (Mapped: D-02 FR-004)**: System MUST show a confirmation dialog titled "この内容で変更を保存しますか？" and persist the update only upon "この内容で保存する", after which it MUST display a success toast ("レッスンの変更を保存しました") and navigate to the lesson list.
- **FR-006-P1-01 (Mapped: D-02 FR-006)**: System MUST support a duplicate flow that opens the create form pre-filled from the source master's values, identified by the create mode with a `copy` flag and a passed lesson `name`.
- **FR-006-P1-02 (Mapped: D-02 FR-006)**: System MUST pre-fill the lesson name in duplicate mode with the copied name, and otherwise behave as the create flow (title, submit label, and registration confirmation). The "（コピー）" name suffix required by FR-006 is appended by the originating detail screen (`lesson-detail.tsx` passes `name: <sourceName> + "（コピー）"`); the form renders the `name` query parameter verbatim.
- **FR-007-P1-01 (Mapped: D-02 FR-004 / FR-006 — UX state)**: System MUST display a skeleton loading state while fetching the source master for edit/duplicate pre-fill, consistent with the list/detail screens (`007`/`008`), and reveal the populated form once values are loaded. Create mode (no pre-fill) renders immediately without a loading state.
- **FR-009-P1-01 (Mapped: D-02 authority matrix / FR-002·FR-004·FR-006 制限事項)**: System MUST restrict create, edit, and duplicate of lesson content masters to roles **Headquarter** and **System**. The detail-screen 複製 / 編集 / 削除 entry points already enforce this via a role-gated button (`allowedRoles={["Headquarter", "System"]}`). The list-screen "新規レッスン作成" button MUST be wrapped in `RoleGatedButton allowedRoles={["Headquarter", "System"]}` so it is gated the same way. The form screen itself remains ungated; gating is applied at the entry points (Q5 resolved).

### UI Interaction Scenarios (Code-Grounded)

- Change レッスン区分 select → toggles studio/personal/bodycare behavior (duration option set, description heading/placeholder, edit-mode title).
- Change 料金種別 select → shows/hides the per-use fee field.
- Click submit with missing required fields → inline "{項目名}は必須です。" errors + footer summary; dialog does not open. Editing a field clears its error.
- Open 制限主契約 / 制限オプション契約 popover → search and toggle entries; selected entries render as badges with a check mark in the list.
- Click a badge "X" → remove that restriction from the selection.
- Drag an image card over another and drop → reorder images; first becomes "メイン".
- Click an image's trash button → remove that image.
- Click "画像を追加" / use the dashed zone → image upload affordance (prototype: visual zone only; actual upload binding deferred).
- Click a description toolbar control (block select, B/I/U/S) → formatting affordance (prototype: visual only).
- Toggle the ステータス switch → set active/inactive intent; the 有効/無効 badge updates.
- Click submit ("入力内容を確認する" / "変更を保存する") → validate, then open the confirmation dialog if valid.
- In the confirmation dialog, click confirm → close dialog, show success toast, and navigate to the lesson list; click cancel → close dialog, stay on form.
- Click "キャンセル" → browser back; click the back link → navigate to the lesson list.

### UI States (Loading / Empty / Data / Error)

- **Create (empty) state**: all fields empty/at defaults; status toggle on (有効 badge); no images grid; no warning banner; create-mode labels.
- **Edit (data-rendered) state**: fields pre-populated from the existing master (prototype uses hardcoded sample values per studio/personal); warning banner shown; edit-mode labels; existing images shown in the sortable grid; existing restriction badges shown (personal sample).
- **Duplicate (pre-filled create) state**: create-mode labels with the lesson name pre-filled from the copied name (carrying the "（コピー）" suffix); other fields behave as create.
- **Validation-error state**: inline "{項目名}は必須です。" under each invalid field plus a footer summary; confirmation dialog suppressed until valid.
- **Submit-success state**: a success toast ("レッスンを登録しました" / "レッスンの変更を保存しました") followed by navigation to the lesson list.
- **Conditional sub-states**: per-use fee visible only for pay-per-use; duration options vary by lesson type; image grid hidden when no images; restriction controls show "制限なし（複数選択可）" when empty; description heading/placeholder vary by lesson type; status badge reflects the toggle.
- **Loading (edit/duplicate pre-fill) state**: while the source master is being fetched for edit or duplicate pre-fill, the form MUST show a **skeleton loading** state (consistent with the list/detail screens `007`/`008`) until values are populated; create mode has no pre-fill and renders immediately. (Q6 resolved.)
- **Submit state**: on confirm the form shows a success toast and navigates; no dedicated submit-error UI is modeled in Phase 1 (toast + navigate only). (Q6 resolved.)

### Traceability Matrix (UI Element → Source Requirement)

| UI Element / Behavior in `lesson-form.tsx`                      | Requirement Mapping in `D-02.md`                          | Notes                                                                         |
| --------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Create form with all fields (create mode)                       | FR-002 概要 / 登録項目                                    | Direct alignment                                                              |
| Page title / submit label by mode                               | FR-002 / FR-004                                           | Create vs. edit labels                                                        |
| レッスン名 input (required)                                     | FR-002 レッスン名（必須）                                 | Direct alignment                                                              |
| レッスン区分 select                                             | FR-002 レッスン区分（必須）                               | スタジオ/パーソナル/ボディケア                                                |
| ブランド select                                                 | FR-002 ブランド（必須）                                   | JOYFIT / FIT365                                                               |
| (no 定員 field)                                                 | FR-002 定員 (finalized on schedule side, 260615_v3)       | Resolved — capacity removed from master (Q4 closed)                           |
| 所要時間 select (personal 30/60; studio・bodycare +120)         | FR-002 所要時間（必須）/ D-01 PT 時間                     | Includes 120分; options vary by type (Q3 closed)                              |
| 料金種別 select                                                 | FR-002 料金種別（必須）                                   | 無料 / 月払 / 都次                                                            |
| 都次利用料金 input (conditional)                                | FR-002 都次利用料金（都次の場合必須）                     | Visibility tied to pricing type                                               |
| 予約制限 (main/option multi-select)                             | FR-002 予約制限（制限主契約・制限オプション・複数・任意） | Direct alignment                                                              |
| レッスン画像 (multi, drag-reorder, delete, main marker)         | FR-002 レッスン画像（複数・D&D並び替え）                  | Direct alignment                                                              |
| Description toolbar + textarea                                  | FR-002 レッスン説明（リッチテキスト・任意）               | Toolbar visual only in prototype                                              |
| 備考 textarea ("会員には表示されません")                        | FR-002 備考（内部メモ・任意）                             | Direct alignment                                                              |
| ステータス section (label + badge 有効/無効 + switch)           | FR-002 / FR-005 (有効/無効)                               | "無効化" excludes from new schedule choices; existing kept                    |
| Confirmation dialog (type/name/pricing/status + confirm/cancel) | FR-002 確認画面を表示後、登録を確定 / FR-004 確認画面     | Summary now includes status; confirm fires success toast                      |
| Edit warning banner                                             | FR-004 編集（料金・制限変更の影響）                       | UI-added safeguard, consistent with FR-004 intent                             |
| Duplicate pre-fill (copy=1 & name)                              | FR-006 複製（全項目コピー / 「（コピー）」付与）          | Suffix appended by caller in `lesson-detail.tsx` (Q1 closed)                  |
| Required-field validation message + footer summary              | FR-002 必須チェック「{項目名}は必須です。」               | Implemented in `validateForm()` (Q2 closed)                                   |
| Create/edit/duplicate permission gating                         | 権限マトリクス: 新規登録・編集・複製 = HQ/System only     | All entry points gated via RoleGatedButton, incl. list create btn (Q5 closed) |

### Out of Scope for Phase 1

Excluded because this request is restricted to the Phase 1 **form screen**; the following belong to other screens/FRs reached only via navigation or are deferred:

- FR-001 list/search screen behavior (`lesson.tsx`).
- FR-003 read-only detail display (`lesson-detail.tsx`).
- FR-005 delete / deactivate behavior and required delete/deactivation reason capture (delete/deactivate dialogs live on the detail screen).
- FR-007 change-history display.
- FR-S001 list filter/sort; FR-S002 member-app **preview** display (no "プレビュー" control exists in `lesson-form.tsx`); FR-S003 multi-instructor schedule display.
- D-01 lesson scheduling/reservation reached via navigation.
- Actual persistence and back-end binding of create/edit/duplicate (on confirm the prototype shows a success toast and navigates; no write contract, loading, or submit-failure handling is defined).
- Real image upload/storage and rich-text serialization (prototype toolbar and upload zone are visual affordances only).
- Instructor association (explicitly NOT part of the master per D-02 — managed on the D-01 schedule side).

### Key Entities _(include if feature involves data)_

- **LessonContentMaster (form draft)**: The program master being created/edited — lesson name, lesson type (studio/personal/body-care), brand (JOYFIT/FIT365), duration, pricing type, per-use fee (conditional), description (rich text), images (ordered list), internal notes, status (active/inactive), and restriction set. (Capacity is not part of the master; it is set on the D-01 schedule side.)
- **RestrictionSet**: Restricted main contracts and restricted option contracts (each a multi-selected list of master values; optional). Source masters: G-01 主契約 / G-02 オプション.
- **ImageItem**: An uploaded lesson image — id, url/source, alt text, and order position (first = "メイン").
- **FormMode**: Create / Edit / Duplicate, derived from `mode` and the `copy` flag, governing titles, labels, pre-fill, the warning banner, confirmation dialog wording, and success-toast text.
- **UserContext / Role**: Current user role used to gate create/edit/duplicate (privileged: Headquarter, System).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A permitted user can complete a new lesson content master, from opening the form to confirming registration, in a single screen without leaving it.
- **SC-002**: The form correctly adapts to lesson type and pricing type in 100% of cases (duration options switch by type — personal 30/60 vs. studio・bodycare full set; per-use fee appears only for pay-per-use).
- **SC-003**: A permitted user can edit an existing master with all current values pre-populated and save via the edit confirmation dialog.
- **SC-004**: A user invoking duplicate sees the form pre-filled from the source master (lesson name pre-filled) and can register a new master through the standard create confirmation.
- **SC-005**: Reservation restrictions can be added and removed via searchable multi-select, and selected restrictions are visible as removable badges at all times.
- **SC-006**: Lesson images can be added, removed, and reordered, with the first image always indicated as the main image.
- **SC-007**: Only Headquarter and System roles can reach the create, edit, or duplicate flows (entry-point gating, including the list-screen "新規レッスン作成" button wrapped in `RoleGatedButton`); all other roles cannot trigger these actions.
- **SC-008**: Required-field validation prevents opening the confirmation dialog for an incomplete master and surfaces a clear per-field "{項目名}は必須です。" message plus a footer summary.
- **SC-009**: When opening the form in edit or duplicate mode, a skeleton loading state is shown until the source master's values are pre-filled.

## Assumptions

- This specification describes the form-screen behavior, using `src/pages/lesson-form.tsx` as the authoritative UI source for visible components, layout, and interactions, cross-checked against `D-02.md`.
- The single `LessonForm` component serves all three modes (create, edit, duplicate); duplicate is a create variant detected via the `copy` query flag with a passed `name`.
- The authority matrix in `D-02.md` (System ○ / Headquarter ○; Manager / Staff / Trainer / Observer ×) governs create/edit/duplicate; the System role is treated as privileged consistent with the matrix and with the sibling detail spec (`008-lesson-content-detail`).
- Sample/mock values in the prototype (edit-mode sample text, sample images, sample restriction selections, restriction master lists) represent data shape only; actual data binding is defined in later phases.
- Instructor information is intentionally excluded from the master per D-02 (managed at D-01 schedule registration); no instructor field is expected on this form.
- 定員 (capacity) is intentionally excluded from the master per D-02 260615_v3 (finalized on the D-01 schedule side); no capacity field is expected on this form.
- Phase 1 scope does not implement non-form FRs even when referenced in `D-02.md`; navigation entry points are in scope, target screens are not.

## Q&A / Clarification

Re-grounded against the latest `lesson-form.tsx`, `lesson-detail.tsx`, and `lesson.tsx`. All questions (Q1–Q6) are now resolved; see the `## Clarifications` section for the Session 2026-06-29 answers to Q5 and Q6.

### Q1. Source of the "（コピー）" name suffix (FR-006) — ✅ Resolved

The suffix is appended by the originating detail screen: `lesson-detail.tsx` navigates with `navigate("lesson-form", undefined, { copy: "1", name: data.name + "（コピー）" })`. `lesson-form.tsx` reads `copy=1` and `name` and pre-fills the name verbatim. No form-side suffixing is required.

### Q2. Required-field validation (FR-002 必須チェック) — ✅ Resolved

`validateForm()` validates レッスン名, ブランド, 所要時間, 料金種別, and (conditionally) 都次利用料金, setting per-field "{項目名}は必須です。" messages and a footer summary; the confirmation dialog opens only when valid. Errors clear as each field is edited. (No 定員 validation — the field no longer exists.)

### Q3. Duration option set — ✅ Resolved

The duration select includes 120分 for studio/bodycare (15/30/45/50/60/90/120分) and is limited to 30分 / 60分 for personal training (per D-01 PT durations).

### Q4. Capacity (定員) in the master — ✅ Resolved

The 定員 field has been removed from the form, aligning with D-02 260615_v3 (capacity finalized on the schedule side). No capacity control exists in the current UI.

### Q5. Permission gating — ✅ Resolved

The list-screen "新規レッスン作成" button MUST be wrapped in `RoleGatedButton allowedRoles={["Headquarter", "System"]}` so it matches the detail-screen 複製 / 編集 / 削除 entry points. The form screen itself stays ungated — gating is applied at the entry points only (see FR-009-P1-01).

### Q6. Loading / submit-error states — ✅ Resolved

The form MUST show a **skeleton loading** state while fetching the source master for edit/duplicate pre-fill, consistent with the list/detail screens (`007`/`008`); create mode renders immediately. Submit remains toast + navigate — no dedicated submit-error UI is modeled in Phase 1 (see FR-007-P1-01 and UI States).
