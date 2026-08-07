import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import {
  LessonBrandSchema,
  LessonContentStatusSchema,
  LessonPricingTypeSchema,
} from './lesson-content.schema';

extendZodWithOpenApi(z);

/**
 * D-02 FR-003 — Lesson Content Master DETAIL schemas.
 * Mock source of truth for:
 *   GET /api/crm/lesson-contents/{id}            (detail)
 *   GET /api/crm/lesson-contents/{id}/schedules  (recurring patterns + sessions)
 *   GET /api/crm/lesson-contents/{id}/history    (change log)
 *
 * Field names use snake_case to match existing mock/query conventions.
 * Reuses LessonBrandSchema / LessonContentStatusSchema / LessonPricingTypeSchema
 * from lesson-content.schema.ts (Principle III — no duplicate shapes).
 */

// ─── Enums ────────────────────────────────────────────────────────────────

export const LessonDetailTypeSchema = z.enum(['studio', 'personal', 'bodycare']).openapi({
  title: 'LessonDetailType',
  description: 'Lesson content type (drives type badge + time-row label)',
});

// ─── Detail sub-entities ────────────────────────────────────────────────────

export const LessonImageSchema = z
  .object({
    order: z
      .number()
      .int()
      .positive()
      .openapi({ example: 1, description: 'Display order; 1 = main image' }),
    url: z.string().openapi({ example: '/mock/lessons/yoga-1.jpg', description: 'Image source' }),
  })
  .openapi({ title: 'LessonImage', description: 'Lesson gallery image' });

export const RestrictionSetSchema = z
  .object({
    restricted_main_contracts: z
      .array(z.string())
      .openapi({ example: ['プレミアム会員'], description: 'Empty → 制限なし' }),
    restricted_option_contracts: z
      .array(z.string())
      .openapi({ example: [], description: 'Empty → 制限なし' }),
    per_use_fee: z
      .number()
      .nullable()
      .optional()
      .openapi({ example: null, description: 'Non-null only when pricing_type === paid' }),
  })
  .openapi({ title: 'RestrictionSet', description: 'Reservation restriction + per-use fee' });

export const LessonContentDetailSchema = z
  .object({
    id: z
      .string()
      .openapi({ example: 'LSN-0001', description: 'Master ID (LSN-* / PLN-* / BDC-*)' }),
    name: z.string().max(255).openapi({ example: 'ヨガベーシック', description: 'Lesson name' }),
    lesson_type: LessonDetailTypeSchema.openapi({ example: 'studio' }),
    brand: LessonBrandSchema.openapi({ example: 'joyfit' }),
    status: LessonContentStatusSchema.openapi({ example: 'active' }),
    duration: z
      .number()
      .int()
      .openapi({ example: 60, description: 'Minutes (実施/セッション時間)' }),
    pricing_type: LessonPricingTypeSchema.openapi({ example: 'included' }),
    per_use_fee: z
      .number()
      .nullable()
      .optional()
      .openapi({ example: null, description: 'Yen; non-null only for pricing_type === paid' }),
    images: z.array(LessonImageSchema).openapi({ description: 'Gallery images' }),
    description: z.string().max(1000).nullable().optional().openapi({ example: '初心者向け…' }),
    internal_memo: z
      .string()
      .max(1000)
      .nullable()
      .optional()
      .openapi({ example: 'マットは各自持参' }),
    restriction: RestrictionSetSchema,
    usage_count: z
      .number()
      .int()
      .openapi({ example: 3, description: 'Schedules using this master (gates delete)' }),
    schedule_total: z.number().int().openapi({ example: 12, description: 'Total schedule count' }),
    store_id: z.string().openapi({ example: 'store-001' }),
    created_at: z.string().nullable().optional().openapi({ example: '2026-01-10T00:00:00.000Z' }),
    updated_at: z.string().nullable().optional().openapi({ example: '2026-05-02T00:00:00.000Z' }),
  })
  .openapi({ title: 'LessonContentDetail', description: 'Unified lesson content master detail' });

export const GetLessonContentDetailResponseSchema = z
  .object({
    data: LessonContentDetailSchema,
  })
  .openapi({
    title: 'GetLessonContentDetailResponse',
    description: 'Lesson content detail response',
  });

// ─── Schedules ──────────────────────────────────────────────────────────────

