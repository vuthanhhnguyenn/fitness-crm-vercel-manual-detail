# SDD 開発ワークフロー — Fitness CRM

> Fitness CRM プロジェクトにおける、**SpecKit**（GitHub Copilot）を使ったAI支援開発フロー。
> 参照: [sdd-sequence-flow.md](./sdd-sequence-flow.md) | [constitution.md](../.specify/memory/constitution.md)

---

## 概要

```
PO / PM → 機能アイデア
    |
    v
[Phase 1] キックオフ & ハンドオフ ──── プロトタイプ + 画面フロー + 仕様素材を feature ブランチへコミット
    |
    v
Feature Branch (###-feature-name)
    |
    v
[Phase 2] FE: 仕様分析 & 実装
    |
    ├─ speckit.specify ──── spec.md（ドラフト）
    ├─ speckit.clarify ──── spec.md（最終化、[NEEDS CLARIFICATION] 解消）
    ├─ speckit.plan    ──── plan.md · research.md · data-model.md · api-contracts/
    ├─ speckit.tasks   ──── tasks.md
    ├─ speckit.analyze ──── 整合性レポート（spec / plan / tasks）
    └─ speckit.implement── コード + テスト
```

---

## Phase 1: キックオフ & ハンドオフ

PO/PM がプロトタイプ、画面フロー、仕様素材を feature ブランチへコミットし、チームへ通知する。

### ブランチ命名

```
###-feature-name
# 例: 001-staff-list
```

### コミット対象

| 資産                               | 配置先             |
| ---------------------------------- | ------------------ |
| Prototype（HTML または Figma URL） | `specs/<feature>/` |
| Flow screens（PNG / Figma）        | `specs/<feature>/` |
| Spec assets（Markdown メモ）       | `specs/<feature>/` |

---

## Phase 2: FE 仕様分析 & 実装

### Step 1 — 仕様ドラフト（`speckit.specify`）

機能説明とコミット参照を渡して `spec.md` を生成。

**出力:** `specs/<feature>/spec.md`（ドラフト）

### Step 2 — 明確化（`speckit.clarify`）

未確定事項を最大5件まで質問し、すべて解消してから次へ進む。

**出力:** `specs/<feature>/spec.md`（最終化）

### Step 3 — 実装計画（`speckit.plan`）

**出力:**

- `specs/<feature>/plan.md`
- `specs/<feature>/research.md`
- `specs/<feature>/data-model.md`
- `specs/<feature>/contracts/api-contracts.md`

### Step 4 — タスク分解（`speckit.tasks`）

**出力:** `specs/<feature>/tasks.md`

### Step 5 — 整合性分析（`speckit.analyze`）

`spec.md` / `plan.md` / `tasks.md` の整合性を読み取り専用で検査。

- Constitution違反は **CRITICAL**（修正必須）
- 不整合・欠落は **HIGH / MEDIUM**（修正または根拠記録）

### Step 6 — 実装（`speckit.implement`）

`tasks.md` の順序に従って実装。必須順序:

1. Data Layer
2. API Routes（`generate-openapi` → `generate-api`）
3. UI Components
4. Validation（`type-check` / `lint` / `build` / 手動テスト）

---

## Phase 3: BE 連携 & FE-BE 契約QA

FE が `api-contracts/` を BE に引き渡し、実API実装後に `openapi.json` を確定。

**Review Gate 2:** FE + BE で契約一致を確認。

---

## Phase 4: FE 実API統合

1. `speckit.plan` で統合計画を作成
2. `speckit.implement` で統合実装
3. `loading / error / empty / success` の4状態を確認

---

## Phase 5: QC システムテスト

| 入力                     | 提供元  |
| ------------------------ | ------- |
| 統合済みテストビルド     | FE Dev  |
| `spec.md` + 受け入れ基準 | PO / PM |

---

## Phase 6: バグトリアージ & 修正

FEバグの場合の流れ:

1. `speckit.specify` で bug scope を `spec.md` に反映
2. 必要時は PO に仕様変更判断をエスカレーション
3. `speckit.tasks` で `tasks-bug.md` 生成
4. `speckit.implement` で修正実施

---

## Phase 7: 検証 & リリース

QC再検証後、PO/PM が MR 承認し、main / release ブランチへマージして本番反映。

---

## Definition of Done（抜粋）

- `npm run type-check` が 0 エラー
- `npm run lint` が 0 エラー
- 契約テストが全通過
- Constitution Check が明示的に pass / N/A / 例外理由つき
- QC サインオフ完了
