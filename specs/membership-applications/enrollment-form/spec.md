# Spec: FR-M009 — CRM Direct Enrollment Form (管理画面入会)

> **Spec ID**: FR-M009  
> **Feature**: CRM Direct Enrollment — Staff creates a membership application on behalf of a member  
> **Screen name**: 管理画面入会 (Enrollment Application Form)  
> **Spec status**: approved  
> **Created**: 2026-05-07  
> **Source spec**: `C-01.md` (FR-M009, FR-M010, FR-S002, FR-S003) in `dx-fitness/fitness-crm-ui`  
> **UI prototype**: `src/pages/enrollment-application-form.tsx` in `dx-fitness/fitness-crm-ui`

---

## 1. Overview

_(Resolved: Q5)_ **Shared upload endpoint `POST /crm/uploads`**: A single mock endpoint accepts `multipart/form-data` and returns `{ url: string }`. Used for face photo, employee ID image, and employment certificate. The mock returns a fake URL immediately. Phase 4: replace with real S3 upload — no form-side changes required.ff (店舗スタッフ) or Headquarter create a membership application directly in the CRM on behalf of a prospective member. This path handles special contracts, corporate memberships, employee-discount memberships, and any enrollment that cannot be submitted through the member-facing app.

The form is a **single-page multi-section form** that:

- Collects full applicant personal information including a face photo
- Runs a blacklist check automatically after personal info is entered
- Selects contract details (brand, store, plan, start date, campaign, payment method)
- Shows conditional sections depending on the selected application type (corporate / employee-discount)
- Auto-records the proxy application (代理申請) metadata
- Calculates enrollment fees and upfront charges (brand-aware)
- Submits and creates a member record (+ application record in C-01 list)

**Entry point**: "新規入会登録" button on the `C-01 enrollment-application-list` page.  
**Exit points**: Submit → redirect to C-01 list; Cancel → redirect to C-01 list.

---

## 2. Permissions

| Role        | Access                                                                          |
| ----------- | ------------------------------------------------------------------------------- |
| Headquarter | ✅ Full access (all application types including corporate / special contracts)  |
| Manager     | ✅ Full access (own-store scope)                                                |
| Staff       | ✅ Access — some application types (法人・特別契約) require position-level gate |
| Trainer     | ❌ No access                                                                    |
| Observer    | ❌ No access                                                                    |

**Brand / store scope**: The store selector is filtered to the operator's accessible stores. HQ sees all stores.

---

## 3. Page Layout

```
[PageHeader]
  Breadcrumb: ← 入会申請管理に戻る
  Title: 管理画面入会

[Section 1]  申請種別
[Section 2]  申請者情報
[Section 3]  契約情報
[Section 3.5] 法人情報           (conditional: `corporate` only)
[Section 3.6] 社員割引確認事項   (conditional: `employee_discount` only)
[Section 4]  代理申請記録
[Section 5]  ブラックリスト照合結果
[Section 6]  入会金・先払い費用

[Footer] キャンセル | 入会登録
```

Max content width: `960px` centered. Layout: single column of `<Card>` components, `gap-6`.

---

## 4. Section Details

### 4.1 Section 1 — 申請種別 (Application Type)

A `<Card>` with a 2-column grid.

| Field    | Type   | Required | Values                                                                                                                    |
| -------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| 申請種別 | Select | ✅       | `normal` (通常入会) / `employee_discount` (社員割引入会) / `corporate` (法人会員入会) / `special_contract` (特別契約入会) |

- Selecting `employee_discount` shows Section 3.6.
- Selecting `corporate` shows Section 3.5.
- Changing the selection resets dependent conditional sections.

**Enum ↔ UI label mapping** (stored value → displayed text):

| Enum value          | 表示ラベル   |
| ------------------- | ------------ |
| `normal`            | 通常入会     |
| `employee_discount` | 社員割引入会 |
| `corporate`         | 法人会員入会 |
| `special_contract`  | 特別契約入会 |

---

### 4.2 Section 2 — 申請者情報 (Applicant Information)

