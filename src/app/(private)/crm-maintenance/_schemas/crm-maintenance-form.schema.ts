import { STAFF_ROLE_ORDER } from '@/app/(private)/crm-maintenance/_constants/crm-maintenance.constants';
import { TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

export type CrmMaintenanceFormMode = 'create' | 'edit';

export const CrmMaintenanceAllowedUserFormSchema = z.object({
  staffId: z.string(),
  name: z.string(),
  role: z.enum(STAFF_ROLE_ORDER),
});

export const CrmMaintenanceFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'タイトルは必須です。')
      .max(TEXT_MAX_LENGTH, `タイトルは${TEXT_MAX_LENGTH}文字以内で入力してください。`),
    startsAt: z.string().min(1, '開始日時は必須です。'),
    endsAt: z.string().min(1, '終了日時は必須です。'),
    message: z
      .string()
      .min(1, 'メンテナンスメッセージは必須です。')
      .max(
        TEXTAREA_MAX_LENGTH,
        `メンテナンスメッセージは${TEXTAREA_MAX_LENGTH}文字以内で入力してください。`,
      ),
    note: z
      .string()
      .max(TEXTAREA_MAX_LENGTH, `備考は${TEXTAREA_MAX_LENGTH}文字以内で入力してください。`)
      .optional(),
    allowedUsers: z.array(CrmMaintenanceAllowedUserFormSchema),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: '終了日時は開始日時より後の日時を入力してください。',
    path: ['endsAt'],
  });

export type CrmMaintenanceAllowedUserFormValue = z.infer<
  typeof CrmMaintenanceAllowedUserFormSchema
>;
export type CrmMaintenanceFormValues = z.infer<typeof CrmMaintenanceFormSchema>;
