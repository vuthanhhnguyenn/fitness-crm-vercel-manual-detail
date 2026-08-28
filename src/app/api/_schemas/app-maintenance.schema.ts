import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const AppMaintenanceTargetBrandSchema = z.enum(['joyfit', 'fit365']).openapi({
  title: 'AppMaintenanceTargetBrand',
  description: '対象ブランド',
});

export const AppMaintenanceStatusSchema = z.enum(['planned', 'in_progress', 'completed']).openapi({
  title: 'AppMaintenanceStatus',
  description: 'メンテナンスステータス (現在時刻から自動算出、保存されない)',
});

export const AppMaintenanceSortSchema = z.enum(['startsAt', 'endsAt']).openapi({
  title: 'AppMaintenanceSortBy',
  description: 'アプリメンテナンス一覧ソートキー',
});

// -- Seed schema --

export const AppMaintenanceSchema = z
  .object({
    id: z.string().openapi({ example: 'AM-001', description: 'メンテナンスID' }),
    target_brand: AppMaintenanceTargetBrandSchema,
    starts_at: z.string().openapi({
      example: '2026-04-15T02:00:00.000Z',
      description: '開始日時 (ISO 8601)',
    }),
    ends_at: z.string().openapi({
      example: '2026-04-15T06:00:00.000Z',
      description: '終了日時 (ISO 8601)',
    }),
    message: z
      .string()
      .min(1)
      .max(1000)
      .openapi({ description: 'メンテナンスメッセージ (会員向け)' }),
    created_by: z.string().openapi({ description: '登録者スタッフID' }),
    updated_by: z.string().nullable().openapi({ description: '最終更新者スタッフID' }),
    created_at: z.string().openapi({ description: '作成日時 (ISO 8601)' }),
    updated_at: z.string().nullable().openapi({ description: '最終更新日時 (ISO 8601)' }),
  })
  .openapi({
    title: 'AppMaintenance',
    description: 'アプリメンテナンス情報',
  });

// -- Request schemas --

export const GetAppMaintenancesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .refine(
        (value) => [25, 50, 100, 200].includes(value),
        'limit must be one of 25, 50, 100, 200',
      )
      .default(50),
    search: z.string().optional().openapi({ description: 'ID・メッセージ部分一致検索' }),
    brand: AppMaintenanceTargetBrandSchema.optional(),
    status: AppMaintenanceStatusSchema.optional(),
    sort: AppMaintenanceSortSchema.default('startsAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .openapi({
    title: 'GetAppMaintenancesQuery',
    description: 'アプリメンテナンス一覧取得クエリ',
  });

export const CreateAppMaintenanceBodySchema = z
  .object({
    targetBrand: AppMaintenanceTargetBrandSchema,
    startsAt: z
      .string()
      .min(1, '開始日時は必須です。')
      .openapi({ description: '開始日時 (ISO 8601)' }),
    endsAt: z
      .string()
      .min(1, '終了日時は必須です。')
      .openapi({ description: '終了日時 (ISO 8601)' }),
    message: z
      .string()
      .min(1, 'メンテナンスメッセージは必須です。')
      .max(1000, 'メンテナンスメッセージは1000文字以内で入力してください。'),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: '終了日時は開始日時より後の日時を入力してください。',
    path: ['endsAt'],
  })
  .openapi({
    title: 'CreateAppMaintenanceBody',
    description: 'アプリメンテナンス作成リクエスト',
  });

// Y-06 FR-M005: 編集画面では FR-M002 の全項目 (targetBrand 含む) が編集可能。
export const UpdateAppMaintenanceBodySchema = z
  .object({
    targetBrand: AppMaintenanceTargetBrandSchema.optional(),
    startsAt: z.string().min(1).optional(),
    endsAt: z.string().min(1).optional(),
    message: z.string().min(1).max(1000).optional(),
  })
  .openapi({
    title: 'UpdateAppMaintenanceBody',
    description: 'アプリメンテナンス更新リクエスト (FR-M002 の全項目を編集可能)',
  });

// -- Response schemas --

export const AppMaintenanceItemResponseSchema = z
  .object({
    id: AppMaintenanceSchema.shape.id,
    targetBrand: AppMaintenanceSchema.shape.target_brand,
    startsAt: AppMaintenanceSchema.shape.starts_at,
    endsAt: AppMaintenanceSchema.shape.ends_at,
    message: AppMaintenanceSchema.shape.message,
    status: AppMaintenanceStatusSchema.openapi({ description: '算出されたステータス' }),
    createdAt: AppMaintenanceSchema.shape.created_at,
  })
  .openapi({
    title: 'AppMaintenanceItemResponse',
    description: 'アプリメンテナンス一覧アイテム',
  });

export const AppMaintenanceDetailResponseSchema = AppMaintenanceItemResponseSchema.extend({
  createdBy: AppMaintenanceSchema.shape.created_by,
  updatedBy: AppMaintenanceSchema.shape.updated_by,
  updatedAt: AppMaintenanceSchema.shape.updated_at,
}).openapi({
  title: 'AppMaintenanceDetailResponse',
  description: 'アプリメンテナンス詳細情報',
});

export const GetAppMaintenancesResponseSchema = z
  .object({
    items: z.array(AppMaintenanceItemResponseSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      totalItems: z.number(),
      totalPages: z.number(),
      totalAllItems: z.number().openapi({
        example: 30,
        description: '全件数（フィルター適用前）',
      }),
    }),
  })
  .openapi({
    title: 'GetAppMaintenancesResponse',
    description: 'アプリメンテナンス一覧レスポンス',
  });

export const CreateAppMaintenanceResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'メンテナンス設定を登録しました' }),
    appMaintenance: AppMaintenanceDetailResponseSchema,
  })
  .openapi({
    title: 'CreateAppMaintenanceResponse',
    description: 'アプリメンテナンス作成レスポンス',
  });

export const UpdateAppMaintenanceResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'メンテナンス設定の変更を保存しました' }),
    appMaintenance: AppMaintenanceDetailResponseSchema,
  })
  .openapi({
    title: 'UpdateAppMaintenanceResponse',
    description: 'アプリメンテナンス更新レスポンス',
  });

export const DeleteAppMaintenanceResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'メンテナンス情報を削除しました' }),
    id: z.string().openapi({ example: 'AM-001' }),
  })
  .openapi({
    title: 'DeleteAppMaintenanceResponse',
    description: 'アプリメンテナンス削除レスポンス',
  });

// -- Type exports --

export type AppMaintenanceTargetBrand = z.infer<typeof AppMaintenanceTargetBrandSchema>;
export type AppMaintenanceStatus = z.infer<typeof AppMaintenanceStatusSchema>;
export type AppMaintenanceSort = z.infer<typeof AppMaintenanceSortSchema>;
export type AppMaintenance = z.infer<typeof AppMaintenanceSchema>;
export type GetAppMaintenancesQuery = z.infer<typeof GetAppMaintenancesQuerySchema>;
export type CreateAppMaintenanceBody = z.infer<typeof CreateAppMaintenanceBodySchema>;
export type UpdateAppMaintenanceBody = z.infer<typeof UpdateAppMaintenanceBodySchema>;
export type AppMaintenanceItemResponse = z.infer<typeof AppMaintenanceItemResponseSchema>;
export type AppMaintenanceDetailResponse = z.infer<typeof AppMaintenanceDetailResponseSchema>;
