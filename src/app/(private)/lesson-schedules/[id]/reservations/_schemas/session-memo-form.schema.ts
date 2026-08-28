import { TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

/** Group / class session memo — a single free-text record. */
export const groupMemoFormSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'メモを入力してください')
    .max(TEXTAREA_MAX_LENGTH, `メモは${TEXTAREA_MAX_LENGTH}文字以内で入力してください`),
});

export type GroupMemoFormValues = z.infer<typeof groupMemoFormSchema>;

/**
 * Personal (PT) session memo — structured fields.
 * All fields are individually optional, but at least one must be filled in.
 */
export const personalMemoFormSchema = z
  .object({
    menu: z
      .string()
      .max(TEXT_MAX_LENGTH, `実施メニューは${TEXT_MAX_LENGTH}文字以内で入力してください`)
      .optional(),
    weight: z
      .string()
      .max(TEXT_MAX_LENGTH, `重量は${TEXT_MAX_LENGTH}文字以内で入力してください`)
      .optional(),
    reps: z
      .string()
      .max(TEXT_MAX_LENGTH, `回数は${TEXT_MAX_LENGTH}文字以内で入力してください`)
      .optional(),
    condition: z
      .string()
      .max(TEXTAREA_MAX_LENGTH, `会員の状態は${TEXTAREA_MAX_LENGTH}文字以内で入力してください`)
      .optional(),
    handover: z
      .string()
      .max(
        TEXTAREA_MAX_LENGTH,
        `次回への申し送りは${TEXTAREA_MAX_LENGTH}文字以内で入力してください`,
      )
      .optional(),
  })
  .refine((values) => Object.values(values).some((field) => field?.trim()), {
    message: '少なくとも1項目を入力してください',
    path: ['menu'],
  });

export type PersonalMemoFormValues = z.infer<typeof personalMemoFormSchema>;
