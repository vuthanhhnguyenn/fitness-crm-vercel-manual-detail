import { StaffRoleSchema } from '@/app/api/_schemas/staff.schema';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const CrmMaintenanceStatusSchema = z.enum(['planned', 'in_progress', 'completed']).openapi({
  title: 'CrmMaintenanceStatus',
  description: 'CRMメンテナンスステータス (現在時刻から自動算出、保存されない)',
});

export const CrmMaintenanceSortSchema = z.enum(['startsAt', 'endsAt', 'createdAt']).openapi({
  title: 'CrmMaintenanceSortBy',
  description: 'CRMメンテナンス一覧ソートキー',
});

// -- Row (storage) schema — snake_case --

export const CrmMaintenanceSchema = z
  .object({
    id: z.string().openapi({ example: 'M-001', description: 'CRMメンテナンスID' }),
    title: z.string().min(1).max(255).openapi({ description: '管理用タイトル' }),
    starts_at: z.string().openapi({
      example: '2026-08-01T18:00:00.000Z',
      description: '開始日時 (ISO 8601)',
    }),
    ends_at: z.string().openapi({
      example: '2026-08-01T21:00:00.000Z',
      description: '終了日時 (ISO 8601)',
    }),
    message: z
      .string()
      .min(1)
      .max(1000)
      .openapi({ description: 'アクセス制限中に表示するメッセージ' }),
    note: z.string().max(1000).nullable().openapi({ description: '備考 (任意)' }),
    created_by: z.string().openapi({ description: '登録者スタッフID' }),
    updated_by: z.string().nullable().openapi({ description: '最終更新者スタッフID' }),
    created_at: z.string().openapi({ description: '作成日時 (ISO 8601)' }),
    updated_at: z.string().nullable().openapi({ description: '最終更新日時 (ISO 8601)' }),
    // 事前通知 (FR-007) — mock 側のみ保持。未通知=false / 通知済み=true。
    notified: z.boolean().openapi({ description: '事前通知済みか (true=済 / false=未)' }),
  })
  .openapi({
    title: 'CrmMaintenance',
    description: 'CRMメンテナンス情報',
  });

// -- Request schemas --

export const GetCrmMaintenancesQuerySchema = z
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
    search: z.string().optional().openapi({ description: 'ID・タイトル部分一致検索' }),
    status: CrmMaintenanceStatusSchema.optional(),
    sort: CrmMaintenanceSortSchema.default('startsAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .openapi({
    title: 'GetCrmMaintenancesQuery',
    description: 'CRMメンテナンス一覧取得クエリ',
  });

export const CreateCrmMaintenanceBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'タイトルは必須です。')
      .max(255, 'タイトルは255文字以内で入力してください。'),
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
    note: z.string().max(1000, '備考は1000文字以内で入力してください。').optional(),
    allowedUserIds: z
      .array(z.string())
      .optional()
      .openapi({ description: '許可ユーザーのスタッフIDリスト' }),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: '終了日時は開始日時より後の日時を入力してください。',
    path: ['endsAt'],
  })
  .openapi({
    title: 'CreateCrmMaintenanceBody',
    description: 'CRMメンテナンス作成リクエスト',
  });

export const UpdateCrmMaintenanceBodySchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    startsAt: z.string().min(1).optional(),
    endsAt: z.string().min(1).optional(),
    message: z.string().min(1).max(1000).optional(),
    note: z.string().max(1000).nullable().optional(),
    allowedUserIds: z
      .array(z.string())
      .optional()
      .openapi({ description: '許可ユーザーのスタッフIDリスト (存在すれば全置換)' }),
  })
  .openapi({
    title: 'UpdateCrmMaintenanceBody',
    description: 'CRMメンテナンス更新リクエスト (指定項目のみ更新)',
  });

// -- Response schemas --

export const CrmMaintenanceAllowedUserResponseSchema = z
  .object({
    staffId: z.string().openapi({ example: 'STF-001', description: 'スタッフID' }),
    name: z.string().openapi({ example: '田中 太郎', description: '氏名' }),
    role: StaffRoleSchema.openapi({ description: 'ロール (スタッフマスタ由来)' }),
  })
  .openapi({
    title: 'CrmMaintenanceAllowedUser',
    description: 'CRMメンテナンス許可ユーザー',
  });

