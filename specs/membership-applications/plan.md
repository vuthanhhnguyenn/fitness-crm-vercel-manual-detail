# C-01 入会申請管理（一覧）— 技術計画書

> **SpecKit Step**: 3 — speckit.plan
> **ステータス**: 承認待ち
> **作成日**: 2026-05-05
> **参照スペック**: `specs/membership-applications/spec.md`
> **対象ブランチ**: `feat/update-agents`

---

## UI プロトタイプ レジストリ

| Branch               | Screen name          | UI slug                       | Cache path                                                                               | Spec IDs |
| -------------------- | -------------------- | ----------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| `feat/update-agents` | 入会申請管理（一覧） | `enrollment-application-list` | `/home/du/WorkSpace/dx-fitness/fitness-crm-ui/src/pages/enrollment-application-list.tsx` | C-01     |

---

## 1. 変更ファイルマップ

### 1-A. 削除するファイル

| ファイル                                                                                        | 理由                                                     |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `src/app/(private)/membership-applications/_components/membership-applications-overview.tsx`    | KPI コンポーネント全面置き換え                           |
| `src/app/(private)/membership-applications/_components/membership-applications-header.tsx`      | ページヘッダーをページ直書きへ統合                       |
| `src/app/(private)/membership-applications/_components/membership-applications-section.tsx`     | タブ型レイアウト廃止                                     |
| `src/app/(private)/membership-applications/_components/pending-membership-applications-tab.tsx` | 無限スクロールタブ廃止                                   |
| `src/app/(private)/membership-applications/_components/approve-application-modal.tsx`           | 一括承認モーダル廃止                                     |
| `src/app/(private)/membership-applications/_components/reject-application-modal.tsx`            | 一括却下モーダル廃止（サマリ invalidate ロジックも含む） |
| `src/app/api/crm/membership-applications/summary/route.ts`                                      | サマリ API 廃止                                          |
| `src/app/api/crm/membership-applications/bulk-approve/route.ts`                                 | 一括承認 API 廃止                                        |
| `src/app/api/crm/membership-applications/bulk-reject/route.ts`                                  | 一括却下 API 廃止                                        |

### 1-B. 更新するファイル

| ファイル                                                | 変更内容                                                                                                                                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/api/_schemas/membership-application.schema.ts` | `MembershipApplicationStatusSchema` 値の書き換え。`MembershipApplicationSchema` のフィールド更新（追加・削除）。`GetMembershipApplicationsQuerySchema` のパラメータ更新 |
| `src/app/api/crm/membership-applications/route.ts`      | GET ハンドラーを新スキーマに合わせて書き換え（フィルタリングロジック・モックデータ生成）                                                                                |
| `src/app/api/_mock-db.ts`                               | `membershipApplications._applications` シードデータを新フィールドで全面差し替え（19件、プロトタイプ準拠）                                                               |
| `src/app/api/_routes/index.ts`                          | `summary/route`・`bulk-approve/route`・`bulk-reject/route` のインポートを削除                                                                                           |
| `src/app/(private)/membership-applications/page.tsx`    | 全面書き換え。新コンポーネント群を組み立てる                                                                                                                            |

### 1-C. 新規作成するファイル

| ファイル                                                                                          | 内容                                                                            |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/app/(private)/membership-applications/_hooks/use-membership-applications-filters.ts`         | nuqs ベースのフィルター状態管理フック（`useMembersFilters` パターン準拠）       |
| `src/app/(private)/membership-applications/_contexts/membership-applications-filters-context.tsx` | フィルターコンテキスト（`MembersFiltersProvider` パターン準拠）                 |
| `src/app/(private)/membership-applications/_components/membership-applications-kpi-cards.tsx`     | KPI カード 3 種（未審査・BL要注意・未成年）                                     |
| `src/app/(private)/membership-applications/_components/membership-applications-filters.tsx`       | ツールバー＋折りたたみフィルターパネル                                          |
| `src/app/(private)/membership-applications/_components/membership-applications-table.tsx`         | `DataTable` + `TablePagination` のラッパー（行クリック・ソート state 管理）     |
| `src/app/(private)/membership-applications/_components/membership-applications-table-columns.tsx` | `ColumnDef<MembershipApplication>[]` カラム定義（`DataTableColumnHeader` 使用） |
| `src/app/(private)/membership-applications/_constants/constants.ts`                               | ステータスバッジクラス・ラベル定数                                              |

