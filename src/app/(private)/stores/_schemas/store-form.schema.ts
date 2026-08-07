import { z } from 'zod';

import { StoreArea, StoreListBrand, StoreListStatus } from '@/lib/api/types.gen';

const STORE_LIST_BRAND_ENUM = Object.values(StoreListBrand) as [
  StoreListBrand,
  ...StoreListBrand[],
];

const STORE_AREA_ENUM = Object.values(StoreArea) as [StoreArea, ...StoreArea[]];

/** Shared zod schema for 店舗新規 / 店舗編集 */
export const storeFormSchema = z.object({
  name: z.string().min(1, '店舗名は必須です'),
  brand: z.string().min(1, 'ブランドを選択してください').pipe(z.enum(STORE_LIST_BRAND_ENUM)),
  operating_company_name: z.string().optional(),
  area: z
    .union([z.literal(''), z.enum(STORE_AREA_ENUM)])
    .transform((val) => (val === '' ? undefined : val)),
  postal_code: z.string().optional(),
  prefecture: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email('正しいメールアドレスを入力してください').optional().or(z.literal('')),
  phone: z
    .union([
      z.literal(''),
      z.string().regex(/^\d{10,11}$/, '電話番号は10〜11桁の数字で入力してください'),
    ])
    .optional(),
  club_code: z.string().transform((val) => (val === '' ? undefined : val)),
  accounting_code: z.string().optional(),
  is_fc: z.boolean(),
  status: z.nativeEnum(StoreListStatus),
  interview_url: z.string().optional(),
  google_map_url: z.string().optional(),
  x_url: z.string().optional(),
  instagram_url: z.string().optional(),
  line_url: z.string().optional(),
  facebook_url: z.string().optional(),
  youtube_url: z.string().optional(),
  store_photos: z.array(z.string()).optional(),
  floor_map_url: z.string().optional(),
});

/** Form state (defaults may include empty string for brand before submit) */
export type StoreFormValues = z.input<typeof storeFormSchema>;

/** Values after zod parse (e.g. submit handlers, API body) */
export type StoreFormSubmitValues = z.output<typeof storeFormSchema>;
