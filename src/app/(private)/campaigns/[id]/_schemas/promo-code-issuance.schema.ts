import { z } from 'zod';

export const PROMO_CODE_SCOPE_UNSELECTED = '';

/** G-06 FR-001〜FR-005: コード発行ダイアログの入力。 */
export const promoCodeIssuanceSchema = z
  .object({
    campaignId: z.string().trim().min(1, 'キャンペーンを選択してください'),
    generationMethod: z.enum(['auto', 'manual']).default('manual'),
    code: z.string().trim().max(50, 'コードは50文字以内で入力してください').default(''),
    description: z.string().trim().max(255, '説明は255文字以内で入力してください').default(''),
    scopeType: z
      .union([
        z.enum(['brand_all', 'issuer_store_only', 'ogf_only']),
        z.literal(PROMO_CODE_SCOPE_UNSELECTED),
      ])
      .default(PROMO_CODE_SCOPE_UNSELECTED),
    issuedStoreId: z.string().trim().default(''),
    validFrom: z.string().min(1, '有効期間の開始日を選択してください'),
    validTo: z.string().min(1, '有効期間の終了日を選択してください'),
    maxUses: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || (Number.isInteger(Number(value)) && Number(value) > 0),
        '使用上限は1以上の整数で入力してください',
      )
      .default(''),
  })
  .superRefine((value, ctx) => {
    if (value.scopeType === PROMO_CODE_SCOPE_UNSELECTED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scopeType'],
        message: '適用店舗タイプを選択してください',
      });
    }
    if (value.generationMethod === 'manual' && value.code === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['code'],
        message: 'コードを入力するか自動生成してください',
      });
    }
    if (value.validFrom && value.validTo && value.validFrom > value.validTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['validTo'],
        message: '有効期間の終了日は開始日以降にしてください',
      });
    }
    if (value.scopeType === 'issuer_store_only' && value.issuedStoreId === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['issuedStoreId'],
        message: '発行店舗を選択してください',
      });
    }
  });

export type PromoCodeIssuanceValues = z.infer<typeof promoCodeIssuanceSchema>;

export const PROMO_CODE_ISSUANCE_DEFAULTS: PromoCodeIssuanceValues = {
  campaignId: '',
  generationMethod: 'manual',
  code: '',
  description: '',
  scopeType: PROMO_CODE_SCOPE_UNSELECTED,
  issuedStoreId: '',
  validFrom: '',
  validTo: '',
  maxUses: '',
};
