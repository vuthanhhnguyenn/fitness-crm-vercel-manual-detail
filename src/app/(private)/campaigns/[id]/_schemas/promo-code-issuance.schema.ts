import { z } from 'zod';

export const PromoCodeEntryModeSchema = z.enum(['manual', 'auto']);

export const PromoCodeUsageCapModeSchema = z.enum(['unlimited', 'limited']);

export const PromoCodeStoreScopeSchema = z.enum(['all', 'branch']);

export const PromoCodeIssuanceDraftSchema = z.object({
  campaignId: z.string().trim().min(1, 'キャンペーンを選択してください'),
  codeMode: PromoCodeEntryModeSchema,
  code: z.string().trim(),
  description: z.string().trim().max(255).optional().default(''),
  validFrom: z.string().trim().min(1, '開始日を入力してください'),
  validTo: z.string().trim().min(1, '終了日を入力してください'),
  usageCapMode: PromoCodeUsageCapModeSchema,
  usageCap: z.string().trim().optional().default(''),
  storeScope: PromoCodeStoreScopeSchema,
});

export type PromoCodeIssuanceDraft = z.infer<typeof PromoCodeIssuanceDraftSchema>;

export function normalizePromoCodeValue(value: string): string {
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

export function buildPromoCodeIssuanceSchema(existingCodes: readonly string[]) {
  const normalizedExistingCodes = new Set(existingCodes.map(normalizePromoCodeValue));

  return PromoCodeIssuanceDraftSchema.superRefine((value, ctx) => {
    const normalizedCode = normalizePromoCodeValue(value.code);

    if (value.codeMode === 'manual' && !normalizedCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['code'],
        message: 'コードを入力してください',
      });
    }

    if (value.codeMode === 'auto' && !normalizedCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['code'],
        message: '自動生成を実行してください',
      });
    }

    if (value.validFrom && value.validTo && value.validFrom > value.validTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['validTo'],
        message: '終了日は開始日以降にしてください',
      });
    }

    if (value.usageCapMode === 'limited') {
      const usageCap = Number(value.usageCap);

      if (!Number.isFinite(usageCap) || !Number.isInteger(usageCap) || usageCap <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['usageCap'],
          message: '有効数は 1 以上の整数で入力してください',
        });
      }
    }

    if (normalizedCode && normalizedExistingCodes.has(normalizedCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['code'],
        message: 'このコードは既に存在します',
      });
    }
  });
}
