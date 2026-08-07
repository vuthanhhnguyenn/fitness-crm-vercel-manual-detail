import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { StudioStatusSchema, StudioTypeSchema } from './studio.schema';

extendZodWithOpenApi(z);

/**
 * D-03 FR-003 — Studio Detail Display schemas.
 * Mock source of truth for:
 *   GET /api/crm/studios/{id}  (detail page)
 *
 * Field names use snake_case to match existing conventions.
 * Reuses BrandSchema / StudioTypeSchema / StudioStatusSchema from studio.schema.ts.
 */

// ─── Enums ────────────────────────────────────────────────────────────────

export const ReservationTierSchema = z.enum(['success', 'warning', 'default']).openapi({
  title: 'ReservationTier',
  description: 'Color tier for reservation rate',
});

export const LayoutStateSchema = z
  .enum(['configured', 'not_configured'])
  .openapi({ title: 'LayoutState', description: 'Layout preview state' });

export const LayoutCellKindSchema = z
  .enum(['normal_seat', 'equipment_seat', 'fixed_object'])
  .openapi({
    title: 'LayoutCellKind',
    description: 'Cell type in layout grid',
  });

export const TrendSchema = z
  .enum(['up', 'down', 'flat'])
  .nullable()
  .optional()
  .openapi({ title: 'Trend', description: 'Utilization trend indicator' });

// ─── Detail sub-entities ────────────────────────────────────────────────────

export const LinkedLessonSummarySchema = z
  .object({
    lesson_id: z.string().openapi({ example: 'LSN-0001', description: 'Lesson reference' }),
    lesson_name: z.string().max(120).openapi({ example: 'Yoga Basic' }),
    category: z.string().openapi({ example: 'Yoga', description: 'Lesson category badge' }),
    schedule_text: z.string().openapi({ example: 'Mon/Wed 19:00' }),
    reservation_rate: z.number().int().min(0).max(100).openapi({ example: 82 }),
    reservation_tier: ReservationTierSchema.openapi({ example: 'success' }),
  })
  .openapi({
    title: 'LinkedLessonSummary',
    description: 'Linked lesson row in detail',
  });

export const StudioImageSchema = z
  .object({
    image_id: z.string().openapi({ example: 'IMG-001', description: 'Image identifier' }),
    url: z.string().openapi({ example: '/mock/studios/studio-a-1.jpg' }),
    alt: z.string().max(255).openapi({
      example: 'Studio A main view',
      description: 'Accessibility text',
    }),
    sort_order: z.number().int().min(0).openapi({ example: 0, description: 'Display order' }),
  })
  .openapi({
    title: 'StudioImage',
    description: 'Studio image asset metadata',
  });

export const LayoutCellSchema = z
  .object({
    x: z.number().int().min(0).openapi({ example: 0, description: 'Column index' }),
    y: z.number().int().min(0).openapi({ example: 0, description: 'Row index' }),
    kind: LayoutCellKindSchema.openapi({ example: 'normal_seat' }),
  })
  .openapi({ title: 'LayoutCell', description: 'Studio layout grid cell' });

export const LayoutPreviewSchema = z
  .object({
    state: LayoutStateSchema.openapi({ example: 'configured' }),
    rows: z.number().int().min(1).nullable().optional().openapi({ example: 5 }),
    columns: z.number().int().min(1).nullable().optional().openapi({ example: 6 }),
    cells: z.array(LayoutCellSchema).nullable().optional().openapi({ description: 'Grid cells' }),
    configure_path: z.string().openapi({
      example: '/studios/STD-0001/edit',
      description: 'Navigation to edit',
    }),
  })
  .openapi({
    title: 'LayoutPreview',
    description: 'Studio layout preview or not-configured state',
  });

const HourlyRateSchema = z.object({
  band: z.string(),
  rate: z.number().int().min(0).max(100),
});

export const UtilizationSummarySchema = z
  .object({
    day_rate: z.number().int().min(0).max(100).openapi({ example: 71 }),
    week_rate: z.number().int().min(0).max(100).openapi({ example: 68 }),
    month_rate: z.number().int().min(0).max(100).openapi({ example: 64 }),
    trend: TrendSchema.openapi({ example: 'up' }),
    day_lesson_count: z.number().int().optional(),
    week_lesson_count: z.number().int().optional(),
    month_lesson_count: z.number().int().optional(),
    active_hours: z.string().optional(),
    day_hourly_rates: z.array(HourlyRateSchema).optional(),
    week_hourly_rates: z.array(HourlyRateSchema).optional(),
    month_hourly_rates: z.array(HourlyRateSchema).optional(),
    day_trend: z.array(z.number().int().min(0).max(100)).optional(),
    week_trend: z.array(z.number().int().min(0).max(100)).optional(),
    month_trend: z.array(z.number().int().min(0).max(100)).optional(),
  })
  .openapi({
    title: 'UtilizationSummary',
    description: 'Read-only KPI snapshot',
  });

// ─── Main Detail Response ────────────────────────────────────────────────────

