import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { ErrorResponseSchema } from './auth.schema';
import { StoreListBrandSchema } from './store.schema';

extendZodWithOpenApi(z);

export const CampaignAcceptStatusSchema = z.enum(['active', 'inactive']).openapi({
  title: 'CampaignAcceptStatus',
  description: 'Campaign acceptance availability',
});

export const CampaignStatusSchema = z.enum(['active', 'inactive']).openapi({
  title: 'CampaignStatus',
  description: 'Campaign record status',
});

export const CampaignApplicationStartMonthTypeSchema = z
  .enum(['first_month', 'next_month', 'custom_month'])
  .openapi({
    title: 'CampaignApplicationStartMonthType',
    description: 'Start month type for campaign application period',
  });

export const CampaignAutoGrantTargetSchema = z.enum(['all', 'conditional']).openapi({
  title: 'CampaignAutoGrantTarget',
  description: 'Auto-grant target scope',
});

export const CampaignGenderConditionSchema = z.enum(['male', 'female', 'other']).openapi({
  title: 'CampaignGenderCondition',
  description: 'Gender condition for auto-grant',
});

export const CampaignErrorResponseSchema = ErrorResponseSchema.extend({
  code: z.string().optional().openapi({
    example: 'campaign_code_duplicate',
    description: 'Campaign-specific error code',
  }),
}).openapi({
  title: 'CampaignErrorResponse',
  description: 'Campaign-specific error response',
});

export const CampaignListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'CP001', description: 'Campaign ID' }),
    name: z.string().openapi({ example: '春の入会キャンペーン', description: 'Campaign name' }),
    code: z.string().openapi({ example: 'STR01A1B2C', description: 'Campaign code' }),
    brand: StoreListBrandSchema.openapi({ description: 'Brand' }),
    recruitment_period_start: z
      .string()
      .openapi({ example: '2026/03/01', description: 'Recruitment period start date' }),
    recruitment_period_end: z
      .string()
      .openapi({ example: '2026/04/30', description: 'Recruitment period end date' }),
    accept_status: CampaignAcceptStatusSchema.openapi({ description: 'Acceptance status' }),
    main_contract_name: z
      .string()
      .openapi({ example: 'レギュラー会員', description: 'Linked main contract name' }),
  })
  .openapi({
    title: 'CampaignListItem',
    description: 'Campaign master list item',
  });

export const GetCampaignsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
    search: z.string().optional().openapi({ description: 'Search by campaign name, ID, or code' }),
    brand: StoreListBrandSchema.optional(),
    accept_status: CampaignAcceptStatusSchema.optional(),
    recruitment_period_start: z.string().optional().openapi({
      description: 'Recruitment period start date (YYYY-MM-DD)',
    }),
    recruitment_period_end: z.string().optional().openapi({
      description: 'Recruitment period end date (YYYY-MM-DD)',
    }),
    sort_by: z
      .enum([
        'id',
        'name',
        'code',
        'brand',
        'recruitment_period_start',
        'recruitment_period_end',
        'accept_status',
        'main_contract_name',
      ])
      .default('id'),
    sort_order: z.enum(['asc', 'desc']).default('asc'),
  })
  .openapi({
    title: 'GetCampaignsQuery',
    description: 'Campaign master list query',
  });

export const GetCampaignsResponseSchema = z
  .object({
    campaigns: z.array(CampaignListItemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      total_pages: z.number(),
    }),
  })
  .openapi({
    title: 'GetCampaignsResponse',
    description: 'Campaign master list response',
  });

export type CampaignAcceptStatus = z.infer<typeof CampaignAcceptStatusSchema>;
export type CampaignErrorResponse = z.infer<typeof CampaignErrorResponseSchema>;
export type CampaignListItem = z.infer<typeof CampaignListItemSchema>;
export type GetCampaignsQuery = z.infer<typeof GetCampaignsQuerySchema>;
export type GetCampaignsResponse = z.infer<typeof GetCampaignsResponseSchema>;

