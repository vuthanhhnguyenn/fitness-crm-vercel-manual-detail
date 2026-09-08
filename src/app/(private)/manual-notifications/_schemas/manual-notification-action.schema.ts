import { z } from 'zod';

export const manualNotificationReturnReasonSchema = z
  .string()
  .trim()
  .min(1, '差し戻し理由を入力してください')
  .max(500, '差し戻し理由は500文字以内で入力してください');

export type ManualNotificationReturnReason = z.infer<typeof manualNotificationReturnReasonSchema>;
