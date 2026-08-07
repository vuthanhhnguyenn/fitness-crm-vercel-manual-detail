# Spec: 利用履歴タブ（A-01-01-e）

> **Screen ID**: A-01-01-e
> **Feature ID**: A-01-01-e
> **Branch**: `feat/member-detail-usage-history`
> **Status**: ✅ **Clarified** (All NEEDS CLARIFICATION items resolved)
> **Date Created**: 2026-04-23
> **Date Clarified**: 2026-04-23
> **Author**: speckit.specify / speckit.clarify

---

## 概要

| 項目             | 内容                                          |
| ---------------- | --------------------------------------------- |
| 画面名           | 利用履歴【タブ】                              |
| 階層             | L3（A-01 会員管理 > A-01-01 会員詳細 > タブ） |
| 要件ID           | A-01 FR-010                                   |
| 機能ID           | A-01-01-e                                     |
| ブランド適用範囲 | JOYFIT / FIT365 共通                          |
| 関連機能         | B-01 入退館管理 / D-01 レッスン管理           |

### 機能の目的

会員詳細画面（A-01-01）の「利用履歴」タブを FR-010 仕様に準拠した形にリデザインする。  
スタッフが会員対応中にその場で入退館履歴・レッスン予約状況・入退館設定（ゲートストップ含む）を一覧参照できるようにし、業務効率と対応品質を向上させる。

---

## 対象画面の位置づけ

```
A-01-01 会員詳細
  ├── [ヘッドアップ] 会員情報・ステータス変更
  └── [タブ領域]
        ├── 基本情報
        ├── 契約操作
        ├── 支払い履歴
        ├── 利用履歴  ← 本スペック対象（既存タブのリデザイン）
        ├── ポイント履歴
        ├── トレーニング記録
        ├── サービス利用履歴
        ├── コミュニケーション
        ├── 変更履歴
        └── 関係者情報
```

---

## スコープ

本スペックは **FR-010 利用履歴の参照** を実装するもの。以下3つのセクションを新規に追加する：

| 項目                            | 内容                                                                        |
| ------------------------------- | --------------------------------------------------------------------------- |
| **1. 入退館履歴テーブル**       | 入館/退館バッジ・認証方法カラム、店舗・期間フィルター、ページネーション付き |
| **2. レッスン予約履歴テーブル** | 予約日・レッスン名・担当・参加状態を表示（フィルターなし）                  |
| **3. 入退館設定カード**         | 認証方法・ICカード・QRコード・ゲートストップ設定を右カラムに sticky 表示    |

### 既存機能の取扱

既存の「利用サマリ」「店舗別利用実績」「利用パターン分析」カードは **本スペック外** として扱う。  
本実装では削除される想定。

---

## 画面レイアウト

