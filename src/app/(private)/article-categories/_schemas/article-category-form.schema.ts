import { TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

import { ArticleCategoryType, BrandEnum } from '@/lib/api/types.gen';

export const ArticleCategoryFormSchema = z.object({
  name: z.string().trim().min(1, 'カテゴリ名を入力してください。').max(TEXT_MAX_LENGTH),
  description: z.string().max(TEXTAREA_MAX_LENGTH).default(''),
  type: z.enum(ArticleCategoryType, { error: '種別を選択してください。' }),
  brandEnum: z.enum(BrandEnum, { error: 'ブランドを選択してください。' }),
  order: z
    .number()
    .int()
    .min(1, '表示順は1〜999の範囲で入力してください。')
    .max(999, '表示順は1〜999の範囲で入力してください。')
    .default(1),
  isPublic: z.boolean().default(true),
});

export type ArticleCategoryFormValues = z.input<typeof ArticleCategoryFormSchema>;
export type ArticleCategoryFormSubmitValues = z.output<typeof ArticleCategoryFormSchema>;

export const emptyArticleCategoryFormValues: ArticleCategoryFormValues = {
  name: '',
  description: '',
  type: undefined as unknown as ArticleCategoryType,
  brandEnum: undefined as unknown as BrandEnum,
  order: 1,
  isPublic: true,
};