---

## 2. データモデル変更

### 2-A. `MembershipApplicationStatusSchema`（書き換え）

```ts
// Before
z.enum(['payment_failed', 'pending', 'auto_approved', 'manual_approved', 'rejected', 'cancelled']);

// After
z.enum(['未審査', '審査中', '承認済', '否認', '取り消し済']);
```

型名は `MembershipApplicationStatus` のまま。既存の `[id]` 詳細スキーマは別スキーマ（`MembershipApplicationDetails`）で独立しているため影響なし。

### 2-B. `MembershipApplicationSchema`（フィールド変更）

**追加フィールド**

| フィールド         | 型                       | 例                       |
| ------------------ | ------------------------ | ------------------------ |
| `blacklist_match`  | `z.boolean()`            | `true`                   |
| `brand_name`       | `z.string()`             | `"FIT365"`               |
| `store_name`       | `z.string()`             | `"FIT365八潮店"`         |
| `campaign`         | `z.string()`             | `"春の入会キャンペーン"` |
| `application_date` | `z.string().datetime()`  | `"2026-03-30T09:15:00Z"` |
| `start_date`       | `z.string().date()`      | `"2026-04-01"`           |
| `is_minor`         | `z.boolean().optional()` | `true`                   |
| `is_proxy`         | `z.boolean().optional()` | `false`                  |

**削除フィールド**（一覧スキーマから除去）

`applied_at`, `elapsed_time`, `risk_score`, `risk_reason`, `scheduled_start_date`, `payment_failed_deadline`, `pending_deadline`

> ⚠️ これらフィールドは詳細用スキーマ（`MembershipApplicationDetails`）には残す。

### 2-C. `GetMembershipApplicationsQuerySchema`（パラメータ変更）

**追加**

| パラメータ  | 型                                                |
| ----------- | ------------------------------------------------- |
| `brand`     | `z.string().optional()`                           |
| `store`     | `z.string().optional()`                           |
| `blacklist` | `z.enum(['all', 'match', 'no_match']).optional()` |
| `date_from` | `z.string().date().optional()`                    |
| `date_to`   | `z.string().date().optional()`                    |

**変更**

| パラメータ | Before                                                     | After                                                                 |
| ---------- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| `status`   | `MembershipApplicationStatusSchema` (旧)                   | `MembershipApplicationStatusSchema` (新 enum 値)                      |
| `sort_by`  | `z.enum(['applied_at', 'risk_score', 'pending_deadline'])` | `z.enum(['application_date']).optional().default('application_date')` |

**削除**

`risk_reason`

### 2-D. モックDBシード（`_mock-db.ts`）

プロトタイプの `APPLICATIONS` 配列（19件）を元に新フィールドに合わせたシードデータを構築する。各レコードに以下を追加:

- `blacklist_match: boolean`
- `brand_name: "FIT365" | "JOYFIT"`
- `store_name: string`
- `campaign: string`
- `application_date: string` (ISO datetime)
- `start_date: string` (date)
- `is_minor?: boolean`
- `is_proxy?: boolean`

---

## 3. コンポーネント設計

### 3-A. ページ構成（`page.tsx`）

