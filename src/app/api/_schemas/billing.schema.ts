import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const BillingTypeSchema = z.enum(['monthly', 'ad_hoc', 'manual']).openapi({
  title: 'BillingType',
  description: '請求区分（月次請求/都度請求/手動請求）',
});

export const PaymentMethodSchema = z.enum(['sbps', 'jaccs', 'cash', 'other']).openapi({
  title: 'PaymentMethod',
  description: '決済手段（SBPS/JACCS/現金/その他）',
});

export const ConfirmationStatusSchema = z.enum(['unconfirmed', 'confirmed']).openapi({
  title: 'ConfirmationStatus',
  description: '請求確定状態',
});

export const BillingRefundStatusSchema = z
  .enum(['none', 'pending', 'approved', 'completed', 'rejected'])
  .openapi({ title: 'BillingRefundStatus', description: '請求に紐づく返金ステータスの集約値' });

export const LineItemSourceSchema = z.enum(['contract', 'manual']).openapi({
  title: 'LineItemSource',
  description: '請求明細の追加元（契約から選択/手動入力）',
});

export const LineItemPaymentStatusSchema = z
  .enum(['unpaid', 'confirmed', 'refunded', 'canceled'])
  .openapi({ title: 'LineItemPaymentStatus', description: '明細単位の入金状態' });

export const FeeAdjustmentPatternSchema = z
  .enum(['fixed_amount', 'discount_amount', 'discount_percent', 'surcharge'])
  .openapi({ title: 'FeeAdjustmentPattern', description: '会費調整パターン' });

export const FeeAdjustmentStatusSchema = z.enum(['applied', 'pending']).openapi({
  title: 'FeeAdjustmentStatus',
  description: '会費調整の適用状態',
});

export const RefundRequestTypeSchema = z.enum(['full', 'partial']).openapi({
  title: 'RefundRequestType',
  description: '返金種別（全額/部分）',
});

export const RefundHandlingSchema = z
  .enum(['card_auto_reversal', 'bank_manual_or_cashpost'])
  .openapi({ title: 'RefundHandling', description: '決済手段別の返金処理方法' });

export const RefundRequestStatusSchema = z
  .enum(['pending', 'approved', 'completed', 'rejected'])
  .openapi({ title: 'RefundRequestStatus', description: '返金申請ステータス' });

export const AccountingEntryTypeSchema = z
  .enum(['sales', 'payment', 'refund', 'expense', 'bad_debt', 'all'])
  .openapi({ title: 'AccountingEntryType', description: '会計CSV出力の仕訳種別' });

// ---------------------------------------------------------------------------
// F-01-01/02/03: Transaction ledger / Receivables / Refund approval — enums
// ---------------------------------------------------------------------------

export const ReceivableStatusSchema = z
  .enum([
    'uncollected',
    'rebilling',
    'convenience_payment_in_progress',
    'bad_debt_target',
    'bad_debt_excluded',
  ])
  .openapi({ title: 'ReceivableStatus', description: '未回収債権の対応ステータス' });

export const RefundRequesterRoleSchema = z.enum(['staff', 'manager', 'headquarter']).openapi({
  title: 'RefundRequesterRole',
  description: '返金申請者のロール（承認階層判定用）',
});

export const RefundApproverRoleSchema = z.enum(['system', 'headquarter', 'manager']).openapi({
  title: 'RefundApproverRole',
  description: '返金決定を行った承認者のロール',
});

export const TransactionTypeSchema = z.enum(['sale', 'refund', 'payment', 'repayment']).openapi({
  title: 'TransactionType',
  description: '入出金明細の取引種別（売上/返金/入金/払戻）',
});

export const TransactionStatusSchema = z
  .enum(['confirmed', 'processing', 'canceled', 'uncollected'])
  .openapi({ title: 'TransactionStatus', description: '入出金明細の取引ステータス' });

export const UnpaidContractTypeSchema = z.enum(['main', 'option', 'ad_hoc']).openapi({
  title: 'UnpaidContractType',
  description: '未納明細の契約種別（主契約/オプション/都度請求）',
});

export const UpcomingBillingTypeSchema = z
  .enum(['standard', 'with_unpaid_rollover', 'ad_hoc'])
  .openapi({ title: 'UpcomingBillingType', description: '翌月請求区分' });

export const RefundQueueStatusSchema = z.enum(['pending', 'completed', 'rejected']).openapi({
  title: 'RefundQueueStatus',
  description: '返金承認キューのステータス（承認待ち/返金済み/却下）',
});

export const BadDebtExclusionActionSchema = z.enum(['exclude', 'release']).openapi({
  title: 'BadDebtExclusionAction',
  description: '貸倒対象外指定の操作方向（指定/解除）',
});

export const RefundDecisionSchema = z.enum(['approve', 'reject']).openapi({
  title: 'RefundDecision',
  description: '返金申請の決定内容（承認/却下）',
});

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export const BillingLineItemSchema = z
  .object({
    id: z.string().openapi({ example: 'BLI-0001', description: '請求明細ID' }),
    billing_record_id: z.string().openapi({ example: 'BR-0001', description: '請求ID' }),
    source: LineItemSourceSchema,
    contract_id: z
      .string()
      .nullable()
      .openapi({ example: 'MC-0001', description: '契約ID（契約から選択した場合）' }),
    label: z.string().openapi({ example: '月会費（レギュラー会員）', description: '請求項目名' }),
    amount: z.number().openapi({ example: 9900, description: '請求額（円）' }),
    tax_rate: z.number().openapi({ example: 0.1, description: '税率' }),
    reason: z
      .string()
      .nullable()
      .openapi({ description: '手動追加時の事由（source=manual時は必須）' }),
    payment_status: LineItemPaymentStatusSchema,
    created_at: z.string().openapi({ description: '作成日時 ISO-8601' }),
    created_by: z.string().openapi({ example: 'System', description: '作成者' }),
  })
  .openapi({ title: 'BillingLineItem', description: '請求明細1件' });

