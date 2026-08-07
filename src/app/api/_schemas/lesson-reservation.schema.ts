import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { ErrorResponseSchema } from './auth.schema';

extendZodWithOpenApi(z);

export const ReservationStatusSchema = z
  .enum(['confirmed', 'tentative', 'attended', 'no_show', 'cancelled'])
  .openapi({ title: 'ReservationStatus', description: '予約ステータス' });

export const AttendanceStatusSchema = z
  .enum(['unconfirmed', 'confirmed', 'no_show'])
  .openapi({ title: 'AttendanceStatus', description: '出席ステータス' });

export const CancelTypeSchema = z
  .enum(['member', 'staff', 'instructor'])
  .openapi({ title: 'CancelType', description: 'キャンセル種別' });

export const ReservationSchema = z
  .object({
    id: z.string().openapi({ example: 'R001', description: '予約ID' }),
    schedule_id: z.string().openapi({ example: 'LS001', description: 'レッスンスケジュールID' }),
    member_id: z.string().openapi({ example: 'M001', description: '会員ID' }),
    member_name: z.string().openapi({ example: '山田 太郎', description: '会員名' }),
    plan_type: z.string().openapi({ example: '月額8回', description: 'プラン種別' }),
    space_number: z.string().nullable().openapi({ example: 'S03', description: 'スペース番号' }),
    reservation_date: z.string().openapi({ example: '2026-06-23', description: '予約日' }),
    reservation_time: z.string().openapi({ example: '09:15', description: '予約時間' }),
    status: ReservationStatusSchema,
    attendance_status: AttendanceStatusSchema,
    cancel_type: CancelTypeSchema.nullable().openapi({ description: 'キャンセル種別' }),
    penalty_active: z.boolean().default(false).openapi({ description: 'ペナルティ有効' }),
    penalty_end_date: z.string().nullable().openapi({ description: 'ペナルティ終了日' }),
    remaining_sessions: z.number().int().openapi({ example: 5, description: '残りセッション数' }),
    sent_notification: z.boolean().default(false).openapi({ description: '通知送信済み' }),
  })
  .openapi({ title: 'Reservation', description: '予約' });

export const ReservationListResponseSchema = z
  .object({
    reservations: z.array(ReservationSchema),
    total: z.number().int().openapi({ example: 12, description: '総予約数' }),
    page: z.number().int().openapi({ example: 1, description: '現在のページ' }),
    pageSize: z.number().int().openapi({ example: 7, description: '1ページあたりの件数' }),
    totalPages: z.number().int().openapi({ example: 2, description: '総ページ数' }),
  })
  .openapi({ title: 'ReservationListResponse', description: '予約一覧レスポンス' });

export const ReservationsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).openapi({ description: 'ページ番号' }),
    pageSize: z.coerce.number().int().default(7).openapi({ description: '1ページあたりの件数' }),
    sortBy: z
      .enum(['sequence', 'member_name', 'space_number', 'reservation_date', 'status'])
      .optional()
      .openapi({ description: 'ソートキー' }),
    sortOrder: z.enum(['asc', 'desc']).optional().openapi({ description: 'ソート順' }),
  })
  .openapi({ title: 'ReservationsQuery', description: '予約一覧クエリ' });

export const AddReservationRequestSchema = z
  .object({
    member_id: z.string().openapi({ example: 'M005', description: '会員ID' }),
    schedule_id: z.string().openapi({ example: 'LS001', description: 'スケジュールID' }),
    space_number: z.string().optional().openapi({ description: 'スペース番号' }),
    send_notification: z.boolean().default(false).openapi({ description: '通知送信' }),
  })
  .openapi({ title: 'AddReservationRequest', description: '予約追加リクエスト' });

export const CancelReservationRequestSchema = z
  .object({
    cancel_type: CancelTypeSchema,
    send_notification: z.boolean().default(false).openapi({ description: 'キャンセル通知送信' }),
  })
  .openapi({ title: 'CancelReservationRequest', description: '予約キャンセルリクエスト' });

export const CancelReservationResponseSchema = z
  .object({
    id: z.string().openapi({ example: 'R001', description: '予約ID' }),
    status: z.literal('cancelled').openapi({ description: '更新ステータス' }),
  })
  .openapi({ title: 'CancelReservationResponse', description: '予約キャンセルレスポンス' });

export const UpdateAttendanceRequestSchema = z
  .object({
    attendance_status: AttendanceStatusSchema,
  })
  .openapi({ title: 'UpdateAttendanceRequest', description: '出席更新リクエスト' });

