# Feature Specification: E-02 Connected Equipment Form (Create / Edit)

**Feature Branch**: `007-equipment-form`  
**Created**: 2026-06-25  
**Status**: Clarified  
**PO Spec**: `E-02` — 店舗機器管理 (Store Equipment Management)  
**Source**: `.cache/fitness-crm-ui/src/pages/equipment-form.tsx` + `.cache/fitness-crm-ui/public/requirements/E-02.md`  
**Input**: User description: "Create spec for screen E-02 店舗機器管理 (Equipment Page Management) — Phase 1 scope: FR-003, FR-005, FR-008, FR-009"

---

## Clarifications

### Session 2026-06-25

- Q: Which fields must be hard-enforced on submit? → A: **Follow the prototype** — only the fields the prototype `validate()` checks are submit-blocking: 機器名, 機器タイプ, シリアルナンバー, 設置場所, 設置日. (認証方式 and 接続先接点制御装置 keep their visual required mark but are **not** submit-blocking in Phase 1.)
  - **Update 2026-06-30**: 認証方式 and 接続先接点制御装置 are now **submit-blocking required**. They are validated at the field level (`equipmentFormSchema`) when the 保存 button is clicked — not via `superRefine` — and render a red border + error message when empty. This supersedes the Phase 1 "not submit-blocking" decision for these two fields.
- Q: Is 接続先ポート番号 an official Phase 1 field? → A: **Yes, and it is required** (must be validated on submit). FR-003 field list is extended to include it.
- Q: Must at least one usage-control judgment be selected to save? → A: **No** — submitting with no judgment selected is allowed (FR-008 異常系 "契約種別未選択" is **not** enforced in Phase 1).
- Q: If a judgment checkbox is checked, is its Select required? → A: **Yes** — when a checkbox is checked, its Select MUST have a value; when unchecked, the Select is not required.
- Q: On create, which statuses are selectable? → A: **All four** (正常 / 異常 / メンテナンス中 / 廃棄) are selectable.
- Q: Gate-stop conditions — display-only on this form? → A: **Yes, display-only** (no per-device toggle in Phase 1).
- Q: How is 接続先接点制御装置 selected? → A: **Picker tied to FR-007** controller records.

### Clarified Decisions

1. **Required validation = prototype set**: submit-blocking fields are 機器名 / 機器タイプ / シリアルナンバー / 設置場所 / 設置日, **plus 接続先ポート番号** (Q2) and **any checked judgment's Select** (Q4). 認証方式 and 接続先接点制御装置 are **also submit-blocking required** (Update 2026-06-30), validated at the field level when 保存 is clicked.
2. **接続先ポート番号**: official Phase 1 field, **required**.
3. **Usage-control rule optionality**: ≥1 judgment is **not** mandatory; the device may be saved with no rule.
4. **Conditional Select**: required only while its checkbox is checked; hidden (unchecked) Select values are discarded on save.
5. **Status on create**: all four states selectable.
6. **Gate-stop note**: display-only, no configuration.
7. **Controller field**: picker bound to FR-007 records (not free text).

---

## Scope

### In Scope (Phase 1)

| ID         | Requirement                                          | Screen Coverage                                                                 |
| ---------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| **FR-003** | New connected-equipment registration                 | `equipment-form` in **create** mode — 基本情報 + 接続情報 + 備考 sections, 登録 |
| **FR-005** | Connected-equipment edit                             | `equipment-form` in **edit** mode — same form, prefilled, 更新                  |
| **FR-008** | Usage-control rule configuration (device × contract) | 利用制御ルール section — 主契約判定 / オプション契約判定 / 都次オプション判定   |
| **FR-009** | Authentication method settings management            | 認証方式 radio group — 会員読取型 / 機器読取型 / なし                           |

### Out of Scope for Phase 1

