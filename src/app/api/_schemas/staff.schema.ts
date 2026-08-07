import { StaffPermissionRecordSchema } from '@/app/api/_schemas/position.schema';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// ─── Enum Schemas ────────────────────────────────────────────────────────────

/**
 * Staff Role Schema - 編集権限
 */
export const StaffRoleSchema = z
  .enum(['system', 'headquarter', 'manager', 'staff', 'trainer', 'observer'])
  .openapi({
    title: 'StaffRole',
    description:
      'Staff permission role: system=非表示, headquarter=本部, manager=マネージャー, staff=スタッフ, trainer=トレーナー, observer=閲覧のみ',
  });

/**
 * Staff Status Schema - ステータス
 */
export const StaffStatusSchema = z.enum(['active', 'inactive']).openapi({
  title: 'StaffStatus',
  description: 'Staff account status: active=有効, inactive=無効',
});

/**
 * Staff Brand Schema - ブランド
 */
export const StaffBrandSchema = z
  .enum(['all', 'joyfit', 'fit365', 'joyfit24', 'joyfit_yoga', 'joyfit_plus'])
  .openapi({
    title: 'StaffBrand',
    description: 'Staff assigned brand',
  });

/**
 * Staff Gender Schema - 性別
 */
export const StaffGenderSchema = z.enum(['male', 'female', 'other']).openapi({
  title: 'StaffGender',
  description: 'Gender: male=男性, female=女性, other=その他',
});

/**
 * Staff Login Method Schema - ログイン元
 */
export const StaffLoginMethodSchema = z.enum(['email', 'social']).openapi({
  title: 'StaffLoginMethod',
  description: 'Login method: email=メール, social=ソーシャル',
});

/**
 * Editable Scope Target Schema - 対象 (全店舗 or 特定店舗)
 */
export const StaffScopeTargetSchema = z.enum(['all_stores', 'specific_store']).openapi({
  title: 'StaffScopeTarget',
  description: 'Scope target: all_stores=全店舗, specific_store=特定店舗',
});

// ─── Sub Schemas (Staff Detail) ──────────────────────────────────────────────

/**
 * Staff Personal Info Schema - 個人情報
 */
export const StaffPersonalInfoSchema = z
  .object({
    last_name: z.string().min(1).openapi({
      example: '田中',
      description: '名前（姓）',
    }),
    first_name: z.string().min(1).openapi({
      example: '太郎',
      description: '名前（名）',
    }),
    last_name_kana: z.string().optional().openapi({
      example: 'タナカ',
      description: 'カタカナ（姓）',
    }),
    first_name_kana: z.string().optional().openapi({
      example: 'タロウ',
      description: 'カタカナ（名）',
    }),
    gender: StaffGenderSchema.optional().openapi({
      example: 'male',
      description: '性別',
    }),
    birthday: z.string().optional().openapi({
      example: '1985-04-15',
      description: '生年月日 (ISO date)',
    }),
    phone: z.string().optional().openapi({
      example: '090-1234-5678',
      description: '携帯電話番号',
    }),
    email: z.string().email().openapi({
      example: 'tanaka@joyfit.co.jp',
      description: 'メールアドレス',
    }),
    postal_code: z.string().optional().openapi({
      example: '160-0022',
      description: '郵便番号',
    }),
    prefecture: z.string().optional().openapi({
      example: '東京都',
      description: '都道府県',
    }),
    city: z.string().optional().openapi({
      example: '新宿区新宿',
      description: '市区町村',
    }),
    address: z.string().optional().openapi({
      example: '3-1-1',
      description: '番地',
    }),
    building: z.string().optional().openapi({
      example: '新宿ビル 5F',
      description: '建物名',
    }),
  })
  .openapi({
    title: 'StaffPersonalInfo',
    description: 'Staff personal information (個人情報)',
  });

/**
 * Staff Login Settings Schema - ログイン設定
 */
export const StaffLoginSettingsSchema = z
  .object({
    login_method: StaffLoginMethodSchema.openapi({
      example: 'email',
      description: 'ログイン元',
    }),
    social_id: z.string().optional().openapi({
      example: '',
      description: 'ソーシャルID',
    }),
  })
  .openapi({
    title: 'StaffLoginSettings',
    description: 'Staff login settings (ログイン設定)',
  });

