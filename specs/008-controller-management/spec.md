# Feature Specification: E-02 Contact-Control Device (接点制御装置) Management

**Feature Branch**: `008-controller-management`  
**Created**: 2026-06-26  
**Status**: Clarified  
**PO Spec**: `E-02` — 店舗機器管理 (Store Equipment Management)  
**Source**: `.cache/fitness-crm-ui/src/pages/equipment-list.tsx` (controllers tab), `.cache/fitness-crm-ui/src/components/controller-list-panel.tsx`, `.cache/fitness-crm-ui/src/pages/controller-form.tsx`, `.cache/fitness-crm-ui/src/pages/controller-detail.tsx` + `.cache/fitness-crm-ui/public/requirements/E-02.md`  
**Input**: User description: "Create spec for screen E-02 店舗機器管理 — Phase 1 scope: FR-007 (Contact-Control Device management). The controller tab becomes its own route (not nested inside the equipment screen). History is seed-only (no create/update/delete of history)."

---

## Clarifications

### Session 2026-06-26

- Q: Should the view-only tier (Observer) be allowed to open the controller list/detail? → A: **Yes** — Observer may **view** the list and detail; configuration actions (register/edit/delete/status-change) remain denied.
- Q: Which fields must be submit-blocking on the controller form? → A: **Enforce all visually-required fields** — 装置名, 店舗コード, 設置場所, IPアドレス, 制御ポート数, ポート番号, 状態. (ファームウェアバージョン is optional.) ポート番号 is confirmed as an official, required Phase 1 field.
- Q: Given history is seed-only, what does the status-change dialog's "変更を保存" persist? → A: **Update the controller's current 状態 only** — do **not** write a history entry. The ステータス変更 dialog remains in Phase 1.

---

## Scope

### In Scope (Phase 1) — FR-007 only

| ID         | Requirement                                | Screen Coverage                                                                                       |
| ---------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **FR-007** | Contact-control device settings management | Controller **list** (own route), controller **form** (create/edit), controller **detail** (read-only) |

FR-007 §処理内容 decomposed into the prototype screens:

| FR-007 sub-capability                                                                              | Screen / Component                                         |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Register / edit device settings (装置名・店舗コード・設置場所・IPアドレス・FW・制御ポート数・状態) | `controller-form` (create / edit)                          |
| Device list display + search                                                                       | `controller-list` (own route; was `ControllerListPanel`)   |
| Reference the devices connected to a controller                                                    | `controller-detail` → 紐付き機器一覧 tab                   |
| Deletion blocked when connected devices exist (異常系)                                             | `controller-detail` → delete button disabled + AlertDialog |

### Routing decision (per user direction)

- In the prototype, the contact-control device list is rendered as the second tab (`接点制御装置一覧`) **inside** the `equipment-list` screen (`Tabs` in `equipment-list.tsx`).
- **Phase 1 decision**: the contact-control device list is given **its own dedicated route** (a standalone controller list screen) rather than being nested as a tab within the connected-equipment screen. The connected-equipment list (FR-001/FR-002) remains a separate screen, out of this spec's scope.
- All controller-related navigation (`controller-form`, `controller-detail`, back links) targets the dedicated controller list route. The prototype's `navigate("equipment-list", "controllers")` back-target is reinterpreted as "return to the controller list route".

### Out of Scope for Phase 1

| ID / Feature                                    | Reason                                                                                                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001 / FR-002                                 | Connected-equipment list & search — separate screen, not a contact-control device                                                                   |
| FR-003 / FR-005                                 | Connected-equipment create/edit — covered by `007-equipment-form`                                                                                   |
| FR-004 / FR-006                                 | Connected-equipment detail / delete — covered by `006-equipment-detail`                                                                             |
| FR-008 / FR-009                                 | Usage-control rule & authentication method — connected-equipment concerns, covered by `007-equipment-form`                                          |
| FR-010                                          | Bulk status update — defined for **connected equipment** only; explicitly NOT applied to contact-control devices (E-02 §要件の設計判断, 2026-04-22) |
| FR-011                                          | Equipment ledger CSV export                                                                                                                         |
| FR-012 / FR-013                                 | Status-change history record & usage-log reference (Could-tier)                                                                                     |
| Change-history write operations                 | The 変更履歴 tab is **seed/display-only** in Phase 1; creating, updating, or deleting history entries is out of scope (per user direction)          |
| Real-time device health monitoring              | E-02 §制限事項 — health monitoring is the contact-control device's own function; CRM only shows manually-updated status                             |
| Member authentication / start-up signal runtime | E-02 §制限事項 — judgment execution and signal sending are system-side, not configured on these screens                                             |

**Phase markers in code**: The four source files contain no explicit Phase 2 / future-scope placeholders, no disabled-for-future controls (the only disabled control is the read-only auto-numbered ID field and the delete button gated by connected-device existence), and no commented-out features. `HAS_CONNECTED_DEVICES` is a mock flag standing in for an API value.

---

## Feature Overview

