import { TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

const BRAND_ID_REGEX = /^[A-Za-z0-9_]+$/;

export const brandFormSchema = z.object({
  displayName: z.string().trim().min(1, 'ブランド名は必須です').max(TEXT_MAX_LENGTH),
  brandId: z
    .string()
    .trim()
    .min(1, 'ブランドIDは必須です')
    .max(TEXT_MAX_LENGTH)
    .regex(BRAND_ID_REGEX, '英数字とアンダースコアのみ入力できます'),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;
