# C-01-01 Membership Application Detail — Screen Specification

> **SpecKit Step**: 2 — speckit.clarify
> **Status**: Awaiting Approval
> **Created**: 2026-05-06
> **Source spec**: `C-01.md` (fitness-crm-ui `public/requirements/C-01.md` — 260410_v2, Supplementary Section: C-01-01)
> **UI Prototype**: `enrollment-application-detail.tsx` (fitness-crm-ui)
> **Target branch**: `feat/update-agents`

---

## 1. Screen Overview

| Item          | Detail                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------- |
| Feature ID    | C-01-01                                                                                     |
| Screen name   | Membership Application Detail (入会承認詳細)                                                |
| URL           | `/membership-applications/[id]`                                                             |
| Level         | L2                                                                                          |
| Primary users | Staff (own store), Manager (managed stores), Headquarter (all stores), Observer (read-only) |

### Purpose

Display the full content of a selected application in one screen and allow staff to perform **approve**, **reject**, and **cancel** actions, and add internal memos (FR-M002, FR-M005, FR-M007, FR-M008, FR-C002).

---

## 2. Delta from Current Implementation

### 2.1 Remove (exists in current implementation, not needed in new design)

| Remove target                                          | Location                                             | Reason                                                                 |
| ------------------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Tab navigation (会員情報 / 契約情報 / 決済情報 / 履歴) | `page.tsx` + 4 tab components                        | New design uses a single-column card layout with no tabs               |
| `BasicInfoCard` component                              | `_components/basic-info-card.tsx`                    | Replaced by new `申請者情報` card pattern                              |
| `RiskDetailsSection` component                         | `_components/risk-details-section.tsx`               | Replaced by new `ブラックリスト照合結果` card (no risk score, no eKYC) |
| `MemberInfoTab` component                              | `_components/member-info-tab.tsx`                    | Content folded into new `申請者情報` card                              |
| `ContractInfoTab` component                            | `_components/contract-info-tab.tsx`                  | Content folded into new `契約情報` card                                |
| `PaymentInfoTab` component                             | `_components/payment-info-tab.tsx`                   | Content folded into new `費用・決済情報` card                          |
| `HistoryTab` component                                 | `_components/history-tab.tsx`                        | Replaced by new `対応履歴・メモ` timeline card                         |
| `EditMembershipApplicationModal`                       | `_components/edit-membership-application-modal.tsx`  | No edit action in new design                                           |
| `ApplicationDetailFooter`                              | `_components/application-detail-footer.tsx`          | Actions moved to right column status card                              |
| Export / Print / Hold dropdown                         | `page.tsx` header area                               | Not in new design                                                      |
| `risk_score`, `risk_reason`, `ekyc` fields             | Used in BasicInfoCard, RiskDetailsSection            | Replaced by `blacklist_match` boolean flag                             |
| `elapsed_time` field                                   | `history-tab.tsx`                                    | Not in new design                                                      |
| Emergency contact fields display                       | `member-info-tab.tsx`                                | Not shown in detail card of new design                                 |
| Blood type display                                     | `member-info-tab.tsx`                                | Not shown in detail card of new design                                 |
| `ApproveApplicationModal` (bulk-style)                 | `_components/approve-application-modal.tsx` (shared) | Replaced by `AlertDialog` inline confirm                               |
| `RejectApplicationModal` (shared)                      | `_components/reject-application-modal.tsx` (shared)  | Replaced by `Dialog` inline with reason select                         |
| `BreadcrumbNav` + old header layout                    | `page.tsx`                                           | Replaced by `PageHeader` with `BackLink` pattern                       |

### 2.2 Add / Change (new design requirements)

