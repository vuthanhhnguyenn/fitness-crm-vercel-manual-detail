# Feature Specification: Transfer Detail & Approval/Rejection — A-02 FR-002

**Feature Branch**: `feat/transfer-detail-approval`
**Base Branch**: `feat/transfer-management-list` (またはその後継ブランチ)
**Feature ID**: A-02 (FR-002)
**Created**: 2026-05-04
**Status**: Clarified
**Document Version**: 260504_v2
**Project**: Move to Happy — 会員管理基盤システム（CRM）刷新
**Brands**: JOYFIT / FIT365 (共通)

---

## Scope

本 spec は以下を対象とする：

| 対象                 | 説明                                                            |
| -------------------- | --------------------------------------------------------------- |
| **移籍詳細画面**     | `/members/transfers/[id]` の本実装（現在はスタブ）              |
| **FR-002 承認操作**  | 承認（approve）ボタンによる移籍申請の承認フロー                 |
| **FR-002 否認操作**  | 否認（reject）ボタンによる移籍申請の否認フロー                  |
| **承認フロー可視化** | ブランド別（JOYFIT 3ステップ / FIT365 4ステップ）の Timeline UI |

**Out of scope（本 spec では扱わない）**：

- FR-003 JOYFIT 自動移籍フロー（システムによる自動実行）
- 通知・メール送信
- エクスポート機能

---

## Clarified Decisions

> 全 Open Questions は 2026-05-04 に解消済み。以下、確定事項：

1. ✅ **否認コメントの必須/任意**: **任意** — コメント未入力でも却下可能（プロトタイプ準拠）
2. ✅ **FIT365「移籍先承認」操作者の特定**: **auth.store_id == transfer.to_store_id で判定** — ユーザーの所属店舗 ID と移籍先店舗 ID が一致する場合のみ移籍先承認ボタンを有効化
3. ✅ **承認/否認完了後のナビゲーション**: **一覧へリダイレクト** — 完了後は `/members/transfers` へ自動遷移
4. ✅ **`applicant_name` / `applicant_role` フィールド**: **TransferRequest スキーマに直接追加** — API レスポンスに新しい 2 フィールドを含める。mock DB でもデータを生成
5. ✅ **Route path**: `/members/transfers/[id]` — 既存のスタブと同一パス
6. ✅ **UI slug**: `transfer-detail` — `.cache/fitness-crm-ui/src/pages/transfer-detail.tsx` を参照

---

## Feature Overview

| Item           | Detail                                            |
| -------------- | ------------------------------------------------- |
| Screen name    | 移籍申請詳細                                      |
| Route          | `/members/transfers/[id]`                         |
| Nav section    | 会員管理 → 移籍（既存サイドバー項目）             |
| Back link      | 移籍管理一覧 `/members/transfers`                 |
| Access roles   | Headquarter, Manager, Staff, Observer (read-only) |
| Excluded roles | Trainer                                           |
| Approval roles | Headquarter, Manager, Staff (Observer は承認不可) |

### Purpose

移籍申請の詳細情報（申請ID、会員情報、移籍元/先店舗、理由、承認フロー状況）を一画面で確認し、承認または否認の操作を完結させる。

> **Source**: `A-02.md §FR-002` — "入力条件: 一覧から対象案件を選択し、承認/否認ボタンを押下"

---

## Business Context

### ブランド別 移籍フロー

| ブランド | 方式                  | 承認ステップ                                      |
| -------- | --------------------- | ------------------------------------------------- |
| JOYFIT   | 自動移籍              | ① 申請 → ② 移籍元承認 → ③ システム自動移籍実行    |
| FIT365   | 手動移籍（2段階承認） | ① 申請 → ② 移籍元承認 → ③ 移籍先承認 → ④ 移籍実行 |

### ステータス遷移

```
pending
  ├─ approve (移籍元スタッフ) → from_store_approved
  └─ reject                  → rejected

from_store_approved
  ├─ [JOYFIT] システム自動実行 → completed (FR-003 スコープ外)
  ├─ [FIT365] approve (移籍先スタッフ) → approved → completed
  └─ reject                          → rejected
```

---

## User Scenarios & Acceptance Criteria