/**
 * Staff Additional Permissions Schema - 追加権限
 */
export const StaffAdditionalPermissionsSchema = z
  .object({
    billing_correction: z.boolean().openapi({
      example: true,
      description: '確定請求訂正',
    }),
    refund_request: z.boolean().openapi({
      example: true,
      description: '返金申請',
    }),
    transfer_request: z.boolean().openapi({
      example: false,
      description: '移籍申請・否認',
    }),
  })
  .openapi({
    title: 'StaffAdditionalPermissions',
    description: 'Staff additional permissions (追加権限)',
  });

/**
 * Staff Permission Settings Schema - 権限設定
 */
export const StaffPermissionSettingsSchema = z
  .object({
    role: StaffRoleSchema.openapi({
      example: 'headquarter',
      description: '編集権限',
    }),
    additional_permissions: StaffAdditionalPermissionsSchema.openapi({
      description: '追加権限',
    }),
  })
  .openapi({
    title: 'StaffPermissionSettings',
    description: 'Staff permission settings (権限設定)',
  });

/**
 * Staff Editable Scope Item Schema - 編集可能情報 (row)
 */
/**
 * Staff ↔ store / FC linkage (店舗直接 vs FC企業) — mutually exclusive patterns
 */
export const StaffLinkageTypeSchema = z.enum(['direct_store', 'fc_company']).openapi({
  title: 'StaffLinkageType',
  description:
    'direct_store=店舗直接紐づき (Pattern A), fc_company=FC企業紐づき (Pattern B); only one applies',
});

