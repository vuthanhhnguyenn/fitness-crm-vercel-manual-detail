import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { ErrorResponseSchema } from './auth.schema';
import { StoreListBrandSchema } from './store.schema';

extendZodWithOpenApi(z);

export const OptionTypeSchema = z.enum(['standard', 'metered', 'auto_attached']).openapi({
  title: 'OptionType',
  description: 'オプション種別（通常/都次/自動付与）',
});

export const OptionStatusSchema = z.enum(['active', 'inactive']).openapi({
  title: 'OptionStatus',
  description: 'オプション有効/無効ステータス',
});

export const OptionProrataMethodSchema = z.enum(['daily', 'fixed']).openapi({
  title: 'OptionProrataMethod',
  description: '日割り計算方法（daily: 日割り計算 / fixed: 固定金額）',
});

export const OptionUsageRuleSchema = z
  .enum(['disabled', 'add_remove', 'add_remove_change', 'change_remove'])
  .openapi({
    title: 'OptionUsageRule',
    description: '利用可否ルール',
  });

export const OptionCategorySchema = z
  .enum(['supplement', 'drink', 'rental', 'locker', 'insurance', 'service'])
  .openapi({
    title: 'OptionCategory',
    description: 'オプション分類',
  });

export const OptionMasterCategorySchema = z
  .enum(['gym_option', 'locker_option', 'lesson_plan', 'insurance', 'oneday_pass', 'other'])
  .openapi({
    title: 'OptionMasterCategory',
    description: 'オプション機能カテゴリ',
  });

export const OptionMasterListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'OP002', description: 'オプションID' }),
    name: z.string().openapi({ example: '水素水', description: 'オプション名' }),
    code: z.string().openapi({ example: 'H2O-001', description: 'オプションコード' }),
    category: OptionMasterCategorySchema.openapi({ description: 'オプション機能カテゴリ' }),
    brand: StoreListBrandSchema.openapi({ description: 'ブランド' }),
    option_type: OptionTypeSchema.openapi({ description: 'オプション種別' }),
    price_including_tax: z
      .number()
      .nonnegative()
      .openapi({ example: 1100, description: '料金（税込）' }),
    tax_rate: z.number().nonnegative().openapi({ example: 10, description: '税率（%）' }),
    prorated_enabled: z.boolean().openapi({ example: true, description: '日割り要否' }),
    prorata_method: OptionProrataMethodSchema.nullable().openapi({
      description: '日割り計算方法（prorated_enabled=true の場合のみ）',
    }),
    usage_rule: OptionUsageRuleSchema.openapi({ description: '利用可否ルール' }),
    linked_contracts: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 10, description: '紐付き契約プラン数' }),
    member_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 680, description: '利用会員数' }),
    store_id: z.string().nullable().openapi({ description: '対象店舗ID（null = 全店舗）' }),
    store_name: z.string().nullable().openapi({ description: '対象店舗名（null = 全店舗）' }),
    accounting_code: z.string().openapi({ example: 'OPT-102', description: '会計コード' }),
    status: OptionStatusSchema.openapi({ description: 'ステータス' }),
    description: z.string().nullable().openapi({ description: '説明文' }),
  })
  .openapi({
    title: 'OptionMasterListItem',
    description: 'オプション一覧アイテム',
  });

export const GetOptionMastersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
    search: z.string().optional().openapi({ description: 'オプション名・コードで検索' }),
    brand: StoreListBrandSchema.optional(),
    option_type: OptionTypeSchema.optional(),
    status: OptionStatusSchema.optional(),
    category: OptionMasterCategorySchema.optional().openapi({
      description: 'オプション機能カテゴリで絞り込み',
    }),
    store_id: z.string().optional().openapi({ description: '店舗IDで絞り込み' }),
    sort_by: z
      .enum(['id', 'name', 'code', 'price_including_tax', 'member_count', 'tax_rate', 'status'])
      .default('id'),
    sort_order: z.enum(['asc', 'desc']).default('asc'),
  })
  .openapi({
    title: 'GetOptionMastersQuery',
    description: 'オプション一覧取得クエリ',
  });

