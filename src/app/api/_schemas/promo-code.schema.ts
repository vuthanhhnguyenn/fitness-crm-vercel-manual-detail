import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const PromoCodeStatusSchema = z
  .enum(['active', 'expired', 'limit_reached', 'inactive'])
  .openapi({
    title: 'PromoCodeStatus',
    description: 'Promo code status',
  });

export const PromoCodeUsageCapModeSchema = z.enum(['unlimited', 'limited']).openapi({
  title: 'PromoCodeUsageCapMode',
  description: 'Promo code usage-cap mode',
});

export const PromoCodeStoreScopeSchema = z.enum(['all', 'branch']).openapi({
  title: 'PromoCodeStoreScope',
  description: 'Promo code store scope',
});

export const GetPromoCodesQuerySchema = z
  .object({
    campaign_id: z.string().trim().min(1, 'campaign_id is required'),
  })
  .openapi({
    title: 'GetPromoCodesQuery',
    description: 'Query for fetching promo codes by campaign',
  });

export const PromoCodeUpsertBodySchema = z
  .object({
    campaignId: z.string().trim().min(1, 'キャンペーンを選択してください'),
    campaignName: z.string().trim().min(1, 'キャンペーン名が必要です'),
    code: z.string().trim().min(1, 'コードを入力してください'),
    description: z.string().trim().max(255).nullable().optional(),
    validFrom: z.string().trim().min(1, '開始日を入力してください'),
    validTo: z.string().trim().min(1, '終了日を入力してください'),
    usageCount: z.number().int().nonnegative().default(0),
    usageCap: z.number().int().nonnegative().nullable(),
    usageCapMode: PromoCodeUsageCapModeSchema,
    storeScope: PromoCodeStoreScopeSchema,
    issuedByLabel: z.string().trim().min(1, '発行者ラベルが必要です'),
    status: PromoCodeStatusSchema.default('active'),
  })
  .openapi({
    title: 'PromoCodeUpsertBody',
    description: 'Promo code create/update payload',
  });

export const UpdatePromoCodeStatusBodySchema = z
  .object({
    status: PromoCodeStatusSchema,
    reason: z.string().trim().max(500).optional().nullable(),
  })
  .openapi({
    title: 'UpdatePromoCodeStatusBody',
    description: 'Promo code status update payload',
  });

export const PromoCodeRecordSchema = z
  .object({
    id: z.string().openapi({ example: 'PC001', description: 'Promo code record ID' }),
    campaign_id: z.string().openapi({ example: 'CP001', description: 'Campaign ID' }),
    campaign_name: z
      .string()
      .openapi({ example: '春の入会キャンペーン', description: 'Campaign name' }),
    code: z.string().openapi({ example: 'STR01-ABCDE', description: 'Promo code' }),
    description: z.string().nullable().openapi({
      example: '春の入会キャンペーン用',
      description: 'Promo code description',
    }),
    valid_from: z.string().openapi({ example: '2026/03/01', description: 'Validity start date' }),
    valid_to: z.string().openapi({ example: '2026/04/30', description: 'Validity end date' }),
    usage_count: z.number().int().nonnegative().openapi({
      example: 0,
      description: 'Usage count',
    }),
    usage_cap: z.number().int().nullable().openapi({
      example: null,
      description: 'Usage cap',
    }),
    usage_cap_label: z.string().openapi({
      example: '無制限',
      description: 'Usage cap label',
    }),
    store_scope_label: z.string().openapi({
      example: 'タイプB: 発行店舗のみで使用可能',
      description: 'Store scope label',
    }),
    issued_by_label: z.string().openapi({
      example: '本部',
      description: 'Issued by label',
    }),
    discount_total_label: z.string().openapi({
      example: '—',
      description: 'Discount total label',
    }),
    status: PromoCodeStatusSchema.openapi({
      description: 'Promo code status',
    }),
    disabled_reason: z.string().nullable().openapi({
      example: null,
      description: 'Disable reason',
    }),
    created_at: z.string().openapi({
      example: '2026/06/08 10:30',
      description: 'Created at',
    }),
    updated_at: z.string().openapi({
      example: '2026/06/08 10:30',
      description: 'Updated at',
    }),
  })
  .openapi({
    title: 'PromoCodeRecord',
    description: 'Persistent promo code record stored in the mock API',
  });

export const GetPromoCodesResponseSchema = z
  .object({
    promo_codes: z.array(PromoCodeRecordSchema),
  })
  .openapi({
    title: 'GetPromoCodesResponse',
    description: 'Promo code list response',
  });

export const CreatePromoCodeResponseSchema = z
  .object({
    promo_code: PromoCodeRecordSchema,
  })
  .openapi({
    title: 'CreatePromoCodeResponse',
    description: 'Created promo code response',
  });

export const UpdatePromoCodeResponseSchema = z
  .object({
    promo_code: PromoCodeRecordSchema,
  })
  .openapi({
    title: 'UpdatePromoCodeResponse',
    description: 'Updated promo code response',
  });

export const PromoCodeErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi({
    title: 'PromoCodeErrorResponse',
    description: 'Promo-code-specific error response',
  });

export type GetPromoCodesQuery = z.infer<typeof GetPromoCodesQuerySchema>;
export type PromoCodeUpsertBody = z.infer<typeof PromoCodeUpsertBodySchema>;
export type PromoCodeRecord = z.infer<typeof PromoCodeRecordSchema>;
export type UpdatePromoCodeStatusBody = z.infer<typeof UpdatePromoCodeStatusBodySchema>;
