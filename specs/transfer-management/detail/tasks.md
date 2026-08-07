# Task List: Transfer Detail & Approval/Rejection — A-02 FR-002

**Feature Branch**: `feat/transfer-detail-approval`
**Plan**: `specs/transfer-management/detail/plan.md`
**Generated**: 2026-05-04
**Status**: Ready for implementation

---

## 実装順序の原則

```
Phase 1: バックエンド (スキーマ → モック DB → API ルート)
Phase 2: コード生成 (generate-openapi → generate-api)
Phase 3: フロントエンド (page → components → dialogs)
```

> Phase 2 が完了するまでフロントエンドで生成済み型/ファクトリーを使用できないため、**Phase 1 → 2 → 3 の順序は厳守**する。

---

## Phase 1 — バックエンド

### TASK-01: Zod スキーマ拡張

**File**: `src/app/api/_schemas/transfer.schema.ts`  
**変更種別**: 修正

- [ ] `ApprovalHistoryItemSchema` を追加する
  - フィールド: `step` (number.int), `label` (string), `store_type` (enum['from','to'].nullable()), `completed` (boolean), `completed_at` (string.nullable()), `completed_by` (string.nullable()), `is_automatic` (boolean)
  - `.openapi({ title: 'ApprovalHistoryItem' })` を付与
- [ ] `TransferDetailSchema` を追加する
  - `TransferRequestSchema.extend({})` で以下を追加: `reason` (string), `applicant_name` (string), `applicant_role` (string), `updated_at` (string ISO 8601), `approval_history` (array of ApprovalHistoryItemSchema)
  - `.openapi({ title: 'TransferDetail' })` を付与
- [ ] `GetTransferDetailResponseSchema` を追加する (`{ transfer: TransferDetailSchema }`)
- [ ] `ApproveTransferBodySchema` を追加する (`{ comment: z.string().optional() }`)
- [ ] `RejectTransferBodySchema` を追加する (`{ comment: z.string().optional() }`)
- [ ] `ApproveTransferResponseSchema` を追加する (`{ transfer: TransferDetailSchema }`)
- [ ] `RejectTransferResponseSchema` を追加する (`{ transfer: TransferDetailSchema }`)
- [ ] 上記スキーマの `z.infer` 型を export する (`TransferDetail`, `ApproveTransferBody`, `RejectTransferBody` 等)

**受け入れ条件**: `tsc --noEmit` がエラーなく通ること。

---

### TASK-02: 型定義更新

**File**: `src/types/transfer.type.ts`  
**変更種別**: 修正

- [ ] `ApprovalHistoryItem` interface（または `z.infer<typeof ApprovalHistoryItemSchema>` の re-export）を追加する
  - スキーマと二重定義にならないよう、スキーマ側の infer 型を import して re-export する方式を推奨

**受け入れ条件**: 既存の `TransferStatus` enum が壊れていないこと。

---

### TASK-03: Mock DB 拡張

**File**: `src/app/api/_mock-db.ts`  
**変更種別**: 修正

#### 3-a. 型変更

- [ ] import に `TransferDetail` を追加し、`TransferRow` の型定義を `TransferDetail` に変更する（`export type TransferRow = TransferDetail`）

#### 3-b. ヘルパー関数追加

- [ ] `buildApprovalHistory(brand: 'joyfit' | 'fit365', status: TransferStatus): ApprovalHistoryItem[]` 関数を追加する
  - JOYFIT (3ステップ): 申請, 移籍元承認 (`store_type: 'from'`), システム自動移籍実行 (`is_automatic: true`)
  - FIT365 (4ステップ): 申請, 移籍元承認 (`store_type: 'from'`), 移籍先承認 (`store_type: 'to'`), 移籍実行
  - `status` に応じて各ステップの `completed` / `completed_at` / `completed_by` を導出する（例: `pending` → step 1 のみ completed）

#### 3-c. シードデータ更新

