import { z } from 'zod';

export const exerciseMasterFormSchema = z.object({
  code: z.string().trim().min(1, 'コードは必須です'),
  name: z.string().trim().min(1, '名称は必須です'),
  description: z.string().trim(),
  sortOrder: z
    .string()
    .trim()
    .min(1, '表示順は必須です')
    .refine((value) => /^\d+$/.test(value) && Number(value) >= 1, {
      message: '表示順は1以上の整数で入力してください',
    }),
});

export type ExerciseMasterFormValues = z.input<typeof exerciseMasterFormSchema>;
export type ExerciseMasterFormSubmitValues = z.output<typeof exerciseMasterFormSchema>;

export const EMPTY_EXERCISE_MASTER_FORM_VALUES: ExerciseMasterFormValues = {
  code: '',
  name: '',
  description: '',
  sortOrder: '1',
};
