# Fitness CRM Business Glossary

> Japanese business terms → English / technical mapping.
> For AI agents to understand requirements and map them to system components.
> For actors/roles, see [user-personas.md](./user-personas.md). For brand differences, see [architecture.md](./architecture.md).

---

## Member-related

| Japanese       | English          | Description                               | Module     |
| -------------- | ---------------- | ----------------------------------------- | ---------- |
| 会員           | Member           | Person with active primary contract       | A-01       |
| ユーザーID     | User ID          | New system identifier (auto-generated)    | A-01       |
| 旧会員No       | Legacy Member No | Old system identifier (migrated)          | A-01       |
| 通常会員       | Regular Member   | Standard membership with primary contract | A-01       |
| 1Day会員       | 1Day Pass Member | Single-visit ticket purchaser             | A-01       |
| 家族会員       | Family Member    | Dependent member (max 3 per primary)      | A-01       |
| 法人会員       | Corporate Member | Member under corporate contract           | A-01, G-01 |
| ステータス     | Member Status    | Active / Suspended / Withdrawn            | A-01       |
| ゲートストップ | Gate Stop        | Manual entry restriction by staff         | A-01, B-01 |
| ブラックリスト | Blacklist        | Forced withdrawal + unpaid debt list      | A-01, C-01 |

## Membership Status

| Japanese     | English              | Description                          | Module     |
| ------------ | -------------------- | ------------------------------------ | ---------- |
| 有効（通常） | Active               | Normal active membership             | A-01       |
| 休会         | Suspended            | Temporarily paused (still valid)     | A-03       |
| 退会         | Withdrawal           | Terminated membership                | A-03       |
| 退会予定     | Planned Withdrawal   | Scheduled but not executed           | A-03       |
| 強制退会     | Forced Withdrawal    | Auto-withdrawal due to unpaid bills  | A-01, F-01 |
| 移籍         | Transfer             | Change of primary contract store     | A-02       |
| 臨時休会     | Emergency Suspension | Special suspension (disaster, COVID) | A-03       |

## Contract-related

| Japanese             | English          | Description                                                                          | Module     |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------ | ---------- |
| 主契約               | Primary Contract | Base membership agreement                                                            | G-01       |
| オプション           | Option           | Add-on services (locker, water, etc.)                                                | G-02       |
| キャンペーン         | Campaign         | Promotional offers, discounts                                                        | G-03       |
| 契約タイプ           | Contract Type    | general / oneDay / family / kids / student / corporate / welfare / prepaid / special | G-01       |
| 親主契約             | Parent Contract  | Base contract for variations                                                         | G-01       |
| 特殊契約             | Special Contract | Store/region-specific contract                                                       | G-01       |
| 利用開始日           | Usage Start Date | Effective start date of contract                                                     | C-01       |
| 先払い期間           | Prepay Period    | Months required upfront (1–2)                                                        | G-01, C-01 |
| 解約手数料           | Cancellation Fee | Fee for early termination                                                            | A-02       |
| 入会金               | Enrollment Fee   | Initial membership fee                                                               | G-05       |
| プロモーションコード | Promo Code       | Discount code for campaigns                                                          | G-06       |

## Entry/Exit

| Japanese     | English          | Description                                   | Module |
| ------------ | ---------------- | --------------------------------------------- | ------ |
| 入館         | Entry            | Member entering facility                      | B-01   |
| 退館         | Exit             | Member leaving facility                       | B-01   |
| 入退館ログ   | Entry Log        | Timestamped entry/exit record                 | B-01   |
| ワンタイムQR | One-time QR      | Single-use QR code from app                   | B-01   |
| NFCカード    | NFC Card         | Physical card (legacy, phasing out)           | B-01   |
| 在館者       | In-facility      | Currently inside the facility                 | B-01   |
| 来館モニター | Visitor Monitor  | Real-time occupancy display                   | B-01   |
| バッジ       | Badge            | Frequency-based label (e.g., "Working hard!") | B-01   |
| 同伴招待     | Companion Invite | Premium member invites a guest                | B-01   |

## Lesson-related

| Japanese               | English                        | Description                        | Module |
| ---------------------- | ------------------------------ | ---------------------------------- | ------ |
| レッスン               | Lesson                         | Any trainer-led session            | D-01   |
| スタジオレッスン       | Studio Lesson                  | Group class in studio              | D-01   |
| パーソナルトレーニング | Personal Training (PT)         | 1-on-1 trainer session             | D-01   |
| 月次プラン             | Monthly Plan                   | 2/4/6/8 sessions per month package | D-01   |
| 都度払い               | Pay-per-session                | Single session payment             | D-01   |
| 枠公開型               | Mode A (Slot Publishing)       | Trainer publishes open slots       | D-01   |
| 通知調整型             | Mode B (Schedule Notification) | Trainer notifies regulars          | D-01   |
| バッファ               | Buffer                         | Time gap between sessions          | D-01   |
| 出席確認               | Attendance QR                  | QR scan for lesson attendance      | D-01   |
| ペナルティ             | No-show Penalty                | 2 no-shows in 1 week = 1 week ban  | D-01   |
| 指導者                 | Instructor                     | Trainer or instructor              | D-04   |
| 体験枠                 | Trial Slot                     | Slot for trial participants        | D-01   |