- [ ] `TRANSFER_SEED_DATA` の全 14 レコードに以下のフィールドを追加する:
  - `reason`: 会員ごとに異なる移籍理由文字列（例: "転居のため", "通勤経路が変わったため" 等）
  - `applicant_name`: 各レコードの `member_name` と同値か申請スタッフ名（例: "田中 太郎"）
  - `applicant_role`: `'staff'` または `'manager'`（レコード番号で交互に設定）
  - `updated_at`: `applied_at` と同値か、承認済みレコードは適切な日時
  - `approval_history`: `buildApprovalHistory(brand, status)` の呼び出し結果

#### 3-d. `db.transfers` メソッド追加

- [ ] `getById(id: string): TransferRow | undefined` を実装する
- [ ] `approve(id: string, comment?: string): TransferRow | undefined` を実装する
  - `pending` → `from_store_approved` (JOYFIT / FIT365 共通)
  - FIT365 + `from_store_approved` → `approved`
  - 対応ステップの `completed: true`, `completed_at: new Date().toISOString()`, `completed_by: 'mock-user'` をセット
  - `updated_at` を現在時刻に更新
  - `completed` / `rejected` 状態のレコードは `undefined` を返す（変更不可）
- [ ] `reject(id: string, comment?: string): TransferRow | undefined` を実装する
  - 任意のアクティブステータスから `rejected` へ
  - `updated_at` を現在時刻に更新
  - 既に `completed` / `rejected` の場合は `undefined` を返す
- [ ] `DbType` に上記メソッドの型定義を追加する

**受け入れ条件**: `tsc --noEmit` がエラーなく通ること。`db.transfers.getById('TR-001')` が `approval_history` を含む TransferDetail を返すこと。

---

### TASK-04: `GET /crm/transfers/[id]` ルート新設

**File**: `src/app/api/crm/transfers/[id]/route.ts`（新規作成）  
**変更種別**: 新規

- [ ] `registerRoute` で OpenAPI ドキュメントを登録する
  - method: `'get'`
  - path: `'/crm/transfers/{id}'`
  - summary: `'Get transfer request detail'`
  - tags: `['Transfers']`
  - parameters: `[{ name: 'id', in: 'path', required: true }]`
  - responses: 200 `GetTransferDetailResponseSchema`, 404 `ErrorResponseSchema`
- [ ] `GET` handler を実装する
  - `const { id } = await params`
  - `const transfer = db.transfers.getById(id)`
  - `if (!transfer)` → `NextResponse.json({ error: 'Transfer not found' }, { status: 404 })`
  - `return NextResponse.json({ transfer }, { status: 200 })`

**受け入れ条件**: `GET /api/crm/transfers/TR-001` が `approval_history` を含む JSON を返すこと。`GET /api/crm/transfers/TR-999` が 404 を返すこと。

---

### TASK-05: `PATCH /crm/transfers/[id]/approve` ルート新設

**File**: `src/app/api/crm/transfers/[id]/approve/route.ts`（新規作成）  
**変更種別**: 新規

- [ ] `registerRoute` で OpenAPI ドキュメントを登録する
  - method: `'patch'`
  - path: `'/crm/transfers/{id}/approve'`
  - summary: `'Approve transfer request'`
  - tags: `['Transfers']`
  - parameters: `[{ name: 'id', in: 'path', required: true }]`
  - requestBody: `{ schema: ApproveTransferBodySchema }`
  - responses: 200 `ApproveTransferResponseSchema`, 400 `ErrorResponseSchema`, 403 `ErrorResponseSchema`, 404 `ErrorResponseSchema`
- [ ] `PATCH` handler を実装する
  - body を `try/catch` で読み取り（空の場合 `{}` でフォールバック）
  - `ApproveTransferBodySchema.safeParse(body)` でバリデーション → 失敗時 400
  - `db.transfers.getById(id)` → 未存在時 404
  - `['completed', 'rejected'].includes(transfer.status)` → 400（無効な状態遷移）
  - `db.transfers.approve(id, validated.data.comment)` → `updated` が undefined なら 400
  - `return NextResponse.json({ transfer: updated }, { status: 200 })`

**受け入れ条件**: `PATCH /api/crm/transfers/TR-001/approve` が更新済み TransferDetail を返すこと。TR-001 の status が `from_store_approved` に変わること。

---

