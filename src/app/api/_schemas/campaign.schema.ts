import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { BrandEnumSchema } from './brand.schema';

extendZodWithOpenApi(z);

/** クエリ文字列の "true"/"false" を boolean に寄せる (リポジトリ共通パターン)。 */
const booleanQuery = () =>
  z.preprocess((value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  }, z.boolean().optional());

// ─── Enums ────────────────────────────────────────────────────────────────────

/** API-088 DiscountType */
export const CampaignDiscountTypeSchema = z.enum(['fixed_amount', 'percentage']).openapi({
  title: 'CampaignDiscountType',
  description: '割引種別 (fixed_amount=円 / percentage=%)',
});

/** API-088 ApplyStartMonth */
export const CampaignApplyStartMonthSchema = z
  .enum(['first_month', 'next_month', 'specific_month'])
  .openapi({
    title: 'CampaignApplyStartMonth',
    description: 'キャンペーン適用開始月 (初月 / 翌月 / X月指定)',
  });

export const CampaignTargetSexSchema = z.enum(['male', 'female', 'other']).openapi({
  title: 'CampaignTargetSex',
  description: '自動付与の性別条件',
});

export const CampaignAcceptStateSchema = z
  .enum(['accepting', 'stopped', 'capacity_reached'])
  .openapi({
    title: 'CampaignAcceptState',
    description: '受付状態 (導出値。上限到達時は capacity_reached)',
  });

export const CampaignPublishScopeSchema = z.enum(['all_stores', 'specific_stores']).openapi({
  title: 'CampaignPublishScope',
  description: '公開範囲 (全店舗公開 / 特定店舗のみ公開)',
});

export const CampaignSortSchema = z
  .enum(['id', 'createdAt', 'updatedAt', 'name', 'recruitmentStart', 'recruitmentEnd'])
  .openapi({
    title: 'CampaignSort',
    description: 'キャンペーン一覧の並び替えキー',
  });

// ─── Error ────────────────────────────────────────────────────────────────────

/** API-088 ErrorResponse */
export const CampaignErrorResponseSchema = z
  .object({
    code: z.string().openapi({ example: 'E-VAL-001', description: 'エラーコード' }),
    message: z.string().openapi({ description: 'ログ・デバッグ用の内部メッセージ (英語)' }),
    userMessage: z.string().openapi({ description: '利用者向けメッセージ (日本語)' }),
    traceId: z.string().optional().openapi({ example: '1-abcdef12-3456789abcdef012' }),
  })
  .openapi({
    title: 'CampaignErrorResponse',
    description: 'キャンペーンAPIのエラーレスポンス',
  });

/** API-088 のエラーコード。ハンドラ側の分岐に使う。 */
export const CAMPAIGN_ERROR_CODES = {
  validation: 'E-VAL-001',
  codeDuplicate: 'E-CMP-001',
  inUse: 'E-CMP-002',
  notFound: 'E-CMP-404',
  forbidden: 'E-AUTH-103',
} as const;

// ─── Nested value objects ─────────────────────────────────────────────────────

/** API-088 CampaignOptionDiscount */
export const CampaignOptionDiscountSchema = z
  .object({
    optionId: z.string().openapi({ example: 'OP001', description: 'オプションID' }),
    optionName: z
      .string()
      .openapi({ example: 'ドリンクバー（月額）', description: 'オプション名' }),
    discountMonth1: z.boolean().openapi({ description: '初月に割引を適用するか' }),
    discountMonth1Type: CampaignDiscountTypeSchema.nullable().openapi({
      description: 'discountMonth1 が true の場合は必須',
    }),
    discountMonth1Value: z.number().nonnegative().nullable().openapi({
      example: 500,
      description: 'fixed_amount のときは円 (整数) / percentage のときは 0〜100',
    }),
    discountMonth2: z.boolean().openapi({ description: '翌月に割引を適用するか' }),
    discountMonth2Type: CampaignDiscountTypeSchema.nullable().openapi({
      description: 'discountMonth2 が true の場合は必須',
    }),
    discountMonth2Value: z.number().nonnegative().nullable().openapi({
      example: 200,
      description: 'fixed_amount のときは円 (整数) / percentage のときは 0〜100',
    }),
  })
  .openapi({
    title: 'CampaignOptionDiscount',
    description: 'オプション単位の割引設定 (初月・翌月で別の値を保持できる)',
  });

