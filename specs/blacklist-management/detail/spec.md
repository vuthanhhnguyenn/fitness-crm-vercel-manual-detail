# Blacklist Detail — Screen Spec

> **Spec ID**: FR-015-detail (A-01 Member Management — Blacklist Detail sub-feature)
> **Screen**: Blacklist Detail (`/members/blacklist/[id]`)
> **Status**: Draft
> **Created**: 2026-05-08
> **Source requirement**: `public/requirements/A-01.md` § FR-015, § FR-016, § FR-018
> **UI prototype**: `.cache/fitness-crm-ui/src/pages/blacklist-detail.tsx`
> **Parent spec**: `specs/blacklist-management/spec.md` (list screen)
> **Scope**: Detail screen only — read-only view of a single blacklist entry

---

## 1. Purpose

Allow Headquarter operators to inspect the full details of a single blacklist record — including
registration metadata, unpaid balance, and automatic matching conditions that were used to identify
the member at re-registration attempt time. The screen is read-only; no editing or removal is
possible (per FR-015 constraints).

---

## 2. Actors & Access Control

| Role                           | Access                       |
| ------------------------------ | ---------------------------- |
| **Headquarter**                | Full access — view detail    |
| **System**                     | Write-only (no UI)           |
| **Manager / Staff / Observer** | No access — route is HQ-only |

> Guard: route `/members/blacklist/[id]` must return 403 for any role other than Headquarter.
> Attempting to access a non-existent blacklist ID must return 404.

---

## 3. Navigation & Entry Points

| From                          | Action          | Destination               |
| ----------------------------- | --------------- | ------------------------- |
| Blacklist list                | Click any row   | `/members/blacklist/[id]` |
| Back link on this page        | Click back link | `/members/blacklist`      |
| Member name link on this page | Click name      | `/members/[memberId]`     |

The page title breadcrumb shows the **Member ID** (e.g. `USR-00123`). A back link above the title
reads **「ブラックリスト管理に戻る」**.

---

## 4. Screen Layout

```
┌─────────────────────────────────────────────────────────┐
│ ← ブラックリスト管理に戻る                               │
│                                                         │
│ USR-00123   [強制退会 badge]                            │
├──────────────────────────────┬──────────────────────────┤
│ Left column (60%)            │ Right column (40%)       │
│                              │                          │
│ Card: 登録情報               │ StatusCard (sticky)      │
│   会員ID | 氏名(link)        │  icon: ShieldBan         │
│   店舗名  | 登録理由(badge)  │  label: 強制退会 / 手動  │
│   登録日時 | 登録者          │  meta: 登録日            │
│   メモ (col-span-2)          │                          │
│                              │                          │
│ Card: 照合条件               │                          │
│   氏名＆生年月日 [一致/不一致]│                          │
│   メール      [一致/不一致]  │                          │
│   電話        [一致/不一致]  │                          │
│   住所        [一致/不一致]  │                          │
│                              │                          │
│ Card: 未納金                 │                          │
│   ¥15,400 [未収 badge]       │                          │
└──────────────────────────────┴──────────────────────────┘
```

- Minimum supported width: 768 px
- Right column is sticky (`sticky top-6`)
- Background: `bg-muted/40`; content area scrolls independently from sidebar

---

## 5. Data Model

### 5.1 BlacklistDetail (API response)

| Field                | Type                              | Notes                                                  |
| -------------------- | --------------------------------- | ------------------------------------------------------ |
| `id`                 | `string`                          | Blacklist record ID (used in URL)                      |
| `memberId`           | `string`                          | e.g. `"USR-00123"` — displayed monospace               |
| `memberName`         | `string`                          | Clickable link → member detail                         |
| `storeName`          | `string`                          | Store at time of registration                          |
| `registrationSource` | `"forced_withdrawal" \| "manual"` | Determines badge colour and StatusCard tone            |
| `unpaidAmount`       | `number`                          | JPY; 0 = no debt; >0 → destructive colour + 未収 badge |
| `registeredAt`       | `string` (ISO datetime)           | Display as `yyyy/MM/dd HH:mm` (JST)                    |
| `registeredBy`       | `string`                          | Name of staff / `"System"` for auto-registration       |
| `memo`               | `string \| null`                  | Free-text note; omit row if null                       |
| `matchConditions`    | `MatchConditions`                 | See below                                              |

### 5.2 MatchConditions

| Field              | Type      | UI label           | Description                                    |
| ------------------ | --------- | ------------------ | ---------------------------------------------- |
| `nameAndBirthdate` | `boolean` | 氏名＆生年月日一致 | True if name + DOB match another active member |
| `email`            | `boolean` | メール一致         | True if email matches another active member    |
| `phone`            | `boolean` | 電話一致           | True if phone matches another active member    |
| `address`          | `boolean` | 住所一致           | True if address matches another active member  |

> `matchConditions` represents automatic re-registration detection signals. A `true` value means
> a newly applying member's attribute matches this blacklisted person's data → flagged for HQ review.

---

## 6. Component Details

### 6.1 Page Header

- Back link: `← ブラックリスト管理に戻る` — navigates to `/members/blacklist` (preserving URL
  params via `nuqs` is not required here; a simple `router.push` suffices)
