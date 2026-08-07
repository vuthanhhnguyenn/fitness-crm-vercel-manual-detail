import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'メールアドレスは必須です' })
    .email({ message: '有効なメールアドレスを入力してください' }),
  password: z.string().min(6, { message: '6文字以上で入力してください' }),
});

export type LoginSchema = z.infer<typeof loginSchema>;
