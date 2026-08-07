# Tasks: FR-M009 — CRM Direct Enrollment Form (管理画面入会)

> **Spec**: `specs/membership-applications/enrollment-form/spec.md`  
> **Plan**: `specs/membership-applications/enrollment-form/plan.md`  
> **Tasks status**: ready  
> **Created**: 2026-05-07

---

## How to read this file

- Each task has a unique ID (`T-XXX`), a single responsible file, and a clear done-condition.
- Tasks must be executed in order within each phase. Cross-phase dependencies are noted.
- Prefix every commit with the task ID: `git commit -m "T-001: add enrollment fee master Zod schema"`.

---

## Phase 1 — Data Model & API (backend-only, no UI)

### T-001 — Zod schemas: enrollment fee master + upload

**File**: `src/app/api/_schemas/membership-application.schema.ts`

Append after existing schemas:

- `EnrollmentFeeMasterSchema` + `EnrollmentFeeMaster` type + `GetEnrollmentFeeMastersResponseSchema`
- `GetEnrollmentFeeMastersQuerySchema` (query params: `brand?`, `applicationType?`)
- `UploadResponseSchema` → `z.object({ url: z.string().url() })`

**Done when**: TypeScript compiles with no errors on this file.

---

### T-002 — Zod schemas: BL check + direct enrollment request

**File**: `src/app/api/_schemas/membership-application.schema.ts`

Append after T-001 additions:

- `BlacklistCheckRequestSchema` (full applicant info: `last_name_kanji`, `first_name_kanji`, `last_name_kana`, `first_name_kana`, `date_of_birth`, `gender`, `phone`, `email`, `address?`)
- `BlacklistCheckResponseSchema` → `{ checked: boolean, matched: boolean }`
- `ApplicationTypeSchema` — English enum: `'normal'` (通常入会) / `'employee_discount'` (社員割引入会) / `'corporate'` (法人会員入会) / `'special_contract'` (特別契約入会); export `ApplicationType` type and `APPLICATION_TYPE_LABELS` display map
- `DirectEnrollmentApplicantSchema` (snake_case fields, max 255 / max 1000 for address, `face_photo_url: z.string().url()`)
- `DirectEnrollmentContractSchema`
- `DirectEnrollmentCorporateSchema`
- `DirectEnrollmentEmployeeDiscountSchema` (`employee_id_verified: z.literal(true)`, `employment_cert_verified: z.literal(true)`, optional image URLs)
- `DirectEnrollmentFeesSchema`
- `DirectEnrollmentRequestBaseSchema` (composed, no superRefine here — applied in form)
- `DirectEnrollmentResponseSchema` → `{ applicationId: string, memberId: string, status: 'pending' }`

**Done when**: All schemas exported, TypeScript compiles cleanly.

---

### T-003 — Shared utility: age validation

**File**: `src/utils/age.util.ts` _(new)_

Implement and export:

```ts
calcAge(dateOfBirth: string): number        // differenceInYears from date-fns
getMinAge(brand: 'FIT365' | 'JOYFIT'): number  // FIT365→16, JOYFIT→15
isMinor(age: number): boolean               // age < 20
isBelowMinAge(age: number, brand: 'FIT365' | 'JOYFIT'): boolean
```

Import: `differenceInYears`, `parseISO` from `date-fns`.

**Done when**: File compiles, functions return correct values for boundary ages (14, 15, 16, 17, 19, 20).

---

### T-004 — Mock DB: enrollment fee masters, corporate masters, partner companies

**File**: `src/app/api/_mock-db.ts`

1. Add import of `EnrollmentFeeMaster` type from schema file.
2. Add to `DbType`:
   - `enrollmentFeeMasters: { _rows, _seeded, _seed(), getAll(), getFiltered(brand, applicationType) }`
   - `corporateMasters: { _rows: { id, name, code }[], _seed(), getAll() }`
   - `partnerCompanies: { _rows: { id, name, code }[], _seed(), getAll() }` _(same seed data as corporateMasters for Phase 1)_
