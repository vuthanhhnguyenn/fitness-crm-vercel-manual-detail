# SDD シーケンスフロー

> **SpecKit** AIエージェントを使ったエンドツーエンドの開発フロー。  
> 役割: PO/PM · FE Dev · BE Dev · QC · SpecKit Agent · Git Repo

---

## フロー概要

```
Phase 1 – キックオフ & ハンドオフ
    ↓ feature ブランチ + prototype + spec assets をコミット
Phase 2 – FE: 仕様分析 & 実装 [speckit.specify → speckit.clarify → speckit.plan → speckit.tasks → speckit.analyze → speckit.implement]
    ↓ spec.md + plan.md + tasks.md + mock API付きUI
Phase 3 – BE 連携 & FE-BE 契約QA
    ↓ openapi.json（確定）
Phase 4 – FE: 実API統合 [speckit.plan → speckit.implement]
    ↓ 統合済みブランチ
Phase 5 – QC: システムテスト
    ↓ サインオフ or バグレポート
Phase 6 – バグトリアージ & 修正 [speckit.specify → speckit.tasks → speckit.implement]
    ↓ fix ブランチ
Phase 7 – 検証 & リリース
    ↓ 本番デプロイ
```

---

## シーケンス図

```mermaid
sequenceDiagram
    autonumber
    actor PO as PO / PM
    actor FE as FE Dev
    actor BE as BE Dev
    actor QC as QC
    participant SK as SpecKit Agent
    participant GIT as Git Repo

    rect rgb(255, 243, 220)
        Note over PO,GIT: Phase 1 – キックオフ & ハンドオフ
        PO->>GIT: prototype + flow screens + spec assets をコミット
        PO-->>FE: feature ブランチ準備完了を通知
        PO-->>BE: spec assets 利用可能を通知
        PO-->>QC: テスト計画用に spec 準備完了を通知
    end

    rect rgb(220, 245, 235)
        Note over PO,GIT: Phase 2 – FE: 仕様分析 & 実装
        FE->>SK: [speckit.specify] commit ref + feature description を渡す
        SK->>GIT: spec assets + prototype を pull / diff
        SK->>GIT: draft spec.md を生成（[NEEDS CLARIFICATION] 付き）

        FE->>SK: [speckit.clarify] 不明点を解消
        loop 各質問（最大10ラウンド）
            SK->>FE: 明確化質問
            FE->>PO: 必要時に相談
            FE-->>SK: 回答
        end

        SK->>GIT: spec.md を更新（全 [NEEDS CLARIFICATION] 解消）
        FE->>PO: spec review を依頼
        PO-->>GIT: spec 承認

        FE->>SK: [speckit.plan] 実装計画生成
        SK->>GIT: plan.md + research.md + data-model.md + api-contracts/ 生成

        FE->>SK: [speckit.tasks] タスク分解
        SK->>GIT: tasks.md 生成

        FE->>SK: [speckit.analyze] 仕様整合チェック
        SK-->>FE: 分析レポート返却

        FE->>SK: [speckit.implement] tasks.md を実行
        SK-->>FE: 実装コード + レビューノート
        FE->>GIT: mock API付きUIを push
    end

    rect rgb(220, 232, 250)
        Note over PO,GIT: Phase 3 – BE 連携 & FE-BE 契約QA
        FE->>BE: api-contracts/ を引き渡し
        BE->>FE: エンドポイント / 型 / 認証 / エラーを確認
        BE-->>FE: openapi.json（実API）を返却
        BE-->>GIT: openapi.json をコミット
    end

    rect rgb(220, 245, 235)
        Note over PO,GIT: Phase 4 – FE: 実API統合
        FE->>SK: [speckit.plan] openapi.json から統合計画生成
        SK->>GIT: plan-integrate-api.md + tasks-integrate-api.md 生成
        FE->>SK: [speckit.implement] 統合タスク実行
        SK-->>FE: 統合コード + レビューノート
        FE->>GIT: 統合ブランチを push
    end

    rect rgb(252, 230, 220)
        Note over PO,GIT: Phase 5 – QC: システムテスト
        FE->>QC: 統合済みビルドを提供
        PO->>QC: spec.md + 受け入れ基準を提供
        QC-->>FE: バグ報告、またはサインオフ
    end

    rect rgb(220, 245, 235)
        Note over PO,GIT: Phase 6 – バグトリアージ & 修正
        QC-->>FE: バグ割当
        alt BE担当バグ
            FE->>BE: バグ報告 + 根拠を引き渡し
        else FE担当バグ
            FE->>SK: [speckit.specify] bug scope を spec.md に反映
            FE->>SK: [speckit.tasks] tasks-bug.md を生成
            FE->>SK: [speckit.implement] 修正実施
            FE->>GIT: fix ブランチを push
        end
        FE-->>QC: 再検証依頼
    end

    rect rgb(225, 245, 220)
        Note over PO,GIT: Phase 7 – 検証 & リリース
        QC-->>PO: 再テスト合格を報告
        PO->>GIT: MR 承認して main / release にマージ
        GIT-->>PO: 本番デプロイ完了
    end
```

---

## Review Gates

| Gate                          | Phase   | 条件                                         | オーナー     |
| ----------------------------- | ------- | -------------------------------------------- | ------------ |
| ★ Gate 1 – Spec Approved      | Phase 2 | 全 `[NEEDS CLARIFICATION]` 解消 + PO/PM 承認 | PO / PM      |
| ★ Gate 2 – Contract Finalized | Phase 3 | 契約確認完了 + `openapi.json` コミット       | FE + BE + PO |
| ★ Gate 3 – QC Sign-off        | Phase 5 | テストケース全通過                           | QC → PO      |
| ★ Gate 4 – MR Approved        | Phase 7 | 再テスト合格 + MR 承認                       | PO / PM      |
