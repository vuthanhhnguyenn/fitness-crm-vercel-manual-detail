# C-01 入会申請管理（一覧）— 実装タスクリスト

> **SpecKit Step**: 4 — speckit.tasks
> **ステータス**: 承認待ち
> **作成日**: 2026-05-05
> **参照計画書**: `specs/membership-applications/plan.md`
> **対象ブランチ**: `feat/update-agents`

---

## タスク一覧

| #    | タスク                                             | 種別     | 依存             |
| ---- | -------------------------------------------------- | -------- | ---------------- |
| T-01 | 不要ファイルの削除（旧コンポーネント・API）        | 削除     | なし             |
| T-02 | `_routes/index.ts` の不要インポート削除            | 更新     | T-01             |
| T-03 | `DataTable` に `getRowClassName` prop を追加       | 更新     | なし             |
| T-04 | `membership-application.schema.ts` の書き換え      | 更新     | なし             |
| T-05 | `_mock-db.ts` シードデータ差し替え                 | 更新     | T-04             |
| T-06 | `membership-applications/route.ts` ハンドラー更新  | 更新     | T-04, T-05       |
| T-07 | OpenAPI・型生成の再実行                            | コマンド | T-02, T-04, T-06 |
| T-08 | `_constants/constants.ts` 作成                     | 新規     | T-07             |
| T-09 | `use-membership-applications-filters.ts` 作成      | 新規     | T-07             |
| T-10 | `membership-applications-filters-context.tsx` 作成 | 新規     | T-09             |
| T-11 | `membership-applications-kpi-cards.tsx` 作成       | 新規     | T-07, T-08       |
| T-12 | `membership-applications-table-columns.tsx` 作成   | 新規     | T-07, T-08       |
| T-13 | `membership-applications-table.tsx` 作成           | 新規     | T-03, T-12       |
| T-14 | `membership-applications-filters.tsx` 作成         | 新規     | T-10             |
| T-15 | `page.tsx` 全面書き換え                            | 更新     | T-11, T-13, T-14 |
| T-16 | 型チェック・動作確認                               | 確認     | T-15             |
| T-17 | UIスタイル照合（デザインプロトタイプとの差分確認） | 確認     | T-16             |

---

## タスク詳細

---

### T-01 — 不要ファイルの削除（旧コンポーネント・API）

**種別**: 削除  
**依存**: なし

削除するファイル（9件）:

```
src/app/(private)/membership-applications/_components/membership-applications-overview.tsx
src/app/(private)/membership-applications/_components/membership-applications-header.tsx
src/app/(private)/membership-applications/_components/membership-applications-section.tsx
src/app/(private)/membership-applications/_components/pending-membership-applications-tab.tsx
src/app/(private)/membership-applications/_components/approve-application-modal.tsx
src/app/(private)/membership-applications/_components/reject-application-modal.tsx
src/app/api/crm/membership-applications/summary/route.ts
src/app/api/crm/membership-applications/bulk-approve/route.ts
src/app/api/crm/membership-applications/bulk-reject/route.ts
```

**完了条件**: 上記9ファイルが存在しないこと。

---

### T-02 — `_routes/index.ts` の不要インポート削除

**種別**: 更新  
**依存**: T-01  
**対象ファイル**: `src/app/api/_routes/index.ts`

削除する3行:

```ts
import '@/app/api/crm/membership-applications/bulk-approve/route';
import '@/app/api/crm/membership-applications/bulk-reject/route';
import '@/app/api/crm/membership-applications/summary/route';
```

**完了条件**: ファイルに上記3インポートが存在しないこと。

---

### T-03 — `DataTable` に `getRowClassName` prop を追加

**種別**: 更新  
**依存**: なし  
**対象ファイル**: `src/components/common/data-table/index.tsx`

**背景**: 現在の `DataTable` は `TableRow` の `className` が `cursor-pointer` 固定。BL一致行のハイライト（`bg-destructive/5 hover:bg-destructive/10`）を実現するため、行単位で動的 className を注入できる `getRowClassName` prop を追加する。

**変更内容**:

1. `DataTableProps` インターフェースに追加:

   ```ts
   getRowClassName?: (row: TData) => string | undefined;
   ```

2. 関数引数の分割代入に追加:

   ```ts
   getRowClassName,
   ```

3. `simple` モードの `TableRow` の `className` を変更:

   ```tsx
   // Before
   className={onRowClick ? 'cursor-pointer' : ''}

   // After
   className={cn(onRowClick ? 'cursor-pointer' : '', getRowClassName?.(row.original) ?? '')}
   ```

   `default`（infinite scroll）モードの `TableRow` にも同様に適用する。

**完了条件**: `DataTable` に `getRowClassName` prop を渡すと、各行の `TableRow` に動的な className が付与される。

---

### T-04 — `membership-application.schema.ts` の書き換え

**種別**: 更新  
**依存**: なし  
**対象ファイル**: `src/app/api/_schemas/membership-application.schema.ts`

#### 4-1. `MembershipApplicationStatusSchema` を書き換え

```ts
// Before
export const MembershipApplicationStatusSchema = z.enum([
  'payment_failed', 'pending', 'auto_approved', 'manual_approved', 'rejected', 'cancelled',
]);

// After
export const MembershipApplicationStatusSchema = z.enum([
  '未審査', '審査中', '承認済', '否認', '取り消し済',
]);
```

#### 4-2. `RiskReasonSchema` を削除

`RiskReasonSchema` の定義を削除する。

#### 4-3. `MembershipApplicationSchema` のフィールドを全面書き換え

