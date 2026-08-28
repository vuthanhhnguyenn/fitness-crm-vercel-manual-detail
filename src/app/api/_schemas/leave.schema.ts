import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { BrandSchema } from './member.schema';

extendZodWithOpenApi(z);

// ─── Enum Schemas ────────────────────────────────────────────────────────────

export const LeaveTypeSchema = z.enum(['suspension', 'withdrawal']).openapi({
  title: 'LeaveType',
  description: 'Leave type: suspension=休会, withdrawal=退会',
});

/**
 * Full lifecycle status (6 values).
 * `completed` and `cancelled` are detail-only — neither appears in list responses (A-03 Q-10).
 * They are distinct outcomes: `completed` means the withdrawal was executed, `cancelled`
 * means it was withdrawn by an operator (FR-002), so they must never share a label.
 */
export const LeaveStatusSchema = z
  .enum([
    'suspension_scheduled',
    'suspended',
    'withdrawal_scheduled',
    'withdrawal_pending',
    'completed',
    'cancelled',
  ])
  .openapi({
    title: 'LeaveStatus',
    description:
      'Leave status: suspension_scheduled=休会予定, suspended=休会中, withdrawal_scheduled=退会予定, withdrawal_pending=退会処理待ち, completed=処理完了, cancelled=取り消し済み',
  });

/**
 * List-facing subset (4 values). Mirrors the real contract's `displayStatus`,
 * which is a distinct type from the lifecycle `status` (A-03 research.md §3).
 */
export const LeaveListStatusSchema = z
  .enum(['suspension_scheduled', 'suspended', 'withdrawal_scheduled', 'withdrawal_pending'])
  .openapi({
    title: 'LeaveListStatus',
    description:
      '一覧に表示されるステータス（処理完了は一覧に現れない）: suspension_scheduled=休会予定, suspended=休会中, withdrawal_scheduled=退会予定, withdrawal_pending=退会処理待ち',
  });

/**
 * First blocking condition of the withdrawal-cancel guard chain, in evaluation order.
 */
export const CancellationBlockedReasonSchema = z
  .enum(['not_cancellable_status', 'batch_processing_started', 'usage_started'])
  .openapi({
    title: 'CancellationBlockedReason',
    description:
      '退会取り消しの阻害理由: not_cancellable_status=取り消し可能な状態ではない, batch_processing_started=退会処理が開始されている, usage_started=利用開始日以降',
  });

export const ProxyAgreementMethodSchema = z.enum(['in_person', 'phone', 'email', 'line']).openapi({
  title: 'ProxyAgreementMethod',
  description: '合意方法: in_person=来店, phone=電話, email=メール, line=LINE',
});

export const SuspensionHistoryStatusSchema = z
  .enum(['active', 'pending-leave', 'pending-retire'])
  .openapi({
    title: 'SuspensionHistoryStatus',
    description:
      '履歴ストリップの月別状態: active=休会中, pending-leave=休会予定, pending-retire=退会予定',
  });

export type LeaveType = z.infer<typeof LeaveTypeSchema>;
export type LeaveStatus = z.infer<typeof LeaveStatusSchema>;
export type LeaveListStatus = z.infer<typeof LeaveListStatusSchema>;
export type CancellationBlockedReason = z.infer<typeof CancellationBlockedReasonSchema>;
export type ProxyAgreementMethod = z.infer<typeof ProxyAgreementMethodSchema>;
export type SuspensionHistoryStatus = z.infer<typeof SuspensionHistoryStatusSchema>;

// ─── List Item Schema ─────────────────────────────────────────────────────────