## Facility-related

| Japanese         | English            | Description                             | Module |
| ---------------- | ------------------ | --------------------------------------- | ------ |
| ロッカー         | Locker             | Locker cabinet unit                     | E-01   |
| ロッカースロット | Locker Slot        | Individual locker compartment           | E-01   |
| ロケーション     | Location           | Locker placement identifier (A, B, C…)  | E-01   |
| スロット状態     | Slot Status        | Available / In Use / Pending Release    | E-01   |
| 開放待ち         | Pending Release    | After cancellation, awaiting cleaning   | E-01   |
| 暗証番号         | PIN Code           | Locker combination (staff changes only) | E-01   |
| 接点制御装置     | Gate Device        | Entry gate control unit                 | E-02   |
| トレーニング機材 | Training Equipment | Gym machines and equipment              | E-03   |

## Billing-related

| Japanese         | English                   | Description                                             | Module  |
| ---------------- | ------------------------- | ------------------------------------------------------- | ------- |
| SBPS             | SBPS                      | Credit card payment provider (SoftBank Payment Service) | F-01    |
| JACCS            | JACCS                     | Bank transfer provider (Japan Consumer Credit Service)  | F-01    |
| 月次請求         | Monthly Billing           | Batch billing for subscriptions                         | F-01    |
| 都度請求         | Per-use Billing           | Billing per transaction                                 | F-01    |
| 請求確定         | Billing Confirmed         | Billing finalized for processing                        | F-01    |
| 請求確定後変更   | Post-confirmation Change  | Reverting confirmed billing                             | F-01    |
| 未納金           | Unpaid                    | Outstanding payment                                     | F-01    |
| 返金             | Refund                    | Return payment to member                                | F-01    |
| 返金承認         | Refund Approval           | Upper role approves refund                              | F-01    |
| 貸倒             | Write-off                 | Bad debt recognition                                    | F-01    |
| CASHPOST         | CASHPOST                  | Convenience store cash refund service                   | F-01    |
| コンビニ決済     | Convenience Store Payment | Payment via convenience store                           | F-01    |
| 会計連携CSV      | Accounting CSV            | Export for accounting system                            | F-01    |
| 入出金明細       | Payment History           | Record of all transactions                              | F-01-01 |
| 請求・未回収管理 | Collection Management     | Unpaid and retry management                             | F-01-02 |

## Content-related

| Japanese     | English             | Description                      | Module |
| ------------ | ------------------- | -------------------------------- | ------ |
| 店舗ページ   | Store Page          | Public info about store facility | I-01   |
| 告知         | Announcement        | News/blog for public audience    | I-02   |
| 通知         | Notification        | Push/SMS/email to app users      | I-03   |
| プッシュ通知 | Push Notification   | Mobile push notification         | I-03   |
| アプリ通知   | In-app Notification | Notification inside app          | I-03   |

## System-related

| Japanese         | English         | Description                      | Module     |
| ---------------- | --------------- | -------------------------------- | ---------- |
| ロール           | Role            | Fixed permission level (6 types) | Y-01       |
| 職位マスター     | Position Master | Customizable job titles          | Y-01       |
| 店舗             | Store           | Physical gym location            | Y-02       |
| FC企業           | FC Company      | Franchise company                | Y-03       |
| ブランド         | Brand           | JOYFIT or FIT365                 | Y-07       |
| 規約文書         | Terms Document  | Legal documents (terms, privacy) | Y-04       |
| アプリバージョン | App Version     | Mobile app version management    | Y-05       |
| メンテナンス     | Maintenance     | System maintenance window        | Y-06, Y-10 |
| エクササイズ     | Exercise        | Exercise type definition         | Y-08       |
| ルーティン       | Routine         | Exercise combination template    | Y-09       |
| ダッシュボード   | Dashboard       | Real-time summary view           | Z-01       |
| 分析・レポート   | Analytics       | Historical data analysis         | X-01       |

## Abbreviations

| Abbr  | Full Form                                  |
| ----- | ------------------------------------------ |
| HQ    | Headquarter (本部)                         |
| PT    | Personal Training (パーソナルトレーニング) |
| SBPS  | SoftBank Payment Service                   |
| JACCS | Japan Consumer Credit Service              |
| QR    | Quick Response code                        |
| NFC   | Near Field Communication                   |
| eKYC  | Electronic Know Your Customer              |
| OOUI  | Object-Oriented UI (person-centric design) |