```
┌──────────────────────────────────────────────────────────────┐
│  [利用履歴 タブ]                                              │
│                                                              │
│  ┌─────────────────────────────────┐  ┌──────────────────┐  │
│  │  入退館履歴 [カード]            │  │ 入退館設定       │  │
│  │  フィルター: [店舗▼] [期間▼]   │  │ 認証方法: QRコード│  │
│  │  ─────────────────────────────  │  │ ICカード番号: -- │  │
│  │  日時 | 店舗 | 種別 | 認証方法  │  │ QRコード: --     │  │
│  │  ...                            │  │ ゲートストップ:   │  │
│  │  [件数] [前へ] [次へ]          │  │  設定なし / 設定中│  │
│  └─────────────────────────────────┘  │  [解除] ボタン   │  │
│                                        └──────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────┐                         │
│  │  レッスン予約履歴 [カード]      │                         │
│  │  日付 | レッスン名 | 担当 | 状態 │                         │
│  │  ...                            │                         │
│  └─────────────────────────────────┘                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## セクション別仕様

### 1. 入退館履歴カード

#### 1-1. フィルターコントロール

| コントロール   | 型         | 選択肢                                                            | デフォルト |
| -------------- | ---------- | ----------------------------------------------------------------- | ---------- |
| 店舗フィルター | `<Select>` | **全店舗** / レスポンス内 `storeUsage` から動的に抽出した店舗一覧 | 全店舗     |
| 期間フィルター | `<Select>` | 今月 / 先月 / 過去3ヶ月 / 過去6ヶ月                               | 今月       |

- フィルター変更時は即時再フェッチ（クエリパラメーター `store` / `period` をAPIに渡す）
- 店舗セレクトの選択肢は API レスポンスの `storeUsage` 配列の `store_id` / `store_name` をマッピングして生成する
- 「全店舗」選択時は `store=all`（またはパラメーター省略）をAPIに渡す
- フィルター状態は URL search params で保持しない（ローカル state で管理）

#### 1-2. テーブル定義

| カラム   | ソースフィールド     | 型                  | 備考                                                                                               |
| -------- | -------------------- | ------------------- | -------------------------------------------------------------------------------------------------- |
| 日時     | `entry_time`         | 日時文字列          | 来館時刻を `yyyy/MM/dd HH:mm` 形式で表示                                                           |
| 店舗     | `store_name`         | 文字列              |                                                                                                    |
| 種別     | type（判定ロジック） | `"入館"` / `"退館"` | `exit_time` が null なら「入館」、有値なら「退館」。Badge 表示（下記参照）                         |
| 認証方法 | `entry_method`       | 文字列              | 例: `qr_code` / `ic_card` / `face_recognition`。UI上は「QRコード」「ICカード」「顔認証」に変換表示 |

**種別バッジデザイン（UI プロトタイプ準拠）**

| 値   | スタイル                                                                         |
| ---- | -------------------------------------------------------------------------------- |
| 入館 | `variant="outline"` + `bg-info/15 text-info border-info/20` + `<LogIn>` アイコン |
| 退館 | `variant="outline"` + デフォルト色 + `<LogOut>` アイコン                         |

> `LogIn` / `LogOut` は `lucide-react` のアイコン

#### 1-3. ページネーション

- 1ページあたりの表示件数: **50件**（既存 `TablePagination` コンポーネントを使用）
- ページ情報・総件数はAPIレスポンスの `total` / `page` / `per_page` から取得
- 前へ / 次へ ボタンは先頭・末尾ページでそれぞれ `disabled`

#### 1-4. 空状態

- データ0件の場合: 「該当の入退館履歴がありません。」を表示

---

### 2. レッスン予約履歴カード

#### 2-1. テーブル定義

| カラム     | ソースフィールド  | 型     | 備考                           |
| ---------- | ----------------- | ------ | ------------------------------ |
| 日付       | `lesson_date`     | 日付   | `yyyy/MM/dd` 形式で表示        |
| レッスン名 | `lesson_name`     | 文字列 |                                |
| 担当       | `instructor_name` | 文字列 | `text-muted-foreground` で表示 |
| 状態       | `status`          | 文字列 | Badge 表示（下記参照）         |

**状態バッジデザイン**

| 値         | スタイル                                                             |
| ---------- | -------------------------------------------------------------------- |
| 参加済み   | `variant="outline"` + `bg-success/15 text-success border-success/20` |
| 欠席       | `variant="outline"` + `bg-warning/15 text-warning border-warning/20` |
| キャンセル | `variant="outline"` + `bg-muted text-muted-foreground`               |
| 予約済み   | `variant="outline"` + `bg-info/15 text-info border-info/20`          |

#### 2-2. ページネーション / 空状態

- ページネーションなし（直近の予約履歴を最大50件表示）
- 0件の場合: 「レッスン予約履歴がありません。」を表示

---

### 3. 入退館設定カード（右カラム・sticky）

| 項目           | ソースフィールド      | 備考                                                            |
| -------------- | --------------------- | --------------------------------------------------------------- |
| 認証方法       | `auth_method`         | テキスト表示                                                    |
| ICカード番号   | `ic_card_number`      | `font-mono` フォント。未設定時は `—`                            |
| QRコード       | `qr_code`             | テキスト表示。未設定時は `—`                                    |
| ゲートストップ | `gate_stop` (boolean) | `設定中` / `設定なし` をテキスト表示                            |
| 解除ボタン     | —                     | `gate_stop === true` のときのみ表示。クリックで解除シートを開く |

- このカードは `sticky top-6` で右カラムに固定表示
- ゲートストップ解除ボタンのクリックは、既存の `handleGateStopSetting` アクション（`page.tsx` 側）に委譲

---

## API 仕様

### 既存エンドポイント（変更）

#### `GET /crm/members/{id}/usage-history`

**現在のレスポンス構造に `lessonReservations` と `memberAccessSettings` を追加する：**

```ts
// 既存（維持）
summary: { total_visits, average_stay_time, last_visit_date, frequent_time_slot, frequent_day_of_week }
storeUsage: StoreUsageRow[]
visitRecords: VisitRow[]