export const LeaveListItemSchema = z
  .object({
    id: z
      .string()
      .openapi({ example: 'lv-001', description: '申請レコードID（表示しない・遷移用）' }),
    application_number: z
      .string()
      .openapi({ example: '0000000001', description: '申請番号（画面に表示する申請ID）' }),
    member_id: z
      .string()
      .openapi({ example: 'mem-00101', description: '会員レコードID（表示しない・遷移用）' }),
    member_number: z
      .string()
      .openapi({ example: 'JF-0000101', description: '会員番号（画面に表示する会員ID）' }),
    member_name: z.string().openapi({ example: '田中 次郎', description: '会員名' }),
    brand: BrandSchema.openapi({ example: 'joyfit24', description: 'ブランド' }),
    store_id: z.string().openapi({ example: 'store-006', description: '店舗ID' }),
    store_name: z.string().openapi({ example: 'JOYFIT24新宿店', description: '店舗名' }),
    type: LeaveTypeSchema,
    status: LeaveListStatusSchema,
    applied_at: z.string().openapi({ example: '2026/03/20', description: '申請日' }),
    scheduled_date: z
      .string()
      .openapi({ example: '2026/04', description: '予定日（休会開始日/退会予定日）' }),
    end_date: z
      .string()
      .nullable()
      .openapi({ example: '2026/06', description: '終了日（休会終了月・退会はnull）' }),
    unpaid_amount: z.number().openapi({ example: 0, description: '未納金額（円）' }),
    cancellable: z
      .boolean()
      .openapi({ example: false, description: '退会取り消し可否（サーバー判定）' }),
    cancellation_blocked_reason: CancellationBlockedReasonSchema.nullable().openapi({
      description: '取り消し不可の理由（cancellable=trueのときnull）',
    }),
  })
  .openapi({ title: 'LeaveListItem' });

export type LeaveListItem = z.infer<typeof LeaveListItemSchema>;

// ─── Query Schema ─────────────────────────────────────────────────────────────

export const GetLeavesQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 1))
      .pipe(z.number().int().min(1))
      .openapi({ example: '1', description: 'ページ番号' }),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 25))
      .pipe(z.number().int().min(1).max(100))
      .openapi({ example: '25', description: '1ページあたりの件数（最大100）' }),
    search: z
      .string()
      .optional()
      .openapi({ example: '0000000001', description: '申請番号・会員名で検索' }),
    type: LeaveTypeSchema.optional().openapi({ description: '種別フィルター' }),
    status: LeaveListStatusSchema.optional().openapi({
      description: 'ステータスフィルター（処理完了は指定できない）',
    }),
    brand: BrandSchema.optional().openapi({ description: 'ブランドフィルター' }),
    scope_store_id: z.string().optional().openapi({
      description:
        'ヘッダー店舗スコープ。ユーザーフィルターより前に適用され、total_all の母数に含まれる（FR-003 / FR-024）。画面内の店舗フィルター（store_id）とは別物。',
    }),
    store_id: z.string().optional().openapi({ description: '店舗IDフィルター' }),
    member_id: z.string().optional().openapi({
      description:
        '会員IDフィルター。A-01-01の休会・退会履歴から「申請一覧を見る」で遷移したときに、その会員の申請だけを表示するために使う。',
    }),
    /**
     * FR-025a — the 予定日 presets (今月 / 来月 / 今年) resolve to an inclusive scheduled-date
     * range on the JST calendar and travel as a range, matching the real endpoint's
     * `scheduledFrom` / `scheduledTo`. The screen owns the preset; the API only sees dates,
     * so a future free date range needs no contract change.
     *
     * Suspension rows carry a month (`YYYY/MM`) and withdrawal rows a day (`YYYY/MM/DD`);
     * a month is compared as its first day, so 今月 matches a suspension starting that month.
     */
    scheduled_from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'scheduled_from must be YYYY-MM-DD')
      .optional()
      .openapi({ example: '2026-08-01', description: '予定日レンジ開始日（この日を含む）' }),
    scheduled_to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'scheduled_to must be YYYY-MM-DD')
      .optional()
      .openapi({ example: '2026-08-31', description: '予定日レンジ終了日（この日を含む）' }),
    sort_by: z
      .enum(['applied_at', 'scheduled_date'])
      .optional()
      .openapi({ description: 'ソートフィールド（既定: scheduled_date）' }),
    sort_order: z
      .enum(['asc', 'desc'])
      .optional()
      .openapi({ description: 'ソート順（既定: asc）' }),
  })
  .openapi({ title: 'GetLeavesQuery' });