export const FeeAdjustmentSchema = z
  .object({
    id: z.string().openapi({ example: 'FA-0001', description: '会費調整ID' }),
    billing_record_id: z.string().openapi({ example: 'BR-0001', description: '請求ID' }),
    target_line_item_id: z
      .string()
      .nullable()
      .openapi({ description: '調整対象の明細ID（nullは請求全体が対象）' }),
    pattern: FeeAdjustmentPatternSchema,
    value: z.number().openapi({ description: '調整値（円または%、patternに依存）' }),
    original_amount: z.number().openapi({ description: '調整前の金額（円）' }),
    resulting_amount: z.number().openapi({ description: '調整後の金額（円）' }),
    reason: z.string().min(1).openapi({ description: '調整事由（必須）' }),
    applied_by: z.string().openapi({ description: '適用者' }),
    applied_at: z.string().openapi({ description: '適用日時 ISO-8601' }),
    status: FeeAdjustmentStatusSchema,
  })
  .openapi({ title: 'FeeAdjustment', description: '会費調整履歴1件（追記専用）' });

export const RefundLineItemRefundSchema = z
  .object({
    line_item_id: z.string().openapi({ example: 'BLI-0001', description: '返金対象の明細ID' }),
    amount: z.number().positive().openapi({ description: '返金額（円）' }),
  })
  .openapi({ title: 'RefundLineItemRefund', description: '部分返金時の明細別返金額' });

export const RefundRequestSchema = z
  .object({
    id: z.string().openapi({ example: 'RF-0001', description: '返金申請ID' }),
    billing_record_id: z.string().openapi({ example: 'BR-0001', description: '請求ID' }),
    type: RefundRequestTypeSchema,
    line_item_refunds: z
      .array(RefundLineItemRefundSchema)
      .openapi({ description: '部分返金時の明細別内訳（type=partialのみ）' }),
    amount: z.number().openapi({ description: '返金合計額（円）' }),
    reason: z.string().min(1).openapi({ description: '返金事由（必須）' }),
    detail: z.string().nullable().openapi({ description: '一覧簡易返金の自由記述詳細' }),
    handling: RefundHandlingSchema,
    reversal_window_expired: z
      .boolean()
      .openapi({ description: 'SBPS取消の90日期限を超過しているか' }),
    status: RefundRequestStatusSchema,
    requested_by: z.string().openapi({ description: '申請者' }),
    requested_by_id: z.string().openapi({ description: '申請者ID（返金キューの表示・監査用）' }),
    requested_at: z.string().openapi({ description: '申請日時 ISO-8601' }),
    requester_role: RefundRequesterRoleSchema.openapi({
      description: '申請者ロール（承認階層判定用、申請時に確定）',
    }),
    approver_id: z
      .string()
      .nullable()
      .openapi({ description: '承認者ID（承認/却下決定時のみ設定）' }),
    approver_name: z
      .string()
      .nullable()
      .openapi({ description: '承認者名（承認/却下決定時のみ設定）' }),
    approver_role: RefundApproverRoleSchema.nullable().openapi({
      description: '承認者ロール（承認/却下決定時のみ設定）',
    }),
    approved_at: z
      .string()
      .nullable()
      .openapi({ description: '承認/却下決定日時 ISO-8601（両方の結果で使用）' }),
  })
  .openapi({ title: 'RefundRequest', description: '返金申請1件' });

export const BillingRecordListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'BR-0001', description: '請求ID' }),
    store_id: z.string().openapi({ example: 'STORE-001', description: '店舗ID' }),
    store_name: z.string().openapi({ example: 'JOYFIT渋谷店', description: '店舗名' }),
    member_id: z.string().openapi({ example: 'MEM-0001', description: '利用者ID' }),
    member_name: z.string().openapi({ example: '山田 太郎', description: '利用者名' }),
    billing_type: BillingTypeSchema,
    billing_month: z.string().openapi({ example: '2026-07', description: '対象年月 YYYY-MM' }),
    billing_date: z.string().openapi({ example: '2026/07/01', description: '請求日 YYYY/MM/DD' }),
    payment_method: PaymentMethodSchema,
    billed_amount: z.number().openapi({ description: '請求額（税込・円）' }),
    paid_amount: z.number().openapi({ description: '入金額（円）' }),
    refunded_amount: z.number().openapi({ description: '返金額（円）' }),
    outstanding_amount: z.number().openapi({ description: '未納額（円）' }),
    confirmation_status: ConfirmationStatusSchema,
    is_bad_debt: z.boolean().openapi({ description: '貸倒確定フラグ' }),
    refund_status: BillingRefundStatusSchema,
  })
  .openapi({ title: 'BillingRecordListItem', description: '売上一覧の1行' });