3. Implement and seed:
   Seed data — `application_type` field uses English enum values:

- EF001: id=`EF001`, name=`標準入会金`, amount=2200, brand=`JOYFIT`, application_type=`normal`, isActive=true
- EF002: id=`EF002`, name=`ファミリー入会金`, amount=1100, brand=`JOYFIT`, application_type=`normal`, isActive=true
- EF003: id=`EF003`, name=`法人入会金`, amount=5500, brand=`共通`, application_type=`corporate`, isActive=true
- EF004: id=`EF004`, name=`社員割引入会金`, amount=0, brand=`共通`, application_type=`employee_discount`, isActive=true
- EF005: id=`EF005`, name=`特別契約入会金`, amount=0, brand=`共通`, application_type=`special_contract`, isActive=true
  - `corporateMasters`: 3 rows — CORP-001…CORP-003
  - `partnerCompanies`: same 3 rows

**Done when**: `db.enrollmentFeeMasters.getFiltered('JOYFIT', 'normal')` returns EF001 + EF002; `db.corporateMasters.getAll()` returns 3 entries.

---

### T-005 — Mock DB: `createDirect` method on `membershipApplications`

**File**: `src/app/api/_mock-db.ts`

Add `createDirect(data: z.infer<typeof DirectEnrollmentRequestBaseSchema>, blMatched: boolean): MembershipApplication` to the `membershipApplications` collection:

- Generates new `id` (e.g. `APP-DIRECT-${Date.now()}`)
- Sets `applicant_name = data.applicant.last_name_kanji + data.applicant.first_name_kanji`
- Sets `status = 'pending'`, `blacklist_match = blMatched`, `is_proxy = true`
- Stores full `data` in `MembershipApplicationDetails` shape (proxy fields, fees, contract, etc.)
- Pushes new row to `_rows` array

**Done when**: Calling `createDirect(validPayload, false)` adds a retrievable entry to `db.membershipApplications.getAll()`.

---

### T-006 — API route: `POST /crm/uploads`

**File**: `src/app/api/crm/uploads/route.ts` _(new)_

- `registerRoute` for OpenAPI: tag `Uploads`, summary `Upload image file`
- Accepts `multipart/form-data` with a `file` field
- Server validation: content-type must be `image/jpeg` or `image/png`; file size ≤ 5 MB
- Mock: does not store the file; returns `{ url: 'https://cdn.mock.example.com/uploads/<uuid>.jpg' }`
- Response schema: `UploadResponseSchema`
- Error: `400` if no file / wrong type / too large

**Done when**: `curl -F "file=@test.jpg" http://localhost:3000/api/crm/uploads` returns `{ url: "https://cdn.mock.example.com/uploads/..." }`.

---

### T-007 — API route: `GET /crm/membership-applications/enrollment-fee-masters`

**File**: `src/app/api/crm/membership-applications/enrollment-fee-masters/route.ts` _(new)_

- `registerRoute` for OpenAPI: tag `Membership Applications`
- Query params: `GetEnrollmentFeeMastersQuerySchema` (optional `brand`, optional `applicationType`)
- Handler: `db.enrollmentFeeMasters.getFiltered(brand, applicationType)`
- Response: `GetEnrollmentFeeMastersResponseSchema`
- Errors: `400` on invalid query

**Done when**: `GET /api/crm/membership-applications/enrollment-fee-masters?brand=JOYFIT&applicationType=normal` returns `{ items: [EF001, EF002] }`.

---

### T-008 — API route: `POST /crm/membership-applications/blacklist-check`

**File**: `src/app/api/crm/membership-applications/blacklist-check/route.ts` _(new)_

- `registerRoute` for OpenAPI: tag `Membership Applications`
- Body: `BlacklistCheckRequestSchema`
- Mock logic: `matched = body.last_name_kanji === '田中'`
- Response: `BlacklistCheckResponseSchema` → `{ checked: true, matched }`
- Error: `400` on validation failure

