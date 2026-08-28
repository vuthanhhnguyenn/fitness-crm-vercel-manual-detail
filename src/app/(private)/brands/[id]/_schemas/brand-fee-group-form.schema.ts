import { TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

const feeValueSchema = z
  .custom<number>((value) => typeof value === 'number' && !Number.isNaN(value), {
    message: '定価（税込）を入力してください',
  })
  .refine((value) => Number.isInteger(value), '定価（税込）は整数で入力してください')
  .refine((value) => value >= 0, '定価（税込）は0以上で入力してください');

export const brandScheduledFeeChangeFormSchema = z.object({
  effectiveStartDate: z.string().trim().min(1, '有効開始日を入力してください'),
  valueIncludingTaxYen: feeValueSchema,
});

export const brandFeeItemFormSchema = z
  .object({
    itemCode: z.string().trim().min(1),
    itemName: z
      .string()
      .trim()
      .min(1, '費用項目名を入力してください')
      .max(TEXT_MAX_LENGTH, `費用項目名は${TEXT_MAX_LENGTH}文字以内で入力してください`),
    effectiveStartDate: z.string().trim().min(1, '有効開始日を入力してください'),
    currentValueIncludingTaxYen: feeValueSchema,
    scheduledChanges: z.array(brandScheduledFeeChangeFormSchema),
  })
  .superRefine((item, ctx) => {
    const seenDates = new Map<string, number>();
    item.scheduledChanges.forEach((change, index) => {
      if (change.effectiveStartDate === item.effectiveStartDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '現行の有効開始日と重複しています',
          path: ['scheduledChanges', index, 'effectiveStartDate'],
        });
      }
      const firstIndex = seenDates.get(change.effectiveStartDate);
      if (firstIndex !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '有効開始日が他の改定と重複しています',
          path: ['scheduledChanges', index, 'effectiveStartDate'],
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '有効開始日が他の改定と重複しています',
          path: ['scheduledChanges', firstIndex, 'effectiveStartDate'],
        });
      } else {
        seenDates.set(change.effectiveStartDate, index);
      }
    });
  });

export const brandFeeGroupFormSchema = z.object({
  feeItems: z.array(brandFeeItemFormSchema).min(1),
});

export type BrandFeeGroupFormValues = z.infer<typeof brandFeeGroupFormSchema>;