### Story 1 — 詳細情報の表示 (Priority: P1)

**As** a Headquarter user,  
**I need** to view the full details of a transfer request,  
**So that** I can understand the context before approving or rejecting.

**Acceptance Criteria**:

1. **Given** a user navigates to `/members/transfers/[id]`,  
   **Then** the page renders with:
   - Page header: 申請ID (`TR-001` 形式) + ステータスバッジ
   - Back link: "移籍管理に戻る" → `/members/transfers`
   - Left column (60%): 移籍情報カード + 承認フローカード
   - Right column (40%, sticky): ステータスカード（アクションボタン統合）

2. **Given** a transfer record is fetched from the API,  
   **Then** the 移籍情報カード displays the following fields in a 2-column grid:

   | Field                               | Label                                               |
   | ----------------------------------- | --------------------------------------------------- |
   | `id`                                | 申請ID                                              |
   | `member_name`                       | 会員名（A-01-01 詳細へのリンク付き）                |
   | `from_store_name`                   | 移籍元店舗                                          |
   | `to_store_name`                     | 移籍先店舗                                          |
   | `reason`                            | 移籍理由（col-span-2）                              |
   | `scheduled_date`                    | 移籍希望日                                          |
   | `brand`                             | ブランド（`<BrandBadge>` または等価コンポーネント） |
   | `applicant_name` + `applicant_role` | 申請者（Clarified: Q4 — API スキーマに追加）        |
   | `applied_at`                        | 申請日時                                            |

3. **Given** the API returns a 404 for an unknown `id`,  
   **Then** an error state メッセージ `該当の移籍申請が見つかりません。` と一覧へ戻るボタンを表示する。

4. **Given** a transfer has status `completed` or `rejected`,  
   **Then** 承認/否認ボタンは表示しない（ステータスカードはアクションなし表示）。

---

### Story 2 — 承認フロー Timeline の表示 (Priority: P1)

**As** a Staff user,  
**I need** to see the current step in the approval flow,  
**So that** I know which action is required next.

**Acceptance Criteria**:

1. **Given** the transfer brand is `JOYFIT`,  
   **Then** the 承認フローカードは 3ステップの Timeline を表示する：
   - Step 1: 申請（completed）
   - Step 2: 移籍元承認（completed または pending）
   - Step 3: システム自動移籍実行（`isAutomatic: true`、Bot アイコン）

2. **Given** the transfer brand is `FIT365`,  
   **Then** the 承認フローカードは 4ステップの Timeline を表示する：
   - Step 1: 申請
   - Step 2: 移籍元承認（`storeType: "from"` バッジ付き）
   - Step 3: 移籍先承認（`storeType: "to"` バッジ付き）
   - Step 4: 移籍実行

3. **Given** a step is `completed`,  
   **Then** その step のアイコンは `Check`（緑系）、未完了は `Clock`（グレー）、自動実行は `Bot`（info 系）で表示する。

4. **Given** the 承認フローカードのヘッダー,  
   **Then** JOYFIT には `自動移籍` バッジ、FIT365 には `手動移籍（2段階承認）` バッジを表示する。

---

### Story 3 — 承認操作 (Priority: P1)

**As** a Manager or Staff user,  
**I need** to approve a pending transfer request,  
**So that** the transfer process can proceed to the next stage.

**Acceptance Criteria**:

1. **Given** transfer status is `pending` または `from_store_approved`（かつユーザーロールが Headquarter/Manager/Staff）,  
   **Then** ステータスカードに 承認ボタンと否認ボタンを表示する。
   - `pending` の場合: ボタンラベル `承認`
   - FIT365 + `from_store_approved` の場合: ボタンラベル `移籍先として承認`

2. **Given** the user clicks 承認ボタン,  
   **Then** `<AlertDialog>` を表示する：
   - タイトル: `移籍申請を承認しますか？`
   - Description: `{member_name} さんの {from_store_name} から {to_store_name} への移籍を承認します。`
   - 任意コメント入力 `<Textarea>` (placeholder: `承認コメントを入力してください（任意）`, rows: 3)
   - キャンセルボタン + `承認する` ボタン

3. **Given** the user confirms 承認,  
   **Then** `PATCH /crm/transfers/[id]/approve` を呼び出す（body: `{ comment?: string }`）。