A `<Card>` with a flex-column layout, `gap-6` between groups.

| Field          | Type                    | Required | Notes                                     |
| -------------- | ----------------------- | -------- | ----------------------------------------- |
| 氏名（姓）     | Input                   | ✅       | placeholder: 例: 山田                     |
| 氏名（名）     | Input                   | ✅       | placeholder: 例: 太郎                     |
| フリガナ（姓） | Input                   | ✅       | placeholder: 例: ヤマダ                   |
| フリガナ（名） | Input                   | ✅       | placeholder: 例: タロウ                   |
| 生年月日       | Input[date]             | ✅       | Age validation: JOYFIT ≥ 15 / FIT365 ≥ 16 |
| 性別           | Select                  | ✅       | 男性 / 女性 / その他 / 回答しない         |
| 電話番号       | Input[tel]              | ✅       | placeholder: 例: 090-1234-5678            |
| メールアドレス | Input[email]            | ✅       | placeholder: 例: yamada@example.com       |
| 住所           | Input                   | —        | placeholder: 例: 東京都渋谷区神宮前1-1-1  |
| 顔写真         | File upload (drag-drop) | ✅       | JPG/PNG, max 5 MB, front face, no hat     |

**Face photo upload UI**: dashed border drop zone with `ImagePlus` icon. Inside drop zone text: "顔写真をアップロード" + `"JPG・PNG / 最大5MB / 正面・無帽"` (small). Helper text below drop zone: "BL照合精度向上・B-01入退館顔認証に使用されます".

**Blacklist check trigger**: Runs automatically after applicant's name + date-of-birth are filled. Result is surfaced in Section 5.

**Age validation**:

- Applied per brand selected in Section 3 (契約情報).
- JOYFIT: minimum 15 years old.
- FIT365: minimum 16 years old.
- Age below brand minimum (JOYFIT < 15 / FIT365 < 16): inline field error, submit blocked.
- Minor (JOYFIT: 15–17 / FIT365: 16–17): A confirmation dialog is shown at submit time — "保護者の同意を得た上で申し込みます". The operator must confirm before the application is sent. _(Resolved: Q1)_

Grid layout:

- 姓/名 → 2 columns
- フリガナ姓/名 → 2 columns
- 生年月日/性別 → 2 columns
- 電話/メール → 2 columns
- 住所 → full width
- 顔写真 → full width

---

### 4.3 Section 3 — 契約情報 (Contract Information)

A `<Card>` with a 2-column grid, `gap-6`.

| Field            | Type        | Required | Notes                                                                                                                                               |
| ---------------- | ----------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| ブランド         | Select      | ✅       | FIT365 / JOYFIT                                                                                                                                     |
| 入会店舗         | Select      | ✅       | Filtered to operator's accessible stores                                                                                                            |
| プラン           | Select      | ✅       | Depends on brand/store master: レギュラー会員 / ナイト会員 / デイタイム会員 / ウィークエンド会員 / レギュラー会員（学生）/ レギュラー会員（シニア） |
| 利用開始日       | Input[date] | ✅       | Within 2 months from today. Fee/campaign calculations are based on this date.                                                                       |
| 適用キャンペーン | Select      | —        | Default: なし. Options: 春の入会キャンペーン / 学生割引キャンペーン / 新生活応援 / シニア割引キャンペーン / 法人会員キャンペーン                    |
| 決済方法         | Select      | ✅       | クレジットカード（SBPS）/ 口座振替（JACCS）                                                                                                         |

**Brand dependency**: Changing ブランド resets プラン, 入会金, and fee fields. Also affects Section 3.5 (法人情報) field behavior.

---

### 4.4 Section 3.5 — 法人情報 (Corporate Information) [Conditional]

Displayed **only when** 申請種別 = `corporate`.

A `<Card>` with a 2-column grid, `gap-6`.

