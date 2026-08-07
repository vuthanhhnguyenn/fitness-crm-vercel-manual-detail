# Technical Implementation Plan: Transfer Detail & Approval/Rejection — A-02 FR-002

**Feature Branch**: `feat/transfer-detail-approval`
**Spec**: `specs/transfer-management/detail/spec.md`
**Plan Created**: 2026-05-04
**Status**: Ready for task breakdown

---

## 1. Overview

本プランは `spec.md`（Document Version 260504_v2）の確定事項に基づき、以下を実装するための技術的な方針を定義する。

| 実装領域                   | 概要                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| **データモデル拡張**       | `TransferRow` に `reason`, `applicant_name`, `applicant_role`, `updated_at`, `approval_history` を追加 |
| **API ルート 3本新設**     | GET `/crm/transfers/[id]`, PATCH `…/approve`, PATCH `…/reject`                                         |
| **OpenAPI 再生成**         | `generate-openapi` → `generate-api`                                                                    |
| **詳細ページ実装**         | `/members/transfers/[id]/page.tsx` のスタブを本実装に置換                                              |
| **サブコンポーネント 5本** | 移籍情報カード、承認フロータイムライン、ステータスカード、承認/否認ダイアログ                          |

---

## 2. Data Model Changes

### 2-1. `src/app/api/_schemas/transfer.schema.ts` — 拡張

**追加するスキーマ**:

```
ApprovalHistoryItemSchema        // Timeline の 1ステップ
TransferDetailSchema             // TransferRequestSchema を extends し 5フィールド追加
GetTransferDetailResponseSchema  // { transfer: TransferDetail }
ApproveTransferBodySchema        // { comment?: string }
RejectTransferBodySchema         // { comment?: string }
ApproveTransferResponseSchema    // { transfer: TransferDetail }
RejectTransferResponseSchema     // { transfer: TransferDetail }
```

**`ApprovalHistoryItemSchema` フィールド**:

| フィールド     | Zod 型                              |
| -------------- | ----------------------------------- |
| `step`         | `z.number().int()`                  |
| `label`        | `z.string()`                        |
| `store_type`   | `z.enum(['from', 'to']).nullable()` |
| `completed`    | `z.boolean()`                       |
| `completed_at` | `z.string().nullable()` (ISO 8601)  |
| `completed_by` | `z.string().nullable()`             |
| `is_automatic` | `z.boolean()`                       |

**`TransferDetailSchema`**: `TransferRequestSchema` を `.extend()` して追加:

| フィールド         | Zod 型                               |
| ------------------ | ------------------------------------ |
| `reason`           | `z.string()`                         |
| `applicant_name`   | `z.string()`                         |
| `applicant_role`   | `z.string()`                         |
| `updated_at`       | `z.string()`                         |
| `approval_history` | `z.array(ApprovalHistoryItemSchema)` |

### 2-2. `src/types/transfer.type.ts` — 拡張

`ApprovalHistoryItem` interface を追加（`z.infer<typeof ApprovalHistoryItemSchema>` の export で代替可）。

### 2-3. `src/app/api/_mock-db.ts` — 拡張

1. `TransferRow` の型を `TransferDetail`（拡張後スキーマの infer 型）に変更
2. `TRANSFER_SEED_DATA` の全レコードに以下のフィールドを追加:
   - `reason`: 文字列（例: "転居のため"）
   - `applicant_name`: 会員名と同一または申請スタッフ名
   - `applicant_role`: `'staff'` または `'manager'` 等
   - `updated_at`: `applied_at` と同値か、承認時刻を模擬
   - `approval_history`: ブランド・ステータスから導出するヘルパー関数 `buildApprovalHistory(brand, status)` で生成

3. `db.transfers` に以下のメソッドを追加:

```ts
transfers: {
  _rows: TransferDetailRow[];
  getAll(): TransferDetailRow[];
  getById(id: string): TransferDetailRow | undefined;
  approve(id: string, comment?: string): TransferDetailRow | undefined;
  reject(id: string, comment?: string): TransferDetailRow | undefined;
}
```

**`approve` ロジック**:

- `pending` → `from_store_approved` (JOYFIT / FIT365 共通)
- `from_store_approved` + FIT365 → `approved`
- `approval_history` の該当ステップを `completed: true` に更新し `completed_at` / `completed_by` をセット
- `updated_at` を現在時刻に更新

**`reject` ロジック**:

- 任意ステータスから `rejected` へ
- `updated_at` を現在時刻に更新

---

## 3. API Routes

### 3-1. `GET /crm/transfers/[id]`

**File**: `src/app/api/crm/transfers/[id]/route.ts`