| Item              | Detail                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Screen group name | 接点制御装置管理 (Contact-Control Device Management)                                                                                                         |
| Screens / slugs   | `controller-list` (list, own route) · `controller-form` (create/edit) · `controller-detail` (detail, read-only)                                              |
| Brands            | JOYFIT / FIT365 (common) — E-02 §ブランド適応範囲                                                                                                            |
| Purpose           | Staff and HQ users register, view, search, edit, and delete the contact-control units installed at a store, and inspect which devices are wired to each unit |
| Business role     | The contact-control device is the core unit that receives member authentication results and judges device start-up (E-02 §機能の定義 — 接点制御装置)         |

**Source**: E-02 §概要 / §機能の定義 / FR-007; basic-flow steps ① (physical install) and ② (FR-007 setting registration).

---

## Actors & Access Control

**Source**: E-02 §権限マトリクス (接点制御装置設定 column) + role-gated controls in the prototype.

| Role            | View list / detail | Register / Edit / Delete (接点制御装置設定) | Data Scope          |
| --------------- | ------------------ | ------------------------------------------- | ------------------- |
| **System**      | ○                  | ○                                           | All stores          |
| **Headquarter** | ○                  | ○                                           | All stores          |
| **Manager**     | ○ (jurisdiction)   | ○ (jurisdiction stores)                     | Jurisdiction stores |
| **Staff**       | ○ (own store)      | ○ (own store)                               | Own store           |
| **Observer**    | ○ (view only)      | ×                                           | Own store (view)    |
| **Trainer**     | ×                  | ×                                           | No access           |

- The prototype role-gates the create entry point, the 編集 button, and the 削除 button to `["Headquarter", "System", "Manager", "Staff"]` via `RoleGatedMenuItem` / `RoleGatedButton`. Observer/Trainer are denied these configuration actions.
- **View access (resolved Q1)**: Observer **may view** the controller list and detail (read-only), mirroring their general read tier; configuration actions remain denied. Trainer has no access. The view column above reflects this resolution.

---

## Component Hierarchy & Layout

### Screen A — Controller List (`controller-list`, own route)

**Source**: `controller-list-panel.tsx` (panel body) + `equipment-list.tsx` (page header, count badge, create entry point).

```
ControllerList (own route)
├── SharedSidebar
└── SidebarInset (flex col, max-h-svh, overflow hidden)
    ├── SharedHeader
    ├── PageHeader (outside)
    │   ├── title: 接点制御装置一覧   (count badge = CONTROLLER_DATA.length)
    │   └── actions
    │       └── 新規登録 → 接点制御装置を登録  (RoleGated: HQ/System/Manager/Staff) → navigate("controller-form")
    └── main (flex-1, overflow-y-auto, px-6 py-4)
        └── Card (controller table)
            ├── Toolbar
            │   ├── Search input  [placeholder: 装置名、IPアドレスで検索]
            │   └── 詳細フィルター toggle  (active-filter count badge)
            │       └── (expanded) ステータス Select [全ステータス/正常/異常/メンテナンス中/廃棄] + すべてクリア
            ├── Table (9 columns, sortable headers with tooltip)
            │   └── columns: 装置ID · 装置名 · 店舗コード · 設置場所 · IPアドレス · FW · 制御ポート数 · 紐付き機器数 · ステータス
            │       └── row click → navigate("controller-detail"); 異常 rows highlighted (left red bar)
            └── Pagination footer  ("{n}件中 1-{n}件を表示")
```

> In the prototype the create entry point lives in the `equipment-list` page header (a `新規登録` dropdown whose `接点制御装置を登録` item is `RoleGatedMenuItem` for `["Headquarter","System","Manager","Staff"]`). With the controller list as its own route, this entry point is surfaced as a dedicated 接点制御装置を登録 action on the controller list header (same role gate). The `CSV出力` button in the prototype's equipment header is **out of scope** (FR-011).

### Screen B — Controller Form (`controller-form`, create / edit)

**Source**: `controller-form.tsx`

```
ControllerForm (mode: create | edit)
├── SharedSidebar (currentPage="controller-form")
└── SidebarInset
    ├── SharedHeader
    ├── PageHeader (outside)
    │   ├── BackLink [店舗機器管理に戻る] → controller list route
    │   └── title: 接点制御装置 新規登録 (create) | 接点制御装置 編集 (edit)
    └── main → container (max-w-960px, centered, space-y-6)
        ├── Card: 基本情報 (3-col grid)
        │   ├── 接点制御装置ID         (Input, disabled)  → 「（自動採番）」(create) | "1" (edit)
        │   ├── 装置名 *               (Input)
        │   ├── 店舗コード *           (StoreCombobox, valueType="code")
        │   ├── 設置場所 *             (Input)
        │   ├── [Alert/Info] connection-info help note
        │   ├── IPアドレス *           (Input, pattern ^\d{1,3}(\.\d{1,3}){3}$) + helper text
        │   ├── ファームウェアバージョン (Input, no required mark) + helper text
        │   ├── 制御ポート数 *         (Input number, min 1 / max 64) + helper text
        │   └── ポート番号 *           (Input number, min 1 / max 65535) + helper text
        ├── Card: ステータス
        │   └── 状態 *                 (Select [正常/異常/メンテナンス中/廃棄]; edit default 正常)
        └── Footer actions (border-t)
            ├── キャンセル → controller list route
            └── 登録 (create) | 更新 (edit) → success toast → controller list route
```

