import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

/** G-01 main contract status (mock) */
export const StoreMainContractStatusSchema = z
  .enum(['draft', 'active', 'suspended', 'expired', 'terminated'])
  .openapi({
    title: 'StoreMainContractStatus',
    description: 'Main contract lifecycle for the store',
  });

/** Mutual-use mechanism type */
export const MutualUseTypeSchema = z
  .enum(['none', 'within_brand', 'cross_brand', 'custom'])
  .openapi({
    title: 'MutualUseType',
    description: 'Cơ chế sử dụng lẫn nhau / mutual use type',
  });

/** Brand (list/filter + master) */
export const StoreListBrandSchema = z
  .enum(['joyfit', 'fit365', 'joyfit24', 'joyfit_yoga', 'joyfit_plus'])
  .openapi({
    title: 'StoreListBrand',
    description: 'Store brand',
  });

export const StoreAreaSchema = z.enum(['kanto', 'kansai', 'chubu', 'other']).openapi({
  title: 'StoreArea',
  description: 'Rough geographic area for filtering',
});

/** 営業中 / 準備中 / 休業中 / 閉店 — UI status (mock) */
export const StoreListStatusSchema = z
  .enum(['operating', 'preparing', 'closed_temp', 'closed_perm'])
  .openapi({
    title: 'StoreListStatus',
    description: 'Store operating status (list / detail)',
  });

/**
 * Store master (Y-01) — single shape for list, detail, and mock DB
 */
export const StoreSchema = z
  .object({
    /** Internal primary key (API paths, FK) */
    id: z.string().openapi({ example: 'store-001', description: '内部ID' }),
    /** Display store id (一覧・帳票) */
    store_id: z.string().openapi({ example: 'S-001', description: '店舗ID (表示)' }),
    club_code: z.string().optional().openapi({ example: 'STR-00001', description: 'クラブコード' }),
    name: z.string().openapi({ example: 'Fit365八潮店', description: '店舗名' }),
    brand: StoreListBrandSchema.openapi({ description: 'ブランド' }),
    area: StoreAreaSchema.optional().openapi({ description: 'エリア' }),
    operating_company_name: z.string().optional().openapi({
      example: '株式会社ウェルネスフロンティア',
      description: '運営企業',
    }),
    postal_code: z.string().optional().openapi({ example: '160-0022', description: '郵便番号' }),
    prefecture: z.string().optional().openapi({ example: '東京都', description: '都道府県' }),
    address: z
      .string()
      .optional()
      .openapi({ example: '新宿区新宿3-1-1 ABCビル 2F', description: '住所' }),
    email: z
      .string()
      .optional()
      .openapi({ example: 'shinjuku@joyfit.jp', description: 'メールアドレス' }),
    phone: z.string().optional().openapi({ example: '03-1234-5678', description: '電話番号' }),
    accounting_code: z
      .string()
      .optional()
      .openapi({ example: 'ACC-TK001', description: '会計コード' }),
    interview_url: z.string().optional().openapi({
      example: 'https://goo.gl/maps/indoor-shinjuku',
      description: 'インドアビュー URL',
    }),
    google_map_url: z.string().optional().openapi({
      example: 'https://goo.gl/maps/shinjuku-store',
      description: 'Google Map URL',
    }),
    x_url: z.string().optional().openapi({ example: '@joyfit24_shinjuku', description: 'X URL' }),
    instagram_url: z
      .string()
      .optional()
      .openapi({ example: '@joyfit24_shinjuku', description: 'Instagram URL' }),
    line_url: z
      .string()
      .optional()
      .openapi({ example: '@joyfit24shinjuku', description: 'LINE URL' }),
    facebook_url: z
      .string()
      .optional()
      .openapi({ example: 'joyfit24shinjuku', description: 'Facebook URL' }),
    youtube_url: z.string().optional().openapi({ example: '', description: 'YouTube URL' }),
    store_photos: z.array(z.string()).optional().openapi({ description: '店舗写真 URLs' }),
    floor_map_url: z.string().optional().openapi({ description: 'フロアマップ URL' }),
    /** UIステータス (一覧・詳細共通) */
    status: StoreListStatusSchema.openapi({ description: 'ステータス' }),
    fc_company_id: z.string().nullable().optional().openapi({
      example: 'fc-001',
      description: 'FK FC company (Y-03), null for directly managed',
    }),
    manager_staff_id: z.string().nullable().optional().openapi({
      example: '12',
      description: 'FK Staff — 店舗責任者 (Y-01)',
    }),
    main_contract_id: z.string().nullable().optional().openapi({
      example: 'ctr-store-001',
      description: 'FK G-01 main contract',
    }),
    main_contract_status: StoreMainContractStatusSchema.nullable().optional().openapi({
      description: 'Main contract status snapshot',
    }),
    option_pass_price: z.number().openapi({
      example: 800,
      description: '1Day Pass price (staff with permission may edit)',
    }),
    mutual_use_enabled: z.boolean().openapi({ description: '相互利用を有効にするか' }),
    mutual_use_type: MutualUseTypeSchema.openapi({ description: '相互利用タイプ' }),
    closing_date: z.string().nullable().optional().openapi({
      example: '2027-03-31',
      description: '閉店日 — null while operating',
    }),
    locker_map_id: z.string().nullable().optional().openapi({
      example: 'locker-map-001',
      description: 'FK E-01 locker map',
    }),
    asset_id: z.string().nullable().optional().openapi({
      example: 'asset-ph2-001',
      description: 'FK I-01 (Phase 2)',
    }),
    created_by: z.string().openapi({ example: 'STF-001', description: '作成者' }),
    created_at: z.string().openapi({ example: '2024-01-10T09:00:00Z' }),
    updated_by: z.string().openapi({ example: 'STF-002', description: '更新者' }),
    updated_at: z.string().openapi({ example: '2026-03-01T12:00:00Z' }),
  })
  .openapi({
    title: 'Store',
    description: 'Store master row',
  });