export const StudioSpaceTypeSchema = z
  .enum(['available', 'reserved', 'equipment', 'fixed_structure'])
  .openapi({ title: 'StudioSpaceType', description: 'スタジオスペース種別' });

export const StudioSpaceSchema = z
  .object({
    id: z.string().openapi({ example: 'SP01', description: 'スペースID' }),
    space_number: z.string().openapi({ example: 'S01', description: 'スペース番号' }),
    row: z.number().int().openapi({ example: 0, description: 'グリッド行' }),
    col: z.number().int().openapi({ example: 0, description: 'グリッド列' }),
    type: StudioSpaceTypeSchema,
    reservation_id: z.string().nullable().openapi({ description: '予約ID' }),
    member_name: z.string().nullable().openapi({ description: '会員名' }),
  })
  .openapi({ title: 'StudioSpace', description: 'スタジオスペース' });

export const StudioSpaceGridResponseSchema = z
  .object({
    studio_name: z.string().openapi({ example: 'スタジオA', description: 'スタジオ名' }),
    total_capacity: z.number().int().openapi({ example: 16, description: '総収容人数' }),
    grid_rows: z.number().int().openapi({ example: 2, description: 'グリッド行数' }),
    grid_cols: z.number().int().openapi({ example: 8, description: 'グリッド列数' }),
    spaces: z.array(StudioSpaceSchema),
  })
  .openapi({ title: 'StudioSpaceGridResponse', description: 'スタジオスペースグリッドレスポンス' });

export const ReservationStatsSchema = z
  .object({
    schedule_id: z.string(),
    total_capacity: z.number().int().openapi({ example: 14 }),
    total_reserved: z.number().int().openapi({ example: 12 }),
    remaining_seats: z.number().int().openapi({ example: 2 }),
    status_breakdown: z.array(
      z.object({
        status: ReservationStatusSchema,
        count: z.number().int().openapi({ example: 5 }),
        percentage: z.number().openapi({ example: 41.7 }),
      }),
    ),
  })
  .openapi({ title: 'ReservationStats', description: '予約統計' });

export const ReservationStatsResponseSchema = z
  .object({
    stats: ReservationStatsSchema,
  })
  .openapi({ title: 'ReservationStatsResponse', description: '予約統計レスポンス' });

export const MemberSearchResultSchema = z
  .object({
    member_id: z.string().openapi({ example: 'M001', description: '会員ID' }),
    name: z.string().openapi({ example: '山田 太郎', description: '会員名' }),
    remaining_sessions: z.number().int().openapi({ example: 3, description: '残りセッション数' }),
    penalty_active: z.boolean().openapi({ example: false, description: 'ペナルティ有効' }),
    penalty_end_date: z.string().nullable().openapi({ description: 'ペナルティ終了日' }),
  })
  .openapi({ title: 'MemberSearchResult', description: '会員検索結果' });

export const MemberSearchResponseSchema = z
  .object({
    members: z.array(MemberSearchResultSchema),
  })
  .openapi({ title: 'MemberSearchResponse', description: '会員検索レスポンス' });

export const MemberSearchQuerySchema = z
  .object({
    q: z.string().min(1).openapi({ description: '検索クエリ' }),
  })
  .openapi({ title: 'MemberSearchQuery', description: '会員検索クエリ' });

export const ChangeInstructorRequestSchema = z
  .object({
    instructor_ids: z.array(z.string()).openapi({ description: 'インストラクターID配列' }),
    reason: z.string().max(1000).openapi({ description: '変更理由' }),
    send_notification: z.boolean().default(false),
  })
  .openapi({ title: 'ChangeInstructorRequest', description: 'インストラクター変更リクエスト' });

export const ChangeTimeRequestSchema = z
  .object({
    start_time: z.string().openapi({ description: '新しい開始時刻 ISO8601' }),
    end_time: z.string().openapi({ description: '新しい終了時刻 ISO8601' }),
    reason: z.string().max(1000).openapi({ description: '変更理由' }),
    send_notification: z.boolean().default(false),
  })
  .openapi({ title: 'ChangeTimeRequest', description: '時間変更リクエスト' });

export const ChangeStudioRequestSchema = z
  .object({
    studio_id: z.string().openapi({ description: 'スタジオID' }),
    reason: z.string().max(1000).openapi({ description: '変更理由' }),
    send_notification: z.boolean().default(false),
  })
  .openapi({ title: 'ChangeStudioRequest', description: 'スタジオ変更リクエスト' });

