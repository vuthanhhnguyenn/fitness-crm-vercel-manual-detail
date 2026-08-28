import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

export const CHANGE_SCOPE_OPTIONS = ['this-only', 'all-after'] as const;
export const NO_CHANGE_INSTRUCTOR = 'no-change';

export const scheduleChangeFormSchema = z
  .object({
    changeScope: z.enum(CHANGE_SCOPE_OPTIONS),
    sendNotification: z.boolean().default(true),
    reason: z.string().trim().min(1, '変更理由を入力してください').max(TEXTAREA_MAX_LENGTH),
    startTime: z.string().min(1, '開始時刻を入力してください'),
    endTime: z.string().min(1, '終了時刻を入力してください'),
    instructorId: z.string().default(NO_CHANGE_INSTRUCTOR),
    studioName: z.string().optional().default(''),
  })
  .superRefine((value, ctx) => {
    if (value.startTime && value.endTime && value.startTime >= value.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: '終了時間は開始時間より後にしてください',
      });
    }
  });

export type ScheduleChangeFormValues = z.input<typeof scheduleChangeFormSchema>;
export type ScheduleChangeFormSubmitValues = z.output<typeof scheduleChangeFormSchema>;