// 変更
visitRecords: VisitRow[]   // ← stay_time, exit_time を追加。entry_method フィールド名を統一

// 新規追加
lessonReservations: LessonReservationRow[]  // ← レッスン予約履歴
memberAccessSettings: MemberAccessSettings  // ← 入退館設定
```

**APIレスポンス例**

```json
{
  "summary": {
    /* 既存 */
  },
  "storeUsage": [
    /* 既存 */
  ],
  "visitRecords": [
    {
      "id": "vr-001",
      "entry_time": "2026-04-23T18:00:00Z",
      "exit_time": "2026-04-23T19:30:00Z",
      "stay_time": 90,
      "store_id": "store-001",
      "store_name": "JOYFIT渋谷店",
      "entry_method": "qr_code"
    }
  ],
  "lessonReservations": [
    {
      "id": "lr-001",
      "lesson_date": "2026-04-23",
      "lesson_name": "ボクシング基礎",
      "instructor_name": "田中太郎",
      "status": "参加済み"
    }
  ],
  "memberAccessSettings": {
    "auth_method": "QRコード",
    "ic_card_number": null,
    "qr_code": "QR123456789",
    "gate_stop": false
  }
}
```

**クエリパラメーター（新規追加）**

| パラメーター | 型     | 必須 | 説明                                                       | デフォルト   |
| ------------ | ------ | ---- | ---------------------------------------------------------- | ------------ |
| `store`      | string | No   | 店舗ID。会員の過去利用店舗でフィルタリング。`all` で全店舗 | `all`        |
| `period`     | string | No   | `this_month` / `last_month` / `3months` / `6months`        | `this_month` |

**型定義の追加（`types.gen.ts` に追記）**

```ts
export type VisitRow = {
  id: string;
  entry_time: string; // ISO8601
  exit_time: string | null; // ISO8601 or null（退館未記録）
  stay_time?: number; // 分単位
  store_id: string;
  store_name: string;
  entry_method: string; // 'qr_code' | 'ic_card' | 'face_recognition' など
};

export type LessonReservationRow = {
  id: string;
  lesson_date: string; // YYYY/MM/DD
  lesson_name: string;
  instructor_name: string;
  status: '参加済み' | '欠席' | 'キャンセル' | '予約済み';
};

export type MemberAccessSettings = {
  auth_method: string;
  ic_card_number: string | null;
  qr_code: string | null;
  gate_stop: boolean;
};
```

> 生成ファイル（`lib/api/types.gen.ts` / `lib/api/@tanstack/react-query.gen.ts`）は `npm run generate-api` で再生成する。モックDBおよびスキーマを先に更新してから実行すること。

---

## モックDB更新

`src/app/api/_mock-db.ts` に以下のシードデータを追加する：

| テーブル               | 追加内容                                                   |
| ---------------------- | ---------------------------------------------------------- |
| `memberVisitRecords`   | 既存エントリに `exit_time` / `auth_method` / `type` を追加 |
| `lessonReservations`   | 会員ごとのレッスン予約履歴 10件程度                        |
| `memberAccessSettings` | 認証方法 / ICカード番号 / QRコード / gate_stop フラグ      |

---

## コンポーネント設計

```
usage-history-tab/
  index.tsx              ← 既存ファイル。レイアウトをリデザイン
  columns.tsx            ← 既存ファイル。VisitRow カラムに exit_time / auth_method / type を追加
  entry-exit-table.tsx   ← 新規。フィルター + テーブル + ページネーションをまとめたコンポーネント
  lesson-table.tsx       ← 新規。レッスン予約履歴テーブルコンポーネント
  access-settings-card.tsx ← 新規。入退館設定サイドカード
