import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { StoreListBrandSchema } from './store.schema';

extendZodWithOpenApi(z);

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const RoleClassificationSchema = z
  .enum(['trainer', 'instructor', 'body_care_therapist'])
  .openapi({
    title: 'RoleClassification',
    description: '役割区分（トレーナー/インストラクター/ボディケアセラピスト）',
  });

export const InstructorStatusSchema = z.enum(['active', 'inactive']).openapi({
  title: 'InstructorStatus',
  description: '指導者ステータス（有効/無効）',
});

export const InstructorTabSchema = z.enum(['studio', 'pt']).openapi({
  title: 'InstructorTab',
  description: '指導者一覧タブ（スタジオインストラクター/パーソナルトレーナー）',
});

export const MinBookingLeadHoursSchema = z
  .union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(6),
    z.literal(12),
    z.literal(24),
    z.literal(48),
    z.literal(72),
  ])
  .openapi({ title: 'MinBookingLeadHours', description: '最短予約受付時間（時間単位）' });

export const BufferMinutesSchema = z
  .union([z.literal(0), z.literal(15), z.literal(30), z.literal(45), z.literal(60)])
  .openapi({ title: 'BufferMinutes', description: '前後バッファ時間（分単位）' });

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export const BufferSettingsSchema = z
  .object({
    min_booking_lead_hours: MinBookingLeadHoursSchema,
    pre_buffer_minutes: BufferMinutesSchema,
    post_buffer_minutes: BufferMinutesSchema,
  })
  .openapi({ title: 'BufferSettings', description: '予約バッファ設定' });

export const CrmAccountLinkSchema = z
  .object({
    staff_id: z.string().openapi({ example: 'STF-0010', description: 'CRMスタッフID' }),
    staff_name: z.string().openapi({ example: '山田 太郎', description: 'スタッフ氏名' }),
    staff_role: z.string().openapi({ example: 'trainer', description: 'スタッフ権限ロール' }),
  })
  .openapi({ title: 'CrmAccountLink', description: 'CRMアカウント紐づけ情報' });

export const PerformanceSummarySchema = z
  .object({
    weekly_lesson_count: z.number().int().min(0).openapi({ description: '週間レッスン数' }),
    average_reservation_rate: z.number().min(0).max(100).openapi({ description: '平均予約率(%)' }),
    average_rating: z
      .number()
      .min(0)
      .max(5)
      .nullable()
      .openapi({ description: '評価平均（未設定の場合はnull）' }),
    monthly_participant_count: z.number().int().min(0).openapi({ description: '今月参加者数' }),
  })
  .openapi({ title: 'PerformanceSummary', description: '実績サマリー' });

export const AssignedLessonSummarySchema = z
  .object({
    lesson_id: z.string().openapi({ example: 'LSN-0001', description: 'レッスンID' }),
    lesson_name: z.string().openapi({ example: 'ヨガ基礎', description: 'レッスン名' }),
    weekdays: z
      .array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']))
      .min(1)
      .max(7)
      .openapi({ description: '曜日配列' }),
    time: z.string().openapi({ example: '19:00', description: '開始時刻 HH:mm' }),
    reservation_rate: z.number().int().min(0).max(100).openapi({ description: '予約率(%)' }),
  })
  .openapi({ title: 'AssignedLessonSummary', description: '担当レッスン概要' });

export const UpcomingScheduleEntrySchema = z
  .object({
    schedule_id: z.string().openapi({ example: 'SCH-1001', description: 'スケジュールID' }),
    lesson_name: z.string().openapi({ example: 'ヨガ基礎', description: 'レッスン名' }),
    studio_name: z
      .string()
      .nullable()
      .openapi({ example: 'スタジオA', description: 'スタジオ名（未設定の場合null）' }),
    date: z.string().openapi({ example: '2026-07-08', description: '開催日 YYYY-MM-DD' }),
    time: z.string().openapi({ example: '19:00', description: '開始時刻 HH:mm' }),
    booked_count: z.number().int().min(0).openapi({ example: 15, description: '予約済み人数' }),
    capacity: z.number().int().min(0).openapi({ example: 20, description: '定員' }),
    is_recurring: z.boolean().openapi({ description: '繰り返し設定由来かどうか' }),
  })
  .openapi({ title: 'UpcomingScheduleEntry', description: '直近スケジュール個別エントリ' });