export const CrmMaintenanceItemResponseSchema = z
  .object({
    id: CrmMaintenanceSchema.shape.id,
    title: CrmMaintenanceSchema.shape.title,
    startsAt: CrmMaintenanceSchema.shape.starts_at,
    endsAt: CrmMaintenanceSchema.shape.ends_at,
    status: CrmMaintenanceStatusSchema.openapi({ description: '算出されたステータス' }),
    allowedUserCount: z.number().int().openapi({ description: '許可ユーザー数' }),
    createdAt: CrmMaintenanceSchema.shape.created_at,
    // 事前通知の送信済みフラグ (FR-007, mock-ahead)。実バックエンドが返さない場合に備え optional。
    notified: z
      .boolean()
      .optional()
      .openapi({ description: '事前通知済みか (true=済 / false=未)' }),
  })
  .openapi({
    title: 'CrmMaintenanceItemResponse',
    description: 'CRMメンテナンス一覧アイテム',
  });

export const CrmMaintenanceDetailResponseSchema = z
  .object({
    id: CrmMaintenanceSchema.shape.id,
    title: CrmMaintenanceSchema.shape.title,
    startsAt: CrmMaintenanceSchema.shape.starts_at,
    endsAt: CrmMaintenanceSchema.shape.ends_at,
    message: CrmMaintenanceSchema.shape.message,
    note: CrmMaintenanceSchema.shape.note,
    status: CrmMaintenanceStatusSchema.openapi({ description: '算出されたステータス' }),
    allowedUsers: z.array(CrmMaintenanceAllowedUserResponseSchema),
    createdBy: CrmMaintenanceSchema.shape.created_by,
    updatedBy: CrmMaintenanceSchema.shape.updated_by,
    createdAt: CrmMaintenanceSchema.shape.created_at,
    updatedAt: CrmMaintenanceSchema.shape.updated_at,
    // 事前通知の送信済みフラグ (FR-007, mock-ahead)。実バックエンドが返さない場合に備え optional。
    notified: z
      .boolean()
      .optional()
      .openapi({ description: '事前通知済みか (true=済 / false=未)' }),
  })
  .openapi({
    title: 'CrmMaintenanceDetailResponse',
    description: 'CRMメンテナンス詳細情報',
  });

export const GetCrmMaintenancesResponseSchema = z
  .object({
    items: z.array(CrmMaintenanceItemResponseSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      totalItems: z.number(),
      totalPages: z.number(),
      totalAllItems: z.number().openapi({
        example: 50,
        description: 'フィルター適用前の総件数',
      }),
    }),
  })
  .openapi({
    title: 'GetCrmMaintenancesResponse',
    description: 'CRMメンテナンス一覧レスポンス',
  });

export const CreateCrmMaintenanceResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'CRMメンテナンスを登録しました' }),
    crmMaintenance: CrmMaintenanceDetailResponseSchema,
  })
  .openapi({
    title: 'CreateCrmMaintenanceResponse',
    description: 'CRMメンテナンス作成レスポンス',
  });

export const UpdateCrmMaintenanceResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'CRMメンテナンスの変更を保存しました' }),
    crmMaintenance: CrmMaintenanceDetailResponseSchema,
  })
  .openapi({
    title: 'UpdateCrmMaintenanceResponse',
    description: 'CRMメンテナンス更新レスポンス',
  });

export const DeleteCrmMaintenanceResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'CRMメンテナンス情報を削除しました' }),
    id: z.string().openapi({ example: 'M-001' }),
  })
  .openapi({
    title: 'DeleteCrmMaintenanceResponse',
    description: 'CRMメンテナンス削除レスポンス',
  });

// 事前通知送信 (FR-007) — mock: 通知済みフラグを立てるだけの疑似送信。
export const SendCrmMaintenanceNotificationResponseSchema = z
  .object({
    message: z.string().openapi({ example: '通知を送信しました' }),
    notified: z.boolean().openapi({ example: true, description: '送信後の通知済みフラグ' }),
  })
  .openapi({
    title: 'SendCrmMaintenanceNotificationResponse',
    description: 'CRMメンテナンス事前通知送信レスポンス',
  });

// -- Type exports --

export type CrmMaintenanceStatus = z.infer<typeof CrmMaintenanceStatusSchema>;
export type CrmMaintenanceSort = z.infer<typeof CrmMaintenanceSortSchema>;
export type CrmMaintenance = z.infer<typeof CrmMaintenanceSchema>;
export type GetCrmMaintenancesQuery = z.infer<typeof GetCrmMaintenancesQuerySchema>;
export type CreateCrmMaintenanceBody = z.infer<typeof CreateCrmMaintenanceBodySchema>;
export type UpdateCrmMaintenanceBody = z.infer<typeof UpdateCrmMaintenanceBodySchema>;
export type CrmMaintenanceAllowedUserResponse = z.infer<
  typeof CrmMaintenanceAllowedUserResponseSchema
>;
export type CrmMaintenanceItemResponse = z.infer<typeof CrmMaintenanceItemResponseSchema>;
export type CrmMaintenanceDetailResponse = z.infer<typeof CrmMaintenanceDetailResponseSchema>;