/** API-088 CampaignOptionDiscountInput */
export const CampaignOptionDiscountInputSchema = z
  .object({
    optionId: z.string().trim().min(1, 'オプションを選択してください'),
    discountMonth1: z.boolean().default(false),
    discountMonth1Type: CampaignDiscountTypeSchema.nullable().default(null),
    discountMonth1Value: z.number().nonnegative().nullable().default(null),
    discountMonth2: z.boolean().default(false),
    discountMonth2Type: CampaignDiscountTypeSchema.nullable().default(null),
    discountMonth2Value: z.number().nonnegative().nullable().default(null),
  })
  .openapi({
    title: 'CampaignOptionDiscountInput',
    description: 'オプション単位の割引設定 (登録・更新用、初月・翌月で別の値を保持できる)',
  });

/** API-088 CampaignAutoOption */
export const CampaignAutoOptionSchema = z
  .object({
    optionId: z.string().openapi({ example: 'OP002', description: 'オプションID' }),
    optionName: z.string().openapi({ example: '水素水', description: 'オプション名' }),
    targetSexes: z
      .array(CampaignTargetSexSchema)
      .nullable()
      .openapi({
        example: ['male', 'female'],
        description: 'null は無条件 (全員)。配列指定で絞り込み',
      }),
  })
  .openapi({
    title: 'CampaignAutoOption',
    description: '自動付与オプション',
  });

/** API-088 CampaignAutoOptionInput */
export const CampaignAutoOptionInputSchema = z
  .object({
    optionId: z.string().trim().min(1, 'オプションを選択してください'),
    targetSexes: z.array(CampaignTargetSexSchema).nullable().default(null),
  })
  .openapi({
    title: 'CampaignAutoOptionInput',
    description: '自動付与オプション (登録・更新用)',
  });

export const CampaignReferralSettingsSchema = z
  .object({
    enabled: z.boolean().openapi({ description: '紹介キャンペーンとして設定するか' }),
    points: z.number().int().nonnegative().nullable().openapi({
      example: 1000,
      description: '紹介成立1件ごとに紹介者へ付与するポイント',
    }),
    tieredIncrease: z.boolean().openapi({ description: '紹介人数に応じた段階的増加の有無' }),
    tierThreshold: z.number().int().positive().nullable().openapi({
      example: 3,
      description: '段階的増加の開始人数 (N人目以降)',
    }),
    tierPoints: z.number().int().nonnegative().nullable().openapi({
      example: 2000,
      description: '段階的増加後の付与ポイント',
    }),
    annualReset: z.boolean().openapi({ description: '毎年3/31にポイントをリセットするか' }),
  })
  .openapi({
    title: 'CampaignReferralSettings',
    description: '紹介キャンペーン設定',
  });

export const CampaignReferralSettingsInputSchema = z
  .object({
    enabled: z.boolean().default(false),
    points: z.number().int().nonnegative().nullable().default(null),
    tieredIncrease: z.boolean().default(false),
    tierThreshold: z.number().int().positive().nullable().default(null),
    tierPoints: z.number().int().nonnegative().nullable().default(null),
    annualReset: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (!value.enabled) return;
    if (value.points === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['points'],
        message: '紹介者への特典ポイントを入力してください',
      });
    }
  })
  .openapi({
    title: 'CampaignReferralSettingsInput',
    description: '紹介キャンペーン設定 (登録・更新用)',
  });

export const CampaignEnrollmentChannelsSchema = z
  .object({
    mobile: z.number().int().nonnegative().openapi({ example: 79, description: 'モバイル経由' }),
    manual: z.number().int().nonnegative().openapi({ example: 34, description: '手動登録' }),
    referral: z.number().int().nonnegative().openapi({ example: 15, description: '紹介経由' }),
  })
  .openapi({
    title: 'CampaignEnrollmentChannels',
    description: '入会経路別内訳',
  });

