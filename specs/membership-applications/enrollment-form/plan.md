# Technical Plan: FR-M009 — CRM Direct Enrollment Form (管理画面入会)

> **Spec**: `specs/membership-applications/enrollment-form/spec.md`  
> **Plan status**: approved  
> **Created**: 2026-05-07  
> **UI prototype**: `.cache/fitness-crm-ui/src/pages/enrollment-application-form.tsx`

---

## 1. UI Prototype Registry Entry

| Branch                    | Screen name  | UI slug                       | Cache path                                                        | Spec IDs         |
| ------------------------- | ------------ | ----------------------------- | ----------------------------------------------------------------- | ---------------- |
| `feature/enrollment-form` | 管理画面入会 | `enrollment-application-form` | `.cache/fitness-crm-ui/src/pages/enrollment-application-form.tsx` | FR-M009, FR-M010 |

---

## 2. Architecture Overview

```
[page.tsx — RSC]
  └── <EnrollmentForm /> — 'use client', react-hook-form + Zod resolver
        ├── ApplicationTypeSection      (Section 1)
        ├── ApplicantInfoSection        (Section 2, incl. ImageUpload)
        ├── ContractInfoSection         (Section 3)
        ├── CorporateInfoSection        (Section 3.5, conditional)
        ├── EmployeeDiscountSection     (Section 3.6, conditional)
        ├── ProxyRecordSection          (Section 4, readonly auto-values)
        ├── BlacklistResultSection      (Section 5, derived from BL mutation)
        ├── FeeSection                  (Section 6, brand-aware)
        └── Footer (キャンセル / 入会登録)

[Minor Consent Dialog]               (shown at submit when applicant is minor)
```

State management strategy:

- **Form state**: single `useForm<DirectEnrollmentFormValues>` at `EnrollmentForm` level; child sections receive `control` + `watch` values as props
- **BL check**: `useMutation` (POST mock endpoint) triggered by `useEffect` debounced on `lastName + firstName + dateOfBirth` changes
- **Fee masters**: `useQuery(getCrmMembershipApplicationsEnrollmentFeeMastersOptions())` loaded on mount; filtered client-side
- **Submit**: `useMutation` → POST `/crm/membership-applications/direct` → `toast.success` + `router.push('/membership-applications')`

---

## 3. Data Model

### 3.1 New Zod Schemas — `src/app/api/_schemas/membership-application.schema.ts`

Append after existing schemas:

```ts
// --- Enrollment Fee Master ---
export const EnrollmentFeeMasterSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  brand: z.enum(['JOYFIT', 'FIT365', '共通']),
  applicationType: z.string().optional(),
  isActive: z.boolean(),
});
export type EnrollmentFeeMaster = z.infer<typeof EnrollmentFeeMasterSchema>;
export const GetEnrollmentFeeMastersResponseSchema = z.object({
  items: z.array(EnrollmentFeeMasterSchema),
});

// --- BL Check ---
// Uses full applicant info for higher matching accuracy
export const BlacklistCheckRequestSchema = z.object({
  last_name_kanji: z.string(),
  first_name_kanji: z.string(),
  last_name_kana: z.string(),
  first_name_kana: z.string(),
  date_of_birth: z.string(),
  gender: GenderSchema,
  phone: z.string(),
  email: z.string(),
  address: z.string().optional(),
});
export const BlacklistCheckResponseSchema = z.object({
  checked: z.boolean(),
  matched: z.boolean(),
});

// --- Direct Enrollment Request ---
// Enum values are English snake_case; UI labels (Japanese) are rendered via a display map in the form
export const ApplicationTypeSchema = z.enum([
  'normal', // 通常入会
  'employee_discount', // 社員割引入会
  'corporate', // 法人会員入会
  'special_contract', // 特別契約入会
]);
export type ApplicationType = z.infer<typeof ApplicationTypeSchema>;

// Display label map — used in Select options and any display context
export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  normal: '通常入会',
  employee_discount: '社員割引入会',
  corporate: '法人会員入会',
  special_contract: '特別契約入会',
};
export const GenderSchema = z.enum(['男性', '女性', 'その他', '回答しない']);
export const BrandSchema = z.enum(['FIT365', 'JOYFIT']);
export const PaymentMethodSchema = z.enum(['クレジットカード', '口座振替']);

export const DirectEnrollmentApplicantSchema = z.object({
  last_name_kanji: z.string().min(1).max TEXT_MAX_LENGTH,
  first_name_kanji: z.string().min(1).max TEXT_MAX_LENGTH,
  last_name_kana: z
    .string()
    .min(1)
    .max TEXT_MAX_LENGTH
    .regex(/^[\u30A0-\u30FF]+$/, 'フリガナは全角カタカナで入力してください'),
  first_name_kana: z
    .string()
    .min(1)
    .max TEXT_MAX_LENGTH
    .regex(/^[\u30A0-\u30FF]+$/, 'フリガナは全角カタカナで入力してください'),
  date_of_birth: z.string().min(1), // ISO 8601 date — age refinement added in superRefine
  gender: GenderSchema,
  phone: z
    .string()
    .min(1)
    .max TEXT_MAX_LENGTH
    .regex(/^0\d{1,4}-\d{1,4}-\d{4}$/, '正しい電話番号形式で入力してください'),
  email: z.string().email('正しいメールアドレスを入力してください').max TEXT_MAX_LENGTH,
  address: z.string().max(1000).optional(),
  face_photo_url: z.string().url().min(1, '顔写真は必須です'), // URL returned by POST /crm/uploads
});

export const DirectEnrollmentContractSchema = z.object({
  brand: BrandSchema,
  store_id: z.string().min(1).max TEXT_MAX_LENGTH,
  plan_id: z.string().min(1).max TEXT_MAX_LENGTH,
  start_date: z.string().min(1), // ISO 8601 date — 2-month constraint in superRefine
  campaign_id: z.string().max TEXT_MAX_LENGTH.optional(),
  payment_method: PaymentMethodSchema,
});

export const DirectEnrollmentCorporateSchema = z.object({
  corporate_id: z.string().min(1).max TEXT_MAX_LENGTH,
  billing_pattern: z.string().min(1).max TEXT_MAX_LENGTH,
  enrollment_fee_bearer: z.string().max TEXT_MAX_LENGTH.optional(),
});

export const DirectEnrollmentEmployeeDiscountSchema = z.object({
  partner_company_id: z.string().min(1).max TEXT_MAX_LENGTH,
  employee_number: z.string().min(1).max TEXT_MAX_LENGTH,
  employee_id_verified: z.literal(true, {
    errorMap: () => ({ message: '社員証の確認が必要です' }),
  }),
  employment_cert_verified: z.literal(true, {
    errorMap: () => ({ message: '在籍証明書の確認が必要です' }),
  }),
  employee_id_image_url: z.string().url().optional(), // URL returned by POST /crm/uploads
  employment_cert_image_url: z.string().url().optional(), // URL returned by POST /crm/uploads
});

export const DirectEnrollmentFeesSchema = z.object({
  enrollment_fee_master_id: z.string().max TEXT_MAX_LENGTH.optional(),
  enrollment_fee_amount: z.number().optional(),
  card_issuance_fee: z.number().optional(),
  registration_fee: z.number().optional(),
  first_month_fee_prorated: z.number().optional(),
  next_month_fee: z.number().optional(),
});

// Base schema — cross-field superRefine applied in enrollment-form.tsx via .superRefine()
export const DirectEnrollmentRequestBaseSchema = z.object({
  application_type: ApplicationTypeSchema,
  applicant: DirectEnrollmentApplicantSchema,
  contract: DirectEnrollmentContractSchema,
  corporate: DirectEnrollmentCorporateSchema.optional(),
  employee_discount: DirectEnrollmentEmployeeDiscountSchema.optional(),
  fees: DirectEnrollmentFeesSchema,
});

export const DirectEnrollmentResponseSchema = z.object({
  applicationId: z.string(),
  memberId: z.string(),
  status: z.literal('pending'),
});
```

**Cross-field refinements** (added in `enrollment-form.tsx` via `.superRefine()`):

- Age < brand minimum → `ctx.addIssue` on `applicant.date_of_birth`
- `start_date` > today+2months → `ctx.addIssue` on `contract.start_date`
- `application_type === 'corporate'` → corporate fields required
- `application_type === 'employee_discount'` → employee_discount fields required

