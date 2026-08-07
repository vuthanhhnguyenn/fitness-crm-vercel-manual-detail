import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { StoreListBrandSchema } from './store.schema';

export { ErrorResponseSchema } from './auth.schema';

extendZodWithOpenApi(z);

export const MainContractTypeSchema = z
  .enum([
    'general',
    'oneDay',
    'family',
    'kids',
    'student',
    'corporate',
    'welfare',
    'prepaid',
    'special',
  ])
  .openapi({
    title: 'MainContractType',
    description: '主契約タイプ（G-01）',
  });

export const MainContractStatusSchema = z.enum(['active', 'inactive']).openapi({
  title: 'MainContractStatus',
  description: '主契約の有効/無効ステータス',
});

export const MainContractOtherStoreUsageSchema = z.enum(['all', 'direct', 'none']).openapi({
  title: 'MainContractOtherStoreUsage',
  description: '他店舗利用範囲',
});

export const MainContractListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'MC001', description: '主契約ID' }),
    name: z.string().openapi({ example: 'レギュラー会員', description: '主契約名' }),
    code: z.string().openapi({ example: 'REG-001', description: 'コード' }),
    old_code: z.string().nullable().optional().openapi({
      example: 'OLD-REG-001',
      description: '旧コード',
    }),
    contract_type: MainContractTypeSchema.openapi({ description: '契約タイプ' }),
    brand: StoreListBrandSchema.openapi({ description: 'ブランド' }),
    parent_contract_name: z.string().nullable().optional().openapi({
      example: 'レギュラー会員',
      description: '親主契約名',
    }),
    start_date: z.string().openapi({ example: '2024/04/01', description: '利用開始日' }),
    target_store_name: z.string().nullable().optional().openapi({
      example: 'JOYFIT24新宿店',
      description: '特殊契約の場合の対象店舗名',
    }),
    price_including_tax: z
      .number()
      .nonnegative()
      .openapi({ example: 7700, description: '料金（税込）' }),
    suspension_fee: z.number().nonnegative().openapi({
      example: 1100,
      description: '休会時請求額',
    }),
    monthly_limit: z.number().int().nonnegative().nullable().optional().openapi({
      example: 8,
      description: '回数上限',
    }),
    tax_rate: z.number().min(0).max(100).openapi({
      example: 10,
      description: '税率',
    }),
    suspendable_months: z.string().openapi({
      example: '1〜3月',
      description: '休会可能月',
    }),
    cancellable_months: z.string().openapi({
      example: '毎月',
      description: '退会可能月',
    }),
    active_contracts: z.number().int().nonnegative().openapi({
      example: 1250,
      description: '有効契約数',
    }),
    other_store_usage: MainContractOtherStoreUsageSchema.openapi({ description: '他店舗利用' }),
    companion_benefit_enabled: z.boolean().openapi({
      example: false,
      description: '同伴特典フラグ',
    }),
    enabled_stores: z.number().int().nonnegative().openapi({
      example: 10,
      description: '利用可能店舗数',
    }),
    total_stores: z.number().int().nonnegative().openapi({
      example: 12,
      description: '総店舗数',
    }),
    status: MainContractStatusSchema.openapi({ description: 'ステータス' }),
  })
  .openapi({
    title: 'MainContractListItem',
    description: '主契約一覧アイテム',
  });

export const GetMainContractsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
    search: z.string().optional().openapi({ description: '主契約名・IDで検索' }),
    contract_type: MainContractTypeSchema.optional(),
    brand: StoreListBrandSchema.optional(),
    status: MainContractStatusSchema.optional(),
    companion_benefit_enabled: z
      .preprocess((val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') {
          if (val === 'true') return true;
          if (val === 'false') return false;
          return undefined;
        }
        return undefined;
      }, z.boolean().optional())
      .openapi({
        description: '同伴特典の有無でフィルタリング',
      }),
    sort_by: z
      .enum([
        'id',
        'name',
        'code',
        'contract_type',
        'start_date',
        'price_including_tax',
        'suspension_fee',
        'monthly_limit',
        'tax_rate',
        'active_contracts',
        'enabled_stores',
        'status',
      ])
      .default('id'),
    sort_order: z.enum(['asc', 'desc']).default('asc'),
  })
  .openapi({
    title: 'GetMainContractsQuery',
    description: '主契約一覧取得クエリ',
  });