export type GetLeavesQuery = z.infer<typeof GetLeavesQuerySchema>;

// ─── Response Schema ──────────────────────────────────────────────────────────

export const GetLeavesResponseSchema = z
  .object({
    leaves: z.array(LeaveListItemSchema),
    total: z.number().openapi({ example: 8, description: 'スコープ＋絞り込み後の件数' }),
    total_all: z
      .number()
      .openapi({ example: 24, description: 'スコープのみ適用した母数（絞り込みバナー用）' }),
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 25 }),
    total_pages: z.number().openapi({ example: 1 }),
  })
  .openapi({ title: 'GetLeavesResponse' });

export type GetLeavesResponse = z.infer<typeof GetLeavesResponseSchema>;

export const ErrorResponseSchema = z
  .object({ error: z.string() })
  .openapi({ title: 'LeaveErrorResponse' });

// ─── Member Block (detail head-up card) ──────────────────────────────────────

export const LeaveMemberSchema = z
  .object({
    member_id: z.string().openapi({ example: 'mem-00101', description: '会員レコードID' }),
    member_number: z.string().openapi({ example: 'JF-0000101', description: '会員番号' }),
    name: z.string().openapi({ example: '田中 次郎', description: '氏名' }),
    name_kana: z.string().nullable().openapi({ example: 'タナカ ジロウ', description: '氏名カナ' }),
    legacy_member_code: z
      .string()
      .nullable()
      .openapi({ example: 'JF-31085', description: '旧会員番号（移行データのみ）' }),
    member_type: z.string().nullable().openapi({ example: '通常会員', description: '会員種別' }),
    contract_name: z
      .string()
      .nullable()
      .openapi({ example: 'レギュラー会員', description: '主契約名' }),
    store_name: z.string().openapi({ example: 'JOYFIT24新宿店', description: '所属店舗名' }),
    face_photo_url: z.string().nullable().openapi({ description: '顔写真URL' }),
  })
  .openapi({ title: 'LeaveMember' });

export type LeaveMember = z.infer<typeof LeaveMemberSchema>;

// ─── Suspension History (strip) ──────────────────────────────────────────────

export const SuspensionHistoryMonthSchema = z
  .object({
    year_month: z.string().openapi({ example: '2026/04', description: '対象月（YYYY/MM）' }),
    status: SuspensionHistoryStatusSchema,
    application_number: z
      .string()
      .nullable()
      .openapi({ example: '0000000001', description: '該当申請の申請番号' }),
  })
  .openapi({ title: 'SuspensionHistoryMonth' });

export type SuspensionHistoryMonth = z.infer<typeof SuspensionHistoryMonthSchema>;

// ─── Detail Schema ────────────────────────────────────────────────────────────