### TASK-06: `PATCH /crm/transfers/[id]/reject` ルート新設

**File**: `src/app/api/crm/transfers/[id]/reject/route.ts`（新規作成）  
**変更種別**: 新規

- [ ] `registerRoute` で OpenAPI ドキュメントを登録する（TASK-05 と対称、path は `…/reject`）
  - requestBody: `{ schema: RejectTransferBodySchema }`
  - responses: 200 `RejectTransferResponseSchema`, 400, 403, 404
- [ ] `PATCH` handler を実装する（TASK-05 と同構造）
  - `db.transfers.reject(id, validated.data.comment)` を呼び出す
  - 状態ガード: `['completed', 'rejected'].includes(transfer.status)` → 400

**受け入れ条件**: `PATCH /api/crm/transfers/TR-001/reject` が `status: 'rejected'` の TransferDetail を返すこと。

---

### TASK-07: OpenAPI ルート登録

**File**: `src/app/api/_routes/index.ts`  
**変更種別**: 修正

- [ ] 以下の3行を既存の `transfers` インポート行の直下に追加する:
  ```ts
  import '@/app/api/crm/transfers/[id]/approve/route';
  import '@/app/api/crm/transfers/[id]/reject/route';
  import '@/app/api/crm/transfers/[id]/route';
  ```

**受け入れ条件**: `npm run generate-openapi` がエラーなく完了し、`openapi.json` に 3つの新規エンドポイントが追加されること。

---

## Phase 2 — コード生成

### TASK-08: OpenAPI / クライアント再生成

- [ ] `npm run generate-openapi` を実行する
- [ ] `npm run generate-api` を実行する
- [ ] `src/lib/api/types.gen.ts` に `TransferDetail`, `ApprovalHistoryItem`, `ApproveTransferBody`, `RejectTransferBody` が生成されていることを確認する
- [ ] `src/lib/api/@tanstack/react-query.gen.ts` に `getTransferDetail`（GET）, `approveTransfer`（PATCH）, `rejectTransfer`（PATCH）に対応するファクトリーが生成されていることを確認する

**受け入れ条件**: `npm run type-check` がエラーなく通ること。

---

## Phase 3 — フロントエンド

### TASK-09: `TransferStatusBadge` コンポーネント確認・準備

**File**: `src/app/(private)/members/transfers/_components/transfer-table-columns.tsx` を確認  
**変更種別**: 確認 / 必要に応じて切り出し

- [ ] 一覧画面の `StatusBadge` 実装を確認し、詳細画面からも再利用できるか判断する
- [ ] 再利用できない場合: `src/app/(private)/members/transfers/_components/transfer-status-badge.tsx` として切り出す
  - 各ステータスの Badge クラスマッピング（spec §UI Reference の Status Badge Colour Mapping）を実装する
  - `completed` は `<Badge variant="secondary">`（ドットなし）、他は `variant="outline"` + 色クラス

**受け入れ条件**: 詳細ページから `<TransferStatusBadge status={transfer.status} />` で呼び出せること。

---

### TASK-10: `transfer-detail-info.tsx` — 移籍情報カード

**File**: `src/app/(private)/members/transfers/[id]/_components/transfer-detail-info.tsx`（新規）  
**変更種別**: 新規

- [ ] `'use client'` ディレクティブを付与する
- [ ] Props 型: `{ transfer: TransferDetail }` を定義する
- [ ] `<Card>` + `<CardHeader><CardTitle>移籍情報</CardTitle></CardHeader>` + `<CardContent>` で構成する
- [ ] 2カラムグリッド (`grid grid-cols-2 gap-x-8 gap-y-4`) でフィールドを表示する
  - 各フィールドを `<div><p className="text-xs text-muted-foreground">ラベル</p><p>値</p></div>` パターンで表示する
- [ ] `reason` は `col-span-2` にする
- [ ] `member_name` は `<Link href={navigate(\`/members/${transfer.member_id}\`)}>` でリンク付きにする
- [ ] `brand` は `<Badge variant="outline">` + brand 別クラス (`joyfit`: info 系, `fit365`: warning 系) で表示する
- [ ] `scheduled_date`, `applied_at` は `format(parseISO(dateStr), 'yyyy/MM/dd HH:mm', { timeZone: 'Asia/Tokyo' })` でフォーマットする
- [ ] `applicant_name` + `（${applicant_role}）` を "申請者" フィールドにまとめて表示する