- Content container max width: 960 px, centered. Minimum supported width: 768 px (project standard).
- Required fields use `RequiredMark`; `ファームウェアバージョン` uses neither mark (treated as optional in the prototype).

### Screen C — Controller Detail (`controller-detail`, read-only + actions)

**Source**: `controller-detail.tsx`

```
ControllerDetail (activeTab: basic | devices | history)
├── SharedSidebar (currentPage="controller-detail")
└── SidebarInset
    ├── SharedHeader
    ├── PageHeader (outside)
    │   ├── BackLink [店舗機器管理に戻る] → controller list route
    │   ├── title: 接点制御装置詳細   subtitle: "{store} — {ip}"   badge: status (正常)
    │   └── actions
    │       ├── 削除  (RoleGated HQ/Sys/Mgr/Staff; disabled when HAS_CONNECTED_DEVICES) → AlertDialog
    │       └── 編集  (RoleGated HQ/Sys/Mgr/Staff) → navigate("controller-form", "edit")
    ├── main → Tabs (line)
    │   ├── Tab 基本情報
    │   │   ├── Left 60%: 接点制御装置情報 card (read-only):
    │   │   │     接点制御装置ID · 装置名 · 店舗コード · 設置場所 · IPアドレス · FW · 制御ポート数 · ポート番号
    │   │   └── Right 40% (sticky):
    │   │         ├── StatusCard (icon Cpu, label=status, action: ステータス変更 → Dialog)
    │   │         ├── 紐付き機器サマリー card (紐付き機器数 / 正常 / 異常 + link 機器一覧を見る)
    │   │         └── その他情報 card (作成日時 / 更新日時)
    │   ├── Tab 紐付き機器一覧 (DevicesTab)
    │   │   └── Table: 機器ID · 機器名 · 接点番号 · ゲート種別 · ステータス  + summary footer (合計/正常/異常)
    │   └── Tab 変更履歴 (HistoryTab — seed/display-only)
    │       └── Table: 日時 · 操作者 · 種別 · ステータス変化 · メモ + summary footer (直近1年の対応 / 平均対応間隔)
    ├── Dialog: ステータス変更 (StatusChangeDialog)
    └── AlertDialog: 削除確認
```

---

## UI Element Traceability

### Screen A — Controller List

| Element                   | Behavior                                                                                    | Source Requirement                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Title + count badge       | "接点制御装置一覧" with total count of controllers                                          | FR-007 — 一覧表示                                                                        |
| Search input              | Free-text search; placeholder "装置名、IPアドレスで検索" (matches device name / IP address) | FR-007 — 検索機能                                                                        |
| 詳細フィルター toggle     | Expands the filter row; shows an active-filter count badge when filters differ from default | FR-007 — 検索機能                                                                        |
| ステータス filter         | Select: 全ステータス / 正常 / 異常 / メンテナンス中 / 廃棄                                  | FR-007 + E-02 §機器状態 (4 states)                                                       |
| すべてクリア              | Resets the status filter to 全ステータス                                                    | Standard UX                                                                              |
| Table column 装置ID       | Controller identifier (auto-assigned)                                                       | FR-007 — 装置ID（自動採番）                                                              |
| Table column 装置名       | Controller name                                                                             | FR-007 — 装置名                                                                          |
| Table column 店舗コード   | Store code the controller belongs to                                                        | FR-007 — 店舗コード                                                                      |
| Table column 設置場所     | Install location                                                                            | FR-007 — 設置場所                                                                        |
| Table column IPアドレス   | IP address                                                                                  | FR-007 — IPアドレス                                                                      |
| Table column FW           | Firmware version                                                                            | FR-007 — ファームウェアバージョン                                                        |
| Table column 制御ポート数 | Number of control ports                                                                     | FR-007 — 制御ポート数                                                                    |
| Table column 紐付き機器数 | Count of connected devices ("{n}台")                                                        | FR-007 — 装置に接続されている機器（参照用）                                              |
| Table column ステータス   | Status badge with colored dot (正常/異常/メンテナンス中/廃棄)                               | E-02 §機器状態                                                                           |
| Sortable headers          | Each header is a sort trigger with a tooltip ("クリックで昇順ソート")                       | E-02 §要件の設計判断 (list columns are a design decision; sorting is prototype-added UX) |
| Row click                 | Navigates to the controller detail screen                                                   | FR-004-analog — detail reference                                                         |
| 異常 row highlight        | Rows with status 異常 get a destructive-tinted background and left accent bar               | Prototype UX                                                                             |
| Pagination footer         | Shows "{n}件中 1-{n}件を表示" and a page button                                             | Standard list UX                                                                         |

> **Column-set note**: E-02 §要件の設計判断 explicitly records that FR-007 does **not** specify list display columns; the 9-column set is an approved design decision (controller-list-panel.tsx). It is reproduced here verbatim.

### Screen B — Controller Form

