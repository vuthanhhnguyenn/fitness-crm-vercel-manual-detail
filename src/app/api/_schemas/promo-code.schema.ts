import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { BrandEnumSchema } from './brand.schema';

extendZodWithOpenApi(z);

// ─── Enums ────────────────────────────────────────────────────────────────────

/** Promotion_Code_Management PromotionCodeScope */
export const PromoCodeScopeSchema = z.enum(['brand_all', 'issuer_store_only', 'ogf_only']).openapi({
  title: 'PromoCodeScope',
  description: '適用店舗タイプ (タイプA=全店舗 / タイプB=発行店舗のみ / OGF会員限定)',
});

/** Promotion_Code_Management PromotionCodeStatus — 保存される状態。 */
export const PromoCodeStatusSchema = z
  .enum(['active', 'expired', 'exhausted', 'disabled'])
  .openapi({
    title: 'PromoCodeStatus',
    description: 'プロモーションコードの保存ステータス',
  });

/** Promotion_Code_Management PromotionCodeEffectiveStatus — 導出される表示状態。 */
export const PromoCodeEffectiveStatusSchema = z
  .enum(['active', 'expired', 'exhausted', 'disabled', 'campaign_unavailable'])
  .openapi({
    title: 'PromoCodeEffectiveStatus',
    description: '有効期間・使用数・キャンペーン状態から導出した実効ステータス',
  });

/** Promotion_Code_Management PromotionCodeGenerationMethod */
export const PromoCodeGenerationMethodSchema = z.enum(['auto', 'manual']).openapi({
  title: 'PromoCodeGenerationMethod',
  description: 'コード生成方法 (自動生成 / 手動入力)',
});

/** Promotion_Code_Management StatusToggleAction */
export const PromoCodeStatusToggleActionSchema = z.enum(['disable', 're_enable']).openapi({
  title: 'PromoCodeStatusToggleAction',
  description: '無効化 / 再有効化',
});

export const PromoCodeSortSchema = z.enum(['createdAt', 'validTo', 'usedCount', 'code']).openapi({
  title: 'PromoCodeSort',
  description: 'プロモーションコード一覧の並び替えキー',
});

/** Promotion_Code_Management ErrorResponse */
export const PromoCodeErrorResponseSchema = z
  .object({
    code: z.string().openapi({ example: 'E-PRM-005' }),
    message: z.string().openapi({ description: 'ログ・デバッグ用の内部メッセージ (英語)' }),
    userMessage: z.string().openapi({ description: '利用者向けメッセージ (日本語)' }),
    traceId: z.string().optional(),
  })
  .openapi({
    title: 'PromoCodeErrorResponse',
    description: 'プロモーションコードAPIのエラーレスポンス',
  });

export const PROMO_CODE_ERROR_CODES = {
  validation: 'E-VAL-001',
  duplicate: 'E-PRM-001',
  periodInvalid: 'E-PRM-005',
  maxUsesInvalid: 'E-PRM-006',
  brandMismatch: 'E-PRM-009',
  notFound: 'E-PRM-404',
  scopeForbidden: 'E-AUTH-103',
  conflict: 'E-PRM-409',
} as const;

// ─── Nested value objects ─────────────────────────────────────────────────────

// ─── DB row (internal, snake_case) ────────────────────────────────────────────

export const PromoCodeRowSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    campaign_id: z.string(),
    brand_enum: BrandEnumSchema,
    scope_type: PromoCodeScopeSchema,
    issued_store_id: z.string().nullable(),
    generation_method: PromoCodeGenerationMethodSchema,
    description: z.string().nullable(),
    valid_from: z.string(),
    valid_to: z.string(),
    max_uses: z.number().int().nullable(),
    used_count: z.number().int().nonnegative(),
    status: PromoCodeStatusSchema,
    /** G-06 FR-007: 無効化理由。閲覧画面は無いが、記録するという画面表記に合わせて保持する。 */
    disabled_reason: z.string().nullable(),
    created_by: z.string(),
    created_by_name: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi({
    title: 'PromoCodeRow',
    description: 'プロモーションコードのDB行 (内部表現)',
  });

