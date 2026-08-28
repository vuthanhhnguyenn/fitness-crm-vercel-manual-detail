import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

export const manualReservationFormSchema = z.object({
  memberId: z.string().min(1, '会員を選択してください'),
  scheduleId: z.string().min(1, '枠を選択してください'),
  course: z.string().min(1, 'コースを選択してください'),
  note: z
    .string()
    .max(TEXTAREA_MAX_LENGTH, `備考は${TEXTAREA_MAX_LENGTH}文字以内で入力してください`)
    .optional(),
});

export type ManualReservationFormValues = z.infer<typeof manualReservationFormSchema>;