export const GetMainContractsResponseSchema = z
  .object({
    main_contracts: z.array(MainContractListItemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      total_pages: z.number(),
    }),
  })
  .openapi({
    title: 'GetMainContractsResponse',
    description: '主契約一覧レスポンス',
  });

export type MainContractListItem = z.infer<typeof MainContractListItemSchema>;
export type GetMainContractsQuery = z.infer<typeof GetMainContractsQuerySchema>;
export type GetMainContractsResponse = z.infer<typeof GetMainContractsResponseSchema>;

// ─────────────────────────────────────────────
// Detail schemas
// ─────────────────────────────────────────────

export const UsageHoursByDaySchema = z
  .object({
    day: z.string().openapi({ example: '月' }),
    from: z.string().openapi({ example: '06:00' }),
    to: z.string().openapi({ example: '23:00' }),
    all_day: z.boolean(),
  })
  .openapi({ title: 'UsageHoursByDay' });

export const MainContractDetailSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    old_code: z.string().nullable(),
    contract_type: MainContractTypeSchema,
    brand: StoreListBrandSchema,
    status: MainContractStatusSchema,
    companion_benefit_enabled: z.boolean(),
    other_store_usage: MainContractOtherStoreUsageSchema,
    changeability: z.string(),
    previous_contract: z.string().nullable(),
    billing_enabled: z.boolean(),
    modifiable: z.string(),
    initial_payment_months: z.number().int(),
    same_day_cancellation: z.boolean(),
    family_contract_allowed: z.boolean(),
    suspension_monthly_limit: z.number().int().nullable(),
    usage_schedule: z.string(),
    company: z.string().nullable(),
    regulation: z.string().nullable(),
    public_name: z.string(),
    public_description: z.string(),
    memo: z.string().nullable(),
    price_including_tax: z.number(),
    suspension_fee: z.number(),
    tax_rate: z.number(),
    start_date: z.string(),
    monthly_limit: z.number().int().nullable(),
    usage_hours_by_day: z.array(UsageHoursByDaySchema),
    suspendable_months: z.string(),
    cancellable_months: z.string(),
    accounting_code: z.string(),
    age_restriction: z.string(),
    gender_restriction: z.string(),
    store_range: z.string(),
    thumbnail_url: z.string().nullable(),
    description: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    active_contracts: z.number().int(),
    enabled_stores: z.number().int(),
    total_stores: z.number().int(),
    target_store_name: z.string().nullable(),
    parent_contract_id: z.string().nullable(),
    parent_contract_name: z.string().nullable(),
    child_contracts: z.array(z.object({ id: z.string(), name: z.string() })),
  })
  .openapi({ title: 'MainContractDetail', description: '主契約詳細' });

export const GetMainContractDetailResponseSchema = z
  .object({ main_contract: MainContractDetailSchema })
  .openapi({ title: 'GetMainContractDetailResponse' });

export type MainContractDetail = z.infer<typeof MainContractDetailSchema>;
export type GetMainContractDetailResponse = z.infer<typeof GetMainContractDetailResponseSchema>;

// ─────────────────────────────────────────────
// Change history schemas
// ─────────────────────────────────────────────

export const MainContractChangeHistoryItemSchema = z
  .object({
    date: z.string().openapi({ example: '2026/02/28 14:30' }),
    user: z.string().openapi({ example: '管理者A' }),
    field: z.string().nullable(),
    from: z.string().nullable(),
    to: z.string(),
  })
  .openapi({ title: 'MainContractChangeHistoryItem' });

export const GetMainContractChangeHistoryResponseSchema = z
  .object({ history: z.array(MainContractChangeHistoryItemSchema) })
  .openapi({ title: 'GetMainContractChangeHistoryResponse' });

