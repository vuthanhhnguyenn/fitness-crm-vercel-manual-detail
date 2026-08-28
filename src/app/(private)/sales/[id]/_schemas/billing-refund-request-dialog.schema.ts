import { z } from 'zod';

export const billingRefundRequestDialogSchema = z.object({
  reason: z
    .string()
    .min(1, '返金事由を入力してください')
    .max(1000, '返金事由は1000文字以内で入力してください'),
});

export type BillingRefundRequestDialogValues = z.infer<typeof billingRefundRequestDialogSchema>;
