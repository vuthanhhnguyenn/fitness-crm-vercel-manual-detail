import { z } from 'zod';

import {
  Brand,
  OptionCategory,
  OptionProrataMethod,
  OptionStatus,
  OptionType,
  OptionUsageRule,
} from '@/lib/api/types.gen';

export const OPTION_METERED_TYPE_OPTIONS = [
  'プロテイン',
  'サプリメント',
  '日焼け',
  'コラーゲン',
  '水素水',
  '体組成計',
  'シャワー',
] as const;

export const OPTION_AREA_OPTIONS = [
  'レディースエリア',
  'タンニングエリア',
  'プロテインバー',
  'ロッカーエリア',
] as const;

export const optionFormSchema = z
  .object({
    brand: z.nativeEnum(Brand, { error: 'ブランドを選択してください' }),
    name: z.string().min(1, 'オプション名は必須です'),
    code: z.string().min(1, 'コードは必須です'),
    option_category: z.nativeEnum(OptionCategory, {
      error: 'オプション分類を選択してください',
    }),
    accounting_code: z.string().default(''),
    note: z.string().default(''),
    description: z.string().default(''),
    member_app_image: z.string().nullable().default(null),
    price_including_tax: z.preprocess(
      (value) => (value === '' || value === null ? undefined : value),
      z.coerce
        .number({ error: '料金（税込）は必須です' })
        .nonnegative('0以上の値を入力してください'),
    ),
    tax_rate: z.coerce.number({ error: '税率を選択してください' }),
    prorated_enabled: z.boolean().default(false),
    prorata_method: z.nativeEnum(OptionProrataMethod).nullable().default(null),
    option_type: z.nativeEnum(OptionType, { error: 'オプション種別を選択してください' }),
    tsuji_type: z.string().default(''),
    usage_rule: z.nativeEnum(OptionUsageRule, { error: '利用可否ルールを選択してください' }),
    constraint_main_option_change: z.boolean().default(false),
    constraint_change: z.boolean().default(false),
    area_restrictions: z.array(z.string()).default([]),
    status: z.nativeEnum(OptionStatus).default(OptionStatus.ACTIVE),
  })
  .superRefine((value, ctx) => {
    if (value.prorated_enabled && !value.prorata_method) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['prorata_method'],
        message: '日割り計算方式を選択してください',
      });
    }

    if (value.option_type === OptionType.METERED && value.tsuji_type.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tsuji_type'],
        message: '都次オプション種別を選択してください',
      });
    }
  });

export type OptionFormValues = z.input<typeof optionFormSchema>;
export type OptionFormSubmitValues = z.output<typeof optionFormSchema>;
