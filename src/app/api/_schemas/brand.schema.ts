import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const BRAND_IDENTIFIER_REGEX = /^[a-z0-9_]+$/;
const BRAND_IDENTIFIER_INPUT_REGEX = /^[A-Za-z0-9_]+$/;

export const ManagedBrandCodeSchema = z.string().trim().regex(BRAND_IDENTIFIER_REGEX).openapi({
  title: 'ManagedBrandCode',
  description: 'システム内部で利用するブランドコード',
  example: 'joyfit',
});

export const BrandIdInputSchema = z
  .string()
  .trim()
  .min(1)
  .regex(BRAND_IDENTIFIER_INPUT_REGEX, '英数字とアンダースコアのみ入力できます')
  .openapi({
    title: 'BrandIdInput',
    description: 'ブランドID入力値',
    example: 'joyfit',
  });

export const BrandStatusSchema = z.enum(['active', 'inactive']).openapi({
  title: 'BrandStatus',
  description: 'ブランドまたはサブブランドの有効状態',
  example: 'active',
});

export const BrandPaginationSchema = z
  .object({
    page: z.number().int().min(1).openapi({
      example: 1,
      description: '現在のページ',
    }),
    limit: z.number().int().min(1).openapi({
      example: 25,
      description: '1ページあたりの表示件数',
    }),
    total: z.number().int().min(0).openapi({
      example: 2,
      description: '検索条件適用後の総件数',
    }),
    total_pages: z.number().int().min(1).openapi({
      example: 1,
      description: '総ページ数',
    }),
    all_total: z.number().int().min(0).openapi({
      example: 2,
      description: '検索条件適用前の総件数',
    }),
  })
  .openapi({
    title: 'BrandPagination',
    description: 'ブランド一覧のページネーション情報',
  });

export const BrandListItemSchema = z
  .object({
    brand_id: ManagedBrandCodeSchema.openapi({
      description: 'ブランドID',
      example: 'joyfit',
    }),
    code: ManagedBrandCodeSchema.openapi({
      description: 'ブランドコード',
      example: 'joyfit',
    }),
    display_name: z.string().trim().min(1).openapi({
      example: 'JOYFIT',
      description: 'ブランド名',
    }),
    status: BrandStatusSchema,
  })
  .openapi({
    title: 'BrandListItem',
    description: 'Y-07 ブランド一覧行',
  });

export const BrandDetailSchema = z
  .object({
    brand_id: ManagedBrandCodeSchema.openapi({
      description: 'ブランドID',
      example: 'joyfit',
    }),
    code: ManagedBrandCodeSchema.openapi({
      description: 'ブランドコード',
      example: 'joyfit',
    }),
    display_name: z.string().trim().min(1).openapi({
      example: 'JOYFIT',
      description: 'ブランド名',
    }),
    status: BrandStatusSchema,
    fee_group_count: z.number().int().min(0).openapi({
      example: 4,
      description: '費用タブの件数',
    }),
    change_history_count: z.number().int().min(0).openapi({
      example: 3,
      description: '変更履歴タブの件数',
    }),
    created_at: z.string().openapi({
      example: '2024-04-01T00:00:00.000Z',
      description: '作成日時',
    }),
    updated_at: z.string().openapi({
      example: '2026-03-01T00:00:00.000Z',
      description: '更新日時',
    }),
    created_by: z.string().nullable().optional().openapi({
      example: 'STF-001',
      description: '作成者スタッフID',
    }),
    updated_by: z.string().nullable().optional().openapi({
      example: 'STF-002',
      description: '最終更新者スタッフID',
    }),
  })
  .openapi({
    title: 'BrandDetail',
    description: 'Y-07 ブランド基本情報詳細',
  });

export const BrandScheduledFeeChangeSchema = z
  .object({
    effective_start_date: z.string().openapi({
      example: '2026/09/01',
      description: '予約適用開始日',
    }),
    registered_at: z.string().openapi({
      example: '2026/06/01',
      description: '予約登録日',
    }),
    registered_by: z.string().openapi({
      example: '山田 花子（本部）',
      description: '登録者名',
    }),
    value_including_tax_yen: z.number().int().min(0).openapi({
      example: 12000,
      description: '予約後の定価（税込・円）',
    }),
  })
  .openapi({
    title: 'BrandScheduledFeeChange',
    description: '予約中の費用改定',
  });

export const BrandFeeItemSchema = z
  .object({
    item_code: z.string().trim().min(1).openapi({
      example: 'enrollment-fee',
      description: '費用項目コード',
    }),
    item_name: z.string().trim().min(1).openapi({
      example: '入会金',
      description: '費用項目名',
    }),
    current_value_including_tax_yen: z.number().int().min(0).openapi({
      example: 11000,
      description: '現在の定価（税込・円）',
    }),
    effective_start_date: z.string().openapi({
      example: '2025/04/01',
      description: '現行設定の有効開始日',
    }),
    scheduled_changes: z.array(BrandScheduledFeeChangeSchema).openapi({
      description: '予約中の改定一覧',
    }),
  })
  .openapi({
    title: 'BrandFeeItem',
    description: 'サブブランドの費用項目',
  });

