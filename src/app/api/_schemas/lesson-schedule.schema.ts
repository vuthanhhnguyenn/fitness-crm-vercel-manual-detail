import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { ErrorResponseSchema } from './auth.schema';

extendZodWithOpenApi(z);

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const LessonTypeSchema = z
  .enum(['studio', 'personal'])
  .openapi({ title: 'LessonType', description: 'レッスン種別（スタジオ/パーソナル）' });

export const LessonScheduleStatusSchema = z
  .enum(['scheduled', 'in_progress', 'completed', 'cancelled'])
  .openapi({
    title: 'LessonScheduleStatus',
    description: 'レッスンスケジュールステータス',
  });

export const PaymentStatusSchema = z
  .enum(['paid', 'unpaid', 'partial'])
  .openapi({ title: 'PaymentStatus', description: '支払いステータス' });

export const ScheduleAxisSchema = z
  .enum(['store', 'my_schedule'])
  .openapi({ title: 'ScheduleAxis', description: '表示軸（店舗/マイスケジュール）' });

export const ScheduleViewModeSchema = z
  .enum(['day', 'week', 'list'])
  .openapi({ title: 'ScheduleViewMode', description: '表示モード（日/週/リスト）' });

export const ScheduleSortBySchema = z
  .enum(['start_time', 'lesson_name', 'studio_name', 'instructor_name', 'booked_count', 'status'])
  .openapi({ title: 'ScheduleSortBy', description: 'ソートキー' });

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export const BookedMemberSchema = z
  .object({
    member_id: z.string().openapi({ example: 'M001', description: '会員ID' }),
    name: z.string().openapi({ example: '山田 太郎', description: '会員氏名' }),
  })
  .openapi({ title: 'BookedMember', description: '予約会員' });

export const LessonScheduleListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'LS001', description: 'スケジュールID' }),
    lesson_name: z.string().openapi({ example: 'ヨガ入門', description: 'レッスン名' }),
    lesson_type: LessonTypeSchema,
    studio_name: z.string().nullable().openapi({ example: 'スタジオA', description: 'スタジオ名' }),
    instructor_id: z.string().openapi({ example: 'S001', description: 'インストラクターID' }),
    instructor_name: z
      .string()
      .openapi({ example: '田中 花子', description: 'インストラクター名' }),
    store_id: z.string().openapi({ example: 'ST001', description: '店舗ID' }),
    store_name: z.string().openapi({ example: '渋谷店', description: '店舗名' }),
    start_time: z
      .string()
      .openapi({ example: '2026-06-22T09:00:00+09:00', description: '開始時刻 ISO8601' }),
    end_time: z
      .string()
      .openapi({ example: '2026-06-22T10:00:00+09:00', description: '終了時刻 ISO8601' }),
    capacity: z.number().int().nonnegative().openapi({ example: 20, description: '定員' }),
    booked_count: z.number().int().nonnegative().openapi({ example: 15, description: '予約数' }),
    waiting_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 2, description: 'キャンセル待ち数' }),
    payment_status: PaymentStatusSchema,
    status: LessonScheduleStatusSchema,
    is_alert: z.boolean().openapi({ example: false, description: '要対応アラート' }),
    is_public: z
      .boolean()
      .openapi({ example: true, description: '公開設定（true: 公開, false: 内部/非公開枠）' }),
    last_change_type: z
      .enum(['time', 'instructor'])
      .nullable()
      .optional()
      .openapi({ description: '本日適用された直近の変更種別（KPIの内訳集計専用）' }),
    booked_members: z
      .array(BookedMemberSchema)
      .optional()
      .openapi({ description: '予約会員リスト（my_schedule軸のみ）' }),
    cancel_reason: z
      .string()
      .nullable()
      .optional()
      .openapi({ description: '中止理由コード（status=cancelledの場合のみ設定）' }),
    cancel_reason_detail: z
      .string()
      .nullable()
      .optional()
      .openapi({ description: '中止理由の詳細（status=cancelledの場合のみ設定）' }),
    cancelled_at: z
      .string()
      .nullable()
      .optional()
      .openapi({ description: '中止日時 ISO8601（status=cancelledの場合のみ設定）' }),
    cancelled_by: z
      .string()
      .nullable()
      .optional()
      .openapi({ description: '中止操作を行った担当者名（status=cancelledの場合のみ設定）' }),
  })
  .openapi({ title: 'LessonScheduleListItem', description: 'レッスンスケジュール一覧アイテム' });

