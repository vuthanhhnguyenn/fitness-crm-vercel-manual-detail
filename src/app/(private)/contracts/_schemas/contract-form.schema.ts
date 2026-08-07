import { z } from 'zod';

import {
  MainContractOtherStoreUsage,
  MainContractStatus,
  MainContractType,
  StoreListBrand,
} from '@/lib/api/types.gen';

export const DAYS_OF_WEEK = ['月', '火', '水', '木', '金', '土', '日'] as const;

export const usageHourSchema = z.object({
  day: z.enum(DAYS_OF_WEEK),
  from: z.string().default('00:00'),
  to: z.string().default('23:59'),
  all_day: z.boolean().default(true),
});

export const contractFormSchema = z.object({
  // Basic info
  name: z.string().min(1, '主契約名は必須です'),
  code: z.string().min(1, 'コードは必須です'),
  contract_type: z.nativeEnum(MainContractType, { error: '契約タイプを選択してください' }),
  other_store_usage: z.nativeEnum(MainContractOtherStoreUsage).optional(),
  brand: z.nativeEnum(StoreListBrand, { error: 'ブランドを選択してください' }),
  parent_contract_id: z.string().nullable().optional(),
  old_code: z.string().optional(),
  mutual_use: z.boolean().default(false),
  companion_benefit_enabled: z.boolean().default(false),
  public_name: z.string().optional(),
  description: z.string().optional(),

  // Public info
  company: z.string().nullable().optional(),
  regulation: z.string().nullable().optional(),
  public_description: z.string().optional(),
  memo: z.string().nullable().optional(),

  // Pricing
  price_including_tax: z.coerce
    .number({ error: '数字を入力してください' })
    .nonnegative('0以上の値を入力してください'),
  suspension_fee: z.coerce.number().nonnegative().optional(),
  tax_rate: z.coerce.number({ error: '税率を選択してください' }),
  accounting_code: z.string({ error: '会計コードは必須です' }).min(1, '会計コードは必須です'),
  enrollment_fee: z.coerce.number().nonnegative().optional(),
  handling_fee: z.coerce.number().nonnegative().optional(),
  card_fee: z.coerce.number().nonnegative().optional(),
  security_fee: z.coerce.number().nonnegative().optional(),
  maintenance_fee: z.coerce.number().nonnegative().optional(),

  // Conditions
  start_date: z.string({ error: '利用開始日は必須です' }).min(1, '利用開始日は必須です'),
  monthly_limit: z.coerce.number().int().nonnegative().nullable().optional(),
  suspension_monthly_limit: z.coerce.number().int().nonnegative().nullable().optional(),
  usage_hours_by_day: z
    .array(usageHourSchema)
    .default(DAYS_OF_WEEK.map((day) => ({ day, from: '00:00', to: '23:59', all_day: true }))),

  // Suspension / withdrawal
  suspendable_months: z.string().optional(),
  cancellable_months: z.string().optional(),
  initial_payment_months: z.coerce.number().int().nonnegative().optional(),

  // Restrictions
  age_restriction: z.string().optional(),
  gender_restriction: z.string().optional(),
  changeability: z.string().optional(),
  billing_enabled: z.boolean().optional(),
  modifiable: z.string().optional(),
  same_day_cancellation: z.boolean().default(false),
  family_contract_allowed: z.boolean().default(false),

  // Status
  status: z.nativeEnum(MainContractStatus).default(MainContractStatus.ACTIVE),
});

export type ContractFormValues = z.input<typeof contractFormSchema>;
export type ContractFormSubmitValues = z.output<typeof contractFormSchema>;
