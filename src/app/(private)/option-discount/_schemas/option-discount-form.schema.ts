import { z } from 'zod';

import {
  OptionDiscountCondition,
  OptionDiscountStatus,
  OptionDiscountType,
} from '@/lib/api/types.gen';

export const optionDiscountFormSchema = z
  .object({
    name: z.string().min(1, 'セット割名は必須です'),
    code: z.string().min(1, 'コードは必須です'),
    description: z.string().default(''),
    target_contract_ids: z.array(z.string()).min(1, '対象契約を1つ以上選択してください'),
    target_option_ids: z.array(z.string()).min(1, '対象オプションを1つ以上選択してください'),
    discount_type: z.nativeEnum(OptionDiscountType, {
      error: '割引タイプを選択してください',
    }),
    discount_value: z.preprocess(
      (value) => (value === '' || value === null || value === undefined ? undefined : value),
      z.coerce
        .number({ error: '割引金額/率は必須です' })
        .nonnegative('0以上の値を入力してください'),
    ),
    conditions: z.nativeEnum(OptionDiscountCondition, {
      error: '適用条件を選択してください',
    }),
    status: z.nativeEnum(OptionDiscountStatus).default(OptionDiscountStatus.ACTIVE),
  })
  .superRefine((value, ctx) => {
    if (value.discount_type === OptionDiscountType.PERCENTAGE && value.discount_value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discount_value'],
        message: '割引率は100%以下で入力してください',
      });
    }
  });

export type OptionDiscountFormValues = z.input<typeof optionDiscountFormSchema>;
export type OptionDiscountFormSubmitValues = z.output<typeof optionDiscountFormSchema>;

export const emptyDefaults: OptionDiscountFormValues = {
  name: '',
  code: '',
  description: '',
  target_contract_ids: [],
  target_option_ids: [],
  discount_type: undefined as unknown as OptionDiscountType,
  discount_value: undefined as unknown as number,
  conditions: undefined as unknown as OptionDiscountCondition,
  status: OptionDiscountStatus.ACTIVE,
};