export const StudioDetailSchema = z
  .object({
    id: z.string().openapi({ example: 'STD-0001', description: 'Studio identifier' }),
    name: z.string().max(100).openapi({ example: 'Studio A' }),
    studio_type: StudioTypeSchema.openapi({ example: 'studio-lesson' }),
    status: StudioStatusSchema.openapi({ example: 'active' }),
    capacity: z.number().int().min(1).openapi({ example: 30, description: 'Physical capacity' }),
    buffer_value: z.number().int().min(0).openapi({ example: 2, description: 'Buffer value' }),
    usage_hours: z.string().openapi({ example: '10:00-21:00' }),
    store_id: z.string().openapi({ example: 'STORE-001' }),
    store_name: z.string().openapi({ example: 'Shibuya' }),
    equipment_notes: z.string().max(1000).nullable().optional().openapi({
      example: 'Mirrors + sound system',
      description: 'Optional equipment notes',
    }),
    internal_notes: z
      .string()
      .max(1000)
      .nullable()
      .optional()
      .openapi({ example: null, description: 'Optional internal notes' }),
    created_at: z.string().openapi({ example: '2026-01-15T00:00:00.000Z' }),
    updated_at: z.string().openapi({ example: '2026-06-01T00:00:00.000Z' }),
    assigned_lesson_count: z
      .number()
      .int()
      .min(0)
      .openapi({ example: 3, description: 'Delete guard signal' }),
    change_history_enabled: z
      .boolean()
      .openapi({ example: true, description: 'Whether change history tab has data' }),
  })
  .openapi({ title: 'StudioDetail', description: 'Studio detail main entity' });

export const GetStudioDetailResponseSchema = z
  .object({
    data: StudioDetailSchema,
    linked_lessons: z.array(LinkedLessonSummarySchema).openapi({ description: 'Can be empty' }),
    images: z.array(StudioImageSchema).openapi({ description: 'Studio images' }),
    layout: LayoutPreviewSchema,
    utilization: UtilizationSummarySchema,
  })
  .openapi({
    title: 'GetStudioDetailResponse',
    description: 'Complete studio detail response',
  });

export const GetStudioDetailQuerySchema = z
  .object({
    id: z.string().openapi({ example: 'STD-0001', description: 'Studio ID from path' }),
  })
  .openapi({
    title: 'GetStudioDetailQuery',
    description: 'Studio detail request',
  });

// ─── Change history ─────────────────────────────────────────────────────────

export const StudioChangeHistoryDiffSchema = z
  .object({
    field: z.string().openapi({ example: '定員', description: '変更フィールド' }),
    before: z.string().openapi({ example: '12名', description: '変更前' }),
    after: z.string().openapi({ example: '16名', description: '変更後' }),
  })
  .openapi({ title: 'StudioChangeHistoryDiff', description: 'Studio field diff row' });

export const StudioChangeHistoryEntrySchema = z
  .object({
    timestamp: z.string().openapi({
      example: '2026-03-01T14:22:00.000Z',
      description: '更新日時',
    }),
    user: z.string().openapi({ example: '管理者', description: '操作者' }),
    action: z.string().openapi({ example: '更新', description: '操作種別' }),
    diffs: z
      .array(StudioChangeHistoryDiffSchema)
      .optional()
      .openapi({ description: '変更内容の差分リスト' }),
    note: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'Zumbaスタジオを新規登録', description: '備考' }),
  })
  .openapi({ title: 'StudioChangeHistoryEntry', description: 'Studio change-log entry' });

export const StudioChangeHistorySchema = z
  .object({
    entries: z.array(StudioChangeHistoryEntrySchema),
    total: z.number().int().min(0).openapi({ example: 4 }),
  })
  .openapi({ title: 'StudioChangeHistory', description: 'Studio change-log list + total' });

export const GetStudioHistoryResponseSchema = z
  .object({
    data: StudioChangeHistorySchema,
  })
  .openapi({
    title: 'GetStudioHistoryResponse',
    description: 'Studio change history response',
  });

// ─── Type Exports ────────────────────────────────────────────────────────────

export type ReservationTier = z.infer<typeof ReservationTierSchema>;
export type LinkedLessonSummary = z.infer<typeof LinkedLessonSummarySchema>;
export type StudioImage = z.infer<typeof StudioImageSchema>;
export type LayoutCell = z.infer<typeof LayoutCellSchema>;
export type LayoutPreview = z.infer<typeof LayoutPreviewSchema>;
export type UtilizationSummary = z.infer<typeof UtilizationSummarySchema>;
export type StudioDetail = z.infer<typeof StudioDetailSchema>;
export type GetStudioDetailResponse = z.infer<typeof GetStudioDetailResponseSchema>;
export type GetStudioDetailQuery = z.infer<typeof GetStudioDetailQuerySchema>;
export type StudioChangeHistoryDiff = z.infer<typeof StudioChangeHistoryDiffSchema>;
export type StudioChangeHistoryEntry = z.infer<typeof StudioChangeHistoryEntrySchema>;
export type StudioChangeHistory = z.infer<typeof StudioChangeHistorySchema>;
export type GetStudioHistoryResponse = z.infer<typeof GetStudioHistoryResponseSchema>;