export const UpdateBrandFeeItemSchema = z
  .object({
    item_code: z.string().trim().min(1).openapi({
      example: 'enrollment-fee',
      description: '費用項目コード',
    }),
    item_name: z.string().trim().min(1).max(255).openapi({
      example: '入会金',
      description: '費用項目名',
    }),
    current_value_including_tax_yen: z.number().int().min(0).openapi({
      example: 11000,
      description: '現在の定価（税込・円）',
    }),
    effective_start_date: z
      .string()
      .trim()
      .regex(/^\d{4}\/\d{2}\/\d{2}$/)
      .openapi({
        example: '2025/04/01',
        description: '現行設定の有効開始日',
      }),
  })
  .openapi({
    title: 'UpdateBrandFeeItem',
    description: '費用項目の更新入力',
  });

export const BrandFeeGroupSchema = z
  .object({
    parent_brand_code: ManagedBrandCodeSchema.openapi({
      example: 'joyfit',
      description: '親ブランドコード',
    }),
    parent_brand_name: z.string().trim().min(1).openapi({
      example: 'JOYFIT',
      description: '親ブランド名',
    }),
    sub_brand_code: ManagedBrandCodeSchema.openapi({
      example: 'joyfit24',
      description: 'サブブランドコード',
    }),
    sub_brand_id: ManagedBrandCodeSchema.openapi({
      example: 'joyfit24',
      description: 'サブブランドID',
    }),
    display_name: z.string().trim().min(1).openapi({
      example: 'JOYFIT24',
      description: 'サブブランド名',
    }),
    status: BrandStatusSchema,
    fee_master_id: z.string().trim().min(1).openapi({
      example: 'EF002',
      description: '費用マスタID',
    }),
    fee_items: z.array(BrandFeeItemSchema).openapi({
      description: 'サブブランド配下の費用項目',
    }),
  })
  .openapi({
    title: 'BrandFeeGroup',
    description: 'ブランド詳細の費用タブに表示するサブブランド単位の費用マスタ',
  });

export const BrandChangeHistoryItemSchema = z
  .object({
    changed_at: z.string().openapi({
      example: '2026/03/01 10:24:05',
      description: '変更日時',
    }),
    changed_by: z.string().trim().min(1).openapi({
      example: '山田 花子（本部）',
      description: '変更者',
    }),
    target_display_name: z.string().trim().min(1).openapi({
      example: 'JOYFIT / JOYFIT24',
      description: '対象',
    }),
    changed_field: z.string().trim().min(1).openapi({
      example: '入会金 定価',
      description: '変更項目',
    }),
    before_value: z.string().trim().min(1).openapi({
      example: '¥10,000',
      description: '変更前',
    }),
    after_value: z.string().trim().min(1).openapi({
      example: '¥11,000',
      description: '変更後',
    }),
  })
  .openapi({
    title: 'BrandChangeHistoryItem',
    description: 'ブランド変更履歴の一覧行',
  });

export const GetBrandsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).openapi({
      example: 1,
      description: 'ページ番号',
    }),
    limit: z.coerce.number().int().min(1).max(200).default(25).openapi({
      example: 25,
      description: '1ページあたりの表示件数',
    }),
    search: z.string().trim().max(255).optional().openapi({
      example: 'joyfit',
      description: 'ブランドID・ブランド名で検索',
    }),
  })
  .openapi({
    title: 'GetBrandsQuery',
    description: 'ブランド一覧検索条件',
  });

export const GetBrandsResponseSchema = z
  .object({
    brands: z.array(BrandListItemSchema).openapi({
      description: '管理対象ブランド一覧',
    }),
    pagination: BrandPaginationSchema,
  })
  .openapi({
    title: 'GetBrandsResponse',
    description: 'ブランド一覧',
  });

export const GetBrandDetailResponseSchema = z
  .object({
    brand: BrandDetailSchema,
  })
  .openapi({
    title: 'GetBrandDetailResponse',
    description: 'ブランド詳細の基本情報',
  });

export const GetBrandFeesResponseSchema = z
  .object({
    fee_groups: z.array(BrandFeeGroupSchema).openapi({
      description: '費用タブ表示用のサブブランド一覧',
    }),
  })
  .openapi({
    title: 'GetBrandFeesResponse',
    description: 'ブランド詳細の費用タブデータ',
  });

export const GetBrandChangeHistoryResponseSchema = z
  .object({
    histories: z.array(BrandChangeHistoryItemSchema).openapi({
      description: '変更履歴一覧',
    }),
  })
  .openapi({
    title: 'GetBrandChangeHistoryResponse',
    description: 'ブランド詳細の変更履歴データ',
  });

export const CreateBrandRequestSchema = z
  .object({
    display_name: z.string().trim().min(1).max(255).openapi({
      description: 'ブランド名',
      example: 'JOYFIT',
    }),
    brand_id: BrandIdInputSchema.openapi({
      description: 'ブランドID',
      example: 'joyfit',
    }),
    created_by: z.string().trim().min(1).optional().openapi({
      description: '作成者スタッフID（モック用）',
      example: 'STF-001',
    }),
  })
  .openapi({
    title: 'CreateBrandRequest',
    description: 'Y-07 ブランド新規登録',
  });