**Done when**: POST with `{ last_name_kanji: '田中', ... }` returns `{ checked: true, matched: true }`; any other name returns `{ checked: true, matched: false }`.

---

### T-009 — API route: `POST /crm/membership-applications/direct`

**File**: `src/app/api/crm/membership-applications/direct/route.ts` _(new)_

- `registerRoute` for OpenAPI: tag `Membership Applications`
- Body: `DirectEnrollmentRequestBaseSchema` — server-side `.safeParse()`
- Server-side age check using `calcAge` + `getMinAge` (import from `src/utils/age.util.ts`): return `400` if age < brand minimum
- Server-side start_date check: return `400` if `start_date` > today + 2 months
- Mock BL cross-check: re-run same name mock check → set `blMatched` flag
- Call `db.membershipApplications.createDirect(body, blMatched)`
- Response: `DirectEnrollmentResponseSchema` → `{ applicationId, memberId: 'MBR-DIRECT-xxx', status: 'pending' }`
- Errors: `400` (validation), `403` (placeholder — always passes in mock), `409` (check for existing active member by email in `db.members`)

**Done when**: Valid POST returns `201` with `{ applicationId, memberId, status: 'pending' }`; invalid body returns `400`; duplicate email returns `409`.

---

### T-010 — Register new routes in `_routes/index.ts`

**File**: `src/app/api/_routes/index.ts`

Add 4 import lines (must be placed in alphabetical/logical order with existing membership-applications imports):

```ts
import '@/app/api/crm/membership-applications/blacklist-check/route';
import '@/app/api/crm/membership-applications/direct/route';
import '@/app/api/crm/membership-applications/enrollment-fee-masters/route';
import '@/app/api/crm/uploads/route';
```

**Done when**: `npm run generate-openapi` completes without errors and `lib/openapi.json` contains all 4 new paths.

---

### T-011 — Regenerate OpenAPI client

**Run in terminal** (not a file task):

```bash
npm run generate-openapi
npm run generate-api
```

**Done when**:

- `src/lib/openapi.json` contains paths for all 4 new routes
- `src/lib/api/types.gen.ts` contains `EnrollmentFeeMaster`, `BlacklistCheckRequest`, `DirectEnrollmentRequest`, `UploadResponse`
- `src/lib/api/@tanstack/react-query.gen.ts` exports:
  - `getCrmMembershipApplicationsEnrollmentFeeMastersOptions`
  - `postCrmMembershipApplicationsBlacklistCheckMutation`
  - `postCrmMembershipApplicationsDirectMutation`
  - `postCrmUploadsMutation`

---

## Phase 2 — Shared Components

### T-012 — `face-photo-upload.tsx` component

**File**: `src/app/(private)/membership-applications/new/_components/face-photo-upload.tsx` _(new)_

Props:

```ts
interface ImageUploadProps {
  value: string | null; // current image URL (null = not yet uploaded)
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
}
```

Behavior:

- Dashed drop zone with `ImagePlus` icon (lucide-react) when no image
- Click or drag-drop triggers `<input type="file" accept="image/jpeg,image/png">`
- On file select: validate size ≤ 5 MB (show `toast.error` if exceeded); call `postCrmUploadsMutation()` via `useMutation`; show `Loader2` spinner while uploading
- On upload success: call `onChange(url)`; show thumbnail preview with `<img>` inside drop zone
- On upload error: show `toast.error('アップロードに失敗しました')`
- While uploading: emit `onUploadingChange(true/false)` or expose an `isUploading` state via a ref callback (used by orchestrator to gate submit button)
- Add `onRemove` prop: click ✕ icon on thumbnail → `onChange(null)`

**Done when**: Component renders upload zone, shows spinner during upload, shows preview after upload, clears on remove.

---

### T-013 — `minor-consent-dialog.tsx` component