| Add / Change                              | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two-column layout (60% / 40%)             | Left: content cards; Right: sticky status + meta card                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `PageHeader` with applicant name as title | Badge showing current status; MoreHorizontal dropdown with "申請を取り消す"                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Card 1**: 申請者情報                    | Face photo placeholder + Name / Kana / DOB+age / Gender; Phone / Email / Address with individual mask toggle + bulk "個人情報を表示する" toggle                                                                                                                                                                                                                                                                                                                                           |
| **Card 2**: ブラックリスト照合結果        | If `blacklist_match=true`: destructive border/bg, `AlertTriangle` icon, list of matched conditions, link to BL entry detail; If false: `CheckCircle` + "照合済み：該当なし"                                                                                                                                                                                                                                                                                                               |
| **Card 3**: 契約情報                      | Brand (Badge), Store, Plan name, Monthly fee, Contract start date, Usage start date, Campaign (Badge, info color), Options (multiple Badges)                                                                                                                                                                                                                                                                                                                                              |
| **Card 4**: 費用・決済情報                | Fee table with brand-specific rows (JOYFIT: 入会金/登録事務手数料/日割/翌月; FIT365: カード発行料/日割/翌月) + total row; Payment method + card last4; JACCS info Alert if 口座振替                                                                                                                                                                                                                                                                                                       |
| **Card 5**: 対応履歴・メモ                | Timeline with `kind: "system"` (dot = muted) and `kind: "memo"` (dot = primary, "メモ" badge, hover delete button); Memo input Textarea + "追加" button; Note: "システム記録・操作ログは削除できません"                                                                                                                                                                                                                                                                                   |
| **Right Card 1**: ステータス              | Circular icon (status-colored), status Badge, last-updated text; Approval feedback box (承認者/承認日時) or rejection feedback box (否認者/否認日時/否認理由); Daily cancel count `N / 2` (destructive when ≥ 2, shown only when 承認済); Pre-approval checklist (BL照合完了/年齢条件/利用開始日2ヶ月以内); BL warning Alert; "承認する" / "リスクを確認して承認する" button (outline if BL match); "否認する" button (outline, destructive color) — both shown only when status = 未審査 |
| **Right Card 2**: 申請情報                | Application ID (mono), 申請日時, 申請元 (アプリ / 管理画面), 更新日時; If 管理画面: 代理申請者 + 合意日時                                                                                                                                                                                                                                                                                                                                                                                 |
| Approval `AlertDialog`                    | Shows applicant name / store / plan / total fee summary; BL warning if match; Confirm → sets status to 承認済, appends system timeline entry                                                                                                                                                                                                                                                                                                                                              |
| Rejection `Dialog`                        | Select (必須): 本人確認不備 / 年齢制限 / ブラックリスト該当 / その他; Textarea (任意) for supplement; "否認する" button disabled until reason selected; Confirm → sets status to 否認, appends system timeline entries (notification + reason)                                                                                                                                                                                                                                            |
| Cancel `AlertDialog`                      | Payment-method-specific refund notice (info for credit card, warning for 口座振替); Textarea (必須) for cancel reason; Disabled confirm until reason filled; On confirm → sets status to 取り消し済, increments daily cancel count, appends system timeline entry                                                                                                                                                                                                                         |
| Cancel error `AlertDialog`                | Blocks cancel if usage start date has passed OR daily count ≥ 2                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Minor indicator in pre-approval checklist | `AlertTriangle` + age + brand age limit; "保護者同意確認済み" Badge if `parentalConsent=true`                                                                                                                                                                                                                                                                                                                                                                                             |

---

## 3. Screen Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ [PageHeader]                                                      │
│ ← 入会申請管理に戻る                                              │
│ [Applicant Name]                    [Status Badge] [⋯ dropdown]  │
├──────────────────────────────────────────────────────────────────┤
│  Left Column (60%)                 │  Right Column (40%) sticky  │
│                                    │                             │
│  ┌──────────────────────────────┐  │  ┌─────────────────────┐   │
│  │ 申請者情報                    │  │  │ ステータス           │   │
│  │ [Photo] Name / Kana          │  │  │ [Icon circle]       │   │
│  │         DOB / Gender         │  │  │ [Status badge]      │   │
│  │ Phone  Email  [eye toggle]   │  │  │ Last updated        │   │
│  │ Address       [bulk toggle]  │  │  │ ─────────────────── │   │
│  └──────────────────────────────┘  │  │ 承認前チェック       │   │
│                                    │  │ ✓ BL照合完了        │   │
│  ┌──────────────────────────────┐  │  │ ✓/⚠ 年齢条件        │   │
│  │ ブラックリスト照合結果        │  │  │ ✓ 利用開始日         │   │
│  │ ✓ 照合済み：該当なし          │  │  │ ─────────────────── │   │
│  └──────────────────────────────┘  │  │ [承認する]          │   │
│                                    │  │ [否認する]          │   │
│  ┌──────────────────────────────┐  │  └─────────────────────┘   │
│  │ 契約情報                      │  │                             │
│  │ Brand / Store / Plan / Fee   │  │  ┌─────────────────────┐   │
│  │ Start / Usage dates          │  │  │ 申請情報             │   │
│  │ Campaign / Options           │  │  │ ID / Date / Source  │   │
│  └──────────────────────────────┘  │  │ Proxy info (if any) │   │
│                                    │  └─────────────────────┘   │
│  ┌──────────────────────────────┐  │                             │
│  │ 費用・決済情報               │  │                             │
│  │ [Fee table] Total            │  │                             │
│  │ Payment method / Card        │  │                             │
│  │ [JACCS alert if applicable]  │  │                             │
│  └──────────────────────────────┘  │                             │
│                                    │                             │
│  ┌──────────────────────────────┐  │                             │
│  │ 対応履歴・メモ               │  │                             │
│  │ Timeline (system + memo)     │  │                             │
│  │ [Memo textarea + 追加 btn]   │  │                             │
│  └──────────────────────────────┘  │                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Card Specifications

### 4.1 申請者情報 Card

| Element                   | Detail                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Card title                | `申請者情報`                                                                                                                               |
| Header right action       | Ghost button: eye icon + "個人情報を表示する" / "個人情報を隠す" (bulk toggle for all masked fields)                                       |
| Face photo                | 96×96px rounded border placeholder; `User` icon + "未設定" if no image                                                                     |
| Basic fields (2-col grid) | 氏名 (plain), フリガナ (plain), 生年月日+年齢 (e.g. "2000/01/15（26歳）"), 性別                                                            |
| Masked fields             | 電話番号, メールアドレス, 住所 (col-span-2); each has individual eye toggle button; masked value shown by default unless bulk toggle is on |
| Mask pattern              | Phone: `090-****-1234`, Email: `ta***@example.com`, Address: `東京都渋谷区****`                                                            |