export const CampaignPeriodTypeSchema = z.enum(['recruitment', 'usage', 'application']).openapi({
  title: 'CampaignPeriodType',
  description: 'Type of campaign period shown in the detail tab',
});

export const CampaignDetailPeriodSchema = z
  .object({
    period_type: CampaignPeriodTypeSchema.openapi({
      description: 'Period grouping key',
    }),
    label: z.string().openapi({ example: '募集期間', description: 'Period label' }),
    start_date: z.string().openapi({ example: '2026/03/01', description: 'Start date' }),
    end_date: z.string().openapi({ example: '2026/04/30', description: 'End date' }),
  })
  .openapi({
    title: 'CampaignDetailPeriod',
    description: 'Campaign period block shown in detail tab 1',
  });

export const CampaignDetailDiscountSchema = z
  .object({
    title: z.string().openapi({ example: '春の入会特典', description: 'Discount title' }),
    description: z.string().openapi({
      example: '入会金 0円 / 事務手数料 50% OFF',
      description: 'Discount description',
    }),
    value_text: z.string().openapi({
      example: '初月会費 1,100円引き',
      description: 'Display text for the discount value',
    }),
    first_month_enabled: z.boolean().openapi({
      example: true,
      description: 'Whether first month discount is enabled',
    }),
    second_month_enabled: z.boolean().openapi({
      example: false,
      description: 'Whether second month discount is enabled',
    }),
    amount: z.number().int().nonnegative().nullable().openapi({
      example: 1100,
      description: 'Fixed discount amount in JPY',
    }),
    rate: z.number().int().min(0).max(100).nullable().openapi({
      example: null,
      description: 'Discount rate percentage',
    }),
  })
  .openapi({
    title: 'CampaignDetailDiscount',
    description: 'Discount settings shown in the basic information tab',
  });

export const CampaignDetailAutoGrantSchema = z
  .object({
    enabled: z.boolean().openapi({ description: 'Whether auto-grant is enabled' }),
    title: z.string().openapi({ example: '自動付与設定', description: 'Auto-grant title' }),
    timing_text: z.string().openapi({
      example: '会員登録完了後 3日以内',
      description: 'Timing description',
    }),
    target_text: z.string().openapi({
      example: 'レギュラー会員 / プレミアム会員',
      description: 'Target contract description',
    }),
    description: z.string().openapi({
      example: '条件を満たした会員に対して自動でキャンペーン適用を行います。',
      description: 'Additional description',
    }),
    target_type: CampaignAutoGrantTargetSchema.openapi({
      description: 'Auto-grant target type',
    }),
    gender_conditions: z.array(CampaignGenderConditionSchema).openapi({
      example: ['male', 'female'],
      description: 'Gender conditions for auto-grant',
    }),
    option_ids: z.array(z.string()).openapi({
      example: ['OP001', 'OP002'],
      description: 'Auto-granted option IDs',
    }),
    option_names: z.array(z.string()).openapi({
      example: ['プロテイン', '水素水'],
      description: 'Auto-granted option names',
    }),
  })
  .openapi({
    title: 'CampaignDetailAutoGrant',
    description: 'Auto-grant settings shown in the basic information tab',
  });

export const CampaignUpsertDiscountSchema = z
  .object({
    first_month_enabled: z.boolean().default(false),
    second_month_enabled: z.boolean().default(false),
    amount: z.number().int().nonnegative().nullable().default(null),
    rate: z.number().int().min(0).max(100).nullable().default(null),
  })
  .superRefine((value, ctx) => {
    const hasEnabledMonth = value.first_month_enabled || value.second_month_enabled;
    const hasAmount = value.amount !== null;
    const hasRate = value.rate !== null;

    if (!hasEnabledMonth && (hasAmount || hasRate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['first_month_enabled'],
        message: '対象月を選択してください',
      });
    }

    if (hasEnabledMonth && !hasAmount && !hasRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['amount'],
        message: '割引額または割引率を入力してください',
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rate'],
        message: '割引額または割引率を入力してください',
      });
    }

    if (hasAmount && hasRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['amount'],
        message: '割引額と割引率は同時に設定できません',
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rate'],
        message: '割引額と割引率は同時に設定できません',
      });
    }
  })
  .openapi({
    title: 'CampaignUpsertDiscount',
    description: 'Campaign discount settings for create/update',
  });

