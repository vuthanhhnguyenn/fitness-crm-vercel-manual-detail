import { z } from 'zod';

export const billingFeeAdjustmentDialogSchema = z
  .object({
    target_line_item_id: z.string().default('record'),
    pattern: z
      .enum(['fixed_amount', 'discount_amount', 'discount_percent', 'surcharge'])
      .default('fixed_amount'),
    value: z.string().default(''),
    reason: z.string().max(1000, '調整事由は1000文字以内で入力してください').default(''),
  })
  .superRefine((value, ctx) => {
    const valueNumber = Number(value.value);
    if (value.value.trim().length === 0 || !Number.isFinite(valueNumber) || valueNumber <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: '調整値を入力してください',
      });
    }

    if (value.reason.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: '調整事由を入力してください',
      });
    }
  });

export type BillingFeeAdjustmentDialogValues = z.input<typeof billingFeeAdjustmentDialogSchema>;
export type BillingFeeAdjustmentDialogSubmitValues = z.output<
  typeof billingFeeAdjustmentDialogSchema
>;