### 3.2 Mock DB Extensions — `src/app/api/_mock-db.ts`

Add the following to the `DbType` and implementation:

#### Enrollment Fee Masters (`enrollmentFeeMasters`)

```ts
enrollmentFeeMasters: {
  _rows: EnrollmentFeeMaster[];
  _seeded: boolean;
  _seed(): void;
  getAll(): EnrollmentFeeMaster[];
  getFiltered(brand: string, applicationType: string): EnrollmentFeeMaster[];
}
```

Seed data (aligned with UI prototype):
| id | name | amount | brand | applicationType | isActive |
|---|---|---|---|---|---|
| EF001 | 標準入会金 | 2200 | JOYFIT | `normal` | true |
| EF002 | ファミリー入会金 | 1100 | JOYFIT | `normal` | true |
| EF003 | 法人入会金 | 5500 | 共通 | `corporate` | true |
| EF004 | 社員割引入会金 | 0 | 共通 | `employee_discount` | true |
| EF005 | 特別契約入会金 | 0 | 共通 | `special_contract` | true |

#### Corporate Masters (`corporateMasters`)

```ts
corporateMasters: {
  _rows: { id: string; name: string; code: string }[];
  _seed(): void;
  getAll(): { id: string; name: string; code: string }[];
}
```

Seed: 株式会社サンプル (CORP-001), 富士コーポレーション (CORP-002), グリーンテクノロジー (CORP-003)

#### Partner Companies (`partnerCompanies`)

Same structure as corporateMasters (may reuse same mock data for Phase 1).

#### Direct Enrollment write

`db.membershipApplications.createDirect(data)` — inserts a new `MembershipApplication` row with:

- `applicant_name = lastNameKanji + firstNameKanji`
- `status = 'pending'`
- `blacklist_match` = result from BL check call
- `is_proxy = true`
- All other spec fields stored in `MembershipApplicationDetails`

---

## 4. API Routes

### 4.1 New routes

| Method | Path                                                  | Handler file                                                              | Purpose                                       |
| ------ | ----------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------- |
| `GET`  | `/crm/membership-applications/enrollment-fee-masters` | `src/app/api/crm/membership-applications/enrollment-fee-masters/route.ts` | Fetch enrollment fee master list              |
| `POST` | `/crm/membership-applications/blacklist-check`        | `src/app/api/crm/membership-applications/blacklist-check/route.ts`        | BL check with full applicant info             |
| `POST` | `/crm/membership-applications/direct`                 | `src/app/api/crm/membership-applications/direct/route.ts`                 | Create direct enrollment application          |
| `POST` | `/crm/uploads`                                        | `src/app/api/crm/uploads/route.ts`                                        | Upload image file → returns `{ url: string }` |

> **Note**: `/direct` must be registered before `[id]` to avoid Next.js dynamic route shadowing — the route file sits at `direct/route.ts` parallel to `[id]/route.ts`, which is correct.

### 4.2 Route Details

#### `GET /crm/membership-applications/enrollment-fee-masters`

- Query: `brand?`, `applicationType?`
- Response: `GetEnrollmentFeeMastersResponseSchema`
- Filter: active only + brand match (共通 always included) + applicationType match

#### `POST /crm/membership-applications/blacklist-check`

- Body: `BlacklistCheckRequestSchema` (full applicant info: name kanji/kana, DOB, gender, phone, email, address)
- Response: `BlacklistCheckResponseSchema`
- Mock logic: return `matched: true` if `last_name_kanji === '田中'` (simple name-based mock)

#### `POST /crm/membership-applications/direct`

- Body: `DirectEnrollmentRequestBaseSchema` (server-side `.safeParse`)
- Response: `DirectEnrollmentResponseSchema`
- Error cases: 400 (validation), 403 (permission), 409 (duplicate)
- Mock: calls `db.membershipApplications.createDirect(body)`

### 4.3 `_routes/index.ts` additions

Add imports for all 4 new route files.

---

## 5. Generated Client

After adding routes, run:

```bash
npm run generate-openapi   # regenerate openapi.json
npm run generate-api       # regenerate src/lib/api/
```

New generated factories:

- `getCrmMembershipApplicationsEnrollmentFeeMastersOptions()`
- `postCrmMembershipApplicationsBlacklistCheckMutation()`
- `postCrmMembershipApplicationsDirectMutation()`
- `postCrmUploadsMutation()`

---

## 6. Frontend Component Plan

### 6.1 File structure

```
src/app/(private)/membership-applications/
└── new/
    ├── page.tsx                                  # RSC shell — no 'use client'
    └── _components/
        ├── enrollment-form.tsx                   # 'use client' — form orchestrator
        ├── application-type-section.tsx          # Section 1
        ├── applicant-info-section.tsx            # Section 2
        ├── contract-info-section.tsx             # Section 3
        ├── corporate-info-section.tsx            # Section 3.5 (conditional)
        ├── employee-discount-section.tsx         # Section 3.6 (conditional)
        ├── proxy-record-section.tsx              # Section 4
        ├── blacklist-result-section.tsx          # Section 5
        ├── fee-section.tsx                       # Section 6
        ├── face-photo-upload.tsx                 # Reusable drag-drop upload
        └── minor-consent-dialog.tsx              # Parental consent dialog (Q1)
```

### 6.2 Key implementation details

#### `page.tsx`

```tsx
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { EnrollmentForm } from './_components/enrollment-form';

export default async function NewMembershipApplicationPage() {
  return (
    <main className="bg-muted/40 min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto mb-4 max-w-[960px]">
        <BreadcrumbNav ... />
        <h1 className="text-xl font-bold">管理画面入会</h1>
      </div>
      <EnrollmentForm />
    </main>
  );
}
```

#### `enrollment-form.tsx`

- `useForm<DirectEnrollmentFormValues>` with `zodResolver(directEnrollmentSchema)` where `directEnrollmentSchema = DirectEnrollmentRequestBaseSchema.superRefine(...)`
- `const applicationType = useWatch({ control, name: 'application_type' })`
- `const brand = useWatch({ control, name: 'contract.brand' })`
- BL check: `useMutation(postCrmMembershipApplicationsBlacklistCheckMutation())` + `useEffect` with `debounce(500ms)` on all applicant fields (`last_name_kanji`, `first_name_kanji`, `last_name_kana`, `first_name_kana`, `date_of_birth`, `gender`, `phone`, `email`, `address`) — fires only when all required applicant fields are non-empty — stores result in local state `blResult`
- Submit handler: if minor → open `MinorConsentDialog` → on confirm → call submit mutation
- Submit mutation: `useMutation(postCrmMembershipApplicationsDirectMutation())`, `onSuccess` → `toast.success('入会申請を登録しました')` + `router.push('/membership-applications')`

#### `face-photo-upload.tsx`

- Props: `value: string | null` (URL), `onChange: (url: string | null) => void`, `label?: string`
- Uses hidden `<input type="file" accept="image/jpeg,image/png">` triggered by click on drop zone
- On file select: validates size ≤ 5MB → calls `postCrmUploadsMutation()` (`multipart/form-data`) → receives `{ url: string }` → calls `onChange(url)`
- Shows preview thumbnail from URL once upload succeeds
- Drag-and-drop events: `onDragOver`, `onDrop`
- Upload in progress: shows spinner overlay on drop zone; disables "入会登録" button until upload resolves
- Same component reused for 社員証画像 and 在籍証明書画像 in Section 3.6

#### `blacklist-result-section.tsx`

- Props: `blState: 'unchecked' | 'no-match' | 'match'`
- Three render states matching spec Section 4.7
- Prototype Badge style: `variant="outline"` with custom `className` for color (bg-warning/15, bg-success/15, bg-destructive/15)

#### `fee-section.tsx`

- Props: `control`, `brand`, `applicationType`, `feeMasters: EnrollmentFeeMaster[]`
- When `brand === ''` → fallback text
- When `brand === 'FIT365'` → FIT365 layout (カード発行料, 初月, 翌月)
- When `brand === 'JOYFIT'` → JOYFIT layout (入会金マスタ Select, 金額readonly, 登録事務手数料, 初月, 翌月)
- Total auto-computed from watched fee fields

#### `minor-consent-dialog.tsx`