| Field        | Type                   | Required | Notes                                                                                                        |
| ------------ | ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| 法人名       | Select                 | ✅       | Corporate master list                                                                                        |
| 法人コード   | ReadonlyField          | —        | Auto-populated from corporate master after 法人名 selection                                                  |
| 請求パターン | Select                 | ✅       | JOYFIT: 法人全額 / 法人主契約+個人オプション / 個人全額 (3 options). FIT365: 個人全額のみ (locked, disabled) |
| 入会金負担   | Select / ReadonlyField | —        | JOYFIT: 企業負担 / 個人負担 (Select). FIT365: "FIT365は入会金無料（カード発行料のみ）" (ReadonlyField)       |

**Footer note**: "法人宛請求はCRMの管理対象外です（別システムで管理）"

**FIT365 rules**:

- 請求パターン is locked to "個人全額のみ" and shown as disabled select.
- 入会金負担 shows a readonly message (no input).

---

### 4.5 Section 3.6 — 社員割引確認事項 (Employee Discount Verification) [Conditional]

Displayed **only when** 申請種別 = `employee_discount`.

A `<Card>`.

| Field                 | Type                    | Required        | Notes                                    |
| --------------------- | ----------------------- | --------------- | ---------------------------------------- |
| 提携企業              | Select                  | ✅              | Partner company master list              |
| 社員番号              | Input                   | ✅              | placeholder: 例: EMP-12345               |
| 書類確認 (社員証)     | Checkbox                | ✅              | "社員証（有効期限内）を目視確認しました" |
| 書類確認 (在籍証明書) | Checkbox                | ✅              | "在籍証明書を確認しました"               |
| 社員証画像            | File upload (drag-drop) | — (recommended) | JPG/PNG max 5 MB                         |
| 在籍証明書画像        | File upload (drag-drop) | — (recommended) | JPG/PNG max 5 MB                         |
| 確認日時              | ReadonlyField           | —               | Auto-recorded: current timestamp         |
| 確認担当者            | ReadonlyField           | —               | Auto-recorded: logged-in staff ID + name |

**Submit gate**: The "入会登録" button is **disabled** until both checkboxes (社員証 + 在籍証明書) are checked.

Image upload grid: 社員証画像 and 在籍証明書画像 in a 2-column grid with drag-drop zones.

---

### 4.6 Section 4 — 代理申請記録 (Proxy Application Record)

Always displayed. A `<Card>` with a 2-column grid.

| Field      | Type          | Notes                                    |
| ---------- | ------------- | ---------------------------------------- |
| 合意日時   | ReadonlyField | Auto-recorded: submission timestamp      |
| 代理申請者 | ReadonlyField | Auto-recorded: logged-in staff name + ID |

**Footer note**: "代理申請者と合意日時は、操作ログから自動記録されます。"

This section implements **FR-M010**: The entire CRM direct enrollment is treated as a proxy application. No manual input required — the system records the consent datetime automatically at form submission.

---

### 4.7 Section 5 — ブラックリスト照合結果 (Blacklist Check Result)

Always displayed. A `<Card>`.

**Three states**:

| State              | Trigger                        | UI                                                                                                                                                                                         |
| ------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 未照合             | Applicant info not yet entered | `Badge` variant `warning`: "未照合". Helper: "申請者情報を入力後、照合が自動実行されます。"                                                                                                |
| 照合済み：該当なし | Auto-check ran, no match       | `Badge` variant `success`: "照合済み：該当なし". Helper: "ブラックリストとの一致はありません。"                                                                                            |
| 照合済み：一致あり | Auto-check ran, match found    | Card border `destructive/50`, bg `destructive/10`. `Badge` variant `destructive`: "照合済み：一致あり". Helper: "申請者情報がブラックリストと一致しています。審査を慎重に行ってください。" |

**Check logic**: Triggered automatically (debounced) when section 申請者情報
field complete. Uses the same BL matching logic as FR-M003.

**[NEEDS CLARIFICATION: Q2]** — Does a BL match hard-block form submission, or only show a warning?