| Field Label              | Control          | Required mark | Default (create / edit)    | Source Requirement                                                               |
| ------------------------ | ---------------- | ------------- | -------------------------- | -------------------------------------------------------------------------------- |
| 接点制御装置ID           | Input (disabled) | —             | 「（自動採番）」 / "1"     | FR-007 — 装置ID（自動採番）                                                      |
| 装置名                   | Input            | ✅            | "" / メインコントローラー  | FR-007 — 装置名                                                                  |
| 店舗コード               | StoreCombobox    | ✅            | "" / YS-001                | FR-007 — 店舗コード                                                              |
| 設置場所                 | Input            | ✅            | "" / 受付室 機器ラック     | FR-007 — 設置場所                                                                |
| IPアドレス               | Input (pattern)  | ✅            | "" / 192.168.1.100         | FR-007 — IPアドレス (optionality not stated in FR-007)                           |
| ファームウェアバージョン | Input            | — (no mark)   | "" / v2.4.1                | FR-007 — ファームウェアバージョン                                                |
| 制御ポート数             | Input (number)   | ✅            | "" / 8 (min 1, max 64)     | FR-007 — 制御ポート数                                                            |
| ポート番号               | Input (number)   | ✅            | "" / 80 (min 1, max 65535) | Prototype field, confirmed required Phase 1 field (Q2); extends FR-007 item list |
| 状態                     | Select           | ✅            | (none) / 正常              | FR-007 — 状態; E-02 §機器状態 (4 states)                                         |

- An informational `Alert` is shown between fields: "接続情報は装置本体のラベルまたは管理画面（http://[IP] にブラウザでアクセス）で確認できます。不明な場合は本部または導入業者にお問い合わせください。" — guidance only, no behavior.
- Helper texts appear under IPアドレス ("ローカルIPアドレス形式（例: 192.168.1.100）"), FW ("vN.N.N 形式"), 制御ポート数 ("通常 4 / 8 / 16"), ポート番号 ("通常 80").
- **Validation (resolved Q2)**: although the prototype `ControllerForm` has no `validate()` routine (the 登録/更新 button always fires `toast.success(...)` and navigates), Phase 1 MUST enforce the full visually-required set as **submit-blocking**: 装置名, 店舗コード, 設置場所, IPアドレス, 制御ポート数, ポート番号, 状態. ファームウェアバージョン is optional. ポート番号 is confirmed an official, required Phase 1 field. IPアドレス must also match the local-IP pattern.

### Screen B — Footer Actions

| Element            | Behavior                                                                            | Source Requirement  |
| ------------------ | ----------------------------------------------------------------------------------- | ------------------- |
| キャンセル button  | Returns to the controller list route (no unsaved-changes guard in this prototype)   | Standard UX         |
| 登録 / 更新 button | `登録` (create) / `更新` (edit); shows success toast then returns to the list route | FR-007 — 登録・編集 |

- Success toast text: create → "接点制御装置を登録しました"; edit → "接点制御装置の変更を保存しました".
- Unlike the connected-equipment form (`007-equipment-form`), this controller form has **no unsaved-changes discard dialog** in the prototype.

### Screen C — Controller Detail: Header

| Element        | Behavior                                                                                                 | Source Requirement                               |
| -------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| BackLink       | "店舗機器管理に戻る" → controller list route                                                             | Navigation                                       |
| Title/subtitle | "接点制御装置詳細" + "{store} — {ip}" + status badge                                                     | FR-007 — 詳細参照                                |
| 編集 button    | RoleGated (HQ/Sys/Mgr/Staff); → controller form in edit mode                                             | FR-007 — 編集; E-02 §権限マトリクス              |
| 削除 button    | RoleGated (HQ/Sys/Mgr/Staff); **disabled while the controller has connected devices**; opens AlertDialog | FR-007 異常系 — 接続機器が存在する装置は削除不可 |

### Screen C — Tab 基本情報

| Field (read-only)        | Source Requirement                                     |
| ------------------------ | ------------------------------------------------------ |
| 接点制御装置ID           | FR-007 — 装置ID                                        |
| 装置名                   | FR-007 — 装置名                                        |
| 店舗コード               | FR-007 — 店舗コード                                    |
| 設置場所                 | FR-007 — 設置場所                                      |
| IPアドレス               | FR-007 — IPアドレス                                    |
| ファームウェアバージョン | FR-007 — FW                                            |
| 制御ポート数             | FR-007 — 制御ポート数                                  |
| ポート番号               | Prototype field, confirmed required Phase 1 field (Q2) |

- Right column: **StatusCard** (icon Cpu, status label, action button ステータス変更 → opens StatusChangeDialog), **紐付き機器サマリー** (紐付き機器数 + 正常/異常 counts + link "機器一覧を見る"), **その他情報** (作成日時 / 更新日時).
- "機器一覧を見る" links to the connected-equipment list (`equipment-list`), which is out of this spec's scope (cross-link only).

### Screen C — Tab 紐付き機器一覧 (DevicesTab)

| Element            | Behavior                                                                  | Source Requirement                            |
| ------------------ | ------------------------------------------------------------------------- | --------------------------------------------- | ------------ | ------------ |
| Table              | Columns: 機器ID · 機器名 · 接点番号 · ゲート種別 · ステータス (read-only) | FR-007 — 装置に接続されている機器の一覧を参照 |
| 異常 row highlight | Rows with status 異常 are highlighted                                     | Prototype UX                                  |
| Summary footer     | "合計: {n}台                                                              | 正常: {n}台                                   | 異常: {n}台" | Prototype UX |