export const LessonScheduleKpiSummarySchema = z
  .object({
    date: z.string().openapi({ example: '2026-06-22', description: '対象日付' }),
    total_lessons: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 24, description: '本日のレッスン総数' }),
    total_booked: z.number().int().nonnegative().openapi({ example: 180, description: '予約総数' }),
    total_capacity: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 240, description: '定員総数' }),
    occupancy_rate: z.number().nonnegative().openapi({ example: 75.0, description: '稼働率（%）' }),
    cancelled_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 1, description: 'キャンセル数' }),
    studio_lesson_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 4, description: 'スタジオレッスン数' }),
    personal_lesson_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 2, description: 'パーソナルレッスン数' }),
    occupancy_rate_change_pct: z
      .number()
      .openapi({ example: 3.0, description: '予約充足率の前週比（ポイント差）' }),
    time_changed_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 3, description: '本日の時間変更件数' }),
    instructor_changed_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 2, description: '本日の担当変更件数' }),
    assigned_staff_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 5, description: '本日の担当スタッフ総数' }),
    instructor_staff_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 3, description: '本日の担当スタッフ内インストラクター数' }),
    trainer_staff_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 2, description: '本日の担当スタッフ内トレーナー数' }),
  })
  .openapi({ title: 'LessonScheduleKpiSummary', description: 'レッスンKPIサマリー' });

export const StoreScheduleSummarySchema = z
  .object({
    store_id: z.string().openapi({ example: 'ST001', description: '店舗ID' }),
    store_name: z.string().openapi({ example: '渋谷店', description: '店舗名' }),
    area: z.string().openapi({ example: '東京', description: 'エリア' }),
    total_lessons: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 8, description: '本日のレッスン数' }),
    total_booked: z.number().int().nonnegative().openapi({ example: 60, description: '予約数' }),
    total_capacity: z.number().int().nonnegative().openapi({ example: 80, description: '定員' }),
    occupancy_rate: z.number().nonnegative().openapi({ example: 75.0, description: '稼働率（%）' }),
    alert_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 1, description: 'アラート件数' }),
    assigned_staff_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 3, description: '本日のアサインスタッフ数' }),
    in_progress_lesson_name: z
      .string()
      .nullable()
      .openapi({ example: 'ボディコンバット', description: '実施中レッスン名' }),
    in_progress_start_time: z
      .string()
      .nullable()
      .openapi({ example: '13:00', description: '実施中レッスン開始時刻' }),
  })
  .openapi({ title: 'StoreScheduleSummary', description: '店舗別スケジュールサマリー' });

export const AreaScheduleKpiSummarySchema = z
  .object({
    area: z.string().openapi({ example: '東京', description: 'エリア名' }),
    total_lessons: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 20, description: 'エリアレッスン総数' }),
    total_booked: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 150, description: 'エリア予約総数' }),
    total_capacity: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 200, description: 'エリア定員総数' }),
    occupancy_rate: z
      .number()
      .nonnegative()
      .openapi({ example: 75.0, description: 'エリア稼働率（%）' }),
    alert_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 2, description: 'エリアアラート件数' }),
    store_count: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 3, description: 'エリア内店舗数' }),
  })
  .openapi({ title: 'AreaScheduleKpiSummary', description: 'エリア別KPIサマリー' });