**File**: `src/app/(private)/membership-applications/new/_components/minor-consent-dialog.tsx` _(new)_

Props:

```ts
interface MinorConsentDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

Behavior:

- `AlertDialog` wrapping:
  - Title: "保護者同意の確認"
  - Description: "申請者は未成年です。保護者の同意を得た上で申し込みます。"
  - Checkbox: "保護者の同意を得た上で申し込みます" (state local to dialog)
  - Cancel button → `onCancel()`
  - Confirm button (`variant="default"`) → `onConfirm()`; disabled until checkbox checked

**Done when**: Dialog opens/closes correctly; Confirm button disabled until checkbox is ticked.

---

## Phase 3 — Form Sections

> All section components accept `control: Control<DirectEnrollmentFormValues>` as a prop (plus any additional derived values). No section component has its own `useForm`.

### T-014 — `application-type-section.tsx` (Section 1)

**File**: `src/app/(private)/membership-applications/new/_components/application-type-section.tsx` _(new)_

- `<Card>` with title "申請種別"
- 2-column grid
- `<Controller>` on `application_type` → `<Select>` with 4 options using `APPLICATION_TYPE_LABELS` map:
  - value=`normal` label=通常入会
  - value=`employee_discount` label=社員割引入会
  - value=`corporate` label=法人会員入会
  - value=`special_contract` label=特別契約入会
- Shows `FormMessage` for validation error

**Done when**: Selecting a value registers correctly in form state; required error shows when untouched and submitted.

---

### T-015 — `applicant-info-section.tsx` (Section 2)

**File**: `src/app/(private)/membership-applications/new/_components/applicant-info-section.tsx` _(new)_

Fields (grid layout per spec §4.2):

- Row 1 (2-col): `applicant.last_name_kanji` label=**氏名（姓）** placeholder=`例: 山田`; `applicant.first_name_kanji` label=**氏名（名）** placeholder=`例: 太郎` — `Input` max 255
- Row 2 (2-col): `applicant.last_name_kana` label=**フリガナ（姓）** placeholder=`例: ヤマダ`; `applicant.first_name_kana` label=**フリガナ（名）** placeholder=`例: タロウ` — `Input` max 255
- Row 3 (2-col): `applicant.date_of_birth` label=**生年月日** — `Input[date]`; `applicant.gender` label=**性別** — `Select` (男性/女性/その他/回答しない)
- Row 4 (2-col): `applicant.phone` label=**電話番号** placeholder=`例: 090-1234-5678` — `Input[tel]` max 255; `applicant.email` label=**メールアドレス** placeholder=`例: yamada@example.com` — `Input[email]` max 255
- Row 5 (full-width): `applicant.address` label=**住所** placeholder=`例: 東京都渋谷区神宮前1-1-1` — `Input` max 1000
- Row 6 (full-width): `applicant.face_photo_url` label=**顔写真** — `<ImageUpload>` component (T-012); hint=`"JPG・PNG / 最大5MB / 正面・無帽"`; helper text below: `"BL照合精度向上・B-01入退館顔認証に使用されます"`; passes `onUploadingChange` up to orchestrator

All fields show `FormMessage` below for inline Zod errors.

**Done when**: All fields register in form state; katakana validation shows correct error; photo upload updates `applicant.face_photo_url` in form.

---

### T-016 — `contract-info-section.tsx` (Section 3)

**File**: `src/app/(private)/membership-applications/new/_components/contract-info-section.tsx` _(new)_

Fields (2-column grid per spec §4.3):

- `contract.brand` — label=**ブランド** `Select` (FIT365 / JOYFIT); on change, reset `contract.plan_id`, `fees.*`
- `contract.store_id` — label=**入会店舗** `Select`; options from `db.stores` via `useQuery(getCrmStoresOptions())` (existing endpoint)
- `contract.plan_id` — label=**プラン** `Select`; hardcoded options per prototype:
  - FIT365: レギュラー会員 / デイタイム会員 / ナイト会員 / ウィークエンド会員 / レギュラー会員（学生）/ レギュラー会員（シニア）
  - JOYFIT: レギュラー会員 / ナイト会員 / デイタイム会員 / ウィークエンド会員 / レギュラー会員（学生）/ レギュラー会員（シニア）
- `contract.start_date` — label=**利用開始日** `Input[date]`; max constraint = today + 2 months (shown as `max` attribute + Zod error)
- `contract.campaign_id` — label=**適用キャンペーン** `Select` (optional); default placeholder `"なし"`; options: なし / 春の入会キャンペーン / 学生割引キャンペーン / 新生活応援 / シニア割引キャンペーン / 法人会員キャンペーン
- `contract.payment_method` — label=**決済方法** `Select` (クレジットカード（SBPS）/ 口座振替（JACCS）)

**Done when**: Brand change resets plan + fee fields; start_date shows error for dates > 2 months out.

---

### T-017 — `corporate-info-section.tsx` (Section 3.5)

**File**: `src/app/(private)/membership-applications/new/_components/corporate-info-section.tsx` _(new)_

Rendered only when `application_type === 'corporate'`.

Fields (2-column grid per spec §4.4):

- `corporate.corporate_id` — `Select`; options from `db.corporateMasters` via existing stores query pattern (use `useQuery` with `getCrmMembershipApplicationsCorporateMastersOptions()` — **or** inline `fetch` since this is a new endpoint not yet generated; alternatively, load data via parent and pass as prop)
  - **Decision**: load corporate list via a prop passed from `enrollment-form.tsx` (avoids adding yet another API endpoint for Phase 1; orchestrator fetches from the uploads query or inline)
  - Actually: add `GET /crm/membership-applications/corporate-masters` as a **Phase 1 inline static response** — no DB call needed; returns hardcoded array. _(Add to T-009 route file as a separate export or add T-017b task below)_
- Auto-populated `法人コード` readonly field (derived from selected corporate)
- `corporate.billing_pattern` — label=**請求パターン** `Select`; FIT365: locked to `"個人全額のみ"` (disabled readonly input); JOYFIT: 3 options in order — `法人全額` / `法人主契約+個人オプション` / `個人全額`
- `corporate.enrollment_fee_bearer` — label=**入会金負担** `Select` (JOYFIT: `企業負担` / `個人負担`) or readonly input (FIT365: `"FIT365は入会金無料（カード発行料のみ）"`)
- Footer note: "法人宛請求はCRMの管理対象外です（別システムで管理）"

**Done when**: Section shows/hides based on `application_type`; FIT365 brand locks billing pattern correctly.

---

### T-017b — API route: `GET /crm/membership-applications/corporate-masters`

**File**: `src/app/api/crm/membership-applications/corporate-masters/route.ts` _(new)_

- `registerRoute` for OpenAPI; returns `db.corporateMasters.getAll()`
- Response schema: `z.object({ items: z.array(z.object({ id: z.string(), name: z.string(), code: z.string() })) })`
- Register in `_routes/index.ts`
- Re-run `npm run generate-openapi && npm run generate-api` after adding

**Done when**: `GET /api/crm/membership-applications/corporate-masters` returns 3 items.

---

### T-018 — `employee-discount-section.tsx` (Section 3.6)

**File**: `src/app/(private)/membership-applications/new/_components/employee-discount-section.tsx` _(new)_

Rendered only when `application_type === 'employee_discount'`.

- `<Card>` with title **"社員割引確認事項"**

Fields per spec §4.5:

- `employee_discount.partner_company_id` — label=**提携企業** `Select`; options from `db.partnerCompanies` (same corporate-masters endpoint or separate — reuse T-017b endpoint for Phase 1)
- `employee_discount.employee_number` — `Input` max 255; placeholder: 例: EMP-12345
- 書類確認 section:
  - `employee_discount.employee_id_verified` — `Checkbox`; label: "社員証（有効期限内）を目視確認しました"
  - `employee_discount.employment_cert_verified` — `Checkbox`; label: "在籍証明書を確認しました"
- Image upload grid (2-col):
  - `employee_discount.employee_id_image_url` — `<ImageUpload>` (T-012) label: 社員証画像 (任意・推奨)
  - `employee_discount.employment_cert_image_url` — `<ImageUpload>` (T-012) label: 在籍証明書画像 (任意・推奨)
- Readonly row (2-col):
  - 確認日時 — current timestamp (formatted `yyyy/MM/dd HH:mm`)
  - 確認担当者 — mock: "管理者A（STAFF-001）"

**Done when**: Both checkboxes must be `true` for Zod to pass (z.literal(true)); unchecked state shows validation error on submit attempt.

---

### T-019 — `proxy-record-section.tsx` (Section 4)

**File**: `src/app/(private)/membership-applications/new/_components/proxy-record-section.tsx` _(new)_

- `<Card>` title: "代理申請記録"
- 2-column grid of two `ReadonlyField`s:
  - 合意日時: current timestamp at render time (formatted `yyyy/MM/dd HH:mm`), label: "（自動記録）"
  - 代理申請者: mock logged-in staff "管理者A（STAFF-001）"
- Footer note: "代理申請者と合意日時は、操作ログから自動記録されます。"

**Done when**: Section renders with correct auto-values; no user input possible.

---

### T-020 — `blacklist-result-section.tsx` (Section 5)

**File**: `src/app/(private)/membership-applications/new/_components/blacklist-result-section.tsx` _(new)_

- `<Card>` with title **"ブラックリスト照合結果"**

Props:

```ts
interface BlacklistResultSectionProps {
  state: 'unchecked' | 'no-match' | 'match';
}
```

Three render states (per spec §4.7 + prototype Badge styles):

| state       | Card border                               | Badge className                                            | Text                                                                                              |
| ----------- | ----------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `unchecked` | default                                   | `bg-warning/15 text-warning border-warning/20`             | "未照合" / "申請者情報を入力後、照合が自動実行されます。"                                         |
| `no-match`  | default                                   | `bg-success/15 text-success border-success/20`             | "照合済み：該当なし" / "ブラックリストとの一致はありません。"                                     |
| `match`     | `border-destructive/50 bg-destructive/10` | `bg-destructive/15 text-destructive border-destructive/20` | "照合済み：一致あり" / "申請者情報がブラックリストと一致しています。審査を慎重に行ってください。" |

All Badges: `variant="outline"` with `text-xs`.

**Done when**: All 3 states render correctly with correct colors and text.

---

### T-021 — `fee-section.tsx` (Section 6)

**File**: `src/app/(private)/membership-applications/new/_components/fee-section.tsx` _(new)_

Props:

```ts
interface FeeSectionProps {
  control: Control<DirectEnrollmentFormValues>;
  brand: 'FIT365' | 'JOYFIT' | '';
  applicationType: string;
  feeMasters: EnrollmentFeeMaster[];
}
```

Behavior:

- No brand selected: fallback text "ブランドを選択すると費用項目が切り替わります" (card title still **"入会金・先払い費用"**)
- FIT365 layout (2-col grid):
  - `fees.card_issuance_fee` — label=**カード発行料** `Input[number]`; hint: "FIT365: 税別5,000円"; placeholder: 例: 5,500
  - `fees.first_month_fee_prorated` — label=**初月会費（日割）** `Input[number]`; placeholder: 例: 990
  - `fees.next_month_fee` — label=**翌月会費** `Input[number]`; placeholder: 例: 7,700
- JOYFIT layout (2-col grid):
  - `fees.enrollment_fee_master_id` — label=**入会金（マスタ参照）** `Select`; disabled until brand + applicationType set; placeholder when disabled: `"ブランド・申請種別を選択してください"`, when enabled: `"入会金を選択"`; options = filtered `feeMasters`; shows `{name}（¥{amount}）`
  - `fees.enrollment_fee_amount` — label=**金額（マスタから自動適用）** `Input` readonly; auto-populated from selected master record
  - `fees.registration_fee` — label=**登録事務手数料** `Input[number]`; hint: "JOYFIT: 税別3,000円"; placeholder: 例: 3,300
  - `fees.first_month_fee_prorated` — label=**初月会費（日割）** `Input[number]`; placeholder: 例: 990
  - `fees.next_month_fee` — label=**翌月会費** `Input[number]`; placeholder: 例: 7,700
- `<Separator>` + right-aligned total row: `合計 ¥{sum}` (auto-computed with `useWatch` on all fee fields)

**Done when**: Brand switch changes layout; selecting a fee master auto-fills amount; total updates live.

---

## Phase 4 — Form Orchestrator & Page

### T-022 — `enrollment-form.tsx` (orchestrator)

**File**: `src/app/(private)/membership-applications/new/_components/enrollment-form.tsx` _(new)_

This is the main `'use client'` component. Key responsibilities:

1. **Form init**:

   ```ts
   const form = useForm<DirectEnrollmentFormValues>({
     resolver: zodResolver(directEnrollmentSchema),  // DirectEnrollmentRequestBaseSchema + superRefine
     defaultValues: { ... }
   })
   ```

2. **superRefine logic** (defined in this file, passed to `.superRefine()`):
   - `applicant.date_of_birth` + `contract.brand` → `isBelowMinAge` → `ctx.addIssue` with `code: 'custom'`
   - `contract.start_date` → > today+2months → `ctx.addIssue`
   - `application_type === 'corporate'` + missing `corporate` → `ctx.addIssue`
   - `application_type === 'employee_discount'` + missing `employee_discount` → `ctx.addIssue`

3. **Watched values**: `applicationType`, `brand` via `useWatch`

4. **BL check** (`useEffect` + debounce 500ms):
   - Watch all 9 applicant fields
   - Fire only when all required fields (`last_name_kanji`, `first_name_kanji`, `date_of_birth`, `gender`, `phone`, `email`) are non-empty
   - Call `postCrmMembershipApplicationsBlacklistCheckMutation()` → set `blState: 'unchecked' | 'no-match' | 'match'`

5. **Fee masters**: `useQuery(getCrmMembershipApplicationsEnrollmentFeeMastersOptions({ query: { brand, applicationType } }))` — re-fetches when brand or applicationType changes

6. **Upload gate**: Track `isAnyUploadInProgress` boolean state (updated by `ImageUpload.onUploadingChange` callbacks); included in submit button disabled condition

7. **Submit flow**:

   ```
   handleSubmit(onSubmit)
     → if isMinor(calcAge(dob)) && !isBelowMinAge: setMinorDialogOpen(true)  [wait]
     → else: callSubmitMutation()

   onMinorConfirm → callSubmitMutation()

   callSubmitMutation → postCrmMembershipApplicationsDirectMutation
     → onSuccess: toast.success('入会申請を登録しました') + router.push('/membership-applications')
     → onError: toast.error('申請の登録に失敗しました')
   ```

8. **Layout**:
   ```tsx
   <Form {...form}>
     <form onSubmit={...} className="flex flex-col gap-6 max-w-240 mx-auto">
       <ApplicationTypeSection />
       <ApplicantInfoSection />
       <ContractInfoSection />
       {applicationType === 'corporate' && <CorporateInfoSection />}
       {applicationType === 'employee_discount' && <EmployeeDiscountSection />}
       <ProxyRecordSection />
       <BlacklistResultSection state={blState} />
       <FeeSection />
       <div className="flex items-center justify-end gap-2 border-t p-4">
         <Button variant="outline" size="lg" type="button" onClick={→ router.push(...)}>キャンセル</Button>
         <Button size="lg" type="submit" disabled={!isValid || isSubmitting || isAnyUploadInProgress}>入会登録</Button>
       </div>
     </form>
     <MinorConsentDialog ... />
   </Form>
   ```

**Done when**: Full form flow works end-to-end in the browser: fill all sections → submit → toast success → redirect to list page.

---

### T-023 — `new/page.tsx` (RSC shell)

**File**: `src/app/(private)/membership-applications/new/page.tsx` _(new)_

```tsx
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { PageHeader } from '@/components/common/page-header';