export const BillingRecordSchema = BillingRecordListItemSchema.extend({
  notes: z.string().nullable().openapi({ description: '備考' }),
  confirmed_by: z.string().nullable().openapi({ description: '確定者' }),
  confirmed_at: z.string().nullable().openapi({ description: '確定日時 ISO-8601' }),
  created_at: z.string().openapi({ description: '作成日時 ISO-8601' }),
  updated_at: z.string().openapi({ description: '更新日時 ISO-8601' }),
  updated_by: z.string().openapi({ description: '最終更新者' }),
  bad_debt_excluded: z.boolean().openapi({ description: '貸倒対象外指定フラグ' }),
  bad_debt_exclusion_reason: z
    .string()
    .nullable()
    .openapi({ description: '貸倒対象外指定/解除の理由（両方向で必須）' }),
  bad_debt_excluded_by: z
    .string()
    .nullable()
    .openapi({ description: '貸倒対象外指定/解除を行った担当者' }),
  bad_debt_excluded_at: z
    .string()
    .nullable()
    .openapi({ description: '貸倒対象外指定/解除日時 ISO-8601' }),
  receivable_status: ReceivableStatusSchema.nullable().openapi({
    description: '未回収債権の対応ステータス（未納額0円の場合はnull）',
  }),
}).openapi({ title: 'BillingRecord', description: '請求（売上）レコード' });

export const BillingRecordDetailSchema = BillingRecordSchema.extend({
  line_items: z.array(BillingLineItemSchema).openapi({ description: '請求明細一覧' }),
  fee_adjustments: z
    .array(FeeAdjustmentSchema)
    .openapi({ description: '会費調整履歴（新しい順）' }),
  refund_requests: z
    .array(RefundRequestSchema)
    .openapi({ description: '返金申請履歴（新しい順）' }),
}).openapi({ title: 'BillingRecordDetail', description: '請求詳細（明細・履歴込み）' });

export const BillingSummarySchema = z
  .object({
    total_sales: z.number().openapi({ description: '売上合計（円）' }),
    total_payments: z.number().openapi({ description: '入金合計（円）' }),
    total_outstanding: z.number().openapi({ description: '未納合計（円）' }),
    total_refunds: z.number().openapi({ description: '返金合計（円）' }),
    payment_count: z.number().int().openapi({ description: '入金件数' }),
    refund_count: z.number().int().openapi({ description: '返金件数' }),
    confirmed_count: z.number().int().openapi({ description: '確定済件数' }),
    unconfirmed_count: z.number().int().openapi({ description: '未確定件数' }),
    bad_debt_count: z.number().int().openapi({ description: '貸倒件数' }),
    bad_debt_amount: z.number().openapi({ description: '貸倒金額（円）' }),
  })
  .openapi({ title: 'BillingSummary', description: '売上管理サマリー（KPI）' });

// ---------------------------------------------------------------------------
// List / Summary — request & response
// ---------------------------------------------------------------------------

export const GetBillingRecordsQuerySchema = z
  .object({
    store_id: z.string().optional().openapi({ description: '店舗IDでフィルタ' }),
    billing_month: z
      .string()
      .optional()
      .openapi({ example: '2026-07', description: '対象年月（省略時は当月）' }),
    billing_type: BillingTypeSchema.optional(),
    confirmation_status: ConfirmationStatusSchema.optional(),
    unpaid_only: z.coerce.boolean().optional().openapi({ description: '未納のみ表示' }),
    search: z.string().optional().openapi({ description: '請求ID・利用者名で検索' }),
    sort_by: z
      .enum([
        'billing_date',
        'billed_amount',
        'outstanding_amount',
        'id',
        'store_name',
        'member_name',
        'billing_type',
        'payment_method',
        'confirmation_status',
      ])
      .optional()
      .openapi({ description: 'ソート項目（既定: billing_date）' }),
    sort_order: z
      .enum(['asc', 'desc'])
      .optional()
      .openapi({ description: 'ソート順（既定: desc）' }),
    page: z.coerce
      .number()
      .int()
      .min(1)
      .optional()
      .openapi({ description: 'ページ番号（既定: 1）' }),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .openapi({ description: '1ページあたり件数（既定: 20）' }),
  })
  .openapi({ title: 'GetBillingRecordsQuery', description: '売上一覧クエリ' });

export const GetBillingRecordsResponseSchema = z
  .object({
    items: z.array(BillingRecordListItemSchema),
    total: z.number().int(),
    total_all_items: z.number().int().openapi({ description: '絞り込み前の全件数' }),
    page: z.number().int(),
    limit: z.number().int(),
  })
  .openapi({ title: 'GetBillingRecordsResponse', description: '売上一覧レスポンス' });

export const GetBillingRecordsSummaryQuerySchema = z
  .object({
    store_id: z.string().optional().openapi({ description: '店舗IDでフィルタ' }),
    billing_month: z
      .string()
      .optional()
      .openapi({ example: '2026-07', description: '対象年月（省略時は当月）' }),
  })
  .openapi({ title: 'GetBillingRecordsSummaryQuery', description: '売上サマリークエリ' });

export const GetBillingRecordDetailResponseSchema = BillingRecordDetailSchema;

// ---------------------------------------------------------------------------
// Mutation request/response schemas
// ---------------------------------------------------------------------------

export const ConfirmBillingRecordsRequestSchema = z
  .object({
    ids: z.array(z.string()).openapi({ description: '一括確定対象の請求IDリスト' }),
  })
  .openapi({ title: 'ConfirmBillingRecordsRequest', description: '一括確定リクエスト' });

