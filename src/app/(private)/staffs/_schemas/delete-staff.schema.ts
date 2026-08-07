import { z } from 'zod';

export const DeleteStaffSchema = z.object({
  delete_reason: z
    .string()
    .min(1, { message: '削除理由は必須です' })
    .max(255, { message: '削除理由は255文字以内で入力してください' }),
});

export type DeleteStaffSchema = z.infer<typeof DeleteStaffSchema>;