import { EnrollmentForm } from './_components/enrollment-form';

export default async function NewMembershipApplicationPage() {
  return (
    <main className="bg-muted/40 min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto mb-4 max-w-240">
        <PageHeader
          breadcrumb={
            <BreadcrumbNav
              items={[
                { label: '入会申請管理', href: '/membership-applications' },
                { label: '管理画面入会' },
              ]}
            />
          }
          title="管理画面入会"
        />
      </div>
      <EnrollmentForm />
    </main>
  );
}
```

**Done when**: Navigating to `/membership-applications/new` renders the page without errors; breadcrumb link navigates back to list.

---

## Phase 5 — Entry Point & Polish

### T-024 — Add "新規入会登録" button to list page

**File**: `src/app/(private)/membership-applications/page.tsx`

In the header `div` (alongside `<h1>入会申請管理</h1>`), add:

```tsx
import Link from 'next/link';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

<Button asChild>
  <Link href="/membership-applications/new">
    <Plus className="mr-2 size-4" />
    新規入会登録
  </Link>
</Button>;
```

**Done when**: Button appears in the list page header; clicking navigates to `/membership-applications/new`.

---

### T-025 — Type-check & lint

**Run in terminal**:

```bash
npm run type-check
npm run lint
```

Fix all TypeScript errors and ESLint warnings introduced by the new files.

**Done when**: Both commands exit with code `0`.

---

## Task Dependency Map

```
T-001 → T-002 → T-011
T-003 (independent)
T-004 → T-005
T-006 → T-010 → T-011
T-007 → T-010
T-008 → T-010
T-009 → T-010
T-017b → T-010 → T-011
T-011 → T-022
T-012 → T-015, T-018
T-013 → T-022
T-014 → T-022
T-015 → T-022
T-016 → T-022
T-017 → T-022
T-018 → T-022
T-019 → T-022
T-020 → T-022
T-021 → T-022
T-022 → T-023
T-023 → T-024 → T-025
```

---

## Checklist

- [ ] T-001 Zod schemas: fee master + upload response
- [ ] T-002 Zod schemas: BL check + direct enrollment
- [ ] T-003 `age.util.ts`
- [ ] T-004 Mock DB: seed data
- [ ] T-005 Mock DB: `createDirect`
- [ ] T-006 Route: `POST /crm/uploads`
- [ ] T-007 Route: `GET .../enrollment-fee-masters`
- [ ] T-008 Route: `POST .../blacklist-check`
- [ ] T-009 Route: `POST .../direct`
- [ ] T-010 Register routes in `_routes/index.ts`
- [ ] T-011 Regenerate OpenAPI client
- [ ] T-012 `face-photo-upload.tsx`
- [ ] T-013 `minor-consent-dialog.tsx`
- [ ] T-014 `application-type-section.tsx`
- [ ] T-015 `applicant-info-section.tsx`
- [ ] T-016 `contract-info-section.tsx`
- [ ] T-017 `corporate-info-section.tsx`
- [ ] T-017b Route: `GET .../corporate-masters`
- [ ] T-018 `employee-discount-section.tsx`
- [ ] T-019 `proxy-record-section.tsx`
- [ ] T-020 `blacklist-result-section.tsx`
- [ ] T-021 `fee-section.tsx`
- [ ] T-022 `enrollment-form.tsx` (orchestrator)
- [ ] T-023 `new/page.tsx`
- [ ] T-024 Entry point button on list page
- [ ] T-025 Type-check + lint pass

---

_Tasks status: **ready** — hand off to `speckit.implement`._