export const CampaignStatsSchema = z
  .object({
    appliedMemberCount: z.number().int().nonnegative().openapi({ example: 128 }),
    pendingApplicationCount: z.number().int().nonnegative().openapi({ example: 142 }),
    monthlyNewApplicationCount: z.number().int().nonnegative().openapi({ example: 23 }),
    enrollmentChannels: CampaignEnrollmentChannelsSchema,
  })
  .openapi({
    title: 'CampaignStats',
    description: 'キャンペーン適用実績サマリー',
  });

/** オプション・店舗の参照表示用ペア。 */
export const CampaignOptionRefSchema = z
  .object({
    optionId: z.string().openapi({ example: 'OP001' }),
    optionName: z.string().openapi({ example: 'ヨガ' }),
  })
  .openapi({ title: 'CampaignOptionRef', description: 'オプション参照' });

export const CampaignStoreRefSchema = z
  .object({
    storeId: z.string().openapi({ example: 'S-004' }),
    storeName: z.string().openapi({ example: '八潮店' }),
  })
  .openapi({ title: 'CampaignStoreRef', description: '店舗参照' });

/** API-088 StoreCampaignLink */
export const CampaignStoreUsageSchema = z
  .object({
    storeId: z.string().openapi({ example: 'S-004' }),
    storeName: z.string().openapi({ example: '八潮店' }),
    linkedAt: z.string().openapi({ example: '2026-02-20', description: '紐づけ日 (YYYY-MM-DD)' }),
    linkedBy: z.string().nullable().openapi({ example: '本部管理者' }),
  })
  .openapi({
    title: 'CampaignStoreUsage',
    description: '店舗×キャンペーンの利用紐づけ',
  });

export const CampaignChangeHistoryItemSchema = z
  .object({
    date: z.string().openapi({ example: '2026-03-10T14:20:00.000Z', description: '更新日時' }),
    user: z.string().openapi({ example: '田中 花子', description: '操作者' }),
    field: z.string().nullable().openapi({
      example: '月額割引',
      description: '変更フィールド。新規作成時は null',
    }),
    from: z.string().nullable().openapi({ example: '初月30%OFF', description: '変更前' }),
    to: z.string().openapi({ example: '初月50%OFF', description: '変更後' }),
  })
  .openapi({
    title: 'CampaignChangeHistoryItem',
    description: 'キャンペーン変更履歴エントリ',
  });

// ─── DB row (internal, snake_case) ────────────────────────────────────────────

export const CampaignRowSchema = z
  .object({
    id: z.string(),
    brand_enum: BrandEnumSchema,
    campaign_code: z.string().max(50).nullable(),
    name: z.string().min(1).max(100),
    remarks: z.string().max(4000).nullable(),
    is_accepting: z.boolean(),
    recruitment_start: z.string(),
    recruitment_end: z.string(),
    usage_start: z.string().nullable(),
    usage_end: z.string().nullable(),
    apply_start_month: CampaignApplyStartMonthSchema.nullable(),
    apply_start_specific_n: z.number().int().min(1).nullable(),
    apply_duration_months: z.number().int().min(1).nullable(),
    plan_id: z.string(),
    plan_discount_month1: z.boolean(),
    plan_discount_month1_type: CampaignDiscountTypeSchema.nullable(),
    plan_discount_month1_value: z.number().nonnegative().nullable(),
    plan_discount_month2: z.boolean(),
    plan_discount_month2_type: CampaignDiscountTypeSchema.nullable(),
    plan_discount_month2_value: z.number().nonnegative().nullable(),
    option_discounts: z.array(CampaignOptionDiscountInputSchema),
    auto_options: z.array(CampaignAutoOptionInputSchema),
    entry_cap: z.number().int().min(1).nullable(),
    lock_in_months: z.number().int().min(0).nullable(),
    publish_scope: CampaignPublishScopeSchema,
    publish_store_ids: z.array(z.string()),
    condition_option_ids: z.array(z.string()),
    referral: CampaignReferralSettingsSchema,
    active_contract_count: z.number().int().nonnegative(),
    pending_application_count: z.number().int().nonnegative(),
    monthly_new_application_count: z.number().int().nonnegative(),
    channel_mobile_count: z.number().int().nonnegative(),
    channel_manual_count: z.number().int().nonnegative(),
    channel_referral_count: z.number().int().nonnegative(),
    // 監査
    created_by: z.string().nullable(),
    updated_by: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullable(),
  })
  .openapi({
    title: 'CampaignRow',
    description: 'キャンペーンのDB行 (内部表現)',
  });