**削除するフィールド**: `applied_at`, `elapsed_time`, `risk_score`, `risk_reason`, `scheduled_start_date`, `payment_failed_deadline`, `pending_deadline`

**追加するフィールド**:

```ts
blacklist_match: z.boolean().openapi({ example: false, description: 'Blacklist match flag' }),
brand_name: z.string().openapi({ example: 'FIT365', description: 'Brand name' }),
store_name: z.string().openapi({ example: 'FIT365八潮店', description: 'Store name' }),
campaign: z.string().openapi({ example: '春の入会キャンペーン', description: 'Campaign name' }),
application_date: z.string().datetime().openapi({ example: '2026-03-30T09:15:00Z', description: 'Application date and time' }),
start_date: z.string().date().openapi({ example: '2026-04-01', description: 'Desired start date' }),
is_minor: z.boolean().optional().openapi({ example: false, description: 'Minor flag' }),
is_proxy: z.boolean().optional().openapi({ example: false, description: 'Proxy application flag' }),
```

残すフィールド: `id`, `applicant_name`, `plan_name`, `status`

#### 4-4. `GetMembershipApplicationsQuerySchema` を更新

**削除**: `risk_reason`  
**変更**:

- `sort_by`: `z.enum(['applied_at', 'risk_score', 'pending_deadline'])` → `z.enum(['application_date']).optional().default('application_date')`

**追加**:

```ts
brand: z.string().optional().openapi({ description: 'Filter by brand name' }),
store: z.string().optional().openapi({ description: 'Filter by store name' }),
blacklist: z.enum(['all', 'match', 'no_match']).optional().openapi({ description: 'Filter by blacklist match' }),
date_from: z.string().date().optional().openapi({ example: '2026-03-01', description: 'Application date range start' }),
date_to: z.string().date().optional().openapi({ example: '2026-03-31', description: 'Application date range end' }),
```

#### 4-5. サマリ・一括操作スキーマを削除

以下のスキーマ定義をすべて削除:

- `GetMembershipApplicationsSummaryQuerySchema`
- `GetMembershipApplicationsSummaryResponseSchema`
- `SummarySchema`（サマリ用）
- `AutoJudgeRequestSchema`
- `AutoJudgeResponseSchema`
- `AutoJudgeResultSchema`
- `BulkApproveRequestSchema`・`BulkApproveResponseSchema`（存在する場合）
- `BulkRejectRequestSchema`・`BulkRejectResponseSchema`（存在する場合）

ファイル末尾の `export type` 行も合わせて削除する。

**完了条件**: スキーマファイルが新フィールド構成でコンパイルエラーなく通ること。

---

### T-05 — `_mock-db.ts` シードデータ差し替え

**種別**: 更新  
**依存**: T-04  
**対象ファイル**: `src/app/api/_mock-db.ts`

`membershipApplications._applications` のシードデータを以下の19件（プロトタイプ `APPLICATIONS` 準拠）に全面差し替える。

各レコードは `MembershipApplication` 型（T-04 後の新型）に適合させること:

