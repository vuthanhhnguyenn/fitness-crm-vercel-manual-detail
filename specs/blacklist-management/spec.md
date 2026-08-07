# Blacklist Management — Screen Spec

> **Spec ID**: FR-015 (A-01 Member Management — Blacklist sub-feature)
> **Screen**: Blacklist List (`/members/blacklist`)
> **Status**: Ready for Review
> **Created**: 2026-05-07
> **Source requirement**: A-01.md § FR-015, § FR-016 (partial), Permission Matrix
> **UI prototype**: `.cache/fitness-crm-ui/src/pages/blacklist-list.tsx`
> **Scope**: List screen only (blacklist-list)

---

## 1. Purpose

Provide Headquarter operators with a single searchable, filterable view of all blacklisted members —
both those automatically registered by the system at forced-withdrawal time (FR-016) and those
manually registered by HQ staff. The screen also exposes a manual-registration entry point (Sheet).

---

## 2. Actors & Access Control

| Role                           | Access                                                  |
| ------------------------------ | ------------------------------------------------------- |
| **Headquarter**                | Full access: view list + manual register                |
| **System**                     | Write-only (auto-register on forced withdrawal) — no UI |
| **Manager / Staff / Observer** | No access — route is HQ-only                            |

> Guard: this route must return 403 for any role other than Headquarter.

---

## 3. Screen Layout

```
┌─────────────────────────────────────────────────┐
│ Page title: "ブラックリスト管理"  [N件 badge]    │
│                              [+ 手動登録 button] │
├─────────────────────────────────────────────────┤
│ Card                                             │
│  ┌─ Toolbar ──────────────────────────────────┐ │
│  │ [Search input: 会員ID・氏名]  [詳細フィルター ▼] │
│  │ (expanded) [登録理由 Select] [未納金 Select] [すべてクリア] │
│  └────────────────────────────────────────────┘ │
│  Table: 会員ID | 氏名 | 店舗名 | 登録理由 | 未納金額 | 登録日 │
│  Pagination: 全N件中 1-N件を表示 | [前へ] [次へ] │
└─────────────────────────────────────────────────┘

Side panel (Sheet, right, 480px):
  ブラックリスト手動登録
  ─ 会員ID (required)
  ─ 氏名 (required)
  ─ 登録理由 (required, select)
  ─ メモ (optional, textarea)
  ─ Warning alert
  ─ [キャンセル] [登録 (destructive)]
```

---

## 4. Data Model

### 4.1 BlacklistItem (display)

| Field          | Type                              | Source | Notes                                     |
| -------------- | --------------------------------- | ------ | ----------------------------------------- |
| `memberId`     | `string`                          | API    | e.g. `"USR-00123"` — monospace            |
| `memberName`   | `string`                          | API    | Clickable → member detail page            |
| `storeName`    | `string`                          | API    | Store at time of registration             |
| `reason`       | `"forced_withdrawal" \| "manual"` | API    | Shown as Badge (label mapped at UI layer) |
| `unpaidAmount` | `number`                          | API    | JPY; 0 = no debt; >0 = destructive color  |
| `registeredAt` | `string` (ISO date)               | API    | Display as `yyyy/MM/dd`                   |

### 4.2 Manual Registration Payload

| Field        | Type                                                    | Required | Validation         |
| ------------ | ------------------------------------------------------- | -------- | ------------------ |
| `memberId`   | `string`                                                | ✅       | Non-empty          |
| `memberName` | `string`                                                | ✅       | Non-empty          |
| `reason`     | `"nuisance" \| "unpaid" \| "fraudulent_use" \| "other"` | ✅       | One of enum values |
| `memo`       | `string`                                                | ❌       | Optional free text |

---

## 5. Filter & Search Behaviour

### 5.1 Search Bar

- Placeholder: `会員ID・氏名で検索`
- Max width: `400px`
- Filters on `memberId` (case-insensitive) **or** `memberName` (partial match)

### 5.2 Detail Filters (collapsible)

Toggled by **詳細フィルター** button. Button shows active filter count badge when >0 filters are active.

| Filter   | Type   | URL param value → UI label                                                       | Default    |
| -------- | ------ | -------------------------------------------------------------------------------- | ---------- |
| 登録理由 | Select | `''` → `全登録理由` / `forced_withdrawal` → `強制退会` / `manual` → `手動登録`   | `''` (all) |
| 未納金   | Select | `''` → `未納金：全件` / `has_debt` → `未納金：あり` / `no_debt` → `未納金：なし` | `''` (all) |

- **すべてクリア** button resets both selects to defaults.
- All filter/search/page state must live in URL search params via `nuqs`.

---

## 6. Table Columns

| Column   | Width                | Notes                                                                         |
| -------- | -------------------- | ----------------------------------------------------------------------------- |
| 会員ID   | 110px                | Monospace, muted text                                                         |
| 氏名     | —                    | Clickable link → `/members/{memberId}`; row click → blacklist detail (future) |
| 店舗名   | —                    | Plain text                                                                    |
| 登録理由 | 110px                | Badge: `強制退会` = destructive tint; `手動登録` = warning tint               |
| 未納金額 | 110px, right-aligned | `¥{n.toLocaleString()}`; destructive + medium when >0; muted when 0           |
| 登録日   | 110px                | `yyyy/MM/dd`                                                                  |

### Empty State

When 0 rows match:

- Text: `該当のデータがありません。`
- If search or filter active → show **条件をクリア** button that resets all

---

## 7. Pagination

- Page-based (not infinite scroll)
- Display: `全 N 件中 1–M 件を表示`
- Prev / Next buttons — disabled at first / last page
- Default page size: 20