export const StaffLinkageSchema = z
  .object({
    type: StaffLinkageTypeSchema.openapi({ description: '紐づけ種別' }),
    store_id: z.string().optional().openapi({
      example: 'store-001',
      description: 'Set when type=direct_store',
    }),
    store_name: z.string().optional().openapi({
      description: 'Denormalized store name for display',
    }),
    fc_company_id: z.string().optional().openapi({
      example: 'fc-001',
      description: 'Set when type=fc_company',
    }),
    fc_company_name: z.string().optional().openapi({
      description: 'Denormalized FC company name',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'direct_store') {
      if (!data.store_id) {
        ctx.addIssue({
          code: 'custom',
          message: 'store_id is required when linkage type is direct_store',
        });
      }
      if (data.fc_company_id != null && data.fc_company_id !== '') {
        ctx.addIssue({
          code: 'custom',
          message: 'fc_company_id must not be set when linkage type is direct_store',
        });
      }
    }
    if (data.type === 'fc_company') {
      if (!data.fc_company_id) {
        ctx.addIssue({
          code: 'custom',
          message: 'fc_company_id is required when linkage type is fc_company',
        });
      }
      if (data.store_id != null && data.store_id !== '') {
        ctx.addIssue({
          code: 'custom',
          message: 'store_id must not be set when linkage type is fc_company',
        });
      }
    }
  })
  .openapi({
    title: 'StaffLinkage',
    description: 'Staff store / FC linkage (exclusive patterns)',
  });

export const StaffEditableScopeSchema = z
  .object({
    brand: StaffBrandSchema.openapi({
      example: 'all',
      description: 'ブランド',
    }),
    target: StaffScopeTargetSchema.openapi({
      example: 'all_stores',
      description: '対象',
    }),
    store_id: z.string().optional().openapi({
      example: 'store-001',
      description: 'Specific store ID (when target = specific_store)',
    }),
    store_name: z.string().optional().openapi({
      example: 'JOYFIT渋谷店',
      description: 'Specific store name (when target = specific_store)',
    }),
    start_date: z.string().openapi({
      example: '2024-04-01',
      description: '有効開始日 (ISO date)',
    }),
    end_date: z.string().optional().openapi({
      example: '',
      description: '有効終了日 (ISO date, empty if indefinite)',
    }),
  })
  .openapi({
    title: 'StaffEditableScope',
    description: 'Staff editable scope row (編集可能情報)',
  });

// ─── List Item Schema ────────────────────────────────────────────────────────

/**
 * Staff List Item Schema (for table list view)
 */
export const StaffListItemSchema = z
  .object({
    id: z.string().openapi({
      example: '1',
      description: 'Staff internal ID',
    }),
    staff_id: z.string().openapi({
      example: 'STF-001',
      description: 'Staff display ID',
    }),
    name: z.string().openapi({
      example: '田中 太郎',
      description: 'Staff full name (姓 + 名)',
    }),
    email: z.string().email().openapi({
      example: 'tanaka@joyfit.co.jp',
      description: 'Staff email address',
    }),
    /** FK → positions.id (職位マスター) */
    position_id: z.number().int().openapi({
      example: 6,
      description: 'Position master id',
    }),
    position_name: z.string().openapi({
      example: '正社員スタッフ',
      description: 'Denormalized position name',
    }),
    role: StaffRoleSchema.openapi({
      example: 'headquarter',
      description: 'Staff role/permission (編集権限グループ)',
    }),
    brand: StaffBrandSchema.openapi({
      example: 'all',
      description: 'Assigned brand',
    }),
    /** ブランドマスタの display_name（Y-07 と整合 / その他コードは固定ラベル） */
    brand_display_name: z.string().openapi({
      example: 'JOYFIT',
      description: 'Brand display name for UI',
    }),
    linkage_type: StaffLinkageTypeSchema.openapi({
      description: '店舗直接 vs FC企業',
    }),
    linked_store_id: z.string().optional().openapi({
      description: 'Present when linkage_type=direct_store',
    }),
    linked_fc_company_id: z.string().optional().openapi({
      description: 'Present when linkage_type=fc_company',
    }),
    status: StaffStatusSchema.openapi({
      example: 'active',
      description: 'Account status',
    }),
    last_login: z.string().openapi({
      example: '2026-03-25 10:00',
      description: 'Last login datetime',
    }),
  })
  .openapi({
    title: 'StaffListItem',
    description: 'Staff list item for table view',
  });

// ─── Detail Schema ───────────────────────────────────────────────────────────

/**
 * Staff Detail Schema (full detail for edit screen - スタッフ編集)
 */
export const StaffDetailSchema = z
  .object({
    id: z.string().openapi({
      example: '1',
      description: 'Staff internal ID',
    }),
    staff_id: z.string().openapi({
      example: 'STF-001',
      description: 'Staff display ID',
    }),
    position_id: z.number().int().openapi({
      example: 6,
      description: 'FK → positions.id',
    }),
    role: StaffRoleSchema.openapi({
      example: 'staff',
      description: '編集権限',
    }),
    brand: StaffBrandSchema.openapi({
      example: 'joyfit',
      description: '主担当ブランド（一覧の brand と一致）',
    }),
    brand_display_name: z.string().openapi({
      example: 'JOYFIT',
      description: 'ブランド表示名（マスタの display_name）',
    }),
    status: StaffStatusSchema.openapi({
      example: 'active',
      description: 'Account status',
    }),
    personal_info: StaffPersonalInfoSchema.openapi({
      description: '個人情報',
    }),
    login_settings: StaffLoginSettingsSchema.openapi({
      description: 'ログイン設定',
    }),
    permission_settings: StaffPermissionSettingsSchema.openapi({
      description: '権限設定',
    }),
    staff_linkage: StaffLinkageSchema.openapi({
      description: '店舗直接紐づき or FC企業紐づき (mutually exclusive)',
    }),
    staff_permissions: z.array(StaffPermissionRecordSchema).openapi({
      description: 'Detailed permission rows (staff_permissions table)',
    }),
    editable_scopes: z.array(StaffEditableScopeSchema).openapi({
      description: '編集可能情報',
    }),
    last_login: z.string().openapi({
      example: '2026-03-25 10:00',
      description: 'Last login datetime',
    }),
    created_at: z.string().openapi({
      example: '2024-01-15T10:00:00Z',
      description: 'Account creation timestamp',
    }),
    updated_at: z.string().openapi({
      example: '2026-03-20T14:30:00Z',
      description: 'Last update timestamp',
    }),
  })
  .openapi({
    title: 'StaffDetail',
    description: 'Full staff detail for edit screen (スタッフ編集)',
  });

// ─── Query / Response Schemas ────────────────────────────────────────────────

/**
 * Get Staffs Query Schema
 */
export const GetStaffsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).openapi({
      example: 1,
      description: 'Page number',
    }),
    limit: z.coerce.number().int().min(1).max(100).default(30).openapi({
      example: 30,
      description: 'Items per page',
    }),
    search: z.string().optional().openapi({
      example: '田中',
      description: 'Search by name or email',
    }),
    role: StaffRoleSchema.optional().openapi({
      description: 'Filter by role',
    }),
    brand: StaffBrandSchema.optional().openapi({
      description: 'Filter by brand',
    }),
    status: StaffStatusSchema.optional().openapi({
      description: 'Filter by status',
    }),
    position_id: z.coerce.number().int().positive().optional().openapi({
      example: 6,
      description: 'Filter by position master id (職位)',
    }),
    sort_by: z
      .enum(['staff_id', 'name', 'role', 'position_name', 'status', 'last_login'])
      .default('staff_id')
      .openapi({
        example: 'staff_id',
        description: 'Sort field',
      }),
    sort_order: z.enum(['asc', 'desc']).default('asc').openapi({
      example: 'asc',
      description: 'Sort order',
    }),
  })
  .openapi({
    title: 'GetStaffsQuery',
    description: 'Query parameters for staff list',
  });

