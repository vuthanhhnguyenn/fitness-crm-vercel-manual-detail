import { z } from 'zod';

const DATE_REGEX = /^\d{4}\/\d{2}\/\d{2}$/;
const feeValueSchema = z
  .custom<number>((value) => typeof value === 'number' && !Number.isNaN(value), {
    message: '定価（税込）を入力してください',
  })
  .refine((value) => Number.isInteger(value), '定価（税込）は整数で入力してください')
  .refine((value) => value >= 0, '定価（税込）は0以上で入力してください');

export const brandFeeItemFormSchema = z.object({
  itemCode: z.string().trim().min(1),
  itemName: z.string().trim().min(1, '費用項目名を入力してください').max(255),
  effectiveStartDate: z
    .string()
    .trim()
    .min(1, '有効開始日を入力してください')
    .regex(DATE_REGEX, '有効開始日は yyyy/MM/dd 形式で入力してください'),
  currentValueIncludingTaxYen: feeValueSchema,
});

export const brandFeeGroupFormSchema = z.object({
  feeItems: z.array(brandFeeItemFormSchema).min(1),
});

export type BrandFeeGroupFormValues = z.infer<typeof brandFeeGroupFormSchema>;