export const RecurringSettingSummarySchema = z
  .object({
    pattern_text: z
      .string()
      .openapi({ example: '毎週 月・水 19:00', description: '繰り返しパターン表示文字列' }),
    active_count: z.number().int().min(0).openapi({ description: '有効な繰り返し設定数' }),
  })
  .openapi({ title: 'RecurringSettingSummary', description: '繰り返し設定サマリー' });

export const InstructorSchema = z
  .object({
    instructor_id: z.string().openapi({ example: 'INS-0001', description: '指導者ID' }),
    last_name: z.string().min(1).max(50).openapi({ example: '山田', description: '氏名・姓' }),
    first_name: z.string().min(1).max(50).openapi({ example: '太郎', description: '氏名・名' }),
    romaji_last_name: z
      .string()
      .max(50)
      .nullable()
      .openapi({ example: 'Yamada', description: '英字表記・Last Name' }),
    romaji_first_name: z
      .string()
      .max(50)
      .nullable()
      .openapi({ example: 'Taro', description: '英字表記・First Name' }),
    nickname: z
      .string()
      .max(50)
      .nullable()
      .openapi({ example: 'タロウ', description: 'ニックネーム' }),
    role_classifications: z
      .array(RoleClassificationSchema)
      .min(1)
      .max(3)
      .openapi({ description: '役割区分（1〜3件）' }),
    profile_text: z.string().max(2000).nullable().openapi({ description: 'プロフィール文' }),
    instructing_history: z.string().max(2000).nullable().openapi({ description: '指導歴' }),
    photo_url: z.string().nullable().openapi({ description: 'プロフィール画像URL' }),
    status: InstructorStatusSchema,
    buffer_settings: BufferSettingsSchema,
    crm_account_link: CrmAccountLinkSchema.nullable().openapi({
      description: 'CRMアカウント紐づけ（未紐づけの場合null）',
    }),
    assigned_schedule_count: z
      .number()
      .int()
      .min(0)
      .openapi({ description: '割当済みスケジュール数（削除ガード判定に使用）' }),
    created_at: z.string().openapi({ description: '登録日時 ISO-8601' }),
    updated_at: z.string().openapi({ description: '更新日時 ISO-8601' }),
  })
  .openapi({ title: 'Instructor', description: '指導者詳細（フル情報）' });

export const InstructorChangeHistoryEntrySchema = z
  .object({
    timestamp: z.string().openapi({ description: '変更日時 ISO-8601' }),
    operator: z.string().openapi({ example: '本部 佐藤', description: '操作者' }),
    field: z.string().optional().openapi({ description: '変更フィールド（新規作成時は省略）' }),
    before: z.string().optional().openapi({ description: '変更前の値（新規作成時は省略）' }),
    after: z.string().optional().openapi({ description: '変更後の値（新規作成時は省略）' }),
    is_creation: z.boolean().openapi({ description: '新規作成エントリかどうか' }),
  })
  .openapi({ title: 'InstructorChangeHistoryEntry', description: '指導者変更履歴の1行' });

// ---------------------------------------------------------------------------
// Response models
// ---------------------------------------------------------------------------

export const GetInstructorDetailResponseSchema = z
  .object({
    data: InstructorSchema,
    performance_summary: PerformanceSummarySchema,
    assigned_lessons: z.array(AssignedLessonSummarySchema),
    upcoming_schedule: z.object({
      recurring_summary: z.array(RecurringSettingSummarySchema),
      entries: z.array(UpcomingScheduleEntrySchema),
    }),
  })
  .openapi({ title: 'GetInstructorDetailResponse', description: '指導者詳細レスポンス' });

export const GetInstructorHistoryResponseSchema = z
  .object({
    entries: z.array(InstructorChangeHistoryEntrySchema),
    total: z.number().int().min(0),
  })
  .openapi({ title: 'GetInstructorHistoryResponse', description: '指導者変更履歴レスポンス' });

// ---------------------------------------------------------------------------
// Create / Update / Status request schemas
// ---------------------------------------------------------------------------