/**
 * Get Staffs Response Schema (list)
 */
export const GetStaffsResponseSchema = z
  .object({
    staffs: z.array(StaffListItemSchema).openapi({
      description: 'List of staff members',
    }),
    pagination: z
      .object({
        page: z.number().openapi({ example: 1 }),
        limit: z.number().openapi({ example: 30 }),
        total: z.number().openapi({ example: 200 }),
        total_pages: z.number().openapi({ example: 7 }),
      })
      .openapi({ title: 'StaffPagination' }),
  })
  .openapi({
    title: 'GetStaffsResponse',
    description: 'Staff list response with pagination',
  });

/**
 * Get Staff Detail Response Schema
 */
export const GetStaffDetailResponseSchema = z
  .object({
    staff: StaffDetailSchema.openapi({
      description: 'Full staff detail',
    }),
  })
  .openapi({
    title: 'GetStaffDetailResponse',
    description: 'Response for getting staff detail',
  });

/**
 * Update Staff Request Schema (used for PUT /crm/staffs/{id})
 */
export const UpdateStaffRequestSchema = z
  .object({
    personal_info: StaffPersonalInfoSchema.optional().openapi({
      description: '個人情報 (partial update)',
    }),
    login_settings: StaffLoginSettingsSchema.optional().openapi({
      description: 'ログイン設定 (partial update)',
    }),
    position_id: z.number().int().optional().openapi({
      description: '職位マスター (positions.id)',
    }),
    role: StaffRoleSchema.optional().openapi({
      description: '編集権限',
    }),
    permission_settings: StaffPermissionSettingsSchema.optional().openapi({
      description: '権限設定 (partial update)',
    }),
    brand: StaffBrandSchema.optional().openapi({
      description: '主担当ブランド',
    }),
    staff_linkage: StaffLinkageSchema.optional().openapi({
      description: '店舗/FC 紐づけ (partial merge with existing)',
    }),
    staff_permissions: z.array(StaffPermissionRecordSchema).optional().openapi({
      description: 'Replace granular permission rows',
    }),
    editable_scopes: z.array(StaffEditableScopeSchema).optional().openapi({
      description: '編集可能情報 (full replacement)',
    }),
    status: StaffStatusSchema.optional().openapi({
      description: 'Account status',
    }),
  })
  .openapi({
    title: 'UpdateStaffRequest',
    description: 'Request body to update staff (スタッフ編集)',
  });

/**
 * Update Staff Response Schema
 */
export const UpdateStaffResponseSchema = z
  .object({
    message: z.string().openapi({
      example: 'スタッフ情報を更新しました',
      description: 'Success message',
    }),
    staff: StaffDetailSchema.openapi({
      description: 'Updated staff detail',
    }),
  })
  .openapi({
    title: 'UpdateStaffResponse',
    description: 'Response after updating staff',
  });