### 4.2 ブラックリスト照合結果 Card

| State                          | Visual                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No match                       | `CheckCircle` (success), "照合済み：該当なし"                                                                                                                                  |
| Match (`blacklist_match=true`) | Card: `border-destructive/50 bg-destructive/10`; `AlertTriangle` (destructive); "照合済み：一致あり"; bulleted list of matched conditions; link "該当BLエントリの詳細を確認 →" |
| Unchecked / error              | "照合未完了" badge (muted)                                                                                                                                                     |

### 4.3 契約情報 Card

2-column grid layout. All `Field` components with label + value.

| Field            | Value type                                                         |
| ---------------- | ------------------------------------------------------------------ |
| ブランド         | `Badge variant="outline"`                                          |
| 入会店舗         | plain text                                                         |
| プラン名         | plain text                                                         |
| 月額料金         | `¥N,NNN` formatted                                                 |
| 契約開始日       | date string                                                        |
| 利用開始日       | date string                                                        |
| 適用キャンペーン | `Badge` with `bg-info/15 text-info border-info/20`; hidden if null |
| 選択オプション   | row of `Badge variant="outline"` per option                        |

### 4.4 費用・決済情報 Card

**Fee table** (no outer padding, integrated into Card):

| Column    | Detail                                       |
| --------- | -------------------------------------------- |
| 項目      | Fee item label                               |
| 金額      | Right-aligned `¥N,NNN`                       |
| Total row | `border-t-2 bg-muted/50`, "合計" label + sum |

**Brand-specific fee rows**:

| JOYFIT                | FIT365                |
| --------------------- | --------------------- |
| 入会金 ¥2,200         | カード発行料 ¥5,500   |
| 登録事務手数料 ¥3,300 | 初月会費（日割） ¥NNN |
| 初月会費（日割） ¥NNN | 翌月会費 ¥N,NNN       |
| 翌月会費 ¥N,NNN       |                       |

> Note: Actual amounts come from API response. The above are display examples from the prototype.

**Below table** (in `px-4 py-3` section):

- 支払方法 + カード番号 (`**** **** **** NNNN`, mono font)
- If `paymentMethod !== "クレジットカード"`: `Alert` with `border-info/50 bg-info/10`, info icon, JACCS notice text

### 4.5 対応履歴・メモ Card

**Timeline**:

| Kind     | Dot color             | Extra elements                                                                                               |
| -------- | --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `system` | `bg-muted-foreground` | None                                                                                                         |
| `memo`   | `bg-primary`          | `Badge "メモ"` outline; delete button (ghost, visible on group hover, destructive color) — memo entries only |

Each entry shows: date (xs, muted) + operator (xs, medium) + content (sm).
Vertical connector line between entries.

**Memo input area** (below Separator, `bg-muted/30 rounded-lg p-4`):

- Label: "メモを追加"
- Note: `text-[11px] text-muted-foreground` — "システム記録・操作ログは削除できません。追加したメモのみ後から削除できます。"
- `Textarea` rows=3, placeholder "メモを入力してください..."
- "追加" button (outline), right-aligned; disabled when textarea empty

### 4.6 Right Column — ステータス Card

**Top section (always visible)**:

- Circular icon div `size-20 rounded-full`, background and icon colored by status (see table below)
- `Badge variant="outline"` with status color classes
- "最終更新: YYYY/MM/DD HH:MM" (xs, muted)

**Status visuals**:

| Status     | Icon             | Icon color              | Background          |
| ---------- | ---------------- | ----------------------- | ------------------- |
| 未審査     | `Clock`          | `text-warning`          | `bg-warning/15`     |
| 審査中     | `ClipboardCheck` | `text-info`             | `bg-info/15`        |
| 承認済     | `CheckCircle`    | `text-success`          | `bg-success/15`     |
| 否認       | `XCircle`        | `text-destructive`      | `bg-destructive/15` |
| 取り消し済 | `Archive`        | `text-muted-foreground` | `bg-muted`          |

**Conditional feedback blocks** (below status badge):

- If `承認済`: `bg-success/10 rounded-md px-3 py-2` showing 承認者 + 承認日時
- If `承認済`: daily cancel count `N / 2` row (right-aligned; destructive when `≥ 2`)
- If `否認`: `bg-destructive/10 rounded-md px-3 py-2` showing 否認者 + 否認日時 + 否認理由

**Action section** (shown only when `status === "未審査"`, below Separator):

Pre-approval checklist (label "承認前チェック"):

| Check item             | Icon / Color                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ブラックリスト照合完了 | `CheckCircle` success; if match: "一致あり" destructive Badge on right                                                                                 |
| 年齢条件               | `CheckCircle` success if adult; `AlertTriangle` warning if minor, with age + brand limit; "保護者同意確認済み" success Badge if `parentalConsent=true` |
| 利用開始日: 2ヶ月以内  | `CheckCircle` success                                                                                                                                  |