```ts
[
  {
    id: 'APP-2026-0001',
    applicant_name: '山田 太郎',
    status: '未審査',
    blacklist_match: false,
    brand_name: 'FIT365',
    store_name: 'FIT365八潮店',
    plan_name: 'レギュラー会員',
    campaign: '春の入会キャンペーン',
    application_date: '2026-03-30T09:15:00+09:00',
    start_date: '2026-04-01',
  },
  {
    id: 'APP-2026-0002',
    applicant_name: '佐藤 花子',
    status: '未審査',
    blacklist_match: false,
    brand_name: 'FIT365',
    store_name: 'FIT365草加店',
    plan_name: 'デイタイム会員',
    campaign: 'なし',
    application_date: '2026-03-30T10:32:00+09:00',
    start_date: '2026-04-02',
  },
  {
    id: 'APP-2026-0003',
    applicant_name: '鈴木 一郎',
    status: '未審査',
    blacklist_match: true,
    brand_name: 'FIT365',
    store_name: 'FIT365越谷店',
    plan_name: 'ナイト会員',
    campaign: 'なし',
    application_date: '2026-03-30T11:08:00+09:00',
    start_date: '2026-04-01',
  },
  {
    id: 'APP-2026-0004',
    applicant_name: '田中 美咲',
    status: '未審査',
    blacklist_match: false,
    brand_name: 'FIT365',
    store_name: 'FIT365八潮店',
    plan_name: 'ウィークエンド会員',
    campaign: '春の入会キャンペーン',
    application_date: '2026-03-30T11:45:00+09:00',
    start_date: '2026-04-05',
  },
  {
    id: 'APP-2026-0005',
    applicant_name: '伊藤 健二',
    status: '未審査',
    blacklist_match: false,
    brand_name: 'FIT365',
    store_name: 'FIT365草加店',
    plan_name: 'レギュラー会員（学生）',
    campaign: '学生割引キャンペーン',
    application_date: '2026-03-30T13:20:00+09:00',
    start_date: '2026-04-01',
  },
  {
    id: 'APP-2026-0006',
    applicant_name: '松本 奈々',
    status: '未審査',
    blacklist_match: false,
    brand_name: 'JOYFIT',
    store_name: 'ジョイフィット24越谷店',
    plan_name: 'レギュラー会員',
    campaign: 'なし',
    application_date: '2026-03-30T14:05:00+09:00',
    start_date: '2026-04-01',
  },
  {
    id: 'APP-2026-0007',
    applicant_name: '高橋 正男',
    status: '未審査',
    blacklist_match: true,
    brand_name: 'JOYFIT',
    store_name: 'ジョイフィット24草加店',
    plan_name: 'デイタイム会員',
    campaign: '春の入会キャンペーン',
    application_date: '2026-03-30T14:50:00+09:00',
    start_date: '2026-04-14',
  },
  {
    id: 'APP-2026-0008',
    applicant_name: '渡辺 由美子',
    status: '承認済',
    blacklist_match: false,
    brand_name: 'FIT365',
    store_name: 'FIT365八潮店',
    plan_name: 'レギュラー会員',
    campaign: 'なし',
    application_date: '2026-03-30T08:05:00+09:00',
    start_date: '2026-04-01',
  },
  {
    id: 'APP-2026-0009',
    applicant_name: '中村 拓也',
    status: '承認済',
    blacklist_match: false,
    brand_name: 'FIT365',
    store_name: 'FIT365越谷店',
    plan_name: 'デイタイム会員',
    campaign: 'なし',
    application_date: '2026-03-30T07:42:00+09:00',
    start_date: '2026-04-01',
  },
  {
    id: 'APP-2026-0010',
    applicant_name: '小林 優子',
    status: '承認済',
    blacklist_match: false,
    brand_name: 'JOYFIT',
    store_name: 'ジョイフィット24越谷店',
    plan_name: 'ナイト会員',
    campaign: '法人会員キャンペーン',
    application_date: '2026-03-30T09:55:00+09:00',
    start_date: '2026-04-01',
  },
  {
    id: 'APP-2026-0011',
    applicant_name: '加藤 次郎',
    status: '未審査',
    blacklist_match: false,
    brand_name: 'FIT365',
    store_name: 'FIT365八潮店',
    plan_name: 'レギュラー会員（シニア）',
    campaign: 'シニア割引キャンペーン',
    application_date: '2026-03-29T14:20:00+09:00',
    start_date: '2026-04-01',
  },
  {
    id: 'APP-2026-0012',
    applicant_name: '吉田 恵子',
    status: '否認',
    blacklist_match: false,
    brand_name: 'FIT365',
    store_name: 'FIT365越谷店',
    plan_name: 'レギュラー会員',
    campaign: 'なし',
    application_date: '2026-03-29T09:55:00+09:00',
    start_date: '2026-04-01',
  },
  {
    id: 'APP-2026-0013',
    applicant_name: '山本 直人',
    status: '取り消し済',
    blacklist_match: false,
    brand_name: 'FIT365',
    store_name: 'FIT365草加店',
    plan_name: 'ウィークエンド会員',
    campaign: 'なし',
    application_date: '2026-03-28T11:22:00+09:00',
    start_date: '2026-04-01',
  },
  {
    id: 'APP-2026-0014',
    applicant_name: '木村 幸子',
    status: '承認済',
    blacklist_match: false,
    brand_name: 'JOYFIT',
    store_name: 'ジョイフィット24草加店',
    plan_name: 'レギュラー会員',
    campaign: 'なし',
    application_date: '2026-03-28T08:50:00+09:00',
    start_date: '2026-04-07',
  },
  {
    id: 'APP-2026-0015',
    applicant_name: '石川 雄介',
    status: '否認',
    blacklist_match: false,
    brand_name: 'FIT365',
    store_name: 'FIT365八潮店',
    plan_name: 'デイタイム会員',
    campaign: '春の入会キャンペーン',
    application_date: '2026-03-27T16:30:00+09:00',
    start_date: '2026-04-01',
  },
  {
    id: 'APP-2026-0016',
    applicant_name: '前田 由香',
    status: '審査中',
    blacklist_match: true,
    brand_name: 'FIT365',
    store_name: 'FIT365八潮店',
    plan_name: 'レギュラー会員',
    campaign: '学生割引キャンペーン',
    application_date: '2026-03-30T15:40:00+09:00',
    start_date: '2026-04-01',
  },
  {
    id: 'APP-2026-0017',
    applicant_name: '若林 みなみ',
    status: '未審査',
    blacklist_match: false,
    brand_name: 'JOYFIT',
    store_name: 'ジョイフィット24越谷店',
    plan_name: 'レギュラー会員（学生）',
    campaign: '学生割引キャンペーン',
    application_date: '2026-03-30T10:00:00+09:00',
    start_date: '2026-04-01',
    is_minor: true,
  },
  {
    id: 'APP-2026-0018',
    applicant_name: '青木 太一',
    status: '未審査',
    blacklist_match: false,
    brand_name: 'FIT365',
    store_name: 'FIT365草加店',
    plan_name: 'レギュラー会員',
    campaign: 'なし',
    application_date: '2026-03-30T09:00:00+09:00',
    start_date: '2026-04-01',
    is_proxy: true,
  },
  {
    id: 'APP-2026-0019',
    applicant_name: '小川 拓海',
    status: '未審査',
    blacklist_match: false,
    brand_name: 'JOYFIT',
    store_name: 'ジョイフィット24越谷店',
    plan_name: 'レギュラー会員',
    campaign: 'なし',
    application_date: '2026-03-30T12:30:00+09:00',
    start_date: '2026-04-01',
  },
];
```

**完了条件**: モックDBのシードが新スキーマ型でコンパイルエラーなく通ること。

---

### T-06 — `membership-applications/route.ts` ハンドラー更新

**種別**: 更新  
**依存**: T-04, T-05  
**対象ファイル**: `src/app/api/crm/membership-applications/route.ts`