// ─── Query ────────────────────────────────────────────────────────────────────

export const GetPromoCodesQueryParamsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    campaignId: z.string().optional(),
    scopeType: PromoCodeScopeSchema.optional(),
    brandEnum: BrandEnumSchema.optional(),
    issuedStoreId: z.string().optional(),
    createdBy: z.string().optional(),
    status: PromoCodeEffectiveStatusSchema.optional(),
    codePrefix: z.string().optional().openapi({ description: 'コードの前方一致 (大文字英数字)' }),
    /** プロトタイプの検索ボックスはコードと説明の両方に部分一致する。 */
    query: z.string().optional().openapi({ description: 'コード・説明の部分一致' }),
    validFromAfter: z.string().optional(),
    validToBefore: z.string().optional(),
    sort: PromoCodeSortSchema.default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .openapi({
    title: 'GetPromoCodesQueryParams',
    description: 'プロモーションコード一覧取得クエリ',
  });

export const ExportPromoCodesQueryParamsSchema = z
  .object({
    campaignId: z.string().optional(),
    scopeType: PromoCodeScopeSchema.optional(),
    brandEnum: BrandEnumSchema.optional(),
    issuedStoreId: z.string().optional(),
    createdBy: z.string().optional(),
    status: PromoCodeEffectiveStatusSchema.optional(),
    codePrefix: z.string().optional(),
    validFromAfter: z.string().optional(),
    validToBefore: z.string().optional(),
    from: z.string().openapi({ description: 'created_at の下限。必須' }),
    to: z.string().openapi({ description: 'created_at の上限。必須。to - from <= 366日' }),
    encoding: z.enum(['utf-8', 'sjis-bom']).default('utf-8'),
  })
  .openapi({
    title: 'ExportPromoCodesQueryParams',
    description: 'プロモーションコードCSV出力クエリ',
  });

// ─── Request bodies ───────────────────────────────────────────────────────────

const promoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

/** Promotion_Code_Management PromotionCodeCreateBody */
export const CreatePromoCodeBodySchema = z
  .object({
    campaignId: z.string().trim().min(1, 'キャンペーンを選択してください'),
    generationMethod: PromoCodeGenerationMethodSchema,
    code: z.string().trim().min(1).max(50).optional(),
    scopeType: PromoCodeScopeSchema,
    issuedStoreId: z.string().nullable().optional(),
    brandEnum: BrandEnumSchema,
    description: z.string().trim().max(255).nullable().optional(),
    validFrom: z.string().regex(promoDateRegex, '有効期間の開始日が不正です'),
    validTo: z.string().regex(promoDateRegex, '有効期間の終了日が不正です'),
    maxUses: z.number().int().positive('使用上限は1以上で入力してください').nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.generationMethod === 'manual' && !value.code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['code'],
        message: '手動入力の場合はコードを入力してください',
      });
    }
    if (value.validFrom > value.validTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['validTo'],
        message: '有効期間の終了日は開始日以降にしてください',
      });
    }
    if (value.scopeType === 'issuer_store_only' && !value.issuedStoreId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['issuedStoreId'],
        message: '発行店舗を選択してください',
      });
    }
    if (value.scopeType !== 'issuer_store_only' && value.issuedStoreId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['issuedStoreId'],
        message: '発行店舗はタイプB (発行店舗のみ) の場合にのみ指定できます',
      });
    }
  })
  .openapi({
    title: 'CreatePromoCodeBody',
    description: 'プロモーションコード発行リクエスト',
  });

/** Promotion_Code_Management PromotionCodeStatusBody */
export const UpdatePromoCodeStatusBodySchema = z
  .object({
    action: PromoCodeStatusToggleActionSchema,
    reason: z.string().trim().max(500).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    // G-06 FR-007: 無効化は操作履歴に理由を残すため必須 (プロトタイプでも confirm を理由必須でゲート)。
    if (value.action === 'disable' && !value.reason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: '無効化理由を入力してください',
      });
    }
  })
  .openapi({
    title: 'UpdatePromoCodeStatusBody',
    description: 'プロモーションコードの無効化・再有効化リクエスト',
  });