BL warning Alert (shown only when `blacklist_match=true`):

- `border-destructive/50 bg-destructive/10 py-2`
- "BL一致あり。慎重に審査してください。"

Action buttons:

- **Approve**: `variant="default"` normally; `variant="outline"` when BL match; label "承認する" / "リスクを確認して承認する"; opens approval AlertDialog
- **Reject**: `variant="outline"`, text `text-destructive hover:text-destructive`; opens rejection Dialog
- Both buttons role-gated: `allowedRoles=["Headquarter", "Manager", "Staff"]`; Observer/Trainer see disabled button with tooltip

### 4.7 Right Column — 申請情報 Card

| Field      | Detail                                             |
| ---------- | -------------------------------------------------- |
| 申請ID     | mono font                                          |
| 申請日時   | datetime string                                    |
| 申請元     | "アプリ" or "管理画面"                             |
| 更新日時   | datetime string                                    |
| 代理申請者 | shown only when `applicationSource === "管理画面"` |
| 合意日時   | shown only when `applicationSource === "管理画面"` |

---

## 5. Dialog Specifications

### 5.1 Approval AlertDialog

- Trigger: "承認する" / "リスクを確認して承認する" button
- Title: "入会申請を承認しますか？"
- Description: "承認すると会員登録が完了し、契約完了通知が送信されます。"
- Summary rows: 申請者 / 店舗 / プラン / Separator / 初期費用合計
- BL warning: `Alert border-destructive/50 bg-destructive/10` shown only if `blacklist_match=true`
- Footer: `AlertDialogCancel` "キャンセル" + `AlertDialogAction` "承認する"
- On confirm:
  - Status → "承認済"
  - Record 承認者 + 承認日時
  - Prepend system timeline entry: "入会申請を承認しました。会員登録完了通知を送信しました。"
  - `toast.success(...)` (implementation detail)

### 5.2 Rejection Dialog

- Trigger: "否認する" button
- Title: "入会申請を否認"
- Fields:
  - Select (required) label "否認理由": `本人確認不備` / `年齢制限` / `ブラックリスト該当` / `その他`
  - Textarea (optional) label "補足（任意）", rows=4
- Footer: "キャンセル" (outline) + "否認する" (destructive, disabled until reason selected)
- On confirm:
  - Status → "否認"
  - Record 否認者 + 否認日時 + 否認理由
  - Prepend 2 system timeline entries:
    1. operator=System: "申請者に否認通知を送信しました。保留中の決済情報を解放しました。"
    2. operator=current user: `否認理由: {reason}[。{note}]`
  - Reset dialog state

### 5.3 Cancel AlertDialog (入会取り消し)

- Trigger: MoreHorizontal dropdown → "申請を取り消す" (shown always; disabled state controlled by pre-checks)
- Pre-check guards (checked before opening dialog):
  1. Usage start date has passed → open Cancel Error dialog ("利用開始日を過ぎた申請はキャンセルできません。")
  2. Daily cancel count `≥ 2` → open Cancel Error dialog ("当日のキャンセル操作は2回までです。")
- Title: "申請を取り消しますか？"
- Description: "取り消すと申請者に通知されます。この操作は元に戻せません。"
- Payment-method alert:
  - Credit card (`クレジットカード`): `border-info/50 bg-info/10` — "カード決済の取消処理を実行します（90日以内）。"
  - Other (口座振替): `border-warning/50 bg-warning/10` — "口座振替の返金は手動対応となります（CASHPOSTまたは振込）。"
- Textarea (required) label "取り消し理由 \*", rows=3
- Footer: `AlertDialogCancel` "キャンセル" (resets reason) + `AlertDialogAction` (destructive, disabled until reason filled) "取り消す"
- On confirm:
  - Status → "取り消し済"
  - Daily cancel count +1
  - Prepend system timeline entry with reason + refund note

### 5.4 Cancel Error AlertDialog

- Title: "キャンセルできません"
- Description: dynamic error message
- Footer: single "閉じる" action

---

## 6. API Schema — Detail Endpoint

### GET `/crm/membership-applications/[id]`

Response field additions / changes needed for new design:

