import { z } from 'zod';

export const lessonScheduleTemplateSaveSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'テンプレート名を入力してください')
    .max(255, 'テンプレート名は255文字以内で入力してください'),
});

export type LessonScheduleTemplateSaveValues = z.infer<typeof lessonScheduleTemplateSaveSchema>;