export const StoreCampaignLinkRowSchema = z
  .object({
    store_id: z.string(),
    campaign_id: z.string(),
    linked_at: z.string(),
    linked_by: z.string().nullable(),
    created_at: z.string(),
  })
  .openapi({
    title: 'StoreCampaignLinkRow',
    description: '店舗×キャンペーン紐づけのDB行 (内部表現)',
  });

// ─── Query ────────────────────────────────────────────────────────────────────

export const GetCampaignsQueryParamsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
    nameQuery: z.string().optional().openapi({ description: 'キャンペーン名の部分一致' }),
    codeQuery: z.string().optional().openapi({ description: 'キャンペーンコードの部分一致' }),
    brandEnum: BrandEnumSchema.optional(),
    planId: z.string().optional(),
    isAccepting: booleanQuery().openapi({ description: '受付可否フラグでの絞り込み' }),
    acceptState: CampaignAcceptStateSchema.optional(),
    recruitmentActiveOn: z.string().optional().openapi({
      description: '募集期間内に該当日を含むもの (YYYY-MM-DD)',
    }),
    recruitmentFrom: z.string().optional().openapi({
      description: '募集期間がこの日以降に終了するもの (YYYY-MM-DD)',
    }),
    recruitmentTo: z.string().optional().openapi({
      description: '募集期間がこの日以前に開始するもの (YYYY-MM-DD)',
    }),
    sort: CampaignSortSchema.default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .openapi({
    title: 'GetCampaignsQueryParams',
    description: 'キャンペーン一覧取得クエリ',
  });

export const GetCampaignChangeHistoryQueryParamsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  })
  .openapi({
    title: 'GetCampaignChangeHistoryQueryParams',
    description: 'キャンペーン変更履歴取得クエリ',
  });

// ─── Request bodies ───────────────────────────────────────────────────────────

const campaignDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const CreateCampaignBodySchema = z
  .object({
    brandEnum: BrandEnumSchema,
    name: z.string().trim().min(1, 'キャンペーン名を入力してください').max(100),
    /** API-088: 自由記述・任意。命名規則 (店舗ID＋英数字5桁) は案内のみで検証しない (spec Assumptions)。 */
    campaignCode: z.string().trim().min(1).max(50).nullable().optional(),
    remarks: z.string().trim().max(4000).nullable().optional(),
    isAccepting: z.boolean().default(true),
    recruitmentStart: z.string().regex(campaignDateRegex, '募集期間の開始日が不正です'),
    recruitmentEnd: z.string().regex(campaignDateRegex, '募集期間の終了日が不正です'),
    usageStart: z.string().regex(campaignDateRegex).nullable().optional(),
    usageEnd: z.string().regex(campaignDateRegex).nullable().optional(),
    applyStartMonth: CampaignApplyStartMonthSchema.nullable().optional(),
    applyStartSpecificN: z.number().int().min(1).nullable().optional(),
    applyDurationMonths: z.number().int().min(1).nullable().optional(),
    planId: z.string().trim().min(1, '適用主契約を選択してください'),
    planDiscountMonth1: z.boolean().default(false),
    planDiscountMonth1Type: CampaignDiscountTypeSchema.nullable().optional(),
    planDiscountMonth1Value: z.number().nonnegative().nullable().optional(),
    planDiscountMonth2: z.boolean().default(false),
    planDiscountMonth2Type: CampaignDiscountTypeSchema.nullable().optional(),
    planDiscountMonth2Value: z.number().nonnegative().nullable().optional(),
    campaignOptionDiscounts: z.array(CampaignOptionDiscountInputSchema).default([]),
    campaignAutoOptions: z.array(CampaignAutoOptionInputSchema).default([]),
    // mock-ahead
    entryCap: z.number().int().min(1).nullable().optional(),
    lockInMonths: z.number().int().min(0).nullable().optional(),
    publishScope: CampaignPublishScopeSchema.default('all_stores'),
    publishStoreIds: z.array(z.string()).default([]),
    conditionOptionIds: z.array(z.string()).default([]),
    referral: CampaignReferralSettingsInputSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.recruitmentStart > value.recruitmentEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recruitmentEnd'],
        message: '募集期間の終了日は開始日以降にしてください',
      });
    }

    if (value.usageStart && value.usageEnd && value.usageStart > value.usageEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['usageEnd'],
        message: '利用開始期間の終了日は開始日以降にしてください',
      });
    }

    if (value.applyStartMonth === 'specific_month' && !value.applyStartSpecificN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applyStartSpecificN'],
        message: 'X月指定の場合は開始月を入力してください',
      });
    }

    if (value.applyStartMonth !== 'specific_month' && value.applyStartSpecificN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applyStartSpecificN'],
        message: 'X月指定を選択した場合のみ開始月を入力できます',
      });
    }

    // API-088: 月フラグが立っている場合はその月の種別と値が必須 (初月・翌月は独立)
    (['1', '2'] as const).forEach((month) => {
      const monthEnabled = value[`planDiscountMonth${month}`];
      const type = value[`planDiscountMonth${month}Type`];
      const discountValue = value[`planDiscountMonth${month}Value`];
      const path = `planDiscountMonth${month}Value` as const;
      if (monthEnabled && (!type || discountValue === null || discountValue === undefined)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message: '割引額または割引率を入力してください',
        });
      }
      if (
        type === 'percentage' &&
        discountValue !== null &&
        discountValue !== undefined &&
        discountValue > 100
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message: '割引率は100%以下で入力してください',
        });
      }
    });

    value.campaignOptionDiscounts.forEach((row, index) => {
      (['1', '2'] as const).forEach((month) => {
        const monthEnabled = row[`discountMonth${month}`];
        const type = row[`discountMonth${month}Type`];
        const discountValue = row[`discountMonth${month}Value`];
        const path = `discountMonth${month}Value` as const;
        if (monthEnabled && (!type || discountValue === null)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['campaignOptionDiscounts', index, path],
            message: '割引額または割引率を入力してください',
          });
        }
        if (type === 'percentage' && (discountValue ?? 0) > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['campaignOptionDiscounts', index, path],
            message: '割引率は100%以下で入力してください',
          });
        }
      });
    });

    if (value.publishScope === 'specific_stores' && value.publishStoreIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['publishStoreIds'],
        message: '公開対象店舗を1つ以上選択してください',
      });
    }
  })
  .openapi({
    title: 'CreateCampaignBody',
    description: 'キャンペーン作成リクエスト',
  });

/**
 * API-088 CampaignUpdate: 部分更新。省略=変更なし。
 * `brandEnum` は不変のため受け付けない。
 */
export const UpdateCampaignBodySchema = z
  .object({
    name: z.string().trim().min(1, 'キャンペーン名を入力してください').max(100).optional(),
    campaignCode: z.string().trim().min(1).max(50).nullable().optional(),
    remarks: z.string().trim().max(4000).nullable().optional(),
    isAccepting: z.boolean().optional(),
    recruitmentStart: z.string().regex(campaignDateRegex).optional(),
    recruitmentEnd: z.string().regex(campaignDateRegex).optional(),
    usageStart: z.string().regex(campaignDateRegex).nullable().optional(),
    usageEnd: z.string().regex(campaignDateRegex).nullable().optional(),
    applyStartMonth: CampaignApplyStartMonthSchema.nullable().optional(),
    applyStartSpecificN: z.number().int().min(1).nullable().optional(),
    applyDurationMonths: z.number().int().min(1).nullable().optional(),
    planId: z.string().trim().min(1).optional(),
    planDiscountMonth1: z.boolean().optional(),
    planDiscountMonth1Type: CampaignDiscountTypeSchema.nullable().optional(),
    planDiscountMonth1Value: z.number().nonnegative().nullable().optional(),
    planDiscountMonth2: z.boolean().optional(),
    planDiscountMonth2Type: CampaignDiscountTypeSchema.nullable().optional(),
    planDiscountMonth2Value: z.number().nonnegative().nullable().optional(),
    campaignOptionDiscounts: z.array(CampaignOptionDiscountInputSchema).optional(),
    campaignAutoOptions: z.array(CampaignAutoOptionInputSchema).optional(),
    entryCap: z.number().int().min(1).nullable().optional(),
    lockInMonths: z.number().int().min(0).nullable().optional(),
    publishScope: CampaignPublishScopeSchema.optional(),
    publishStoreIds: z.array(z.string()).optional(),
    conditionOptionIds: z.array(z.string()).optional(),
    referral: CampaignReferralSettingsInputSchema.optional(),
  })
  .openapi({
    title: 'UpdateCampaignBody',
    description: 'キャンペーン更新リクエスト (部分更新)',
  });

