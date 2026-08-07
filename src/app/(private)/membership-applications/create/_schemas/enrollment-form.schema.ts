import { calcAge, isBelowMinAge } from '@/utils/age.util';
import { addMonths, isAfter, parseISO, startOfDay } from 'date-fns';
import { z } from 'zod';

// ─── Application Type ─────────────────────────────────────────────────────────

export const ApplicationTypeSchema = z.enum(
  ['normal', 'employee_discount', 'corporate', 'special_contract'] as const,
  { error: '申請種別を選択してください' },
);

export type ApplicationType = z.infer<typeof ApplicationTypeSchema>;

export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  normal: '通常入会',
  employee_discount: '社員割引入会',
  corporate: '法人会員入会',
  special_contract: '特別契約入会',
};

// ─── Applicant ────────────────────────────────────────────────────────────────

export const DirectEnrollmentApplicantSchema = z.object({
  last_name_kanji: z.string().min(1, { message: '姓を入力してください' }).max(255),
  first_name_kanji: z.string().min(1, { message: '名を入力してください' }).max(255),
  last_name_kana: z
    .string()
    .min(1, { message: '姓（カナ）を入力してください' })
    .max(255)
    .regex(/^[\u30A0-\u30FF\s]+$/, 'カタカナで入力してください'),
  first_name_kana: z
    .string()
    .min(1, { message: '名（カナ）を入力してください' })
    .max(255)
    .regex(/^[\u30A0-\u30FF\s]+$/, 'カタカナで入力してください'),
  date_of_birth: z.string().min(1, { message: '生年月日を入力してください' }).check(z.iso.date()),
  gender: z.enum(['male', 'female', 'other'] as const, { error: '性別を選択してください' }),
  phone: z
    .string()
    .min(1, { message: '電話番号を入力してください' })
    .regex(/^\d{10,11}$/, { message: '電話番号は10〜11桁の数字で入力してください' }),
  email: z
    .string()
    .min(1, { message: 'メールアドレスを入力してください' })
    .max(255)
    .check(z.email({ error: '有効なメールアドレスを入力してください' })),
  address: z.string().max(1000).optional(),
  face_photo_url: z
    .string()
    .min(1, { message: '顔写真をアップロードしてください' })
    .check(z.url({ error: '有効なURLを入力してください' })),
});

// ─── Contract ─────────────────────────────────────────────────────────────────

export const DirectEnrollmentContractSchema = z.object({
  brand: z.enum(['FIT365', 'JOYFIT'] as const, { error: 'ブランドを選択してください' }),
  store_id: z.string().min(1, { message: '店舗を選択してください' }),
  plan_id: z.string().min(1, { message: 'プランを選択してください' }),
  start_date: z.string().min(1, { message: '利用開始日を入力してください' }).check(z.iso.date()),
  campaign_id: z.string().optional(),
  payment_method: z.enum(['credit_card', 'bank_transfer'] as const, {
    error: '支払方法を選択してください',
  }),
});

// ─── Corporate ───────────────────────────────────────────────────────────────

export const DirectEnrollmentCorporateSchema = z.object({
  corporate_id: z
    .string({ error: '法人を選択してください' })
    .min(1, { message: '法人を選択してください' }),
  billing_pattern: z
    .string({ error: '請求パターンを選択してください' })
    .min(1, { message: '請求パターンを選択してください' }),
  enrollment_fee_bearer: z
    .string({ error: '入会金負担者を選択してください' })
    .min(1, { message: '入会金負担者を選択してください' }),
});

// ─── Employee Discount ────────────────────────────────────────────────────────

export const DirectEnrollmentEmployeeDiscountSchema = z.object({
  partner_company_id: z
    .string({ error: '提携会社を選択してください' })
    .min(1, { message: '提携会社を選択してください' }),
  employee_number: z
    .string({ error: '社員番号を入力してください' })
    .min(1, { message: '社員番号を入力してください' })
    .max(255),
  employee_id_verified: z.literal(true, { error: '社員証の確認が必要です' }),
  employment_cert_verified: z.literal(true, { error: '在籍証明書の確認が必要です' }),
  employee_id_image_url: z.string().check(z.url()).optional(),
  employment_cert_image_url: z.string().check(z.url()).optional(),
});

// ─── Fees ─────────────────────────────────────────────────────────────────────