#### 6-1. `registerRoute` の `POST`（auto-judge）登録を削除

#### 6-2. GET ハンドラーのフィルタリングロジックを更新

- `status`: 日本語ステータス値（`'未審査'` 等）での直接比較に変更
- `brand`: `row.brand_name === brand` でフィルタリング追加
- `store`: `row.store_name === store` でフィルタリング追加
- `blacklist`:
  - `'match'` → `row.blacklist_match === true`
  - `'no_match'` → `row.blacklist_match === false`
  - `'all'` または未指定 → 全件
- `date_from` / `date_to`: `row.application_date` の日付部分と比較
- `sort_by: 'application_date'`: `row.application_date` の文字列ソートに変更
- `risk_reason` フィルターロジックを削除

#### 6-3. `POST` ハンドラー（auto-judge）を削除

**完了条件**: GET リクエストに新クエリパラメータを渡すと正しくフィルタリング・ソートされること。

---

### T-07 — OpenAPI・型生成の再実行

**種別**: コマンド実行  
**依存**: T-02, T-04, T-06

以下を順番に実行:

```bash
npm run generate-openapi
npm run generate-api
```

**完了条件**: `src/lib/api/types.gen.ts` と `src/lib/api/@tanstack/react-query.gen.ts` が新スキーマに対応した内容で再生成されていること。`MembershipApplication` 型に `blacklist_match`, `brand_name`, `store_name`, `campaign`, `application_date`, `start_date` が含まれること。

---

### T-08 — `_constants/constants.ts` 作成

**種別**: 新規作成  
**依存**: T-07（`MembershipApplicationStatus` 型参照のため）  
**作成ファイル**: `src/app/(private)/membership-applications/_constants/constants.ts`

```ts
import type { MembershipApplicationStatus } from '@/lib/api/types.gen';

export const APPLICATION_STATUS_BADGE_CLASSES: Record<MembershipApplicationStatus, string> = {
  未審査: 'bg-warning/15 text-warning border-warning/20',
  審査中: 'bg-info/15 text-info border-info/20',
  承認済: 'bg-success/15 text-success border-success/20',
  否認: 'bg-destructive/15 text-destructive border-destructive/20',
  取り消し済: 'bg-muted text-muted-foreground border-border',
};

export const APPLICATION_STATUS_OPTIONS: {
  value: MembershipApplicationStatus | 'all';
  label: string;
}[] = [
  { value: 'all', label: '全ステータス' },
  { value: '未審査', label: '未審査' },
  { value: '審査中', label: '審査中' },
  { value: '承認済', label: '承認済' },
  { value: '否認', label: '否認' },
  { value: '取り消し済', label: '取り消し済' },
];

export const BLACKLIST_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: '全申請' },
  { value: 'match', label: 'BL一致のみ' },
  { value: 'no_match', label: 'BL一致なし' },
];

export const BRAND_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: '全ブランド' },
  { value: 'FIT365', label: 'FIT365' },
  { value: 'JOYFIT', label: 'JOYFIT' },
];
```

**完了条件**: 定数ファイルが型エラーなくインポートできること。

---

### T-09 — `use-membership-applications-filters.ts` 作成

**種別**: 新規作成  
**依存**: T-07  
**作成ファイル**: `src/app/(private)/membership-applications/_hooks/use-membership-applications-filters.ts`

**実装パターン**: `src/app/(private)/members/_hooks/use-members-filters.ts` に準拠。

```ts
import { useEffect, useState } from 'react';
import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';
import type { GetCrmMembershipApplicationsData } from '@/lib/api/types.gen';

type BlacklistFilter = 'all' | 'match' | 'no_match';

export function useMembershipApplicationsFilters() {
  const [searchInput, setSearchInput] = useState('');

  const [filters, setFilters] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    search: parseAsString.withDefault(''),
    status: parseAsString.withDefault('all'),
    brand: parseAsString.withDefault('all'),
    store: parseAsString.withDefault('all'),
    date_from: parseAsString,           // null = 未設定
    date_to: parseAsString,             // null = 未設定
    blacklist: parseAsStringEnum<BlacklistFilter>(['all', 'match', 'no_match']).withDefault('all'),
    sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('desc'),
  }, { history: 'push', shallow: false });

  // mount 時に URL の search を searchInput に同期
  useEffect(() => {
    if (filters.search) setSearchInput(filters.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 500ms デバウンス
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput || null, page: 1 });
      }
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput, filters.search, setFilters]);

  const updateFilter = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
    setFilters({ [key]: value, page: 1 } as Parameters<typeof setFilters>[0]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1, search: null, status: 'all', brand: 'all', store: 'all',
      date_from: null, date_to: null, blacklist: 'all', sort_order: 'desc',
    });
  };

  const activeFilterCount = [
    filters.status !== 'all',
    filters.brand !== 'all',
    filters.store !== 'all',
    filters.date_from !== null,
    filters.blacklist !== 'all',
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0 || filters.search.length > 0;

  const queryParams: NonNullable<GetCrmMembershipApplicationsData['query']> = {
    page: filters.page,
    limit: PAGE_SIZE,
    search: filters.search || undefined,
    status: filters.status !== 'all' ? (filters.status as ...) : undefined,
    brand: filters.brand !== 'all' ? filters.brand : undefined,
    store: filters.store !== 'all' ? filters.store : undefined,
    blacklist: filters.blacklist !== 'all' ? filters.blacklist : undefined,
    date_from: filters.date_from ?? undefined,
    date_to: filters.date_to ?? undefined,
    sort_by: 'application_date',
    sort_order: filters.sort_order,
  };

  return {
    searchInput, setSearchInput,
    filters,
    updateFilter, setFilters, clearFilters,
    hasActiveFilters, activeFilterCount,
    queryParams,
    currentPage: filters.page,
    setCurrentPage: (p: number) => setFilters({ page: p }),
    pageSize: PAGE_SIZE,
  };
}
```

