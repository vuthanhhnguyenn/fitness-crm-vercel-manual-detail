import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

/**
 * High-level role category on the position master (職位マスター)
 */
export const PositionRoleCategorySchema = z
  .enum(['headquarter', 'manager', 'staff', 'trainer', 'observer'])
  .openapi({
    title: 'PositionRoleCategory',
    description:
      'Position role: headquarter=本部, manager=マネージャー系, staff=店舗スタッフ, trainer=トレーナー, observer=閲覧',
  });

// ─── Permission catalog (Phase 1: 36 keys / 10 categories) ──────────────────
// Key naming follows the BE design's positions.can_* columns verbatim.
// BE design v0.3 (QA answers 2026-07-29) grew the catalog to 58 flags / 10
// categories — the `csv_export` category and the Y-02 store-item flags are now
// official, so only `can_edit_gate_stop` (ゲートストップ設定の変更, Y-01 FR-006 v2)
// remains an FE extension with no BE flag (open gap — research R13).
// Phase 1 keeps the prototype's 36 rendered toggles (Clarification Q2 / 2026-07-29):
// the 23 BE flags that no prototype screen exposes join at the Phase 2 cutover.
// Mock-internal — the UI consumes this catalog only through the generated
// client types (src/lib/api) and the permission-catalog endpoint.

export const POSITION_PERMISSION_KEYS = [
  // member 会員管理
  'can_view_member',
  'can_edit_member',
  'can_apply_transfer_suspension',
  'can_force_withdrawal',
  // gate 入退館管理
  'can_view_gate_log',
  'can_edit_gate_setting',
  // application 入会申請管理
  'can_view_application',
  'can_approve_application',
  'can_create_proxy_application',
  // lesson レッスン管理
  'can_view_lesson_reservation',
  'can_manage_lesson_reservation',
  'can_manage_lesson_schedule',
  // facility 施設設備管理
  'can_view_facility',
  'can_edit_facility',
  'can_manage_locker_contract',
  // sales 売上管理
  'can_view_sales',
  'can_edit_sales',
  'can_edit_after_billing_confirmed',
  'can_execute_refund',
  // promotion 商材施策設定
  'can_view_promotion',
  'can_manage_promotion',
  'can_create_survey',
  // content コンテンツ
  'can_view_content',
  'can_manage_content',
  'can_manage_notification',
  // system_setting システム設定
  'can_view_staff',
  'can_manage_staff',
  'can_manage_position',
  'can_manage_store_setting',
  'can_edit_store_photo',
  'can_edit_store_business_hours',
  'can_edit_store_basic_info',
  'can_edit_gate_stop',
  // csv CSV出力管理 (FR-S001 independent category)
  'can_export_member_csv',
  'can_export_gate_log_csv',
  'can_export_survey_csv',
] as const;

export type PositionPermissionKey = (typeof POSITION_PERMISSION_KEYS)[number];

export const PositionPermissionKeySchema = z.enum(POSITION_PERMISSION_KEYS).openapi({
  title: 'PositionPermissionKey',
  description: '職位権限フラグのキー（BE設計の positions.can_* カラム名に準拠）',
});

const permissionMapShape = Object.fromEntries(
  POSITION_PERMISSION_KEYS.map((key) => [key, z.boolean()]),
) as Record<PositionPermissionKey, z.ZodBoolean>;

/**
 * Full flat permission map — every one of the 36 keys is present on read.
 */
export const PermissionMapSchema = z.object(permissionMapShape).openapi({
  title: 'PositionPermissionMap',
  description: '職位の権限フラグ（36キーのフラットなbooleanマップ）',
});

/**
 * Partial map for create/update bodies — omitted keys default to false on
 * create and stay unchanged on update. `.strict()` rejects unknown keys (400).
 */
export const PermissionMapPartialSchema = z.object(permissionMapShape).partial().strict().openapi({
  title: 'PositionPermissionMapPartial',
  description: '職位の権限フラグ（部分更新用・未知キーは400）',
});