// ─── Responses ────────────────────────────────────────────────────────────────

export const CampaignListItemResponseSchema = z
  .object({
    id: z.string().openapi({ example: 'CP001', description: 'キャンペーンID' }),
    brandEnum: BrandEnumSchema,
    campaignCode: z.string().nullable().openapi({ example: 'STR01-A1B2C' }),
    name: z.string().openapi({ example: '春の入会キャンペーン' }),
    planId: z.string().openapi({ example: 'MC001' }),
    planName: z.string().openapi({ example: 'レギュラー会員' }),
    recruitmentStart: z.string().openapi({ example: '2026-03-01' }),
    recruitmentEnd: z.string().openapi({ example: '2026-04-30' }),
    isAccepting: z.boolean(),
    activeContractCount: z.number().int().nonnegative(),
    pendingApplicationCount: z.number().int().nonnegative(),
    createdAt: z.string().openapi({ example: '2026-02-15T10:30:00.000Z' }),
    updatedAt: z.string().openapi({ example: '2026-03-10T14:20:00.000Z' }),
    // mock-ahead
    entryCap: z.number().int().nullable().openapi({ description: '先着件数上限' }),
    acceptState: CampaignAcceptStateSchema.openapi({ description: '受付状態 (導出値)' }),
    hasPromotionCode: z.boolean().openapi({ description: 'プロモーションコードの有無' }),
  })
  .openapi({
    title: 'CampaignListItemResponse',
    description: 'キャンペーン一覧アイテム',
  });

export const CampaignDetailResponseSchema = CampaignListItemResponseSchema.extend({
  remarks: z.string().nullable(),
  usageStart: z.string().nullable().openapi({ example: '2026-03-01' }),
  usageEnd: z.string().nullable().openapi({ example: '2026-04-30' }),
  applyStartMonth: CampaignApplyStartMonthSchema.nullable(),
  applyStartSpecificN: z.number().int().nullable(),
  applyDurationMonths: z.number().int().nullable(),
  planDiscountMonth1: z.boolean(),
  planDiscountMonth1Type: CampaignDiscountTypeSchema.nullable(),
  planDiscountMonth1Value: z.number().nullable(),
  planDiscountMonth2: z.boolean(),
  planDiscountMonth2Type: CampaignDiscountTypeSchema.nullable(),
  planDiscountMonth2Value: z.number().nullable(),
  campaignOptionDiscounts: z.array(CampaignOptionDiscountSchema),
  campaignAutoOptions: z.array(CampaignAutoOptionSchema),
  storeCount: z.number().int().nonnegative(),
  promotionCodeCount: z.number().int().nonnegative(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  // mock-ahead
  lockInMonths: z.number().int().nullable().openapi({ description: '縛り期間' }),
  lockInExample: z.string().nullable().openapi({
    example: '2026/04入会の場合 → 2026/09末まで解約手数料対象',
    description: '縛り期間の適用例',
  }),
  publishScope: CampaignPublishScopeSchema.openapi({ description: '公開範囲' }),
  publishStores: z.array(CampaignStoreRefSchema).openapi({ description: '公開対象店舗' }),
  conditionOptions: z.array(CampaignOptionRefSchema).openapi({
    description: '適用発動条件のオプション契約',
  }),
  referral: CampaignReferralSettingsSchema.openapi({
    description: '紹介キャンペーン設定',
  }),
  stats: CampaignStatsSchema.openapi({ description: '適用実績サマリー' }),
  storeUsages: z.array(CampaignStoreUsageSchema).openapi({
    description: '店舗×キャンペーンの利用紐づけ (公開範囲とは別概念)',
  }),
}).openapi({
  title: 'CampaignDetailResponse',
  description: 'キャンペーン詳細',
});

const paginationShape = z.object({
  page: z.number(),
  limit: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

export const GetCampaignsResponseSchema = z
  .object({
    items: z.array(CampaignListItemResponseSchema),
    pagination: paginationShape.extend({
      totalAllItems: z.number().openapi({ description: 'フィルター適用前の総件数' }),
    }),
  })
  .openapi({
    title: 'GetCampaignsResponse',
    description: 'キャンペーン一覧レスポンス',
  });

export const GetCampaignDetailResponseSchema = z
  .object({ campaign: CampaignDetailResponseSchema })
  .openapi({
    title: 'GetCampaignDetailResponse',
    description: 'キャンペーン詳細レスポンス',
  });

export const GetCampaignChangeHistoryResponseSchema = z
  .object({
    items: z.array(CampaignChangeHistoryItemSchema),
    pagination: paginationShape,
  })
  .openapi({
    title: 'GetCampaignChangeHistoryResponse',
    description: 'キャンペーン変更履歴レスポンス',
  });

export const CreateCampaignResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'キャンペーンを登録しました' }),
    campaign: CampaignDetailResponseSchema,
  })
  .openapi({
    title: 'CreateCampaignResponse',
    description: 'キャンペーン作成レスポンス',
  });