**完了条件**: フックが型エラーなくインポートでき、`queryParams` が `GetCrmMembershipApplicationsData['query']` 型に適合すること。

---

### T-10 — `membership-applications-filters-context.tsx` 作成

**種別**: 新規作成  
**依存**: T-09  
**作成ファイル**: `src/app/(private)/membership-applications/_contexts/membership-applications-filters-context.tsx`

**実装パターン**: `src/app/(private)/members/_contexts/members-filters-context.tsx` に完全準拠。

```tsx
'use client';
import { type ReactNode, createContext, useContext } from 'react';

import type { useMembershipApplicationsFilters } from '../_hooks/use-membership-applications-filters';

export type MembershipApplicationsFiltersContextValue = ReturnType<
  typeof useMembershipApplicationsFilters
>;

const MembershipApplicationsFiltersContext = createContext<
  MembershipApplicationsFiltersContextValue | undefined
>(undefined);

export function MembershipApplicationsFiltersProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: MembershipApplicationsFiltersContextValue;
}) {
  return (
    <MembershipApplicationsFiltersContext.Provider value={value}>
      {children}
    </MembershipApplicationsFiltersContext.Provider>
  );
}

export function useMembershipApplicationsFiltersContext() {
  const ctx = useContext(MembershipApplicationsFiltersContext);
  if (!ctx)
    throw new Error(
      'useMembershipApplicationsFiltersContext must be used within MembershipApplicationsFiltersProvider',
    );
  return ctx;
}
```

**完了条件**: Provider と Consumer がエラーなく動作すること。

---

### T-11 — `membership-applications-kpi-cards.tsx` 作成

**種別**: 新規作成  
**依存**: T-07, T-08  
**作成ファイル**: `src/app/(private)/membership-applications/_components/membership-applications-kpi-cards.tsx`

**実装内容**:

- Props: `applications: MembershipApplication[]`
- `'use client'` 不要（純粋な計算 + JSX。ただし親コンポーネントが `'use client'` のため問題なし）
- `inQueue`: `status === '未審査' || status === '審査中'`
- 3列グリッド（`grid-cols-3 gap-4`）
- 各カードの構造:
  ```tsx
  <Card className={`p-4 ${cardBorderClass}`}>
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{title}</span>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-semibold ${valueColorClass}`}>{count}</span>
        <span className="text-muted-foreground text-xs">件</span>
      </div>
    </div>
  </Card>
  ```
- カードごとの色設定（スペック §4 参照）:
  - 未審査: `text-warning` / `border-warning/50`（常時）
  - BL要注意: `text-destructive` / `border-destructive/50`（count > 0 時のみ border）
  - 未成年: `text-info` / `border-info/50`（count > 0 時のみ border）

**完了条件**: `applications` を渡すと正しい件数が3カードに表示されること。

---

### T-12 — `membership-applications-table-columns.tsx` 作成

**種別**: 新規作成  
**依存**: T-07, T-08  
**作成ファイル**: `src/app/(private)/membership-applications/_components/membership-applications-table-columns.tsx`

**実装内容**（`ColumnDef<MembershipApplication>[]` を返す関数）:

| カラム             | cell 実装                                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `text-xs text-muted-foreground`                                                                                               |
| `applicant_name`   | `text-sm font-medium`                                                                                                         |
| `status`           | `<Badge variant="outline" className={APPLICATION_STATUS_BADGE_CLASSES[status]}>`                                              |
| `blacklist_match`  | `true` → `<Badge variant="outline" className="...destructive..."><AlertTriangle />BL一致</Badge>`、`false` → `<span>—</span>` |
| `brand_name`       | `<Badge variant="outline">`                                                                                                   |
| `store_name`       | `text-xs`                                                                                                                     |
| `plan_name`        | `text-xs`                                                                                                                     |
| `campaign`         | `text-xs text-muted-foreground`、`'なし'` → `'—'`                                                                             |
| `application_date` | `header: ({ column }) => <DataTableColumnHeader column={column} title="申請日時" />`。cell: `text-xs`（`format` で表示）      |
| `start_date`       | `text-xs`                                                                                                                     |

**完了条件**: カラム定義が型エラーなく、各セルが正しくレンダリングされること。

---

### T-13 — `membership-applications-table.tsx` 作成

**種別**: 新規作成  
**依存**: T-03, T-12  
**作成ファイル**: `src/app/(private)/membership-applications/_components/membership-applications-table.tsx`

**Props**:

```ts
interface MembershipApplicationsTableProps {
  applications: MembershipApplication[];
  isLoading: boolean;
  pagination: { total: number; total_pages: number; page: number; limit: number } | undefined;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  sortOrder: 'asc' | 'desc';
  onSortChange: (order: 'asc' | 'desc') => void;
}
```

**実装内容**:

```tsx
'use client';
// SortingState から sort_order を導出して useMembershipApplicationsFilters に反映
const sorting: SortingState = [{ id: 'application_date', desc: sortOrder === 'desc' }];

const handleSortingChange = (updater: ...) => {
  const next = typeof updater === 'function' ? updater(sorting) : updater;
  onSortChange(next[0]?.desc ? 'desc' : 'asc');
};