**受け入れ条件**: TR-001 の詳細で全フィールドが表示され、会員名がリンクになっていること。

---

### TASK-11: `transfer-approval-flow.tsx` — 承認フロー Timeline カード

**File**: `src/app/(private)/members/transfers/[id]/_components/transfer-approval-flow.tsx`（新規）  
**変更種別**: 新規

- [ ] `'use client'` ディレクティブを付与する
- [ ] Props 型: `{ transfer: TransferDetail }` を定義する
- [ ] `<Card>` + ヘッダーを構成する
  - `<CardTitle>承認フロー</CardTitle>` + ブランドバッジ（JOYFIT: "自動移籍" / FIT365: "手動移籍（2段階承認）"）
- [ ] ブランドノート (`info box`) を `<div className="rounded-md bg-info/10 border border-info/20 p-3 text-xs text-info">` で表示する
  - JOYFIT: "移籍元店舗が承認後、システムが自動で移籍を実行します。"
  - FIT365: "移籍元と移籍先の両店舗による2段階の承認が必要です。"
- [ ] `transfer.approval_history` をループして縦型 Timeline を描画する
  - 各ステップ: アイコン + ラベル + `store_type` バッジ + 完了情報
  - アイコン選択ロジック:
    - `completed === true` → `<CheckCircle2 className="text-success" />`
    - `is_automatic === true` かつ未完了 → `<Bot className="text-info" />`
    - 未完了 → `<Clock className="text-muted-foreground" />`
  - `store_type === 'from'` → `<Badge variant="outline" className="text-xs">移籍元</Badge>`
  - `store_type === 'to'` → `<Badge variant="outline" className="text-xs">移籍先</Badge>`
  - `completed_at` がある場合 → `<span className="text-xs text-muted-foreground">{format(…)} {completed_by}</span>` を表示する
- [ ] ステップ間を縦線 (`border-l-2 border-muted ml-3`) で接続する

**受け入れ条件**: JOYFIT の TR-001 で 3ステップ、FIT365 の TR-002 で 4ステップが表示されること。完了ステップに緑アイコン、未完了ステップにグレーアイコンが表示されること。

---

### TASK-12: `transfer-approve-dialog.tsx` — 承認 AlertDialog

**File**: `src/app/(private)/members/transfers/[id]/_components/transfer-approve-dialog.tsx`（新規）  
**変更種別**: 新規

- [ ] `'use client'` ディレクティブを付与する
- [ ] Props 型を定義する:
  ```ts
  { open: boolean; onOpenChange: (open: boolean) => void; transfer: TransferDetail }
  ```
- [ ] `useForm<{ comment?: string }>({ resolver: zodResolver(ApproveTransferBodySchema) })` を設定する
- [ ] `useMutation` で PATCH `…/approve` を呼び出すミューテーションを設定する（生成済みファクトリー使用）
  - `onSuccess`: `toast.success('移籍申請を承認しました')` → `router.push(navigate('/members/transfers'))` → `queryClient.invalidateQueries()`
  - `onError`: `toast.error('承認処理に失敗しました')` → `onOpenChange(false)`
- [ ] `<AlertDialog open={open} onOpenChange={onOpenChange}>` で構成する
- [ ] `<AlertDialogContent>` に以下を含める:
  - `<AlertDialogTitle>移籍申請を承認しますか？</AlertDialogTitle>`
  - `<AlertDialogDescription>{transfer.member_name} さんの {transfer.from_store_name} から {transfer.to_store_name} への移籍を承認します。</AlertDialogDescription>`
  - `<Textarea placeholder="承認コメントを入力してください（任意）" rows={3} {...register('comment')} />`
  - `<AlertDialogCancel>キャンセル</AlertDialogCancel>`
  - `<AlertDialogAction onClick={handleSubmit(onSubmit)} disabled={isPending}>承認する</AlertDialogAction>`（`isPending` 中はローディングスピナー表示）