| ID / Feature                            | Reason                                                                                                                                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001                                  | Connected-equipment list display (separate list screen)                                                                                                                                               |
| FR-002                                  | Connected-equipment search (list screen)                                                                                                                                                              |
| FR-004                                  | Connected-equipment detail (read-only) — covered by `006-equipment-detail`                                                                                                                            |
| FR-006                                  | Connected-equipment deletion — covered by `006-equipment-detail`                                                                                                                                      |
| FR-007                                  | Contact-control device (接点制御装置) settings management — separate screen                                                                                                                           |
| FR-010                                  | Bulk status update — list-screen action                                                                                                                                                               |
| FR-011                                  | Equipment ledger CSV export                                                                                                                                                                           |
| FR-012                                  | Status change history record/reference — covered by `006-equipment-detail`                                                                                                                            |
| FR-013                                  | Equipment usage log reference                                                                                                                                                                         |
| Gate-stop condition **execution**       | FR-008 gate-stop rule (blacklist / arrears / family-member-in-use) is auto-applied; the form only **displays** an informational note for gates. Runtime judgment is system-side, not configured here. |
| Member authentication / activation flow | QR one-time activation (#173) is mobile-app/runtime behavior, not configured on this form                                                                                                             |

**Phase markers in code**: `equipment-form.tsx` contains no explicit Phase 2 / future-scope placeholders, disabled-for-future controls, or commented-out features. All rendered controls belong to the Phase 1 scope above.

---

## Feature Overview

| Item        | Detail                                                                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Screen name | 接続機器 新規登録 / 接続機器 編集 (Connected Equipment — New Registration / Edit)                                                                                                                                  |
| UI slug     | `equipment-form`                                                                                                                                                                                                   |
| Mode        | `create` (default) and `edit`, selected via `mode` prop                                                                                                                                                            |
| Parent list | `equipment-list` (接続機器管理)                                                                                                                                                                                    |
| Brands      | JOYFIT / FIT365 (common); per-use option enum values may be brand-extended (E-02 §ブランド別設定構築)                                                                                                              |
| Purpose     | Staff and HQ users register a new connected device or edit an existing one — capturing basic info, controller connection, authentication method, and usage-control rules that govern device start-up authorization |

**Source**: E-02 §概要, FR-003, FR-005, FR-008, FR-009; basic flow steps ④ (FR-003) and ⑤ (FR-008).

---

## Actors & Access Control

**Source**: E-02 §権限マトリクス (接続機器登録・編集・削除 / 利用制御ルール設定 columns)

| Role            | Register / Edit Equipment | Usage-Control Rule Config | Data Scope          |
| --------------- | ------------------------- | ------------------------- | ------------------- |
| **System**      | ○                         | ○                         | All stores          |
| **Headquarter** | ○                         | ○                         | All stores          |
| **Manager**     | ○ (jurisdiction stores)   | ○ (jurisdiction stores)   | Jurisdiction stores |
| **Staff**       | ○ (own store)             | ○ (own store)             | Own store           |
| **Observer**    | × (view only)             | ×                         | Own store (view)    |
| **Trainer**     | ×                         | ×                         | No access           |

> The prototype `equipment-form.tsx` does not render role-gated controls; access control is enforced upstream (route/page access). Authorization for who may open this form is **Deferred to Plan**.

---

## Component Hierarchy & Layout

**Source**: `equipment-form.tsx`

```
EquipmentForm (mode: create | edit)
├── SharedSidebar (currentPage="equipment-form")
└── SidebarInset (flex col, max-h-svh, overflow hidden)
    ├── SharedHeader
    ├── PageHeader (outside)
    │   ├── BackLink → confirmDiscard → navigate("equipment-list")  [label: 接続機器管理に戻る]
    │   └── title: 接続機器 新規登録 (create) | 接続機器 編集 (edit)
    ├── main (flex-1, overflow-auto, px-6 py-4)
    │   └── container (max-w-960px, centered, space-y-6)
    │       ├── Card: 基本情報 (2-col grid)
    │       │   ├── 接続機器ID (disabled / readonly)
    │       │   ├── 機器名 *            (Input, validated)
    │       │   ├── 機器タイプ *        (Select, validated)
    │       │   ├── シリアルナンバー *  (Input, validated)
    │       │   ├── 設置場所 *          (Input, validated)
    │       │   ├── 設置日 *            (DatePicker, validated)
    │       │   ├── 状態 *              (Select, default 正常)
    │       │   └── 認証方式 *          (RadioGroup, col-span-2)   ← FR-009
    │       ├── Card: 接続情報 (2-col grid)
    │       │   ├── 接続先接点制御装置 * (search Input)
    │       │   ├── 接続先ポート番号 *   (Input)
    │       │   ├── IPアドレス           (Input, optional)
    │       │   └── MACアドレス          (Input, optional)
    │       ├── Card: 利用制御ルール      ← FR-008
    │       │   ├── description: 複数選択可・いずれか1つを満たせば起動許可
    │       │   ├── 主契約判定 checkbox → (if checked) 主契約タイプ Select *
    │       │   ├── オプション契約判定 checkbox → (if checked) オプション種別 Select *
    │       │   ├── 都次オプション判定 checkbox → (if checked) 都次オプション種別 Select *
    │       │   └── ゲートストップ条件 info box (only when 機器タイプ = 入退館ゲート)
    │       ├── Card: 備考 (Textarea, optional)
    │       └── Footer actions (border-t)
    │           ├── submitError text: 未入力の項目があります
    │           ├── キャンセル → confirmDiscard → navigate("equipment-list")
    │           └── 登録 (create) | 更新 (edit) → handleSubmit
    └── AlertDialog → 離脱確認 (unsaved-changes discard dialog)
```

- Minimum supported width: 768 px (project standard)
- Content container max width: 960 px, centered
- Required fields use `RequiredMark`; optional fields use `OptionalMark`

---

## UI Element Traceability

### Section 1 — 基本情報 (Basic Info)

| Field Label      | Control          | Required | Validated on submit              | Default (create / edit) | Source Requirement                                                              |
| ---------------- | ---------------- | -------- | -------------------------------- | ----------------------- | ------------------------------------------------------------------------------- |
| 接続機器ID       | Input (disabled) | —        | —                                | （自動採番） / `1`      | FR-003 — 機器IDはシステムが自動採番                                             |
| 機器名           | Input            | ✅       | ✅                               | "" / タンニングマシン A | FR-003 — 機器名（必須）                                                         |
| 機器タイプ       | Select           | ✅       | ✅                               | "" / タンニングマシン   | FR-003 — 機器タイプ（必須）                                                     |
| シリアルナンバー | Input            | ✅       | ✅                               | "" / SN-20250101-001    | FR-003 — シリアルナンバー（必須）                                               |
| 設置場所         | Input            | ✅       | ✅                               | "" / 1F入口             | FR-003 — 設置場所（必須）                                                       |
| 設置日           | DatePicker       | ✅       | ✅                               | "" / 2025-02-16         | FR-003 — 設置日（必須）                                                         |
| 状態             | Select           | ✅       | ❌ (has default)                 | 正常 / 正常             | FR-003 — 状態（必須・初期推奨「正常」）; all 4 states selectable on create (Q5) |
| 認証方式         | RadioGroup       | ✅       | ✅ (required, Update 2026-06-30) | （未選択）/ 会員読取型  | FR-003 / **FR-009**                                                             |

**機器タイプ options** (E-02 §機能の定義 — 機器タイプ): 入退館ゲート / 水素水サーバー / 体組成計 / タンニングマシン / プロテインサーバー / その他

**状態 options** (E-02 §機器状態 — 4 states): 正常 / 異常 / メンテナンス中 / 廃棄

**認証方式 options (FR-009)**: 会員読取型 (member scans device QR) / 機器読取型 (device reads member QR) / なし (no authentication)

### Section 2 — 接続情報 (Connection Info)

| Field Label        | Control                 | Required marker | Validated on submit              | Default (edit) | Source Requirement                                              |
| ------------------ | ----------------------- | --------------- | -------------------------------- | -------------- | --------------------------------------------------------------- |
| 接続先接点制御装置 | Picker (search, FR-007) | ✅              | ✅ (required, Update 2026-06-30) | 装置ID: 2      | FR-003 — 接続先接点制御装置（必須）; picker tied to FR-007 (Q7) |
| 接続先ポート番号   | Input                   | ✅              | ✅ (required, Q2)                | `1`            | FR-003 (extended, Q2) — official Phase 1 field, required        |
| IPアドレス         | Input                   | — (optional)    | —                                | 192.168.1.101  | FR-003 — IPアドレス（任意）                                     |
| MACアドレス        | Input                   | — (optional)    | —                                | "" (empty)     | FR-003 — MACアドレス（任意）                                    |

> 接続先接点制御装置 is a **picker bound to FR-007 controller records** (Q7), surfaced via a search field ("店舗名で検索"). It stores the selected controller's identifier; the picker is scoped to the device's store. It is **submit-blocking required** (Update 2026-06-30): leaving it empty shows a red border + error on 保存. The exact picker UX (modal vs inline list) is Deferred to Plan.

### Section 3 — 利用制御ルール (Usage Control Rule) — FR-008

Header note (verbatim): 「起動許可の条件となる契約種別を選択してください（複数選択可・いずれか1つを満たせば起動許可）」 — OR logic across selected judgment types.

| Control                       | Reveals when checked                      | Options                                                       | Source Requirement                             |
| ----------------------------- | ----------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| 主契約判定 (checkbox)         | 主契約タイプ Select (req)                 | スタンダード / プレミアム / ライト                            | FR-008 — 主契約判定                            |
| オプション契約判定 (checkbox) | オプション種別 Select (req)               | 水素水 / プロテイン / タンニング / その他                     | FR-008 — オプション契約判定                    |
| 都次オプション判定 (checkbox) | 都次オプション種別 Select (req)           | 水素水都次 / プロテイン都次 / タンニング都次 / コラーゲン都次 | FR-008 — 都次オプション判定 (FIT365 先行)      |
| ゲートストップ条件 info box   | shown only when 機器タイプ = 入退館ゲート | static text (① ブラックリスト ② 未納 ③ 家族会員利用中)        | FR-008 — gate-stop auto-applied (display only) |

- 主契約タイプ is a **single** Select (single value), consistent with E-02 §要件の設計判断 "FR-008 主契約タイプ 単数実装" decision.
- The three judgment checkboxes are independent; any combination (including **none**) may be set — saving a device with **no** judgment selected is allowed (Q3; FR-008 異常系 not enforced in Phase 1).
- When a judgment checkbox is **checked**, its Select is **required** (must have a value before save); when **unchecked**, the Select is not required and any previously chosen value is discarded on save (Q4).
- The ゲートストップ条件 note is informational only — these conditions are auto-applied by the system for entry/exit gates and are not configurable on this form (Q6).

### Section 4 — 備考 (Remarks)

| Field | Control  | Required     | Source Requirement    |
| ----- | -------- | ------------ | --------------------- |
| 備考  | Textarea | — (optional) | FR-003 — 備考（任意） |

### Footer Actions

| Element            | Behavior                                                                    | Source Requirement             |
| ------------------ | --------------------------------------------------------------------------- | ------------------------------ |
| Error hint         | "未入力の項目があります" shown when submit validation fails                 | FR-003 異常系 — 必須項目未入力 |
| キャンセル button  | Triggers unsaved-changes guard; if confirmed, navigates to `equipment-list` | Standard UX                    |
| 登録 / 更新 button | `登録` in create, `更新` in edit; runs validation then submits              | FR-003 / FR-005                |

### Unsaved-Changes Guard (離脱確認 dialog)

| Element        | Content                                                    |
| -------------- | ---------------------------------------------------------- |
| Title          | 変更を破棄しますか？                                       |
| Description    | 未保存の変更はすべて失われます。この操作は取り消せません。 |
| Cancel action  | 編集を続ける (keep editing)                                |
| Confirm action | 破棄する (discard) → proceeds with the pending navigation  |

- Any field change calls `markDirty()`; leaving via back link or キャンセル while dirty opens this dialog.
- On successful submit, the dirty flag is cleared before navigation (no discard prompt).

---

## Behavioral Logic

**Source**: `equipment-form.tsx` (`validate`, `handleSubmit`, conditional rendering)

1. **Create vs Edit**: `mode` prop drives page title (新規登録 / 編集), submit label (登録 / 更新), success toast text, and edit-mode prefilled values. 接続機器ID is read-only — shows "（自動採番）" in create and the existing ID in edit.
2. **Validation (on submit)** — submit-blocking required fields (resolved):
   - Always: 機器名, 機器タイプ, シリアルナンバー, 設置場所, 設置日 (prototype set, Q1).
   - Plus: 接続先ポート番号 (Q2), 認証方式 and 接続先接点制御装置 (Update 2026-06-30).
   - Conditional: 主契約タイプ / オプション種別 / 都次オプション種別 — each required **only** while its parent judgment checkbox is checked (Q4).
   - On failure: per-field errors plus a global hint "未入力の項目があります" appear, and the view scrolls to the first invalid field. Inline field errors clear as the user provides a valid value.
3. **状態 default** (Q5): 状態 always has a default (正常) and all four states are selectable on create.
4. **Usage-control rule is optional** (Q3): the form may be submitted with **no** judgment checkbox selected; FR-008 異常系 "契約種別未選択 → エラー" is not enforced in Phase 1.
5. **Conditional reveal**: A judgment Select renders only while its checkbox is checked; unchecking discards its value on save (Q4). The gate-stop info box renders only while 機器タイプ = 入退館ゲート, and is display-only (Q6).
6. **Submit success**: clears errors, clears dirty flag, shows toast (`接続機器を登録しました` / `接続機器の変更を保存しました`), and navigates to `equipment-list`.

---

## UI States

**Prototype implementation note**: `equipment-form.tsx` uses local React state and mock defaults. No server loading, fetch-error, or save-error states are implemented.

| State                     | Behavior in prototype                                        | Expected (Deferred to Plan)                                                    |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **Create — empty**        | All fields empty/default; ID shows "（自動採番）"            | Default create state                                                           |
| **Edit — prefilled**      | Fields populated from the equipment record                   | Fetch existing equipment by ID, then render populated form                     |
| **Validation error**      | Per-field error text + global hint + scroll-to-first-invalid | Same; enforced set = prototype 5 + 接続先ポート番号 + checked judgment Selects |
| **Submitting**            | Not represented                                              | Disable submit / show progress while saving (Plan)                             |
| **Save success**          | Toast + navigate to list                                     | Same, after server confirmation                                                |
| **Save / fetch error**    | Not represented                                              | Error feedback + retain entered data (Plan)                                    |
| **Unsaved-changes guard** | `discardDialogOpen` via `useUnsavedChanges`                  | Same                                                                           |

---

## User Scenarios & Testing

### User Story 1 — Register a New Connected Device (Priority: P1)

**As** a Staff or Headquarter user,  
**I need** to register a newly installed connected device with its basic info, controller connection, authentication method, and usage-control rules,  
**So that** the device is tracked in the store ledger and can authorize members per their contracts.

**Why this priority**: FR-003 is the primary create path and the prerequisite for every downstream device operation.

**Independent Test**: Open the form in create mode, fill all required fields, configure a usage-control rule, submit, and confirm navigation back to the list with a success toast.

**Acceptance Scenarios**:

1. **Given** the form opens in create mode, **When** it renders, **Then** the title shows 接続機器 新規登録, the submit button reads 登録, and 接続機器ID shows "（自動採番）" (read-only).
2. **Given** the user leaves required fields empty, **When** they click 登録, **Then** per-field errors appear for 機器名, 機器タイプ, シリアルナンバー, 設置場所, 設置日, and 接続先ポート番号, the hint "未入力の項目があります" is shown, and the view scrolls to the first invalid field.
3. **Given** all submit-blocking required fields are filled, **When** the user clicks 登録, **Then** a success toast "接続機器を登録しました" appears and the user is navigated to `equipment-list`. Submitting with no usage-control judgment selected is permitted.
4. **Given** the 接続先接点制御装置 picker, **When** the user searches, **Then** controller records from FR-007 (scoped to the device's store) are offered for selection, and the chosen controller's identifier is stored.
5. **Given** the user selects 機器タイプ = 入退館ゲート, **When** viewing the 利用制御ルール section, **Then** the gate-stop conditions info box (ブラックリスト / 未納 / 家族会員利用中) is displayed as read-only information.
6. **Given** the user has entered data, **When** they click キャンセル or the back link, **Then** the discard confirmation dialog appears before leaving.

---

### User Story 2 — Edit an Existing Connected Device (Priority: P1)

**As** a Staff or Headquarter user,  
**I need** to open an existing device in edit mode and update its information,  
**So that** the ledger stays accurate after configuration or hardware changes.

**Why this priority**: FR-005 reuses the same validation as FR-003 and is core to keeping device data correct.

**Independent Test**: Open the form in edit mode, confirm fields are prefilled, change a value, submit, and confirm the update toast and navigation.

**Acceptance Scenarios**:

1. **Given** the form opens in edit mode, **When** it renders, **Then** the title shows 接続機器 編集, the submit button reads 更新, and fields are prefilled with the existing record's values.
2. **Given** prefilled equipment of type タンニングマシン, **When** the 利用制御ルール section renders, **Then** the checkboxes reflecting the existing rule are checked (オプション契約判定 / 都次オプション判定) and their Selects show the saved values.
3. **Given** the user changes a value and clicks 更新, **When** validation passes, **Then** a success toast "接続機器の変更を保存しました" appears and the user is navigated to `equipment-list`.
4. **Given** the user clears a required field and clicks 更新, **When** validation runs, **Then** the same required-field errors as create mode are shown and submission is blocked.

---

### User Story 3 — Configure Usage-Control Rules (Priority: P1)

**As** a Staff or Headquarter user,  
**I need** to define which contract conditions authorize a device to start,  
**So that** only members with valid contracts/options can use the device.

**Why this priority**: FR-008 is the core business value of E-02 — controlling device start-up by contract validity.

**Independent Test**: Toggle each judgment checkbox, confirm the matching Select appears, choose values, and confirm they persist on submit.

**Acceptance Scenarios**:

1. **Given** the 利用制御ルール section, **When** the user checks 主契約判定, **Then** the 主契約タイプ Select appears (スタンダード / プレミアム / ライト).
2. **Given** the user checks オプション契約判定, **When** the section re-renders, **Then** the オプション種別 Select appears (水素水 / プロテイン / タンニング / その他).
3. **Given** the user checks 都次オプション判定, **When** the section re-renders, **Then** the 都次オプション種別 Select appears (水素水都次 / プロテイン都次 / タンニング都次 / コラーゲン都次).
4. **Given** multiple judgment types are checked, **When** the rule is interpreted, **Then** the OR semantics apply — satisfying any one selected condition authorizes start-up (per section note).
5. **Given** a judgment checkbox is checked but its Select is left empty, **When** the user submits, **Then** submission is blocked with a required error on that Select (Q4).
6. **Given** no judgment checkbox is selected, **When** the user submits an otherwise valid form, **Then** the device is saved with no usage-control rule (allowed — Q3).
7. **Given** a judgment checkbox was checked with a value then unchecked, **When** the user saves, **Then** that hidden Select value is discarded and not persisted (Q4).

---

### User Story 4 — Set Authentication Method (Priority: P2)

**As** a Staff or Headquarter user,  
**I need** to set how members authenticate at the device,  
**So that** the correct QR authentication flow is applied for that device type.

**Why this priority**: FR-009 (Should) defines per-device authentication and complements the usage-control rule.

**Independent Test**: Select each authentication method radio option and confirm the choice is captured on submit.

**Acceptance Scenarios**:

1. **Given** the 認証方式 field, **When** the form renders, **Then** three options are available: 会員読取型, 機器読取型, なし.
2. **Given** edit mode for an existing device, **When** the form renders, **Then** the saved authentication method (e.g., 会員読取型) is preselected.
3. **Given** the user selects an authentication method, **When** they submit a valid form, **Then** the selected method is saved with the device record.

---

### Edge Cases

- 認証方式 and 接続先接点制御装置 left empty → submission blocked with a required error + red border (Update 2026-06-30; supersedes the original Q1 "not submit-blocking" decision).
- 接続先ポート番号 left empty → submission blocked with required error (Q2).
- Submitting with no usage-control judgment selected → allowed; device saved with no rule (Q3).
- Judgment checkbox checked but its Select empty → submission blocked with required error on that Select (Q4).
- Judgment checkbox unchecked after a value was chosen → value discarded on save (Q4).
- Leaving the form with unsaved changes → discard confirmation dialog (破棄する / 編集を続ける).
- Switching 機器タイプ away from 入退館ゲート hides the gate-stop info box; switching to it shows it.
- All four statuses (正常 / 異常 / メンテナンス中 / 廃棄) selectable at creation (Q5).
- Network/API failure on save → toast error + retain entered data (Deferred to Plan).

---

## Requirements

### Functional Requirements (Phase 1)

- **FR-003**: System MUST allow authorized users to register a new connected device, capturing 機器名 (required), 機器タイプ (required), シリアルナンバー (required), 設置場所 (required), 設置日 (required), 状態 (required, default 正常, all four states selectable), 認証方式, 接続先接点制御装置 (FR-007 picker), 接続先ポート番号 (required), IPアドレス (optional), MACアドレス (optional), 紐づき契約種別 (usage-control rule, optional), and 備考 (optional). 接続機器ID MUST be system-assigned and read-only. On successful registration, the system MUST confirm with a success message and return the user to the equipment list.
- **FR-005**: System MUST allow authorized users to edit an existing connected device using the same form and the same input validation as FR-003, with all fields prefilled from the existing record. On successful update, the system MUST confirm and return the user to the equipment list.
- **FR-VAL-001** (Validation): System MUST block submission, surface field-level errors plus a global "未入力の項目があります" hint, and focus/scroll to the first invalid field when any **submit-blocking** required input is missing. The submit-blocking set is: 機器名, 機器タイプ, シリアルナンバー, 設置場所, 設置日, 接続先ポート番号, plus each judgment Select whose parent checkbox is checked. 認証方式 and 接続先接点制御装置 carry a visual required mark but are NOT submit-blocking in Phase 1.
- **FR-007-PICK** (Controller selection): The 接続先接点制御装置 field MUST be a picker bound to FR-007 controller records, scoped to the device's store, storing the selected controller's identifier.
- **FR-008**: System MUST allow configuring per-device usage-control rules via three independent judgment types — 主契約判定 (主契約タイプ), オプション契約判定 (オプション種別), and 都次オプション判定 (都次オプション種別) — where satisfying any one selected condition authorizes device start-up (OR logic). Selecting at least one judgment is NOT mandatory; a device MAY be saved with no rule. When a judgment checkbox is checked, its Select MUST have a value; unchecking a judgment discards its value. For 入退館ゲート, the system MUST display the auto-applied gate-stop conditions (blacklist / arrears / family-member-in-use) as a read-only informational note (no per-device configuration).
- **FR-009**: System MUST allow setting the device authentication method to one of 会員読取型, 機器読取型, or なし, and persist it with the device record.
- **FR-NAV-001** (Unsaved changes): System MUST warn the user with a discard confirmation (変更を破棄しますか？) before navigating away (back link or キャンセル) while there are unsaved changes, and MUST NOT prompt after a successful save.

### Key Entities

- **Connected Equipment (接続機器)**: Store-scoped device record. Attributes: ID (system-assigned), name, type, serial number, location, install date, status, authentication method, controller reference (接続先接点制御装置), connection port (接続先ポート番号), IP address, MAC address, usage-control rule, remarks.
- **Usage Control Rule (利用制御ルール)**: Set of zero or more judgment conditions per device — main-contract judgment (with 主契約タイプ), option-contract judgment (with オプション種別), per-use-option judgment (with 都次オプション種別) — combined with OR semantics. Gate-stop conditions auto-applied for entry/exit gates.
- **Authentication Method (認証方式)**: One of 会員読取型 / 機器読取型 / なし.
- **Equipment Type (機器タイプ)**: One of 入退館ゲート / 水素水サーバー / 体組成計 / タンニングマシン / プロテインサーバー / その他.
- **Equipment Status (状態)**: One of 正常 / 異常 / メンテナンス中 / 廃棄 (default 正常).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Authorized users can register a new connected device (fill required fields + one usage-control rule) and reach the success confirmation in under 3 minutes.
- **SC-002**: 100% of submissions missing an enforced required field are blocked, with the first invalid field brought into view.
- **SC-003**: Users editing an existing device see all previously saved values prefilled with zero manual re-entry of unchanged fields.
- **SC-004**: A configured usage-control rule (any combination of the three judgment types) is saved and re-displayed identically when the device is reopened in edit mode.
- **SC-005**: Authentication method selected on save matches what is displayed on the device detail screen (`006-equipment-detail`).
- **SC-006**: Users never lose unsaved edits silently — every navigation away with pending changes prompts a discard confirmation.

---

## Assumptions

- This form is reached from the equipment list (`equipment-list`): "新規登録" for create and a row/detail action for edit.
- 接続機器ID auto-numbering is performed server-side; the form only displays it read-only.
- The 接続先接点制御装置 field is a picker bound to FR-007 controller records, scoped to the device's store, storing the controller identifier (Q7); the exact picker UX is Deferred to Plan.
- 主契約タイプ is a single value (single Select), per the E-02 design decision (FR-008 単数実装).
- Per-use option enum values (都次オプション種別) may be brand-extended; the prototype list is the FIT365 baseline (E-02 §ブランド別設定構築).
- Role-based access to open/submit the form is enforced upstream per E-02 §権限マトリクス; the form itself is permission-agnostic in the prototype.
- Server loading, save-error, and submit-in-progress states are added during implementation (not in prototype).
- Required validation follows the prototype set plus the clarified additions (接続先ポート番号 required; checked judgment Selects required); FR-008 異常系 (no-rule error) is intentionally not enforced in Phase 1 (Q1, Q2, Q3, Q4).

---

## Q&A / Clarification — Resolved (Session 2026-06-25)

> All items resolved by the user. No open clarifications remain.

| #   | Topic                              | Resolution                                                                                                                                                                                                                                                                             |
| --- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Required-field validation coverage | **Follow the prototype.** Submit-blocking = 機器名 / 機器タイプ / シリアルナンバー / 設置場所 / 設置日. ~~認証方式 and 接続先接点制御装置 are not submit-blocking.~~ **Update 2026-06-30: 認証方式 and 接続先接点制御装置 are now submit-blocking required (field-level validation).** |
| Q2  | 接続先ポート番号 field             | **Official Phase 1 field and required** (validated on submit); FR-003 field list extended.                                                                                                                                                                                             |
| Q3  | Usage-control rule mandatory-ness  | **Not mandatory.** A device may be saved with no judgment selected; FR-008 異常系 (no-rule error) not enforced in Phase 1.                                                                                                                                                             |
| Q4  | Conditional Select requiredness    | **Required only while its checkbox is checked.** Unchecking discards the Select value on save.                                                                                                                                                                                         |
| Q5  | 状態 selectable on create          | **All four** statuses (正常 / 異常 / メンテナンス中 / 廃棄) selectable.                                                                                                                                                                                                                |
| Q6  | Gate-stop note vs configuration    | **Display-only** for 入退館ゲート; no per-device configuration.                                                                                                                                                                                                                        |
| Q7  | Controller field resolution        | **Picker tied to FR-007** controller records, scoped to the device's store; stores the controller identifier.                                                                                                                                                                          |