export type Store = z.infer<typeof StoreSchema>;

export const UpsertStorePayloadSchema = z
  .object({
    name: z.string().min(1).openapi({ example: 'JOYFIT24新宿店' }),
    brand: StoreListBrandSchema,
    area: StoreAreaSchema.optional(),
    status: StoreListStatusSchema,
    operating_company_name: z.string().optional(),
    postal_code: z.string().optional(),
    prefecture: z.string().optional(),
    address: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    club_code: z.string().optional().openapi({ example: 'TK-001' }),
    accounting_code: z.string().optional(),
    /** Omitted on PATCH means “leave unchanged”; FE create always sends a boolean */
    is_fc: z.boolean().optional(),
    interview_url: z.string().optional(),
    google_map_url: z.string().optional(),
    x_url: z.string().optional(),
    instagram_url: z.string().optional(),
    line_url: z.string().optional(),
    facebook_url: z.string().optional(),
    youtube_url: z.string().optional(),
    store_photos: z.array(z.string()).optional(),
    floor_map_url: z.string().optional(),
  })
  .openapi({
    title: 'UpsertStorePayload',
    description: 'Create/update payload for store',
  });

export const GetStoresQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
    limit: z.coerce.number().int().min(1).max(100).default(30).openapi({ example: 30 }),
    search: z.string().optional().openapi({
      description: '店舗名・クラブコードで検索',
    }),
    brand: StoreListBrandSchema.optional().openapi({ description: 'ブランド' }),
    area: StoreAreaSchema.optional().openapi({ description: 'エリア' }),
    status: StoreListStatusSchema.optional().openapi({ description: 'ステータス' }),
    sort_by: z
      .enum(['id', 'store_id', 'name', 'brand', 'area', 'club_code', 'operating_company_name'])
      .default('store_id')
      .openapi({ description: 'Sort field' }),
    sort_order: z.enum(['asc', 'desc']).default('asc').openapi({ description: 'Sort order' }),
  })
  .openapi({
    title: 'GetStoresQuery',
    description: 'Query parameters for store list',
  });

export const GetStoresResponseSchema = z
  .object({
    stores: z.array(StoreSchema).openapi({ description: 'Stores' }),
    pagination: z
      .object({
        page: z.number().openapi({ example: 1 }),
        limit: z.number().openapi({ example: 30 }),
        total: z.number().openapi({ example: 10 }),
        total_pages: z.number().openapi({ example: 1 }),
      })
      .openapi({ title: 'StorePagination' }),
  })
  .openapi({
    title: 'GetStoresResponse',
    description: 'Store list response with pagination',
  });

export const GetStoreByIdResponseSchema = z
  .object({
    store: StoreSchema,
  })
  .openapi({
    title: 'GetStoreByIdResponse',
    description: 'Store detail response',
  });

export const CreateStoreResponseSchema = z
  .object({
    message: z.string().openapi({ example: '店舗を作成しました' }),
    store: StoreSchema,
  })
  .openapi({
    title: 'CreateStoreResponse',
    description: 'Store create response',
  });

