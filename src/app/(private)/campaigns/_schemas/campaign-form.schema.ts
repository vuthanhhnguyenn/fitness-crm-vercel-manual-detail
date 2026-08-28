import { z } from 'zod';

import { BrandEnum } from '@/lib/api/types.gen';

const NUMERIC_MAX = 999_999_999;
const NUMERIC_MAX_LABEL = '999,999,999';

/** 数値入力は空文字を許すため文字列で保持し、送信時に number|null へ寄せる。 */
const numericText = (message: string, options?: { min?: number; max?: number }) =>
  z
    .string()
    .trim()
    .refine(
      (value) => {
        if (value === '') return true;
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return false;
        if (options?.min !== undefined && parsed < options.min) return false;
        if (options?.max !== undefined && parsed > options.max) return false;
        return true;
      },
      { message },
    );

/** 割引行 — 対象 (主契約 or オプション) ごとに割引額か割引率のいずれかを設定する。 */
export const discountRowSchema = z.object({
  target: z.enum(['plan', 'option']),
  optionId: z.string().trim(),
  amount: numericText(`割引額は0〜${NUMERIC_MAX_LABEL}の整数で入力してください`, {
    min: 0,
    max: NUMERIC_MAX,
  }),
  rate: numericText('割引率は0〜100の整数で入力してください', { min: 0, max: 100 }),
});

export type DiscountRowValues = z.infer<typeof discountRowSchema>;

export const EMPTY_DISCOUNT_ROW: DiscountRowValues = {
  target: 'plan',
  optionId: '',
  amount: '',
  rate: '',
};

function validateDiscountRows(
  rows: DiscountRowValues[],
  path: 'discountRowsFirst' | 'discountRowsSecond',
  ctx: z.RefinementCtx,
) {
  rows.forEach((row, index) => {
    const hasAmount = row.amount !== '';
    const hasRate = row.rate !== '';

    if (row.target === 'option' && !row.optionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [path, index, 'optionId'],
        message: 'オプションを選択してください',
      });
    }
    if (!hasAmount && !hasRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [path, index, 'amount'],
        message: '割引額または割引率を入力してください',
      });
    }
    if (hasAmount && hasRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [path, index, 'amount'],
        message: '割引額と割引率は同時に設定できません',
      });
    }
  });
}

