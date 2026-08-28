import { z } from 'zod';

export const badDebtExclusionDialogSchema = z.object({
  reason: z
    .string()
    .min(1, '理由を入力してください')
    .max(1000, '理由は1000文字以内で入力してください'),
});

export type BadDebtExclusionDialogValues = z.infer<typeof badDebtExclusionDialogSchema>;