export const ConfirmBillingRecordsResponseSchema = z
  .object({
    confirmed_ids: z.array(z.string()),
    skipped_ids: z.array(z.string()),
  })
  .openapi({ title: 'ConfirmBillingRecordsResponse', description: '一括確定レスポンス' });

export const ToggleConfirmationRequestSchema = z
  .object({
    status: ConfirmationStatusSchema,
  })
  .openapi({ title: 'ToggleConfirmationRequest', description: '確定/未確定切替リクエスト' });

const AddLineItemFromContractSchema = z.object({
  source: z.literal('contract'),
  contract_id: z.string().openapi({ example: 'MC-0002', description: '契約ID' }),
});

const AddLineItemManualSchema = z.object({
  source: z.literal('manual'),
  label: z.string().min(1).openapi({ example: '臨時清掃料', description: '請求項目名' }),
  amount: z.number().positive().openapi({ example: 1100, description: '請求額（円）' }),
  tax_rate: z.number().openapi({ example: 0.1, description: '税率' }),
  reason: z
    .string()
    .min(1)
    .openapi({ example: '破損対応費用', description: '手動追加事由（必須）' }),
});

export const AddLineItemRequestSchema = z
  .discriminatedUnion('source', [AddLineItemFromContractSchema, AddLineItemManualSchema])
  .openapi({ title: 'AddLineItemRequest', description: '請求明細追加リクエスト' });

export const ApplyFeeAdjustmentRequestSchema = z
  .object({
    target_line_item_id: z
      .string()
      .nullable()
      .optional()
      .openapi({ description: '調整対象の明細ID（省略/nullは請求全体）' }),
    pattern: FeeAdjustmentPatternSchema,
    value: z.number().openapi({ description: '調整値（円または%、patternに依存）' }),
    reason: z
      .string()
      .min(1)
      .openapi({ example: '会員クレーム対応による割引', description: '調整事由（必須）' }),
  })
  .openapi({ title: 'ApplyFeeAdjustmentRequest', description: '会費調整リクエスト' });

export const SubmitRefundRequestSchema = z
  .object({
    type: RefundRequestTypeSchema,
    line_item_refunds: z
      .array(RefundLineItemRefundSchema)
      .optional()
      .openapi({ description: '部分返金時の明細別内訳（type=partial時は必須）' }),
    reason: z
      .string()
      .min(1)
      .openapi({ example: '会員都合によるキャンセル', description: '返金事由（必須）' }),
  })
  .superRefine((value, ctx) => {
    if (
      value.type === 'partial' &&
      (!value.line_item_refunds || value.line_item_refunds.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'line_item_refunds is required when type is partial',
        path: ['line_item_refunds'],
      });
    }
  })
  .openapi({ title: 'SubmitRefundRequest', description: '返金申請リクエスト（詳細画面）' });

export const SubmitBulkRefundRequestSchema = z
  .object({
    billing_record_ids: z
      .array(z.string())
      .min(1)
      .openapi({ description: '返金対象の請求IDリスト' }),
    reason_code: z
      .string()
      .min(1)
      .openapi({ example: 'duplicate_charge', description: '返金理由コード' }),
    detail: z.string().nullable().optional().openapi({ description: '詳細・備考' }),
  })
  .openapi({ title: 'SubmitBulkRefundRequest', description: '一覧簡易返金申請リクエスト' });

export const SubmitBulkRefundResponseSchema = z
  .object({
    created: z.array(
      z.object({
        billing_record_id: z.string(),
        refund_request_id: z.string(),
      }),
    ),
  })
  .openapi({ title: 'SubmitBulkRefundResponse', description: '一覧簡易返金申請レスポンス' });

export const ManualBillingRegistrationRequestSchema = z
  .object({
    store_id: z.string().openapi({ example: 'STORE-001', description: '店舗ID' }),
    member_id: z.string().openapi({ example: 'MEM-0001', description: '利用者ID' }),
    billing_month: z
      .string()
      .min(1)
      .openapi({ example: '2026-08', description: '対象年月 YYYY-MM（必須）' }),
    confirmation_status: ConfirmationStatusSchema.optional().openapi({
      description: '登録時の確定状態（省略時は unconfirmed）',
    }),
    notes: z.string().nullable().optional().openapi({ description: '備考' }),
    line_items: z
      .array(AddLineItemRequestSchema)
      .min(1)
      .openapi({ description: '請求明細（1件以上必須）' }),
  })
  .openapi({ title: 'ManualBillingRegistrationRequest', description: '手動請求登録リクエスト' });

export const ManualBillingRegistrationResponseSchema = z
  .object({
    id: z.string().openapi({ example: 'BR-0042', description: '作成された請求ID' }),
    billing_type: BillingTypeSchema,
    confirmation_status: ConfirmationStatusSchema,
  })
  .openapi({ title: 'ManualBillingRegistrationResponse', description: '手動請求登録レスポンス' });

export const ExportBillingRecordsRequestSchema = z
  .object({
    billing_month: z.string().openapi({ example: '2026-07', description: '対象年月 YYYY-MM' }),
    store_id: z.string().optional().openapi({ description: '店舗IDでフィルタ' }),
    entry_type: AccountingEntryTypeSchema,
  })
  .openapi({ title: 'ExportBillingRecordsRequest', description: '会計CSV出力リクエスト' });