---

## 8. Manual Registration Sheet

Triggered by **+ 手動登録** button in the page header. Button is visible only for Headquarter role.

### Fields

| Field    | Component           | Required | Notes                                                  |
| -------- | ------------------- | -------- | ------------------------------------------------------ |
| 会員ID   | `Input`             | ✅       | Placeholder `例：USR-00123`                            |
| 氏名     | `Input`             | ✅       | Placeholder `例：田中 次郎`                            |
| 登録理由 | `Select`            | ✅       | Options: `迷惑行為` / `未納金` / `不正利用` / `その他` |
| メモ     | `Textarea` (4 rows) | ❌       | Placeholder: `補足情報を入力してください`              |

### Warning Alert

Displayed below the form, before the footer:

> ブラックリストに登録された会員の個人情報は削除できなくなります

Style: `bg-warning/10 border-warning/20 text-warning` with `TriangleAlert` icon.

### Sheet Footer

| Button     | Variant       | Behaviour                                                                                                                              |
| ---------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| キャンセル | `outline`     | Closes sheet, resets all fields                                                                                                        |
| 登録       | `destructive` | Disabled when any required field is empty; on success → `toast.success("ブラックリストに登録しました")` + close + reset + refetch list |

### Validation

- `react-hook-form` + `zod` schema
- All required fields non-empty before **登録** is enabled

---

## 9. Toasts

| Event                       | Message                                        | Type      |
| --------------------------- | ---------------------------------------------- | --------- |
| Manual registration success | `ブラックリストに登録しました`                 | `success` |
| Manual registration failure | `登録に失敗しました。もう一度お試しください。` | `error`   |
| API fetch error             | `データの取得に失敗しました。`                 | `error`   |

---

## 10. API Endpoints Required

| Method | Path                 | Description                                                                    |
| ------ | -------------------- | ------------------------------------------------------------------------------ |
| `GET`  | `/api/crm/blacklist` | Paginated list; query params: `search`, `reason`, `unpaid`, `page`, `pageSize` |
| `POST` | `/api/crm/blacklist` | Manual registration; body: `{ memberId, memberName, reason, memo? }`           |

### 10.1 Enum Declarations

All enums below are declared in `src/app/api/_schemas/blacklist.schema.ts` as Zod enums (single source of truth) and re-exported as TypeScript types.

#### `BlacklistRegistrationSource` — how the record was created (read-only, system-assigned)

```ts
enum BlacklistRegistrationSource {
  ForcedWithdrawal = 'forced_withdrawal',
  Manual = 'manual',
}

// UI label map (used in Badge, Select options)
const BLACKLIST_REGISTRATION_SOURCE_LABEL: Record<BlacklistRegistrationSource, string> = {
  forced_withdrawal: '強制退会',
  manual: '手動登録',
};
```

#### `BlacklistManualReason` — reason selected by HQ during manual registration

```ts
enum BlacklistManualReason {
  Nuisance = 'nuisance',
  Unpaid = 'unpaid',
  FraudulentUse = 'fraudulent_use',
  Other = 'other',
}

// UI label map (used in Select options inside the registration Sheet)
const BLACKLIST_MANUAL_REASON_LABEL: Record<BlacklistManualReason, string> = {
  nuisance: '迷惑行為',
  unpaid: '未納金',
  fraudulent_use: '不正利用',
  other: 'その他',
};
```

#### `UnpaidFilter` — URL search-param value for the 未納金 filter

```ts
enum UnpaidFilter {
  All = 'all',
  HasDebt = 'has_debt',
  NoDebt = 'no_debt',
}

// UI label map (used in Select options)
const UNPAID_FILTER_LABEL: Record<UnpaidFilter, string> = {
  has_debt: '未納金：あり',
  no_debt: '未納金：なし',
};
```

> **Note**: `BlacklistRegistrationSource` is used for the `reason` column in the list table and the `登録理由` filter Select.  
> `BlacklistManualReason` is used for the `登録理由` field **inside the manual registration Sheet** only — it represents the operator's stated reason and is stored separately from `registrationSource`.  
> All label maps live in `src/app/(private)/members/blacklist/_constants/blacklist.constants.ts` and are import-only at the UI layer — never sent to or from the API.

### 10.2 GET response envelope

```json
{
  "blacklist": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "total_pages": 3
  }
}
```

---

## 11. Navigation

| From                | Action                     | Destination                                         |
| ------------------- | -------------------------- | --------------------------------------------------- |
| App Sidebar         | Click "ブラックリスト管理" | `/members/blacklist`                                |
| Row — 氏名 cell     | Click member name          | `/members/{memberId}`                               |
| Row — anywhere else | Click                      | `/members/blacklist/{id}` _(detail — out of scope)_ |

---

## 12. Responsive

- Minimum supported width: 768px
- Table: horizontal scroll on overflow

---

## 14. Out of Scope (this spec)

- Blacklist detail screen (`/members/blacklist/[id]`)
- Auto-registration triggered by FR-016 (system batch — no UI)
- Removal / unblacklisting (not permitted per FR-015)
- Personal information deletion block enforcement (enforced at the member detail level)

---

## 15. Open Questions

_None — all items resolved from source spec A-01.md and prototype `blacklist-list.tsx`._

---

## Handoff

> ✅ **speckit.specify complete.**
>
> To proceed, trigger the next step:
>
> ```
> speckit.clarify
> ```
>
> If there are no open questions to clarify, you may skip directly to:
>
> ```
> speckit.plan
> ```