_(Resolved: Q2)_ **Soft warning only.** The card shows the destructive alert but the "入会登録" button remains enabled. The application is submitted with `blMatchFlag: true` and the C-01-01 detail page surfaces the alert to the approver for final judgement.

---

### 4.8 Section 6 — 入会金・先払い費用 (Enrollment Fees & Upfront Charges)

A `<Card>`. Content differs by brand.

#### JOYFIT layout (2-column grid):

| Field                      | Type             | Notes                                                                                                                     |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 入会金（マスタ参照）       | Select           | Filtered by brand + 申請種別. Options from enrollment-fee master (FR-M006). Disabled until brand + 申請種別 are selected. |
| 金額（マスタから自動適用） | Input (readonly) | Auto-populated from selected fee master record                                                                            |
| 登録事務手数料             | Input            | hint: "JOYFIT: 税別3,000円". placeholder: 例: 3,300                                                                       |
| 初月会費（日割）           | Input            | placeholder: 例: 990                                                                                                      |
| 翌月会費                   | Input            | placeholder: 例: 7,700                                                                                                    |

#### FIT365 layout (2-column grid):

| Field            | Type  | Notes                                               |
| ---------------- | ----- | --------------------------------------------------- |
| カード発行料     | Input | hint: "FIT365: 税別5,000円". placeholder: 例: 5,500 |
| 初月会費（日割） | Input | placeholder: 例: 990                                |
| 翌月会費         | Input | placeholder: 例: 7,700                              |

**Total row**: `<Separator>` followed by right-aligned total: "合計 ¥{sum}".

**Fallback**: When brand is not yet selected, display: "ブランドを選択すると費用項目が切り替わります".

**Enrollment fee master (FR-M006)**:

- `ENROLLMENT_FEE_MASTERS` data: id, name, amount, brand (JOYFIT / FIT365 / 共通), `application_type` (enum: `normal` | `employee_discount` | `corporate` | `special_contract`), isActive.
- Filtering: active records only, matching brand (or "共通"), matching `application_type` if set.
- [NEEDS CLARIFICATION: Q3] — Is `enrollmentFeeMasterId` stored directly, or only the resolved amount?

_(Resolved: Q3)_ **Store both** `enrollmentFeeMasterId` and `enrollmentFeeAmount`. The master ID provides audit traceability; the amount is used for billing.

---

## 5. Footer Actions

Fixed to bottom of form content (inside `<div className="flex items-center justify-end gap-2 border-t p-4">`).

| Button     | Variant | Size | Behavior                                                                                                                                                                                                                                                                                       |
| ---------- | ------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| キャンセル | outline | lg   | Navigate to enrollment-application-list without saving                                                                                                                                                                                                                                         |
| 入会登録   | default | lg   | Submit form. Disabled when: `!form.formState.isValid \|\| form.formState.isSubmitting`. Required-field validation (incl. employee-discount checkboxes as `z.literal(true)`) and age-minimum check are enforced by the Zod schema. BL match does **not** block submission. _(Resolved: Q2, Q4)_ |

---

## 6. Form Validation Rules

> **Field length constraints** (applied to all text fields via Zod):
>
> - Single-line text inputs (`Input`): max **255** characters
> - Multi-line / long-text fields (`Textarea`, 住所): max **1000** characters

| Field              | Rule                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 申請種別           | Required                                                                                                                                                            |
| 氏名（姓・名）     | Required, non-empty string                                                                                                                                          |
| フリガナ（姓・名） | Required, full-width katakana                                                                                                                                       |
| 生年月日           | Required, valid date. Age < brand minimum → inline error, submit blocked. Minor (15–17 JOYFIT / 16–17 FIT365) → parental-consent dialog at submit. _(Resolved: Q1)_ |
| 性別               | Required                                                                                                                                                            |
| 電話番号           | Required, Japanese phone format                                                                                                                                     |
| メールアドレス     | Required, valid email                                                                                                                                               |
| 顔写真             | Required, JPG or PNG, max 5 MB                                                                                                                                      |
| ブランド           | Required                                                                                                                                                            |
| 入会店舗           | Required                                                                                                                                                            |
| プラン             | Required                                                                                                                                                            |
| 利用開始日         | Required, within 2 months from today                                                                                                                                |
| 決済方法           | Required                                                                                                                                                            |
| 法人名             | Required when `application_type = 'corporate'`                                                                                                                      |
| 請求パターン       | Required when `application_type = 'corporate'` (except FIT365 which is auto-set)                                                                                    |
| 提携企業           | Required when `application_type = 'employee_discount'`                                                                                                              |
| 社員番号           | Required when `application_type = 'employee_discount'`                                                                                                              |
| 書類確認 (両方)    | Both checkboxes required when `application_type = 'employee_discount'` (gates submit button)                                                                        |