> `ゲート種別` (入口扉 / 出口扉 / その他) is a display attribute present only in the prototype's connected-device sub-table; FR-007 does not define it. Reproduced as-is for the read-only reference list.

### Screen C — Tab 変更履歴 (HistoryTab — seed/display-only)

| Element        | Behavior                                                                           | Source Requirement                             |
| -------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------- |
| Table          | Columns: 日時 · 操作者 · 種別 · ステータス変化 · メモ (read-only, **seeded** data) | Prototype-added (relates to Could-tier FR-012) |
| 種別 values    | ステータス変更 / 故障報告 / 点検完了 (and 新規作成 for the genesis row)            | Prototype seed data                            |
| ステータス変化 | From-badge → To-badge (or single badge for genesis "新規作成")                     | Prototype display                              |
| Summary footer | "直近1年の対応: {n}回                                                              | 平均対応間隔: {n}日"                           | Prototype display |

- **Phase 1 history handling (per user direction)**: the 変更履歴 tab displays **seed data only**. Creating, updating, or deleting history records is **out of scope**. The history list is read-only.
- E-02 §プロタイプで追記した要件外の機能 notes the equipment-detail 変更履歴 tab as requirement-external (FR-012 specifies "記録・参照" only, not a standalone tab). The same caveat applies to this controller 変更履歴 tab; it is retained as seed/display-only by user direction.

### Screen C — StatusChangeDialog (ステータス変更)

| Element                  | Behavior                                                     | Source Requirement   |
| ------------------------ | ------------------------------------------------------------ | -------------------- |
| 対象装置情報 (read-only) | Shows 装置ID and 現在のステータス badge                      | Context display      |
| 変更種別 Select          | ステータス変更 / 故障報告 / 点検完了                         | Prototype            |
| 新しいステータス Select  | 正常 / 異常 / メンテナンス中 / 廃棄 (each with status badge) | E-02 §機器状態       |
| メモ Textarea            | Optional (`OptionalMark`)                                    | Prototype            |
| キャンセル / 変更を保存  | Cancel closes; 変更を保存 commits the status change          | FR-007 — 状態 update |

- **Persistence (resolved Q3)**: "変更を保存" updates **only the controller's current 状態**; it does **not** write a change-history entry (history stays seed/display-only). The 変更種別 and メモ inputs are captured at submit time but do not create a persisted history record in Phase 1. The ステータス変更 dialog remains in Phase 1 scope.

### Screen C — Delete AlertDialog

| Element        | Content                                          |
| -------------- | ------------------------------------------------ |
| Title          | 接点制御装置を削除しますか？                     |
| Description    | 「{ip}」を削除します。この操作は取り消せません。 |
| Cancel action  | キャンセル                                       |
| Confirm action | 削除する → returns to the controller list route  |

- The 削除 button is **disabled** while the controller has connected devices (`HAS_CONNECTED_DEVICES`), implementing FR-007 異常系 ("接続機器が存在する装置は削除不可"). The dialog is reachable only when no connected devices exist.

---

## Behavioral Logic

**Source**: `controller-form.tsx`, `controller-detail.tsx`, `controller-list-panel.tsx`.

1. **List filtering**: The list filters controllers by the status Select and a free-text search over device name / IP address. The active-filter count badge reflects non-default filters; すべてクリア resets the status filter.
2. **List → Detail navigation**: Clicking a controller row opens the detail screen. (The prototype navigates without passing an id; resolving the specific controller by id is Deferred to Plan.)
3. **Create vs Edit (form)**: The `mode` prop drives the page title (新規登録 / 編集), submit label (登録 / 更新), success-toast text, the read-only ID value (「（自動採番）」 vs the existing id), and edit-mode prefilled values.
4. **No client validation in prototype**: The form's submit handler unconditionally shows a success toast and navigates; there is no `validate()` call. Required marks are visual only. The enforced submit-blocking set is unresolved — see clarification.
5. **Edit launch**: From the detail header, 編集 opens the form in edit mode.
6. **Deletion guard**: 削除 is disabled whenever connected devices exist; otherwise it opens a confirmation dialog and, on confirm, returns to the list. (FR-007 異常系.)
7. **Status change**: The detail StatusChangeDialog captures 変更種別, 新しいステータス, and an optional メモ, then commits via 変更を保存 — scope of persistence pending clarification (history is seed-only).
8. **Connected-device reference**: The detail 紐付き機器一覧 tab lists the devices wired to the controller (read-only), and the 紐付き機器サマリー aggregates counts; "機器一覧を見る" cross-links to the connected-equipment list.
9. **Change history**: The 変更履歴 tab renders seeded records read-only (no write paths in Phase 1).

---

## UI States

**Prototype implementation note**: The four source files use local React state and mock/seed data. No server loading, fetch-error, or save-error states are implemented.