export type PositionPermissionMap = z.infer<typeof PermissionMapSchema>;

export const PositionCategoryKeySchema = z
  .enum([
    'member',
    'gate',
    'application',
    'lesson',
    'facility',
    'sales',
    'promotion',
    'content',
    'system_setting',
    'csv_export',
  ])
  .openapi({
    title: 'PositionPermissionCategoryKey',
    description:
      '権限カテゴリキー（BE設計v0.3の10カテゴリ・固定順序 / csv_export は FR-S001 の独立カテゴリ）',
  });

export type PositionCategoryKey = z.infer<typeof PositionCategoryKeySchema>;

/**
 * Mock-internal grouping metadata used by validation and the permission
 * preview route (labels are server-resolved per the BE design).
 */
export const POSITION_PERMISSION_CATEGORY_DEFS: ReadonlyArray<{
  categoryKey: PositionCategoryKey;
  categoryLabel: string;
  permissions: ReadonlyArray<{ key: PositionPermissionKey; label: string }>;
}> = [
  {
    categoryKey: 'member',
    categoryLabel: '会員管理',
    permissions: [
      { key: 'can_view_member', label: '会員情報の閲覧' },
      { key: 'can_edit_member', label: '会員情報の編集' },
      { key: 'can_apply_transfer_suspension', label: '移籍・休会の申請' },
      { key: 'can_force_withdrawal', label: '強制退会の実行' },
    ],
  },
  {
    categoryKey: 'gate',
    categoryLabel: '入退館管理',
    permissions: [
      { key: 'can_view_gate_log', label: '入退館履歴の閲覧' },
      { key: 'can_edit_gate_setting', label: '入退館設定の変更' },
    ],
  },
  {
    categoryKey: 'application',
    categoryLabel: '入会申請管理',
    permissions: [
      { key: 'can_view_application', label: '入会申請の閲覧' },
      { key: 'can_approve_application', label: '入会申請の承認・却下' },
      { key: 'can_create_proxy_application', label: '代理申請の作成' },
    ],
  },
  {
    categoryKey: 'lesson',
    categoryLabel: 'レッスン管理',
    permissions: [
      { key: 'can_view_lesson_reservation', label: 'レッスン予約の閲覧' },
      { key: 'can_manage_lesson_reservation', label: 'レッスン予約の作成・変更' },
      { key: 'can_manage_lesson_schedule', label: 'レッスンスケジュールの管理' },
    ],
  },
  {
    categoryKey: 'facility',
    categoryLabel: '施設設備管理',
    permissions: [
      { key: 'can_view_facility', label: '設備情報の閲覧' },
      { key: 'can_edit_facility', label: '設備情報の編集' },
      { key: 'can_manage_locker_contract', label: 'ロッカー契約の管理' },
    ],
  },
  {
    categoryKey: 'sales',
    categoryLabel: '売上管理',
    permissions: [
      { key: 'can_view_sales', label: '売上データの閲覧' },
      { key: 'can_edit_sales', label: '売上の登録・編集' },
      { key: 'can_edit_after_billing_confirmed', label: '請求確定後の変更' },
      { key: 'can_execute_refund', label: '返金処理の実行' },
    ],
  },
  {
    categoryKey: 'promotion',
    categoryLabel: '商材施策設定',
    permissions: [
      { key: 'can_view_promotion', label: '商材・キャンペーンの閲覧' },
      { key: 'can_manage_promotion', label: '商材・キャンペーンの作成・編集' },
      { key: 'can_create_survey', label: 'アンケートの作成' },
    ],
  },
  {
    categoryKey: 'content',
    categoryLabel: 'コンテンツ',
    permissions: [
      { key: 'can_view_content', label: 'お知らせ・ブログの閲覧' },
      { key: 'can_manage_content', label: 'お知らせ・ブログの作成・編集' },
      { key: 'can_manage_notification', label: '通知設定の管理' },
    ],
  },
  {
    categoryKey: 'system_setting',
    categoryLabel: 'システム設定',
    permissions: [
      { key: 'can_view_staff', label: 'スタッフ管理の閲覧' },
      { key: 'can_manage_staff', label: 'スタッフアカウントの作成・編集' },
      { key: 'can_manage_position', label: '職位マスターの管理' },
      { key: 'can_manage_store_setting', label: '店舗設定の変更' },
      { key: 'can_edit_store_photo', label: '店舗写真・フロアマップの編集' },
      { key: 'can_edit_store_business_hours', label: '営業時間・休業日の編集' },
      { key: 'can_edit_store_basic_info', label: '店舗基本情報の編集' },
      { key: 'can_edit_gate_stop', label: 'ゲートストップ設定の変更' },
    ],
  },
  {
    categoryKey: 'csv_export',
    categoryLabel: 'CSV出力管理',
    permissions: [
      { key: 'can_export_member_csv', label: '会員CSV出力' },
      { key: 'can_export_gate_log_csv', label: '入退館CSV出力' },
      { key: 'can_export_survey_csv', label: 'アンケートCSV出力' },
    ],
  },
];