export const InstructorRefSchema = z
  .object({
    instructor_id: z
      .string()
      .openapi({ example: 'INS-001', description: 'D-04 master link target' }),
    name: z.string().openapi({ example: '山田 花子' }),
  })
  .openapi({ title: 'InstructorRef', description: 'Schedule instructor reference' });

export const RecurringPatternSchema = z
  .object({
    id: z.string().openapi({ example: 'RPT-001' }),
    days: z.array(z.string()).openapi({ example: ['月', '水', '金'] }),
    time: z.string().openapi({ example: '10:00–11:00' }),
    studio: z.string().openapi({ example: 'スタジオA' }),
    period: z.string().nullable().optional().openapi({ example: '2026/04–2026/09' }),
    instructors: z
      .array(InstructorRefSchema)
      .openapi({ description: 'Multi-instructor (n名), each links to D-04' }),
  })
  .openapi({ title: 'RecurringPattern', description: 'Recurring schedule pattern' });

export const ScheduleSessionSchema = z
  .object({
    id: z.string().openapi({ example: 'SCH-1001', description: 'Row → reservation screen' }),
    date: z.string().openapi({ example: '2026-06-28' }),
    time: z.string().openapi({ example: '10:00–11:00' }),
    studio: z.string().openapi({ example: 'スタジオA' }),
    booked: z.number().int().openapi({ example: 18 }),
    capacity: z.number().int().openapi({ example: 20 }),
  })
  .openapi({ title: 'ScheduleSession', description: 'Per-session schedule row' });

export const ScheduleSummarySchema = z
  .object({
    recurring_patterns: z.array(RecurringPatternSchema),
    sessions: z.array(ScheduleSessionSchema),
    total: z.number().int().openapi({ example: 12, description: 'Total session count' }),
  })
  .openapi({ title: 'ScheduleSummary', description: 'Recurring patterns + sessions + total' });

export const GetLessonContentSchedulesResponseSchema = z
  .object({
    data: ScheduleSummarySchema,
  })
  .openapi({
    title: 'GetLessonContentSchedulesResponse',
    description: 'Lesson content schedules response',
  });

// ─── Change history ───────────────────────────────────────────────────────

export const ChangeHistoryEntrySchema = z
  .object({
    id: z.string().openapi({ example: 'HIS-001' }),
    timestamp: z.string().openapi({ example: '2026-05-02T09:30:00.000Z', description: '日時' }),
    operator: z.string().openapi({ example: '本部 管理者', description: '操作者' }),
    action: z.string().openapi({ example: '編集', description: '操作' }),
    detail: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: '実施時間: 45分 → 60分', description: '変更内容' }),
  })
  .openapi({ title: 'ChangeHistoryEntry', description: 'Change-log entry' });

export const ChangeHistorySchema = z
  .object({
    entries: z.array(ChangeHistoryEntrySchema),
    total: z.number().int().openapi({ example: 2 }),
  })
  .openapi({ title: 'ChangeHistory', description: 'Change-log list + total' });

export const GetLessonContentHistoryResponseSchema = z
  .object({
    data: ChangeHistorySchema,
  })
  .openapi({
    title: 'GetLessonContentHistoryResponse',
    description: 'Lesson content change history response',
  });

// ─── Type exports ────────────────────────────────────────────────────────

export type LessonDetailType = z.infer<typeof LessonDetailTypeSchema>;
export type LessonImage = z.infer<typeof LessonImageSchema>;
export type RestrictionSet = z.infer<typeof RestrictionSetSchema>;
export type LessonContentDetail = z.infer<typeof LessonContentDetailSchema>;
export type GetLessonContentDetailResponse = z.infer<typeof GetLessonContentDetailResponseSchema>;
export type InstructorRef = z.infer<typeof InstructorRefSchema>;
export type RecurringPattern = z.infer<typeof RecurringPatternSchema>;
export type ScheduleSession = z.infer<typeof ScheduleSessionSchema>;
export type ScheduleSummary = z.infer<typeof ScheduleSummarySchema>;
export type GetLessonContentSchedulesResponse = z.infer<
  typeof GetLessonContentSchedulesResponseSchema
>;
export type ChangeHistoryEntry = z.infer<typeof ChangeHistoryEntrySchema>;
export type ChangeHistory = z.infer<typeof ChangeHistorySchema>;
export type GetLessonContentHistoryResponse = z.infer<typeof GetLessonContentHistoryResponseSchema>;
