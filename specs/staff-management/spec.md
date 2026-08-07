# Feature Specification: Staff List — Y-01 スタッフ・権限管理

**Feature Branch**: `001-staff-list`
**Feature ID**: Y-01 (FR-001)
**Created**: 2026-04-08
**Status**: Draft
**Document Version**: 260330_v1
**Project**: Move to Happy — 会員管理基盤システム（CRM）刷新
**Brands**: JOYFIT / FIT365 (共通)

---

## Clarifications

### Session 2026-04-08

- Q: What is the page route — `/staff` or `/settings/staff`? → A: `/settings/staff` (nested under the Y-category system-settings section)
- Q: How is a Manager's 管轄 scope determined at query time? → A: Each staff belongs to exactly one **Branch** (`branch`). A Branch contains one or more Stores (`chi nhánh` / 店舗). Manager-role staff manage at the Branch level (scope = all stores within their branch); Staff-role staff belong to a single Store. Scope is derived from the staff record's `branch_id` field via a Branch → Store relationship table.
- Q: Does the staff `brand` field support all 5 brand values or only `joyfit | fit365 | null`? → A: Staff `brand` is always `joyfit | fit365 | null`. Sub-brands (`JOYFIT+`, `JOYFIT YOGA`, `JOYFIT24`) are store-level attributes; the ブランド filter maps them to their parent brand server-side.
- Q: Row actions menu — does 無効化 appear, and what is the delete UX? → A: The `…` menu shows **編集** and **削除** only (no 無効化). 削除 opens an `<AlertDialog>` with title "スタッフを削除しますか？", body copy "このスタッフアカウントを削除すると、ログインできなくなります。この操作は取り消せません。", an optional **削除理由** textarea, キャンセル button, and a destructive **削除する** button. On success, the row is removed and a `sonner` success toast is shown.
- Q: What is the default sort order on initial page load? → A: `sort_by=staff_id&sort_order=asc` — matches the screenshot order (STF-001 → STF-008).
- Q: `スタッフを招待` UX — Sheet, full-page route, or Dialog? → A: `<Dialog>` (modal). The dialog contains: description text, 招待時の職位 `<Select>` (default: 正社員スタッフ), 招待時のブランド `<Select>` (default: 全ブランド), メールアドレス `<Textarea>` (required; multiple addresses separated by newlines), `+ リストに追加` button, 招待リスト empty state, キャンセル and `招待メールを送信` buttons.

---

## User Scenarios & Testing

<!--
  Stories are ordered by delivery value: each story is an independently shippable
  increment. P1 is the minimum viable staff-list screen; subsequent priorities
  layer on progressively richer interaction.
-->

### User Story 1 — Basic Staff List Display (Priority: P1)

As a **Headquarter (本部)** user, I need to see a paginated table of all staff
accounts — ID, name, email, 職位 (position), brand, status, and last-login — so
that I can confirm who has CRM access at a glance.

**Why this priority**: Without a rendered list the feature has zero value. Every
other story depends on the table being visible.

**Independent Test**: Navigate to `/staff` while authenticated as an HQ user.
The table renders 8 mock rows matching the screenshot (STF-001 … STF-008), the
correct columns appear, ステータス badges are colour-coded (有効 = green,
無効 = muted), and the footer shows "全 8 件中 1–8 件を表示".

**Acceptance Scenarios**:

1. **Given** an HQ user is logged in,
   **When** they navigate to `/staff`,
   **Then** a `<DataTable>` renders with columns
   `[スタッフID, 管理者名, メールアドレス, 職位, ブランド, ステータス, 最終ログイン, actions (…)]`
   in that order.

2. **Given** the API returns 8 staff records,
   **When** the page loads,
   **Then** each row displays the correct values and the `ステータス` column shows
   a green `有効` badge or a muted `無効` badge per record.

3. **Given** the table is rendered,
   **When** no data-fetch error occurs,
   **Then** the footer reads `全 N 件中 1–M 件を表示` where N = total records
   and M = records currently rendered.