<DataTable
  columns={columns}
  data={applications}
  isLoading={isLoading}
  variant="simple"
  onRowClick={(row) => router.push(navigate('/membership-applications/[id]', row.id))}
  getRowClassName={(row) =>
    row.blacklist_match ? 'bg-destructive/5 hover:bg-destructive/10' : ''
  }
  tableOptions={{
    manualSorting: true,
    onSortingChange: handleSortingChange,
    state: { sorting },
  }}
/>

{(pagination?.total ?? 0) > 0 && (
  <TablePagination
    currentPage={currentPage}
    totalPages={pagination?.total_pages ?? 0}
    total={pagination?.total ?? 0}
    limit={pagination?.limit ?? PAGE_SIZE}
    onPageChange={setCurrentPage}
    isLoading={isLoading}
    showPageNumbers={false}
  />
)}
```

**完了条件**: テーブルが表示され、申請日時ソート・行クリック遷移・BL行ハイライトが動作すること。

---

### T-14 — `membership-applications-filters.tsx` 作成

**種別**: 新規作成  
**依存**: T-10  
**作成ファイル**: `src/app/(private)/membership-applications/_components/membership-applications-filters.tsx`

**Props**: `isFilterOpen: boolean`, `onFilterOpenChange: (open: boolean) => void`

**実装内容**（`useMembershipApplicationsFiltersContext()` でフィルター状態取得）:

ツールバー行:

```tsx
<div className="flex items-center gap-2">
  {/* 検索 Input（最大幅 400px、左寄せ、Search アイコン付き） */}
  {/* 「詳細フィルター」Button（右寄せ、activeFilterCount > 0 でバッジ・variant="default"） */}
