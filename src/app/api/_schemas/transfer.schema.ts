import { PAGE_SIZE, TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// ─── Enum Schemas ─────────────────────────────────────────────────────────────

/**
 * A-02 移籍ステータス. Five values, 1:1 with the FR-001 filter options.
 *
 * `approved` was removed — it duplicated `completed` while no code path ever reached
 * `completed`, so JOYFIT transfers dead-ended. `from_store_pending` was added so the
 * 移籍元承認待ち queue is a distinct state from a freshly created 申請中 request.
 */
export const TransferStatusSchema = z
  .enum(['pending', 'from_store_pending', 'from_store_approved', 'completed', 'rejected'])
  .openapi({
    title: 'TransferStatus',
    description:
      'Transfer request status: pending=申請中, from_store_pending=移籍元承認待ち, from_store_approved=移籍先承認待ち, completed=完了, rejected=否認',
  });

export type TransferStatus = z.infer<typeof TransferStatusSchema>;

export const TransferBrandSchema = z.enum(['joyfit', 'fit365']).openapi({
  title: 'TransferBrand',
  description: 'Brand of the member contract: joyfit=JOYFIT, fit365=FIT365',
});

/** JOYFIT-only reasons a transfer is excluded from automatic execution (FR-006). */
export const ExclusionReasonSchema = z.enum(['unpaid', 'campaign_lock']).openapi({
  title: 'ExclusionReason',
  description: '自動移籍の除外理由: unpaid=未納あり, campaign_lock=縛り期間中（解約手数料期間）',
});

export type ExclusionReason = z.infer<typeof ExclusionReasonSchema>;

// ─── Entity Schema ────────────────────────────────────────────────────────────

export const TransferRequestSchema = z
  .object({
    id: z.string().openapi({ example: 'TR-001', description: '移籍申請ID' }),
    member_id: z.string().openapi({ example: 'M-12345', description: '会員ID' }),
    member_name: z.string().openapi({ example: '山田 太郎', description: '会員氏名' }),
    from_store_id: z.string().openapi({ example: 'store-001', description: '移籍元店舗ID' }),
    from_store_name: z.string().openapi({ example: 'JOYFIT池袋店', description: '移籍元店舗名' }),
    to_store_id: z.string().openapi({ example: 'store-002', description: '移籍先店舗ID' }),
    to_store_name: z.string().openapi({ example: 'JOYFIT新宿店', description: '移籍先店舗名' }),
    brand: TransferBrandSchema,
    applied_at: z
      .string()
      .openapi({ example: '2026-04-15T10:30:00Z', description: '申請日時 (ISO 8601)' }),
    scheduled_date: z
      .string()
      .openapi({ example: '2026-05-01T00:00:00Z', description: '移籍予定日 (ISO 8601)' }),
    status: TransferStatusSchema,
    // ── Auto-transfer eligibility (FR-006) ──
    // Carried on the list row (not detail-only) because the 自動移籍可否 column and the
    // bulk-selection guard both need it without an N+1 fetch.
    auto_transfer_eligible: z.boolean().nullable().openapi({
      description: '自動移籍可否. FIT365 は自動移籍の概念がないため常に null',
      example: true,
    }),
    exclusion_reasons: z.array(ExclusionReasonSchema).openapi({
      description: '自動移籍の除外理由（複数同時に成立しうる）. 可の場合は空配列',
    }),
    unpaid_amount: z.number().nullable().openapi({
      description: '未納金額（円）. exclusion_reasons に unpaid を含むときのみ設定',
      example: 8800,
    }),
    campaign_lock_remaining_days: z.number().nullable().openapi({
      description: '縛り期間の残日数. exclusion_reasons に campaign_lock を含むときのみ設定',
      example: 45,
    }),
    /**
     * Row-level actionability, resolved server-side by `canActOnTransfer`.
     *
     * This is server-computed rather than derived in the browser because the client's
     * `AuthUser` carries no store linkage, so a Staff user cannot tell whether they are the
     * origin or destination side of a given row. Shipping the decision with the row keeps the
     * button's visibility and the endpoint's 403 in exact agreement.
     */
    can_act: z.boolean().openapi({
      description: '認証ユーザーがこの申請に対して承認 / 否認を実行できるか',
      example: true,
    }),
  })
  .openapi({ title: 'TransferRequest', description: '移籍申請レコード' });

export type TransferRequest = z.infer<typeof TransferRequestSchema>;

// ─── Query Schema ─────────────────────────────────────────────────────────────

export const GetTransfersQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional().default(1).openapi({
      description: 'ページ番号',
      example: 1,
    }),
    limit: z.coerce.number().int().positive().optional().default(PAGE_SIZE).openapi({
      description: '1ページあたりの件数 (25/50/100/200)',
      example: PAGE_SIZE,
    }),
    search: z.string().optional().openapi({ description: '申請ID・会員名の検索文字列' }),
    status: TransferStatusSchema.optional().openapi({ description: 'ステータスフィルター' }),
    from_store_id: z.string().optional().openapi({ description: '移籍元店舗IDフィルター' }),
    to_store_id: z.string().optional().openapi({ description: '移籍先店舗IDフィルター' }),
    store_id: z.string().optional().openapi({
      description: 'ヘッダー店舗セレクターのスコープ. 移籍元・移籍先のいずれかに一致すれば対象',
    }),
    brand: TransferBrandSchema.optional().openapi({ description: 'ブランドフィルター' }),
    applied_period: z
      .enum(['this_month', 'last_month', 'this_year'])
      .optional()
      .openapi({ description: '申請日期間フィルター' }),
    auto_transfer: z.enum(['eligible', 'excluded']).optional().openapi({
      description:
        '自動移籍フィルター: eligible=JOYFIT かつ自動可, excluded=JOYFIT かつ除外あり. いずれも FIT365 は対象外',
    }),
    sort_by: z
      .enum(['applied_at', 'scheduled_date', 'member_name', 'id'])
      .optional()
      .default('applied_at')
      .openapi({ description: 'ソートカラム', example: 'applied_at' }),
    sort_order: z
      .enum(['asc', 'desc'])
      .optional()
      .default('desc')
      .openapi({ description: 'ソート順', example: 'desc' }),
  })
  .openapi({ title: 'GetTransfersQuery' });

