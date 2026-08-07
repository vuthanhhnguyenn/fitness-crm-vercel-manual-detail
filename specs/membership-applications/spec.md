# C-01 入会申請管理（一覧）— 画面仕様書

> **SpecKit Step**: 2 — speckit.clarify
> **ステータス**: 承認待ち
> **作成日**: 2026-05-05
> **参照元**: C-01.md (fitness-crm-ui `public/requirements/C-01.md` — 260410_v2)
> **UIプロトタイプ**: `enrollment-application-list.tsx` (fitness-crm-ui)
> **対象ブランチ**: `feat/update-agents`

---

## 1. 画面概要

| 項目       | 内容                                                                                |
| ---------- | ----------------------------------------------------------------------------------- |
| 機能ID     | C-01                                                                                |
| 画面名     | 入会申請管理（一覧）                                                                |
| URL        | `/membership-applications`                                                          |
| 階層       | L1                                                                                  |
| 主な利用者 | Staff（所属店舗）、Manager（管轄店舗）、Headquarter（全店舗）、Observer（閲覧のみ） |

### 目的

アプリから送信された入会申請と管理画面入力中の申請を一覧表示し、審査対象を素早く把握する（FR-M001）。

---

## 2. 現在の実装との差分（変更概要）

### 削除するもの（旧UIには存在するが新UIには不要）

| 削除対象                                                               | 場所                                               | 理由                                                                          |
| ---------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| `MembershipApplicationsOverview` コンポーネント                        | `_components/membership-applications-overview.tsx` | KPI（自動承認率・平均処理時間・入会件数）は新UIの要件外。C-01の指標に置き換え |
| タブ型ナビゲーション（決済失敗/要確認/自動承認済み/手動承認済み/却下） | `_components/membership-applications-section.tsx`  | 新UIはステータスを単一テーブル＋フィルターで扱う                              |
| テーブル内インラインアクションボタン（承認/却下/詳細）                 | `pending-membership-applications-tab.tsx`          | 行クリックで詳細画面へ遷移する方式に変更                                      |
| 一括承認・一括却下（bulk actions）                                     | `approve-application-modal.tsx`                    | 新UIに存在しない                                                              |
| 無限スクロール（useInfiniteQuery）                                     | `pending-membership-applications-tab.tsx`          | ページネーション方式に変更                                                    |
| リスクスコア列 (`risk_score`, `risk_reason`)                           | テーブルカラム                                     | BL照合フラグ列に置き換え                                                      |
| `MembershipApplicationsHeader` コンポーネント                          | `_components/membership-applications-header.tsx`   | 新UIの `PageHeader` パターンに統合                                            |
| `/summary` API エンドポイントの呼び出し                                | Overview コンポーネント                            | 不要になるため                                                                |
| Checkboxによる行選択                                                   | テーブル                                           | 一括操作削除に伴い不要                                                        |

### 追加・変更するもの（新UI要件）

| 追加/変更対象                    | 内容                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| KPIカード3種                     | 未審査・BL要注意・未成年。一覧データから動的計算。ページ内で完結（サマリAPI不要）            |
| フィルターパネル（折りたたみ式） | ステータス・ブランド・店舗・申請日レンジ・BL照合フラグ。アクティブフィルター数バッジ表示     |
| テーブルカラム変更               | 申請ID・氏名・ステータス・BL照合・ブランド・店舗・プラン・キャンペーン・申請日時・利用開始日 |
| 申請日時ソートトグル             | 列ヘッダーのクリックで昇順/降順切替                                                          |
| BL一致行の背景ハイライト         | `bg-destructive/5 hover:bg-destructive/10`                                                   |
| ページネーション                 | 前へ/次へボタン方式                                                                          |
| 「管理画面から入会登録」ボタン   | PageHeader の actions に配置。権限: HQ/Manager/Staff のみ（Observer・Trainer は非表示）      |
| URLステート管理（nuqs）          | フィルター・ページ番号を URL パラメータで管理                                                |
| APIスキーマ更新                  | 新ステータス値・新フィールドへの対応（後述）                                                 |

---

## 3. 画面レイアウト