export const UpdateCampaignResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'キャンペーンを更新しました' }),
    campaign: CampaignDetailResponseSchema,
  })
  .openapi({
    title: 'UpdateCampaignResponse',
    description: 'キャンペーン更新レスポンス',
  });

export const DeleteCampaignResponseSchema = z
  .object({ message: z.string().openapi({ example: 'キャンペーンを削除しました' }) })
  .openapi({
    title: 'DeleteCampaignResponse',
    description: 'キャンペーン削除レスポンス',
  });

// ─── Types ────────────────────────────────────────────────────────────────────

export type CampaignDiscountType = z.infer<typeof CampaignDiscountTypeSchema>;
export type CampaignApplyStartMonth = z.infer<typeof CampaignApplyStartMonthSchema>;
export type CampaignTargetSex = z.infer<typeof CampaignTargetSexSchema>;
export type CampaignAcceptState = z.infer<typeof CampaignAcceptStateSchema>;
export type CampaignPublishScope = z.infer<typeof CampaignPublishScopeSchema>;
export type CampaignSort = z.infer<typeof CampaignSortSchema>;
export type CampaignErrorResponse = z.infer<typeof CampaignErrorResponseSchema>;
export type CampaignOptionDiscount = z.infer<typeof CampaignOptionDiscountSchema>;
export type CampaignOptionDiscountInput = z.infer<typeof CampaignOptionDiscountInputSchema>;
export type CampaignAutoOption = z.infer<typeof CampaignAutoOptionSchema>;
export type CampaignAutoOptionInput = z.infer<typeof CampaignAutoOptionInputSchema>;
export type CampaignReferralSettings = z.infer<typeof CampaignReferralSettingsSchema>;
export type CampaignStats = z.infer<typeof CampaignStatsSchema>;
export type CampaignStoreUsage = z.infer<typeof CampaignStoreUsageSchema>;
export type CampaignChangeHistoryItem = z.infer<typeof CampaignChangeHistoryItemSchema>;
export type CampaignRow = z.infer<typeof CampaignRowSchema>;
export type StoreCampaignLinkRow = z.infer<typeof StoreCampaignLinkRowSchema>;
export type GetCampaignsQueryParams = z.infer<typeof GetCampaignsQueryParamsSchema>;
export type CreateCampaignBody = z.infer<typeof CreateCampaignBodySchema>;
export type UpdateCampaignBody = z.infer<typeof UpdateCampaignBodySchema>;
export type CampaignListItemResponse = z.infer<typeof CampaignListItemResponseSchema>;
export type CampaignDetailResponse = z.infer<typeof CampaignDetailResponseSchema>;
export type GetCampaignsResponse = z.infer<typeof GetCampaignsResponseSchema>;