| Field                  | Type                                  | Notes                                        |
| ---------------------- | ------------------------------------- | -------------------------------------------- |
| `id`                   | `string`                              | e.g. `AP-2026-0001`                          |
| `applicant_name`       | `string`                              | Full name                                    |
| `applicant_kana`       | `string`                              | Furigana                                     |
| `birth_date`           | `string (date)`                       | `YYYY/MM/DD`                                 |
| `age`                  | `number`                              | Calculated age                               |
| `gender`               | `string`                              | 男性 / 女性 / その他 / 回答しない            |
| `phone`                | `string`                              | Masked value (e.g. `090-****-1234`)          |
| `phone_real`           | `string`                              | Unmasked value                               |
| `email`                | `string`                              | Masked value                                 |
| `email_real`           | `string`                              | Unmasked value                               |
| `address`              | `string`                              | Masked value                                 |
| `address_real`         | `string`                              | Unmasked value                               |
| `blacklist_match`      | `boolean`                             | BL check result                              |
| `blacklist_conditions` | `string[]`                            | Matched conditions (empty if no match)       |
| `brand`                | `string`                              | JOYFIT / FIT365                              |
| `store_name`           | `string`                              |                                              |
| `plan_name`            | `string`                              |                                              |
| `monthly_fee`          | `number`                              |                                              |
| `start_date`           | `string (date)`                       | Contract start                               |
| `usage_start_date`     | `string (date)`                       | Usage start (within 2 months of start_date)  |
| `campaign`             | `string \| null`                      | Campaign name                                |
| `options`              | `string[]`                            | Selected options                             |
| `fee_rows`             | `{ label: string; amount: number }[]` | Brand-specific fee breakdown                 |
| `payment_method`       | `string`                              | クレジットカード / 口座振替                  |
| `card_last4`           | `string`                              | Last 4 digits or `—`                         |
| `application_date`     | `string (datetime)`                   |                                              |
| `application_source`   | `string`                              | アプリ / 管理画面                            |
| `updated_at`           | `string (datetime)`                   |                                              |
| `status`               | `ApplicationStatus`                   | 未審査 / 審査中 / 承認済 / 否認 / 取り消し済 |
| `is_minor`             | `boolean`                             | Under 18                                     |
| `parental_consent`     | `boolean`                             | Minor parental consent                       |
| `proxy_applicant`      | `string \| null`                      | Proxy staff name + ID (if 管理画面)          |
| `agreement_date`       | `string \| null`                      | Consent datetime (if 管理画面)               |
| `approved_by`          | `string \| null`                      | Staff name who approved                      |
| `approved_at`          | `string \| null`                      | Approval datetime                            |
| `rejected_by`          | `string \| null`                      | Staff name who rejected                      |
| `rejected_at`          | `string \| null`                      | Rejection datetime                           |
| `rejected_reason`      | `string \| null`                      | Rejection reason                             |
| `today_cancel_count`   | `number`                              | Daily cancel count (0–2)                     |
| `timeline`             | `TimelineEntry[]`                     | See below                                    |

**TimelineEntry type**:

```ts
type TimelineEntry = {
  id: string;
  kind: 'system' | 'memo';
  date: string; // YYYY/MM/DD HH:MM
  operator: string; // staff name or "システム"
  content: string;
};
```

### POST `/crm/membership-applications/[id]/approve`

- No request body changes needed
- Response: updated `status`, `approved_by`, `approved_at`, new timeline entry

### POST `/crm/membership-applications/[id]/reject`

Request body:

```ts
{ reason: string; note?: string }
```

### POST `/crm/membership-applications/[id]/cancel`

Request body:

```ts
{
  cancel_reason: string;
}
```

### POST `/crm/membership-applications/[id]/memo`

Request body:

```ts
{
  content: string;
}
```

Response: new `TimelineEntry` with `kind: "memo"`

### DELETE `/crm/membership-applications/[id]/memo/[memoId]`

- Deletes a `kind: "memo"` entry only; returns 403 if entry is `kind: "system"`

---

## 7. Permission Matrix

| Role        | View detail      | Approve / Reject        | Cancel      | Add memo | Delete memo |
| ----------- | ---------------- | ----------------------- | ----------- | -------- | ----------- |
| Headquarter | ✓ All stores     | ✓                       | ✓           | ✓        | ✓           |
| Manager     | ✓ Managed stores | ✓                       | ✓           | ✓        | ✓           |
| Staff       | ✓ Own store      | ✓ (depends on position) | ✓ Own store | ✓        | ✓           |
| Observer    | ✓ Own store      | ✗ (tooltip)             | ✗ (tooltip) | ✗        | ✗           |
| Trainer     | ✗                | ✗                       | ✗           | ✗        | ✗           |

> **Role gate implementation**: wrap approve/reject buttons with `RoleGatedButton` pattern (same as list page). Observer sees disabled button with `denyTooltip`.

---

## 8. State Management

All state is local React state (`useState`) for the detail page — no URL state needed for this L2 screen.

| State                                        | Type                  | Initial value                   |
| -------------------------------------------- | --------------------- | ------------------------------- |
| `currentStatus`                              | `ApplicationStatus`   | from API response               |
| `timeline`                                   | `TimelineEntry[]`     | from API response               |
| `memoText`                                   | `string`              | `""`                            |
| `allPersonalVisible`                         | `boolean`             | `false`                         |
| `approvedBy`, `approvedAt`                   | `string \| undefined` | from API response               |
| `rejectedBy`, `rejectedAt`, `rejectedReason` | `string \| undefined` | from API response               |
| `todayCancelCount`                           | `number`              | from API (`today_cancel_count`) |
| `approveDialogOpen`                          | `boolean`             | `false`                         |
| `rejectDialogOpen`                           | `boolean`             | `false`                         |
| `rejectReason`, `rejectNote`                 | `string`              | `""`                            |
| `cancelDialogOpen`                           | `boolean`             | `false`                         |
| `cancelReason`                               | `string`              | `""`                            |
| `cancelErrorOpen`                            | `boolean`             | `false`                         |
| `cancelErrorMessage`                         | `string`              | `""`                            |