export type GetTransfersQuery = z.infer<typeof GetTransfersQuerySchema>;

// ─── Response Schema ──────────────────────────────────────────────────────────

export const TransferPaginationSchema = z
  .object({
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: PAGE_SIZE }),
    total: z
      .number()
      .int()
      .openapi({ description: 'スコープ適用後・フィルター適用後の件数', example: 42 }),
    total_pages: z.number().int().openapi({ example: 3 }),
    /**
     * The count before any filter or search is applied, within the caller's store scope. The
     * filter banner needs both numbers ("全 N 件中 M 件を抽出中"); without this it could only
     * report the filtered count twice (PAR015).
     */
    scoped_total: z
      .number()
      .int()
      .openapi({ description: 'フィルター適用前・スコープ適用後の総件数', example: 120 }),
  })
  .openapi({ title: 'TransferPagination' });

export const GetTransfersResponseSchema = z
  .object({
    transfers: z.array(TransferRequestSchema),
    pagination: TransferPaginationSchema,
  })
  .openapi({ title: 'GetTransfersResponse', description: '移籍申請一覧レスポンス' });

export type GetTransfersResponse = z.infer<typeof GetTransfersResponseSchema>;

// ─── Detail Schema ────────────────────────────────────────────────────────────

export const ApprovalHistoryItemSchema = z
  .object({
    step: z.number().int().openapi({ example: 1, description: 'ステップ番号（1始まり）' }),
    label: z.string().openapi({ example: '移籍元承認', description: 'ステップラベル' }),
    store_type: z
      .enum(['from', 'to'])
      .nullable()
      .openapi({ description: '店舗種別: from=移籍元, to=移籍先, null=なし' }),
    completed: z.boolean().openapi({ description: '完了済みかどうか' }),
    completed_at: z
      .string()
      .nullable()
      .openapi({ example: '2026-04-16T10:30:00Z', description: '完了日時 (ISO 8601)' }),
    completed_by: z.string().nullable().openapi({ description: '完了者氏名' }),
    is_automatic: z.boolean().openapi({ description: 'システム自動実行ステップか' }),
  })
  .openapi({ title: 'ApprovalHistoryItem', description: '承認フロー 1ステップ' });