export type MainContractChangeHistoryItem = z.infer<typeof MainContractChangeHistoryItemSchema>;
export type GetMainContractChangeHistoryResponse = z.infer<
  typeof GetMainContractChangeHistoryResponseSchema
>;

// ─────────────────────────────────────────────
// Create / Update schemas
// ─────────────────────────────────────────────

export const UpsertMainContractBodySchema = z
  .object({
    name: z.string().min(1, '主契約名は必須です'),
    code: z.string().min(1, 'コードは必須です'),
    contract_type: MainContractTypeSchema,
    brand: StoreListBrandSchema,
    status: MainContractStatusSchema.optional().default('active'),
    other_store_usage: MainContractOtherStoreUsageSchema.optional(),
    companion_benefit_enabled: z.boolean().optional().default(false),
    parent_contract_id: z.string().nullable().optional(),
    old_code: z.string().nullable().optional(),
    mutual_use: z.boolean().optional().default(false),
    public_name: z.string().optional(),
    description: z.string().optional(),
    company: z.string().nullable().optional(),
    regulation: z.string().nullable().optional(),
    public_description: z.string().optional(),
    memo: z.string().nullable().optional(),
    price_including_tax: z.number().nonnegative().optional(),
    suspension_fee: z.number().nonnegative().optional(),
    tax_rate: z.number().optional(),
    accounting_code: z.string().optional(),
    enrollment_fee: z.number().nonnegative().optional(),
    handling_fee: z.number().nonnegative().optional(),
    card_fee: z.number().nonnegative().optional(),
    security_fee: z.number().nonnegative().optional(),
    maintenance_fee: z.number().nonnegative().optional(),
    start_date: z.string().optional(),
    monthly_limit: z.number().int().nonnegative().nullable().optional(),
    suspension_monthly_limit: z.number().int().nonnegative().nullable().optional(),
    usage_hours_by_day: z.array(UsageHoursByDaySchema).optional(),
    suspendable_months: z.string().optional(),
    cancellable_months: z.string().optional(),
    initial_payment_months: z.number().int().nonnegative().optional(),
    age_restriction: z.string().optional(),
    gender_restriction: z.string().optional(),
    changeability: z.string().optional(),
    billing_enabled: z.boolean().optional().default(false),
    modifiable: z.string().optional(),
    same_day_cancellation: z.boolean().optional().default(false),
    family_contract_allowed: z.boolean().optional().default(false),
  })
  .openapi({ title: 'UpsertMainContractBody', description: '主契約作成・更新リクエスト' });

export const CreateMainContractResponseSchema = z
  .object({
    message: z.string(),
    main_contract: MainContractDetailSchema,
  })
  .openapi({ title: 'CreateMainContractResponse' });

export const UpdateMainContractResponseSchema = z
  .object({
    message: z.string(),
    main_contract: MainContractDetailSchema,
  })
  .openapi({ title: 'UpdateMainContractResponse' });

export type UpsertMainContractBody = z.infer<typeof UpsertMainContractBodySchema>;
export type CreateMainContractResponse = z.infer<typeof CreateMainContractResponseSchema>;
export type UpdateMainContractResponse = z.infer<typeof UpdateMainContractResponseSchema>;

// ─────────────────────────────────────────────
// Delete schemas
// ─────────────────────────────────────────────

export const DeleteMainContractRequestSchema = z
  .object({
    reason: z.string().min(1, '削除理由は必須です').openapi({ example: '廃止のため' }),
  })
  .openapi({ title: 'DeleteMainContractRequest' });

export const DeleteMainContractResponseSchema = z
  .object({ message: z.string().openapi({ example: '主契約を削除しました' }) })
  .openapi({ title: 'DeleteMainContractResponse' });

export type DeleteMainContractRequest = z.infer<typeof DeleteMainContractRequestSchema>;
export type DeleteMainContractResponse = z.infer<typeof DeleteMainContractResponseSchema>;