Validation library: `react-hook-form` + `zod` schema.

---

## 7. API Contract (Preliminary)

### POST `/crm/membership-applications/direct`

Creates a new application record directly (bypasses the app submission flow).

**Request body** (Zod schema — snake_case field names):

```ts
{
  application_type: "normal" | "employee_discount" | "corporate" | "special_contract"
  applicant: {
    last_name_kanji: string           // max 255
    first_name_kanji: string          // max 255
    last_name_kana: string            // max 255, full-width katakana
    first_name_kana: string           // max 255, full-width katakana
    date_of_birth: string             // ISO 8601 date
    gender: "男性" | "女性" | "その他" | "回答しない"
    phone: string                     // max 255, Japanese phone format
    email: string                     // max 255, valid email
    address?: string                  // max 1000
    face_photo_url: string            // URL returned by POST /crm/uploads
  }
  contract: {
    brand: "FIT365" | "JOYFIT"
    store_id: string
    plan_id: string
    start_date: string                // ISO 8601 date, within 2 months from today
    campaign_id?: string
    payment_method: "クレジットカード" | "口座振替"
  }
  corporate?: {                       // when application_type = 'corporate'
    corporate_id: string
    billing_pattern: string
    enrollment_fee_bearer?: string
  }
  employee_discount?: {              // when application_type = 'employee_discount'
    partner_company_id: string
    employee_number: string           // max 255
    employee_id_verified: true
    employment_cert_verified: true
    employee_id_image_url?: string    // URL returned by POST /crm/uploads
    employment_cert_image_url?: string // URL returned by POST /crm/uploads
  }
  fees: {
    enrollment_fee_master_id?: string  // JOYFIT
    enrollment_fee_amount?: number
    card_issuance_fee?: number         // FIT365
    registration_fee?: number          // JOYFIT
    first_month_fee_prorated?: number
    next_month_fee?: number
  }
}
```

**Response**: `{ applicationId: string, memberId: string, status: "pending" }`

**Error cases**:

- `400` — Validation failure (missing required field, age constraint, start date > 2 months out)
- `403` — Operator lacks permission for this application type
- `409` — Applicant already has an active membership

### POST `/crm/uploads`

Shared image upload endpoint used for face photo, employee ID image, and employment certificate image.

**Request**: `multipart/form-data` with `file` field (JPG/PNG, max 5 MB).

**Response**: `{ url: string }` — a URL pointing to the stored image (mock: fake CDN URL; Phase 4: S3 signed URL or CDN URL).

**Usage pattern**:

1. User selects/drops a file in the drag-drop upload zone.
2. Component immediately POSTs to `/crm/uploads` and shows a spinner.
3. On success, the returned `url` is stored in the form field (`face_photo_url`, `employee_id_image_url`, `employment_cert_image_url`).
4. The "入会登録" submit button is disabled while any upload is in progress.

**Phase 4**: Replace mock with actual S3 multipart upload. No form-side changes needed — only the URL domain changes.

---

## 8. State Management