export const ScheduleChangeDraftSchema = z
  .object({
    new_instructor_id: z.string().optional().openapi({ description: '変更後インストラクターID' }),
    new_start_time: z.string().optional().openapi({ description: '変更後開始時刻 ISO8601' }),
    new_end_time: z.string().optional().openapi({ description: '変更後終了時刻 ISO8601' }),
    reason: z.string().optional().openapi({ description: '変更理由' }),
  })
  .openapi({ title: 'ScheduleChangeDraft', description: 'スケジュール変更リクエスト' });

// ---------------------------------------------------------------------------
// Query params
// ---------------------------------------------------------------------------

export const GetLessonSchedulesQuerySchema = z
  .object({
    date: z
      .string()
      .optional()
      .openapi({ example: '2026-06-22', description: '対象日付 YYYY-MM-DD' }),
    week_start: z
      .string()
      .optional()
      .openapi({ example: '2026-06-22', description: '週開始日 YYYY-MM-DD（週表示時）' }),
    store_id: z.string().optional().openapi({ description: '店舗IDフィルター' }),
    studio_name: z.string().optional().openapi({ description: 'スタジオ名フィルター' }),
    instructor_id: z.string().optional().openapi({ description: 'インストラクターIDフィルター' }),
    axis: ScheduleAxisSchema.optional(),
    sort_by: ScheduleSortBySchema.optional(),
    sort_order: z.enum(['asc', 'desc']).optional(),
  })
  .openapi({ title: 'GetLessonSchedulesQuery', description: 'レッスンスケジュール取得クエリ' });

export const GetStoreSummaryQuerySchema = z
  .object({
    date: z.string().optional().openapi({ description: '対象日付 YYYY-MM-DD' }),
    sort_by: z
      .enum(['store_name', 'total_lessons', 'occupancy_rate', 'alert_count'])
      .optional()
      .openapi({ description: '店舗サマリーソートキー' }),
    sort_order: z.enum(['asc', 'desc']).optional(),
  })
  .openapi({ title: 'GetStoreSummaryQuery', description: '店舗サマリー取得クエリ' });

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export const GetLessonSchedulesResponseSchema = z
  .object({
    schedules: z.array(LessonScheduleListItemSchema),
    total: z.number().int().nonnegative(),
  })
  .openapi({
    title: 'GetLessonSchedulesResponse',
    description: 'レッスンスケジュール一覧レスポンス',
  });

export const GetLessonScheduleKpiSummaryResponseSchema = z
  .object({
    kpi: LessonScheduleKpiSummarySchema,
  })
  .openapi({ title: 'GetLessonScheduleKpiSummaryResponse', description: 'KPIサマリーレスポンス' });

export const GetStoreSummaryResponseSchema = z
  .object({
    areas: z.array(AreaScheduleKpiSummarySchema),
    stores: z.array(StoreScheduleSummarySchema),
    total: z.number().int().nonnegative(),
  })
  .openapi({ title: 'GetStoreSummaryResponse', description: '店舗別サマリーレスポンス' });

export const ScheduleChangeResponseSchema = z
  .object({
    message: z
      .string()
      .openapi({ example: 'スケジュールを変更しました', description: '完了メッセージ' }),
    id: z.string().openapi({ example: 'LS001', description: 'スケジュールID' }),
  })
  .openapi({ title: 'ScheduleChangeResponse', description: 'スケジュール変更レスポンス' });

// ---------------------------------------------------------------------------
// Create / Update Request Schemas
// ---------------------------------------------------------------------------