| State                       | Behavior in prototype                                                  | Expected (Deferred to Plan)                                  |
| --------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| **List — loaded**           | Renders `CONTROLLER_DATA`; status filter + search apply client-side    | Fetch controllers scoped to the user's stores                |
| **List — filtered empty**   | Not explicitly handled in `ControllerListPanel` (no empty-state block) | Show an empty/zero-result state (Plan)                       |
| **List — loading / error**  | Not represented                                                        | Loading skeleton + fetch-error feedback (Plan)               |
| **Form — create empty**     | All fields empty/default; ID shows 「（自動採番）」                    | Default create state                                         |
| **Form — edit prefilled**   | Fields populated from the controller record; 状態 default 正常         | Fetch controller by id, then render populated form           |
| **Form — validation error** | Not represented (no validate)                                          | Enforce the resolved required set (per clarification)        |
| **Form — submitting**       | Not represented                                                        | Disable submit / show progress while saving (Plan)           |
| **Form — save success**     | Success toast + navigate to list                                       | Same, after server confirmation                              |
| **Form — save error**       | Not represented                                                        | Error feedback + retain entered data (Plan)                  |
| **Detail — loaded**         | Renders mock controller; status badge 正常                             | Fetch controller + connected devices + history by id         |
| **Detail — delete blocked** | 削除 disabled when `HAS_CONNECTED_DEVICES` is true                     | Same, driven by API connected-device count                   |
| **History — seed only**     | Renders seeded history rows read-only                                  | Display seeded/read-only history (no write paths in Phase 1) |

---

## User Scenarios & Testing

### User Story 1 — Register a New Contact-Control Device (Priority: P1)

**As** a Staff or Headquarter user,  
**I need** to register a newly installed contact-control unit with its basic settings (name, store, location, IP, firmware, control ports, status),  
**So that** the unit is tracked in the store and connected devices can later be wired to it.

**Why this priority**: FR-007 registration is the prerequisite for connecting any device and for all downstream usage-control behavior (basic-flow step ②).

**Independent Test**: Open the controller form in create mode, fill the settings, submit, and confirm the success toast and return to the controller list.

**Acceptance Scenarios**:

1. **Given** the form opens in create mode, **When** it renders, **Then** the title shows 接点制御装置 新規登録, the submit button reads 登録, and 接点制御装置ID shows 「（自動採番）」 (read-only).
2. **Given** the form, **When** the user enters 装置名 / 店舗コード / 設置場所 / IPアドレス / 制御ポート数 / ポート番号 / 状態, **Then** the values are accepted (店舗コード via the store combobox; IP follows the local-IP format hint).
3. **Given** all settings are entered, **When** the user clicks 登録, **Then** the success toast "接点制御装置を登録しました" appears and the user returns to the controller list route.
4. **Given** the user clicks キャンセル, **When** confirmed, **Then** the form closes and returns to the controller list route.

### User Story 2 — Browse, Search & Filter Contact-Control Devices (Priority: P1)

**As** a Staff or Headquarter user,  
**I need** to view and narrow the list of contact-control devices,  
**So that** I can quickly locate a specific unit (e.g., one in 異常 state).

**Why this priority**: FR-007 mandates list display and search; locating a unit is the entry point for edit/detail/delete.

**Independent Test**: Open the controller list, type into search, apply the status filter, and confirm the table narrows accordingly.

**Acceptance Scenarios**:

1. **Given** the controller list, **When** it renders, **Then** the table shows the 9 columns (装置ID · 装置名 · 店舗コード · 設置場所 · IPアドレス · FW · 制御ポート数 · 紐付き機器数 · ステータス) and a total count badge.
2. **Given** the search box, **When** the user types a device name or IP fragment, **Then** the list narrows to matching controllers.
3. **Given** the 詳細フィルター is expanded, **When** the user selects ステータス = 異常, **Then** only 異常 controllers remain and the active-filter badge reflects the active filter; すべてクリア resets it.
4. **Given** a 異常 controller row, **When** the list renders, **Then** the row is visually highlighted.
5. **Given** any controller row, **When** the user clicks it, **Then** the controller detail screen opens.

### User Story 3 — View Controller Detail & Connected Devices (Priority: P1)

**As** a Staff or Headquarter user,  
**I need** to inspect a controller's settings and the devices wired to it,  
**So that** I can understand the unit's configuration and connection state before maintenance.

**Why this priority**: FR-007 requires referencing the devices connected to a unit; the detail is the read surface for all controller data.

**Independent Test**: Open a controller detail, switch among the three tabs, and confirm each renders its data.

**Acceptance Scenarios**:

1. **Given** the controller detail, **When** the 基本情報 tab renders, **Then** all settings (ID, 装置名, 店舗コード, 設置場所, IPアドレス, FW, 制御ポート数, ポート番号) are shown read-only, plus a status card and connected-device summary.
2. **Given** the 紐付き機器一覧 tab, **When** it renders, **Then** the connected devices are listed (機器ID · 機器名 · 接点番号 · ゲート種別 · ステータス) with a count summary footer.
3. **Given** the 変更履歴 tab, **When** it renders, **Then** seeded change-history rows are shown read-only with a summary footer (no add/edit/delete controls).
4. **Given** the detail header, **When** an authorized user clicks 編集, **Then** the controller form opens in edit mode prefilled with the controller's values.

### User Story 4 — Edit Contact-Control Device Settings (Priority: P2)