- [ ] ダイアログが `onOpenChange(false)` で閉じたときに `reset()` を呼び出す

**受け入れ条件**: 承認ボタン押下 → ダイアログ表示 → 確認 → API 呼び出し → toast 表示 → 一覧ページへ遷移すること。

---

### TASK-13: `transfer-reject-dialog.tsx` — 否認 AlertDialog

**File**: `src/app/(private)/members/transfers/[id]/_components/transfer-reject-dialog.tsx`（新規）  
**変更種別**: 新規

- [ ] TASK-12 と対称構造で実装する。差分のみ:
  - `<AlertDialogTitle>移籍申請を却下しますか？</AlertDialogTitle>`
  - `<AlertDialogDescription>{transfer.member_name} さんの移籍申請を却下します。この操作は取り消せません。</AlertDialogDescription>`
  - `<Textarea placeholder="却下理由を入力してください（任意）" rows={3} />`
  - Mutation endpoint: PATCH `…/reject`（生成済みファクトリー使用）
  - `onSuccess`: `toast.success('移籍申請を却下しました')` → redirect
  - `onError`: `toast.error('却下処理に失敗しました')`
  - 実行ボタン: `variant="destructive"` ラベル `却下する`

**受け入れ条件**: 却下ボタン押下 → ダイアログ表示 → 確認 → API 呼び出し → toast 表示 → 一覧ページへ遷移すること。

---

### TASK-14: `transfer-status-action.tsx` — ステータス＋アクションカード

**File**: `src/app/(private)/members/transfers/[id]/_components/transfer-status-action.tsx`（新規）  
**変更種別**: 新規

- [ ] `'use client'` ディレクティブを付与する
- [ ] Props 型: `{ transfer: TransferDetail }` を定義する
- [ ] auth context から `{ role, store_id }` を取得する（既存の `useClientRequest` または auth util に倣う）
- [ ] `canApprove` フラグを導出する:
  ```ts
  const canApprove =
    role !== 'observer' &&
    role !== 'trainer' &&
    !['completed', 'rejected'].includes(transfer.status) &&
    (role === 'headquarter' ||
      role === 'manager' ||
      (role === 'staff' &&
        ((transfer.status === 'pending' && store_id === transfer.from_store_id) ||
          (transfer.status === 'from_store_approved' &&
            transfer.brand === 'fit365' &&
            store_id === transfer.to_store_id))));
  ```
- [ ] `approveOpen` と `rejectOpen` の `useState<boolean>` を管理する
- [ ] `<Card>` + `<CardContent>` で以下を構成する:
  - `<TransferStatusBadge status={transfer.status} />` で現在のステータスを表示する
  - 申請日: `format(parseISO(transfer.applied_at), 'yyyy/MM/dd HH:mm', { timeZone: 'Asia/Tokyo' })`
  - 最終更新日: `format(parseISO(transfer.updated_at), 'yyyy/MM/dd HH:mm', { timeZone: 'Asia/Tokyo' })`
  - FIT365 + `from_store_approved` の場合: `<p className="text-sm text-warning">移籍先店舗の承認待ちです</p>` を表示する
  - `canApprove` が true の場合のみ承認・却下ボタンを表示する:
    - 承認ボタンラベル: `transfer.status === 'from_store_approved' && transfer.brand === 'fit365'` ? `"移籍先として承認"` : `"承認"`
    - 却下ボタン: `variant="outline"` + `className="text-destructive hover:text-destructive"`
- [ ] `<TransferApproveDialog open={approveOpen} onOpenChange={setApproveOpen} transfer={transfer} />` をマウントする
- [ ] `<TransferRejectDialog open={rejectOpen} onOpenChange={setRejectOpen} transfer={transfer} />` をマウントする

**受け入れ条件**: Observer ロールではボタンが非表示になること。`pending` の JOYFIT レコードで承認ボタンのラベルが "承認" になること。FIT365 + `from_store_approved` で "移籍先として承認" になること。

---

### TASK-15: 詳細ページ本実装