export const UpdateStoreResponseSchema = z
  .object({
    message: z.string().openapi({ example: '店舗情報を更新しました' }),
    store: StoreSchema,
  })
  .openapi({
    title: 'UpdateStoreResponse',
    description: 'Store update response',
  });

export type StoreListBrand = z.infer<typeof StoreListBrandSchema>;
export type StoreArea = z.infer<typeof StoreAreaSchema>;
export type StoreListStatus = z.infer<typeof StoreListStatusSchema>;
export type GetStoresQuery = z.infer<typeof GetStoresQuerySchema>;
export type GetStoresResponse = z.infer<typeof GetStoresResponseSchema>;
export type UpsertStorePayload = z.infer<typeof UpsertStorePayloadSchema>;

// ─── Business Hours (Y-02-04 営業カレンダー) ──────────────────────────────────

export const DayOfWeekSchema = z
  .enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'holiday'])
  .openapi({ title: 'DayOfWeek', description: 'Day of week including holiday' });

export const DefaultHoursEntrySchema = z
  .object({
    day: DayOfWeekSchema,
    open_time: z.string().openapi({ example: '10:00', description: '開店時刻 HH:mm' }),
    close_time: z.string().openapi({ example: '23:00', description: '閉店時刻 HH:mm' }),
    is_closed: z.boolean().openapi({ description: '定休日フラグ' }),
  })
  .openapi({ title: 'DefaultHoursEntry', description: '曜日別デフォルト営業時間' });

export const ExceptionHoursEntrySchema = z
  .object({
    id: z.string().openapi({ example: 'exc-001' }),
    date: z.string().openapi({ example: '2026-12-31', description: '例外日 YYYY-MM-DD' }),
    open_time: z.string().openapi({ example: '10:00' }),
    close_time: z.string().openapi({ example: '17:00' }),
  })
  .openapi({ title: 'ExceptionHoursEntry', description: '例外営業時間（特定日）' });

export const TemporaryClosureEntrySchema = z
  .object({
    id: z.string().openapi({ example: 'tcl-001' }),
    date: z.string().openapi({ example: '2026-03-15', description: '臨時休業日 YYYY-MM-DD' }),
    reason: z.string().optional().openapi({ example: '設備点検', description: '理由' }),
  })
  .openapi({ title: 'TemporaryClosureEntry', description: '臨時休業日' });

export const StoreBusinessHoursSchema = z
  .object({
    store_id: z.string().openapi({ example: 'store-001' }),
    default_hours: z.array(DefaultHoursEntrySchema).openapi({
      description: '曜日別デフォルト営業時間',
    }),
    exception_hours: z.array(ExceptionHoursEntrySchema).openapi({
      description: '例外営業時間（特定日に通常と異なる時間）',
    }),
    temporary_closures: z.array(TemporaryClosureEntrySchema).openapi({
      description: '臨時休業日一覧',
    }),
    updated_at: z.string().openapi({ example: '2026-03-01T12:00:00Z' }),
    updated_by: z.string().openapi({ example: 'STF-001' }),
  })
  .openapi({ title: 'StoreBusinessHours', description: '店舗営業時間設定' });

export const UpdateStoreBusinessHoursPayloadSchema = z
  .object({
    default_hours: z.array(DefaultHoursEntrySchema).optional(),
    exception_hours: z.array(ExceptionHoursEntrySchema).optional(),
    temporary_closures: z.array(TemporaryClosureEntrySchema).optional(),
  })
  .openapi({
    title: 'UpdateStoreBusinessHoursPayload',
    description: '営業時間更新リクエスト',
  });

export const GetStoreBusinessHoursResponseSchema = z
  .object({ business_hours: StoreBusinessHoursSchema })
  .openapi({ title: 'GetStoreBusinessHoursResponse' });

export const UpdateStoreBusinessHoursResponseSchema = z
  .object({
    message: z.string().openapi({ example: '営業時間を更新しました' }),
    business_hours: StoreBusinessHoursSchema,
  })
  .openapi({ title: 'UpdateStoreBusinessHoursResponse' });

export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;
export type DefaultHoursEntry = z.infer<typeof DefaultHoursEntrySchema>;
export type ExceptionHoursEntry = z.infer<typeof ExceptionHoursEntrySchema>;
export type TemporaryClosureEntry = z.infer<typeof TemporaryClosureEntrySchema>;
export type StoreBusinessHours = z.infer<typeof StoreBusinessHoursSchema>;
export type UpdateStoreBusinessHoursPayload = z.infer<typeof UpdateStoreBusinessHoursPayloadSchema>;

export { ErrorResponseSchema } from './auth.schema';