4. **Given** a Manager user is logged in,
   **When** they navigate to `/settings/staff`,
   **Then** only rows whose staff record belongs to a Store within the Manager's
   Branch (`branch_id` on the Manager's own staff record) are shown;
   staff from other Branches are absent.

5. **Given** a Staff / Trainer / Observer user is logged in,
   **When** they attempt to navigate to `/settings/staff`,
   **Then** they are redirected to `/403`.

---

### User Story 2 — Quick Search by Name / Email (Priority: P2)

As a **Headquarter or Manager** user, I need to type a staff member's name or
email into the search bar so that I can locate a specific account without
scrolling through the entire list.

**Why this priority**: Name/email search is the most frequent daily interaction;
all filter permutations depend on the same query-param plumbing established here.

**Independent Test**: Type "佐藤" into the search input; after the debounce
(300 ms) the table updates to show only rows whose `管理者名` contains "佐藤".
Clear the input; the full list reappears.

**Acceptance Scenarios**:

1. **Given** the staff list is displayed,
   **When** the user types a partial name (e.g., "田中") into the
   `名前・メールアドレスで検索...` input,
   **Then** after a 300 ms debounce the table re-fetches and shows only rows
   whose `name_kanji`, `name_kana`, or `email` matches the query (case-insensitive).

2. **Given** a search term is active,
   **When** the user clears the input,
   **Then** the full list is restored without a page reload.

3. **Given** the user searches for a string that matches no records,
   **When** the API returns zero results,
   **Then** the table shows the standard `<Empty>` state ("該当するスタッフが見つかりません") and the
   footer reads "全 0 件".

---

### User Story 3 — Advanced Filter Panel (Priority: P2)

As an **HQ or Manager** user, I need to open a "詳細フィルター" panel and filter
staff by 職位, ブランド, and ステータス so that I can narrow the list to a targeted
cohort without leaving the page.

**Why this priority**: Shares the same query-param state as US2; implementing
both in the same iteration avoids duplicate plumbing.

**Independent Test**: Click `詳細フィルター ▾` to expand the panel; the toggle
label changes to `閉じる ▴`. Set ステータス = `無効`; only rows with
`status = inactive` appear. Click `すべてクリア`; all filters reset and the full
list returns. Click `閉じる ▴`; the panel collapses.

**Acceptance Scenarios**:

1. **Given** the staff list is displayed and the filter panel is collapsed,
   **When** the user clicks `詳細フィルター ▾` (top-right of the filter bar),
   **Then** the filter row expands below the search bar showing three `<Select>`
   controls in order: `[全職位, 全ブランド, 全ステータス]`, and the toggle button
   label changes to `閉じる ▴`.

2. **Given** the filter panel is open,
   **When** the user clicks `閉じる ▴`,
   **Then** the filter row collapses and the toggle label reverts to
   `詳細フィルター ▾`; active filter values are **preserved** (not cleared).

3. **Given** the filter panel is open,
   **When** the user opens the `全職位` dropdown,
   **Then** the dropdown lists all 11 position options in this order:
   `本部管理者`, `ブロック長`, `テリトリーマネージャー`, `店舗責任者`,
   `正社員スタッフ`, `契約社員スタッフ`, `アルバイト（スーパー）`,
   `アルバイト（一般）`, `社員トレーナー`, `社外トレーナー`, `閲覧専任`
   with a `全職位` (no-filter) option at the top carrying a checkmark when selected.

4. **Given** the filter panel is open,
   **When** the user opens the `全ブランド` dropdown,
   **Then** the dropdown lists exactly five brand options:
   `JOYFIT`, `JOYFIT+`, `JOYFIT YOGA`, `JOYFIT24`, `FIT365`
   with `全ブランド` at the top as the default/reset option.

5. **Given** the filter panel is open,
   **When** the user opens the `全ステータス` dropdown,
   **Then** the dropdown lists two options: `有効`, `無効`
   with `全ステータス` at the top as the default/reset option.

6. **Given** the filter panel is open,
   **When** the user selects `ブランド = FIT365`,
   **Then** the table re-fetches with `brand=fit365` in the URL search params
   (nuqs) and shows only staff whose `brand` is `fit365`.

7. **Given** the filter panel is open and `職位 = 店舗責任者` is selected,
   **When** the user additionally selects `ステータス = 有効`,
   **Then** the table re-fetches with both params and shows only active store
   managers; the URL reflects both filters simultaneously.

8. **Given** one or more filters are active,
   **When** the user clicks `すべてクリア` (top-right of the filter bar),
   **Then** all three filter selects reset to their default ("全…") values,
   all filter URL params are removed, and the full list reloads in one request.

9. **Given** filter combinations produce zero results,
   **When** the API returns an empty page,
   **Then** the `<Empty>` component is displayed (same as US2 scenario 3).

---

### User Story 4 — Column Sorting (Priority: P3)

As an **HQ or Manager** user, I need to click a column header to sort the staff
list by that column (ascending / descending) so that I can quickly find recently
active or inactive accounts.

**Why this priority**: Complements search and filter but is not required for the
core navigation flow.

**Independent Test**: Click the `最終ログイン` column header; rows reorder from
most-recent to oldest. Click again; order reverses.

**Acceptance Scenarios**:

1. **Given** the table is rendered with no `sort_by` URL param,
   **Then** rows are ordered by `スタッフID` ascending (STF-001 → STF-002 → …)
   and the `スタッフID` column header shows the active ascending sort indicator.

2. **Given** the table is rendered,
   **When** the user clicks the `スタッフID` column header (`↑↓` icon visible),
   **Then** the table re-fetches with `sort_by=staff_id&sort_order=asc` and
   rows are ordered accordingly; the `↑` icon becomes active.

3. **Given** a column is sorted ascending,
   **When** the user clicks the same header again,
   **Then** the sort flips to descending (`sort_order=desc`).

4. **Given** a sort is active,
   **When** the page is refreshed,
   **Then** the sort state is preserved via URL params (nuqs).

Sortable columns: `スタッフID`, `管理者名`, `職位`, `ステータス`, `最終ログイン`.
Non-sortable: `メールアドレス`, `ブランド`, `actions`.

---

### User Story 5 — Row Actions Menu (Priority: P3)

As an **HQ** user, I need to click the `…` menu on a staff row to access
**編集** and **削除** so that I can navigate to the edit form or permanently
remove an account directly from the list.

**Why this priority**: Provides account lifecycle management; depends on the list
being stable (P1–P3).

**Independent Test**: Click `…` on any row; the dropdown shows exactly two items:
`編集` and `削除`. Click `削除`; the dialog opens with the correct copy and a
削除理由 textarea. Submit; the row disappears and a success toast appears.

**Acceptance Scenarios**:

1. **Given** the user clicks the `…` (`MoreHorizontal`) icon on any row,
   **Then** a `<DropdownMenu>` opens with exactly two items in order:
   `[✏ 編集, 🗑 削除]`. No 無効化 / 有効化 item is present.

2. **Given** the dropdown is open,
   **When** the user clicks `編集`,
   **Then** the router navigates to `/settings/staff/[staffId]`.

3. **Given** the dropdown is open,
   **When** the user clicks `削除`,
   **Then** an `<AlertDialog>` opens with:
   - **Title**: スタッフを削除しますか？
   - **Body**: このスタッフアカウントを削除すると、ログインできなくなります。この操作は取り消せません。
   - **Field**: 削除理由 — `<Textarea>` with placeholder "削除理由を入力してください（任意）" (optional)
   - **Buttons**: `キャンセル` (secondary) · `削除する` (destructive, red)

4. **Given** the delete dialog is open,
   **When** the user clicks `キャンセル` or presses Escape,
   **Then** the dialog closes with no API call made and the row remains.

5. **Given** the delete dialog is open,
   **When** the user clicks `削除する` (with or without a 削除理由),
   **Then** `DELETE /crm/staff/[id]` is called with `{ reason?: string }`,
   the dialog closes, the row is removed from the table (optimistic removal),
   and a `sonner` success toast appears: "スタッフを削除しました".

6. **Given** the `DELETE` API call fails,
   **Then** the row is restored (rollback optimistic removal), the dialog
   closes, and a `sonner` error toast appears: "削除に失敗しました。再度お試しください。"

7. **Given** a Manager user is viewing the list,
   **When** they click the `…` menu,
   **Then** only `編集` is shown; `削除` is absent from the DOM.

---

### User Story 6 — Invite New Staff (Priority: P3)

As an **HQ** user, I need to click `スタッフを招待` to open an invitation
`<Dialog>`, select a position and brand, enter one or more email addresses,
build a staging list, and send invitation emails so that new staff can create
their own CRM accounts via the emailed link.

**Why this priority**: Invitation is the only account-creation entry point for
HQ; decoupled from the list and can ship after P1–P2 are stable.

**Independent Test**: Click `スタッフを招待`; a `<Dialog>` opens. Select
`正社員スタッフ` + `JOYFIT`, type two addresses separated by a newline, click
`+ リストに追加`; both addresses appear in 招待リスト. Click `招待メールを送信`;
dialog closes and a success toast confirms.

**Acceptance Scenarios**:

1. **Given** an HQ user is on `/settings/staff`,
   **When** they click `スタッフを招待` (top-right),
   **Then** a `<Dialog>` opens with:
   - Sub-title: "招待メールを送信します。受信者がメール内のリンクからアカウントを作成します。"
   - 招待時の職位 `<Select>` (default: `正社員スタッフ`)
   - 招待時のブランド `<Select>` (default: `全ブランド`)
   - メールアドレス `<Textarea>` (required, placeholder: "example@joyfit.co.jp\n複数人を招待する場合は改行で区切ってください")
   - `+ リストに追加` button
   - 招待リスト section (empty state by default)
   - `キャンセル` and `招待メールを送信` buttons

2. **Given** the dialog is open and the user has typed one or more email
   addresses (newline-separated) into the textarea,
   **When** they click `+ リストに追加`,
   **Then** each valid address is parsed and added as a row in 招待リスト
   with the currently selected 職位 and ブランド, and the textarea is cleared.

3. **Given** the dialog is open with the textarea empty,
   **When** the user clicks `+ リストに追加`,
   **Then** the button does nothing (disabled or no-op); no rows are added.

4. **Given** 招待リスト contains one or more entries,
   **When** the user clicks `招待メールを送信`,
   **Then** `POST /crm/staff/invitations` is called with the list of
   `{ email, position_id, brand }` entries, the dialog closes, and a
   `sonner` success toast appears: "招待メールを送信しました".

5. **Given** the invitation API call fails,
   **Then** the dialog remains open, inputs are preserved, and a `sonner`
   error toast appears: "送信に失敗しました。再度お試しください。"

6. **Given** 招待リスト is empty,
   **When** the user clicks `招待メールを送信`,
   **Then** the button is disabled; no API call is made.

7. **Given** a non-HQ user is viewing the page,
   **When** the page renders,
   **Then** the `スタッフを招待` button is absent from the DOM.

---

### Edge Cases

- **Empty database**: Table shows `<Empty>` component; footer reads "全 0 件".
- **Single matching record**: Footer reads "全 1 件中 1–1 件を表示".
- **Very long name**: `管理者名` cell truncates with `text-ellipsis` at the
  column's max-width; full name is visible in `<TextWithTooltip>`.
- **Very long email**: Same truncation rule; full email shown in tooltip.
- **Network error on fetch**: `<DataStateBoundary>` renders an error state with
  a retry button; no raw error message is shown to the user.
- **Rapid filter changes**: No separate debounce for select filters — each select
  change fires immediately (single param change). The 300 ms debounce applies
  only to the free-text search input.
- **ブランド = 全ブランド**: Staff with `brand = null` (HQ-level accounts like
  本部管理者 / ブロック長) must display "全ブランド" in the ブランド column and
  are included in results for all `全ブランド` (unfiltered) queries.
- **Filter panel collapsed with active filters**: The `詳細フィルター ▾` toggle
  button displays an active-filter indicator (e.g., dot badge or count chip)
  when filters are set but the panel is collapsed, so the user knows filters are
  in effect.
- **Filter panel state across page refreshes**: The collapsed/expanded state of
  the panel is NOT persisted in the URL; it always opens collapsed on hard reload.
  Filter _values_ are persisted via nuqs.
- **`すべてクリア` with search active**: Clicking `すべてクリア` resets only the
  three filter selects (職位, ブランド, ステータス). The search input text is
  preserved; it is cleared only by the user emptying the input manually.
- **Position deleted from master after filter set**: If a position that was
  selected as a filter is subsequently removed from the職位マスター, the filter
  param remains in the URL but the API returns zero matches and shows the
  `<Empty>` state; no error is thrown.
- **Pagination boundary**: When exactly 50 records exist, "次へ" is disabled;
  "全 50 件中 1–50 件を表示".

---

## Requirements

### Functional Requirements

- **FR-001-A**: System MUST display a data table of staff accounts with columns
  `スタッフID`, `管理者名`, `メールアドレス`, `職位`, `ブランド`, `ステータス`,
  `最終ログイン`, and an inline actions column.
- **FR-001-B**: System MUST scope the visible rows based on the authenticated
  user's role: HQ sees all staff; Manager sees only staff whose Store belongs to
  the Manager's Branch (resolved via `manager.branch_id → Branch.stores[]`);
  Staff / Trainer / Observer are blocked (redirected to `/403`).
- **FR-001-C**: `ステータス` MUST render as a colour-coded `<Badge>`:
  `有効` → `variant="success"` (green); `無効` → `variant="secondary"` (muted).
- **FR-001-D**: System MUST support free-text search on `name_kanji`,
  `name_kana`, and `email` with a 300 ms client-side debounce.
- **FR-001-E**: System MUST support three filter `<Select>` controls — `職位`,
  `ブランド`, `ステータス` — rendered in a collapsible 詳細フィルター panel.
  The panel toggle MUST switch label between `詳細フィルター ▾` (collapsed) and
  `閉じる ▴` (expanded). A `すべてクリア` button MUST reset all three filters
  simultaneously without clearing the search input.
- **FR-001-E1**: `職位` filter MUST list all active positions from the 職位マスター
  via `GET /crm/staff/positions`, sorted by role hierarchy then by display order.
  Initial position set (11 items): 本部管理者, ブロック長, テリトリーマネージャー,
  店舗責任者, 正社員スタッフ, 契約社員スタッフ, アルバイト（スーパー）,
  アルバイト（一般）, 社員トレーナー, 社外トレーナー, 閲覧専任.
- **FR-001-E2**: `ブランド` filter MUST use a static list of five values:
  `JOYFIT`, `JOYFIT+`, `JOYFIT YOGA`, `JOYFIT24`, `FIT365`.
  The three JOYFIT sub-brands (`JOYFIT+`, `JOYFIT YOGA`, `JOYFIT24`) are
  store-level attributes; the API maps them to `brand=joyfit` plus a
  `sub_brand` filter on the store, returning staff whose affiliated store
  matches the selected sub-brand. `FIT365` maps directly to `brand=fit365`.
  Staff `brand` field itself remains `joyfit | fit365 | null`.
- **FR-001-E3**: `ステータス` filter MUST use a static list of two values:
  `有効` (`active`) and `無効` (`inactive`).
  API query param: `status=active|inactive`.
- **FR-001-F**: Filter and sort state MUST be persisted in URL search params via
  `nuqs` so browser back/forward and copy-paste of URLs preserve state.
- **FR-001-G**: System MUST support server-side sorting for `スタッフID`,
  `管理者名`, `職位`, `ステータス`, `最終ログイン` via `sort_by` + `sort_order`
  query params. When no `sort_by` param is present, the API MUST default to
  `sort_by=staff_id&sort_order=asc`.
- **FR-001-H**: List MUST paginate with a server-side page size of 50 records
  (Constitution Principle V); infinite-scroll or page-navigation component
  selected in plan.md.
- **FR-001-I**: The `…` row-actions dropdown MUST show exactly two items for HQ
  users (`編集`, `削除`) and one item for Manager users (`編集` only). No 無効化
  item is present. `削除` MUST be absent from the DOM for Manager users.
- **FR-001-L**: The delete `<AlertDialog>` MUST include an optional `削除理由`
  `<Textarea>`. The reason value MUST be sent as `{ reason?: string }` in the
  `DELETE /crm/staff/[id]` request body. On success, a `sonner` toast MUST
  display "スタッフを削除しました". On API failure, the optimistic row removal
  MUST be rolled back and an error toast MUST display
  "削除に失敗しました。再度お試しください。".
- **FR-001-M**: `スタッフを招待` MUST open a `<Dialog>` (not Sheet, not route).
  The dialog MUST contain: 招待時の職位 `<Select>` (default: 正社員スタッフ),
  招待時のブランド `<Select>` (default: 全ブランド), メールアドレス `<Textarea>`
  (required; newline-delimited for bulk), `+ リストに追加` button, 招待リスト
  staging area, and `招待メールを送信` button. `招待メールを送信` MUST be disabled
  when 招待リスト is empty and MUST call `POST /crm/staff/invitations` with
  `{ invitations: Array<{ email, position_id, brand }> }`. On success: dialog
  closes, toast "招待メールを送信しました". On failure: dialog stays open, error
  toast "送信に失敗しました。再度お試しください。".
- **FR-001-J**: The `スタッフを招待` button MUST be visible only to HQ users
  and MUST be absent from the DOM (not just hidden) for other roles.
- **FR-001-K**: `最終ログイン` MUST display as a human-readable local datetime
  string (`YYYY-MM-DD HH:mm`, JST) derived via `date-fns/format`.

### Key Entities

- **Staff** (スタッフ): Core account entity.

  | Field           | Type             | Notes                                                                                           |
  | --------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
  | `staff_id`      | `string`         | Display format `STF-###`                                                                        |
  | `name_kanji`    | `string`         | Full name in kanji                                                                              |
  | `name_kana`     | `string`         | Full name in kana (used in search)                                                              |
  | `email`         | `string`         | Login ID; unique                                                                                |
  | `role`          | `StaffRole`      | One of 6 fixed roles                                                                            |
  | `position_id`   | `string`         | FK → Position master                                                                            |
  | `position_name` | `string`         | Denormalised label for list view                                                                |
  | `brand`         | `Brand \| null`  | `joyfit` \| `fit365` \| `null` (全ブランド) — staff-level only; sub-brands are store attributes |
  | `status`        | `StaffStatus`    | `active` \| `inactive`                                                                          |
  | `last_login_at` | `string \| null` | ISO 8601 datetime                                                                               |
  | `branch_id`     | `string \| null` | FK → Branch (Manager-role staff: scope anchor; Staff-role: via store's branch)                  |
  | `store_id`      | `string \| null` | Pattern A affiliation — Store within Branch                                                     |
  | `fc_company_id` | `string \| null` | Pattern B affiliation                                                                           |

- **Branch** (ブランチ): Organisational unit above Store. One Branch contains one or more Stores.

  | Field       | Type       | Notes                               |
  | ----------- | ---------- | ----------------------------------- |
  | `branch_id` | `string`   | Unique identifier                   |
  | `name`      | `string`   | Display name                        |
  | `store_ids` | `string[]` | All stores belonging to this branch |

- **StaffRole** (enum, 6 values fixed): `system` \| `headquarter` \| `manager` \| `staff` \| `trainer` \| `observer`
- **Position** (職位マスター): `{ id, name, role, permission_flags }` — HQ-managed; not editable from this screen.
- **Store** (店舗 / chi nhánh): Belongs to exactly one Branch. `{ id, name, branch_id }`.

---

## Design Specification

### Layout & Page Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│ AppHeader (breadcrumb: システム設定 > スタッフ・権限管理)             │
├──────────────────────────────────────────────────────────────────────┤
│ Page Title Row                                                        │
│  [スタッフ管理]  [8件]                    [✉ スタッフを招待] (HQ only) │
├──────────────────────────────────────────────────────────────────────┤
│ Filter Bar Row 1 — always visible                                     │
│  [🔍 名前・メールアドレスで検索...  ]      [≡ 詳細フィルター ▾]      │
│                                                                       │
│ Filter Bar Row 2 — visible only when panel is expanded               │
│  [全職位 ▾]  [全ブランド ▾]  [全ステータス ▾]      [すべてクリア]    │
├──────────────────────────────────────────────────────────────────────┤
│ DataTable                                                             │
│  スタッフID ↑↓ │ 管理者名 ↑↓ │ メールアドレス │ 職位 ↑↓ │ ブランド  │
│               │            │               │          │           │
│  STF-001      │ 田中 太郎   │ tanaka@...    │ 本部管理者│ 全ブランド│
│  …            │ …           │ …             │ …        │ …         │
├──────────────────────────────────────────────────────────────────────┤
│ Table Footer: 全 8 件中 1–8 件を表示   ‹ 前へ  次へ ›               │
└──────────────────────────────────────────────────────────────────────┘
```

**Route**: `src/app/(private)/settings/staff/page.tsx`
_(Full-width DataTable columns continued: ステータス badge │ 最終ログイン ↑↓ │ … actions)_

### Column Specification

| #   | Column Key      | Header Label   | Sortable | Width Hint         | Notes                                  |
| --- | --------------- | -------------- | -------- | ------------------ | -------------------------------------- |
| 1   | `staff_id`      | スタッフID     | ✅       | 96 px fixed        | `STF-###` monospace                    |
| 2   | `name_kanji`    | 管理者名       | ✅       | flex-1, min 160 px | `<TextWithTooltip>` on overflow        |
| 3   | `email`         | メールアドレス | ❌       | flex-2, min 200 px | `<TextWithTooltip>` on overflow        |
| 4   | `position_name` | 職位           | ✅       | 160 px             | Plain text                             |
| 5   | `brand`         | ブランド       | ❌       | 120 px             | "全ブランド" when `null`               |
| 6   | `status`        | ステータス     | ✅       | 88 px              | `<Badge variant>`                      |
| 7   | `last_login_at` | 最終ログイン   | ✅       | 148 px             | `YYYY-MM-DD HH:mm` via `date-fns`      |
| 8   | `_actions`      | —              | ❌       | 40 px fixed        | `<DropdownMenu>` with `MoreHorizontal` |

### Badge Variants

| `status` value | Badge variant            | Display text |
| -------------- | ------------------------ | ------------ |
| `active`       | `success` (green)        | 有効         |
| `inactive`     | `secondary` (muted grey) | 無効         |

### Filter Bar Specification

#### Toggle Button

| State               | Label            | Icon              | Position                |
| ------------------- | ---------------- | ----------------- | ----------------------- |
| Collapsed (default) | `詳細フィルター` | `ChevronDown` (▾) | top-right of filter bar |
| Expanded            | `閉じる`         | `ChevronUp` (▴)   | top-right of filter bar |

Active-filter indicator: when the panel is collapsed **and** at least one filter
has a non-default value, render a small count badge (e.g., `●` or `2`) beside the
`詳細フィルター` label so the user knows filters are silently active.

#### Filter Row Controls (expanded panel, Row 2)

Controls are left-aligned, separated by `gap-2`. The `すべてクリア` link is
right-aligned (same row, `ml-auto`).

| Control    | Component                  | Default Label  | API param     | Options                                            |
| ---------- | -------------------------- | -------------- | ------------- | -------------------------------------------------- |
| 職位       | `<Select>`                 | `全職位`       | `position_id` | _(see table below)_                                |
| ブランド   | `<Select>`                 | `全ブランド`   | `brand`       | _(see table below)_                                |
| ステータス | `<Select>`                 | `全ステータス` | `status`      | _(see table below)_                                |
| —          | `<Button variant="ghost">` | `すべてクリア` | —             | Clears 職位 + ブランド + ステータス simultaneously |

#### 職位 Filter — Option List

Sourced from `GET /crm/staff/positions` at panel-expand time (lazy fetch,
cached for session). Static fallback for mock environment:

| Display label          | `position_id` value     |
| ---------------------- | ----------------------- |
| _(全職位 — no filter)_ | `""` / omit param       |
| 本部管理者             | `pos-hq-admin`          |
| ブロック長             | `pos-block-manager`     |
| テリトリーマネージャー | `pos-territory-manager` |
| 店舗責任者             | `pos-store-manager`     |
| 正社員スタッフ         | `pos-staff-fulltime`    |
| 契約社員スタッフ       | `pos-staff-contract`    |
| アルバイト（スーパー） | `pos-part-super`        |
| アルバイト（一般）     | `pos-part-general`      |
| 社員トレーナー         | `pos-trainer-employee`  |
| 社外トレーナー         | `pos-trainer-external`  |
| 閲覧専任               | `pos-observer`          |

#### ブランド Filter — Option List (static)

Staff `brand` is always `joyfit | fit365 | null`. Sub-brands are resolved by
the API via the staff's affiliated Store's `sub_brand` field.

| Display label              | Client sends                         | Server resolves to                                |
| -------------------------- | ------------------------------------ | ------------------------------------------------- |
| _(全ブランド — no filter)_ | omit param                           | all records                                       |
| JOYFIT                     | `brand=joyfit`                       | staff with `brand=joyfit` AND no sub_brand filter |
| JOYFIT+                    | `brand=joyfit&sub_brand=joyfit_plus` | staff whose store has `sub_brand=joyfit_plus`     |
| JOYFIT YOGA                | `brand=joyfit&sub_brand=joyfit_yoga` | staff whose store has `sub_brand=joyfit_yoga`     |
| JOYFIT24                   | `brand=joyfit&sub_brand=joyfit24`    | staff whose store has `sub_brand=joyfit24`        |
| FIT365                     | `brand=fit365`                       | staff with `brand=fit365`                         |

#### ステータス Filter — Option List (static)

| Display label                | `status` API value |
| ---------------------------- | ------------------ |
| _(全ステータス — no filter)_ | `""` / omit param  |
| 有効                         | `active`           |
| 無効                         | `inactive`         |

#### nuqs URL Param Names

| Filter               | nuqs key      | Type                                                   |
| -------------------- | ------------- | ------------------------------------------------------ |
| Search input         | `q`           | `string`                                               |
| 職位                 | `position_id` | `string`                                               |
| ブランド (top-level) | `brand`       | `'joyfit' \| 'fit365'`                                 |
| ブランド (sub-brand) | `sub_brand`   | `'joyfit_plus' \| 'joyfit_yoga' \| 'joyfit24' \| null` |
| ステータス           | `status`      | `string`                                               |
| Sort column          | `sort_by`     | `string`                                               |
| Sort direction       | `sort_order`  | `'asc' \| 'desc'`                                      |
| Page                 | `page`        | `number`                                               |

### Row Actions Menu (DropdownMenu)

**HQ role:**

```
─────────────────
 ✏  編集          → navigate `/settings/staff/[id]`
─────────────────
 🗑  削除          → AlertDialog (see below)   (destructive, red text)
─────────────────
```

**Manager role:**

```
─────────────────
 ✏  編集          → navigate `/settings/staff/[id]`
─────────────────
```

### Delete Confirmation Dialog (`<AlertDialog>`)

```
┌─────────────────────────────────────────┐
│  スタッフを削除しますか？                 │
│                                          │
│  このスタッフアカウントを削除すると、     │
│  ログインできなくなります。               │
│  この操作は取り消せません。               │
│                                          │
│  削除理由                                │
│  ┌────────────────────────────────────┐  │
│  │ 削除理由を入力してください（任意）   │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│          [キャンセル]  [削除する 🔴]      │
└─────────────────────────────────────────┘
```

| Element        | Detail                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Title          | "スタッフを削除しますか？"                                                                        |
| Body           | "このスタッフアカウントを削除すると、ログインできなくなります。この操作は取り消せません。"        |
| 削除理由 field | `<Textarea>` — optional, placeholder "削除理由を入力してください（任意）"                         |
| キャンセル     | `<Button variant="outline">` — closes dialog, no API call                                         |
| 削除する       | `<Button variant="destructive">` — red; calls `DELETE /crm/staff/[id]` with `{ reason?: string }` |
| On success     | Row removed (optimistic); `sonner` toast: "スタッフを削除しました"                                |
| On error       | Row restored (rollback); `sonner` error toast: "削除に失敗しました。再度お試しください。"         |

### Invite Staff Dialog (`<Dialog>`)

```
┌─────────────────────────────────────────────┐
│  スタッフを招待                          [✕] │
│  招待メールを送信します。受信者がメール内の  │
│  リンクからアカウントを作成します。          │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  招待時の職位      │  招待時のブランド │   │
│  │  [正社員スタッフ ▾]│  [全ブランド ▾]  │   │
│  │                                      │   │
│  │  メールアドレス  *                    │   │
│  │  ┌────────────────────────────────┐  │   │
│  │  │ example@joyfit.co.jp           │  │   │
│  │  │ 複数人を招待する場合は改行で…   │  │   │
│  │  └────────────────────────────────┘  │   │
│  │              [+ リストに追加]         │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  招待リスト                                  │
│  ┌──────────────────────────────────────┐   │
│  │  (empty state icon)                  │   │
│  │  メールアドレスを入力して             │   │
│  │  「リストに追加」を押してください     │   │
│  └──────────────────────────────────────┘   │
│                                              │
│         [キャンセル]  [✈ 招待メールを送信]   │
└─────────────────────────────────────────────┘
```

| Element            | Detail                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Dialog title       | "スタッフを招待"                                                                                      |
| Description        | "招待メールを送信します。受信者がメール内のリンクからアカウントを作成します。"                        |
| 招待時の職位       | `<Select>` — default `正社員スタッフ`; options from 職位マスター (same source as filter)              |
| 招待時のブランド   | `<Select>` — default `全ブランド`; static 5-option list (same as filter)                              |
| メールアドレス     | `<Textarea>` — required; placeholder two-line; newline-delimited for bulk entry                       |
| `+ リストに追加`   | Parses textarea → appends rows to 招待リスト; clears textarea; disabled when textarea empty           |
| 招待リスト         | Shows added `{ email, 職位, ブランド }` rows; empty state when no entries                             |
| `招待メールを送信` | Disabled when 招待リスト empty; calls `POST /crm/staff/invitations`                                   |
| キャンセル         | Closes dialog; discards pending list without API call                                                 |
| On success         | Dialog closes; `sonner` toast: "招待メールを送信しました"                                             |
| On error           | Dialog stays open; inputs preserved; `sonner` error toast: "送信に失敗しました。再度お試しください。" |
| API payload        | `{ invitations: Array<{ email: string, position_id: string, brand: string \| null }> }`               |

### Empty State

Use `<Empty>` from `src/components/ui/empty.tsx`:

- Icon: `Users` (lucide)
- Title: "スタッフが見つかりません"
- Description: "条件を変えて再度お試しください" (when filters active) /
  "スタッフを招待してください" (when no staff exist at all, HQ only)

### Breadcrumb

```
システム設定 > スタッフ・権限管理
```

Maps to `BreadcrumbNav` items:

```ts
[{ url: '/settings', label: 'システム設定' }, { label: 'スタッフ・権限管理' }];
```

**App Router path**: `src/app/(private)/settings/staff/page.tsx`
A `/settings` layout (`src/app/(private)/settings/layout.tsx`) must exist or be created as part of this feature.

---

## Success Criteria

### Measurable Outcomes

- **SC-001 (Constitution V — LCP)**: The staff list page achieves LCP ≤ 2.5 s on
  a production build with simulated 4G / mid-tier device.
- **SC-002 (Constitution V — CLS)**: CLS ≤ 0.1 during initial render and while
  paginating (no layout shift from badge / tooltip rendering).
- **SC-003 (Constitution V — INP)**: Search debounce + table re-render completes
  within 200 ms of the debounce firing for ≤ 50 rows.
- **SC-004 (Constitution V — Bundle)**: Route chunk (gzip) for `/staff` ≤ 250 kB.
- **SC-005 (Constitution IV — Contract tests)**: `GET /crm/staff` contract test
  covers happy-path (200 + schema valid), zero-results (200 empty page), and
  validation-error (400) scenarios before the PR is merged.
- **SC-006 (Constitution II — Accessibility)**: All interactive elements
  (`<DataTableColumnHeader>`, sort buttons, filter selects, row-action dropdowns)
  pass WCAG 2.1 AA colour-contrast and are fully keyboard-navigable.
- **SC-007**: HQ users can locate any staff record by partial name/email in
  ≤ 3 keystrokes + debounce with a dataset of 500 records.
- **SC-008**: Filter + sort state survives browser back/forward navigation
  (URL param persistence via `nuqs`).

---

## Constitution Check

| Principle                                 | Status  | Notes                                                                                                                                                                                                                                                                      |
| ----------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Strict Type Safety**                 | ✅ Pass | Zod schema `StaffListItemSchema` in `src/app/api/_schemas/staff.schema.ts`; generated types from `types.gen.ts` used in column defs; `any` banned.                                                                                                                         |
| **II. Component Purity & UI Consistency** | ✅ Pass | All UI via `<DataTable>`, `<Badge>`, `<Select>`, `<DropdownMenu>`, `<TextWithTooltip>`, `<Button variant="ghost">` from `src/components/`. Filter panel uses shadcn `<Select>` for all three controls (no custom dropdown). No inline styles. WCAG 2.1 AA badges required. |
| **III. Server-State via React Query**     | ✅ Pass | List data via `getStaffInfiniteOptions` (generated); positions filter list via `getStaffPositionsOptions` (generated, lazy); status toggle via `useMutation`; URL state via `nuqs`. No raw `fetch`.                                                                        |
| **IV. Schema-Contract Testing**           | ✅ Pass | `GET /crm/staff` contract test required pre-merge (SC-005).                                                                                                                                                                                                                |
| **V. Performance Budget**                 | ✅ Pass | Page size ≤ 50 (FR-001-H); `useInfiniteQuery`; RSC default; no bare `<img>`; SC-001–SC-004 gates.                                                                                                                                                                          |

---

## Assumptions

- Authentication and session management are handled by the existing middleware in
  `src/middleware.ts`; role information is available in the session JWT.
- A `GET /crm/staff` API endpoint does not yet exist; it will be created following
  the same pattern as `GET /crm/members` (`src/app/api/crm/members/route.ts`).
- A `GET /crm/staff/positions` endpoint will be created to serve the 職位 filter
  dropdown; it returns `{ id: string, name: string }[]` ordered by role hierarchy.
- The `StaffRole` and `StaffStatus` enums will be added to
  `src/types/global.enum.ts` following existing `MemberStatus` / `Brand` patterns.
- The `Brand` enum remains `joyfit | fit365` (two values). Sub-brands
  (`joyfit_plus`, `joyfit_yoga`, `joyfit24`) are a `sub_brand` field on the
  Store entity, not on Staff. No `Brand` enum extension is needed.
- `brand = null` (全ブランド) is a valid value for HQ-level roles; the column
  renders "全ブランド" as a plain string (no badge).
- The 職位 filter options are lazy-fetched only when the 詳細フィルター panel
  first expands. The ブランド and ステータス options are static (no API call).
- The `すべてクリア` button resets only the three filter selects (職位, ブランド,
  ステータス); the search input text is **not** affected.
- The collapsed/expanded state of the filter panel is ephemeral UI state managed
  via React state (not nuqs); it resets to collapsed on hard reload.
- Infinite-scroll vs. traditional pagination for the staff list is deferred to
  `plan.md`; the spec is written to accommodate either.
- The Y-01-01 user-creation form (FR-002) and account detail/edit view (FR-003)
  are **out of scope** for this spec; only the list view (FR-001) is specified here.
- `last_login_at` is nullable; display "—" when `null`.
- **Page route is `/settings/staff`** (`src/app/(private)/settings/staff/`). A
  `/settings` layout wrapper must be created if it does not yet exist.
- **Branch–Store hierarchy**: Each Staff record carries a `branch_id` (Manager-role
  staff) or a `store_id` whose parent Store carries a `branch_id` (Staff-role).
  The `GET /crm/staff` handler resolves the Manager's Branch → all child Store IDs
  and applies them as an `IN` filter on `store_id`. This join is performed
  server-side; the client sends no explicit scope param.

---

## Open Questions

> **Instructions for reviewers**: Each question below blocks a specific implementation decision.
> Please record your answer in the `Answer` cell and change `Status` to `✅ Resolved`.
> Do not begin implementation of the affected area until its questions are resolved.

---

### Q-01 — Page Route: `/staff` vs `/settings/staff`

|              |                                                                                                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**   | ✅ Resolved                                                                                                                                                                                          |
| **Affects**  | FR-001-A, Breadcrumb, nuqs param namespace, Next.js App Router file layout                                                                                                                           |
| **Question** | Where should the staff list live in the URL hierarchy?                                                                                                                                               |
| **Answer**   | **B — `/settings/staff`**. Architecturally correct for a Y-category system-settings feature. App Router path: `src/app/(private)/settings/staff/page.tsx`. A `/settings` layout wrapper is required. |

---

### Q-02 — 職位 Filter: Single-select or Multi-select?

|                    |                                                                                                                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**         | ⏳ Needs answer                                                                                                                                                                                                                        |
| **Affects**        | FR-001-E1, US3 scenario 3, nuqs param type for `position_id`, API query schema                                                                                                                                                         |
| **Question**       | The screenshot shows a single-select `<Select>` for 職位. Should it support selecting **one** position at a time, or **multiple** positions simultaneously (e.g., "show both 店舗責任者 and 正社員スタッフ")?                          |
| **Why it matters** | Multi-select requires a `<Combobox>` with checkboxes (different component), a `position_id[]` array param in nuqs, and an `IN (…)` query on the API. Single-select uses a plain `<Select>` and a scalar param — significantly simpler. |
| **Options**        | **(A)** Single-select (current spec assumption). **(B)** Multi-select with checkboxes.                                                                                                                                                 |
| **Answer**         | _(owner to fill)_                                                                                                                                                                                                                      |

---

### Q-03 — ブランド Column: Show all 5 brands or only JOYFIT / FIT365?

|              |                                                                                                                                                                                                                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| **Status**   | ✅ Resolved                                                                                                                                                                                                                                                                                           |
| **Affects**  | Key Entities — `brand` field type, FR-001-E2, `Brand` enum, `brand` column renderer                                                                                                                                                                                                                   |
| **Question** | Do staff rows carry all 5 brand values or only `joyfit                                                                                                                                                                                                                                                | fit365 | null`? |
| **Answer**   | **B** — Staff `brand` is always `joyfit \| fit365 \| null`. Sub-brands (`JOYFIT+`, `JOYFIT YOGA`, `JOYFIT24`) are store-level attributes. The ブランド filter sends `brand + sub_brand` params; the server resolves the sub-brand via the staff's affiliated Store. `Brand` enum stays as two values. |

---

### Q-04 — 職位 Filter: Should the list be scoped by the viewer's role?

|                    |                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**         | ⏳ Needs answer                                                                                                                                                                                                           |
| **Affects**        | FR-001-E1, `GET /crm/staff/positions` API design, Manager UX                                                                                                                                                              |
| **Question**       | When a **Manager** opens the 職位 filter, should they see all 11 positions (including 本部管理者, ブロック長, etc. which they cannot manage), or only the positions within their own scope (i.e., Staff-level positions)? |
| **Why it matters** | Showing unreachable positions wastes UX space and may cause confusion. Scoping the list requires the API to accept a `caller_role` param or use the session to filter; adds complexity.                                   |
| **Options**        | **(A)** Show all 11 positions to all users (simple; Manager may see options that return 0 results). **(B)** `GET /crm/staff/positions` returns only positions the caller can manage (role-scoped).                        |
| **Answer**         | _(owner to fill)_                                                                                                                                                                                                         |

---

### Q-05 — Active-filter Indicator: Count badge or dot?

|                    |                                                                                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**         | ⏳ Needs answer                                                                                                                                                                                                                                                                   |
| **Affects**        | Filter bar UI (collapsed state), Design Specification — Toggle Button                                                                                                                                                                                                             |
| **Question**       | When the filter panel is collapsed with active filters, the spec says "render a small count badge (e.g., `●` or `2`)". Which style should be used: **(A)** a numeric count of active filters (e.g., `2` in a filled circle), or **(B)** a simple dot/pill with no number?         |
| **Why it matters** | A numeric count requires tracking how many non-default filters are active; a dot only requires knowing if any filter is active. Both are trivial to implement but the visual language should be consistent with other filter indicators already in the members list (`/members`). |
| **Options**        | **(A)** Numeric count badge. **(B)** Dot indicator (no number). **(C)** Match whatever is used on `/members` filters.                                                                                                                                                             |
| **Answer**         | _(owner to fill)_                                                                                                                                                                                                                                                                 |

---

### Q-06 — 削除 (Delete): Hard delete or soft delete? Recovery path?

|             |                                                                                                                                                                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**  | ✅ Resolved                                                                                                                                                                                                                                                                                                                     |
| **Affects** | US5, FR-001-I, FR-001-L, `DELETE /crm/staff/[id]` API contract                                                                                                                                                                                                                                                                  |
| **Answer**  | **Irreversible delete with reason capture.** The `<AlertDialog>` copy explicitly states "この操作は取り消せません。" An optional 削除理由 textarea is included. On confirm: `DELETE /crm/staff/[id]` with `{ reason?: string }`; row is removed with optimistic UI; success toast fires. No restore flow exists on this screen. |

---

### Q-07 — 無効化 Confirmation Dialog: Required or immediate?

|            |                                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Status** | ✅ Resolved — Superseded                                                                                                            |
| **Answer** | **No 無効化 action exists on the staff list.** The `…` menu contains only `編集` and `削除`. This question is no longer applicable. |

---

### Q-08 — Default Sort Order on Initial Load

|             |                                                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**  | ✅ Resolved                                                                                                                                                                                                                        |
| **Affects** | US4, FR-001-G, API `sort_by` default, mock data seed order                                                                                                                                                                         |
| **Answer**  | **A — `sort_by=staff_id&sort_order=asc`**. Matches the screenshot order (STF-001 → STF-008). API defaults to this when no `sort_by` param is present. `スタッフID` column header shows active ascending indicator on initial load. |

---

### Q-09 — Manager Scope: How is 管轄 determined?

|              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**   | ✅ Resolved                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Affects**  | US1 scenario 4, FR-001-B, API authorisation logic, Key Entities                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Question** | How is the list of a Manager's 管轄 stores determined at query time?                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Answer**   | **Branch-scoped hierarchy**: Each staff member belongs to exactly one **Branch** (`branch_id`). A Branch contains one or more Stores. Manager-role staff manage at Branch level — their `branch_id` is the scope anchor. Staff-role staff are affiliated with a single Store whose parent Store carries a `branch_id`. The `GET /crm/staff` handler resolves `manager.branch_id → Branch.store_ids[]` server-side and applies an `IN` filter on `store_id`. No explicit scope param is sent from the client. |

---

### Q-10 — `スタッフを招待` UX: Sheet or full-page route?

|             |                                                                                                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**  | ✅ Resolved                                                                                                                                                                                                                                                                        |
| **Affects** | US6, FR-001-M, Y-01-01 form placement                                                                                                                                                                                                                                              |
| **Answer**  | **`<Dialog>` modal** (neither Sheet nor full-page route). The dialog implements a two-step invitation flow: enter emails + select 職位/ブランド → add to 招待リスト → send. Bulk invitation is supported via newline-delimited email textarea. API: `POST /crm/staff/invitations`. |

---

## Related Features

| Feature ID    | Feature            | Relationship                                                                   |
| ------------- | ------------------ | ------------------------------------------------------------------------------ |
| Y-01-01       | ユーザー作成       | Triggered by `スタッフを招待` button (US6); out of scope here                  |
| Y-01 (FR-003) | スタッフ詳細・編集 | Target of `詳細・編集` row action (US5); out of scope here                     |
| Y-01 (FR-006) | 職位マスター管理   | Provides `position_name` displayed in the table; read-only from this screen    |
| Y-02          | 店舗管理           | Provides `所属店舗` filter options via `GET /crm/stores`                       |
| Y-03          | FC企業管理         | FC-affiliated staff appear in list; FC company name shown as store affiliation |