export const CampaignUpsertAutoGrantSchema = z
  .object({
    enabled: z.boolean().default(false),
    target_type: CampaignAutoGrantTargetSchema.default('all'),
    gender_conditions: z.array(CampaignGenderConditionSchema).default([]),
    option_ids: z.array(z.string()).default([]),
  })
  .superRefine((value, ctx) => {
    if (!value.enabled) return;

    if (value.option_ids.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['option_ids'],
        message: '自動付与するオプションを1つ以上選択してください',
      });
    }

    if (value.target_type === 'conditional' && value.gender_conditions.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['gender_conditions'],
        message: '条件ありの場合は性別条件を1つ以上選択してください',
      });
    }
  })
  .openapi({
    title: 'CampaignUpsertAutoGrant',
    description: 'Campaign auto-grant settings for create/update',
  });

export const CampaignDetailStatsSchema = z
  .object({
    applied_member_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 128, description: 'Number of applied members' }),
    application_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 45, description: 'Number of applications' }),
    monthly_new_application_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 12, description: 'New applications this month' }),
  })
  .openapi({
    title: 'CampaignDetailStats',
    description: 'Campaign summary metrics shown on the detail page',
  });

export const CampaignDetailMetadataSchema = z
  .object({
    created_at: z.string().openapi({ example: '2026/01/10 09:30', description: 'Created at' }),
    created_by: z.string().openapi({ example: '本部管理者', description: 'Created by' }),
    updated_at: z.string().openapi({ example: '2026/05/31 14:20', description: 'Updated at' }),
    updated_by: z.string().openapi({ example: '本部管理者', description: 'Updated by' }),
  })
  .openapi({
    title: 'CampaignDetailMetadata',
    description: 'Campaign detail audit metadata',
  });

export const CampaignPromoCodePreviewStatusSchema = z
  .enum(['active', 'expired', 'limit_reached', 'inactive'])
  .openapi({
    title: 'CampaignPromoCodePreviewStatus',
    description: 'Read-only promo-code preview status for campaign detail tab 2',
  });

export const CampaignPromoCodePreviewItemSchema = z
  .object({
    code: z.string().openapi({ example: 'STR01-ABCDE', description: 'Promo code' }),
    description: z
      .string()
      .nullable()
      .openapi({ example: '春の入会キャンペーン用', description: 'Promo code description' }),
    valid_from: z.string().openapi({ example: '2026/03/01', description: 'Validity start date' }),
    valid_to: z.string().openapi({ example: '2026/04/30', description: 'Validity end date' }),
    status: CampaignPromoCodePreviewStatusSchema.openapi({
      description: 'Promo code preview status',
    }),
  })
  .openapi({
    title: 'CampaignPromoCodePreviewItem',
    description: 'Read-only promo-code preview row shown in campaign detail tab 2',
  });

export const CampaignChangeHistoryItemSchema = z
  .object({
    date: z.string().openapi({ example: '2026/03/10 14:20', description: 'Updated timestamp' }),
    user: z.string().openapi({ example: '田中 花子', description: 'Operator name' }),
    field: z.string().nullable().openapi({
      example: '月額割引',
      description: 'Changed field name',
    }),
    from: z.string().nullable().openapi({
      example: '初月30%OFF',
      description: 'Previous value',
    }),
    to: z.string().openapi({
      example: '初月50%OFF',
      description: 'New value',
    }),
  })
  .openapi({
    title: 'CampaignChangeHistoryItem',
    description: 'Campaign change history item',
  });