4. **Given** the API responds with 200,  
   **Then** `toast.success('移籍申請を承認しました')` を表示し、`/members/transfers` へリダイレクトする（Clarified: Q3）。

5. **Given** the API responds with an error,  
   **Then** `toast.error('承認処理に失敗しました')` を表示し、AlertDialog を閉じる。

---

### Story 4 — 否認操作 (Priority: P1)

**As** a Manager or Staff user,  
**I need** to reject a pending transfer request,  
**So that** the transfer is cancelled and the applicant is notified.

**Acceptance Criteria**:

1. **Given** the user clicks 否認ボタン（ラベル: `却下`）,  
   **Then** `<AlertDialog>` を表示する：
   - タイトル: `移籍申請を却下しますか？`
   - Description: `{member_name} さんの移籍申請を却下します。この操作は取り消せません。`
   - 任意コメント入力 `<Textarea>` (placeholder: `却下理由を入力してください（任意）`, rows: 3)
   - キャンセルボタン + `却下する` ボタン（destructive variant）

2. **Given** the user confirms 却下,  
   **Then** `PATCH /crm/transfers/[id]/reject` を呼び出す（body: `{ comment?: string }`）。

3. **Given** the API responds with 200,  
   **Then** `toast.success('移籍申請を却下しました')` を表示し、`/members/transfers` へリダイレクトする（Clarified: Q3）。

4. **Given** the API responds with an error,  
   **Then** `toast.error('却下処理に失敗しました')` を表示し、AlertDialog を閉じる。

---

### Story 5 — 権限制御 (Priority: P1)

**Acceptance Criteria**:

1. **Given** an Observer user visits the detail page,  
   **Then** 承認/否認ボタンは表示しない（read-only）。

2. **Given** a Trainer user navigates to `/members/transfers/[id]`,  
   **Then** `/403` にリダイレクトする。

3. **Given** a Staff user is viewing a transfer,  
   **Then** 承認ボタンは自分の所属店舗が `from_store_id`（pending 時）または `to_store_id`（FIT365 の `from_store_approved` 時）と一致する場合のみ有効にする（Clarified: Q2 — auth.store_id == transfer.to_store_id で判定）。

---

## UI Reference

- **Prototype file**: `src/pages/transfer-detail.tsx` in `fitness-crm-ui` repo
- **Cache path**: `.cache/fitness-crm-ui/`
- **UI slug**: `transfer-detail`

### Layout Description (from prototype)

```
<AppSidebar>  (shared)
<SidebarInset>
  <AppHeader>  (shared)
  <main class="p-6 bg-muted/40">
    ┌── Back Link ──────────────────────────────────────┐
    │  ← 移籍管理に戻る                                   │
    └───────────────────────────────────────────────────┘
    ┌── Page Header ─────────────────────────────────────┐
    │  h1: TR-001   [ステータスバッジ]                     │
    └───────────────────────────────────────────────────┘
    ┌── 2-column layout (flex gap-4) ───────────────────┐
    │  Left (60%):                                       │
    │  ┌─ Card: 移籍情報 ─────────────────────────────┐  │
    │  │  申請ID / 会員名(link) / 移籍元 / 移籍先      │  │
    │  │  理由 / 移籍希望日 / ブランド / 申請者 / 日時  │  │
    │  └──────────────────────────────────────────────┘  │
    │  ┌─ Card: 承認フロー ───────────────────────────┐  │
    │  │  Header: "承認フロー" + ブランドバッジ         │  │
    │  │  Brand note (info box)                        │  │
    │  │  Timeline steps (vertical)                    │  │
    │  └──────────────────────────────────────────────┘  │
    │                                                    │
    │  Right (40%, sticky top-6):                        │
    │  ┌─ StatusCard (action integrated) ─────────────┐  │
    │  │  ステータス表示                                │  │
    │  │  申請日 / 最終更新日 / (FIT365 承認待ち情報)    │  │
    │  │  [承認ボタン]                                  │  │
    │  │  [却下ボタン (outline + destructive text)]     │  │
    │  └──────────────────────────────────────────────┘  │
    └───────────────────────────────────────────────────┘
  </main>
</SidebarInset>
```