export const StoreMemberOptionSchema = z
  .object({
    id: z.string().openapi({ example: 'MEM-0001', description: '利用者ID' }),
    name: z.string().openapi({ example: '山田 太郎', description: '利用者名' }),
    has_unpaid: z.boolean().openapi({ description: '未納金の有無' }),
  })
  .openapi({ title: 'StoreMemberOption', description: '店舗スコープの利用者選択肢' });

export const StoreMembersResponseSchema = z
  .object({
    members: z.array(StoreMemberOptionSchema),
  })
  .openapi({ title: 'StoreMembersResponse', description: '店舗所属の利用者一覧レスポンス' });

// ---------------------------------------------------------------------------
// F-01-01: Transaction ledger (入出金明細)
// ---------------------------------------------------------------------------

export const TransactionRecordSchema = z
  .object({
    id: z.string().openapi({ example: 'TXN-20260301-001', description: '取引ID（合成）' }),
    transaction_date: z.string().openapi({ example: '2026/03/01', description: '取引日' }),
    member_id: z.string().openapi({ example: 'MEM-2255', description: '会員ID' }),
    member_name: z.string().openapi({ example: '田中太郎', description: '会員名' }),
    store_id: z.string().openapi({ example: 'STORE-014', description: '店舗ID' }),
    store_name: z.string().openapi({ example: 'FIT365八潮店', description: '店舗名' }),
    transaction_type: TransactionTypeSchema,
    billing_record_id: z
      .string()
      .openapi({ example: 'BR-11070', description: '請求ID（返金申請の対象指定に使用）' }),
    billing_line_item_id: z
      .string()
      .openapi({ example: 'BLI-11070-01', description: '請求明細ID' }),
    amount_ex_tax: z.number().openapi({ description: '税抜額（円）' }),
    tax_rate: z.number().openapi({ example: 10, description: '税率（%）' }),
    amount_inc_tax: z.number().openapi({ description: '税込額（円）' }),
    payment_method: PaymentMethodSchema,
    status: TransactionStatusSchema,
  })
  .openapi({ title: 'TransactionRecord', description: '入出金明細の1行（派生ビュー）' });

export const GetTransactionLedgerQuerySchema = z
  .object({
    date_from: z.string().optional().openapi({ example: '2026-03-01', description: '取引日 From' }),
    date_to: z.string().optional().openapi({ example: '2026-03-31', description: '取引日 To' }),
    store_id: z.string().optional().openapi({ description: '店舗IDでフィルタ' }),
    transaction_type: TransactionTypeSchema.optional(),
    payment_method: PaymentMethodSchema.optional(),
    search: z.string().optional().openapi({ description: '会員ID・氏名で検索' }),
    page: z.coerce
      .number()
      .int()
      .min(1)
      .optional()
      .openapi({ description: 'ページ番号（既定: 1）' }),
    page_size: z.coerce
      .number()
      .int()
      .min(1)
      .max(200)
      .optional()
      .openapi({ description: '1ページあたり件数（既定: 50）' }),
  })
  .openapi({ title: 'GetTransactionLedgerQuery', description: '入出金明細一覧クエリ' });

export const GetTransactionLedgerResponseSchema = z
  .object({
    items: z.array(TransactionRecordSchema),
    total_count: z.number().int(),
    total_all_items: z.number().int().openapi({ description: '絞り込み前の全件数' }),
    page: z.number().int(),
    page_size: z.number().int(),
  })
  .openapi({ title: 'GetTransactionLedgerResponse', description: '入出金明細一覧レスポンス' });

export const ExportTransactionLedgerRequestSchema = z
  .object({
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    store_id: z.string().optional(),
    transaction_type: TransactionTypeSchema.optional(),
    payment_method: PaymentMethodSchema.optional(),
    search: z.string().optional(),
  })
  .openapi({ title: 'ExportTransactionLedgerRequest', description: '入出金明細CSV出力リクエスト' });

// ---------------------------------------------------------------------------
// F-01-02: Receivables (未回収一覧 / 未納明細)
// ---------------------------------------------------------------------------

export const UnpaidLineItemSchema = z
  .object({
    id: z.string().openapi({ example: 'BLI-2278-202601-001', description: '請求明細ID' }),
    month: z.string().openapi({ example: '2026/01', description: '対象月' }),
    contract_type: UnpaidContractTypeSchema,
    contract_name: z.string().openapi({ description: '契約名' }),
    amount: z.number().openapi({ description: '金額（円）' }),
    status: ReceivableStatusSchema.nullable().openapi({ description: '対応ステータス' }),
    payment_method: PaymentMethodSchema,
    jaccs_subrogation_eligible: z.boolean().optional().openapi({
      description: 'JACCS代位弁済対象（主契約かつJACCS決済の直近3ヶ月以内のみ意味を持つ）',
    }),
  })
  .openapi({ title: 'UnpaidLineItem', description: '未納明細1件（派生ビュー）' });

export const UnpaidReceivableSchema = z
  .object({
    member_id: z.string().openapi({ example: 'MEM-2278', description: '会員ID' }),
    member_name: z.string().openapi({ description: '会員名' }),
    store_id: z.string().openapi({ description: '店舗ID' }),
    store_name: z.string().openapi({ description: '店舗名' }),
    unpaid_months: z.array(z.string()).openapi({ description: '未納月一覧' }),
    total_unpaid_amount: z.number().openapi({ description: '未納金額合計（円）' }),
    last_billing_date: z.string().openapi({ description: '最終請求日' }),
    payment_method: PaymentMethodSchema,
    receivable_status: ReceivableStatusSchema.nullable().openapi({
      description: '対応ステータス（会員の未納レコードの中で最も重いもの）',
    }),
  })
  .openapi({ title: 'UnpaidReceivable', description: '会員単位の未回収サマリー（派生ビュー）' });