export const CreateBrandResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'ブランドを作成しました' }),
    brand: BrandDetailSchema,
  })
  .openapi({
    title: 'CreateBrandResponse',
    description: '作成後のブランド詳細',
  });

export const UpdateBrandRequestSchema = z
  .object({
    display_name: z.string().trim().min(1).max(255).optional().openapi({
      description: 'ブランド名',
    }),
    brand_id: BrandIdInputSchema.optional().openapi({
      description: 'ブランドID',
    }),
    updated_by: z.string().trim().min(1).optional().openapi({
      description: '更新者スタッフID（モック用）',
      example: 'STF-001',
    }),
  })
  .openapi({
    title: 'UpdateBrandRequest',
    description: 'Y-07 ブランド基本情報の部分更新',
  });

export const UpdateBrandResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'ブランド設定を保存しました' }),
    brand: BrandDetailSchema,
  })
  .openapi({
    title: 'UpdateBrandResponse',
    description: '更新後のブランド詳細',
  });

export const UpdateBrandFeeGroupRequestSchema = z
  .object({
    fee_items: z.array(UpdateBrandFeeItemSchema).min(1).openapi({
      description: '更新後の費用項目一覧',
    }),
    updated_by: z.string().trim().min(1).optional().openapi({
      description: '更新者スタッフIDまたは表示名（モック用）',
      example: '山田 花子（本部）',
    }),
  })
  .openapi({
    title: 'UpdateBrandFeeGroupRequest',
    description: 'ブランド費用グループの更新',
  });

export const UpdateBrandFeeGroupResponseSchema = z
  .object({
    message: z.string().openapi({ example: '費用設定を保存しました' }),
    fee_group: BrandFeeGroupSchema,
  })
  .openapi({
    title: 'UpdateBrandFeeGroupResponse',
    description: '更新後の費用グループ',
  });

export const DisableBrandFeeGroupResponseSchema = z
  .object({
    message: z.string().openapi({ example: '費用マスタを無効化しました' }),
    fee_group: BrandFeeGroupSchema,
  })
  .openapi({
    title: 'DisableBrandFeeGroupResponse',
    description: '無効化後の費用グループ',
  });

export const DeleteBrandFeeGroupResponseSchema = z
  .object({
    message: z.string().openapi({ example: '費用マスタを削除しました' }),
    deleted_sub_brand_code: ManagedBrandCodeSchema.openapi({
      description: '削除したサブブランドコード',
      example: 'joyfit24',
    }),
  })
  .openapi({
    title: 'DeleteBrandFeeGroupResponse',
    description: '費用グループ削除レスポンス',
  });

export type BrandChangeHistoryItem = z.infer<typeof BrandChangeHistoryItemSchema>;
export type BrandDetail = z.infer<typeof BrandDetailSchema>;
export type BrandFeeGroup = z.infer<typeof BrandFeeGroupSchema>;
export type BrandFeeItem = z.infer<typeof BrandFeeItemSchema>;
export type BrandListItem = z.infer<typeof BrandListItemSchema>;
export type BrandPagination = z.infer<typeof BrandPaginationSchema>;
export type BrandScheduledFeeChange = z.infer<typeof BrandScheduledFeeChangeSchema>;
export type BrandStatus = z.infer<typeof BrandStatusSchema>;
export type CreateBrandRequest = z.infer<typeof CreateBrandRequestSchema>;
export type CreateBrandResponse = z.infer<typeof CreateBrandResponseSchema>;
export type DeleteBrandFeeGroupResponse = z.infer<typeof DeleteBrandFeeGroupResponseSchema>;
export type DisableBrandFeeGroupResponse = z.infer<typeof DisableBrandFeeGroupResponseSchema>;
export type GetBrandChangeHistoryResponse = z.infer<typeof GetBrandChangeHistoryResponseSchema>;
export type GetBrandDetailResponse = z.infer<typeof GetBrandDetailResponseSchema>;
export type GetBrandFeesResponse = z.infer<typeof GetBrandFeesResponseSchema>;
export type GetBrandsQuery = z.infer<typeof GetBrandsQuerySchema>;
export type GetBrandsResponse = z.infer<typeof GetBrandsResponseSchema>;
export type ManagedBrandCode = z.infer<typeof ManagedBrandCodeSchema>;
export type UpdateBrandFeeGroupRequest = z.infer<typeof UpdateBrandFeeGroupRequestSchema>;
export type UpdateBrandFeeGroupResponse = z.infer<typeof UpdateBrandFeeGroupResponseSchema>;
export type UpdateBrandFeeItem = z.infer<typeof UpdateBrandFeeItemSchema>;
export type UpdateBrandRequest = z.infer<typeof UpdateBrandRequestSchema>;
export type UpdateBrandResponse = z.infer<typeof UpdateBrandResponseSchema>;