/**
 * Invite Staff Request Schema
 */
export const InviteStaffItemSchema = z.object({
  email: z.string().email().openapi({
    example: 'staff@joyfit.co.jp',
    description: 'Email address to invite',
  }),
  role: StaffRoleSchema.openapi({
    example: 'staff',
    description: 'Staff role for this email',
  }),
  brand: StaffBrandSchema.optional().openapi({
    example: 'joyfit',
    description: 'Brand to assign for this email (optional)',
  }),
});

export const InviteStaffRequestSchema = z
  .object({
    invitees: z
      .array(InviteStaffItemSchema)
      .min(1)
      .openapi({
        example: [{ email: 'staff@joyfit.co.jp', role: 'staff', brand: 'joyfit' }],
        description: 'Invite list with per-email role and brand',
      }),
  })
  .openapi({
    title: 'InviteStaffRequest',
    description: 'Request body to invite staff',
  });

/**
 * Invite Staff Response Schema
 */
export const InviteStaffResponseSchema = z
  .object({
    message: z.string().openapi({
      example: '招待メールを送信しました',
      description: 'Success message',
    }),
    invited_count: z.number().openapi({
      example: 2,
      description: 'Number of invitations sent',
    }),
    staffs: z.array(StaffListItemSchema).openapi({
      description: 'Newly created staff entries',
    }),
  })
  .openapi({
    title: 'InviteStaffResponse',
    description: 'Response after inviting staff',
  });

/**
 * Delete Staff Response Schema
 */
export const DeleteStaffResponseSchema = z
  .object({
    message: z.string().openapi({
      example: 'スタッフを削除しました',
      description: 'Success message',
    }),
  })
  .openapi({
    title: 'DeleteStaffResponse',
    description: 'Response after deleting a staff member',
  });

/**
 * Delete Staff Request Schema
 */
export const DeleteStaffRequestSchema = z
  .object({
    delete_reason: z
      .string()
      .min(1, { message: '削除理由は必須です' })
      .max(255, { message: '削除理由は255文字以内で入力してください' })
      .openapi({
        example: '退職に伴うアカウント削除',
        description: 'Reason for deleting the staff account',
      }),
  })
  .openapi({
    title: 'DeleteStaffRequest',
    description: 'Request body to delete a staff member',
  });

// ─── Export Types ─────────────────────────────────────────────────────────────

export type StaffListItem = z.infer<typeof StaffListItemSchema>;
export type StaffDetail = z.infer<typeof StaffDetailSchema>;
export type StaffPersonalInfo = z.infer<typeof StaffPersonalInfoSchema>;
export type StaffLoginSettings = z.infer<typeof StaffLoginSettingsSchema>;
export type StaffAdditionalPermissions = z.infer<typeof StaffAdditionalPermissionsSchema>;
export type StaffPermissionSettings = z.infer<typeof StaffPermissionSettingsSchema>;
export type StaffEditableScope = z.infer<typeof StaffEditableScopeSchema>;
export type StaffLinkage = z.infer<typeof StaffLinkageSchema>;
export type StaffLinkageType = z.infer<typeof StaffLinkageTypeSchema>;
export type GetStaffsQuery = z.infer<typeof GetStaffsQuerySchema>;
export type GetStaffsResponse = z.infer<typeof GetStaffsResponseSchema>;
export type GetStaffDetailResponse = z.infer<typeof GetStaffDetailResponseSchema>;
export type UpdateStaffRequest = z.infer<typeof UpdateStaffRequestSchema>;
export type UpdateStaffResponse = z.infer<typeof UpdateStaffResponseSchema>;
export type InviteStaffRequest = z.infer<typeof InviteStaffRequestSchema>;
export type InviteStaffResponse = z.infer<typeof InviteStaffResponseSchema>;
export type DeleteStaffRequest = z.infer<typeof DeleteStaffRequestSchema>;
export type DeleteStaffResponse = z.infer<typeof DeleteStaffResponseSchema>;

export { ErrorResponseSchema } from './auth.schema';
