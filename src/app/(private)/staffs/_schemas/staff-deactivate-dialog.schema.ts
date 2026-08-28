import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

export const staffDeactivateReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(TEXTAREA_MAX_LENGTH, `無効化理由は${TEXTAREA_MAX_LENGTH}文字以内で入力してください`)
    .default(''),
});

export type StaffDeactivateReasonValues = z.input<typeof staffDeactivateReasonSchema>;
export type StaffDeactivateReasonSubmitValues = z.output<typeof staffDeactivateReasonSchema>;
