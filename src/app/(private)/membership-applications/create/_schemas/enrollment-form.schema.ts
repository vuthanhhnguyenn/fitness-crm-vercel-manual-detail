import { TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { calcAge, isBelowMinAge } from '@/utils/age.util';
import { z } from 'zod';

import type { GetCrmMembershipApplicationsEnrollmentFeeMastersResponses } from '@/lib/api';

// ─── Applicant (FR-044 – FR-047) ────────────────────────────────────────────

const TEXT_MAX_LENGTH_MESSAGE = `${TEXT_MAX_LENGTH}文字以内で入力してください`;

export const DirectEnrollmentApplicantSchema = z.object({
  family_name: z
    .string()
    .min(1, { message: '姓を入力してください' })
    .max(TEXT_MAX_LENGTH, { message: TEXT_MAX_LENGTH_MESSAGE }),
  given_name: z
    .string()
    .min(1, { message: '名を入力してください' })
    .max(TEXT_MAX_LENGTH, { message: TEXT_MAX_LENGTH_MESSAGE }),
  family_name_kana: z
    .string()
    .min(1, { message: '姓（カナ）を入力してください' })
    .max(TEXT_MAX_LENGTH, { message: TEXT_MAX_LENGTH_MESSAGE })
    .regex(/^[゠-ヿ\s]+$/, 'カタカナで入力してください'),
  given_name_kana: z
    .string()
    .min(1, { message: '名（カナ）を入力してください' })
    .max(TEXT_MAX_LENGTH, { message: TEXT_MAX_LENGTH_MESSAGE })
    .regex(/^[゠-ヿ\s]+$/, 'カタカナで入力してください'),
  birth_date: z
    .string()
    .min(1, { message: '生年月日を入力してください' })
    .check(z.iso.date('有効な日付を入力してください')),
  gender: z.enum(['male', 'female', 'other', 'no_answer'] as const, {
    error: '性別を選択してください',
  }),
  phone: z
    .string()
    .min(1, { message: '電話番号を入力してください' })
    .regex(/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/, { message: '有効な電話番号を入力してください' }),
  email: z
    .string()
    .min(1, { message: 'メールアドレスを入力してください' })
    .max(TEXT_MAX_LENGTH, { message: TEXT_MAX_LENGTH_MESSAGE })
    .check(z.email({ error: '有効なメールアドレスを入力してください' })),
  address: z.string().max(TEXT_MAX_LENGTH, { message: TEXT_MAX_LENGTH_MESSAGE }).optional(),
  face_photo_id: z.string().min(1, { message: '顔写真をアップロードしてください' }),
});

// ─── Contract (FR-048 – FR-050) ──────────────────────────────────────────────

export const DirectEnrollmentContractSchema = z.object({
  brand_id: z.enum(['FIT365', 'JOYFIT'] as const, { error: 'ブランドを選択してください' }),
  store_id: z.string().min(1, { message: '入会店舗を選択してください' }),
  plan_id: z.string().min(1, { message: 'プランを選択してください' }),
  usage_start_date: z
    .string()
    .min(1, { message: '利用開始日を入力してください' })
    .check(z.iso.date('有効な日付を入力してください')),
  payment_method: z.enum(['credit_card', 'bank_transfer'] as const, {
    error: '決済方法を選択してください',
  }),
  campaign_id: z.string().nullable().optional(),
  enrollment_fee_master_id: z.string().nullable().optional(),
});

// ─── Consent / proxy record (FR-051) ────────────────────────────────────────

export const DirectEnrollmentConsentSchema = z.object({
  agreement_datetime: z.string().min(1, { message: '合意日時を入力してください' }),
  parental_consent: z.boolean(),
});

// ─── Full request schema ─────────────────────────────────────────────────────

export const DirectEnrollmentRequestBaseSchema = z.object({
  applicant: DirectEnrollmentApplicantSchema,
  contract: DirectEnrollmentContractSchema,
  consent: DirectEnrollmentConsentSchema,
});

export const directEnrollmentSchema = DirectEnrollmentRequestBaseSchema.superRefine((data, ctx) => {
  const age = calcAge(data.applicant.birth_date);
  const brand = data.contract.brand_id;

  // Below the brand minimum (FR-046) — the route also enforces this server-side.
  if (isBelowMinAge(age, brand)) {
    ctx.addIssue({
      code: 'custom',
      path: ['applicant', 'birth_date'],
      message: `${brand === 'FIT365' ? '16' : '15'}歳未満は申請できません。`,
    });
  }

  // Parental consent required for a minor (FR-047).
  if (age < 18 && !isBelowMinAge(age, brand) && !data.consent.parental_consent) {
    ctx.addIssue({
      code: 'custom',
      path: ['consent', 'parental_consent'],
      message: '保護者の同意確認が必要です。',
    });
  }

  // Agreement timestamp must not be in the future (FR-051).
  if (data.consent.agreement_datetime && new Date(data.consent.agreement_datetime) > new Date()) {
    ctx.addIssue({
      code: 'custom',
      path: ['consent', 'agreement_datetime'],
      message: '合意日時は未来の日時を指定できません。',
    });
  }

  // JOYFIT selects the enrolment fee from a master; FIT365 has no 入会金 line.
  if (brand === 'JOYFIT' && !data.contract.enrollment_fee_master_id) {
    ctx.addIssue({
      code: 'custom',
      path: ['contract', 'enrollment_fee_master_id'],
      message: '入会金を選択してください。',
    });
  }
});

export type DirectEnrollmentFormValues = z.infer<typeof directEnrollmentSchema>;

export type EnrollmentFeeMaster =
  GetCrmMembershipApplicationsEnrollmentFeeMastersResponses[200]['masters'][number];