- Title: `memberId` value (e.g. `USR-00123`) in heading style
- Title badge: registration source badge (same style as list screen)
  - `強制退会` → `bg-destructive/15 text-destructive border-destructive/20` with destructive dot
  - `手動登録` → `bg-warning/15 text-warning border-warning/20` with warning dot

### 6.2 左カラム — 登録情報 Card

Grid: 2 columns, `gap-x-8 gap-y-4`

| Row | Left cell          | Right cell                   |
| --- | ------------------ | ---------------------------- |
| 1   | 会員ID (monospace) | 氏名 (Button variant="link") |
| 2   | 店舗名             | 登録理由 (Badge)             |
| 3   | 登録日時           | 登録者                       |
| 4   | メモ (col-span-2)  | —                            |

- 会員ID: `font-mono text-sm font-medium`
- 氏名: `<Button variant="link">` → navigates to `/members/{memberId}`
- 登録理由 badge: same variant/colour logic as Page Header badge (inline badge, `text-[10px]`)
- 登録日時: format `yyyy/MM/dd HH:mm` (Asia/Tokyo) using `date-fns` + `format`/`parseISO`
- メモ: `text-sm`; hidden row entirely if `memo` is `null`

### 6.3 左カラム — 照合条件 Card

Grid: 2 columns, `gap-x-8 gap-y-3`

Each condition renders as a `flex items-center justify-between` row:

```
氏名＆生年月日一致   [一致]
メール一致          [一致]
電話一致            [不一致]
住所一致            [不一致]
```

Badge styling:

- Match (`true`): `bg-destructive/15 text-destructive border-destructive/20`
- No match (`false`): `bg-muted text-muted-foreground border-border`
- Label: `"一致"` or `"不一致"`

### 6.4 左カラム — 未納金 Card

- Amount: `text-2xl font-bold`
  - `> 0`: `text-destructive` + `¥{amount.toLocaleString()}`
  - `=== 0`: `text-muted-foreground` + `¥0`
- When `> 0`: Badge `未収` with `bg-destructive/15 text-destructive border-destructive/20`

### 6.5 右カラム — StatusCard

Uses the shared `StatusCard` component from `src/components/common/status-card.tsx`.

| Prop    | Value (強制退会)               | Value (手動登録)           |
| ------- | ------------------------------ | -------------------------- |
| `tone`  | `"destructive"`                | `"warning"`                |
| `icon`  | `ShieldBan` (lucide-react)     | `ShieldBan` (lucide-react) |
| `label` | `"強制退会"`                   | `"手動登録"`               |
| `meta`  | `["登録日: yyyy/MM/dd HH:mm"]` | same format                |

---

## 7. Loading & Error States

| State           | Behaviour                                                                              |
| --------------- | -------------------------------------------------------------------------------------- |
| Loading         | Skeleton placeholders inside each card (using `DataStateBoundary` or inline skeletons) |
| 404 (not found) | Full-page error state: `"ブラックリスト登録が見つかりませんでした"`                    |
| 403 (forbidden) | Redirect to `/403`                                                                     |
| Network error   | `toast.error("データの取得に失敗しました。")` + retry button                           |

---

## 8. API Endpoint Required

| Method | Path                      | Description                        |
| ------ | ------------------------- | ---------------------------------- |
| `GET`  | `/api/crm/blacklist/{id}` | Fetch single blacklist entry by ID |

### 8.1 Response envelope

```json
{
  "id": "bl-001",
  "memberId": "USR-00123",
  "memberName": "田中 次郎",
  "storeName": "JOYFIT渋谷店",
  "registrationSource": "forced_withdrawal",
  "unpaidAmount": 15400,
  "registeredAt": "2026-01-15T10:30:00+09:00",
  "registeredBy": "System",
  "memo": "退会処理時に未納金が発生したため自動登録。",
  "matchConditions": {
    "nameAndBirthdate": true,
    "email": true,
    "phone": false,
    "address": false
  }
}
```

### 8.2 Error responses

| Status | Body                       | When                             |
| ------ | -------------------------- | -------------------------------- |
| 404    | `{ "error": "Not found" }` | No blacklist record with that ID |
| 403    | `{ "error": "Forbidden" }` | Caller is not Headquarter role   |

---

## 9. Enums & Constants

Re-use the enums already declared in the parent spec (`blacklist-management/spec.md § 10.1`):

- `BlacklistRegistrationSource` (`forced_withdrawal` | `manual`) — controls badge colour and StatusCard tone
- No new enums are required for the detail screen

Label maps live in `src/app/(private)/members/blacklist/_constants/blacklist.constants.ts` and are shared with the list screen.

---

## 10. Toasts

| Event       | Message                        | Type    |
| ----------- | ------------------------------ | ------- |
| Fetch error | `データの取得に失敗しました。` | `error` |

---

## 11. Out of Scope

- Editing any blacklist field — the record is immutable from the UI
- Removing / unblacklisting a member (not permitted per FR-015)
- Personal information deletion block (enforced at member detail level)
- Auto-registration flow (FR-016 — system batch, no UI)

---

## 12. Open Questions

_None — all items resolved from source spec A-01.md § FR-015 and prototype `blacklist-detail.tsx`._

---

## Handoff

> ✅ **speckit.specify complete** for Blacklist Detail screen.
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