---

## 9. Variants / Conditional UI

The prototype defines 6 mock variants. The production page should handle all these cases via real API data:

| Variant   | Trigger condition                       | Special UI                                                                                                              |
| --------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Default   | Normal applicant, no BL, adult          | —                                                                                                                       |
| Blacklist | `blacklist_match=true`                  | BL card destructive styling; approve button outline with risk label; BL Alert in right card                             |
| Minor     | `is_minor=true`                         | Pre-approval checklist shows `AlertTriangle` + age + brand limit; "保護者同意確認済み" badge if `parental_consent=true` |
| Proxy     | `application_source="管理画面"`         | 申請情報 card shows 代理申請者 + 合意日時                                                                               |
| JACCS     | `payment_method !== "クレジットカード"` | JACCS info Alert in 費用・決済情報 card; Warning (not info) Alert in cancel dialog                                      |
| Approved  | `status="承認済"`                       | Status card shows 承認済 visual + feedback box + daily cancel count; no action buttons                                  |

---

## 10. Component File Structure (Target)

```
src/app/(private)/membership-applications/[id]/
├── page.tsx                         # RSC shell: fetch data → pass to client component
└── _components/
    ├── membership-application-detail.tsx          # 'use client' — main layout, all state
    ├── applicant-info-card.tsx                    # 申請者情報 card + masked fields
    ├── blacklist-result-card.tsx                  # ブラックリスト照合結果 card
    ├── contract-info-card.tsx                     # 契約情報 card
    ├── fee-payment-card.tsx                       # 費用・決済情報 card + fee table
    ├── activity-timeline-card.tsx                 # 対応履歴・メモ card
    ├── status-action-card.tsx                     # Right: ステータス + action buttons
    ├── application-meta-card.tsx                  # Right: 申請情報 card
    ├── approve-dialog.tsx                         # AlertDialog for approve
    ├── reject-dialog.tsx                          # Dialog for reject
    ├── cancel-dialog.tsx                          # AlertDialog for cancel
    ├── cancel-error-dialog.tsx                    # AlertDialog for cancel block error
    └── membership-application-detail-skeleton.tsx # Loading skeleton
```

> **Note**: Files to be **deleted** from current implementation:
> `basic-info-card.tsx`, `risk-details-section.tsx`, `member-info-tab.tsx`, `contract-info-tab.tsx`, `payment-info-tab.tsx`, `history-tab.tsx`, `edit-membership-application-modal.tsx`, `application-detail-footer.tsx`, `membership-application-detail-skeleton.tsx` (rebuild).
> Shared components to delete: `_components/approve-application-modal.tsx`, `_components/reject-application-modal.tsx` (only used from this detail page).

---

## 11. UI Prototype Cross-Reference Notes

