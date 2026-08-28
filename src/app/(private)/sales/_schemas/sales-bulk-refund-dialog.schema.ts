import { z } from 'zod';

export const salesBulkRefundDialogSchema = z.object({
  reason_code: z.string().min(1, '返金理由を選択してください'),
  detail: z.string().max(1000, '詳細・備考は1000文字以内で入力してください').default(''),
});

export type SalesBulkRefundDialogValues = z.input<typeof salesBulkRefundDialogSchema>;
export type SalesBulkRefundDialogSubmitValues = z.output<typeof salesBulkRefundDialogSchema>;