export const CreateLessonScheduleRequestSchema = z
  .object({
    lesson_type: LessonTypeSchema,
    store_id: z.string().min(1).openapi({ example: 'ST001', description: '店舗ID' }),
    studio_id: z.string().optional().openapi({ description: 'スタジオID（studio時必須）' }),
    course_type: z
      .enum(['30min', '60min', 'trial'])
      .optional()
      .openapi({ description: 'コース種別（personal時必須）' }),
    schedule_mode: z
      .enum(['single', 'recurring'])
      .openapi({ description: 'スケジュールモード（単発/繰り返し）' }),
    date: z
      .string()
      .optional()
      .openapi({ example: '2026-07-01', description: '日付 YYYY-MM-DD（single mode）' }),
    start_date: z
      .string()
      .optional()
      .openapi({ example: '2026-07-01', description: '開始日 YYYY-MM-DD（recurring mode）' }),
    start_time: z.string().openapi({ example: '09:00', description: '開始時刻 HH:mm' }),
    repeat_type: z
      .enum(['weekly', 'biweekly', 'monthly'])
      .optional()
      .openapi({ description: '繰り返し種別（recurring時必須）' }),
    days_of_week: z
      .array(z.number().int().min(0).max(6))
      .optional()
      .openapi({ description: '曜日配列 0=日 6=土' }),
    end_condition: z
      .enum(['by_date', 'by_count', 'indefinite'])
      .optional()
      .openapi({ description: '終了条件（recurring時必須）' }),
    end_date: z.string().optional().openapi({ description: '終了日 YYYY-MM-DD' }),
    end_count: z.number().int().min(1).max(100).optional().openapi({ description: '回数 1-100' }),
    skip_holidays: z.boolean().default(false).openapi({ description: '休業日スキップ' }),
    lesson_id: z.string().min(1).openapi({ example: 'LESSON001', description: 'レッスンID' }),
    instructor_ids: z
      .array(z.string())
      .min(1)
      .openapi({ description: 'インストラクターID配列（最小1）' }),
    capacity: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .openapi({ description: '定員（studio時必須）' }),
    is_published: z.boolean().openapi({ description: '公開設定' }),
    trial_enabled: z.boolean().default(false).openapi({ description: '体験枠有効' }),
    trial_mode: z
      .enum(['inclusive', 'additional'])
      .optional()
      .openapi({ description: '体験枠モード（有効時必須）' }),
    trial_capacity: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional()
      .openapi({ description: '体験枠定員 1-5' }),
  })
  .openapi({
    title: 'CreateLessonScheduleRequest',
    description: 'レッスンスケジュール登録リクエスト',
  });

export const CreatedScheduleItemSchema = z
  .object({
    id: z.string().openapi({ description: 'スケジュールID' }),
    date: z.string().openapi({ description: '日付 YYYY-MM-DD' }),
    start_time: z.string().openapi({ description: '開始時刻 HH:mm' }),
    end_time: z.string().openapi({ description: '終了時刻 HH:mm' }),
  })
  .openapi({ title: 'CreatedScheduleItem', description: '作成されたスケジュールアイテム' });

export const CreateLessonScheduleResponseSchema = z
  .object({
    id: z.string().openapi({ example: 'LS-NEW-001', description: '生成されたスケジュールID' }),
    message: z
      .string()
      .openapi({ example: 'スケジュールを登録しました', description: '完了メッセージ' }),
    created_schedules: z.array(CreatedScheduleItemSchema).openapi({
      description: '作成されたスケジュール一覧（単発は1件、繰り返しは複数）',
    }),
  })
  .openapi({
    title: 'CreateLessonScheduleResponse',
    description: 'レッスンスケジュール登録レスポンス',
  });

// ---------------------------------------------------------------------------
// Template Schemas
// ---------------------------------------------------------------------------

export const RepeatTemplateSchema = z
  .object({
    id: z.string().openapi({ description: 'テンプレートID' }),
    name: z.string().openapi({ description: 'テンプレート名' }),
    repeat_type: z.enum(['weekly', 'biweekly', 'monthly']).openapi({ description: '繰り返し種別' }),
    days_of_week: z.array(z.number().int().min(0).max(6)).openapi({ description: '曜日配列' }),
    end_condition: z
      .enum(['by_date', 'by_count', 'indefinite'])
      .openapi({ description: '終了条件' }),
    end_value: z.union([z.string(), z.number(), z.null()]).openapi({ description: '終了値' }),
    skip_holidays: z.boolean().openapi({ description: '休業日スキップ' }),
    start_time: z.string().openapi({ description: '開始時刻 HH:mm' }),
    store_id: z.string().openapi({ description: '店舗ID' }),
    lesson_class: LessonTypeSchema,
    studio_id: z.string().nullable().openapi({ description: 'スタジオID' }),
    lesson_id: z.string().openapi({ description: 'レッスンID' }),
  })
  .openapi({ title: 'RepeatTemplate', description: '繰り返しテンプレート' });