</div>
```

展開時フィルター行:

```tsx
{
  isFilterOpen && (
    <div className="flex flex-wrap items-center gap-2">
      {/* ステータス Select w-[140px] — APPLICATION_STATUS_OPTIONS 使用 */}
      {/* ブランド Select w-[140px] — BRAND_OPTIONS 使用 */}
      {/* 店舗 Select w-[180px] — getCrmStoresOptions から動的取得 */}
      {/* DateRangePicker — date_from/date_to を DateRange に変換して渡す */}
      {/* BL照合 Select w-[170px] — BLACKLIST_FILTER_OPTIONS 使用 */}
      {/* 「すべてクリア」Button variant="ghost" 右端（hasActiveFilters 時のみ表示） */}
    </div>
  );
}
```

`DateRangePicker` と URL パラメータの連携:

- `date_from` / `date_to` (string | null) → `DateRange` への変換:
  ```ts
  const dateRange: DateRange | undefined = filters.date_from
    ? {
        from: new Date(filters.date_from),
        to: filters.date_to ? new Date(filters.date_to) : undefined,
      }
    : undefined;
  ```
- DateRangePicker の `onSelect` で逆変換:
  ```ts
  onSelect={(range) => {
    updateFilter('date_from', range?.from ? format(range.from, 'yyyy-MM-dd') : null);
    updateFilter('date_to', range?.to ? format(range.to, 'yyyy-MM-dd') : null);
  }}
  ```

**完了条件**: 各フィルターが URL パラメータと双方向に同期し、アクティブカウントが正しく表示されること。

---

### T-15 — `page.tsx` 全面書き換え

**種別**: 更新  
**依存**: T-11, T-13, T-14  
**対象ファイル**: `src/app/(private)/membership-applications/page.tsx`

**実装内容**（`members/page.tsx` の構造に準拠）:

```tsx
'use client';
import { Suspense, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { getCrmMembershipApplicationsOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { MembershipApplicationsFilters } from './_components/membership-applications-filters';
import { MembershipApplicationsKpiCards } from './_components/membership-applications-kpi-cards';
import { MembershipApplicationsTable } from './_components/membership-applications-table';
import { MembershipApplicationsFiltersProvider } from './_contexts/membership-applications-filters-context';
import { useMembershipApplicationsFilters } from './_hooks/use-membership-applications-filters';

function MembershipApplicationsPageContent() {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filtersHook = useMembershipApplicationsFilters();
  const { queryParams, currentPage, setCurrentPage } = filtersHook;

  const { data, isLoading } = useQuery({
    ...getCrmMembershipApplicationsOptions({ query: queryParams }),
  });

  const applications = data?.applications ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">入会申請管理</h1>
        <Button
          size="sm"
          className="gap-1"
          onClick={() => router.push(navigate('/membership-applications/new'))}
        >
          <Plus className="size-4" />
          管理画面から入会登録
        </Button>
      </div>

      {/* KPI Cards */}
      <MembershipApplicationsKpiCards applications={applications} />

      {/* Table Card */}
      <Card className="gap-0 overflow-hidden rounded-xl p-0">
        <div className="px-4 py-3">
          <MembershipApplicationsFiltersProvider value={filtersHook}>
            <MembershipApplicationsFilters
              isFilterOpen={isFilterOpen}
              onFilterOpenChange={setIsFilterOpen}
            />
          </MembershipApplicationsFiltersProvider>
        </div>
        <MembershipApplicationsTable
          applications={applications}
          isLoading={isLoading}
          pagination={data?.pagination}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sortOrder={filtersHook.filters.sort_order}
          onSortChange={(order) => filtersHook.setFilters({ sort_order: order })}
        />
      </Card>
    </div>
  );
}

export default function MembershipApplicationsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MembershipApplicationsPageContent />
    </Suspense>
  );
}
```

> ⚠️ `/membership-applications/new` ルートは現時点では未実装。遷移先が存在しない場合は 404 になるが、ボタン自体は実装しておく（C-01-01 以降で対応）。

**完了条件**: ページが正常に表示され、KPI カード・フィルター・テーブル・ページネーションがすべて機能すること。

---

### T-16 — 型チェック・動作確認

**種別**: 確認  
**依存**: T-15

1. `npm run type-check` — エラー 0 件
2. `npm run dev` でページを開いて目視確認:
   - KPI カード 3 種が正しい件数を表示する
   - フィルターパネルが展開・折りたたみできる
   - 各フィルターを変更すると URL が更新され、テーブルが絞り込まれる
   - 申請日時列のソートが切り替わる
   - BL一致行（`APP-2026-0003`, `APP-2026-0007`, `APP-2026-0016`）が赤背景でハイライトされる
   - 行クリックで `/membership-applications/[id]` へ遷移する
   - ページネーションが動作する

---

### T-17 — UIスタイル照合（デザインプロトタイプとの差分確認）

**種別**: 確認  
**依存**: T-16  
**プロトタイプ参照**: `/home/du/WorkSpace/dx-fitness/fitness-crm-ui/src/pages/enrollment-application-list.tsx`

プロトタイプの各 UI 要素と実装を1対1で照合し、スタイル差分をすべて修正する。

#### 17-1. ページ全体レイアウト

| 確認項目           | プロトタイプの値      | 確認 |
| ------------------ | --------------------- | ---- |
| ページ外側 padding | `p-6`                 | ☐    |
| ページ内 gap       | `flex flex-col gap-6` | ☐    |
| 背景色             | `bg-muted/40`         | ☐    |

#### 17-2. ページヘッダー

| 確認項目                       | プロトタイプの値                                   | 確認 |
| ------------------------------ | -------------------------------------------------- | ---- |
| タイトル文字サイズ             | `text-xl font-bold`                                | ☐    |
| 「管理画面から入会登録」ボタン | `size="sm"` + `gap-1` + `Plus` アイコン (`size-4`) | ☐    |

#### 17-3. KPI カード

| 確認項目         | プロトタイプの値                                         | 確認 |
| ---------------- | -------------------------------------------------------- | ---- |
| グリッド         | `grid grid-cols-3 gap-4`                                 | ☐    |
| カード内 padding | `p-4`                                                    | ☐    |
| ラベル           | `text-xs text-muted-foreground`                          | ☐    |
| 数値文字サイズ   | `text-2xl font-semibold`                                 | ☐    |
| 単位             | `text-xs text-muted-foreground`「件」                    | ☐    |
| 未審査 border    | `border-warning/50`（常時）                              | ☐    |
| 未審査 数値色    | `text-warning`（常時）                                   | ☐    |
| BL要注意 border  | `border-destructive/50`（count > 0 時のみ）              | ☐    |
| BL要注意 数値色  | `text-destructive`（count > 0）/ デフォルト（count = 0） | ☐    |
| 未成年 border    | `border-info/50`（count > 0 時のみ）                     | ☐    |
| 未成年 数値色    | `text-info`（count > 0）/ デフォルト（count = 0）        | ☐    |

#### 17-4. テーブルカード全体

| 確認項目             | プロトタイプの値                                              | 確認 |
| -------------------- | ------------------------------------------------------------- | ---- |
| Card の padding 設定 | `py-0 gap-0`（カード自体）/ `px-4 py-3`（ツールバー wrapper） | ☐    |

#### 17-5. ツールバー（検索 + フィルタートグル）

| 確認項目                 | プロトタイプの値                                                   | 確認 |
| ------------------------ | ------------------------------------------------------------------ | ---- |
| 検索 Input 最大幅        | `max-w-[400px] flex-1`                                             | ☐    |
| 検索 Input height        | `h-8`（`className`）、`text-xs`                                    | ☐    |
| 検索アイコン             | `Search` `size-4 text-muted-foreground` 、左内側 `left-3` / `pl-9` | ☐    |
| 「詳細フィルター」ボタン | `size="sm"` `h-8 text-xs gap-1`                                    | ☐    |
| フィルターアイコン       | `SlidersHorizontal` `size-4`                                       | ☐    |
| 開閉アイコン             | 開: `ChevronUp size-3` / 閉: `ChevronDown size-3`                  | ☐    |
| フィルター有効時のボタン | `variant="default"`                                                | ☐    |
| フィルター無効時のボタン | `variant="outline"`                                                | ☐    |
| アクティブカウントバッジ | `variant="secondary"` `h-5 px-1 text-[10px] ml-0.5`                | ☐    |

#### 17-6. 展開フィルター行

| 確認項目                      | プロトタイプの値                                                          | 確認 |
| ----------------------------- | ------------------------------------------------------------------------- | ---- |
| 行レイアウト                  | `flex items-center gap-2`                                                 | ☐    |
| ステータス Select 幅          | `w-[140px] h-8 text-xs`                                                   | ☐    |
| ブランド Select 幅            | `w-[140px] h-8 text-xs`                                                   | ☐    |
| 店舗 Select 幅                | `w-[180px] h-8 text-xs`                                                   | ☐    |
| BL照合 Select 幅              | `w-[170px] h-8 text-xs`                                                   | ☐    |
| BL照合 Select ラベル          | 左側に `<span className="text-muted-foreground mr-1">BL照合:</span>`      | ☐    |
| アクティブフィルターの Select | `border-primary bg-primary/10 text-foreground`                            | ☐    |
| DateRangePicker ボタン        | `h-8 text-xs gap-2 font-normal` + `CalendarIcon size-4`                   | ☐    |
| DateRangePicker アクティブ時  | `border-primary bg-primary/10 text-foreground`                            | ☐    |
| 「すべてクリア」ボタン        | `variant="ghost"` `size="sm"` `h-8 text-xs text-muted-foreground ml-auto` | ☐    |

#### 17-7. テーブルヘッダー

| 確認項目                                 | プロトタイプの値                              | 確認 |
| ---------------------------------------- | --------------------------------------------- | ---- |
| ヘッダー行背景                           | `bg-muted/50`                                 | ☐    |
| ヘッダーセル共通                         | `text-xs font-semibold`                       | ☐    |
| 申請ID 幅                                | `w-[140px]`                                   | ☐    |
| 氏名 幅                                  | `min-w-[120px]`                               | ☐    |
| ステータス 幅                            | `w-[100px]`                                   | ☐    |
| BL照合 幅                                | `w-[80px]`                                    | ☐    |
| ブランド 幅                              | `w-[100px]`                                   | ☐    |
| 店舗 幅                                  | `w-[160px]`                                   | ☐    |
| プラン 幅                                | `w-[160px]`                                   | ☐    |
| キャンペーン 幅                          | `w-[160px]`                                   | ☐    |
| 申請日時 幅                              | `w-[140px]`                                   | ☐    |
| 利用開始日 幅                            | `w-[110px]`                                   | ☐    |
| `DataTableColumnHeader` を申請日時に使用 | ソートアイコン `ArrowDown`/`ArrowUp` `size-3` | ☐    |

#### 17-8. テーブル行・セル

| 確認項目         | プロトタイプの値                                                                                                          | 確認 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | ---- |
| 通常行ホバー     | `hover:bg-muted/50`                                                                                                       | ☐    |
| BL一致行背景     | `bg-destructive/5`                                                                                                        | ☐    |
| BL一致行ホバー   | `hover:bg-destructive/10`                                                                                                 | ☐    |
| 申請ID セル      | `text-xs text-muted-foreground`                                                                                           | ☐    |
| 氏名セル         | `text-sm font-medium`                                                                                                     | ☐    |
| ステータスバッジ | `variant="outline"` `text-[10px]` + 各ステータスカラークラス                                                              | ☐    |
| BL一致バッジ     | `variant="outline"` `text-[10px] bg-destructive/15 text-destructive border-destructive/20 gap-1` + `AlertTriangle size-3` | ☐    |
| BL不一致         | `text-xs text-muted-foreground` `—`                                                                                       | ☐    |
| ブランドバッジ   | `variant="outline"` `text-[10px]`                                                                                         | ☐    |
| 店舗セル         | `text-xs`                                                                                                                 | ☐    |
| プランセル       | `text-xs`                                                                                                                 | ☐    |
| キャンペーンセル | `text-xs text-muted-foreground`、`"なし"` → `"—"`                                                                         | ☐    |
| 申請日時セル     | `text-xs`                                                                                                                 | ☐    |
| 利用開始日セル   | `text-xs`                                                                                                                 | ☐    |

#### 17-9. エンプティステート

| 確認項目     | プロトタイプの値                                                  | 確認 |
| ------------ | ----------------------------------------------------------------- | ---- |
| セル結合     | `colSpan={10}` `h-24 text-center`                                 | ☐    |
| メッセージ   | `text-sm text-muted-foreground`「条件に一致する申請がありません」 | ☐    |
| クリアボタン | `variant="outline"` `size="sm"`「フィルターをクリア」             | ☐    |
| wrapper      | `flex flex-col items-center gap-3`                                | ☐    |

#### 17-10. ページネーション

| 確認項目       | プロトタイプの値                                                           | 確認 |
| -------------- | -------------------------------------------------------------------------- | ---- |
| wrapper        | `flex items-center justify-between px-4 py-3 border-t`                     | ☐    |
| 件数テキスト   | `text-xs text-muted-foreground`「全N件中 1-N件を表示」                     | ☐    |
| 「前へ」ボタン | `variant="outline"` `size="sm"` `text-xs h-8` + `ChevronLeft size-4 mr-1`  | ☐    |
| 「次へ」ボタン | `variant="outline"` `size="sm"` `text-xs h-8` + `ChevronRight size-4 ml-1` | ☐    |

> ⚠️ `TablePagination` コンポーネントの既存スタイルがプロトタイプと異なる場合、`TablePagination` 内のマークアップを修正するのではなく、ページネーション部分を `TablePagination` を使わず直書きすることを検討する。

#### 照合手順

1. `npm run dev` でページを開く
2. プロトタイプファイル（`fitness-crm-ui/src/pages/enrollment-application-list.tsx`）をエディタで横並びに開く
3. 上記チェックリストを上から順に確認し、差分があれば該当コンポーネントを修正する
4. 全項目 ☑ になったら完了

**完了条件**: 上記チェックリストの全項目が一致していること。目視での差分がないこと。

---

## 実装順序（推奨）

```
T-01 → T-02 → T-03
T-04 → T-05 → T-06 → T-07
T-08 → T-09 → T-10
T-11 → T-12 → T-13 → T-14 → T-15 → T-16 → T-17
```

並列可能: `T-01/T-02/T-03` と `T-04/T-05/T-06` は同時進行可。T-07 完了後に T-08〜T-14 を並列進行可。

---

## ハンドオフ

タスクリストを確認・承認後、次のステップに進んでください:

```
次のエージェント: speckit.implement
タスク: T-01 から順に実装を開始する
```