export const GetUnpaidReceivablesQuerySchema = z
  .object({
    unpaid_month: z
      .string()
      .optional()
      .openapi({ example: '2026-03', description: '未納月フィルタ' }),
    page: z.coerce.number().int().min(1).optional(),
    page_size: z.coerce.number().int().min(1).max(200).optional(),
  })
  .openapi({ title: 'GetUnpaidReceivablesQuery', description: '未回収一覧クエリ' });

export const GetUnpaidReceivablesResponseSchema = z
  .object({
    items: z.array(UnpaidReceivableSchema),
    total_count: z.number().int(),
    page: z.number().int(),
    page_size: z.number().int(),
  })
  .openapi({ title: 'GetUnpaidReceivablesResponse', description: '未回収一覧レスポンス' });

export const GetUnpaidDetailResponseSchema = z
  .object({
    member_id: z.string(),
    member_name: z.string(),
    store_id: z.string(),
    store_name: z.string(),
    total_unpaid_amount: z.number(),
    receivable_status: ReceivableStatusSchema.nullable(),
    line_items: z.array(UnpaidLineItemSchema),
  })
  .openapi({ title: 'GetUnpaidDetailResponse', description: '会員別未納明細レスポンス' });

export const IssueConveniencePaymentRequestSchema = z
  .object({
    member_id: z.string().openapi({ description: '対象会員ID' }),
    line_item_ids: z
      .array(z.string())
      .optional()
      .openapi({ description: '対象明細ID（省略時は会員の未納全額が対象）' }),
  })
  .openapi({
    title: 'IssueConveniencePaymentRequest',
    description: 'コンビニ決済URL発行リクエスト',
  });

export const IssueConveniencePaymentResponseSchema = z
  .object({
    member_id: z.string(),
    updated_line_item_ids: z.array(z.string()),
    receivable_status: ReceivableStatusSchema,
  })
  .openapi({
    title: 'IssueConveniencePaymentResponse',
    description: 'コンビニ決済URL発行レスポンス',
  });

export const BadDebtExclusionRequestSchema = z
  .object({
    member_id: z.string().openapi({ description: '対象会員ID' }),
    line_item_ids: z
      .array(z.string())
      .optional()
      .openapi({ description: '対象明細ID（省略時は会員の未納全レコードが対象）' }),
    action: BadDebtExclusionActionSchema,
    reason: z.string().min(1).openapi({ description: '指定/解除の理由（両方向で必須）' }),
  })
  .openapi({ title: 'BadDebtExclusionRequest', description: '貸倒対象外指定/解除リクエスト' });

export const BadDebtExclusionResponseSchema = z
  .object({
    member_id: z.string(),
    updated_line_item_ids: z.array(z.string()),
    receivable_status: ReceivableStatusSchema.nullable(),
    bad_debt_excluded_by: z.string(),
    bad_debt_excluded_at: z.string(),
  })
  .openapi({ title: 'BadDebtExclusionResponse', description: '貸倒対象外指定/解除レスポンス' });

// ---------------------------------------------------------------------------
// F-01-02: Upcoming billing (翌月請求予定)
// ---------------------------------------------------------------------------

export const UpcomingBillingEntrySchema = z
  .object({
    billing_record_id: z.string().openapi({ example: 'BR-1167', description: '請求ID' }),
    member_id: z.string(),
    member_name: z.string(),
    billing_type: UpcomingBillingTypeSchema,
    payment_method: PaymentMethodSchema,
    amount: z.number().openapi({ description: '請求金額（円）' }),
    billing_month: z.string().openapi({ example: '2026/04', description: '請求予定月' }),
    note: z.string().openapi({ description: '未納金加算等の補足（rollover以外は空文字）' }),
    unconfirmed: z.literal(true),
  })
  .openapi({ title: 'UpcomingBillingEntry', description: '翌月請求予定の1行（派生ビュー）' });

export const UpcomingBillingSummarySchema = z
  .object({
    total_amount: z.number(),
    total_count: z.number().int(),
    sbps_amount: z.number(),
    sbps_count: z.number().int(),
    jaccs_amount: z.number(),
    jaccs_count: z.number().int(),
  })
  .openapi({
    title: 'UpcomingBillingSummary',
    description: 'SBPS/JACCS内訳サマリー（全件対象、ページ非依存）',
  });

export const GetUpcomingBillingQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    page_size: z.coerce.number().int().min(1).max(200).optional(),
  })
  .openapi({ title: 'GetUpcomingBillingQuery', description: '翌月請求予定一覧クエリ' });

export const GetUpcomingBillingResponseSchema = z
  .object({
    items: z.array(UpcomingBillingEntrySchema),
    total_count: z.number().int(),
    page: z.number().int(),
    page_size: z.number().int(),
    summary: UpcomingBillingSummarySchema,
  })
  .openapi({ title: 'GetUpcomingBillingResponse', description: '翌月請求予定一覧レスポンス' });

// ---------------------------------------------------------------------------
// F-01-03: Refund approval queue (返金手続き一覧)
// ---------------------------------------------------------------------------

