import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const StudioTypeSchema = z
  .enum(['studio-lesson', 'pt', 'body-care'])
  .openapi({ example: 'studio-lesson' });

export const BrandSchema = z
  .enum(['joyfit', 'joyfit24', 'joyfit_yoga', 'joyfit_plus', 'fit365'])
  .openapi({ example: 'joyfit' });

export const StudioStatusSchema = z.enum(['active', 'inactive']).openapi({ example: 'active' });

export const StudioListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'STU-001', description: 'スタジオID' }),
    name: z.string().min(1).max(100).openapi({ example: 'スタジオA' }),
    store_id: z.string().openapi({ example: 'store-001' }),
    store_name: z.string().openapi({ example: '渋谷店' }),
    studio_type: StudioTypeSchema,
    capacity: z.number().int().min(1).max(1000).openapi({ example: 30 }),
    available_hours: z.string().openapi({ example: '10:00–21:00' }),
    brand: BrandSchema,
    status: StudioStatusSchema,
  })
  .openapi({ title: 'StudioListItem', description: 'スタジオ一覧アイテム' });

export const StudioListResponseSchema = z
  .object({
    items: z.array(StudioListItemSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int(),
    has_next: z.boolean(),
  })
  .openapi({ title: 'StudioListResponse', description: 'スタジオ一覧レスポンス' });

export const GetStudiosQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
    limit: z.coerce
      .number()
      .int()
      .refine((v) => [25, 50, 100, 200].includes(v), 'Must be 25, 50, 100, or 200')
      .default(50)
      .openapi({ example: 50 }),
    search: z.string().optional().openapi({ description: 'スタジオ名で検索（部分一致）' }),
    store_id: z.string().optional().openapi({ description: '店舗IDでフィルタ' }),
    studio_type: StudioTypeSchema.optional().openapi({ description: 'スタジオ区分でフィルタ' }),
    brand: BrandSchema.optional().openapi({ description: 'ブランドでフィルタ' }),
    status: StudioStatusSchema.optional().openapi({ description: 'ステータスでフィルタ' }),
    sort_by: z
      .enum(['id', 'name', 'store_name', 'studio_type', 'capacity'])
      .default('id')
      .openapi({ description: 'ソート項目' }),
    sort_order: z.enum(['asc', 'desc']).default('asc').openapi({ description: 'ソート順' }),
  })
  .openapi({ title: 'GetStudiosQuery', description: 'スタジオ一覧クエリパラメータ' });

// ─── Studio Create/Edit Schemas (FR-002, FR-004) ──────────────────────────

export const StudioFormTypeSchema = z
  .enum(['normal', 'hot_yoga', 'virtual'])
  .openapi({ example: 'normal', description: 'スタジオ区分' });

export const StudioLayoutCellKindSchema = z
  .enum(['normal_seat', 'equipment_seat', 'fixed_object', 'empty'])
  .openapi({ example: 'normal_seat', description: 'Cell type in layout grid' });

export const StudioLayoutCellSchema = z
  .object({
    x: z.number().int().min(0).openapi({ example: 0 }),
    y: z.number().int().min(0).openapi({ example: 0 }),
    kind: StudioLayoutCellKindSchema,
  })
  .openapi({ title: 'StudioLayoutCell' });

export const StudioLayoutSchema = z
  .object({
    rows: z.number().int().min(2).max(5).openapi({ example: 2 }),
    columns: z
      .number()
      .int()
      .refine((v) => [6, 8, 10].includes(v), {
        message: 'Columns must be 6, 8, or 10',
      })
      .openapi({ example: 8 }),
    cells: z.array(StudioLayoutCellSchema).default([]).openapi({ description: 'Grid cells' }),
  })
  .openapi({ title: 'StudioLayout' });

export const StudioImagePayloadSchema = z
  .object({
    url: z.string().url().openapi({ example: 'https://cdn.mock.example.com/studio/uuid.jpg' }),
    sort_order: z.number().int().min(0).openapi({ example: 1 }),
  })
  .openapi({ title: 'StudioImagePayload' });

export const CreateStudioPayloadSchema = z
  .object({
    name: z.string().min(1, 'スタジオ名は必須です。').max(100),
    store_id: z.string().min(1, '店舗は必須です。'),
    studio_type: StudioFormTypeSchema,
    capacity: z.number().int().min(1, '収容人数は必須です。').max(500),
    buffer_value: z.number().int().min(0).max(500).default(0),
    operating_hours: z.string().regex(/^\d{2}:\d{2}~\d{2}:\d{2}$/, {
      message: '利用可能時間は HH:mm~HH:mm 形式で入力してください。',
    }),
    equipment_notes: z.string().max(1000).nullable().optional(),
    internal_notes: z.string().max(1000).nullable().optional(),
    status: z.enum(['active', 'inactive']).default('active'),
    images: z.array(StudioImagePayloadSchema).optional().default([]),
    layout: StudioLayoutSchema.optional(),
  })
  .openapi({ title: 'CreateStudioPayload', description: 'Create studio request payload' });

export const UpdateStudioPayloadSchema = CreateStudioPayloadSchema.openapi({
  title: 'UpdateStudioPayload',
  description: 'Update studio request payload',
});

export const CreateStudioResponseSchema = z
  .object({
    id: z.string().openapi({ example: 'STU-042' }),
  })
  .openapi({ title: 'CreateStudioResponse' });

export const UpdateStudioResponseSchema = z
  .object({
    success: z.literal(true),
  })
  .openapi({ title: 'UpdateStudioResponse' });

export type StudioListItem = z.infer<typeof StudioListItemSchema>;
export type StudioListResponse = z.infer<typeof StudioListResponseSchema>;
export type GetStudiosQuery = z.infer<typeof GetStudiosQuerySchema>;
export type CreateStudioPayload = z.infer<typeof CreateStudioPayloadSchema>;
export type UpdateStudioPayload = z.infer<typeof UpdateStudioPayloadSchema>;
export type CreateStudioResponse = z.infer<typeof CreateStudioResponseSchema>;
export type UpdateStudioResponse = z.infer<typeof UpdateStudioResponseSchema>;
export type StudioLayoutCell = z.infer<typeof StudioLayoutCellSchema>;
export type StudioLayout = z.infer<typeof StudioLayoutSchema>;
export type StudioImagePayload = z.infer<typeof StudioImagePayloadSchema>;