export const CreateTemplateRequestSchema = z
  .object({
    name: z.string().min(1).openapi({ description: 'テンプレート名' }),
    repeat_type: z.enum(['weekly', 'biweekly', 'monthly']).openapi({ description: '繰り返し種別' }),
    days_of_week: z.array(z.number().int().min(0).max(6)).openapi({ description: '曜日配列' }),
    end_condition: z
      .enum(['by_date', 'by_count', 'indefinite'])
      .openapi({ description: '終了条件' }),
    end_value: z.union([z.string(), z.number(), z.null()]).openapi({ description: '終了値' }),
    skip_holidays: z.boolean().openapi({ description: '休業日スキップ' }),
    start_time: z.string().openapi({ description: '開始時刻 HH:mm' }),
    store_id: z.string().openapi({ description: '店舗ID' }),
    lesson_class: LessonTypeSchema,
    studio_id: z.string().nullable().openapi({ description: 'スタジオID' }),
    lesson_id: z.string().openapi({ description: 'レッスンID' }),
  })
  .openapi({ title: 'CreateTemplateRequest', description: 'テンプレート作成リクエスト' });

export const GetTemplatesResponseSchema = z
  .object({
    templates: z.array(RepeatTemplateSchema),
  })
  .openapi({ title: 'GetTemplatesResponse', description: 'テンプレート一覧レスポンス' });

export const CreateTemplateResponseSchema = z
  .object({
    id: z.string().openapi({ description: '作成されたテンプレートID' }),
    message: z
      .string()
      .openapi({ example: 'テンプレートを保存しました', description: '完了メッセージ' }),
  })
  .openapi({ title: 'CreateTemplateResponse', description: 'テンプレート作成レスポンス' });

export const DeleteTemplateResponseSchema = z
  .object({
    message: z
      .string()
      .openapi({ example: 'テンプレートを削除しました', description: '完了メッセージ' }),
  })
  .openapi({ title: 'DeleteTemplateResponse', description: 'テンプレート削除レスポンス' });

// ---------------------------------------------------------------------------
// Master data (studios / lessons / instructors)
// ---------------------------------------------------------------------------

export const StudioListItemSchema = z
  .object({
    id: z.string().openapi({ description: 'スタジオID' }),
    name: z.string().openapi({ description: 'スタジオ名' }),
    physical_capacity: z.number().int().nonnegative().openapi({ description: '物理定員' }),
    store_id: z.string().openapi({ description: '店舗ID' }),
  })
  .openapi({ title: 'StudioListItem', description: 'スタジオ一覧アイテム' });

export const GetStudiosQuerySchema = z
  .object({
    store_id: z.string().optional().openapi({ description: '店舗IDでフィルタ' }),
  })
  .openapi({ title: 'GetStudiosQuery', description: 'スタジオ一覧クエリ' });

export const GetStudiosResponseSchema = z
  .object({
    studios: z.array(StudioListItemSchema),
  })
  .openapi({ title: 'GetStudiosResponse', description: 'スタジオ一覧レスポンス' });

export const LessonListItemSchema = z
  .object({
    id: z.string().openapi({ description: 'レッスンID' }),
    name: z.string().openapi({ description: 'レッスン名' }),
    lesson_type: LessonTypeSchema,
    duration: z.number().int().nonnegative().openapi({ description: '所要時間（分）' }),
  })
  .openapi({ title: 'LessonListItem', description: 'レッスン一覧アイテム' });