**File**: `src/app/(private)/members/transfers/[id]/page.tsx`  
**変更種別**: 置換（スタブ → 本実装）

- [ ] `'use client'` ディレクティブを維持する
- [ ] `useParams<{ id: string }>()` で `id` を取得する
- [ ] `useQuery(getTransferDetailOptions({ path: { id } }))` でデータをフェッチする（生成済みファクトリー使用）
- [ ] ローディング状態: `<DataStateBoundary>` または skeleton 表示
- [ ] 404 / エラー状態:
  - `isError` かつ HTTP 404 の場合: `<p>該当の移籍申請が見つかりません。</p>` + 一覧へ戻るボタンを表示する
  - その他エラー: 汎用エラー表示
- [ ] 取得成功時のレイアウトを実装する:
  - `<BreadcrumbNav items={[{ url: '/', label: 'ホーム' }, { url: navigate('/members/transfers'), label: '移籍管理' }, { label: transfer.id }]} />`
  - Back link: `<Button variant="ghost" size="sm" asChild><Link href={navigate('/members/transfers')}><ArrowLeft />移籍管理に戻る</Link></Button>`
  - Page header: `<h1 className="text-2xl font-bold">{transfer.id} <TransferStatusBadge status={transfer.status} /></h1>`
  - 2カラムレイアウト:
    ```
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-[6] flex flex-col gap-4">
        <TransferDetailInfo transfer={transfer} />
        <TransferApprovalFlow transfer={transfer} />
      </div>
      <div className="w-full md:w-[40%] md:sticky md:top-6 self-start">
        <TransferStatusAction transfer={transfer} />
      </div>
    </div>
    ```

**受け入れ条件**: `/members/transfers/TR-001` にアクセスすると、詳細情報・承認フロー・ステータスカードが正しく表示されること。

---

## 最終確認タスク

### TASK-16: 型チェック & Lint

- [ ] `npm run type-check` がエラーなく通ること
- [ ] `npm run lint` がエラーなく通ること

### TASK-17: 動作確認チェックリスト

- [ ] `GET /api/crm/transfers/TR-001` → JOYFIT pending レコード（approval_history 3ステップ）が返る
- [ ] `GET /api/crm/transfers/TR-002` → FIT365 pending レコード（approval_history 4ステップ）が返る
- [ ] `GET /api/crm/transfers/TR-999` → 404 が返る
- [ ] `PATCH /api/crm/transfers/TR-001/approve` → status が `from_store_approved` に変わる
- [ ] `PATCH /api/crm/transfers/TR-001/reject` → status が `rejected` に変わる
- [ ] `/members/transfers/TR-001` の詳細ページが正しく表示される
- [ ] `/members/transfers/TR-002` (FIT365) で 4ステップ Timeline が表示される
- [ ] 承認ボタン → AlertDialog 表示 → 確認 → toast + 一覧リダイレクト
- [ ] 却下ボタン → AlertDialog 表示 → 確認 → toast + 一覧リダイレクト
- [ ] `completed` / `rejected` ステータスのレコード (TR-007, TR-009) でアクションボタンが非表示

---

## タスク依存関係

```
TASK-01 (スキーマ)
  └─ TASK-02 (型)
  └─ TASK-03 (モック DB)
       └─ TASK-04 (GET route)
       └─ TASK-05 (approve route)
       └─ TASK-06 (reject route)
            └─ TASK-07 (_routes/index.ts)
                 └─ TASK-08 (generate-openapi + generate-api)
                      └─ TASK-09 (StatusBadge 準備)
                      └─ TASK-10 (DetailInfo)
                      └─ TASK-11 (ApprovalFlow)
                      └─ TASK-12 (ApproveDialog)
                      └─ TASK-13 (RejectDialog)
                           └─ TASK-14 (StatusAction)
                                └─ TASK-15 (page.tsx 本実装)
                                     └─ TASK-16 (type-check + lint)
                                          └─ TASK-17 (動作確認)
```

---

## Handoff to `speckit.implement`

タスクリストが完成しました。

**次のステップ**: `@speckit.implement` — TASK-01 から順番に実装を開始してください。