```tsx
// src/app/(private)/membership-applications/page.tsx
'use client'

export default function MembershipApplicationsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MembershipApplicationsPageContent />
    </Suspense>
  )
}

function MembershipApplicationsPageContent() {
  const filtersHook = useMembershipApplicationsFilters()
  const { queryParams, ... } = filtersHook

  const { data, isLoading } = useQuery({
    ...getCrmMembershipApplicationsOptions({ query: queryParams })
  })

  const applications = data?.applications ?? []
  const pagination = data?.pagination

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>入会申請管理</h1>
        </div>
        <Button onClick={() => router.push('/membership-applications/new')}>
          <Plus /> 管理画面から入会登録
        </Button>
      </div>

      {/* KPI Cards */}
      <MembershipApplicationsKpiCards applications={applications} />

      {/* Table Card */}
      <Card>
        <MembershipApplicationsFiltersProvider value={filtersHook}>
          <MembershipApplicationsFilters isOpen={...} onOpenChange={...} />
        </MembershipApplicationsFiltersProvider>
        <MembershipApplicationsTable
          applications={applications}
          isLoading={isLoading}
          sortOrder={...}
          onSortToggle={...}
        />
        <TablePagination ... />
      </Card>
    </div>
  )
}
```

### 3-B. `use-membership-applications-filters.ts`

`useMembersFilters` と同パターン。`useQueryStates`（nuqs）で URL 管理。

```ts
type MembershipApplicationsFilters = {
  page: number;
  search: string;
  status: string; // 単値（members は配列だが C-01 は単値フィルター）
  brand: string;
  store: string;
  date_from: string | null;
  date_to: string | null;
  blacklist: 'all' | 'match' | 'no_match';
  sort_order: 'asc' | 'desc';
};
```

- `search`: 500ms デバウンス（`searchInput` ローカルステートで管理）
- `date_from` / `date_to`: `parseAsString` で URL 管理（`DateRange` への変換はコンポーネント側）
- フィルター変更時は `page: 1` にリセット
- `hasActiveFilters`: デフォルト値からの変化を boolean で返す
- `activeFilterCount`: アクティブフィルター数を number で返す（バッジ表示用）
- `queryParams`: `GetCrmMembershipApplicationsData['query']` 型の API クエリオブジェクトを返す

### 3-C. `membership-applications-filters-context.tsx`

`MembersFiltersProvider` と同パターン。`ReturnType<typeof useMembershipApplicationsFilters>` を型として使用。

### 3-D. `membership-applications-kpi-cards.tsx`

Props: `applications: MembershipApplication[]`

```tsx
// 受け取ったページデータから動的計算（サマリAPI不使用）
const inQueue = (a) => a.status === '未審査' || a.status === '審査中';
const pending = applications.filter(inQueue).length;
const blacklistAlert = applications.filter((a) => inQueue(a) && a.blacklist_match).length;
const minorPending = applications.filter((a) => inQueue(a) && a.is_minor).length;
```

3列グリッド（`grid-cols-3 gap-4`）。各カードは `p-4` + タイトル + 数値の2行構成。

### 3-E. `membership-applications-filters.tsx`

Props: `isFilterOpen: boolean`, `onFilterOpenChange: (open: boolean) => void`

Context から `useMembershipApplicationsFiltersContext()` でフィルター状態を取得。

**ツールバー行**:

- 検索 Input（左寄せ、最大幅 400px）
- 「詳細フィルター」ボタン（右寄せ）＋アクティブカウントバッジ

**展開時フィルター行**:

- ステータス Select（`w-[140px]`）
- ブランド Select（`w-[140px]`）
- 店舗 Select（`w-[180px]`）— stores API から動的取得（`getCrmStoresOptions` 使用）
- 申請日レンジ DateRangePicker（`src/components/ui/date-range-picker.tsx` 使用）
- BL照合 Select（`w-[170px]`）
- 「すべてクリア」Button（`variant="ghost"` 右端）

### 3-F. `membership-applications-table.tsx`

Props: `applications: MembershipApplication[]`, `isLoading: boolean`

**実装方針**:

- `DataTable` コンポーネント（`src/components/common/data-table`）を**使用する**（コードベース準拠）
- ページネーションは `TablePagination`（`src/components/common/table-pagination.tsx`）を使用
- カラム定義は `ColumnDef<MembershipApplication>[]` 型で別定義（`members-table-columns` パターン準拠）
- ソートは TanStack Table の `manualSorting: true` + `onSortingChange` で実装
  - ソート状態は `useMembershipApplicationsFilters` の `sort_order` で管理（URL 反映）
  - `DataTableColumnHeader` コンポーネントを `申請日時` 列に適用
