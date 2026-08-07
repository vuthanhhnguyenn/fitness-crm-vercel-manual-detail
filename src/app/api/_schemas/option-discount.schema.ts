import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { ErrorResponseSchema } from './auth.schema';

extendZodWithOpenApi(z);

export const OptionDiscountConditionSchema = z
  .enum(['simultaneous', 'existing_member', 'family_2_plus', 'options_3_plus'])
  .openapi({
    title: 'OptionDiscountCondition',
    description: 'セット割の適用条件',
  });

export const OptionDiscountTypeSchema = z.enum(['fixed_amount', 'percentage']).openapi({
  title: 'OptionDiscountType',
  description: 'セット割の割引タイプ',
});

export const OptionDiscountStatusSchema = z.enum(['active', 'inactive']).openapi({
  title: 'OptionDiscountStatus',
  description: 'セット割の有効/無効ステータス',
});

export const OptionDiscountListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'SD001', description: 'セット割ID' }),
    name: z.string().openapi({ example: 'レギュラー＋水素水セット', description: 'セット割名' }),
    code: z.string().openapi({ example: 'SET-001', description: 'セット割コード' }),
    target_contracts: z
      .array(z.string())
      .openapi({ description: '対象契約名一覧', example: ['レギュラー会員'] }),
    target_options: z
      .array(z.string())
      .openapi({ description: '対象オプション名一覧', example: ['水素水'] }),
    discount_type: OptionDiscountTypeSchema.openapi({ description: '割引タイプ' }),
    discount_value: z.number().nonnegative().openapi({ example: 330, description: '割引値' }),
    conditions: OptionDiscountConditionSchema.openapi({
      example: 'simultaneous',
      description: '適用条件',
    }),
    store_id: z.string().nullable().openapi({ description: '対象店舗ID（null = 全店舗）' }),
    store_name: z.string().nullable().openapi({ description: '対象店舗名（null = 全店舗）' }),
    applied_count: z.number().int().nonnegative().openapi({ example: 180, description: '適用数' }),
    status: OptionDiscountStatusSchema.openapi({ description: 'ステータス' }),
  })
  .openapi({
    title: 'OptionDiscountListItem',
    description: 'セット割一覧アイテム',
  });

export const GetOptionDiscountsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(25),
    search: z.string().optional().openapi({ description: 'セット割名・コードで検索' }),
    discount_type: OptionDiscountTypeSchema.optional(),
    status: OptionDiscountStatusSchema.optional(),
    sort_by: z
      .enum([
        'id',
        'name',
        'code',
        'discount_type',
        'discount_value',
        'store_name',
        'applied_count',
        'status',
      ])
      .default('id'),
    sort_order: z.enum(['asc', 'desc']).default('asc'),
  })
  .openapi({
    title: 'GetOptionDiscountsQuery',
    description: 'セット割一覧取得クエリ',
  });

export const GetOptionDiscountsResponseSchema = z
  .object({
    option_discounts: z.array(OptionDiscountListItemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      total_pages: z.number(),
    }),
  })
  .openapi({
    title: 'GetOptionDiscountsResponse',
    description: 'セット割一覧レスポンス',
  });

// --- Detail ---
export const OptionDiscountDetailSchema = OptionDiscountListItemSchema.extend({
  description: z.string().nullable().openapi({ description: '説明文' }),
  rules: z.array(z.string()).openapi({ description: '適用ルール' }),
  created_at: z.string().openapi({ example: '2025/06/20 16:45', description: '作成日時' }),
  updated_at: z.string().openapi({ example: '2026/03/01 10:30', description: '最終更新日時' }),
  updated_by: z.string().openapi({ example: 'テストユーザー', description: '更新者' }),
}).openapi({
  title: 'OptionDiscountDetail',
  description: 'セット割詳細',
});

export const GetOptionDiscountDetailResponseSchema = z
  .object({ option_discount: OptionDiscountDetailSchema })
  .openapi({
    title: 'GetOptionDiscountDetailResponse',
    description: 'セット割詳細レスポンス',
  });

// --- Change History ---
export const OptionDiscountChangeHistoryItemSchema = z
  .object({
    date: z.string().openapi({ example: '2026/03/01 10:30' }),
    user: z.string().openapi({ example: 'テストユーザー' }),
    field: z.string().nullable(),
    from: z.string().nullable(),
    to: z.string(),
  })
  .openapi({ title: 'OptionDiscountChangeHistoryItem', description: 'セット割変更履歴' });