export const GetLessonsQuerySchema = z
  .object({
    lesson_type: LessonTypeSchema.optional().openapi({ description: 'レッスン種別でフィルタ' }),
  })
  .openapi({ title: 'GetLessonsQuery', description: 'レッスン一覧クエリ' });

export const GetLessonsResponseSchema = z
  .object({
    lessons: z.array(LessonListItemSchema),
  })
  .openapi({ title: 'GetLessonsResponse', description: 'レッスン一覧レスポンス' });

export const InstructorListItemSchema = z
  .object({
    instructor_id: z.string().openapi({ description: 'インストラクターID' }),
    instructor_name: z.string().openapi({ description: 'インストラクター名' }),
    store_id: z.string().openapi({ description: '店舗ID' }),
    role: z.string().openapi({ description: '役割' }),
    photo_url: z.string().optional().openapi({ description: 'プロフィール画像URL' }),
    nickname: z.string().nullable().optional().openapi({ description: 'ニックネーム（D-04）' }),
    romaji_name: z.string().nullable().optional().openapi({ description: '英字表記（D-04）' }),
    role_classifications: z
      .array(z.enum(['trainer', 'instructor', 'body_care_therapist']))
      .optional()
      .openapi({ description: '役割区分（D-04）' }),
    tab: z.enum(['studio', 'pt']).optional().openapi({ description: '一覧タブ区分（D-04）' }),
    brands: z
      .array(z.enum(['joyfit', 'joyfit24', 'joyfit_yoga', 'joyfit_plus', 'fit365']))
      .optional()
      .openapi({ description: '割当スケジュールから導出されるブランド（D-04）' }),
    status: z
      .enum(['active', 'inactive'])
      .optional()
      .openapi({ description: '指導者ステータス（D-04）' }),
  })
  .openapi({ title: 'InstructorListItem', description: 'インストラクター一覧アイテム' });

export const GetInstructorsQuerySchema = z
  .object({
    store_id: z.string().optional().openapi({ description: '店舗IDでフィルタ' }),
    role: z.string().optional().openapi({ description: '役割でフィルタ' }),
    tab: z.enum(['studio', 'pt']).optional().openapi({ description: '一覧タブでフィルタ（D-04）' }),
    search: z
      .string()
      .optional()
      .openapi({ description: '氏名・ニックネーム・英字表記・IDで検索（D-04）' }),
    brand: z
      .enum(['joyfit', 'joyfit24', 'joyfit_yoga', 'joyfit_plus', 'fit365'])
      .optional()
      .openapi({ description: 'ブランドでフィルタ（D-04）' }),
    status: z
      .enum(['active', 'inactive'])
      .optional()
      .openapi({ description: 'ステータスでフィルタ（D-04）' }),
  })
  .openapi({ title: 'GetInstructorsQuery', description: 'インストラクター一覧クエリ' });

export const GetInstructorsResponseSchema = z
  .object({
    instructors: z.array(InstructorListItemSchema),
  })
  .openapi({ title: 'GetInstructorsResponse', description: 'インストラクター一覧レスポンス' });

// ---------------------------------------------------------------------------
// Instructor Availability
// ---------------------------------------------------------------------------

export const InstructorAvailabilityQuerySchema = z
  .object({
    instructor_id: z.string().openapi({ description: 'インストラクターID' }),
    date: z.string().openapi({ example: '2026-07-01', description: '対象日付' }),
    start_time: z.string().openapi({ example: '09:00', description: '開始時刻 HH:mm' }),
    day_of_week: z
      .number()
      .int()
      .min(0)
      .max(6)
      .optional()
      .openapi({ description: '曜日（繰り返し確認用）' }),
  })
  .openapi({ title: 'InstructorAvailabilityQuery', description: 'インストラクター空き確認クエリ' });