```

### props 設計

```ts
// index.tsx（UsageHistoryTab）
interface UsageHistoryTabProps {
  memberId: string;
  onGateStopAction: () => void; // ← 追加。ゲートストップ解除シートを開く
}

// entry-exit-table.tsx
interface EntryExitTableProps {
  records: VisitRow[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  storeFilter: string;
  periodFilter: string;
  onStoreFilterChange: (v: string) => void;
  onPeriodFilterChange: (v: string) => void;
}

// lesson-table.tsx
interface LessonTableProps {
  reservations: LessonReservationRow[];
}

// access-settings-card.tsx
interface AccessSettingsCardProps {
  settings: MemberAccessSettings;
  onGateStopRelease: () => void;
}
```

---

## 状態管理

| 状態                     | 管理方法                       |
| ------------------------ | ------------------------------ |
| 店舗フィルター           | `useState`（ローカル）         |
| 期間フィルター           | `useState`（ローカル）         |
| 入退館履歴ページ番号     | `useState`（ローカル）         |
| サーバーデータ           | `useQuery` (React Query)       |
| ゲートストップ解除シート | `page.tsx` の既存 state に委譲 |

---

## エラーハンドリング

| ケース             | 挙動                                                       |
| ------------------ | ---------------------------------------------------------- |
| APIエラー          | `DataStateBoundary` の `isError` 表示 + 手動リトライボタン |
| データ0件          | 各テーブルに空状態メッセージを表示                         |
| ゲートストップなし | 「解除」ボタンを非表示                                     |

---

## 権限

| ロール      | 閲覧 | ゲートストップ解除操作 |
| ----------- | ---- | ---------------------- |
| Headquarter | ✅   | ✅                     |
| Manager     | ✅   | ✅                     |
| Staff       | ✅   | ✅（自店舗のみ）       |
| Observer    | ✅   | ❌                     |

> 権限制御の詳細は Y-01 スタッフ・権限管理に従い、API側でスコープチェックを行う。

---

## 受け入れ基準（Acceptance Criteria）

1. 利用履歴タブを開くとローディング→データ表示が3秒以内に完了する
2. 入退館履歴テーブルに 日時・店舗・種別（バッジ）・認証方法 が表示される
3. 入館バッジは `info` 色 + `LogIn` アイコン、退館バッジはデフォルト色 + `LogOut` アイコンで表示される
4. 店舗フィルター・期間フィルターを変更すると入退館履歴が絞り込まれる
5. 入退館履歴のページネーションが正しく動作する（前へ/次へ・先頭/末尾で disabled）
6. レッスン予約履歴テーブルに 日付・レッスン名・担当・状態バッジ が表示される
7. 入退館設定カードに 認証方法・ICカード番号・QRコード・ゲートストップ状態 が表示される
8. ゲートストップが `true` のとき「解除」ボタンが表示され、クリックで解除シートが開く
9. ゲートストップが `false` のとき「解除」ボタンは非表示
10. 既存の利用サマリ・店舗別利用実績・利用パターン分析カードが左カラムの下部に引き続き表示される
11. APIエラー時はエラーメッセージと手動リトライボタンが表示される

---

## Clarifications（Session 2026-04-23）

### Q1: 入退館履歴の表示単位は？

**Q**: 入退館履歴の1行は「入館イベント」と「退館イベント」を別行で表示するか、1セッション（入館+退館）を1行で表示するか？

**A**: **1セッション（入館+退館）を1行で表示する**。  
UI プロトタイプ（`member-detail.tsx` L1078〜）および既存実装（`usage-history/columns.tsx`）では、`entry_time` / `exit_time` / `stay_time` を同一行に表示。日時カラムには `entry_time` を表示し、別カラムで `exit_time` と滞在時間を表示する。

---

### Q2: 期間フィルターの「今月」の定義は？

**Q**: 期間フィルターの「今月」はカレンダー月（4月1日〜4月30日）か、直近30日か？

**A**: **カレンダー月（当月1日〜当月末日）** を採用。  
UI プロトタイプのセレクト選択肢（「今月」「先月」「過去3ヶ月」「過去6ヶ月」）から、「今月」 = 当月カレンダー月と判断。支払い履歴タブ（先行実装）の期間フィルター定義も同様。

---

### Q3: 店舗フィルターの選択肢は？

**Q**: 店舗フィルターのドロップダウン選択肢は会員が過去に利用した店舗だけか、全店舗か？

**A**: **会員が過去に利用したことのある店舗のみ**（ + 「全店舗」オプション）。  
UI プロトタイプに「全店舗」「JOYFIT渋谷店」「JOYFIT新宿店」「FIT365横浜店」「FIT365川崎店」と明記され、これらは当該会員の `storeUsage` データから抽出される。APIレスポンスの `storeUsage` 配列の `store_id` / `store_name` をセレクト選択肢として動的に構成する。

---

### Q4: レッスン予約履歴のフィルターは必要か？

**Q**: レッスン予約履歴にも期間フィルターや店舗フィルターが必要か？

**A**: **不要**。レッスン予約履歴には期間・店舗フィルターを設けない。  
FR-010 仕様および UI プロトタイプでは、レッスン予約履歴テーブルにフィルターコントロールの記載がなく、単純に「予約日・レッスン名・担当・状態」を表示する。最大50件を降順（新しい順）で表示。

---

### Q5: 入退館設定データの提供元エンドポイントは？

**Q**: 入退館設定（認証方法・ICカード・QRコード）のデータは `/usage-history` エンドポイントで返すか、別エンドポイントか？

**A**: **同じ `/usage-history` エンドポイント内に含める**。  
既存の `usage-history/route.ts` でもメンバー情報全体を返すパターンに従い、`memberAccessSettings` フィールドをレスポンスに追加する。別エンドポイント化せず、単一呼び出しで全データを取得することで UI フロー効率を改善。

---

### Q6: ゲートストップ解除APIの確認状況は？

**Q**: ゲートストップ解除操作のAPIは現在どのエンドポイントに対応しているか？

**A**: **既存の `PUT /crm/members/{id}` で更新可能**。  
会員詳細ページ（`page.tsx`）の `handleGateStopSetting` アクションハンドラーは既に実装済み。解除ボタンクリック時は同シートを開く（既存の `showGateStopReleaseSheet` state）。新規コンポーネント（`access-settings-card.tsx`）では `onGateStopRelease` prop 経由で既存の`page.tsx`側シートハンドラーに委譲し、重複実装を避ける。

---

## 結論

上記 6 項目の解決により、以下が確定した：

| 項目               | 決定事項                                                           |
| ------------------ | ------------------------------------------------------------------ |
| 履歴の表示単位     | 1セッション（入館+退館）を1行                                      |
| 期間フィルター     | カレンダー月ベース                                                 |
| 店舗フィルター     | 会員の過去利用店舗 + 全店舗                                        |
| レッスンフィルター | なし（表示のみ）                                                   |
| API設計            | 単一 `/usage-history` エンドポイント + `memberAccessSettings` 追加 |
| ゲートストップ操作 | 既存ハンドラーに委譲                                               |

実装進行は **speckit.plan** ステップへ進行可能。

---

## UI プロトタイプ参照

| 参照先          | パス                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| UI プロトタイプ | `.cache/remote-ui/fitness-crm-ui/src/pages/member-detail.tsx` — `UsageTab` コンポーネント（L1022〜L1185） |
| 外部仕様        | `.cache/remote-spec/fitness-spec/crm/requirements/A-01.md` — FR-010（L429〜L437）                         |

---

## 関連ドキュメント

- [A-01 機能要件定義書](../../../../.cache/remote-spec/fitness-spec/crm/requirements/A-01.md)
- [支払い履歴タブ spec](../payment-history/spec.md) ← 同タブの先行実装例