export const DirectEnrollmentFeesSchema = z.object({
  // JOYFIT fields
  enrollment_fee_master_id: z.string().optional(),
  enrollment_fee_amount: z.number().int().nonnegative().optional(),
  registration_fee: z.number().int().nonnegative().optional(),
  // FIT365 fields
  card_issuance_fee: z.number().int().nonnegative().optional(),
  // Shared
  first_month_fee_prorated: z.number().int().nonnegative().optional(),
  next_month_fee: z.number().int().nonnegative().optional(),
});

// ─── Full Form Schema (base, no superRefine) ──────────────────────────────────

export const DirectEnrollmentRequestBaseSchema = z.object({
  application_type: ApplicationTypeSchema,
  applicant: DirectEnrollmentApplicantSchema,
  contract: DirectEnrollmentContractSchema,
  corporate: DirectEnrollmentCorporateSchema.optional(),
  employee_discount: DirectEnrollmentEmployeeDiscountSchema.optional(),
  fees: DirectEnrollmentFeesSchema,
});

// ─── Validation helpers ───────────────────────────────────────────────────────

type Ctx = Parameters<Parameters<typeof DirectEnrollmentRequestBaseSchema.superRefine>[0]>[1];

function validateCorporate(data: z.infer<typeof DirectEnrollmentRequestBaseSchema>, ctx: Ctx) {
  if (data.application_type !== 'corporate') return;
  if (!data.corporate?.corporate_id)
    ctx.addIssue({
      code: 'custom',
      path: ['corporate', 'corporate_id'],
      message: '法人を選択してください。',
    });
  if (!data.corporate?.billing_pattern)
    ctx.addIssue({
      code: 'custom',
      path: ['corporate', 'billing_pattern'],
      message: '請求パターンを選択してください。',
    });
  if (!data.corporate?.enrollment_fee_bearer)
    ctx.addIssue({
      code: 'custom',
      path: ['corporate', 'enrollment_fee_bearer'],
      message: '入会金負担者を選択してください。',
    });
}

function validateEmployeeDiscount(
  data: z.infer<typeof DirectEnrollmentRequestBaseSchema>,
  ctx: Ctx,
) {
  if (data.application_type !== 'employee_discount') return;
  const ed = data.employee_discount;
  if (!ed?.partner_company_id)
    ctx.addIssue({
      code: 'custom',
      path: ['employee_discount', 'partner_company_id'],
      message: '提携会社を選択してください。',
    });
  if (!ed?.employee_number)
    ctx.addIssue({
      code: 'custom',
      path: ['employee_discount', 'employee_number'],
      message: '社員番号を入力してください。',
    });
  if (ed?.employee_id_verified !== true)
    ctx.addIssue({
      code: 'custom',
      path: ['employee_discount', 'employee_id_verified'],
      message: '社員証の確認が必要です。',
    });
  if (ed?.employment_cert_verified !== true)
    ctx.addIssue({
      code: 'custom',
      path: ['employee_discount', 'employment_cert_verified'],
      message: '在籍証明書の確認が必要です。',
    });
}

// ─── Full Form Schema (with superRefine) ─────────────────────────────────────

export const directEnrollmentSchema = DirectEnrollmentRequestBaseSchema.superRefine((data, ctx) => {
  // Age check
  const age = calcAge(data.applicant.date_of_birth);
  const brand = data.contract.brand;
  if (isBelowMinAge(age, brand)) {
    ctx.addIssue({
      code: 'custom',
      path: ['applicant', 'date_of_birth'],
      message: `${brand === 'FIT365' ? '16' : '15'}歳未満は申請できません。`,
    });
  }

  // Start date check
  const maxStartDate = addMonths(startOfDay(new Date()), 2);
  if (isAfter(parseISO(data.contract.start_date), maxStartDate)) {
    ctx.addIssue({
      code: 'custom',
      path: ['contract', 'start_date'],
      message: '利用開始日は本日から2ヶ月以内に設定してください。',
    });
  }

  // Conditional required: corporate / employee_discount
  validateCorporate(data, ctx);
  validateEmployeeDiscount(data, ctx);
});

export type DirectEnrollmentFormValues = z.infer<typeof directEnrollmentSchema>;

// ─── Enrollment Fee Master (local copy — API schema will be removed) ──────────

export interface EnrollmentFeeMaster {
  id: string;
  name: string;
  amount: number;
  brand: string;
  application_type: string;
  isActive: boolean;
}