export const InstructorAvailabilityResponseSchema = z
  .object({
    available: z.boolean().openapi({ description: '空きあり' }),
    conflicts: z
      .array(
        z.object({
          schedule_id: z.string().openapi({ description: 'スケジュールID' }),
          lesson_name: z.string().openapi({ description: 'レッスン名' }),
          start_time: z.string().openapi({ description: '開始時刻' }),
          end_time: z.string().openapi({ description: '終了時刻' }),
        }),
      )
      .openapi({ description: '重複スケジュール一覧' }),
  })
  .openapi({
    title: 'InstructorAvailabilityResponse',
    description: 'インストラクター空き確認レスポンス',
  });

// ---------------------------------------------------------------------------
// Store Holiday
// ---------------------------------------------------------------------------

export const StoreHolidaysQuerySchema = z
  .object({
    from: z.string().openapi({ example: '2026-07-01', description: '開始日' }),
    to: z.string().openapi({ example: '2026-07-31', description: '終了日' }),
  })
  .openapi({ title: 'StoreHolidaysQuery', description: '店舗休業日クエリ' });

export const StoreHolidaysResponseSchema = z
  .object({
    holidays: z
      .array(
        z.object({
          date: z.string().openapi({ description: '日付' }),
          name: z.string().openapi({ description: '休業日名' }),
        }),
      )
      .openapi({ description: '休業日一覧' }),
  })
  .openapi({ title: 'StoreHolidaysResponse', description: '店舗休業日レスポンス' });

// ---------------------------------------------------------------------------
// Manual Reservation (D-01 FR-006, Mode B input)
// ---------------------------------------------------------------------------

export const ManualReservationPlanSchema = z.enum(['monthly', 'per_use']).openapi({
  title: 'ManualReservationPlan',
  description: '会員プラン種別（月次プラン/都度払い）',
});

export const ManualReservationCourseSchema = z
  .enum(['monthly', 'single_30', 'single_60'])
  .openapi({ title: 'ManualReservationCourse', description: 'コース種別' });

export const ManualReservationMemberSchema = z
  .object({
    member_id: z.string().openapi({ example: 'M-1024', description: '会員ID' }),
    name: z.string().openapi({ example: '田中 花子', description: '会員氏名' }),
    plan: ManualReservationPlanSchema,
    remaining: z
      .number()
      .int()
      .nullable()
      .openapi({ example: 3, description: '残回数（都度払いはnull）' }),
    penalty_until: z
      .string()
      .nullable()
      .openapi({ example: null, description: '予約不可期間の終了日（該当なしはnull）' }),
  })
  .openapi({ title: 'ManualReservationMember', description: '手動予約対象会員' });

export const GetManualReservationMembersResponseSchema = z
  .object({
    members: z.array(ManualReservationMemberSchema),
  })
  .openapi({
    title: 'GetManualReservationMembersResponse',
    description: '手動予約対象会員一覧レスポンス',
  });

export const CreateManualReservationRequestSchema = z
  .object({
    member_id: z.string().min(1).openapi({ example: 'M-1024', description: '会員ID' }),
    schedule_id: z.string().min(1).openapi({ example: 'LS0001', description: 'セッション枠ID' }),
    course: ManualReservationCourseSchema,
    note: z.string().max(1000).optional().openapi({ description: '備考' }),
  })
  .openapi({ title: 'CreateManualReservationRequest', description: '手動予約登録リクエスト' });

