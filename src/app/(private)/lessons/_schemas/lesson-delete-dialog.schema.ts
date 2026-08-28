import { z } from 'zod';

export const lessonDeleteReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, '理由を入力してください')
    .max(1000, '理由は1000文字以内で入力してください'),
});

export type LessonDeleteReasonValues = z.infer<typeof lessonDeleteReasonSchema>;