export const GetOptionDiscountChangeHistoryResponseSchema = z
  .object({ history: z.array(OptionDiscountChangeHistoryItemSchema) })
  .openapi({
    title: 'GetOptionDiscountChangeHistoryResponse',
    description: 'セット割変更履歴レスポンス',
  });

// --- Create / Update ---
export const UpsertOptionDiscountBodySchema = z
  .object({
    name: z.string().min(1, 'セット割名は必須です'),
    code: z.string().min(1, 'コードは必須です'),
    description: z.string().nullable().optional(),
    target_contracts: z.array(z.string()).min(1, '対象契約を1つ以上選択してください'),
    target_options: z.array(z.string()).min(1, '対象オプションを1つ以上選択してください'),
    discount_type: OptionDiscountTypeSchema,
    discount_value: z.number().nonnegative('0以上の値を入力してください'),
    conditions: OptionDiscountConditionSchema,
    store_id: z.string().nullable().optional().default(null),
    status: OptionDiscountStatusSchema.optional().default('active'),
  })
  .superRefine((value, ctx) => {
    if (value.discount_type === 'percentage' && value.discount_value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discount_value'],
        message: '割引率は100%以下で入力してください',
      });
    }
  })
  .openapi({
    title: 'UpsertOptionDiscountBody',
    description: 'セット割作成・更新リクエスト',
  });

export const CreateOptionDiscountResponseSchema = z
  .object({
    message: z.string(),
    option_discount: OptionDiscountDetailSchema,
  })
  .openapi({
    title: 'CreateOptionDiscountResponse',
    description: 'セット割作成レスポンス',
  });

export const UpdateOptionDiscountResponseSchema = z
  .object({
    message: z.string(),
    option_discount: OptionDiscountDetailSchema,
  })
  .openapi({
    title: 'UpdateOptionDiscountResponse',
    description: 'セット割更新レスポンス',
  });

// --- Delete ---
export const DeleteOptionDiscountRequestSchema = z
  .object({
    reason: z.string().min(1, '削除理由は必須です').openapi({ example: '廃止のため' }),
  })
  .openapi({ title: 'DeleteOptionDiscountRequest', description: 'セット割削除リクエスト' });

export const DeleteOptionDiscountResponseSchema = z
  .object({ message: z.string().openapi({ example: 'セット割を削除しました' }) })
  .openapi({ title: 'DeleteOptionDiscountResponse', description: 'セット割削除レスポンス' });

export { ErrorResponseSchema };

export type OptionDiscountType = z.infer<typeof OptionDiscountTypeSchema>;
export type OptionDiscountStatus = z.infer<typeof OptionDiscountStatusSchema>;
export type OptionDiscountCondition = z.infer<typeof OptionDiscountConditionSchema>;
export type OptionDiscountListItem = z.infer<typeof OptionDiscountListItemSchema>;
export type GetOptionDiscountsQuery = z.infer<typeof GetOptionDiscountsQuerySchema>;
export type GetOptionDiscountsResponse = z.infer<typeof GetOptionDiscountsResponseSchema>;
export type OptionDiscountDetail = z.infer<typeof OptionDiscountDetailSchema>;
export type GetOptionDiscountDetailResponse = z.infer<typeof GetOptionDiscountDetailResponseSchema>;
export type OptionDiscountChangeHistoryItem = z.infer<typeof OptionDiscountChangeHistoryItemSchema>;
export type GetOptionDiscountChangeHistoryResponse = z.infer<
  typeof GetOptionDiscountChangeHistoryResponseSchema
>;
export type DeleteOptionDiscountRequest = z.infer<typeof DeleteOptionDiscountRequestSchema>;
export type DeleteOptionDiscountResponse = z.infer<typeof DeleteOptionDiscountResponseSchema>;
export type UpsertOptionDiscountBody = z.infer<typeof UpsertOptionDiscountBodySchema>;
export type CreateOptionDiscountResponse = z.infer<typeof CreateOptionDiscountResponseSchema>;
export type UpdateOptionDiscountResponse = z.infer<typeof UpdateOptionDiscountResponseSchema>;