export const CreateManualReservationResponseSchema = z
  .object({
    message: z.string().openapi({ example: '予約を登録しました' }),
    description: z.string().openapi({
      example:
        '田中 花子 様の予約をスケジュールに反映しました。モバイルアプリへ予約確定通知を送信します',
    }),
  })
  .openapi({ title: 'CreateManualReservationResponse', description: '手動予約登録レスポンス' });

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type LessonType = z.infer<typeof LessonTypeSchema>;
export type LessonScheduleStatus = z.infer<typeof LessonScheduleStatusSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type ScheduleAxis = z.infer<typeof ScheduleAxisSchema>;
export type ScheduleViewMode = z.infer<typeof ScheduleViewModeSchema>;
export type ScheduleSortBy = z.infer<typeof ScheduleSortBySchema>;
export type BookedMember = z.infer<typeof BookedMemberSchema>;
export type LessonScheduleListItem = z.infer<typeof LessonScheduleListItemSchema>;
export type LessonScheduleKpiSummary = z.infer<typeof LessonScheduleKpiSummarySchema>;
export type StoreScheduleSummary = z.infer<typeof StoreScheduleSummarySchema>;
export type AreaScheduleKpiSummary = z.infer<typeof AreaScheduleKpiSummarySchema>;
export type ScheduleChangeDraft = z.infer<typeof ScheduleChangeDraftSchema>;
export type GetLessonSchedulesQuery = z.infer<typeof GetLessonSchedulesQuerySchema>;
export type GetStoreSummaryQuery = z.infer<typeof GetStoreSummaryQuerySchema>;
export type GetLessonSchedulesResponse = z.infer<typeof GetLessonSchedulesResponseSchema>;
export type GetLessonScheduleKpiSummaryResponse = z.infer<
  typeof GetLessonScheduleKpiSummaryResponseSchema
>;
export type GetStoreSummaryResponse = z.infer<typeof GetStoreSummaryResponseSchema>;
export type ScheduleChangeResponse = z.infer<typeof ScheduleChangeResponseSchema>;
export type CreateLessonScheduleRequest = z.infer<typeof CreateLessonScheduleRequestSchema>;
export type CreateLessonScheduleResponse = z.infer<typeof CreateLessonScheduleResponseSchema>;
export type CreatedScheduleItem = z.infer<typeof CreatedScheduleItemSchema>;
export type RepeatTemplate = z.infer<typeof RepeatTemplateSchema>;
export type CreateTemplateRequest = z.infer<typeof CreateTemplateRequestSchema>;
export type GetTemplatesResponse = z.infer<typeof GetTemplatesResponseSchema>;
export type CreateTemplateResponse = z.infer<typeof CreateTemplateResponseSchema>;
export type DeleteTemplateResponse = z.infer<typeof DeleteTemplateResponseSchema>;
export type InstructorAvailabilityQuery = z.infer<typeof InstructorAvailabilityQuerySchema>;
export type InstructorAvailabilityResponse = z.infer<typeof InstructorAvailabilityResponseSchema>;
export type ManualReservationPlan = z.infer<typeof ManualReservationPlanSchema>;
export type ManualReservationCourse = z.infer<typeof ManualReservationCourseSchema>;
export type ManualReservationMember = z.infer<typeof ManualReservationMemberSchema>;
export type GetManualReservationMembersResponse = z.infer<
  typeof GetManualReservationMembersResponseSchema
>;
export type CreateManualReservationRequest = z.infer<typeof CreateManualReservationRequestSchema>;
export type CreateManualReservationResponse = z.infer<typeof CreateManualReservationResponseSchema>;
export type StoreHolidaysQuery = z.infer<typeof StoreHolidaysQuerySchema>;
export type StoreHolidaysResponse = z.infer<typeof StoreHolidaysResponseSchema>;
export type StudioListItem = z.infer<typeof StudioListItemSchema>;
export type GetStudiosQuery = z.infer<typeof GetStudiosQuerySchema>;
export type GetStudiosResponse = z.infer<typeof GetStudiosResponseSchema>;
export type LessonListItem = z.infer<typeof LessonListItemSchema>;
export type GetLessonsQuery = z.infer<typeof GetLessonsQuerySchema>;
export type GetLessonsResponse = z.infer<typeof GetLessonsResponseSchema>;
export type InstructorListItem = z.infer<typeof InstructorListItemSchema>;
export type GetInstructorsQuery = z.infer<typeof GetInstructorsQuerySchema>;
export type GetInstructorsResponse = z.infer<typeof GetInstructorsResponseSchema>;

export { ErrorResponseSchema };