export const CampaignDetailSchema = z
  .object({
    id: z.string().openapi({ example: 'CP001', description: 'Campaign ID' }),
    name: z.string().openapi({ example: '春の入会キャンペーン', description: 'Campaign name' }),
    code: z.string().openapi({ example: 'STR01A1B2C', description: 'Campaign code' }),
    brand: StoreListBrandSchema.openapi({ description: 'Brand' }),
    note: z.string().nullable().openapi({
      example: '新生活需要向けの施策',
      description: 'Campaign note',
    }),
    accept_status: CampaignAcceptStatusSchema.openapi({ description: 'Acceptance status' }),
    status: CampaignStatusSchema.openapi({ description: 'Campaign status' }),
    accept_status_message: z.string().openapi({
      example: '受付中です。募集期間内の新規申請を受け付けています。',
      description: 'Acceptance status helper text',
    }),
    accept_status_action_label: z.string().openapi({
      example: '受付を停止する',
      description: 'Primary acceptance control label',
    }),
    main_contract_name: z.string().openapi({
      example: 'レギュラー会員',
      description: 'Main contract name',
    }),
    main_contract_id: z.string().openapi({
      example: 'MC001',
      description: 'Main contract ID',
    }),
    recruitment_period_start: z.string().openapi({
      example: '2026/03/01',
      description: 'Recruitment period start date',
    }),
    recruitment_period_end: z.string().openapi({
      example: '2026/04/30',
      description: 'Recruitment period end date',
    }),
    usage_period_start: z.string().openapi({
      example: '2026/03/15',
      description: 'Usage period start date',
    }),
    usage_period_end: z.string().openapi({
      example: '2026/05/31',
      description: 'Usage period end date',
    }),
    application_period_start: z.string().openapi({
      example: '2026/03/01',
      description: 'Campaign application period start date',
    }),
    application_period_end: z.string().openapi({
      example: '2026/04/30',
      description: 'Campaign application period end date',
    }),
    application_start_month_type: CampaignApplicationStartMonthTypeSchema.openapi({
      description: 'Campaign application start month type',
    }),
    application_custom_month: z.number().int().nullable().openapi({
      example: null,
      description: 'Custom application start month offset',
    }),
    application_duration_months: z.number().int().positive().openapi({
      example: 2,
      description: 'Campaign application duration in months',
    }),
    discount: CampaignDetailDiscountSchema,
    periods: z.array(CampaignDetailPeriodSchema).openapi({
      description: 'Periods displayed in the detail tab',
    }),
    auto_grant: CampaignDetailAutoGrantSchema,
    stats: CampaignDetailStatsSchema,
    metadata: CampaignDetailMetadataSchema,
    promo_code_previews: z.array(CampaignPromoCodePreviewItemSchema).openapi({
      description: 'Read-only promo-code preview rows for campaign detail tab 2',
    }),
  })
  .openapi({
    title: 'CampaignDetail',
    description: 'Campaign master detail payload for tab 1',
  });

export const GetCampaignDetailResponseSchema = z
  .object({
    campaign: CampaignDetailSchema,
  })
  .openapi({
    title: 'GetCampaignDetailResponse',
    description: 'Single campaign master detail response',
  });

export const GetCampaignChangeHistoryResponseSchema = z
  .object({
    history: z.array(CampaignChangeHistoryItemSchema),
  })
  .openapi({
    title: 'GetCampaignChangeHistoryResponse',
    description: 'Campaign change-history response',
  });

