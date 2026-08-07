import { z } from 'zod';

export const DeleteContractSchema = z.object({
  reason: z
    .string()
    .min(1, { message: '削除理由は必須です' })
    .max(255, { message: '削除理由は255文字以内で入力してください' }),
});

export type DeleteContractSchema = z.infer<typeof DeleteContractSchema>;