export const LeaveDetailSchema = z
  .object({
    id: z.string().openapi({ example: 'lv-001', description: '申請レコードID' }),
    application_number: z
      .string()
      .openapi({ example: '0000000001', description: '申請番号（画面に表示する申請ID）' }),
    member: LeaveMemberSchema,
    brand: BrandSchema.openapi({ example: 'joyfit24', description: 'ブランド' }),
    store_id: z.string().openapi({ example: 'store-006', description: '店舗ID' }),
    store_name: z.string().openapi({ example: 'JOYFIT24新宿店', description: '店舗名' }),
    type: LeaveTypeSchema,
    status: LeaveStatusSchema,
    applied_at: z.string().openapi({ example: '2026/03/20 10:15', description: '申請日時' }),
    /**
     * Mirrors the real contract's `timeline.steps[approval].occurredAt`: the instant the
     * application was approved, frozen once set. `updated_at` cannot stand in for it — a
     * later mutation (notably 退会取り消し) moves `updated_at` onto that action, which would
     * relabel the 承認 step with the cancellation timestamp.
     */
    approved_at: z.string().nullable().openapi({
      example: '2026/03/20 10:15',
      description: '承認日時（承認フローの承認ステップ）',
    }),
    scheduled_date: z
      .string()
      .openapi({ example: '2026/04', description: '休会開始月 or 退会予定日' }),
    end_date: z
      .string()
      .nullable()
      .openapi({ example: '2026/06', description: '休会終了月（休会のみ）' }),
    reason: z.string().openapi({ example: '海外出張のため', description: '申請理由' }),
    applicant: z.string().openapi({ example: '田中 次郎（本人）', description: '申請者' }),
    is_proxy_applied: z.boolean().openapi({ description: '代理申請フラグ' }),
    proxy_applicant: z.string().nullable().openapi({ description: '代理申請者名' }),
    consent_at: z.string().nullable().openapi({ description: '合意日時' }),
    consent_method: ProxyAgreementMethodSchema.nullable().openapi({ description: '合意方法' }),
    suspension_fee: z
      .number()
      .nullable()
      .openapi({ example: 1100, description: '休会費（円/月・休会のみ）' }),
    withdrawal_fee: z
      .number()
      .nullable()
      .openapi({ example: 3300, description: '退会手数料（円・退会のみ）' }),
    applied_campaign: z.string().openapi({ example: 'なし', description: '適用キャンペーン' }),
    unused_lessons: z
      .number()
      .openapi({ example: 2, description: '未消化レッスン数（休会・退会どちらも返す）' }),
    unpaid_amount: z.number().openapi({ example: 0, description: '未納金額（円）' }),
    usage_start_date: z
      .string()
      .nullable()
      .openapi({ example: '2026-07-01', description: '利用開始日（取り消し判定の入力）' }),
    cancellable: z
      .boolean()
      .openapi({ example: false, description: '退会取り消し可否（サーバー判定）' }),
    cancellation_blocked_reason: CancellationBlockedReasonSchema.nullable().openapi({
      description: '取り消し不可の理由（cancellable=trueのときnull）',
    }),
    // A-03 FR-002「取り消し実行者・実行日時を記録」 — populated by the cancel endpoint,
    // null on every application that has not been cancelled.
    cancelled_by: z
      .string()
      .nullable()
      .openapi({ example: '山田 花子', description: '退会取り消しの実行者' }),
    cancelled_at: z
      .string()
      .nullable()
      .openapi({ example: '2026/08/07 14:30', description: '退会取り消しの実行日時' }),
    suspension_history: z
      .array(SuspensionHistoryMonthSchema)
      .openapi({ description: '休会・退会履歴（申請から導出・読み取り専用）' }),
    created_at: z.string().openapi({ description: '作成日時' }),
    updated_at: z.string().openapi({ description: '最終更新日時' }),
  })
  .openapi({ title: 'LeaveDetail' });

export type LeaveDetail = z.infer<typeof LeaveDetailSchema>;

export const GetLeaveDetailResponseSchema = z
  .object({ leave: LeaveDetailSchema })
  .openapi({ title: 'GetLeaveDetailResponse' });

export type GetLeaveDetailResponse = z.infer<typeof GetLeaveDetailResponseSchema>;

export const GetMemberActiveSuspensionResponseSchema = z
  .object({
    suspension: LeaveDetailSchema.nullable().openapi({
      description: 'Active suspension detail, or null if no active suspension',
    }),
  })
  .openapi({ title: 'GetMemberActiveSuspensionResponse' });

export type GetMemberActiveSuspensionResponse = z.infer<
  typeof GetMemberActiveSuspensionResponseSchema
>;

// ─── Action Request/Response Schemas ─────────────────────────────────────────
// A-03 owns exactly one mutation: cancel a scheduled withdrawal.
// Approve / reject / execute-withdrawal belong to A-01-01 and to the System batch.

export const CancelWithdrawalRequestSchema = z
  .object({
    comment: z.string().optional().openapi({ description: '取り消し事由（任意）' }),
  })
  .openapi({ title: 'CancelWithdrawalRequest' });

export type CancelWithdrawalRequest = z.infer<typeof CancelWithdrawalRequestSchema>;

export const LeaveActionResponseSchema = z
  .object({ leave: LeaveDetailSchema })
  .openapi({ title: 'LeaveActionResponse' });

export type LeaveActionResponse = z.infer<typeof LeaveActionResponseSchema>;
