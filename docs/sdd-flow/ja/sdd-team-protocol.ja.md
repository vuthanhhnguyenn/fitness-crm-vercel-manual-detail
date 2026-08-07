# SDD チームプロトコル — Fitness CRM

> Fitness CRM チーム向けのツール非依存開発プロトコル。  
> 各メンバーはローカルで使うAIツールに関係なく、同一の仕様・タスク成果物を基準に開発する。  
> 参照: [sdd-dev-workflow.md](./sdd-dev-workflow.md) | [sdd-overview.md](./sdd-overview.md)

---

## 1. なぜツール非依存プロトコルが必要か

チーム内で GitHub Copilot / Cursor / Claude など異なるツールを使っても、以下を守るため:

```
悪い状態:
  [共有ドキュメントなし] → 各自が別々のプロンプト運用
                       → 属人知識、ツール依存コンテキスト、判断喪失

良い状態:
  [spec.md + plan.md + tasks.md] → GitHub Copilot利用者
                                  → Cursor利用者
                                  → Claude利用者
  ドキュメントを真実源にし、ツールは交換可能にする
```

---

## 2. 情報アーキテクチャ（4象限）

要件・仕様はそれぞれ **stock（恒常）** と **flow（機能単位）** で管理する。

```
                  STOCK（恒常）                      FLOW（機能単位）
            ┌──────────────────────────────┬──────────────────────────────────┐
            │ システム全体の業務意図         │ 変更を起動したトリガー             │
 REQUIRE-   │ ・Fitness CRM の業務ルール     │ ・なぜ今この機能か                 │
 MENTS      │ ・スタッフ業務フロー           │ ・機能に閉じたユーザーストーリー   │
            ├──────────────────────────────┼──────────────────────────────────┤
            │ システム設計マップ             │ 何を変更する必要があるか           │
 SPECIFI-   │ ・アーキテクチャ判断           │ ・API契約差分                      │
 CATION     │ ・コンポーネント関係           │ ・UI/UX要件                        │
            │ ・コーディング規約             │ ・受け入れ基準 / テスト観点        │
            └──────────────────────────────┴──────────────────────────────────┘
```

---

## 3. プロトコルレイヤー

1. **Layer 0 — Constitution** (`.specify/memory/constitution.md`)  
   非交渉原則 I〜V。全エージェント実行で遵守必須。
2. **Layer 1 — Copilot Instructions** (`.github/copilot-instructions.md`)  
   現行スタックと構造。
3. **Layer 2 — Feature Spec** (`specs/<feature>/spec.md`)  
   機能単位の「なぜ + なにを」。
4. **Layer 3 — 実装成果物** (`plan.md` / `tasks.md`)  
   `spec.md` から生成し、実装時に消費。
5. **Layer 4 — レビュープロトコル**  
   4つのレビューゲートで品質を担保。

---

## 4. ドキュメント配置

```
fitness-crm/
├── .specify/memory/
│   └── constitution.md
├── .github/copilot-instructions.md
├── docs/
│   ├── sdd-flow/
│   │   ├── sdd-overview.md
│   │   ├── sdd-dev-workflow.md
│   │   └── sdd-sequence-flow.md
│   └── steering/
│       ├── _index.md
│       ├── architecture.md
│       ├── business-glossary.md
│       └── ...
└── specs/
    └── <feature>/
        ├── spec.md
        ├── plan.md
        ├── tasks.md
        ├── research.md
        ├── data-model.md
        └── contracts/api-contracts.md
```

---

## 5. Feature Spec の基本形式

各機能の仕様は `specs/<feature>/spec.md` に置く。

- Status: `draft | review | approved | implemented`
- Branch: `###-<feature-name>`
- Requirements（背景・ユーザーストーリー・制約）
- Specification（スコープ・API契約・UI要件・受け入れ基準）
- Connection Points（壊してはいけない既存接続点）
- Constitution Check（I〜V）
- Post-Implementation Notes

**重要ルール:** `spec.md` が `approved` になるまでコードコミット禁止。

---

## 6. Review Gates

### Gate 1 — Spec Approved

- Owner: PO + BA（with Dev）
- 条件: `[NEEDS CLARIFICATION]` 全解消、仕様PR提出済み

### Gate 2 — Contract Finalized

- Owner: FE Dev + BE Dev
- 条件: BE が `openapi.json` をコミット

### Gate 3 — QC Sign-off

- Owner: QC → PO
- 条件: 統合ブランチに対してテスト完了

### Gate 4 — MR Approved

- Owner: PO / PM
- 条件: QCサインオフ + MRレビュー完了

---

## 7. AIツール別コンテキスト注入

| ツール           | 常時読み込み（Stock）                                  | 機能ごと（Flow）           |
| ---------------- | ------------------------------------------------------ | -------------------------- |
| GitHub Copilot   | `.github/copilot-instructions.md` + `.specify/memory/` | `specs/<feature>/spec.md`  |
| Cursor           | `.specify/memory/` + `.github/copilot-instructions.md` | `@specs/<feature>/spec.md` |
| Claude           | copilot instructions + constitution + steering 要約    | `spec.md` 本文             |
| 任意のチャットAI | stock文脈を貼り付け                                    | `spec.md` を貼り付け       |

---

## 8. 更新ルール（要点）

- Constitution: 新原則追加は提案・承認プロセス必須
- Steering (`docs/steering/`): 新しい再発パターンや用語は追記（既存内容の削除・書き換えはしない）
- Feature Spec: 仕様誤りは先にspec PRを出してから実装再開
- Copilot Instructions: スタックや構造の変更時に即更新

---

## 9. 典型的な失敗と対策

| 失敗                               | 根本原因                   | 対策                                                       |
| ---------------------------------- | -------------------------- | ---------------------------------------------------------- |
| 以前の判断と矛盾したコード生成     | 実装前に spec 未読込       | `spec.md` を必ず添付して実行                               |
| `speckit.analyze` が CRITICAL 検出 | 原則I〜V未確認             | 承認前に Constitution Check を埋める                       |
| `types.gen.ts` と Zod の乖離       | コード生成パイプライン省略 | `generate-openapi` → `generate-api` を徹底                 |
| フィルター状態の同期ずれ           | Providerパターン不遵守     | `docs/steering/architecture.md` の Provider パターンに従う |

---

## 10. 新メンバーのオンボーディング

1. `sdd-overview.md` を読む（なぜSDDか）
2. `constitution.md` を読む（非交渉ルール）
3. `docs/steering/_index.md` と `docs/steering/architecture.md` を読む（全体パターンと構造）
4. `sdd-sequence-flow.md` を読む（全体フロー）
5. `sdd-dev-workflow.md` を読む（フェーズ詳細）
6. 完了済み機能例（`specs/staff-management/`）を確認
7. 使用ツールでセクション7のコンテキスト注入を設定

---

_作成日: 2026-04-14_  
_Tools: SpecKit · GitHub Copilot · Next.js 16 · TypeScript 5 · Zod_
