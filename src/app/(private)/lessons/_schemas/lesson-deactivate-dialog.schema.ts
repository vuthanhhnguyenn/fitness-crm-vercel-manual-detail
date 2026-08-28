import { z } from 'zod';

export function buildLessonDeactivateReasonSchema(reasonRequired: boolean) {
  return z.object({
    reason: z
      .string()
      .max(1000, '理由は1000文字以内で入力してください')
      .refine((value) => !reasonRequired || value.trim().length > 0, {
        message: '理由を入力してください',
      })
      .default(''),
  });
}

export type LessonDeactivateReasonValues = z.input<
  ReturnType<typeof buildLessonDeactivateReasonSchema>
>;
export type LessonDeactivateReasonSubmitValues = z.output<
  ReturnType<typeof buildLessonDeactivateReasonSchema>
>;