export const campaignFormSchema = z
  .object({
    // Section 1: 基本情報
    name: z
      .string()
      .trim()
      .min(1, 'キャンペーン名を入力してください')
      .max(100, 'キャンペーン名は100文字以内で入力してください'),
    campaignCode: z
      .string()
      .trim()
      .max(50, 'キャンペーンコードは50文字以内で入力してください')
      .default(''),
    brandEnum: z.nativeEnum(BrandEnum, { error: 'ブランドを選択してください' }),
    entryCap: numericText(`先着件数上限は1〜${NUMERIC_MAX_LABEL}の整数で入力してください`, {
      min: 1,
      max: NUMERIC_MAX,
    }),
    lockInMonths: numericText(`縛り期間は0〜${NUMERIC_MAX_LABEL}の整数で入力してください`, {
      min: 0,
      max: NUMERIC_MAX,
    }),
    remarks: z.string().trim().max(4000, '備考は4000文字以内で入力してください').default(''),

    // Section 2: 公開店舗設定
    publishScope: z.enum(['all_stores', 'specific_stores']).default('all_stores'),
    publishStoreIds: z.array(z.string()).default([]),

    // Section 3: 期間設定
    recruitmentStart: z.string().min(1, '募集期間の開始日を選択してください'),
    recruitmentEnd: z.string().min(1, '募集期間の終了日を選択してください'),
    usageStart: z.string().min(1, '利用開始期間の開始日を選択してください'),
    usageEnd: z.string().min(1, '利用開始期間の終了日を選択してください'),
    applyStartMonth: z.enum(['first_month', 'next_month', 'specific_month']).default('first_month'),
    applyStartSpecificN: numericText(`開始月は1〜${NUMERIC_MAX_LABEL}の整数で入力してください`, {
      min: 1,
      max: NUMERIC_MAX,
    }),
    applyDurationMonths: numericText(`適用期間は1〜${NUMERIC_MAX_LABEL}の整数で入力してください`, {
      min: 1,
      max: NUMERIC_MAX,
    }),

    // Section 4: 適用主契約・適用条件
    planId: z.string().trim().min(1, '適用主契約を選択してください'),
    conditionOptionIds: z.array(z.string()).default([]),

    // Section 5: 割引設定
    discountFirstMonthEnabled: z.boolean().default(false),
    discountRowsFirst: z.array(discountRowSchema).default([EMPTY_DISCOUNT_ROW]),
    discountSecondMonthEnabled: z.boolean().default(false),
    discountRowsSecond: z.array(discountRowSchema).default([EMPTY_DISCOUNT_ROW]),

    // Section 6: 紹介キャンペーン設定
    referralEnabled: z.boolean().default(false),
    referralPoints: numericText(`特典ポイントは0〜${NUMERIC_MAX_LABEL}の整数で入力してください`, {
      min: 0,
      max: NUMERIC_MAX,
    }),
    referralTieredIncrease: z.boolean().default(false),
    referralTierThreshold: numericText(
      `段階的増加の開始人数は1〜${NUMERIC_MAX_LABEL}で入力してください`,
      { min: 1, max: NUMERIC_MAX },
    ),
    referralTierPoints: numericText(
      `段階的増加後のポイントは0〜${NUMERIC_MAX_LABEL}で入力してください`,
      { min: 0, max: NUMERIC_MAX },
    ),
    referralAnnualReset: z.boolean().default(true),

    // Section 7: 自動付与設定
    autoGrantEnabled: z.boolean().default(false),
    autoGrantTarget: z.enum(['all', 'conditional']).default('all'),
    autoGrantSexes: z.array(z.enum(['male', 'female', 'other'])).default([]),
    autoGrantOptionIds: z.array(z.string()).default([]),

    // Section 8: 受付可否
    isAccepting: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (
      value.recruitmentStart &&
      value.recruitmentEnd &&
      value.recruitmentStart > value.recruitmentEnd
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recruitmentEnd'],
        message: '募集期間の終了日は開始日以降にしてください',
      });
    }

    if (value.usageStart && value.usageEnd && value.usageStart > value.usageEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['usageEnd'],
        message: '利用開始期間の終了日は開始日以降にしてください',
      });
    }

    if (value.applyStartMonth === 'specific_month' && value.applyStartSpecificN === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applyStartSpecificN'],
        message: 'X月指定の場合は開始月を入力してください',
      });
    }

    if (value.applyDurationMonths === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applyDurationMonths'],
        message: '適用期間を入力してください',
      });
    }

    if (value.publishScope === 'specific_stores' && value.publishStoreIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['publishStoreIds'],
        message: '公開対象店舗を1つ以上選択してください',
      });
    }

    if (value.discountFirstMonthEnabled) {
      validateDiscountRows(value.discountRowsFirst, 'discountRowsFirst', ctx);
    }
    if (value.discountSecondMonthEnabled) {
      validateDiscountRows(value.discountRowsSecond, 'discountRowsSecond', ctx);
    }

    if (value.referralEnabled && value.referralPoints === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['referralPoints'],
        message: '紹介者への特典ポイントを入力してください',
      });
    }

    if (value.referralEnabled && value.referralTieredIncrease) {
      if (value.referralTierThreshold === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['referralTierThreshold'],
          message: '段階的増加の開始人数を入力してください',
        });
      }
      if (value.referralTierPoints === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['referralTierPoints'],
          message: '段階的増加後のポイントを入力してください',
        });
      }
    }

    if (value.autoGrantEnabled) {
      if (value.autoGrantOptionIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['autoGrantOptionIds'],
          message: '自動付与するオプションを1つ以上選択してください',
        });
      }
      if (value.autoGrantTarget === 'conditional' && value.autoGrantSexes.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['autoGrantSexes'],
          message: '条件ありの場合は性別条件を1つ以上選択してください',
        });
      }
    }
  });

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export const CAMPAIGN_FORM_DEFAULT_VALUES: CampaignFormValues = {
  name: '',
  campaignCode: '',
  brandEnum: BrandEnum.FIT365,
  entryCap: '',
  lockInMonths: '',
  remarks: '',
  publishScope: 'all_stores',
  publishStoreIds: [],
  recruitmentStart: '',
  recruitmentEnd: '',
  usageStart: '',
  usageEnd: '',
  applyStartMonth: 'first_month',
  applyStartSpecificN: '',
  applyDurationMonths: '',
  planId: '',
  conditionOptionIds: [],
  discountFirstMonthEnabled: false,
  discountRowsFirst: [EMPTY_DISCOUNT_ROW],
  discountSecondMonthEnabled: false,
  discountRowsSecond: [EMPTY_DISCOUNT_ROW],
  referralEnabled: false,
  referralPoints: '',
  referralTieredIncrease: false,
  referralTierThreshold: '',
  referralTierPoints: '',
  referralAnnualReset: true,
  autoGrantEnabled: false,
  autoGrantTarget: 'all',
  autoGrantSexes: [],
  autoGrantOptionIds: [],
  isAccepting: true,
};