**As** a Staff or Headquarter user,  
**I need** to update an existing controller's settings,  
**So that** the record stays accurate after firmware updates or relocation.

**Why this priority**: FR-007 edit keeps the controller ledger correct; it reuses the create form.

**Independent Test**: Open the form in edit mode, change a value, submit, and confirm the update toast and return to the list.

**Acceptance Scenarios**:

1. **Given** the form opens in edit mode, **When** it renders, **Then** the title shows 接点制御装置 編集, the submit reads 更新, and fields are prefilled from the record (状態 default 正常).
2. **Given** the user changes a value and clicks 更新, **Then** the toast "接点制御装置の変更を保存しました" appears and the user returns to the controller list route.

### User Story 5 — Delete a Contact-Control Device (Priority: P2)

**As** a Staff or Headquarter user,  
**I need** to delete a contact-control unit that is no longer used,  
**So that** the store ledger reflects only active units — but only when no devices are still wired to it.

**Why this priority**: FR-007 deletion with the 異常系 guard (no delete while connected devices exist) protects data integrity.

**Independent Test**: On a controller with connected devices, confirm 削除 is disabled; on one without, confirm the dialog deletes and returns to the list.

**Acceptance Scenarios**:

1. **Given** a controller with connected devices, **When** the detail renders, **Then** the 削除 button is disabled (FR-007 異常系).
2. **Given** a controller with no connected devices, **When** an authorized user clicks 削除, **Then** the confirmation dialog "接点制御装置を削除しますか？" appears.
3. **Given** the confirmation dialog, **When** the user clicks 削除する, **Then** the controller is deleted and the user returns to the controller list route.
4. **Given** an Observer or Trainer, **When** viewing the detail, **Then** the 削除 and 編集 actions are not available to them (role gate).

### Edge Cases

- Submitting the create/edit form with empty required fields → blocked; the enforced set is 装置名, 店舗コード, 設置場所, IPアドレス, 制御ポート数, ポート番号, 状態 (Q2). ファームウェアバージョン may be left empty.
- IPアドレス entered in a non-local-IP format → blocked by the format constraint (Q2).
- Status filter or search yielding zero controllers → empty result handling is not implemented in the panel (Deferred to Plan).
- Deletion attempted on a controller with connected devices → blocked at the UI (button disabled), reflecting FR-007 異常系.
- Opening 変更履歴 → read-only seeded rows; no creation/editing of history in Phase 1.
- ステータス変更 dialog committed → updates only the controller's current 状態; no history entry is written (Q3).
- Network/API failure on save or delete → error feedback + retain state (Deferred to Plan).

---

## Requirements

### Functional Requirements (Phase 1 — FR-007)

- **FR-007-A (List & Search)**: System MUST display a list of contact-control devices showing 装置ID, 装置名, 店舗コード, 設置場所, IPアドレス, ファームウェアバージョン, 制御ポート数, 紐付き機器数, and ステータス, scoped to the user's accessible stores, and MUST let users search by device name / IP address and filter by status (正常 / 異常 / メンテナンス中 / 廃棄).
- **FR-007-B (Register)**: System MUST allow authorized users to register a contact-control device capturing 装置名, 店舗コード, 設置場所, IPアドレス, ファームウェアバージョン, 制御ポート数, ポート番号, and 状態 (default 正常). 接点制御装置ID MUST be system-assigned and read-only. On success the system MUST confirm and return the user to the controller list.
- **FR-007-C (Edit)**: System MUST allow authorized users to edit an existing contact-control device using the same form, prefilled from the record, and MUST confirm and return to the list on success.
- **FR-007-D (Detail)**: System MUST display a read-only controller detail with the full settings, a status summary, a connected-device summary (counts), and the list of connected devices (機器ID · 機器名 · 接点番号 · ゲート種別 · ステータス).
- **FR-007-E (Delete with guard)**: System MUST allow authorized users to delete a contact-control device only after a confirmation dialog, and MUST prevent deletion while the device has connected devices (FR-007 異常系).
- **FR-007-F (Status change)**: System MUST allow authorized users to change a controller's status via the status-change dialog (変更種別 / 新しいステータス / optional メモ). The action MUST update **only** the controller's current 状態 and MUST NOT write a change-history entry (Q3).
- **FR-007-G (Change history — read only)**: System MUST display the controller's change history (日時 · 操作者 · 種別 · ステータス変化 · メモ) as read-only seeded data. Creating, updating, or deleting history records is out of scope for Phase 1.
- **FR-007-H (Access control)**: System MUST restrict register / edit / delete / status-change to roles `System`, `Headquarter`, `Manager` (jurisdiction), and `Staff` (own store), per E-02 §権限マトリクス (接点制御装置設定), and MUST deny these actions to `Trainer` and `Observer`. `Observer` MUST be able to **view** the controller list and detail (read-only); `Trainer` MUST have no access (Q1).
- **FR-VAL-007 (Validation)**: System MUST enforce the following required fields as submit-blocking on the controller form: 装置名, 店舗コード, 設置場所, IPアドレス, 制御ポート数, ポート番号, 状態 (Q2). ファームウェアバージョン is optional. IPアドレス MUST additionally match the local-IP address format.

### Key Entities