- **Prototype source**: `fitness-crm-ui/src/pages/enrollment-application-detail.tsx`
- **Spec source**: `fitness-crm-ui/public/requirements/C-01.md` (260410_v2), Supplementary Section C-01-01
- **Prototype-only additions** (not in spec, but implemented in prototype — keep as per design):
  - Personal info masking with individual + bulk toggle (FR-M002 doesn't specify masking, but prototype implements it for security)
  - Gender field (`男性 / 女性 / その他 / 回答しない`) — not in C-01 spec's personal info fields
  - Cancel reason textarea in cancel dialog — FR-M008 doesn't require reason recording, but prototype includes it
  - `kind: "memo"` deletion from timeline — aligns with 2026-04-20 FB direction ("memos can be deleted; system logs cannot")
- **Spec-defined, not yet in prototype** (Phase 2):
  - Companion (同伴者) upgrade flow: C区分→A区分 promotion check on approval (FR-M005)
  - Actual billing execution + contract completion email on approval (FR-M005)
- **Component mapping** (prototype → this repo):
  - `SharedSidebar` / `SharedHeader` → existing layout (not rendered inside page component)
  - `PageHeader` → `src/components/layout/` or inline implementation matching existing `members` page pattern
  - `BackLink` → `BreadcrumbNav` variant or `Button variant="ghost"` with `ChevronLeft`
  - `RoleGatedButton` → does not exist in this repo; implement as regular button with permission check from auth context
  - `navigate(slug)` → `router.push(path)`
  - `Label` from shadcn → `src/components/ui/label.tsx`

---

---

## 12. Open Questions — Resolved ✅

### Q1. Does `PageHeader` component exist in this repo?

**Finding**: No shared `PageHeader` component currently exists in `src/components/`. However, the UI prototype uses a `PageHeader` component defined in `fitness-crm-ui/src/components/page-header.tsx` with a clear, reusable API.

**Resolution**: **Create `src/components/common/page-header.tsx`** as a new shared component, copied directly from the prototype definition. This avoids per-page duplication and aligns all future L2 screens with the same header pattern.

**Component API** (from prototype):

```tsx
interface PageHeaderProps {
  breadcrumb?: ReactNode; // BackLink or Breadcrumb
  title: string; // Required. Page title (h1)
  badge?: ReactNode; // Status Badge etc.
  subtitle?: string; // text-xs muted, below title
  actions?: ReactNode; // Button group (right side)
  sticky?: boolean; // default true — sticky top-0
}
```

**Styling** (sticky mode):

```
sticky top-0 z-10 bg-muted/40 backdrop-blur-sm pb-3 -mx-6 px-6 pt-2 border-b mb-4
```

**BackLink**: A `<Button variant="ghost" size="sm" className="gap-1">` with `ChevronLeft` icon + label "入会申請管理に戻る", passed as `breadcrumb` prop. Navigates via `router.push('/membership-applications')` (not `router.back()`).

---

### Q2. How is role-gating implemented — `RoleGatedButton` doesn't exist in this repo?

**Finding**: This repo has no `RoleGatedButton`, no `useCurrentUser`, no `useRole`, and no auth context beyond a stubbed JWT (`sub`, `email`, `company_id`). There is no role information available client-side in the current implementation.

**Resolution**: For Phase 1 (current scope), **skip role-gating on action buttons**. Render approve / reject buttons unconditionally when `status === "未審査"`. Add a `// TODO: role gate — allowedRoles: ["Headquarter", "Manager", "Staff"]` comment. The tooltip-for-Observer pattern is deferred to Phase 2 when auth context exposes `role`.

---

### Q3. When should "申請を取り消す" be available in the MoreHorizontal dropdown?

**Finding**: FR-M008 states: "承認済みの入会申請を、利用開始日前であればキャンセルできる". Eligibility is runtime-checked (usage start date + daily count). The prototype shows the MoreHorizontal dropdown at all times and performs eligibility checks only when the item is clicked.

**Resolution**: **Always show the MoreHorizontal dropdown and "申請を取り消す" item**, regardless of current status. Eligibility guards run at click time (inside `handleCancelButtonClick`):

1. If `usage_start_date ≤ today` → open Cancel Error dialog ("利用開始日を過ぎた申請はキャンセルできません。")
2. If `todayCancelCount ≥ 2` → open Cancel Error dialog ("当日のキャンセル操作は2回までです。")
3. If status is not `承認済` (e.g. 未審査, 否認, 取り消し済) → open Cancel Error dialog ("この申請はキャンセルできません。")
4. Otherwise → open Cancel confirmation dialog

This matches the prototype's approach and avoids hiding menu items based on derived state, which can be confusing when items appear/disappear dynamically.

---

### Q4. Should approve / reject actions also appear for `審査中` status?

**Finding**: The spec (Section 4.6) says the action section shows only when `status === "未審査"`. The prototype also only shows buttons for `未審査`. There is no 審査中 action defined.

**Resolution**: Follow the spec strictly — action buttons (approve / reject) appear **only when `status === "未審査"`**. For `審査中`, no action buttons are shown (status card shows only the status visual, no checklist, no buttons). If 審査中→actions is needed in future, it will be a separate spec change.

---

### Q5. Personal info masking strategy: API-side `phone` + `phone_real` vs client-side masking?

**Finding**: The prototype defines both a masked display value (`phone`) and an unmasked real value (`phone_real`) as separate response fields — meaning unmasked PII is always sent to the client regardless of mask toggle state. This is a security anti-pattern (PII in network response even when not displayed).

**Resolution (Phase 1)**: **Keep the prototype's dual-field approach** for Phase 1 (mock-only environment — no real PII at risk). The API returns both `phone` (masked) and `phone_real` (unmasked) in `GetApplicationDetailResponse`. The client toggles display between the two values.

**Phase 2 note**: Replace with a separate `POST /crm/membership-applications/[id]/reveal-pii` endpoint that requires explicit staff action and logs the access, returning only the real values on demand. Add `// TODO Phase 2: replace dual-field pattern with reveal-pii endpoint` comment in `applicant-info-card.tsx`.

**Mask patterns** (updated from prototype):

- Phone: replace middle 4 digits → `090-****-5678`
- Email: mask local part after first 2 chars → `ta***@example.com`
- Address: mask street-level detail → `東京都渋谷区****`

---

### Q6. Memo add/delete — local React state only, or real API mutations?

**Finding**: Section 8 specifies all state as local `useState`. Section 6 defines `POST /crm/membership-applications/[id]/memo` and `DELETE /crm/membership-applications/[id]/memo/[memoId]` API endpoints. These are contradictory.

**Resolution**:

- **Phase 1 (current scope)**: Memo add and delete are **local React state only** (optimistic, no API call). The API endpoints in Section 6 are declared as future-facing schema definitions only.
- The existing `POST /crm/membership-applications/[id]/approve` and `POST /crm/membership-applications/[id]/reject` and `POST /crm/membership-applications/[id]/cancel` **do** call real API routes (existing routes) and invalidate the React Query cache.
- Remove `POST /memo` and `DELETE /memo/[memoId]` from the **implementation scope** of Phase 1. Keep them in Section 6 as schema reference for Phase 2.
- Add `// TODO Phase 2: replace with useMutation → POST /memo` comment in `activity-timeline-card.tsx`.

> **Section 6 is updated**: memo endpoints marked as Phase 2 only.

---

### Q7. `today_cancel_count` scope — per-application or per-applicant?

**Finding**: A single application transitions to `取り消し済` after one cancel, making a per-application daily count always ≤ 1. The "当日2回まで" guard from FR-M008 must therefore apply to a broader scope. The existing spec rationale (C-01.md prototype review section, FR-008) says "同一申請に対する当日の累積キャンセル操作回数" — but this is the prototype author's interpretation, not the spec. FR-M008 text says "当日実施のキャンセル回数をカウント" without specifying the subject.

**Resolution**: Interpret as **per-staff-session, cross-application** daily cancel count. A staff member can cancel at most 2 _different_ applications in a calendar day. In Phase 1 (mock), represent as a module-level or context-level counter reset on page refresh (no persistence). In Phase 2, store in backend as a staff-daily audit counter.

**Impact on API schema**: `today_cancel_count` is **removed from the per-application `GET /[id]` response**. Instead, it is provided as a separate session/context value (Phase 2: staff session API). For Phase 1, initialize from a module constant `CANCEL_COUNT_TODAY = 0` in the detail component, as the prototype does.

> **Section 6 updated**: `today_cancel_count` removed from `GET /[id]` response field table.

---

### Q8. `applied_at` vs `application_date` field name in mock DB and detail schema?

**Finding**: The mock DB (`_mock-db.ts`) uses `applied_at`. The list schema (`MembershipApplicationSchema`) uses `application_date`. The current detail schema (`GetApplicationDetailResponseSchema`) extends `MembershipApplicationSchema` which already has `application_date`, but the mock DB still uses `applied_at` internally (it maps in the route handler).

**Resolution**: The detail endpoint already maps `applied_at` → `application_date` in the route handler. No change needed for this mapping — continue the existing pattern. The new detail fields added for C-01-01 (e.g. `applicant_kana`, `birth_date`, `fee_rows`, `timeline`) use snake_case consistent with the existing schema.

---

### Q9. What happens to `_schemas/edit-membership-application-form.schema.ts` and `_schemas/reject-form.schema.ts` in `[id]/`?

**Finding**: These schema files (`[id]/_schemas/`) exist to support `EditMembershipApplicationModal` and `RejectApplicationModal`. Both modal components are being deleted.

**Resolution**:

- `[id]/_schemas/edit-membership-application-form.schema.ts` — **delete** (no longer needed; edit modal removed)
- `[id]/_schemas/reject-form.schema.ts` — **delete** and replace with inline `z.object({ reason: z.string(), note: z.string().optional() })` directly in `reject-dialog.tsx` (simple enough to not warrant a separate schema file)

---

### Q10. Are `approve-application-modal.tsx` and `reject-application-modal.tsx` safe to delete (shared components)?

**Finding**: Grep confirms these two files are only imported from `application-detail-footer.tsx`. No other page or component references them.

**Resolution**: **Safe to delete both**. Delete together with `application-detail-footer.tsx` and the `[id]/_schemas/` directory.

---

## 13. Spec Amendments from Clarification

The following spec sections are amended based on the Q&A above:

| Section | Amendment                                                                                                                                |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **2.1** | Added: `[id]/_schemas/edit-membership-application-form.schema.ts` and `[id]/_schemas/reject-form.schema.ts` to delete list (Q9)          |
| **4.6** | MoreHorizontal dropdown **always shown**; eligibility (status + date + daily count) checked at click time (Q3)                           |
| **4.6** | Approve / reject buttons shown only for `未審査` (confirmed — 審査中 gets no action buttons) (Q4)                                        |
| **4.6** | Role-gate: buttons rendered unconditionally in Phase 1; TODO comment for Phase 2 (Q2)                                                    |
| **5.3** | Cancel guard: checks status ≠ 承認済 as first condition → Cancel Error dialog (Q3)                                                       |
| **6**   | `today_cancel_count` removed from `GET /[id]` response; use module-level constant in Phase 1 (Q7)                                        |
| **6**   | `POST /memo` and `DELETE /memo/[memoId]` marked Phase 2 only (Q6)                                                                        |
| **8**   | `todayCancelCount` initialized from module constant `CANCEL_COUNT_TODAY = 0`, not from API response (Q7)                                 |
| **10**  | Added `[id]/_schemas/` directory files to delete list (Q9)                                                                               |
| **10**  | Added `src/components/common/page-header.tsx` to **new files to create** (Q1)                                                            |
| **11**  | PageHeader mapping: create new shared `src/components/common/page-header.tsx` from prototype definition (Q1)                             |
| **11**  | BackLink mapping: `Button variant="ghost"` + `ChevronLeft` + `router.push('/membership-applications')`, passed as `breadcrumb` prop (Q1) |

---

## Handoff

All open questions are resolved. Please review and approve, then proceed to:

```
Next agent: speckit.plan
Task: Create technical plan for C-01-01 detail page redesign (component breakdown, API schema changes,
mock DB seed updates, file deletions, migration path from old tab-based structure to new card layout)
```