- Props: `open: boolean`, `onConfirm: () => void`, `onCancel: () => void`
- `AlertDialog` with single confirm checkbox: "保護者の同意を得た上で申し込みます"
- Confirm button enabled only when checkbox is checked

### 6.3 Shadcn primitives used

`Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`, `Input`, `Label`, `Badge`, `Separator`, `Select` / `SelectTrigger` / `SelectContent` / `SelectItem`, `Checkbox`, `AlertDialog` family — all already present in `src/components/ui/`

---

## 7. Navigation & Entry Point

**Entry button**: Add a "新規入会登録" `Button` (variant `default`) to the existing `membership-applications/page.tsx` header row, navigating to `/membership-applications/new`.

---

## 8. Age Validation Logic

Extracted to `src/utils/age.util.ts` (new file):

```ts
import { differenceInYears, parseISO } from 'date-fns';

export function calcAge(dateOfBirth: string): number {
  return differenceInYears(new Date(), parseISO(dateOfBirth));
}

export function getMinAge(brand: 'FIT365' | 'JOYFIT'): number {
  return brand === 'FIT365' ? 16 : 15;
}

export function isMinor(age: number): boolean {
  return age < 20;
}

export function isBelowMinAge(age: number, brand: 'FIT365' | 'JOYFIT'): boolean {
  return age < getMinAge(brand);
}
```

Used in:

- Zod `.superRefine()` inside `enrollment-form.tsx`
- Server-side: `POST /crm/membership-applications/direct` route handler

---

## 9. Constraints & Notes

| Item                                    | Decision                                                                                                                                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image upload                            | `POST /crm/uploads` mock endpoint — accepts `multipart/form-data`, returns `{ url: string }`. Mock stores nothing; returns a fake CDN URL. Will be replaced by S3 in Phase 4. |
| BL check                                | Uses full applicant info (all fields in `BlacklistCheckRequestSchema`). Mock: `matched = true` when `last_name_kanji === '田中'`. Real logic deferred to Phase 3.             |
| Field max lengths                       | Text inputs: `max TEXT_MAX_LENGTH`. Textarea / address field: `max(1000)`. Enforced in Zod schema and shown as inline validation error.                                       |
| Form schema naming                      | All Zod schema field names in `snake_case`.                                                                                                                                   |
| BL result blocks submit                 | No — soft warning only (Q2).                                                                                                                                                  |
| Minor consent                           | Dialog at submit time (Q1). Age < brand min → inline Zod error.                                                                                                               |
| Store options                           | Phase 1: use `db.stores.getList()` from existing mock. No scope filtering.                                                                                                    |
| Plan options                            | Phase 1: hardcoded list per prototype. Master API deferred.                                                                                                                   |
| Campaign options                        | Phase 1: hardcoded list per prototype.                                                                                                                                        |
| `enrollment_fee_master_id`              | Store both master ID and resolved amount (Q3).                                                                                                                                |
| Existing `enrollment_fee_yen` on brands | Not reused — enrollment fee master is per-applicationType.                                                                                                                    |

---

## 10. Execution Order (for tasks)

1. **Data model**: Add Zod schemas to `membership-application.schema.ts`
2. **Mock DB**: Add `enrollmentFeeMasters`, `corporateMasters`, `partnerCompanies` seed + `createDirect` method
3. **API routes**: Add 4 new route files (`enrollment-fee-masters`, `blacklist-check`, `direct`, `uploads`) + register in `_routes/index.ts`
4. **OpenAPI regen**: `npm run generate-openapi && npm run generate-api`
5. **Shared utility**: Create `src/utils/age.util.ts`
6. **Reusable component**: Create `face-photo-upload.tsx` (calls `POST /crm/uploads`, stores URL)
7. **Form sections**: Create sections 1–6 in order (1 → 2 → 3 → 3.5 → 3.6 → 4 → 5 → 6)
8. **Form orchestrator**: Create `enrollment-form.tsx` (wires all sections + BL + submit)
9. **Minor consent dialog**: Create `minor-consent-dialog.tsx`
10. **Page shell**: Create `new/page.tsx`
11. **Entry point**: Add "新規入会登録" button to list page header
12. **Type-check + lint**: `npm run type-check && npm run lint`

---

_Plan status: **approved** — ready for `speckit.tasks`._
