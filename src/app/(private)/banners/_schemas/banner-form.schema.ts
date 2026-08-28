import { z } from 'zod';

import { BrandEnum } from '@/lib/api/types.gen';

export const BannerFormSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください。').max(255),
  imageUrl: z.string().min(1, '画像URLを入力してください。'),
  brandEnum: z.array(z.enum(BrandEnum)).min(1, 'ブランドを選択してください。'),
  linkUrl: z
    .union([z.url('有効なURLを入力してください。'), z.literal('').transform(() => null), z.null()])
    .optional(),
  periodStart: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, '掲載開始日を選択してください。'),
  periodEnd: z
    .union([
      z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, '日付形式(YYYY/MM/DD)で入力してください。'),
      z.literal('').transform(() => null),
      z.null(),
    ])
    .optional(),
  webEnabled: z.boolean().default(true),
  mobileEnabled: z.boolean().default(true),
  order: z.number().int().positive().optional(),
});

export type BannerFormValues = z.input<typeof BannerFormSchema>;
export type BannerFormSubmitValues = z.output<typeof BannerFormSchema>;

export const emptyBannerFormValues: BannerFormValues = {
  title: '',
  imageUrl: '',
  brandEnum: Object.values(BrandEnum),
  linkUrl: null,
  periodStart: '',
  periodEnd: null,
  webEnabled: true,
  mobileEnabled: true,
  order: undefined,
};
