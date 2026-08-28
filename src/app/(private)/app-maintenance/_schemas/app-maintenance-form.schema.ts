import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

export type AppMaintenanceFormMode = 'create' | 'edit';

export const AppMaintenanceFormSchema = z
  .object({
    targetBrand: z.enum(['joyfit', 'fit365'], { error: 'ブランドは必須です。' }),
    startsAt: z.string().min(1, '開始日時は必須です。'),
    endsAt: z.string().min(1, '終了日時は必須です。'),
    message: z
      .string()
      .min(1, 'メンテナンスメッセージは必須です。')
      .max(
        TEXTAREA_MAX_LENGTH,
        `メンテナンスメッセージは${TEXTAREA_MAX_LENGTH}文字以内で入力してください。`,
      ),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: '終了日時は開始日時より後の日時を入力してください。',
    path: ['endsAt'],
  });

export type AppMaintenanceFormValues = z.infer<typeof AppMaintenanceFormSchema>;