- **Contact-Control Device (接点制御装置)**: Store-scoped control unit. Attributes: ID (system-assigned, read-only), 装置名, 店舗コード, 設置場所, IPアドレス, ファームウェアバージョン (optional), 制御ポート数, ポート番号 (confirmed required Phase 1 field), 状態, 紐付き機器数 (derived), 作成日時, 更新日時.
- **Connected Device (接続機器 — referenced)**: Device wired to a controller; shown read-only on the detail as 機器ID, 機器名, 接点番号, ゲート種別, ステータス. Owned by FR-001–FR-006 (out of this spec); referenced here for the connected-device list/summary.
- **Controller Status (状態)**: One of 正常 / 異常 / メンテナンス中 / 廃棄 (default 正常). E-02 §機器状態.
- **Change History Entry (変更履歴) — read only**: Seeded record with 日時, 操作者, 種別 (ステータス変更 / 故障報告 / 点検完了 / 新規作成), ステータス変化 (from → to), メモ. Display-only in Phase 1.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Authorized users can register a new contact-control device and reach the success confirmation in under 2 minutes.
- **SC-002**: From the controller list, a user can locate a specific unit (by name/IP search or status filter) in under 30 seconds for a store with up to 50 controllers.
- **SC-003**: 100% of controllers that have connected devices have their delete action blocked (button disabled), preventing accidental deletion (FR-007 異常系).
- **SC-004**: Users editing a controller see all previously saved settings prefilled with zero manual re-entry of unchanged fields.
- **SC-005**: The controller detail accurately reflects the count and status of connected devices (summary totals equal the connected-device list rows).
- **SC-006**: Role-restricted actions (register / edit / delete / status-change) are unavailable to Trainer and Observer 100% of the time.

---

## Assumptions

- The contact-control device list is a **dedicated route** (per user direction), not a tab nested inside the connected-equipment screen; the prototype's tab embedding is reinterpreted accordingly.
- 接点制御装置ID auto-numbering is performed server-side; the form only displays it read-only.
- 店舗コード is selected via the store combobox, scoped to the user's accessible stores.
- The list, detail, and connected-device data are fetched from the backend during implementation; the prototype uses seed/mock data (`CONTROLLER_DATA`, `HAS_CONNECTED_DEVICES`, devices/history seeds).
- Change history is **seed/display-only** in Phase 1 — no create/update/delete of history records (per user direction).
- `紐付き機器数` and connected-device summaries are derived server-side from the connected-equipment records (FR-001–006, out of scope here).
- Server loading, save/fetch-error, submit-in-progress, and empty-result states are added during implementation (not present in the prototype).
- Role-based access for register/edit/delete/status-change follows E-02 §権限マトリクス; Observer may view the list/detail read-only while configuration remains denied (Q1).

---

## Q&A / Clarification — Resolved (Session 2026-06-26)

> All blocking items resolved by the user. No open clarifications remain.

| #   | Topic                                             | Resolution                                                                                                                                                                                |
| --- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | View access for the controller list/detail        | **A — Observer may view** the list/detail (read-only); configuration actions (register/edit/delete/status-change) remain denied. Trainer: no access.                                      |
| Q2  | Required-field enforcement on the controller form | **A — Enforce all visually-required fields**: 装置名, 店舗コード, 設置場所, IPアドレス, 制御ポート数, ポート番号, 状態. ファームウェアバージョン optional; ポート番号 confirmed required. |
| Q3  | Status-change dialog vs seed-only history         | **A — Update current 状態 only**; do NOT write a history entry. The ステータス変更 dialog remains in Phase 1; history stays seed/display-only.                                            |

### Non-blocking observations (documented defaults applied)

| #   | Code ↔ Requirement discrepancy                                                                                                                    | Default applied in this spec                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| N1  | `ポート番号` appears in `controller-form` and `controller-detail` but is **not** in the FR-007 registration/edit item list.                       | **Resolved (Q2)**: confirmed an official, required Phase 1 field.     |
| N2  | `IPアドレス` carries a required marker in the form, but FR-007 does not state its optionality.                                                    | Treated as required (per the prototype marker).                       |
| N3  | `ファームウェアバージョン` is an FR-007 listed item but carries **no** required marker in the form.                                               | Treated as optional (per the prototype).                              |
| N4  | The 変更履歴 tab is requirement-external (E-02 notes FR-012 specifies "記録・参照", not a standalone tab).                                        | Retained as **seed/display-only** per user direction; no write paths. |
| N5  | `ゲート種別` (入口扉/出口扉/その他) column on the connected-device sub-table is not defined by FR-007.                                            | Reproduced as a read-only display attribute from the prototype.       |
| N6  | Store identifier inconsistency in mock data (detail 基本情報 shows 店舗コード `S-004` while list/form use `YS-001`; subtitle store text differs). | Treated as mock noise; real store code comes from the backend record. |
| N7  | The prototype list (`ControllerListPanel`) has no empty-result block, and pagination is a single static page.                                     | Empty-result + real pagination are Deferred to Plan.                  |
| N8  | The controller form has **no** unsaved-changes discard guard (unlike `equipment-form`).                                                           | Matches prototype; no guard specified for Phase 1 (Plan may add one). |