export const RefundQueueEntrySchema = z
  .object({
    refund_id: z.string().openapi({ example: 'RF-0158', description: '返金申請ID' }),
    billing_record_id: z
      .string()
      .openapi({ example: 'BR-0001', description: '返金対象の売上（請求記録）ID' }),
    store_id: z.string(),
    store_name: z.string(),
    member_id: z.string(),
    member_name: z.string(),
    product_name: z.string().openapi({ description: '返金対象明細の商品名（結合表示）' }),
    sale_amount: z.number().openapi({ description: '返金対象明細の元売上額（円）' }),
    refund_amount: z.number().openapi({ description: '返金額（円）' }),
    status: RefundQueueStatusSchema,
    payment_method: PaymentMethodSchema,
    requester_id: z.string(),
    requester_name: z.string(),
    requester_role: RefundRequesterRoleSchema,
    approver_id: z.string().nullable(),
    approver_name: z.string().nullable(),
    approver_role: RefundApproverRoleSchema.nullable(),
    requested_at: z.string().nullable(),
    approved_at: z.string().nullable(),
    reason: z.string(),
  })
  .openapi({ title: 'RefundQueueEntry', description: '返金承認キューの1行（派生ビュー）' });

export const GetRefundQueueQuerySchema = z
  .object({
    status: RefundQueueStatusSchema.optional(),
    payment_method: PaymentMethodSchema.optional(),
    requester_role: RefundRequesterRoleSchema.optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    search: z.string().optional().openapi({ description: '返金ID・会員名で検索' }),
    sort_by: z
      .enum(['refund_id', 'sale_amount', 'refund_amount', 'status', 'requested_at', 'approved_at'])
      .optional(),
    sort_order: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    page_size: z.coerce.number().int().min(1).max(200).optional(),
  })
  .openapi({ title: 'GetRefundQueueQuery', description: '返金承認キュー一覧クエリ' });

export const PendingRefundSummarySchema = z
  .object({
    pending_count: z.number().int(),
    pending_amount: z.number(),
  })
  .openapi({
    title: 'PendingRefundSummary',
    description: '承認待ち件数・合計額（全件対象、ページ非依存）',
  });

export const GetRefundQueueResponseSchema = z
  .object({
    items: z.array(RefundQueueEntrySchema),
    total_count: z.number().int(),
    total_all_items: z.number().int().openapi({ description: '絞り込み前の全件数' }),
    page: z.number().int(),
    page_size: z.number().int(),
    pending_summary: PendingRefundSummarySchema,
  })
  .openapi({ title: 'GetRefundQueueResponse', description: '返金承認キュー一覧レスポンス' });

export const RefundDecisionRequestSchema = z
  .object({
    decision: RefundDecisionSchema,
  })
  .openapi({ title: 'RefundDecisionRequest', description: '返金申請の単体承認/却下リクエスト' });

export const BulkRefundDecisionRequestSchema = z
  .object({
    ids: z.array(z.string()).min(1).openapi({ description: '対象の返金申請IDリスト' }),
    decision: RefundDecisionSchema,
  })
  .openapi({
    title: 'BulkRefundDecisionRequest',
    description: '返金申請の一括承認/却下リクエスト',
  });

export const BulkRefundDecisionResponseSchema = z
  .object({
    decided_ids: z.array(z.string()).openapi({ description: '決定処理を行ったID' }),
    excluded_ids: z
      .array(z.object({ id: z.string(), reason: z.string() }))
      .openapi({ description: '権限外/非pendingのため除外されたIDと理由' }),
  })
  .openapi({
    title: 'BulkRefundDecisionResponse',
    description: '返金申請の一括承認/却下レスポンス',
  });

export const ExportRefundQueueRequestSchema = z
  .object({
    status: RefundQueueStatusSchema.optional(),
    payment_method: PaymentMethodSchema.optional(),
    requester_role: RefundRequesterRoleSchema.optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    search: z.string().optional(),
  })
  .openapi({
    title: 'ExportRefundQueueRequest',
    description: '返金CSV出力リクエスト（省略可、SBPS/未完了は常に除外）',
  });

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type BillingType = z.infer<typeof BillingTypeSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type ConfirmationStatus = z.infer<typeof ConfirmationStatusSchema>;
export type BillingRefundStatus = z.infer<typeof BillingRefundStatusSchema>;
export type LineItemSource = z.infer<typeof LineItemSourceSchema>;
export type LineItemPaymentStatus = z.infer<typeof LineItemPaymentStatusSchema>;
export type FeeAdjustmentPattern = z.infer<typeof FeeAdjustmentPatternSchema>;
export type FeeAdjustmentStatus = z.infer<typeof FeeAdjustmentStatusSchema>;
export type RefundRequestType = z.infer<typeof RefundRequestTypeSchema>;
export type RefundHandling = z.infer<typeof RefundHandlingSchema>;
export type RefundRequestStatus = z.infer<typeof RefundRequestStatusSchema>;
export type AccountingEntryType = z.infer<typeof AccountingEntryTypeSchema>;