- 行クリックは `DataTable` の `onRowClick` prop に渡す
- BL一致行のハイライトは `DataTable` の `getRowClassName` prop（または `meta` 経由）で対応

**カラム定義**（`membership-applications-table-columns.tsx` として切り出し）:

```tsx
// src/app/(private)/membership-applications/_components/membership-applications-table-columns.tsx
import type { ColumnDef } from '@tanstack/react-table'
import type { MembershipApplication } from '@/lib/api/types.gen'

export function MembershipApplicationsTableColumns(): ColumnDef<MembershipApplication>[] {
  return [
    { accessorKey: 'id',               header: '申請ID',      ... },
    { accessorKey: 'applicant_name',   header: '氏名',        ... },
    { accessorKey: 'status',           header: 'ステータス',   ... }, // Badge
    { accessorKey: 'blacklist_match',  header: 'BL照合',      ... }, // AlertTriangle Badge or —
    { accessorKey: 'brand_name',       header: 'ブランド',    ... }, // Badge outline
    { accessorKey: 'store_name',       header: '店舗',        ... },
    { accessorKey: 'plan_name',        header: 'プラン',      ... },
    { accessorKey: 'campaign',         header: 'キャンペーン', ... }, // "なし" → "—"
    {
      accessorKey: 'application_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="申請日時" />,
      ...
    },
    { accessorKey: 'start_date',       header: '利用開始日',  ... },
  ]
}
```

**`membership-applications-table.tsx` 本体**:

```tsx
// DataTable + TablePagination の組み合わせ（members/page.tsx と同パターン）
<DataTable
  columns={columns}
  data={applications}
  isLoading={isLoading}
  variant="simple"
  onRowClick={(row) => router.push(navigate('/membership-applications/[id]', row.id))}
  tableOptions={{
    manualSorting: true,
    onSortingChange: handleSortingChange,
    state: { sorting },
  }}
/>
<TablePagination
  currentPage={page}
  totalPages={totalPages}
  total={total}
  limit={limit}
  onPageChange={setCurrentPage}
  isLoading={isLoading}
  showPageNumbers={false}
/>
```

> **BL一致行ハイライトについて**: `DataTable` の `TableRow` には現状 `className` が `cursor-pointer` 固定で行単位の動的 className をサポートしていない。T-03 で `DataTable` に `getRowClassName?: (row: TData) => string | undefined` prop を追加し、`TableRow` の `className` を `cn(onRowClick ? 'cursor-pointer' : '', getRowClassName?.(row.original) ?? '')` に変更する。

### 3-G. `_constants/constants.ts`

```ts
export const APPLICATION_STATUS_BADGE_CLASSES: Record<string, string> = {
  未審査: 'bg-warning/15 text-warning border-warning/20',
  審査中: 'bg-info/15 text-info border-info/20',
  承認済: 'bg-success/15 text-success border-success/20',
  否認: 'bg-destructive/15 text-destructive border-destructive/20',
  取り消し済: 'bg-muted text-muted-foreground border-border',
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  未審査: '未審査',
  審査中: '審査中',
  承認済: '承認済',
  否認: '否認',
  取り消し済: '取り消し済',
};

export const BLACKLIST_FILTER_OPTIONS = [
  { value: 'all', label: '全申請' },
  { value: 'match', label: 'BL一致のみ' },
  { value: 'no_match', label: 'BL一致なし' },
];
```

---

## 4. API変更詳細

### 4-A. `src/app/api/_schemas/membership-application.schema.ts`

