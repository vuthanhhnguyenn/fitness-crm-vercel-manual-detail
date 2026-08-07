import { z } from 'zod';

import { StoreListBrand } from '@/lib/api/types.gen';

import {
  CAMPAIGN_ACCEPT_STATUS_VALUES,
  CAMPAIGN_APPLICATION_START_MONTH_LABELS,
  CAMPAIGN_STATUS_VALUES,
  type CampaignAcceptStatus,
  type CampaignApplicationStartMonthType,
  type CampaignAutoGrantTarget,
  type CampaignGenderCondition,
  type CampaignStatus,
} from '../_constants/constants';

const campaignCodeRegex = /^(?:OGF|[A-Z0-9]+)[A-Z0-9]{5}$/;

const requiredDateField = (message: string) => z.string().min(1, message);

export const CAMPAIGN_APPLICATION_DURATION_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: `${index + 1}ヶ月`,
}));

export const campaignFormSchema = z
  .object({
    name: z.string().trim().min(1, 'キャンペーン名は必須です').max(255),
    code: z
      .string()
      .trim()
      .min(1, 'キャンペーンコードは必須です')
      .max(255)
      .regex(
        campaignCodeRegex,
        'キャンペーンコードは「店舗ID＋英数字5桁」または「OGF＋英数字5桁」の形式で入力してください',
      ),
    brand: z.nativeEnum(StoreListBrand, { error: 'ブランドを選択してください' }),
    accept_status: z.enum(CAMPAIGN_ACCEPT_STATUS_VALUES).default('active'),
    note: z.string().trim().max(1000).default(''),
    recruitment_period_start: requiredDateField('募集期間の開始日は必須です'),
    recruitment_period_end: requiredDateField('募集期間の終了日は必須です'),
    usage_period_start: requiredDateField('利用開始期間の開始日は必須です'),
    usage_period_end: requiredDateField('利用開始期間の終了日は必須です'),
    application_start_month_type: z
      .enum(
        Object.keys(CAMPAIGN_APPLICATION_START_MONTH_LABELS) as [
          CampaignApplicationStartMonthType,
          ...CampaignApplicationStartMonthType[],
        ],
      )
      .default('first_month'),
    application_custom_month: z.preprocess(
      (value) => (value === '' || value === null || value === undefined ? null : value),
      z.coerce
        .number()
        .int()
        .min(1, '1以上の数値を入力してください')
        .max(12, '12以下の数値を入力してください')
        .nullable(),
    ),
    application_duration_months: z.coerce.number().int().min(1, '適用期間を選択してください'),
    main_contract_id: z.string().trim().min(1, '適用主契約を選択してください'),
    discount: z.object({
      first_month_enabled: z.boolean().default(false),
      second_month_enabled: z.boolean().default(false),
      amount: z.preprocess(
        (value) => (value === '' || value === null || value === undefined ? null : value),
        z.coerce
          .number()
          .int('整数で入力してください')
          .nonnegative('0以上の値を入力してください')
          .nullable(),
      ),
      rate: z.preprocess(
        (value) => (value === '' || value === null || value === undefined ? null : value),
        z.coerce
          .number()
          .int('整数で入力してください')
          .min(0, '0以上の値を入力してください')
          .max(100, '100以下の値を入力してください')
          .nullable(),
      ),
    }),
    auto_grant: z.object({
      enabled: z.boolean().default(false),
      target_type: z.enum(['all', 'conditional'] as const).default('all'),
      gender_conditions: z.array(z.enum(['male', 'female', 'other'] as const)).default([]),
      option_ids: z.array(z.string()).default([]),
    }),
    status: z.enum(CAMPAIGN_STATUS_VALUES).default('active'),
  })
  .superRefine((value, ctx) => {
    if (value.recruitment_period_start > value.recruitment_period_end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recruitment_period_end'],
        message: '募集期間の終了日は開始日以降にしてください',
      });
    }

    if (value.usage_period_start > value.usage_period_end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['usage_period_end'],
        message: '利用開始期間の終了日は開始日以降にしてください',
      });
    }

    if (
      value.application_start_month_type === 'custom_month' &&
      value.application_custom_month === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['application_custom_month'],
        message: 'X月指定の場合は開始月を入力してください',
      });
    }

    if (
      value.application_start_month_type !== 'custom_month' &&
      value.application_custom_month !== null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['application_custom_month'],
        message: 'X月指定を選択した場合のみ入力できます',
      });
    }

    const hasEnabledMonth =
      value.discount.first_month_enabled || value.discount.second_month_enabled;
    const hasAmount = value.discount.amount !== null;
    const hasRate = value.discount.rate !== null;

    if (!hasEnabledMonth && (hasAmount || hasRate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discount', 'enabled_months'],
        message: '割引を適用する対象月を選択してください',
      });
    }

    if (hasEnabledMonth && !hasAmount && !hasRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discount', 'enabled_months'],
        message: '割引額または割引率を入力してください',
      });
    }

    if (hasAmount && hasRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discount', 'amount'],
        message: '割引額と割引率は同時に設定できません',
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discount', 'rate'],
        message: '割引額と割引率は同時に設定できません',
      });
    }

    if (value.auto_grant.enabled && value.auto_grant.option_ids.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['auto_grant', 'option_ids'],
        message: '自動付与するオプションを1つ以上選択してください',
      });
    }

    if (
      value.auto_grant.enabled &&
      value.auto_grant.target_type === 'conditional' &&
      value.auto_grant.gender_conditions.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['auto_grant', 'gender_conditions'],
        message: '条件ありの場合は性別条件を1つ以上選択してください',
      });
    }
  });

export type CampaignFormValues = z.input<typeof campaignFormSchema>;
export type CampaignFormSubmitValues = z.output<typeof campaignFormSchema>;

export const emptyCampaignFormValues: CampaignFormValues = {
  name: '',
  code: '',
  brand: undefined as unknown as StoreListBrand,
  accept_status: 'active' satisfies CampaignAcceptStatus,
  note: '',
  recruitment_period_start: '',
  recruitment_period_end: '',
  usage_period_start: '',
  usage_period_end: '',
  application_start_month_type: 'first_month',
  application_custom_month: null,
  application_duration_months: 1,
  main_contract_id: '',
  discount: {
    first_month_enabled: false,
    second_month_enabled: false,
    amount: null,
    rate: null,
  },
  auto_grant: {
    enabled: false,
    target_type: 'all' satisfies CampaignAutoGrantTarget,
    gender_conditions: [] as CampaignGenderCondition[],
    option_ids: [],
  },
  status: 'active' satisfies CampaignStatus,
};