```
registerRoute → method: 'get', path: '/crm/transfers/{id}'
  parameters: [{ name: 'id', in: 'path', required: true }]
  responses: 200 GetTransferDetailResponse | 404 ErrorResponse

GET handler:
  const { id } = await params
  const transfer = db.transfers.getById(id)
  if (!transfer) return 404
  return NextResponse.json({ transfer }, { status: 200 })
```

### 3-2. `PATCH /crm/transfers/[id]/approve`

**File**: `src/app/api/crm/transfers/[id]/approve/route.ts`

```
registerRoute → method: 'patch', path: '/crm/transfers/{id}/approve'
  parameters: [{ name: 'id', in: 'path', required: true }]
  requestBody: ApproveTransferBodySchema
  responses: 200 ApproveTransferResponse | 400 | 403 | 404

PATCH handler:
  body = await request.json() (optional, default {})
  validated = ApproveTransferBodySchema.safeParse(body)
  if (!validated.success) → 400
  const transfer = db.transfers.getById(id)
  if (!transfer) → 404
  if (['completed', 'rejected'].includes(transfer.status)) → 400 (invalid state)
  const updated = db.transfers.approve(id, validated.data.comment)
  return NextResponse.json({ transfer: updated }, { status: 200 })
```

### 3-3. `PATCH /crm/transfers/[id]/reject`

**File**: `src/app/api/crm/transfers/[id]/reject/route.ts`

```
registerRoute → method: 'patch', path: '/crm/transfers/{id}/reject'
  同上（reject 用スキーマ）
  responses: 200 RejectTransferResponse | 400 | 403 | 404

PATCH handler:
  (approve と同様の構造)
  if (['completed', 'rejected'].includes(transfer.status)) → 400
  const updated = db.transfers.reject(id, validated.data.comment)
  return NextResponse.json({ transfer: updated }, { status: 200 })
```

### 3-4. `src/app/api/_routes/index.ts` — 3行追加

```ts
import '@/app/api/crm/transfers/[id]/approve/route';
import '@/app/api/crm/transfers/[id]/reject/route';
import '@/app/api/crm/transfers/[id]/route';
```

---

## 4. OpenAPI Regeneration

API ルート追加後に以下を順番に実行:

```bash
npm run generate-openapi  # openapi.json 再生成
npm run generate-api       # src/lib/api/types.gen.ts + react-query.gen.ts 再生成
```

生成後、`GetTransferDetailResponse`, `ApproveTransferBody`, `TransferDetail` などの型と、  
`getTransferDetailOptions()`, `approveTransferMutation()`, `rejectTransferMutation()` (等価のファクトリー) が `src/lib/api/` に追加されることを確認する。

---

## 5. Frontend Components

### 5-1. Page: `src/app/(private)/members/transfers/[id]/page.tsx`

**Role**: RSC (Server Component) — data fetch は client component に委譲するため `'use client'` で実装。

**責務**:

- `useParams<{ id: string }>()` で id 取得
- `useQuery(getTransferDetailOptions({ path: { id } }))` でデータフェッチ
- Loading / Error / Not-found の境界処理（`DataStateBoundary` コンポーネント活用）
- BreadcrumbNav + Page header (h1 + StatusBadge)
- 2カラムレイアウト: Left 60% / Right 40% sticky

**レイアウト構成**:

```
<BreadcrumbNav items={...} />
← Back link (ArrowLeft icon + "移籍管理に戻る")
<h1>{transfer.id} <StatusBadge status={transfer.status} /></h1>
<div class="flex gap-6">
  <div class="flex-[6] flex flex-col gap-4">
    <TransferDetailInfo transfer={transfer} />
    <TransferApprovalFlow transfer={transfer} />
  </div>
  <div class="flex-[4] sticky top-6 self-start">
    <TransferStatusAction transfer={transfer} />
  </div>
</div>
```

---

### 5-2. `transfer-detail-info.tsx` — 移籍情報カード

**種別**: Client Component（リンクのみなので RSC でも可だが、他と統一して `'use client'`）

**Props**: `{ transfer: TransferDetail }`

**実装ポイント**:

- `<Card>` + `<CardHeader><CardTitle>移籍情報</CardTitle></CardHeader>` + `<CardContent>`
- フィールドを 2カラムグリッド (`grid grid-cols-2 gap-4`) で表示
- `reason` は `col-span-2`
- `member_name` は `<Link href={navigate('/members/${transfer.member_id}')}>` でリンク付き
- `brand` は `<Badge variant="outline">` + brand別クラス (`bg-info/15 text-info ...` 等)
- `scheduled_date` / `applied_at` は `format(parseISO(dateStr), 'yyyy/MM/dd HH:mm', { timeZone: 'Asia/Tokyo' })`
- `applicant_name` + `(applicant_role)` を "申請者" フィールドにまとめて表示

---