export type ApprovalHistoryItem = z.infer<typeof ApprovalHistoryItemSchema>;

/**
 * One approve/reject action, persisted so FR-008's comment survives the request.
 * The pre-update implementation validated the comment and then discarded it.
 */
export const TransferDecisionSchema = z
  .object({
    action: z.enum(['approve', 'reject']).openapi({ description: '承認 / 否認' }),
    comment: z
      .string()
      .max(TEXTAREA_MAX_LENGTH)
      .nullable()
      .openapi({ description: 'コメント（任意）' }),
    actor_name: z
      .string()
      .openapi({ example: '田中 太郎', description: '実行者氏名（サーバー側で解決）' }),
    actor_role: z.string().openapi({ example: 'Manager', description: '実行者ロール' }),
    store_type: z
      .enum(['from', 'to'])
      .nullable()
      .openapi({ description: 'どちら側の店舗として実行したか' }),
    decided_at: z
      .string()
      .openapi({ example: '2026-04-16T10:30:00Z', description: '実行日時 (ISO 8601)' }),
  })
  .openapi({ title: 'TransferDecision', description: '承認 / 否認の記録' });

export type TransferDecision = z.infer<typeof TransferDecisionSchema>;

/** Audit record for the FR-012 manual campaign-lock override. */
export const TransferUnlockSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(1, '解除理由を入力してください')
      .max(TEXTAREA_MAX_LENGTH)
      .openapi({ description: '解除理由（必須）' }),
    operator_name: z
      .string()
      .openapi({ example: '本部 管理者', description: '実行者氏名（サーバー側で解決）' }),
    unlocked_at: z
      .string()
      .openapi({ example: '2026-04-16T10:30:00Z', description: '解除日時 (ISO 8601)' }),
  })
  .openapi({ title: 'TransferUnlock', description: '自動移籍除外の手動解除記録' });

export type TransferUnlock = z.infer<typeof TransferUnlockSchema>;

export const TransferDetailSchema = TransferRequestSchema.extend({
  reason: z.string().openapi({ example: '転居のため', description: '移籍理由' }),
  applicant_name: z.string().openapi({ example: '田中 太郎', description: '申請者氏名' }),
  applicant_role: z.string().openapi({ example: 'staff', description: '申請者ロール' }),
  // A-01 FR-017 代理申請の証跡. Optional because member-initiated transfers carry no proxy block.
  is_proxy: z.boolean().optional().openapi({ description: 'スタッフによる代理申請かどうか' }),
  proxy_agreed_at: z
    .string()
    .optional()
    .openapi({ example: '2026-04-15T10:00:00Z', description: '会員の合意日時 (代理申請時)' }),
  proxy_method: z
    .string()
    .optional()
    .openapi({ example: 'in_person', description: '合意方法 (代理申請時)' }),
  updated_at: z
    .string()
    .openapi({ example: '2026-04-16T10:30:00Z', description: '最終更新日時 (ISO 8601)' }),
  approval_history: z.array(ApprovalHistoryItemSchema).openapi({ description: '承認ステップ履歴' }),
  unpaid_period: z
    .string()
    .nullable()
    .openapi({ example: '2026年2月分', description: '未納金の請求対象期間' }),
  // ── Member head-up fields (PAR046) ──
  // Resolved server-side from the member record when the detail is serialised, rather than
  // stored on the transfer (which would go stale) or fetched by the client as a second
  // request (an N+1 on a detail screen).
  member_name_kana: z
    .string()
    .nullable()
    .openapi({ example: 'ナカムラ ユミ', description: '会員氏名カナ' }),
  old_member_no: z.string().nullable().openapi({ example: 'O-M-00024', description: '旧会員番号' }),
  member_type: z.string().nullable().openapi({ example: 'regular', description: '会員種別' }),
  contract_name: z
    .string()
    .nullable()
    .openapi({ example: 'レギュラー会員', description: '主契約名' }),
  decisions: z
    .array(TransferDecisionSchema)
    .openapi({ description: '承認 / 否認の履歴（コメント付き）' }),
  unlock: TransferUnlockSchema.nullable().openapi({ description: '手動解除の記録. 未解除は null' }),
}).openapi({ title: 'TransferDetail', description: '移籍申請詳細レコード' });