1. `MembershipApplicationStatusSchema` を新 enum 値に書き換え
2. `MembershipApplicationSchema` を新フィールド構成に書き換え（旧フィールドは削除）
3. `GetMembershipApplicationsQuerySchema` に `brand`, `store`, `blacklist`, `date_from`, `date_to` を追加。`sort_by` を変更、`risk_reason` を削除
4. `GetMembershipApplicationsSummaryResponseSchema`・`GetMembershipApplicationsSummaryQuerySchema`・`SummarySchema` を削除（サマリ API 廃止）
5. `AutoJudgeRequestSchema`・`AutoJudgeResponseSchema`・`AutoJudgeResultSchema` を削除（一括操作廃止）

### 4-B. `src/app/api/crm/membership-applications/route.ts`

- `registerRoute` の `POST` 登録（auto-judge）を削除
- GET ハンドラーのフィルタリングロジックを新スキーマに合わせて更新:
  - `status` で日本語ステータス値による絞り込み
  - `brand` / `store` によるフィルタリング追加
  - `blacklist` による `blacklist_match` フィルタリング追加
  - `date_from` / `date_to` による `application_date` 範囲フィルタリング追加
  - `sort_by: 'application_date'` のソートに変更
- `POST` ハンドラー（auto-judge）を削除

### 4-C. `src/app/api/_routes/index.ts`

以下のインポートを削除:

```ts
import '@/app/api/crm/membership-applications/bulk-approve/route';
import '@/app/api/crm/membership-applications/bulk-reject/route';
import '@/app/api/crm/membership-applications/summary/route';
```

### 4-D. `npm run generate-openapi` → `npm run generate-api`

スキーマ変更後に必ず実行して `src/lib/api/` の生成ファイルを更新する。

---

## 5. 既存詳細画面への影響

`src/app/(private)/membership-applications/[id]/` 配下のファイルは **今回の改修対象外**。

ただし、以下の点を確認・対処する:

- `[id]/page.tsx` は `getCrmMembershipApplicationsByIdOptions` を使用。これは `/crm/membership-applications/[id]` エンドポイントに依存しており、今回変更する一覧 API とは別エンドポイント → **影響なし**
- `approve-application-modal.tsx` / `reject-application-modal.tsx` を削除することで、`getCrmMembershipApplicationsSummaryQueryKey` のインポートエラーが発生しないよう、削除前にこれらのファイルを参照している箇所を全確認する → 参照は `membership-applications-section.tsx`（削除対象）のみのため問題なし

---

## 6. 処理フロー図（フロントエンド）

```
MembershipApplicationsPage
  ↓
useMembershipApplicationsFilters() → URLステート (nuqs)
  ↓
getCrmMembershipApplicationsOptions({ query: queryParams })
  ↓ useQuery
data?.applications → MembershipApplicationsKpiCards (計算のみ)
                   → MembershipApplicationsTable (表示)
data?.pagination   → TablePagination
```

---

## 7. 実装上の注意事項

1. **`DataTable` + `TablePagination` を使用する**: コードベース準拠。カラム定義は `ColumnDef<MembershipApplication>[]` として `membership-applications-table-columns.tsx` に切り出す。ソートは TanStack Table の `manualSorting` + `onSortingChange` で実装し、`DataTableColumnHeader` を `申請日時` 列に適用する（`members-table-columns` パターン準拠）。
2. **`DateRangePicker` の URL 連携**: `src/components/ui/date-range-picker.tsx` は `DateRange` 型を受け取る。nuqs では `date_from` / `date_to` を `parseAsString` で管理し、コンポーネント渡し時に `new Date(date_from)` に変換する。
3. **KPI カードの計算スコープ**: KPI は**現在取得済みページのデータ**から計算する。全件集計ではないことに注意（ページネーション時は当ページ内の件数になる）。この制約はプロトタイプと同仕様。
4. **型生成後のビルド確認**: `generate-api` 後に `npm run type-check` を実行してコンパイルエラーがないことを確認する。

---

## ハンドオフ

この計画を確認・承認後、次のステップに進んでください:

```
次のエージェント: speckit.tasks
タスク: 上記計画をもとに実装タスクを分解する
```
