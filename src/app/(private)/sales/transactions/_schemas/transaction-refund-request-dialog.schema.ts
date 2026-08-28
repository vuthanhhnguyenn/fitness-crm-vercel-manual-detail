import { z } from 'zod';

export const createTransactionRefundRequestDialogSchema = (maxAmount: number) =>
  z
    .object({
      is_full_refund: z.boolean().default(true),
      partial_amount: z.string().default(''),
      reason: z.string().max(1000, '返金事由は1000文字以内で入力してください').default(''),
    })
    .superRefine((value, ctx) => {
      if (value.reason.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reason'],
          message: '返金事由を入力してください',
        });
      }

      if (!value.is_full_refund) {
        const amount = Number(value.partial_amount);
        if (value.partial_amount.trim().length === 0 || !Number.isFinite(amount) || amount <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['partial_amount'],
            message: '返金額を入力してください',
          });
        } else if (amount > maxAmount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['partial_amount'],
            message: '売上額を超えた返金はできません',
          });
        }
      }
    });

export type TransactionRefundRequestDialogValues = z.input<
  ReturnType<typeof createTransactionRefundRequestDialogSchema>
>;
export type TransactionRefundRequestDialogSubmitValues = z.output<
  ReturnType<typeof createTransactionRefundRequestDialogSchema>
>;