const campaignCodeRegex = /^(?:OGF|[A-Z0-9]+)[A-Z0-9]{5}$/;
const campaignDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const UpsertCampaignBodySchema = z
  .object({
    name: z.string().trim().min(1, 'キャンペーン名は必須です').max(255),
    code: z
      .string()
      .trim()
      .min(1, 'キャンペーンコードは必須です')
      .max(255)
      .regex(
        campaignCodeRegex,
        'キャンペーンコードは「店舗ID＋英数字5桁」または「OGF＋英数字5桁」の形式で入力してください',
      ),
    brand: StoreListBrandSchema,
    note: z.string().trim().max(1000).nullable().optional(),
    accept_status: CampaignAcceptStatusSchema.optional().default('active'),
    status: CampaignStatusSchema.optional().default('active'),
    recruitment_period_start: z.string().regex(campaignDateRegex, '募集期間の開始日が不正です'),
    recruitment_period_end: z.string().regex(campaignDateRegex, '募集期間の終了日が不正です'),
    usage_period_start: z.string().regex(campaignDateRegex, '利用開始期間の開始日が不正です'),
    usage_period_end: z.string().regex(campaignDateRegex, '利用開始期間の終了日が不正です'),
    application_start_month_type: CampaignApplicationStartMonthTypeSchema,
    application_custom_month: z.number().int().min(1).nullable().optional(),
    application_duration_months: z.number().int().min(1).max(12),
    main_contract_id: z.string().trim().min(1, '適用主契約を選択してください'),
    discount: CampaignUpsertDiscountSchema,
    auto_grant: CampaignUpsertAutoGrantSchema,
  })
  .superRefine((value, ctx) => {
    if (value.recruitment_period_start > value.recruitment_period_end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recruitment_period_end'],
        message: '募集期間の終了日は開始日以降にしてください',
      });
    }

    if (value.usage_period_start > value.usage_period_end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['usage_period_end'],
        message: '利用開始期間の終了日は開始日以降にしてください',
      });
    }

    if (value.application_start_month_type === 'custom_month' && !value.application_custom_month) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['application_custom_month'],
        message: 'X月指定の場合は開始月を入力してください',
      });
    }

    if (value.application_start_month_type !== 'custom_month' && value.application_custom_month) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['application_custom_month'],
        message: 'X月指定を選択した場合のみ開始月を入力できます',
      });
    }
  })
  .openapi({
    title: 'UpsertCampaignBody',
    description: 'Campaign create/update request payload',
  });

export const CreateCampaignResponseSchema = z
  .object({
    message: z.string(),
    campaign: CampaignDetailSchema,
  })
  .openapi({
    title: 'CreateCampaignResponse',
    description: 'Create campaign response',
  });

export const UpdateCampaignResponseSchema = z
  .object({
    message: z.string(),
    campaign: CampaignDetailSchema,
  })
  .openapi({
    title: 'UpdateCampaignResponse',
    description: 'Update campaign response',
  });

export type CampaignPeriodType = z.infer<typeof CampaignPeriodTypeSchema>;
export type CampaignDetailPeriod = z.infer<typeof CampaignDetailPeriodSchema>;
export type CampaignDetailDiscount = z.infer<typeof CampaignDetailDiscountSchema>;
export type CampaignDetailAutoGrant = z.infer<typeof CampaignDetailAutoGrantSchema>;
export type CampaignUpsertDiscount = z.infer<typeof CampaignUpsertDiscountSchema>;
export type CampaignUpsertAutoGrant = z.infer<typeof CampaignUpsertAutoGrantSchema>;
export type CampaignDetailStats = z.infer<typeof CampaignDetailStatsSchema>;
export type CampaignDetailMetadata = z.infer<typeof CampaignDetailMetadataSchema>;
export type CampaignPromoCodePreviewStatus = z.infer<typeof CampaignPromoCodePreviewStatusSchema>;
export type CampaignPromoCodePreviewItem = z.infer<typeof CampaignPromoCodePreviewItemSchema>;
export type CampaignChangeHistoryItem = z.infer<typeof CampaignChangeHistoryItemSchema>;
export type CampaignDetail = z.infer<typeof CampaignDetailSchema>;
export type GetCampaignDetailResponse = z.infer<typeof GetCampaignDetailResponseSchema>;
export type GetCampaignChangeHistoryResponse = z.infer<
  typeof GetCampaignChangeHistoryResponseSchema
>;
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;
export type CampaignApplicationStartMonthType = z.infer<
  typeof CampaignApplicationStartMonthTypeSchema
>;
export type CampaignAutoGrantTarget = z.infer<typeof CampaignAutoGrantTargetSchema>;
export type CampaignGenderCondition = z.infer<typeof CampaignGenderConditionSchema>;
export type UpsertCampaignBody = z.infer<typeof UpsertCampaignBodySchema>;
export type CreateCampaignResponse = z.infer<typeof CreateCampaignResponseSchema>;
export type UpdateCampaignResponse = z.infer<typeof UpdateCampaignResponseSchema>;

export { ErrorResponseSchema };