export const ChangeResponseSchema = z
  .object({
    message: z.string().openapi({ example: '変更が完了しました' }),
  })
  .openapi({ title: 'ChangeResponse', description: '変更レスポンス' });

export const CancelLessonRequestSchema = z
  .object({
    scope: z.enum(['this_only', 'all_after']).openapi({ description: 'キャンセル範囲' }),
    cancel_reason: z.string().openapi({ description: 'キャンセル理由' }),
    cancel_reason_detail: z.string().max(1000).optional(),
    send_notification: z.boolean().default(false),
    process_refund: z.boolean().default(false),
    notify_instructor: z.boolean().default(false),
  })
  .openapi({ title: 'CancelLessonRequest', description: 'レッスンキャンセルリクエスト' });

export const CancelLessonResponseSchema = z
  .object({
    id: z.string().openapi({ description: 'スケジュールID' }),
    status: z.literal('cancelled'),
    cancelled_at: z.string().openapi({ description: 'キャンセル日時' }),
    cancelled_by: z.string().openapi({ description: 'キャンセル実施者' }),
    cancel_reason: z.string(),
    message: z.string().openapi({ example: 'レッスンを中止しました' }),
  })
  .openapi({ title: 'CancelLessonResponse', description: 'レッスンキャンセルレスポンス' });

export const SessionMemoSchema = z
  .object({
    id: z.string().openapi({ example: 'MEMO001', description: 'メモID' }),
    schedule_id: z.string().openapi({ example: 'LS001', description: 'スケジュールID' }),
    content: z.string().max(1000).openapi({ description: 'メモ内容' }),
    author_id: z.string().openapi({ example: 'ST001', description: '作成者ID' }),
    author_name: z.string().openapi({ example: '田中 花子', description: '作成者名' }),
    created_at: z.string().openapi({ description: '作成日時' }),
    updated_at: z.string().nullable().openapi({ description: '更新日時' }),
  })
  .openapi({ title: 'SessionMemo', description: 'セッションメモ' });

export const CreateMemoRequestSchema = z
  .object({
    content: z.string().min(1).max(1000).openapi({ description: 'メモ内容' }),
  })
  .openapi({ title: 'CreateMemoRequest', description: 'メモ作成リクエスト' });

export const MemoListResponseSchema = z
  .object({
    memos: z.array(SessionMemoSchema),
  })
  .openapi({ title: 'MemoListResponse', description: 'メモ一覧レスポンス' });

export type ReservationStatus = z.infer<typeof ReservationStatusSchema>;
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;
export type CancelType = z.infer<typeof CancelTypeSchema>;
export type Reservation = z.infer<typeof ReservationSchema>;
export type ReservationListResponse = z.infer<typeof ReservationListResponseSchema>;
export type ReservationsQuery = z.infer<typeof ReservationsQuerySchema>;
export type AddReservationRequest = z.infer<typeof AddReservationRequestSchema>;
export type CancelReservationRequest = z.infer<typeof CancelReservationRequestSchema>;
export type CancelReservationResponse = z.infer<typeof CancelReservationResponseSchema>;
export type UpdateAttendanceRequest = z.infer<typeof UpdateAttendanceRequestSchema>;
export type StudioSpaceType = z.infer<typeof StudioSpaceTypeSchema>;
export type StudioSpace = z.infer<typeof StudioSpaceSchema>;
export type StudioSpaceGridResponse = z.infer<typeof StudioSpaceGridResponseSchema>;
export type ReservationStats = z.infer<typeof ReservationStatsSchema>;
export type ReservationStatsResponse = z.infer<typeof ReservationStatsResponseSchema>;
export type MemberSearchResult = z.infer<typeof MemberSearchResultSchema>;
export type MemberSearchResponse = z.infer<typeof MemberSearchResponseSchema>;
export type ChangeInstructorRequest = z.infer<typeof ChangeInstructorRequestSchema>;
export type ChangeTimeRequest = z.infer<typeof ChangeTimeRequestSchema>;
export type ChangeStudioRequest = z.infer<typeof ChangeStudioRequestSchema>;
export type ChangeResponse = z.infer<typeof ChangeResponseSchema>;
export type CancelLessonRequest = z.infer<typeof CancelLessonRequestSchema>;
export type CancelLessonResponse = z.infer<typeof CancelLessonResponseSchema>;
export type SessionMemo = z.infer<typeof SessionMemoSchema>;
export type CreateMemoRequest = z.infer<typeof CreateMemoRequestSchema>;
export type MemoListResponse = z.infer<typeof MemoListResponseSchema>;

export { ErrorResponseSchema };