// ─── Responses ────────────────────────────────────────────────────────────────

/** Promotion_Code_Management PromotionCodeListItem */
export const PromoCodeListItemResponseSchema = z
  .object({
    id: z.string().openapi({ example: 'PC001' }),
    code: z.string().openapi({ example: 'SPRING2026' }),
    campaignId: z.string().openapi({ example: 'CP001' }),
    campaignName: z.string().openapi({ example: '春の入会キャンペーン' }),
    campaignIsAccepting: z.boolean(),
    campaignDeletedAt: z.string().nullable(),
    brandEnum: BrandEnumSchema,
    scopeType: PromoCodeScopeSchema,
    issuedStoreId: z.string().nullable(),
    issuedStoreName: z.string().nullable(),
    generationMethod: PromoCodeGenerationMethodSchema,
    description: z.string().nullable().openapi({ example: 'Google広告用' }),
    validFrom: z.string().openapi({ example: '2026-03-01' }),
    validTo: z.string().openapi({ example: '2026-04-30' }),
    maxUses: z.number().int().nullable(),
    usedCount: z.number().int().nonnegative(),
    usageRate: z.number().nullable().openapi({ description: '使用率 (%)。無制限のときは null' }),
    remaining: z.number().int().nullable().openapi({ description: '残数。無制限のときは null' }),
    status: PromoCodeStatusSchema,
    effectiveStatus: PromoCodeEffectiveStatusSchema,
    createdBy: z.string(),
    createdByName: z.string().openapi({ example: '本部' }),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({
    title: 'PromoCodeListItemResponse',
    description: 'プロモーションコード一覧アイテム',
  });

const promoPagination = z.object({
  page: z.number(),
  limit: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

export const GetPromoCodesResponseSchema = z
  .object({
    items: z.array(PromoCodeListItemResponseSchema),
    pagination: promoPagination.extend({
      totalAllItems: z.number().openapi({ description: 'フィルター適用前の総件数' }),
    }),
    summary: z
      .object({
        issuedCount: z.number().int().nonnegative().openapi({ description: '発行数' }),
        totalUsedCount: z.number().int().nonnegative().openapi({ description: '総利用回数' }),
      })
      .openapi({ description: 'テーブル下部サマリー用の集計値' }),
  })
  .openapi({
    title: 'GetPromoCodesResponse',
    description: 'プロモーションコード一覧レスポンス',
  });

export const CreatePromoCodeResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'プロモーションコードを発行しました' }),
    promoCode: PromoCodeListItemResponseSchema,
  })
  .openapi({
    title: 'CreatePromoCodeResponse',
    description: 'プロモーションコード発行レスポンス',
  });

export const UpdatePromoCodeStatusResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'プロモーションコードを無効化しました' }),
    promoCode: PromoCodeListItemResponseSchema,
  })
  .openapi({
    title: 'UpdatePromoCodeStatusResponse',
    description: 'プロモーションコードステータス変更レスポンス',
  });

// ─── Types ────────────────────────────────────────────────────────────────────

export type PromoCodeScope = z.infer<typeof PromoCodeScopeSchema>;
export type PromoCodeStatus = z.infer<typeof PromoCodeStatusSchema>;
export type PromoCodeEffectiveStatus = z.infer<typeof PromoCodeEffectiveStatusSchema>;
export type PromoCodeGenerationMethod = z.infer<typeof PromoCodeGenerationMethodSchema>;
export type PromoCodeStatusToggleAction = z.infer<typeof PromoCodeStatusToggleActionSchema>;
export type PromoCodeRow = z.infer<typeof PromoCodeRowSchema>;
export type GetPromoCodesQueryParams = z.infer<typeof GetPromoCodesQueryParamsSchema>;
export type CreatePromoCodeBody = z.infer<typeof CreatePromoCodeBodySchema>;
export type UpdatePromoCodeStatusBody = z.infer<typeof UpdatePromoCodeStatusBodySchema>;
export type PromoCodeListItemResponse = z.infer<typeof PromoCodeListItemResponseSchema>;