export type BillingLineItem = z.infer<typeof BillingLineItemSchema>;
export type FeeAdjustment = z.infer<typeof FeeAdjustmentSchema>;
export type RefundLineItemRefund = z.infer<typeof RefundLineItemRefundSchema>;
export type RefundRequest = z.infer<typeof RefundRequestSchema>;
export type BillingRecordListItem = z.infer<typeof BillingRecordListItemSchema>;
export type BillingRecord = z.infer<typeof BillingRecordSchema>;
export type BillingRecordDetail = z.infer<typeof BillingRecordDetailSchema>;
export type BillingSummary = z.infer<typeof BillingSummarySchema>;

export type GetBillingRecordsQuery = z.infer<typeof GetBillingRecordsQuerySchema>;
export type GetBillingRecordsResponse = z.infer<typeof GetBillingRecordsResponseSchema>;
export type GetBillingRecordsSummaryQuery = z.infer<typeof GetBillingRecordsSummaryQuerySchema>;
export type GetBillingRecordDetailResponse = z.infer<typeof GetBillingRecordDetailResponseSchema>;

export type ConfirmBillingRecordsRequest = z.infer<typeof ConfirmBillingRecordsRequestSchema>;
export type ConfirmBillingRecordsResponse = z.infer<typeof ConfirmBillingRecordsResponseSchema>;
export type ToggleConfirmationRequest = z.infer<typeof ToggleConfirmationRequestSchema>;
export type AddLineItemRequest = z.infer<typeof AddLineItemRequestSchema>;
export type ApplyFeeAdjustmentRequest = z.infer<typeof ApplyFeeAdjustmentRequestSchema>;
export type SubmitRefundRequest = z.infer<typeof SubmitRefundRequestSchema>;
export type SubmitBulkRefundRequest = z.infer<typeof SubmitBulkRefundRequestSchema>;
export type SubmitBulkRefundResponse = z.infer<typeof SubmitBulkRefundResponseSchema>;
export type ManualBillingRegistrationRequest = z.infer<
  typeof ManualBillingRegistrationRequestSchema
>;
export type ManualBillingRegistrationResponse = z.infer<
  typeof ManualBillingRegistrationResponseSchema
>;
export type ExportBillingRecordsRequest = z.infer<typeof ExportBillingRecordsRequestSchema>;
export type StoreMemberOption = z.infer<typeof StoreMemberOptionSchema>;
export type StoreMembersResponse = z.infer<typeof StoreMembersResponseSchema>;

export type ReceivableStatus = z.infer<typeof ReceivableStatusSchema>;
export type RefundRequesterRole = z.infer<typeof RefundRequesterRoleSchema>;
export type RefundApproverRole = z.infer<typeof RefundApproverRoleSchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;
export type UnpaidContractType = z.infer<typeof UnpaidContractTypeSchema>;
export type UpcomingBillingType = z.infer<typeof UpcomingBillingTypeSchema>;
export type RefundQueueStatus = z.infer<typeof RefundQueueStatusSchema>;
export type BadDebtExclusionAction = z.infer<typeof BadDebtExclusionActionSchema>;
export type RefundDecision = z.infer<typeof RefundDecisionSchema>;

export type TransactionRecord = z.infer<typeof TransactionRecordSchema>;
export type GetTransactionLedgerQuery = z.infer<typeof GetTransactionLedgerQuerySchema>;
export type GetTransactionLedgerResponse = z.infer<typeof GetTransactionLedgerResponseSchema>;
export type ExportTransactionLedgerRequest = z.infer<typeof ExportTransactionLedgerRequestSchema>;

export type UnpaidLineItem = z.infer<typeof UnpaidLineItemSchema>;
export type UnpaidReceivable = z.infer<typeof UnpaidReceivableSchema>;
export type GetUnpaidReceivablesQuery = z.infer<typeof GetUnpaidReceivablesQuerySchema>;
export type GetUnpaidReceivablesResponse = z.infer<typeof GetUnpaidReceivablesResponseSchema>;
export type GetUnpaidDetailResponse = z.infer<typeof GetUnpaidDetailResponseSchema>;
export type IssueConveniencePaymentRequest = z.infer<typeof IssueConveniencePaymentRequestSchema>;
export type IssueConveniencePaymentResponse = z.infer<typeof IssueConveniencePaymentResponseSchema>;
export type BadDebtExclusionRequest = z.infer<typeof BadDebtExclusionRequestSchema>;
export type BadDebtExclusionResponse = z.infer<typeof BadDebtExclusionResponseSchema>;

export type UpcomingBillingEntry = z.infer<typeof UpcomingBillingEntrySchema>;
export type UpcomingBillingSummary = z.infer<typeof UpcomingBillingSummarySchema>;
export type GetUpcomingBillingQuery = z.infer<typeof GetUpcomingBillingQuerySchema>;
export type GetUpcomingBillingResponse = z.infer<typeof GetUpcomingBillingResponseSchema>;

export type RefundQueueEntry = z.infer<typeof RefundQueueEntrySchema>;
export type GetRefundQueueQuery = z.infer<typeof GetRefundQueueQuerySchema>;
export type PendingRefundSummary = z.infer<typeof PendingRefundSummarySchema>;
export type GetRefundQueueResponse = z.infer<typeof GetRefundQueueResponseSchema>;
export type RefundDecisionRequest = z.infer<typeof RefundDecisionRequestSchema>;
export type BulkRefundDecisionRequest = z.infer<typeof BulkRefundDecisionRequestSchema>;
export type BulkRefundDecisionResponse = z.infer<typeof BulkRefundDecisionResponseSchema>;
export type ExportRefundQueueRequest = z.infer<typeof ExportRefundQueueRequestSchema>;