### 5-3. `transfer-approval-flow.tsx` — 承認フロー Timeline カード

**種別**: Client Component

**Props**: `{ transfer: TransferDetail }`

**実装ポイント**:

- `<Card>` + ヘッダーにブランドバッジ (JOYFIT: "自動移籍" / FIT365: "手動移籍（2段階承認）")
- ブランドノート (info box): JOYFIT は自動移籍の説明文、FIT365 は2段階承認の説明文
- `transfer.approval_history` をループし縦型 Timeline を描画
- Step アイコン:
  - `completed === true` → `<CheckCircle2>` (緑系 `text-success`)
  - `is_automatic === true` かつ未完了 → `<Bot>` (info系 `text-info`)
  - それ以外未完了 → `<Clock>` (グレー `text-muted-foreground`)
- `store_type` が `'from'` / `'to'` の場合は小さいバッジ ("移籍元" / "移籍先") をステップラベル横に表示
- `completed_at` があれば完了日時を表示

---

### 5-4. `transfer-status-action.tsx` — ステータス＋アクションカード

**種別**: Client Component

**Props**: `{ transfer: TransferDetail }`

**実装ポイント**:

- `<Card>` + `<CardContent>`
- ステータス: `<StatusBadge>` (一覧画面から再利用、または inline で同等実装)
- 申請日: `format(parseISO(transfer.applied_at), 'yyyy/MM/dd HH:mm', { timeZone: 'Asia/Tokyo' })`
- 最終更新日: 同様
- FIT365 + `from_store_approved` の場合: "移籍先承認待ち" テキストを追加表示
- **アクションボタン表示条件**:
  - `role === 'observer' || role === 'trainer'` → ボタン非表示
  - `status === 'completed' || status === 'rejected'` → ボタン非表示
  - それ以外: 承認ボタン（Primary）+ 却下ボタン（`variant="outline"` + `text-destructive`）
- ボタンラベル:
  - `pending` → 承認ボタン: "承認"
  - FIT365 + `from_store_approved` → 承認ボタン: "移籍先として承認"
- ボタンクリック → 各 AlertDialog を open 状態にする (`useState` で管理)
- `<TransferApproveDialog>` と `<TransferRejectDialog>` をこのコンポーネント内でマウント

**Role 取得**: `src/utils/auth.util.ts` や既存の auth context から `role` を読み取る（既存パターンに倣う）

---

### 5-5. `transfer-approve-dialog.tsx` — 承認 AlertDialog

**種別**: Client Component

**Props**:

```ts
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: TransferDetail;
}
```

**実装ポイント**:

- `<AlertDialog>` (shadcn) を使用
- `useForm<{ comment?: string }>` + `zodResolver(ApproveTransferBodySchema)`
- Mutation: `useMutation` → `PATCH /crm/transfers/[id]/approve`
  - 生成された `approveTransfer` mutation factory を使用（generate-api 後）
  - `onSuccess`: `toast.success('移籍申請を承認しました')` + `router.push(navigate('/members/transfers'))`
  - `onError`: `toast.error('承認処理に失敗しました')` + `onOpenChange(false)`
  - `onSettled`: `queryClient.invalidateQueries` で転送一覧・詳細キャッシュを無効化
- `<Textarea>` (shadcn) placeholder: `承認コメントを入力してください（任意）` rows: 3
- キャンセルボタン + `承認する` ボタン (loading spinner 付き)

---

### 5-6. `transfer-reject-dialog.tsx` — 否認 AlertDialog

**Props / 実装ポイント**: `transfer-approve-dialog.tsx` と対称。差分のみ記載:

- タイトル: `移籍申請を却下しますか？`
- Textarea placeholder: `却下理由を入力してください（任意）`
- Mutation endpoint: `PATCH /crm/transfers/[id]/reject`
- `onSuccess`: `toast.success('移籍申請を却下しました')`
- `onError`: `toast.error('却下処理に失敗しました')`
- 実行ボタン: variant `"destructive"` ラベル `却下する`

---

## 6. Status Badge

一覧画面 (`transfer-table-columns.tsx`) で既に実装済みであれば、それを `src/app/(private)/members/transfers/_components/` から再利用するか、共通 `StatusBadge` として切り出す。

| ステータス            | CSS classes (Badge variant="outline")                             |
| --------------------- | ----------------------------------------------------------------- |
| `pending` 申請中      | `bg-info/15 text-info border-info/20` + dot `bg-info`             |
| `from_store_approved` | `bg-warning/15 text-warning border-warning/20` + dot `bg-warning` |
| `approved` 承認済     | `bg-success/15 text-success border-success/20` + dot `bg-success` |
| `rejected` 却下       | `bg-destructive/15 text-destructive border-destructive/20`        |
| `completed` 移籍完了  | `<Badge variant="secondary">` (muted, no dot)                     |