export const CreateInstructorRequestSchema = z
  .object({
    last_name: z
      .string()
      .min(1)
      .max(50)
      .openapi({ example: '山田', description: '氏名・姓（必須）' }),
    first_name: z
      .string()
      .min(1)
      .max(50)
      .openapi({ example: '太郎', description: '氏名・名（必須）' }),
    romaji_last_name: z
      .string()
      .max(50)
      .nullable()
      .optional()
      .openapi({ example: 'Yamada', description: '英字表記・Last Name' }),
    romaji_first_name: z
      .string()
      .max(50)
      .nullable()
      .optional()
      .openapi({ example: 'Taro', description: '英字表記・First Name' }),
    nickname: z.string().max(50).nullable().optional().openapi({ description: 'ニックネーム' }),
    role_classifications: z
      .array(RoleClassificationSchema)
      .min(1)
      .max(3)
      .openapi({ description: '役割区分（1〜3件、必須）' }),
    profile_text: z
      .string()
      .max(2000)
      .nullable()
      .optional()
      .openapi({ description: 'プロフィール文' }),
    instructing_history: z
      .string()
      .max(2000)
      .nullable()
      .optional()
      .openapi({ description: '指導歴' }),
    photo_url: z.string().nullable().optional().openapi({ description: 'プロフィール画像URL' }),
    buffer_settings: BufferSettingsSchema.partial()
      .optional()
      .openapi({ description: '予約バッファ設定（省略時は全て0）' }),
    crm_account_link_staff_id: z
      .string()
      .nullable()
      .optional()
      .openapi({ description: '紐づけるCRMスタッフID' }),
  })
  .openapi({ title: 'CreateInstructorRequest', description: '指導者登録リクエスト' });

export const UpdateInstructorRequestSchema = CreateInstructorRequestSchema.partial().openapi({
  title: 'UpdateInstructorRequest',
  description: '指導者更新リクエスト（部分更新可）',
});

export const UpdateInstructorStatusRequestSchema = z
  .object({
    status: InstructorStatusSchema,
  })
  .openapi({
    title: 'UpdateInstructorStatusRequest',
    description: '指導者ステータス変更リクエスト',
  });

// ---------------------------------------------------------------------------
// Re-exports used by routes/components
// ---------------------------------------------------------------------------

export { StoreListBrandSchema as InstructorBrandSchema };

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type RoleClassification = z.infer<typeof RoleClassificationSchema>;
export type InstructorStatus = z.infer<typeof InstructorStatusSchema>;
export type InstructorTab = z.infer<typeof InstructorTabSchema>;
export type BufferSettings = z.infer<typeof BufferSettingsSchema>;
export type CrmAccountLink = z.infer<typeof CrmAccountLinkSchema>;
export type PerformanceSummary = z.infer<typeof PerformanceSummarySchema>;
export type AssignedLessonSummary = z.infer<typeof AssignedLessonSummarySchema>;
export type UpcomingScheduleEntry = z.infer<typeof UpcomingScheduleEntrySchema>;
export type RecurringSettingSummary = z.infer<typeof RecurringSettingSummarySchema>;
export type Instructor = z.infer<typeof InstructorSchema>;
export type InstructorChangeHistoryEntry = z.infer<typeof InstructorChangeHistoryEntrySchema>;
export type GetInstructorDetailResponse = z.infer<typeof GetInstructorDetailResponseSchema>;
export type GetInstructorHistoryResponse = z.infer<typeof GetInstructorHistoryResponseSchema>;
export type CreateInstructorRequest = z.infer<typeof CreateInstructorRequestSchema>;
export type UpdateInstructorRequest = z.infer<typeof UpdateInstructorRequestSchema>;
export type UpdateInstructorStatusRequest = z.infer<typeof UpdateInstructorStatusRequestSchema>;

// ---------------------------------------------------------------------------
// Name helpers — join last_name+first_name for display-only surfaces (list items,
// legacy picker). Storage and the full Instructor entity keep the parts separate.
// ---------------------------------------------------------------------------

export function joinFullName(lastName: string, firstName: string): string {
  return [lastName, firstName].filter((part) => part.trim().length > 0).join(' ');
}