- **URL state** (`nuqs`): None required (this is a form page, no filterable state).
- **Form state**: `react-hook-form` with a Zod resolver over the full form schema.
- **Conditional section visibility**: Derived from `application_type` watch value — no additional context needed.
- **Fee master data**: Fetched via React Query (`useQuery`) on page load. Filtered client-side by brand + `application_type`.
- **BL check**: Triggered via `useMutation` auto-query debounced on **all** applicant fields (name kanji/kana, DOB, gender, phone, email, address). Fires only when all required applicant fields are non-empty.
- **Submit mutation**: `useMutation` → POST `/crm/membership-applications/direct` → on success navigate to list + `toast.success`.

---

## 9. Component File Structure

```
src/app/(private)/membership-applications/
└── new/
    ├── page.tsx                                  # RSC shell (async, no 'use client')
    └── _components/
        ├── enrollment-form.tsx                   # 'use client' — main form orchestrator
        ├── application-type-section.tsx          # Section 1
        ├── applicant-info-section.tsx            # Section 2 (incl. face photo upload)
        ├── contract-info-section.tsx             # Section 3
        ├── corporate-info-section.tsx            # Section 3.5 (conditional)
        ├── employee-discount-section.tsx         # Section 3.6 (conditional)
        ├── proxy-record-section.tsx              # Section 4
        ├── blacklist-result-section.tsx          # Section 5
        ├── fee-section.tsx                       # Section 6
        └── face-photo-upload.tsx                 # Reusable drag-drop upload component
```

**API schema file**: `src/app/api/_schemas/membership-application.schema.ts` (extend with `DirectEnrollmentRequestSchema`)

**Route file**: `src/app/api/crm/membership-applications/direct/route.ts` (new POST handler)

---

## 10. Related Features

| Feature               | Relation                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------ |
| C-01 入会申請管理一覧 | Entry point (button) + redirect target after submit                                        |
| FR-M003 BLチェック    | Same BL matching logic reused                                                              |
| FR-M004 年齢チェック  | Same age validation logic reused                                                           |
| FR-M005 承認処理      | After direct enrollment form submit, application goes into the standard C-01 approval flow |
| FR-M006 入会金マスタ  | Fee master data consumed in Section 6                                                      |
| FR-M010 代理申請記録  | Section 4 captures consent datetime + proxy staff ID                                       |
| G-01 主契約管理       | Plan options derived from contract master                                                  |
| G-03 キャンペーン管理 | Campaign options and applicability                                                         |
| A-01 会員管理         | Approved application creates a member record                                               |

---

## 11. Clarification Q&A

All `[NEEDS CLARIFICATION]` items resolved below.

---

### Q1 — Minor (age < 20) handling on the CRM form

**Question**: When a minor is entered in the form, should the CRM show a parental-consent confirmation step inline, or just flag it for the approver?

**Decision**: Show an inline confirmation popup (同意確認ポップアップ) before the form can be submitted — matching the app-side behavior defined in FR-M004.

**Evidence**:

- FR-M004 (C-01.md): "未成年（JOYFIT: 15〜17歳 / FIT365: 16〜17歳）: 保護者同意確認のポップアップを表示。同意確認後に申請続行"
- The business flow diagram confirms: "未成年 → 保護者同意確認ポップアップ表示" is triggered before the application proceeds.
- Age < minimum (JOYFIT < 15 / FIT365 < 16) is a hard block — submission is rejected with an error message. This is within Dev authority to enforce via Zod age validation.

**Spec update**:

- Add: When 生年月日 is entered and the applicant is a minor (JOYFIT: 15–17 / FIT365: 16–17), a confirmation dialog appears at submit time: "保護者の同意を得た上で申し込みます" with a single confirm checkbox. The "入会登録" button proceeds only after the operator confirms.
- Age below the brand minimum (JOYFIT < 15 / FIT365 < 16) → inline validation error on the 生年月日 field. Submit is blocked.

---

### Q2 — BL match: hard-block or soft warning?

**Question**: Does a BL match hard-block form submission, or is it a soft warning?

**Decision**: **Soft warning only** — submission is allowed. The BL match flag is surfaced to the approver in the C-01-01 detail review, where the final judgement is made.

**Evidence**:

- FR-M003 (C-01.md): "一致あり → 要注意フラグ表示。スタッフが最終判断"
- The enrollment approval flow: "ブラックリスト照合（自動）→ 一致あり → 要注意フラグ表示。スタッフが最終判断"
- The prototype text for the BL-match state: "審査を慎重に行ってください" — advisory language, not a block.
- The prototype does not disable any button on BL match.

**Spec update**: Section 5 BL-match state is a warning card only. The "入会登録" button remains enabled. The submitted application is tagged with a `blMatchFlag: true` field; the C-01-01 detail page renders the alert.

---

### Q3 — Persist `enrollmentFeeMasterId` or only the resolved amount?

**Question**: Should `enrollmentFeeMasterId` be stored in the application record, or only the resolved amount?

**Decision**: **Store both** — `enrollmentFeeMasterId` for audit traceability and the resolved `enrollmentFeeAmount` for billing calculation. This is the minimum safe default for Phase 1 (mock); BE may normalise the schema at Phase 3.

**Evidence**:

- C-01.md prototype review note: "本番では自動計算に置換要" — meaning the master ID reference will be needed when the calculation becomes server-side.
- Audit requirement: storing only the amount loses the link to the fee configuration at time of application, which is needed if the master is later updated.

**Spec update**: The `fees` object in the POST body retains both `enrollmentFeeMasterId?: string` and `enrollmentFeeAmount?: number`. The mock DB stores both. The display shows the master name + amount (auto-populated from selection).

---

### Q4 — Other submit-disable conditions

**Question**: Beyond employee-discount checkboxes, what else should disable the "入会登録" button?

**Decision** (Dev authority — standard form pattern):

1. **Any required Zod field is invalid** (`!form.formState.isValid`) — standard react-hook-form gate. Covers all required fields in Sections 1–3 and conditional required fields in 3.5/3.6.
2. **Form is submitting** (`form.formState.isSubmitting`) — prevents double submission.
3. **Age below brand minimum** — inline field error disables submit via Zod refinement.
4. The employee-discount dual-checkbox gate is a subset of (1), since both checkboxes are `z.literal(true)` in the Zod schema when `application_type === 'employee_discount'`.

No additional business-logic gate beyond Zod schema + minor-consent popup (Q1 decision above). BL match does **not** disable submit (Q2 decision).

**Spec update**: Section 5 Footer — revise the "入会登録" disabled conditions to: `!form.formState.isValid || form.formState.isSubmitting`.

---

### Q5 — Image upload endpoint

**Question**: Is there an existing image upload endpoint? What URL is stored?

**Decision** (Dev authority — Phase 1 mock scope):

- **Phase 1 (mock)**: No separate upload endpoint. Images are held as `File` objects in form state and submitted in the POST body as **base64 data URIs** (e.g., `data:image/jpeg;base64,...`). The mock DB stores the data URI string. This keeps the mock self-contained.
- **Phase 4 (real API)**: A real `POST /crm/uploads` multipart endpoint will be required. The returned URL (CDN or internal file ID) replaces the data URI in the request body. This is flagged as a Phase 4 contract item.

**Spec update**: Section 7 API contract — replace the placeholder with: "Phase 1: images are submitted as base64 data URIs within the POST body. Phase 4: replace with a `POST /crm/uploads` multipart call; store the returned `fileUrl`."

---

## 12. Constitution Check

| Principle                                  | Status      | Note                                       |
| ------------------------------------------ | ----------- | ------------------------------------------ |
| I — Single source of truth (Zod schema)    | N/A (draft) | Will be verified at speckit.implement      |
| II — Generated client, no manual fetch     | N/A (draft) | All fetches will use React Query factories |
| III — URL state for filter/sort/pagination | ✅ N/A      | Form page has no filterable state          |
| IV — API contract tests                    | N/A (draft) | Zod `.safeParse` on request body           |
| V — Bundle ≤ 250 kB per route              | N/A (draft) | To be verified at build step               |

---

_Spec status: **approved** — all [NEEDS CLARIFICATION] items resolved. Plan approved._
