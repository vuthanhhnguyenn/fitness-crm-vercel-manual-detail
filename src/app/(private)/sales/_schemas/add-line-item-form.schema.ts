import { z } from 'zod';

export const addLineItemFormSchema = z
  .object({
    source: z.enum(['contract', 'manual']).default('contract'),
    contract_id: z.string().default(''),
    label: z.string().max(255, '請求項目は255文字以内で入力してください').default(''),
    amount: z.string().default(''),
    tax_rate: z.enum(['10', '8']).default('10'),
    reason: z.string().max(1000, '事由は1000文字以内で入力してください').default(''),
  })
  .superRefine((value, ctx) => {
    if (value.source === 'contract') {
      if (!value.contract_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['contract_id'],
          message: '契約を選択してください',
        });
      }
      return;
    }

    if (value.label.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['label'],
        message: '請求項目を入力してください',
      });
    }

    const amountNumber = Number(value.amount);
    if (value.amount.trim().length === 0 || !Number.isFinite(amountNumber) || amountNumber <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['amount'],
        message: '請求額（税抜）を入力してください',
      });
    }

    if (value.reason.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: '事由を入力してください',
      });
    }
  });

export type AddLineItemFormValues = z.input<typeof addLineItemFormSchema>;
export type AddLineItemFormSubmitValues = z.output<typeof addLineItemFormSchema>;