export type TransferDetail = z.infer<typeof TransferDetailSchema>;

export const GetTransferDetailResponseSchema = z
  .object({ transfer: TransferDetailSchema })
  .openapi({ title: 'GetTransferDetailResponse', description: '移籍申請詳細レスポンス' });

export type GetTransferDetailResponse = z.infer<typeof GetTransferDetailResponseSchema>;

// ─── Request Bodies ───────────────────────────────────────────────────────────

export const ApproveTransferBodySchema = z
  .object({
    comment: z
      .string()
      .max(TEXTAREA_MAX_LENGTH)
      .optional()
      .openapi({ description: '承認コメント（任意）' }),
  })
  .openapi({ title: 'ApproveTransferBody' });

export type ApproveTransferBody = z.infer<typeof ApproveTransferBodySchema>;

export const RejectTransferBodySchema = z
  .object({
    comment: z
      .string()
      .max(TEXTAREA_MAX_LENGTH)
      .optional()
      .openapi({ description: '否認理由（任意）' }),
  })
  .openapi({ title: 'RejectTransferBody' });

export type RejectTransferBody = z.infer<typeof RejectTransferBodySchema>;

/** FR-013. `max(200)` matches the largest page size, so a full page is always submittable. */
export const BulkApproveTransfersBodySchema = z
  .object({
    transfer_ids: z
      .array(z.string())
      .min(1, '承認する移籍申請を選択してください')
      .max(200, '一度に承認できるのは200件までです')
      .openapi({ description: '一括承認する移籍申請ID' }),
    comment: z
      .string()
      .max(TEXTAREA_MAX_LENGTH)
      .optional()
      .openapi({ description: 'コメント（任意）. バッチ内の全件に適用' }),
  })
  .openapi({ title: 'BulkApproveTransfersBody' });

export type BulkApproveTransfersBody = z.infer<typeof BulkApproveTransfersBodySchema>;

export const UnlockTransferBodySchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(1, '解除理由を入力してください')
      .max(TEXTAREA_MAX_LENGTH)
      .openapi({ description: '解除理由（必須）' }),
  })
  .openapi({ title: 'UnlockTransferBody' });

export type UnlockTransferBody = z.infer<typeof UnlockTransferBodySchema>;

// ─── Action Responses ─────────────────────────────────────────────────────────

export const ApproveTransferResponseSchema = z
  .object({ transfer: TransferDetailSchema })
  .openapi({ title: 'ApproveTransferResponse' });

export type ApproveTransferResponse = z.infer<typeof ApproveTransferResponseSchema>;

export const RejectTransferResponseSchema = z
  .object({ transfer: TransferDetailSchema })
  .openapi({ title: 'RejectTransferResponse' });

export type RejectTransferResponse = z.infer<typeof RejectTransferResponseSchema>;

/**
 * Per-item outcomes rather than an all-or-nothing batch — a partial success is the
 * useful answer for a 200-row selection, and the UI must surface `failed` (PAR040).
 */
export const BulkApproveTransfersResponseSchema = z
  .object({
    approved: z.array(z.string()).openapi({ description: '承認できた移籍申請ID' }),
    failed: z
      .array(
        z.object({
          id: z.string().openapi({ description: '承認できなかった移籍申請ID' }),
          reason: z.string().openapi({ description: '失敗理由' }),
        }),
      )
      .openapi({ description: '承認できなかった移籍申請とその理由' }),
  })
  .openapi({ title: 'BulkApproveTransfersResponse' });

export type BulkApproveTransfersResponse = z.infer<typeof BulkApproveTransfersResponseSchema>;

export const UnlockTransferResponseSchema = z
  .object({ transfer: TransferDetailSchema })
  .openapi({ title: 'UnlockTransferResponse' });

export type UnlockTransferResponse = z.infer<typeof UnlockTransferResponseSchema>;

// ─── Error Schema (re-export for convenience) ─────────────────────────────────

export const ErrorResponseSchema = z
  .object({
    error: z.string(),
    details: z.unknown().optional(),
  })
  .openapi({ title: 'ErrorResponse' });