/** positions.description の最大長（BE設計 v0.3: maxLength 500） */
export const POSITION_DESCRIPTION_MAX_LENGTH = 500;

// ─── Row / list / detail ─────────────────────────────────────────────────────

/**
 * Position master row (positions table)
 */
export const PositionSchema = z
  .object({
    id: z.number().int().openapi({ example: 1, description: 'Position PK' }),
    role: PositionRoleCategorySchema.openapi({ description: 'ロール（作成後は変更不可）' }),
    position_name: z.string().openapi({ example: '本部管理者', description: '職位名' }),
    description: z
      .string()
      .nullable()
      .openapi({ example: '全店舗・全機能にアクセスできる最上位の職位', description: '説明' }),
    permissions: PermissionMapSchema,
    is_system_managed: z
      .boolean()
      .openapi({ description: 'true=シード保護（編集・削除不可）。API経由では設定不可' }),
    created_at: z.string().openapi({ example: '2026-06-05T09:00:00Z' }),
    updated_at: z.string().openapi({ example: '2026-06-05T09:00:00Z' }),
  })
  .openapi({
    title: 'Position',
    description: 'Normalized staff position / 職位マスター',
  });

export const PositionListItemSchema = z
  .object({
    id: z.number().int().openapi({ example: 6 }),
    position_name: z.string().openapi({ example: '正社員スタッフ' }),
    description: z.string().nullable().openapi({ description: '説明（一覧のサブ行）' }),
    role: PositionRoleCategorySchema,
    is_system_managed: z.boolean(),
    staff_count: z
      .number()
      .int()
      .openapi({ description: 'この職位が割り当てられているスタッフ数' }),
    grantedCategoryCount: z.number().int().openapi({
      description: '1つ以上の権限がONのカテゴリ数（アクセス権限数列の分子・カテゴリ軸）',
    }),
    totalCategoryCount: z.number().int().openapi({
      example: 10,
      description: 'カテゴリ総数（アクセス権限数列の分母。権限フラグ数ではない）',
    }),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi({
    title: 'PositionListItem',
    description: '職位マスター一覧行',
  });

export const PositionPaginationSchema = z
  .object({
    page: z.number().int(),
    limit: z.number().int(),
    totalItems: z.number().int().openapi({ description: '絞り込み後の総件数' }),
    totalPages: z.number().int(),
    totalAllItems: z.number().int().optional().openapi({
      description:
        '絞り込み前の基準件数（「全 N 件中」表示用）。includeTotalAll=true のときのみ返る',
    }),
  })
  .openapi({ title: 'PositionPagination' });

export const GetPositionsQuerySchema = z
  .object({
    search: z.string().max(100).optional().openapi({
      description: '職位名検索（部分一致・100文字以内。BE設計v0.3の maxLength に一致）',
    }),
    permission: PositionPermissionKeySchema.optional().openapi({
      description: '逆引きフィルター: この権限を持つ職位のみ（カタログ外のキーは400）',
    }),
    role: PositionRoleCategorySchema.optional(),
    includeTotalAll: z
      .preprocess((value) => value === 'true' || value === true, z.boolean())
      .optional()
      .default(false)
      .openapi({
        description:
          'trueのとき pagination に totalAllItems（絞り込み前の基準件数）を含める。「全 N 件中 M 件」バナーを出す画面のみ指定',
      }),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    sort: z.enum(['role', 'name', 'createdAt']).default('role'),
    order: z.enum(['asc', 'desc']).default('asc'),
  })
  .openapi({
    title: 'GetPositionsQuery',
    description: '職位マスター一覧取得クエリ',
  });

export const GetPositionsResponseSchema = z
  .object({
    items: z.array(PositionListItemSchema),
    pagination: PositionPaginationSchema,
  })
  .openapi({
    title: 'GetPositionsResponse',
    description: '職位マスター一覧レスポンス',
  });

export const PositionDetailSchema = z
  .object({
    id: z.number().int(),
    position_name: z.string(),
    description: z.string().nullable(),
    role: PositionRoleCategorySchema,
    is_system_managed: z.boolean(),
    staff_count: z.number().int(),
    permissions: PermissionMapSchema,
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi({
    title: 'PositionDetail',
    description: '職位マスター詳細（全36権限キーを含む）',
  });

// ─── Create / update ─────────────────────────────────────────────────────────

export const CreatePositionBodySchema = z
  .object({
    position_name: z
      .string()
      .trim()
      .min(1, '職位名を入力してください')
      .max(100, '職位名は100文字以内で入力してください')
      .openapi({ description: '職位名（同一ロール内でユニーク）' }),
    role: PositionRoleCategorySchema,
    description: z
      .string()
      .max(POSITION_DESCRIPTION_MAX_LENGTH)
      .nullable()
      .optional()
      .openapi({ description: '説明（BE設計v0.3で正式フィールド化・500文字以内）' }),
    permissions: PermissionMapPartialSchema.optional().openapi({
      description: '省略キーはfalseで作成',
    }),
  })
  .strict()
  .openapi({
    title: 'CreatePositionBody',
    description: '職位マスター作成ボディ（is_system_managedは指定不可）',
  });

export const CreatePositionResponseSchema = z
  .object({
    id: z.number().int(),
    position_name: z.string(),
    role: PositionRoleCategorySchema,
    created_at: z.string(),
  })
  .openapi({ title: 'CreatePositionResponse' });

export const UpdatePositionBodySchema = z
  .object({
    position_name: z
      .string()
      .trim()
      .min(1, '職位名を入力してください')
      .max(100, '職位名は100文字以内で入力してください')
      .optional(),
    description: z.string().max(POSITION_DESCRIPTION_MAX_LENGTH).nullable().optional(),
    permissions: PermissionMapPartialSchema.optional().openapi({
      description: '指定キーのみ更新',
    }),
  })
  .strict()
  .openapi({
    title: 'UpdatePositionBody',
    description: '職位マスター部分更新ボディ（roleは作成後不変のため受け付けない）',
  });

export const UpdatePositionResponseSchema = z
  .object({
    id: z.number().int(),
    position_name: z.string(),
    role: PositionRoleCategorySchema,
    updated_at: z.string(),
  })
  .openapi({ title: 'UpdatePositionResponse' });

// ─── Permission preview (FR-009) ─────────────────────────────────────────────

export const PositionPermissionItemSchema = z
  .object({
    permissionKey: PositionPermissionKeySchema,
    label: z.string().openapi({ example: '会員情報の閲覧' }),
    granted: z.boolean(),
  })
  .openapi({ title: 'PositionPermissionItem' });

export const PositionPermissionCategorySchema = z
  .object({
    categoryKey: PositionCategoryKeySchema,
    categoryLabel: z.string().openapi({ example: '会員管理' }),
    permissions: z.array(PositionPermissionItemSchema),
  })
  .openapi({ title: 'PositionPermissionCategory' });

export const GetPositionPermissionsResponseSchema = z
  .object({
    id: z.number().int(),
    position_name: z.string(),
    role: PositionRoleCategorySchema,
    categories: z
      .array(PositionPermissionCategorySchema)
      .openapi({ description: '固定順序の10カテゴリ' }),
  })
  .openapi({
    title: 'GetPositionPermissionsResponse',
    description: '職位別権限プレビュー（カテゴリ別グルーピング）',
  });

// ─── Permission catalog (BE v0.3 — GET /permissions, no positionId) ─────────

export const PositionPermissionCatalogItemSchema = z
  .object({
    permissionKey: PositionPermissionKeySchema,
    label: z.string().openapi({ example: '会員情報の閲覧' }),
  })
  .openapi({ title: 'PositionPermissionCatalogItem' });

export const PositionPermissionCatalogCategorySchema = z
  .object({
    categoryKey: PositionCategoryKeySchema,
    categoryLabel: z.string().openapi({ example: '会員管理' }),
    permissions: z.array(PositionPermissionCatalogItemSchema),
  })
  .openapi({ title: 'PositionPermissionCatalogCategory' });

export const GetPermissionCatalogResponseSchema = z
  .object({
    totalCategoryCount: z.number().int().openapi({ example: 10, description: 'カテゴリ総数' }),
    totalPermissionCount: z.number().int().openapi({ example: 36, description: '権限キー総数' }),
    categories: z
      .array(PositionPermissionCatalogCategorySchema)
      .openapi({ description: '固定順序のカテゴリ一覧' }),
  })
  .openapi({
    title: 'GetPermissionCatalogResponse',
    description:
      '権限カタログ（職位IDを必要としない定数。職位作成フォームのトグル定義のSoT / BE設計v0.3）',
  });

export type GetPermissionCatalogResponse = z.infer<typeof GetPermissionCatalogResponseSchema>;

/** Builds the catalog response from the mock-internal grouping metadata */
export function buildPermissionCatalog(): GetPermissionCatalogResponse {
  const categories = POSITION_PERMISSION_CATEGORY_DEFS.map((category) => ({
    categoryKey: category.categoryKey,
    categoryLabel: category.categoryLabel,
    permissions: category.permissions.map((permission) => ({
      permissionKey: permission.key,
      label: permission.label,
    })),
  }));
  return {
    totalCategoryCount: categories.length,
    totalPermissionCount: POSITION_PERMISSION_KEYS.length,
    categories,
  };
}

// ─── Staff permission rows (existing, unrelated to the 36-key map) ──────────

/**
 * Granular permission row (staff_permissions table)
 */
export const StaffPermissionRecordSchema = z
  .object({
    id: z.number().int().openapi({ description: 'Permission row PK' }),
    staff_id: z.string().openapi({ example: '1', description: 'Internal staff id (FK staff.id)' }),
    permission_code: z.string().openapi({ example: 'Y-03.view', description: 'Permission code' }),
  })
  .openapi({
    title: 'StaffPermissionRecord',
    description: 'Staff permission detail row',
  });

export type Position = z.infer<typeof PositionSchema>;
export type PositionListItem = z.infer<typeof PositionListItemSchema>;
export type PositionDetail = z.infer<typeof PositionDetailSchema>;
export type GetPositionsQuery = z.infer<typeof GetPositionsQuerySchema>;
export type GetPositionsResponse = z.infer<typeof GetPositionsResponseSchema>;
export type CreatePositionBody = z.infer<typeof CreatePositionBodySchema>;
export type CreatePositionResponse = z.infer<typeof CreatePositionResponseSchema>;
export type UpdatePositionBody = z.infer<typeof UpdatePositionBodySchema>;
export type UpdatePositionResponse = z.infer<typeof UpdatePositionResponseSchema>;
export type GetPositionPermissionsResponse = z.infer<typeof GetPositionPermissionsResponseSchema>;
export type StaffPermissionRecord = z.infer<typeof StaffPermissionRecordSchema>;
export type PositionRoleCategory = z.infer<typeof PositionRoleCategorySchema>;