```
┌─────────────────────────────────────────────────────────────────┐
│ [PageHeader] 入会申請管理  全店舗（本部）    [管理画面から入会登録] │
├─────────────────────────────────────────────────────────────────┤
│ [KPI Cards - 3列]                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ 未審査       │ │ BL要注意    │ │ 未成年      │               │
│  │   7 件      │ │   3 件      │ │   1 件      │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
├─────────────────────────────────────────────────────────────────┤
│ [Card: テーブル]                                                 │
│  Toolbar:                                                        │
│  [🔍 申請ID・氏名で検索...      ] [詳細フィルター ▼ (N)]          │
│  ─────────── 展開時 ─────────────────────────────────────────── │
│  [ステータス ▼] [ブランド ▼] [店舗 ▼] [📅 期間] [BL照合 ▼] [クリア] │
│  ─────────────────────────────────────────────────────────────  │
│  Table:                                                          │
│  申請ID | 氏名 | ステータス | BL照合 | ブランド | 店舗 | プラン | キャンペーン | 申請日時↕ | 利用開始日 │
│  ────── │ ─── │ ────────── │ ────── │ ─────── │ ─── │ ───── │ ────────── │ ───────── │ ──────── │
│  ...    │ ... │ [badge]    │ [BL一致]│[badge] │ ... │  ...  │    ...     │   ...     │  ...     │
│  ─────────────────────────────────────────────────────────────  │
│  全N件中 1-20件を表示              [← 前へ] [次へ →]             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. KPI カード仕様

KPIは一覧の**取得済みデータから動的計算**する（サマリAPI不要）。

| カード       | 定義                                                        | 色                                                     |
| ------------ | ----------------------------------------------------------- | ------------------------------------------------------ | --------------------------- | ----------------------------------- |
| **未審査**   | `status === "未審査"                                        |                                                        | status === "審査中"` の件数 | `text-warning`, `border-warning/50` |
| **BL要注意** | 上記（未審査+審査中）かつ `blacklist_match === true` の件数 | 件数>0 時: `text-destructive`, `border-destructive/50` |
| **未成年**   | 上記（未審査+審査中）かつ `is_minor === true` の件数        | 件数>0 時: `text-info`, `border-info/50`               |

---

## 5. フィルター仕様

「詳細フィルター」ボタンで折りたたみ表示。URLステートで管理（`nuqs`）。

| フィルター   | URL パラメータ          | 選択肢                                                      | 表示条件               |
| ------------ | ----------------------- | ----------------------------------------------------------- | ---------------------- |
| ステータス   | `status`                | 全ステータス / 未審査 / 審査中 / 承認済 / 否認 / 取り消し済 | 常時                   |
| ブランド     | `brand`                 | 全ブランド / FIT365 / JOYFIT                                | 常時                   |
| 店舗         | `store`                 | 全店舗 / 各店舗名                                           | 常時                   |
| 申請日レンジ | `date_from` / `date_to` | カレンダー（DateRange）                                     | 常時                   |
| BL照合       | `blacklist`             | 全申請 / BL一致のみ / BL一致なし                            | 常時                   |
| 検索         | `search`                | 申請ID・氏名の部分一致                                      | 常時（ツールバー直接） |

- フィルター変更時はアクティブフィルター数を「詳細フィルター」ボタンのバッジに表示
- 「すべてクリア」ボタンで全フィルターをデフォルト値に戻す
- ロールベースの自動スコーピングは Phase 2 対応。全フィルターを全ユーザーに表示する（members ページと同じ設計）

---

## 6. テーブルカラム仕様

| #   | カラム名     | フィールド         | 幅        | 備考                                                                         |
| --- | ------------ | ------------------ | --------- | ---------------------------------------------------------------------------- |
| 1   | 申請ID       | `id`               | 140px     | `text-xs text-muted-foreground`                                              |
| 2   | 氏名         | `applicant_name`   | min 120px | `text-sm font-medium`                                                        |
| 3   | ステータス   | `status`           | 100px     | Badge（下記バッジカラー参照）                                                |
| 4   | BL照合       | `blacklist_match`  | 80px      | 一致: `AlertTriangle`アイコン＋「BL一致」Badge（destructive系）、不一致: `—` |
| 5   | ブランド     | `brand_name`       | 100px     | Badge（outline）                                                             |
| 6   | 店舗         | `store_name`       | 160px     | `text-xs`                                                                    |
| 7   | プラン       | `plan_name`        | 160px     | `text-xs`                                                                    |
| 8   | キャンペーン | `campaign`         | 160px     | `text-xs text-muted-foreground`、「なし」→ `—`                               |
| 9   | 申請日時 ↕   | `application_date` | 140px     | クリックで昇順/降順ソートトグル                                              |
| 10  | 利用開始日   | `start_date`       | 110px     | `text-xs`                                                                    |

### ステータスバッジカラー

| ステータス | クラス                                                     |
| ---------- | ---------------------------------------------------------- |
| 未審査     | `bg-warning/15 text-warning border-warning/20`             |
| 審査中     | `bg-info/15 text-info border-info/20`                      |
| 承認済     | `bg-success/15 text-success border-success/20`             |
| 否認       | `bg-destructive/15 text-destructive border-destructive/20` |
| 取り消し済 | `bg-muted text-muted-foreground border-border`             |

### 行クリック挙動

- 行全体がクリッカブル（`cursor-pointer`）
- `/membership-applications/[id]` へ遷移
- BL一致行: `bg-destructive/5 hover:bg-destructive/10`
- その他行: `hover:bg-muted/50`

---

## 7. ページネーション仕様

- ページサイズ: 20件/ページ（固定）
- 「前へ」「次へ」ボタン方式
- 表示テキスト: `全N件中 M-K件を表示`
- ページ番号を URLパラメータ `page` で管理（`nuqs`）

---

## 8. 「管理画面から入会登録」ボタン

- 位置: PageHeader の `actions` スロット
- アイコン: `Plus`
- 遷移先: `/membership-applications/new`（管理画面入会フォーム、FR-M009）
- 権限制御: Headquarter / Manager / Staff のみ表示。Observer・Trainer は非表示（tooltip: 「管理画面から入会登録する権限がありません」）

---

## 9. APIスキーマ変更（必要フィールド）

> 現在の API スキーマはステータス値が旧体系（`payment_failed` / `pending` / `auto_approved` 等）であり、C-01仕様と乖離している。以下の更新が必要。

### GET `/crm/membership-applications` — クエリパラメータ追加

| パラメータ   | 型                                                           | 説明                         |
| ------------ | ------------------------------------------------------------ | ---------------------------- |
| `status`     | `"未審査" \| "審査中" \| "承認済" \| "否認" \| "取り消し済"` | ステータス絞り込み（更新）   |
| `brand`      | `string?`                                                    | ブランド絞り込み（追加）     |
| `store`      | `string?`                                                    | 店舗絞り込み（追加）         |
| `blacklist`  | `"all" \| "match" \| "no_match"?`                            | BL照合フラグ絞り込み（追加） |
| `date_from`  | `string? (date)`                                             | 申請日レンジ開始（追加）     |
| `date_to`    | `string? (date)`                                             | 申請日レンジ終了（追加）     |
| `sort_by`    | `"application_date"?`                                        | ソート項目（変更）           |
| `sort_order` | `"asc" \| "desc"?`                                           | ソート順                     |
| `page`       | `number?`                                                    | ページ番号（追加）           |
| `limit`      | `number?`                                                    | ページサイズ（維持）         |
| `search`     | `string?`                                                    | 申請ID・氏名検索（維持）     |

### `MembershipApplication` レスポンス型 — フィールド追加

| フィールド         | 型                  | 説明                                                         |
| ------------------ | ------------------- | ------------------------------------------------------------ |
| `id`               | `string`            | 申請ID（維持、例: `APP-2026-0001`）                          |
| `applicant_name`   | `string`            | 申請者氏名（維持）                                           |
| `status`           | 新ステータス enum   | 未審査/審査中/承認済/否認/取り消し済（変更）                 |
| `blacklist_match`  | `boolean`           | BL照合結果（追加）                                           |
| `brand_name`       | `string`            | ブランド名（追加）                                           |
| `store_name`       | `string`            | 申請店舗名（追加）                                           |
| `plan_name`        | `string`            | プラン名（維持）                                             |
| `campaign`         | `string`            | キャンペーン名（追加）                                       |
| `application_date` | `string (datetime)` | 申請日時（既存 `applied_at` をリネーム or 追加）             |
| `start_date`       | `string (date)`     | 利用開始日（既存 `scheduled_start_date` をリネーム or 追加） |
| `is_minor`         | `boolean?`          | 未成年フラグ（追加）                                         |
| `is_proxy`         | `boolean?`          | 代理申請フラグ（追加）                                       |

### 削除（または非推奨化）するフィールド

| フィールド                | 理由                                           |
| ------------------------- | ---------------------------------------------- |
| `risk_score`              | 新UIにリスクスコア列なし（BL照合フラグに統合） |
| `risk_reason`             | 同上                                           |
| `elapsed_time`            | 新UIに経過時間列なし                           |
| `payment_failed_deadline` | 新ステータス体系に統合                         |
| `pending_deadline`        | 同上                                           |

### GET `/crm/membership-applications/summary`

- **削除対象**: 新UIでサマリAPIは使用しない。KPIはフロント側でリストデータから計算する。

---

## 10. 権限マトリクス（画面内操作）

| ロール      | 一覧表示   | フィルター使用                        | 管理画面入会登録ボタン |
| ----------- | ---------- | ------------------------------------- | ---------------------- |
| Headquarter | ○ 全店舗   | ○（ブランド・店舗フィルター含む）     | ○                      |
| Manager     | ○ 管轄店舗 | ○（ブランド・店舗フィルター含む）     | ○                      |
| Staff       | ○ 所属店舗 | ○（ブランド・店舗フィルターは非表示） | ○                      |
| Observer    | ○ 所属店舗 | ○                                     | ✕（tooltip表示）       |
| Trainer     | ✕          | ✕                                     | ✕                      |

---

## 11. 空状態（Empty State）

- 絞り込み結果0件の場合: テーブル内に「条件に一致する申請がありません」＋「フィルターをクリア」ボタン
- データなし（初回・申請0件）の場合: 同様のエンプティステート表示

---

## 12. 既存スペック・実装との主な変更点まとめ

| 変更種別       | 旧                                                                                  | 新                                              |
| -------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| ステータス値   | `payment_failed / pending / auto_approved / manual_approved / rejected / cancelled` | `未審査 / 審査中 / 承認済 / 否認 / 取り消し済`  |
| KPI指標        | 自動承認率・平均処理時間・総入会件数                                                | 未審査件数・BL要注意件数・未成年件数            |
| レイアウト     | タブ型（ステータスごと）                                                            | 単一テーブル＋フィルターパネル                  |
| ページング     | 無限スクロール                                                                      | ページネーション（前へ/次へ）                   |
| リスク表示     | `risk_score` + `risk_reason` 数値スコア                                             | `blacklist_match` boolean フラグ + BL一致バッジ |
| 行のアクション | インラインボタン（承認/却下/詳細）                                                  | 行クリックで詳細遷移のみ                        |

---

## 13. 未解決事項 — 解消済み ✅

### Q1. 店舗スコープの取得方法

**調査結果**:

- JWT トークンには `role` / `store_id` は含まれていない（現在の `accessTokenPayload` は `sub`, `email`, `company_id` のみ）
- 既存の members ページ（参照実装）では `store_id` はフィルタークエリパラメータとして渡す方式を採用。`src/app/(private)/members/_hooks/use-members-filters.ts` で `store_id: parseAsArrayOf(parseAsString)` として URL 管理
- プロトタイプの `useCurrentUser` / `currentStoreId === "all"` パターンは **このリポジトリには存在しない**

**解決方針**:

- 店舗スコープの自動制御（Staff は所属店舗のみ等）は **現フェーズでは実装しない**。全件表示をデフォルトとし、ユーザーが店舗フィルターで手動絞り込む方式に統一する（members ページと同じ設計）
- 「全店舗ビュー時のみブランド・店舗フィルターを表示」という条件は撤廃。両フィルターを常時表示する
- 将来的なロールベース自動スコーピングは Phase 2 対応とする

---

### Q2. APIスキーマの後方互換性

**調査結果**:

- 詳細画面（`[id]/page.tsx` および関連 `_components`）は既存の `MembershipApplication` 型（`risk_score`, `risk_reason`, `applied_at`, `pending_deadline` 等）を直接使用している
- `/crm/membership-applications/[id]` のレスポンス型も独立したスキーマ（`MembershipApplicationDetails`）になっており、一覧用と詳細用で型が分かれている

**解決方針**:

- **破壊的変更を採用する**（モックのみのため後方互換性リスクが低い）
- 一覧用のスキーマ・型（`MembershipApplication` / `GetMembershipApplicationsResponse`）を新仕様に全面書き換え
- 詳細用スキーマ（`MembershipApplicationDetails`）は別途 C-01-01 のスペックで扱うため、**今回は変更しない**
- 削除フィールド（`risk_score`, `risk_reason`, `elapsed_time`, `payment_failed_deadline`, `pending_deadline`）は一覧スキーマから除去。詳細スキーマには残す

---

### Q3. モックDBの更新範囲

**調査結果**:

- `_mock-db.ts` の `MembershipApplication` 型（インポート元: `_schemas/membership-application.schema.ts`）は Zod スキーマ由来の型であり、スキーマを書き換えれば型は自動追従する
- 既存の `_applications` シードデータは `risk_score`, `risk_reason`, `status: 'pending'` 等の旧フィールドを保持
- 新フィールド（`blacklist_match`, `brand_name`, `store_name`, `campaign`, `start_date`, `is_minor`）はシードに存在しない

**解決方針**:

- `_mock-db.ts` の `membershipApplications._applications` シードデータを新フィールドに合わせて全面更新する
- プロトタイプ（`enrollment-application-list.tsx`）の `APPLICATIONS` モックデータ（19件）をベースにシードを作成する
- 旧フィールド（`risk_score`, `risk_reason` 等）はシードから削除する

---

### Q4. `/summary` エンドポイントの削除タイミング

**調査結果**:

- `/crm/membership-applications/summary` を呼び出している箇所を全ファイル横断検索した結果:
  - `membership-applications-overview.tsx` — `getCrmMembershipApplicationsSummaryOptions()`
  - `membership-applications-section.tsx` — `getCrmMembershipApplicationsSummaryOptions()`
  - `approve-application-modal.tsx` — `getCrmMembershipApplicationsSummaryQueryKey()` (invalidate用)
  - `reject-application-modal.tsx` — `getCrmMembershipApplicationsSummaryQueryKey()` (invalidate用)
- **他の画面（ダッシュボード等）からは呼び出されていない**。上記4ファイルはすべて今回の改修スコープ内

**解決方針**:

- 今回の改修で `membership-applications-overview.tsx`・`membership-applications-section.tsx`・`approve-application-modal.tsx`・`reject-application-modal.tsx` を削除（または全面置換）するため、`/summary` エンドポイントへの参照も同時に消える
- API エンドポイント自体（`src/app/api/crm/membership-applications/summary/route.ts`）は **削除する**（`_routes/index.ts` のインポートも合わせて削除）
- 生成ファイル（`lib/api/`）は `npm run generate-api` で再生成する

---

## 14. UIプロトタイプ照合メモ

- **UIソース**: `fitness-crm-ui/src/pages/enrollment-application-list.tsx`
- **スペックソース**: `fitness-crm-ui/public/requirements/C-01.md` (260410_v2)
- **照合日**: 2026-05-05
- プロトタイプにある `useCurrentUser` / `RoleGatedButton` / `navigate` / `SharedHeader` / `SharedSidebar` / `PageHeader` は、このリポジトリの対応コンポーネントにマッピングして実装する
- プロトタイプの `Popover render={}` API は Radix v1 の書き方。このリポジトリの `Popover` コンポーネントの API に合わせて調整が必要

---

## ハンドオフ

すべての未解決事項が解消されました。スペックを確認・承認後、次のステップに進んでください:

```
次のエージェント: speckit.plan
タスク: 上記スペックをもとに技術計画（コンポーネント構成・API変更・データモデル）を策定する
```