### Status Badge Colour Mapping

同一仕様を一覧画面（FR-001 spec）から引き継ぐ：

| ステータス | Variant   | CSS classes                                                                       |
| ---------- | --------- | --------------------------------------------------------------------------------- |
| 申請中     | outline   | `bg-info/15 text-info border-info/20` + dot `bg-info`                             |
| 店舗承認済 | outline   | `bg-warning/15 text-warning border-warning/20` + dot `bg-warning`                 |
| 承認済     | outline   | `bg-success/15 text-success border-success/20` + dot `bg-success`                 |
| 却下       | outline   | `bg-destructive/15 text-destructive border-destructive/20` + dot `bg-destructive` |
| 移籍完了   | secondary | (muted, no dot)                                                                   |

### Prototype Notes

- **BrandBadge**: `fitness-crm-ui` の `<BrandBadge>` は本 repo の `<Badge variant="outline">` + brand-specific className で代替する
- **StatusCard**: `fitness-crm-ui` の `<StatusCard>` コンポーネントは本 repo には存在しない。右カラムを `<Card>` + `<CardContent>` で構築し、同等レイアウトを再現する
- **RoleGatedButton**: 本 repo 独自のロール制御は `auth context` から role を読み取り、承認/否認ボタンの表示制御に `conditional render` を使用する
- **BackLink + PageHeader**: 本 repo の `<BreadcrumbNav>` + `<h1>` で対応。プロトタイプの `<PageHeader>` / `<BackLink>` は UI slug 専用コンポーネント

---

## Data Model

### TransferDetail（APIレスポンス拡張）

既存の `TransferRequest` に以下のフィールドを追加する（Clarified: Q4）：

| Field              | Type                    | Description                         |
| ------------------ | ----------------------- | ----------------------------------- |
| `reason`           | `string`                | 移籍理由                            |
| `applicant_name`   | `string`                | 申請者氏名（Clarified: Q4）         |
| `applicant_role`   | `string`                | 申請者ロール（Clarified: Q4）       |
| `updated_at`       | `string` (ISO 8601)     | 最終更新日時                        |
| `approval_history` | `ApprovalHistoryItem[]` | 承認ステップ履歴（Timeline 表示用） |

### ApprovalHistoryItem

| Field          | Type                        | Description                        |
| -------------- | --------------------------- | ---------------------------------- |
| `step`         | `number`                    | ステップ番号（1始まり）            |
| `label`        | `string`                    | ステップラベル（例: `移籍元承認`） |
| `store_type`   | `"from" \| "to" \| null`    | 店舗種別                           |
| `completed`    | `boolean`                   | 完了済みかどうか                   |
| `completed_at` | `string \| null` (ISO 8601) | 完了日時                           |
| `completed_by` | `string \| null`            | 完了者氏名                         |
| `is_automatic` | `boolean`                   | システム自動実行ステップか         |

### ApproveTransferBody

```ts
{
  comment?: string  // 承認コメント（任意）
}
```

### RejectTransferBody

```ts
{
  comment?: string  // 却下理由（任意）
}
```

---

## API Design

### GET /crm/transfers/[id]

**Purpose**: 単一移籍申請の詳細取得

**Response** (200):

```json
{
  "transfer": TransferDetail
}
```

**Error responses**:

- `404`: 申請IDが存在しない場合
- `403`: アクセス権限がない場合

---

### PATCH /crm/transfers/[id]/approve

**Purpose**: 移籍申請の承認

**Request body**:

```json
{
  "comment": "string (optional)"
}
```

**Response** (200):

```json
{
  "transfer": TransferDetail  // updated record
}
```

**Error responses**:

- `400`: 既に承認済み/否認済み（無効な状態遷移）
- `403`: 承認権限がないロール（Observer, Trainer）
- `404`: 申請IDが存在しない

---

### PATCH /crm/transfers/[id]/reject

**Purpose**: 移籍申請の否認（却下）

**Request body**:

```json
{
  "comment": "string (optional)"
}
```

**Response** (200):

```json
{
  "transfer": TransferDetail  // updated record with status=rejected
}
```

**Error responses**:

- `400`: 既に完了済み/否認済み（無効な状態遷移）
- `403`: 承認権限がないロール
- `404`: 申請IDが存在しない

---

## File & Directory Plan

```
src/
├── types/
│   └── transfer.type.ts             # ApprovalHistoryItem 追加 (修正)
│
├── app/
│   ├── api/
│   │   ├── _schemas/
│   │   │   └── transfer.schema.ts   # TransferDetail, ApproveBody, RejectBody スキーマ追加 (修正)
│   │   ├── _mock-db.ts              # TransferDetail 拡張データ追加 (修正)
│   │   └── crm/
│   │       └── transfers/
│   │           ├── route.ts         # 既存 (修正不要)
│   │           └── [id]/
│   │               ├── route.ts     # NEW: GET /crm/transfers/[id]
│   │               ├── approve/
│   │               │   └── route.ts # NEW: PATCH /crm/transfers/[id]/approve
│   │               └── reject/
│   │                   └── route.ts # NEW: PATCH /crm/transfers/[id]/reject
│   │
│   └── (private)/
│       └── members/
│           └── transfers/
│               └── [id]/
│                   ├── page.tsx                    # REPLACE stub → full implementation
│                   └── _components/
│                       ├── transfer-detail-info.tsx     # NEW: 移籍情報カード
│                       ├── transfer-approval-flow.tsx   # NEW: 承認フロー Timeline カード
│                       ├── transfer-status-action.tsx   # NEW: ステータス + アクションカード
│                       ├── transfer-approve-dialog.tsx  # NEW: 承認 AlertDialog
│                       └── transfer-reject-dialog.tsx   # NEW: 否認 AlertDialog
```

---

## Constraints & Rules

- FR-003（JOYFIT 自動移籍システム実行）は本 spec のスコープ外。`is_automatic: true` のステップは UI 上に Timeline として表示するのみ（実行ボタンなし）。
- フォームは `react-hook-form` + Zod を使用（コメント textarea も含む）。
- 全データフェッチは生成済み React Query option-factories 経由。raw `fetch` は component 内に書かない。
- 承認/否認後の状態更新: React Query `invalidateQueries` で再フェッチ（楽観的更新は任意）。
- ステータスカードのアクションボタンは `role` が `Observer` または `Trainer` のとき非表示にする。
- レスポンシブ対応: min-768px（プロトタイプに準拠）。
- `cn()` ユーティリティ + CSS 変数ベースの色指定（raw hex/hsl 禁止）。
- 日付表示: `format(parseISO(dateStr), 'yyyy/MM/dd HH:mm', { timeZone: 'Asia/Tokyo' })`。
- Zod スキーマが OpenAPI の単一ソース・オブ・トゥルース。新 API ルート追加後に `npm run generate-openapi && npm run generate-api` を実行する。
- 新 API ルートファイルはすべて `src/app/api/_routes/index.ts` に登録する。

---

## Permissions Matrix (from A-02.md)

| Role        | 詳細参照       | 承認・否認操作  |
| ----------- | -------------- | --------------- |
| Headquarter | ○              | ○               |
| Manager     | ○              | ○（管轄店舗分） |
| Staff       | ○              | ○（所属店舗分） |
| Observer    | ○（read-only） | ×               |
| Trainer     | ×              | ×               |

---

## Out of Scope

- FR-003: JOYFIT 自動移籍フロー（システム自動実行）
- 通知・メール送信フロー
- 移籍申請の作成/編集（A-01-01 スコープ）
- エクスポート / ダウンロード機能
- 一覧画面（FR-001）への変更

---

## UI Prototype Registry Entry

| Branch                          | Screen name  | UI slug           | Cache path                                            | Spec IDs    |
| ------------------------------- | ------------ | ----------------- | ----------------------------------------------------- | ----------- |
| `feat/transfer-detail-approval` | 移籍申請詳細 | `transfer-detail` | `.cache/fitness-crm-ui/src/pages/transfer-detail.tsx` | A-02 FR-002 |

---

## Handoff to `speckit.plan`

すべての Open Questions が解消されました（2026-05-04）。

**次のステップ**: `@speckit.plan` — 本 spec に基づいて、技術的な実装プラン（コンポーネント構造、API ルート、データフロー）を策定してください。