---

## 7. Data Flow

```
page.tsx
  ├─ useQuery(getTransferDetailOptions({ path: { id } }))
  │     └─ GET /api/crm/transfers/[id]
  │           └─ db.transfers.getById(id) → TransferDetail
  │
  ├─ TransferDetailInfo   (静的表示)
  ├─ TransferApprovalFlow (静的表示)
  └─ TransferStatusAction
        ├─ [承認ボタン] → TransferApproveDialog
        │     └─ useMutation → PATCH .../approve
        │           ├─ onSuccess: toast + router.push('/members/transfers')
        │           └─ onError:  toast + close dialog
        └─ [却下ボタン] → TransferRejectDialog
              └─ useMutation → PATCH .../reject
                    ├─ onSuccess: toast + router.push('/members/transfers')
                    └─ onError:  toast + close dialog
```

---

## 8. Permission / Access Control

| 条件                                 | 処理                                                                                                 |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `role === 'trainer'`                 | middleware / layout で `/403` にリダイレクト（既存 middleware に倣う）                               |
| `role === 'observer'`                | 詳細表示は可、承認/却下ボタンを非表示                                                                |
| `role === 'staff'` かつ store 不一致 | 承認ボタンを disabled にする（UI のみ — モック環境では auth context から `store_id` を取得して判定） |

**実装方針**: 既存の `src/utils/auth.util.ts` パターンを踏襲。詳細ページ内で `useAuth()` (または相当のフック) から `{ role, store_id }` を取得し、`canApprove` フラグを導出してボタンに渡す。

---

## 9. File Change Summary

| ファイル                                                                           | 変更種別 |
| ---------------------------------------------------------------------------------- | -------- |
| `src/app/api/_schemas/transfer.schema.ts`                                          | 修正     |
| `src/types/transfer.type.ts`                                                       | 修正     |
| `src/app/api/_mock-db.ts`                                                          | 修正     |
| `src/app/api/crm/transfers/[id]/route.ts`                                          | 新規     |
| `src/app/api/crm/transfers/[id]/approve/route.ts`                                  | 新規     |
| `src/app/api/crm/transfers/[id]/reject/route.ts`                                   | 新規     |
| `src/app/api/_routes/index.ts`                                                     | 修正     |
| `src/lib/api/types.gen.ts` _(generated)_                                           | 自動生成 |
| `src/lib/api/@tanstack/react-query.gen.ts` _(generated)_                           | 自動生成 |
| `src/app/(private)/members/transfers/[id]/page.tsx`                                | 置換     |
| `src/app/(private)/members/transfers/[id]/_components/transfer-detail-info.tsx`    | 新規     |
| `src/app/(private)/members/transfers/[id]/_components/transfer-approval-flow.tsx`  | 新規     |
| `src/app/(private)/members/transfers/[id]/_components/transfer-status-action.tsx`  | 新規     |
| `src/app/(private)/members/transfers/[id]/_components/transfer-approve-dialog.tsx` | 新規     |
| `src/app/(private)/members/transfers/[id]/_components/transfer-reject-dialog.tsx`  | 新規     |

---

## 10. Dependencies & Constraints

- **既存コンポーネント利用**: `<DataStateBoundary>`, `<BreadcrumbNav>`, shadcn/ui `<Card>`, `<Badge>`, `<AlertDialog>`, `<Textarea>`, `<Button>`
- **生成コード依存**: フロントエンド実装前に `generate-openapi && generate-api` を完了させ、型ファクトリーが利用可能な状態にする
- **FR-003 スコープ外**: `is_automatic: true` のステップは Timeline に表示するのみ（実行ボタンなし）
- **楽観的更新**: 任意（ロードインジケーターで代替可）
- **レスポンシブ**: `min-768px` — `flex-col` (モバイル) / `flex-row` (md 以上) で対応

---

## 11. UI Prototype Registry (updated)

| Branch                          | Screen name  | UI slug           | Cache path                                            | Spec IDs    |
| ------------------------------- | ------------ | ----------------- | ----------------------------------------------------- | ----------- |
| `feat/transfer-detail-approval` | 移籍申請詳細 | `transfer-detail` | `.cache/fitness-crm-ui/src/pages/transfer-detail.tsx` | A-02 FR-002 |

> **Note**: `git -C .cache/fitness-crm-ui show HEAD:src/pages/transfer-detail.tsx` でプロトタイプ参照可能（ファイルが存在しない場合は `transfer-detail` slug で検索）。

---

## Handoff to `speckit.tasks`

技術プランが完成しました。

**次のステップ**: `@speckit.tasks` — 本プランに基づいて、実装タスクリストを生成してください。