export const GetOptionMastersResponseSchema = z
  .object({
    options: z.array(OptionMasterListItemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      total_pages: z.number(),
    }),
  })
  .openapi({
    title: 'GetOptionMastersResponse',
    description: 'オプション一覧レスポンス',
  });

export const OptionMasterDetailSchema = OptionMasterListItemSchema.extend({
  price_excluding_tax: z
    .number()
    .nonnegative()
    .openapi({ example: 1100, description: '料金（税抜）' }),
  option_category: OptionCategorySchema.openapi({ description: 'オプション分類' }),
  store_range: z.string().openapi({ example: '全店舗（12店舗）', description: '対象店舗範囲' }),
  note: z.string().nullable().openapi({ description: '備考' }),
  member_app_image: z.string().nullable().openapi({ description: '会員公開用画像（base64）' }),
  created_at: z.string().openapi({ example: '2024-04-01T10:00:00+09:00', description: '作成日時' }),
  updated_at: z.string().openapi({ example: '2026-02-15T14:30:00+09:00', description: '更新日時' }),
  popularity_rank: z.number().int().positive().nullable().openapi({
    example: 3,
    description: '人気ランキング',
  }),
  tsuji_type: z.string().nullable().openapi({ description: '都次オプション種別' }),
  constraint_main_option_change: z.boolean().openapi({ description: '主オプション契約変更可否' }),
  constraint_change: z.boolean().openapi({ description: '変更可否' }),
  area_restrictions: z.array(z.string()).openapi({ description: 'エリア制限' }),
}).openapi({
  title: 'OptionMasterDetail',
  description: 'オプション詳細',
});

export const GetOptionMasterDetailResponseSchema = z
  .object({ option: OptionMasterDetailSchema })
  .openapi({
    title: 'GetOptionMasterDetailResponse',
    description: 'オプション詳細レスポンス',
  });

export const UpsertOptionMasterBodySchema = z
  .object({
    brand: StoreListBrandSchema.openapi({ description: 'ブランド' }),
    name: z.string().min(1, 'オプション名は必須です').openapi({ description: 'オプション名' }),
    code: z.string().min(1, 'コードは必須です').openapi({ description: 'コード' }),
    option_category: OptionCategorySchema.openapi({ description: 'オプション分類' }),
    category: OptionMasterCategorySchema.optional().openapi({
      description: 'オプション機能カテゴリ（未指定時はコードから自動判定）',
    }),
    accounting_code: z.string().default('').openapi({ description: '会計コード' }),
    note: z.string().nullable().optional().openapi({ description: '備考' }),
    description: z.string().nullable().optional().openapi({ description: '説明文' }),
    member_app_image: z.string().nullable().optional().openapi({
      description: '会員公開用画像（base64）',
    }),
    price_including_tax: z
      .number({ error: '料金（税込）は必須です' })
      .nonnegative('0以上の値を入力してください')
      .openapi({ description: '料金（税込）' }),
    tax_rate: z.number({ error: '税率は必須です' }).nonnegative().openapi({ description: '税率' }),
    prorated_enabled: z.boolean().default(false).openapi({ description: '日割り要否' }),
    prorata_method: OptionProrataMethodSchema.nullable().optional().openapi({
      description: '日割り計算方式',
    }),
    option_type: OptionTypeSchema.openapi({ description: 'オプション種別' }),
    tsuji_type: z.string().nullable().optional().openapi({ description: '都次オプション種別' }),
    usage_rule: OptionUsageRuleSchema.openapi({ description: '利用可否ルール' }),
    constraint_main_option_change: z
      .boolean()
      .default(false)
      .openapi({ description: '主オプション契約変更可否' }),
    constraint_change: z.boolean().default(false).openapi({ description: '変更可否' }),
    area_restrictions: z.array(z.string()).default([]).openapi({ description: 'エリア制限' }),
    status: OptionStatusSchema.default('active').openapi({ description: 'ステータス' }),
  })
  .superRefine((value, ctx) => {
    if (value.prorated_enabled && !value.prorata_method) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['prorata_method'],
        message: '日割り計算方式を選択してください',
      });
    }

    if (!value.prorated_enabled && value.prorata_method) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['prorata_method'],
        message: '日割り未適用の場合は日割り計算方式を指定できません',
      });
    }

    if (value.option_type === 'metered' && !value.tsuji_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tsuji_type'],
        message: '都次オプション種別を選択してください',
      });
    }

    if (value.option_type !== 'metered' && value.tsuji_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tsuji_type'],
        message: '都次以外のオプションでは都次オプション種別を指定できません',
      });
    }
  })
  .openapi({
    title: 'UpsertOptionMasterBody',
    description: 'オプション作成・更新リクエスト',
  });

export const CreateOptionMasterResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'オプションを作成しました' }),
    option: OptionMasterDetailSchema,
  })
  .openapi({
    title: 'CreateOptionMasterResponse',
    description: 'オプション作成レスポンス',
  });

export const UpdateOptionMasterResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'オプションを更新しました' }),
    option: OptionMasterDetailSchema,
  })
  .openapi({
    title: 'UpdateOptionMasterResponse',
    description: 'オプション更新レスポンス',
  });

export const OptionMasterChangeHistoryItemSchema = z
  .object({
    date: z.string().openapi({ example: '2026/02/15 14:30' }),
    user: z.string().openapi({ example: '管理者A' }),
    field: z.string().nullable(),
    from: z.string().nullable(),
    to: z.string(),
  })
  .openapi({ title: 'OptionMasterChangeHistoryItem', description: 'オプション変更履歴' });

export const GetOptionMasterChangeHistoryResponseSchema = z
  .object({ history: z.array(OptionMasterChangeHistoryItemSchema) })
  .openapi({
    title: 'GetOptionMasterChangeHistoryResponse',
    description: 'オプション変更履歴レスポンス',
  });

export const DeleteOptionMasterRequestSchema = z
  .object({
    reason: z.string().min(1, '削除理由は必須です').openapi({ example: '廃止のため' }),
  })
  .openapi({ title: 'DeleteOptionMasterRequest', description: 'オプション削除リクエスト' });

export const DeleteOptionMasterResponseSchema = z
  .object({ message: z.string().openapi({ example: 'オプションを削除しました' }) })
  .openapi({ title: 'DeleteOptionMasterResponse', description: 'オプション削除レスポンス' });

export type OptionMasterListItem = z.infer<typeof OptionMasterListItemSchema>;
export type GetOptionMastersQuery = z.infer<typeof GetOptionMastersQuerySchema>;
export type GetOptionMastersResponse = z.infer<typeof GetOptionMastersResponseSchema>;
export type OptionMasterDetail = z.infer<typeof OptionMasterDetailSchema>;
export type GetOptionMasterDetailResponse = z.infer<typeof GetOptionMasterDetailResponseSchema>;
export type UpsertOptionMasterBody = z.infer<typeof UpsertOptionMasterBodySchema>;
export type OptionMasterChangeHistoryItem = z.infer<typeof OptionMasterChangeHistoryItemSchema>;
export type GetOptionMasterChangeHistoryResponse = z.infer<
  typeof GetOptionMasterChangeHistoryResponseSchema
>;
export type DeleteOptionMasterRequest = z.infer<typeof DeleteOptionMasterRequestSchema>;
export type DeleteOptionMasterResponse = z.infer<typeof DeleteOptionMasterResponseSchema>;
export type CreateOptionMasterResponse = z.infer<typeof CreateOptionMasterResponseSchema>;
export type UpdateOptionMasterResponse = z.infer<typeof UpdateOptionMasterResponseSchema>;
export type OptionCategory = z.infer<typeof OptionCategorySchema>;
export type OptionMasterCategory = z.infer<typeof OptionMasterCategorySchema>;
export type OptionProrataMethod = z.infer<typeof OptionProrataMethodSchema>;
export type OptionUsageRule = z.infer<typeof OptionUsageRuleSchema>;

export { ErrorResponseSchema };
