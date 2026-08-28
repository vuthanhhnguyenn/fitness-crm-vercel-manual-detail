import type {
  AddLineItemRequest,
  ApplyFeeAdjustmentRequest,
  BadDebtExclusionRequest,
  BadDebtExclusionResponse,
  BillingLineItem,
  BillingRecord,
  BillingRecordListItem,
  BillingType as BillingTypeEnum,
  BulkRefundDecisionResponse,
  ConfirmationStatus,
  FeeAdjustment,
  GetBillingRecordsQuery,
  GetRefundQueueQuery,
  GetRefundQueueResponse,
  GetTransactionLedgerQuery,
  GetTransactionLedgerResponse,
  GetUnpaidDetailResponse,
  GetUnpaidReceivablesQuery,
  GetUnpaidReceivablesResponse,
  GetUpcomingBillingQuery,
  GetUpcomingBillingResponse,
  IssueConveniencePaymentRequest,
  IssueConveniencePaymentResponse,
  ManualBillingRegistrationRequest,
  PaymentMethod,
  ReceivableStatus,
  RefundDecision,
  RefundQueueEntry,
  RefundQueueStatus,
  RefundRequest,
  RefundRequesterRole,
  SubmitRefundRequest,
  TransactionRecord,
  TransactionStatus,
  UnpaidContractType,
  UnpaidLineItem,
  UnpaidReceivable,
  UpcomingBillingEntry,
  UpcomingBillingType,
} from '@/app/api/_schemas/billing.schema';

import type { DbType } from '../_db.types';
import type {
  ApprovalActor,
  BillingDataScope,
  BillingRecordsType,
  RefundActor,
} from '../types/billing.type';

let nextBillingRecordId = 1;
let nextLineItemId = 1;
let nextFeeAdjustmentId = 1;
let nextRefundRequestId = 1;

function pad(id: number): string {
  return String(id).padStart(4, '0');
}

function currentBillingMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function nextBillingMonth(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

/** 'YYYY/MM' label for the calendar month `monthsBeforeNext` months before the upcoming billing month. */
function rolloverMonthLabel(monthsBeforeNext: number): string {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + 1 - monthsBeforeNext, 1);
  return `${target.getFullYear()}/${String(target.getMonth() + 1).padStart(2, '0')}`;
}

/** 'YYYY-MM' → 'YYYY/MM' (F-01-01/02/03 read-models display months with a slash separator). */
function formatMonthSlash(month: string): string {
  return month.replace('-', '/');
}

/** 'YYYY/MM/DD' → 'YYYYMMDD', for synthesizing ledger transaction ids. */
function compactDate(slashDate: string): string {
  return slashDate.replaceAll('/', '');
}

/** 'YYYY/MM/DD' → 'YYYY-MM-DD', for comparing against date_from/date_to query filters. */
function slashToIsoDate(slashDate: string): string {
  return slashDate.replaceAll('/', '-');
}

/** ISO-8601 datetime → 'YYYY/MM/DD'. */
function isoToSlash(iso: string): string {
  return iso.slice(0, 10).replaceAll('-', '/');
}

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

const RECEIVABLE_STATUS_SEVERITY: Record<ReceivableStatus, number> = {
  bad_debt_excluded: 5,
  bad_debt_target: 4,
  convenience_payment_in_progress: 3,
  rebilling: 2,
  uncollected: 1,
};

function rollUpReceivableStatus(statuses: (ReceivableStatus | null)[]): ReceivableStatus | null {
  const present = statuses.filter((s): s is ReceivableStatus => s != null);
  if (present.length === 0) return null;
  return present.sort((a, b) => RECEIVABLE_STATUS_SEVERITY[b] - RECEIVABLE_STATUS_SEVERITY[a])[0]!;
}

/** Builds a Refund Queue entry (derived read-model) from a RefundRequest and its parent record. */
function buildRefundQueueEntry(
  refund: RefundRequest,
  record: BillingRecord,
  lineItems: BillingLineItem[],
): RefundQueueEntry {
  const targetLineItemIds =
    refund.type === 'partial'
      ? refund.line_item_refunds.map((x) => x.line_item_id)
      : lineItems.filter((li) => li.billing_record_id === record.id).map((li) => li.id);
  const targetLineItems = lineItems.filter((li) => targetLineItemIds.includes(li.id));
  const productName = targetLineItems.map((li) => li.label).join('、') || record.member_name;
  const saleAmount =
    targetLineItems.reduce((sum, li) => sum + li.amount, 0) || record.billed_amount;

  return {
    refund_id: refund.id,
    billing_record_id: record.id,
    store_id: record.store_id,
    store_name: record.store_name,
    member_id: record.member_id,
    member_name: record.member_name,
    product_name: productName,
    sale_amount: saleAmount,
    refund_amount: refund.amount,
    status: refund.status as RefundQueueStatus,
    payment_method: record.payment_method,
    requester_id: refund.requested_by_id,
    requester_name: refund.requested_by,
    requester_role: refund.requester_role,
    approver_id: refund.approver_id,
    approver_name: refund.approver_name,
    approver_role: refund.approver_role,
    requested_at: refund.requested_at,
    approved_at: refund.approved_at,
    reason: refund.reason,
  };
}

function formatBillingDate(date: Date): string {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function parseBillingDate(value: string): Date {
  const [year, month, day] = value.split('/').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

function toListItem(record: BillingRecord): BillingRecordListItem {
  return {
    id: record.id,
    store_id: record.store_id,
    store_name: record.store_name,
    member_id: record.member_id,
    member_name: record.member_name,
    billing_type: record.billing_type,
    billing_month: record.billing_month,
    billing_date: record.billing_date,
    payment_method: record.payment_method,
    billed_amount: record.billed_amount,
    paid_amount: record.paid_amount,
    refunded_amount: record.refunded_amount,
    outstanding_amount: record.outstanding_amount,
    confirmation_status: record.confirmation_status,
    is_bad_debt: record.is_bad_debt,
    refund_status: record.refund_status,
  };
}

export function createBillingTables(getDb: () => DbType) {
  const billingRecords: BillingRecordsType = {
    _rows: [],
    _lineItems: [],
    _feeAdjustments: [],
    _refundRequests: [],
    _seeded: false,

    _seed(): void {
      if (this._seeded) return;
      this._seeded = true;

      getDb().members._seed();
      getDb().stores._seed();
      const members = getDb().members.getList();
      const month = currentBillingMonth();
      const today = formatBillingDate(new Date());

      const AMOUNTS = [9900, 7980, 5980, 12980, 6480, 15000];
      const PAYMENT_METHODS: PaymentMethod[] = ['sbps', 'jaccs', 'sbps', 'sbps', 'jaccs', 'cash'];

      const sampleMembers = members.slice(0, 30);
      sampleMembers.forEach((member, index) => {
        const recordId = `BR-${pad(nextBillingRecordId++)}`;
        const amount = AMOUNTS[index % AMOUNTS.length]!;
        const paymentMethod = PAYMENT_METHODS[index % PAYMENT_METHODS.length]!;
        const isBadDebt = index === 6;
        const isRefunded = index === 3;
        // F-01-01/02/03: three pending requests, one per requester role, so
        // canApproveRefund/requiredApproverLabel have full coverage out of the box.
        const isPendingRefundStaff = index === 9;
        const isPendingRefundManager = index === 21;
        const isPendingRefundHeadquarter = index === 24;
        const isPendingRefund =
          isPendingRefundStaff || isPendingRefundManager || isPendingRefundHeadquarter;
        const isApprovedRefund = index === 12;
        const isRejectedRefund = index === 15;
        const isUnconfirmed = index % 5 === 2 && !isBadDebt;
        const isUnpaid = (index % 4 === 3 || isBadDebt) && !isUnconfirmed && !isRefunded;
        const paidAmount = isBadDebt || isUnpaid ? 0 : amount;
        const refundedAmount = isRefunded ? amount : 0;
        const outstanding = Math.max(0, amount - paidAmount - refundedAmount);
        const billingType: BillingTypeEnum = index % 6 === 0 ? 'ad_hoc' : 'monthly';

        // F-01-02 receivable_status: independent of confirmation_status/refund_status —
        // derived from outstanding_amount/is_bad_debt, with a couple of indices overridden
        // below for status variety (rebilling/convenience_payment_in_progress/bad_debt_excluded).
        const receivableStatus: ReceivableStatus | null =
          outstanding === 0 ? null : isBadDebt ? 'bad_debt_target' : 'uncollected';

        const record: BillingRecord = {
          id: recordId,
          store_id: member.store_id,
          store_name: member.store_name,
          member_id: member.id,
          member_name: member.name_kanji,
          billing_type: billingType,
          billing_month: month,
          billing_date: today,
          payment_method: paymentMethod,
          billed_amount: amount,
          paid_amount: paidAmount,
          refunded_amount: refundedAmount,
          outstanding_amount: outstanding,
          confirmation_status: isUnconfirmed ? 'unconfirmed' : 'confirmed',
          is_bad_debt: isBadDebt,
          refund_status: isPendingRefund
            ? 'pending'
            : isApprovedRefund
              ? 'approved'
              : isRejectedRefund
                ? 'rejected'
                : isRefunded
                  ? 'completed'
                  : 'none',
          notes:
            index === 0
              ? '月額プラン変更に伴う差額精算。旧プラン（スタンダード）から新プラン（プレミアム）への切替時の日割り計算分。'
              : null,
          confirmed_by: isUnconfirmed ? null : '本部 佐藤',
          confirmed_at: isUnconfirmed ? null : new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          updated_by: 'System',
          bad_debt_excluded: false,
          bad_debt_exclusion_reason: null,
          bad_debt_excluded_by: null,
          bad_debt_excluded_at: null,
          receivable_status: receivableStatus,
        };
        this._rows.push(record);

        // F-01-02 status variety for the receivables screen's manual verification walkthrough.
        if (index === 7) {
          record.receivable_status = 'convenience_payment_in_progress';
        }
        if (index === 11) {
          record.receivable_status = 'rebilling';
        }
        if (index === 19 && record.outstanding_amount > 0) {
          record.bad_debt_excluded = true;
          record.bad_debt_exclusion_reason = '分割返済の合意が成立したため';
          record.bad_debt_excluded_by = '本部 佐藤';
          record.bad_debt_excluded_at = new Date().toISOString();
          record.receivable_status = 'bad_debt_excluded';
        }

        const lineItemId = `BLI-${pad(nextLineItemId++)}`;
        this._lineItems.push({
          id: lineItemId,
          billing_record_id: recordId,
          source: 'contract',
          contract_id: 'main',
          label: '月会費（レギュラー会員）',
          amount,
          tax_rate: 0.1,
          reason: null,
          // F-01-01 ledger status coverage: index 20 is deliberately marked canceled so the
          // transaction ledger has a non-refundable row to exercise the disabled refund action.
          payment_status:
            index === 20
              ? 'canceled'
              : isRefunded
                ? 'refunded'
                : paidAmount > 0
                  ? 'confirmed'
                  : 'unpaid',
          created_at: new Date().toISOString(),
          created_by: 'System',
        });

        // A second, unpaid manual line item — exercises multi-item invoices with mixed payment status/tax rate.
        if (index === 1) {
          this._lineItems.push({
            id: `BLI-${pad(nextLineItemId++)}`,
            billing_record_id: recordId,
            source: 'manual',
            contract_id: null,
            label: '入会金',
            amount: 5500,
            tax_rate: 0.1,
            reason: '新規入会に伴う入会金',
            payment_status: 'unpaid',
            created_at: new Date().toISOString(),
            created_by: 'System',
          });
        }

        // Fee adjustment history samples — applied discount on the main line item, and a pending
        // whole-invoice discount, for 会費調整 table UI/status-badge variety.
        if (index === 2) {
          this._feeAdjustments.push({
            id: `FA-${pad(nextFeeAdjustmentId++)}`,
            billing_record_id: recordId,
            target_line_item_id: lineItemId,
            pattern: 'discount_amount',
            value: 500,
            original_amount: amount,
            resulting_amount: amount - 500,
            reason: '初回利用キャンペーン割引',
            applied_by: '田中 健一',
            applied_at: new Date().toISOString(),
            status: 'applied',
          });
        }
        if (index === 5) {
          this._feeAdjustments.push({
            id: `FA-${pad(nextFeeAdjustmentId++)}`,
            billing_record_id: recordId,
            target_line_item_id: null,
            pattern: 'discount_percent',
            value: 10,
            original_amount: amount,
            resulting_amount: Math.round(amount * 0.9),
            reason: '長期会員特典',
            applied_by: '佐藤 誠',
            applied_at: new Date().toISOString(),
            status: 'pending',
          });
        }

        // A couple of sample records get a pre-existing refund history entry for UI/summary-card variety.
        if (isRefunded) {
          const refundId = `RF-${pad(nextRefundRequestId++)}`;
          this._refundRequests.push({
            id: refundId,
            billing_record_id: recordId,
            type: 'full',
            line_item_refunds: [],
            amount,
            reason: '重複請求',
            detail: '二重請求のため',
            handling: paymentMethod === 'sbps' ? 'card_auto_reversal' : 'bank_manual_or_cashpost',
            reversal_window_expired: false,
            status: 'completed',
            requested_by: '鈴木 花子',
            requested_by_id: '10038',
            requested_at: new Date().toISOString(),
            requester_role: 'staff',
            approver_id: '10001',
            approver_name: '本部 佐藤',
            approver_role: 'headquarter',
            approved_at: new Date().toISOString(),
          });
        }
        if (isPendingRefund) {
          const refundId = `RF-${pad(nextRefundRequestId++)}`;
          const partialAmount = Math.round(amount / 2);
          const requesterRole: RefundRequesterRole = isPendingRefundManager
            ? 'manager'
            : isPendingRefundHeadquarter
              ? 'headquarter'
              : 'staff';
          const [requesterName, requesterId] = isPendingRefundManager
            ? ['山本 直樹', '10055']
            : isPendingRefundHeadquarter
              ? ['田中 健一', '10042']
              : ['鈴木 花子', '10038'];
          this._refundRequests.push({
            id: refundId,
            billing_record_id: recordId,
            type: 'partial',
            line_item_refunds: [{ line_item_id: lineItemId, amount: partialAmount }],
            amount: partialAmount,
            reason: '会員都合による一部返金',
            detail: null,
            handling: paymentMethod === 'sbps' ? 'card_auto_reversal' : 'bank_manual_or_cashpost',
            reversal_window_expired: false,
            status: 'pending',
            requested_by: requesterName!,
            requested_by_id: requesterId!,
            requested_at: new Date().toISOString(),
            requester_role: requesterRole,
            approver_id: null,
            approver_name: null,
            approver_role: null,
            approved_at: null,
          });
        }
        if (isApprovedRefund) {
          // Approving always writes 'completed' directly (FR-017) — the 'approved' enum value
          // is retained in the schema for backward compatibility but never persisted by this feature.
          this._refundRequests.push({
            id: `RF-${pad(nextRefundRequestId++)}`,
            billing_record_id: recordId,
            type: 'full',
            line_item_refunds: [],
            amount,
            reason: '会員都合によるキャンセル',
            detail: null,
            handling: paymentMethod === 'sbps' ? 'card_auto_reversal' : 'bank_manual_or_cashpost',
            reversal_window_expired: false,
            status: 'completed',
            requested_by: '鈴木 花子',
            requested_by_id: '10038',
            requested_at: new Date().toISOString(),
            requester_role: 'staff',
            approver_id: '10003',
            approver_name: '中村 陽子',
            approver_role: 'manager',
            approved_at: new Date().toISOString(),
          });
        }
        if (isRejectedRefund) {
          this._refundRequests.push({
            id: `RF-${pad(nextRefundRequestId++)}`,
            billing_record_id: recordId,
            type: 'full',
            line_item_refunds: [],
            amount,
            reason: '返金要件を満たさないため却下',
            detail: null,
            handling: paymentMethod === 'sbps' ? 'card_auto_reversal' : 'bank_manual_or_cashpost',
            reversal_window_expired: false,
            status: 'rejected',
            requested_by: '田中 健一',
            requested_by_id: '10042',
            requested_at: new Date().toISOString(),
            requester_role: 'headquarter',
            approver_id: 'SYSTEM',
            approver_name: 'システム管理者',
            approver_role: 'system',
            approved_at: new Date().toISOString(),
          });
        }
      });

      // F-01-02 upcoming-billing tab (翌月請求予定): next-calendar-month batch, still
      // unconfirmed — 7 plain monthly, 3 with an unpaid-rollover surcharge, 3 ad_hoc.
      const nextMonth = nextBillingMonth();
      const upcomingMembers = members.slice(30, 43);
      const UPCOMING_STANDARD_COUNT = 7;
      const UPCOMING_ROLLOVER_COUNT = 3;
      upcomingMembers.forEach((member, idx) => {
        const recordId = `BR-${pad(nextBillingRecordId++)}`;
        const isRollover =
          idx >= UPCOMING_STANDARD_COUNT && idx < UPCOMING_STANDARD_COUNT + UPCOMING_ROLLOVER_COUNT;
        const isAdHoc = idx >= UPCOMING_STANDARD_COUNT + UPCOMING_ROLLOVER_COUNT;
        const baseAmount = AMOUNTS[idx % AMOUNTS.length]!;
        const paymentMethod = PAYMENT_METHODS[idx % PAYMENT_METHODS.length]!;
        const rolloverMonths = isRollover ? (idx % 2 === 0 ? 1 : 2) : 0;
        const amount = baseAmount + rolloverMonths * baseAmount;
        const notes = isRollover
          ? `未納金${rolloverMonths}ヶ月分を加算（${Array.from({ length: rolloverMonths }, (_, i) =>
              rolloverMonthLabel(rolloverMonths - i),
            ).join('・')}分）`
          : null;

        const record: BillingRecord = {
          id: recordId,
          store_id: member.store_id,
          store_name: member.store_name,
          member_id: member.id,
          member_name: member.name_kanji,
          billing_type: isAdHoc ? 'ad_hoc' : 'monthly',
          billing_month: nextMonth,
          billing_date: formatBillingDate(new Date()),
          payment_method: paymentMethod,
          billed_amount: amount,
          paid_amount: 0,
          refunded_amount: 0,
          outstanding_amount: 0,
          confirmation_status: 'unconfirmed',
          is_bad_debt: false,
          refund_status: 'none',
          notes,
          confirmed_by: null,
          confirmed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          updated_by: 'System',
          bad_debt_excluded: false,
          bad_debt_exclusion_reason: null,
          bad_debt_excluded_by: null,
          bad_debt_excluded_at: null,
          receivable_status: null,
        };
        this._rows.push(record);

        this._lineItems.push({
          id: `BLI-${pad(nextLineItemId++)}`,
          billing_record_id: recordId,
          source: isAdHoc ? 'manual' : 'contract',
          contract_id: isAdHoc ? null : 'main',
          label: isAdHoc ? '都度請求（追加サービス）' : '月会費（レギュラー会員）',
          amount,
          tax_rate: 0.1,
          reason: isAdHoc ? '月途中のサービス利用追加' : null,
          payment_status: 'unpaid',
          created_at: new Date().toISOString(),
          created_by: 'System',
        });
      });
    },

    getList(query: GetBillingRecordsQuery, scope: BillingDataScope) {
      this._seed();
      const month = query.billing_month ?? currentBillingMonth();

      let items = this._rows.filter((r) => scope({ store_id: r.store_id }));
      items = items.filter((r) => r.billing_month === month);
      const totalAllItems = items.length;
      if (query.store_id) {
        items = items.filter((r) => r.store_id === query.store_id);
      }
      if (query.billing_type) {
        items = items.filter((r) => r.billing_type === query.billing_type);
      }
      if (query.confirmation_status) {
        items = items.filter((r) => r.confirmation_status === query.confirmation_status);
      }
      if (query.unpaid_only) {
        items = items.filter((r) => r.outstanding_amount > 0);
      }
      if (query.search) {
        const needle = query.search.toLowerCase();
        items = items.filter(
          (r) =>
            r.id.toLowerCase().includes(needle) || r.member_name.toLowerCase().includes(needle),
        );
      }

      const sortBy = query.sort_by ?? 'billing_date';
      const sortOrder = query.sort_order ?? 'desc';
      items = [...items].sort((a, b) => {
        const dir = sortOrder === 'asc' ? 1 : -1;
        if (sortBy === 'billed_amount') return (a.billed_amount - b.billed_amount) * dir;
        if (sortBy === 'outstanding_amount')
          return (a.outstanding_amount - b.outstanding_amount) * dir;
        if (sortBy === 'id') return a.id.localeCompare(b.id) * dir;
        if (sortBy === 'store_name') return a.store_name.localeCompare(b.store_name) * dir;
        if (sortBy === 'member_name') return a.member_name.localeCompare(b.member_name) * dir;
        if (sortBy === 'billing_type') return a.billing_type.localeCompare(b.billing_type) * dir;
        if (sortBy === 'payment_method')
          return a.payment_method.localeCompare(b.payment_method) * dir;
        if (sortBy === 'confirmation_status')
          return a.confirmation_status.localeCompare(b.confirmation_status) * dir;
        return a.billing_date.localeCompare(b.billing_date) * dir;
      });

      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const total = items.length;
      const start = (page - 1) * limit;
      const pagedItems = items.slice(start, start + limit).map(toListItem);

      return { items: pagedItems, total, total_all_items: totalAllItems, page, limit };
    },

    getSummary(params: { store_id?: string; billing_month?: string }, scope: BillingDataScope) {
      this._seed();
      const month = params.billing_month ?? currentBillingMonth();

      let items = this._rows.filter((r) => scope({ store_id: r.store_id }));
      if (params.store_id) {
        items = items.filter((r) => r.store_id === params.store_id);
      }
      items = items.filter((r) => r.billing_month === month);

      const badDebtRows = items.filter((r) => r.is_bad_debt);
      const unpaidRows = items.filter((r) => r.outstanding_amount > 0 && !r.is_bad_debt);

      return {
        total_sales: items.reduce((sum, r) => sum + r.billed_amount, 0),
        total_payments: items.reduce((sum, r) => sum + r.paid_amount, 0),
        total_outstanding: unpaidRows.reduce((sum, r) => sum + r.outstanding_amount, 0),
        total_refunds: items.reduce((sum, r) => sum + r.refunded_amount, 0),
        payment_count: items.filter((r) => r.paid_amount > 0).length,
        refund_count: items.filter((r) => r.refunded_amount > 0).length,
        confirmed_count: items.filter((r) => r.confirmation_status === 'confirmed').length,
        unconfirmed_count: items.filter((r) => r.confirmation_status === 'unconfirmed').length,
        bad_debt_count: badDebtRows.length,
        bad_debt_amount: badDebtRows.reduce((sum, r) => sum + r.outstanding_amount, 0),
      };
    },

    getById(id: string, scope: BillingDataScope) {
      this._seed();
      const record = this._rows.find((r) => r.id === id);
      if (!record || !scope({ store_id: record.store_id })) return undefined;

      const lineItems = this._lineItems.filter((li) => li.billing_record_id === id);
      const feeAdjustments = this._feeAdjustments
        .filter((fa) => fa.billing_record_id === id)
        .slice()
        .reverse();
      const refundRequests = this._refundRequests
        .filter((rr) => rr.billing_record_id === id)
        .slice()
        .reverse();

      return {
        ...record,
        line_items: lineItems,
        fee_adjustments: feeAdjustments,
        refund_requests: refundRequests,
      };
    },

    hasOutstandingBalance(memberId: string): boolean {
      this._seed();
      return this._rows.some((r) => r.member_id === memberId && r.outstanding_amount > 0);
    },

    confirmMany(ids: string[], confirmedBy: string, scope: BillingDataScope) {
      this._seed();
      const confirmed_ids: string[] = [];
      const skipped_ids: string[] = [];

      for (const id of ids) {
        const record = this._rows.find((r) => r.id === id && scope({ store_id: r.store_id }));
        if (!record) {
          skipped_ids.push(id);
          continue;
        }
        if (record.confirmation_status === 'confirmed') {
          skipped_ids.push(id);
          continue;
        }
        record.confirmation_status = 'confirmed';
        record.confirmed_by = confirmedBy;
        record.confirmed_at = new Date().toISOString();
        record.updated_at = new Date().toISOString();
        record.updated_by = confirmedBy;
        confirmed_ids.push(id);
      }

      return { confirmed_ids, skipped_ids };
    },

    toggleConfirmation(
      id: string,
      status: ConfirmationStatus,
      actor: string,
      scope: BillingDataScope,
    ) {
      this._seed();
      const record = this._rows.find((r) => r.id === id && scope({ store_id: r.store_id }));
      if (!record) return undefined;

      record.confirmation_status = status;
      if (status === 'confirmed') {
        record.confirmed_by = actor;
        record.confirmed_at = new Date().toISOString();
      } else {
        record.confirmed_by = null;
        record.confirmed_at = null;
      }
      record.updated_at = new Date().toISOString();
      record.updated_by = actor;
      return record;
    },

    addLineItem(
      billingRecordId: string,
      input: AddLineItemRequest,
      actor: string,
      scope: BillingDataScope,
    ) {
      this._seed();
      const record = this._rows.find(
        (r) => r.id === billingRecordId && scope({ store_id: r.store_id }),
      );
      if (!record) return { ok: false as const, error: 'not_found' as const };
      if (record.confirmation_status === 'confirmed') {
        return { ok: false as const, error: 'confirmed' as const };
      }
      if (this.hasOutstandingBalance(record.member_id)) {
        return { ok: false as const, error: 'outstanding_balance' as const };
      }

      let label: string;
      let amount: number;
      let taxRate: number;
      let contractId: string | null;
      let reason: string | null;

      if (input.source === 'contract') {
        const option = this.getMemberContractOptions(record.member_id).find(
          (c) => c.id === input.contract_id,
        );
        if (!option) return { ok: false as const, error: 'invalid_contract' as const };
        label = option.label;
        amount = option.amount;
        taxRate = option.tax_rate;
        contractId = option.id;
        reason = null;
      } else {
        label = input.label;
        amount = input.amount;
        taxRate = input.tax_rate;
        contractId = null;
        reason = input.reason;
      }

      const lineItem: BillingLineItem = {
        id: `BLI-${pad(nextLineItemId++)}`,
        billing_record_id: billingRecordId,
        source: input.source,
        contract_id: contractId,
        label,
        amount,
        tax_rate: taxRate,
        reason,
        payment_status: 'unpaid',
        created_at: new Date().toISOString(),
        created_by: actor,
      };
      this._lineItems.push(lineItem);

      record.billed_amount = this._lineItems
        .filter((li) => li.billing_record_id === billingRecordId)
        .reduce((sum, li) => sum + li.amount, 0);
      record.outstanding_amount = Math.max(
        0,
        record.billed_amount - record.paid_amount - record.refunded_amount,
      );
      record.updated_at = new Date().toISOString();
      record.updated_by = actor;

      return { ok: true as const, lineItem };
    },

    applyFeeAdjustment(
      billingRecordId: string,
      input: ApplyFeeAdjustmentRequest,
      actor: string,
      scope: BillingDataScope,
    ) {
      this._seed();
      const record = this._rows.find(
        (r) => r.id === billingRecordId && scope({ store_id: r.store_id }),
      );
      if (!record) return { ok: false as const, error: 'not_found' as const };
      if (record.confirmation_status === 'confirmed') {
        return { ok: false as const, error: 'confirmed' as const };
      }

      const targetLineItem = input.target_line_item_id
        ? this._lineItems.find(
            (li) => li.id === input.target_line_item_id && li.billing_record_id === billingRecordId,
          )
        : undefined;

      const originalAmount = targetLineItem ? targetLineItem.amount : record.billed_amount;
      let resultingAmount: number;
      switch (input.pattern) {
        case 'fixed_amount':
          resultingAmount = input.value;
          break;
        case 'discount_amount':
          resultingAmount = originalAmount - input.value;
          break;
        case 'discount_percent':
          resultingAmount = Math.round(originalAmount * (1 - input.value / 100));
          break;
        case 'surcharge':
          resultingAmount = originalAmount + input.value;
          break;
      }
      resultingAmount = Math.max(0, resultingAmount);

      if (targetLineItem) {
        targetLineItem.amount = resultingAmount;
        record.billed_amount = this._lineItems
          .filter((li) => li.billing_record_id === billingRecordId)
          .reduce((sum, li) => sum + li.amount, 0);
      } else {
        record.billed_amount = resultingAmount;
      }
      record.outstanding_amount = Math.max(
        0,
        record.billed_amount - record.paid_amount - record.refunded_amount,
      );
      record.updated_at = new Date().toISOString();
      record.updated_by = actor;

      const feeAdjustment: FeeAdjustment = {
        id: `FA-${pad(nextFeeAdjustmentId++)}`,
        billing_record_id: billingRecordId,
        target_line_item_id: targetLineItem?.id ?? null,
        pattern: input.pattern,
        value: input.value,
        original_amount: originalAmount,
        resulting_amount: resultingAmount,
        reason: input.reason,
        applied_by: actor,
        applied_at: new Date().toISOString(),
        status: 'applied',
      };
      this._feeAdjustments.push(feeAdjustment);

      return { ok: true as const, feeAdjustment };
    },

    createRefundRequest(
      billingRecordId: string,
      input: SubmitRefundRequest,
      actor: RefundActor,
      scope: BillingDataScope,
    ) {
      this._seed();
      const record = this._rows.find(
        (r) => r.id === billingRecordId && scope({ store_id: r.store_id }),
      );
      if (!record) return { ok: false as const, error: 'not_found' as const };

      let amount: number;
      let lineItemRefunds: { line_item_id: string; amount: number }[] = [];

      if (input.type === 'partial') {
        for (const refund of input.line_item_refunds ?? []) {
          const lineItem = this._lineItems.find(
            (li) => li.id === refund.line_item_id && li.billing_record_id === billingRecordId,
          );
          if (!lineItem || refund.amount > lineItem.amount) {
            return { ok: false as const, error: 'invalid_line_item_amount' as const };
          }
        }
        lineItemRefunds = input.line_item_refunds ?? [];
        amount = lineItemRefunds.reduce((sum, r) => sum + r.amount, 0);
      } else {
        amount = record.billed_amount - record.refunded_amount;
      }

      const handling =
        record.payment_method === 'sbps' ? 'card_auto_reversal' : 'bank_manual_or_cashpost';
      const reversalWindowExpired =
        handling === 'card_auto_reversal' && daysSince(parseBillingDate(record.billing_date)) > 90;

      const refundRequest: RefundRequest = {
        id: `RF-${pad(nextRefundRequestId++)}`,
        billing_record_id: billingRecordId,
        type: input.type,
        line_item_refunds: lineItemRefunds,
        amount,
        reason: input.reason,
        detail: null,
        handling,
        reversal_window_expired: reversalWindowExpired,
        status: 'pending',
        requested_by: actor.name,
        requested_by_id: actor.id,
        requested_at: new Date().toISOString(),
        requester_role: actor.role,
        approver_id: null,
        approver_name: null,
        approver_role: null,
        approved_at: null,
      };
      this._refundRequests.push(refundRequest);
      record.refund_status = 'pending';

      return { ok: true as const, refundRequest };
    },

    createBulkRefundRequests(
      billingRecordIds: string[],
      reasonCode: string,
      detail: string | null,
      actor: RefundActor,
      scope: BillingDataScope,
    ) {
      this._seed();
      const created: { billing_record_id: string; refund_request_id: string }[] = [];

      for (const id of billingRecordIds) {
        const record = this._rows.find((r) => r.id === id && scope({ store_id: r.store_id }));
        if (!record) continue;

        const amount = record.billed_amount - record.refunded_amount;
        const handling =
          record.payment_method === 'sbps' ? 'card_auto_reversal' : 'bank_manual_or_cashpost';
        const reversalWindowExpired =
          handling === 'card_auto_reversal' &&
          daysSince(parseBillingDate(record.billing_date)) > 90;

        const refundRequest: RefundRequest = {
          id: `RF-${pad(nextRefundRequestId++)}`,
          billing_record_id: id,
          type: 'full',
          line_item_refunds: [],
          amount,
          reason: reasonCode,
          detail,
          handling,
          reversal_window_expired: reversalWindowExpired,
          status: 'pending',
          requested_by: actor.name,
          requested_by_id: actor.id,
          requested_at: new Date().toISOString(),
          requester_role: actor.role,
          approver_id: null,
          approver_name: null,
          approver_role: null,
          approved_at: null,
        };
        this._refundRequests.push(refundRequest);
        record.refund_status = 'pending';

        created.push({ billing_record_id: id, refund_request_id: refundRequest.id });
      }

      return created;
    },

    createManualRegistration(input: ManualBillingRegistrationRequest, actor: string) {
      this._seed();

      const member = getDb()
        .members.getList()
        .find((m) => m.id === input.member_id);
      if (!member || member.store_id !== input.store_id) {
        return { ok: false as const, error: 'store_member_mismatch' as const };
      }
      if (this.hasOutstandingBalance(input.member_id)) {
        return { ok: false as const, error: 'outstanding_balance' as const };
      }

      const store = getDb().stores.getById(input.store_id);
      const recordId = `BR-${pad(nextBillingRecordId++)}`;
      const resolvedLineItems: BillingLineItem[] = [];

      for (const item of input.line_items) {
        if (item.source === 'contract') {
          const option = this.getMemberContractOptions(input.member_id).find(
            (c) => c.id === item.contract_id,
          );
          if (!option) return { ok: false as const, error: 'invalid_contract' as const };
          resolvedLineItems.push({
            id: `BLI-${pad(nextLineItemId++)}`,
            billing_record_id: recordId,
            source: 'contract',
            contract_id: option.id,
            label: option.label,
            amount: option.amount,
            tax_rate: option.tax_rate,
            reason: null,
            payment_status: 'unpaid',
            created_at: new Date().toISOString(),
            created_by: actor,
          });
        } else {
          resolvedLineItems.push({
            id: `BLI-${pad(nextLineItemId++)}`,
            billing_record_id: recordId,
            source: 'manual',
            contract_id: null,
            label: item.label,
            amount: item.amount,
            tax_rate: item.tax_rate,
            reason: item.reason,
            payment_status: 'unpaid',
            created_at: new Date().toISOString(),
            created_by: actor,
          });
        }
      }

      const billedAmount = resolvedLineItems.reduce((sum, li) => sum + li.amount, 0);
      const confirmationStatus = input.confirmation_status ?? 'unconfirmed';
      const now = new Date().toISOString();

      const record: BillingRecord = {
        id: recordId,
        store_id: input.store_id,
        store_name: store?.name ?? member.store_name,
        member_id: input.member_id,
        member_name: member.name_kanji,
        billing_type: 'manual',
        billing_month: input.billing_month,
        billing_date: formatBillingDate(new Date()),
        payment_method: 'other',
        billed_amount: billedAmount,
        paid_amount: 0,
        refunded_amount: 0,
        outstanding_amount: billedAmount,
        confirmation_status: confirmationStatus,
        is_bad_debt: false,
        refund_status: 'none',
        notes: input.notes ?? null,
        confirmed_by: confirmationStatus === 'confirmed' ? actor : null,
        confirmed_at: confirmationStatus === 'confirmed' ? now : null,
        created_at: now,
        updated_at: now,
        updated_by: actor,
        bad_debt_excluded: false,
        bad_debt_exclusion_reason: null,
        bad_debt_excluded_by: null,
        bad_debt_excluded_at: null,
        receivable_status: billedAmount > 0 ? 'uncollected' : null,
      };

      this._rows.push(record);
      this._lineItems.push(...resolvedLineItems);

      return { ok: true as const, record };
    },

    getStoreMembers(storeId: string) {
      this._seed();
      getDb().members._seed();
      return getDb()
        .members.getList()
        .filter((m) => m.store_id === storeId)
        .map((m) => ({
          id: m.id,
          name: m.name_kanji,
          has_unpaid: this.hasOutstandingBalance(m.id),
        }));
    },

    getMemberContractOptions(memberId: string) {
      const contracts = getDb().contracts.getByMemberId(memberId);
      if (!contracts) return [];

      const options = [
        {
          id: 'main',
          label: `主契約：${contracts.main_contract.plan_name}`,
          amount: contracts.main_contract.monthly_fee,
          tax_rate: 0.1,
        },
      ];
      for (const option of contracts.option_contracts) {
        options.push({
          id: option.id,
          label: `オプション：${option.name}`,
          amount: option.monthly_fee,
          tax_rate: 0.1,
        });
      }
      return options;
    },

    // -------------------------------------------------------------------------
    // F-01-01: Transaction ledger (入出金明細) — derived read-model
    // -------------------------------------------------------------------------
    getTransactionLedger(
      query: GetTransactionLedgerQuery,
      scope: BillingDataScope,
    ): GetTransactionLedgerResponse {
      this._seed();
      const records = this._rows.filter((r) => scope({ store_id: r.store_id }));
      let rows: TransactionRecord[] = [];
      let counter = 1;

      for (const record of records) {
        const lineItems = this._lineItems.filter((li) => li.billing_record_id === record.id);

        for (const li of lineItems) {
          const status: TransactionStatus =
            li.payment_status === 'canceled'
              ? 'canceled'
              : record.outstanding_amount > 0 && li.payment_status === 'unpaid'
                ? 'uncollected'
                : record.confirmation_status === 'unconfirmed'
                  ? 'processing'
                  : 'confirmed';

          rows.push({
            id: `TXN-${compactDate(record.billing_date)}-${pad3(counter++)}`,
            transaction_date: record.billing_date,
            member_id: record.member_id,
            member_name: record.member_name,
            store_id: record.store_id,
            store_name: record.store_name,
            transaction_type: 'sale',
            billing_record_id: record.id,
            billing_line_item_id: li.id,
            amount_ex_tax: Math.round(li.amount / (1 + li.tax_rate)),
            tax_rate: Math.round(li.tax_rate * 100),
            amount_inc_tax: li.amount,
            payment_method: record.payment_method,
            status,
          });
        }

        if (record.paid_amount > 0) {
          rows.push({
            id: `TXN-${compactDate(record.billing_date)}-${pad3(counter++)}`,
            transaction_date: record.confirmed_at
              ? isoToSlash(record.confirmed_at)
              : record.billing_date,
            member_id: record.member_id,
            member_name: record.member_name,
            store_id: record.store_id,
            store_name: record.store_name,
            transaction_type: 'payment',
            billing_record_id: record.id,
            billing_line_item_id: lineItems[0]?.id ?? '',
            amount_ex_tax: Math.round(record.paid_amount / 1.1),
            tax_rate: 10,
            amount_inc_tax: record.paid_amount,
            payment_method: record.payment_method,
            status: 'confirmed',
          });
        }

        const completedRefunds = this._refundRequests.filter(
          (rr) => rr.billing_record_id === record.id && rr.status === 'completed',
        );
        for (const refund of completedRefunds) {
          rows.push({
            id: `TXN-${compactDate(record.billing_date)}-${pad3(counter++)}`,
            transaction_date: refund.approved_at
              ? isoToSlash(refund.approved_at)
              : record.billing_date,
            member_id: record.member_id,
            member_name: record.member_name,
            store_id: record.store_id,
            store_name: record.store_name,
            transaction_type: 'refund',
            billing_record_id: record.id,
            billing_line_item_id:
              refund.line_item_refunds[0]?.line_item_id ?? lineItems[0]?.id ?? '',
            amount_ex_tax: Math.round(refund.amount / 1.1),
            tax_rate: 10,
            amount_inc_tax: refund.amount,
            payment_method: record.payment_method,
            status: 'confirmed',
          });
        }
      }

      const totalAllItems = rows.length;
      if (query.store_id) {
        rows = rows.filter((r) => r.store_id === query.store_id);
      }
      if (query.transaction_type) {
        rows = rows.filter((r) => r.transaction_type === query.transaction_type);
      }
      if (query.payment_method) {
        rows = rows.filter((r) => r.payment_method === query.payment_method);
      }
      if (query.date_from) {
        rows = rows.filter((r) => slashToIsoDate(r.transaction_date) >= query.date_from!);
      }
      if (query.date_to) {
        rows = rows.filter((r) => slashToIsoDate(r.transaction_date) <= query.date_to!);
      }
      if (query.search) {
        const needle = query.search.toLowerCase();
        rows = rows.filter(
          (r) =>
            r.member_id.toLowerCase().includes(needle) ||
            r.member_name.toLowerCase().includes(needle),
        );
      }

      rows = [...rows].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));

      const page = query.page ?? 1;
      const pageSize = query.page_size ?? 50;
      const total = rows.length;
      const start = (page - 1) * pageSize;
      const items = rows.slice(start, start + pageSize);

      return {
        items,
        total_count: total,
        total_all_items: totalAllItems,
        page,
        page_size: pageSize,
      };
    },

    // -------------------------------------------------------------------------
    // F-01-02: Receivables (未回収一覧 / 未納明細) — derived read-models
    // -------------------------------------------------------------------------
    getUnpaidReceivables(
      query: GetUnpaidReceivablesQuery,
      scope: BillingDataScope,
    ): GetUnpaidReceivablesResponse {
      this._seed();
      const unpaidRecords = this._rows.filter(
        (r) => scope({ store_id: r.store_id }) && r.outstanding_amount > 0,
      );

      const byMember = new Map<string, BillingRecord[]>();
      for (const record of unpaidRecords) {
        const list = byMember.get(record.member_id) ?? [];
        list.push(record);
        byMember.set(record.member_id, list);
      }

      let items: UnpaidReceivable[] = Array.from(byMember.entries()).map(
        ([memberId, memberRecords]) => {
          const first = memberRecords[0]!;
          const unpaidMonths = Array.from(
            new Set(memberRecords.map((r) => formatMonthSlash(r.billing_month))),
          ).sort();
          const totalUnpaidAmount = memberRecords.reduce((sum, r) => sum + r.outstanding_amount, 0);
          const lastBillingDate = memberRecords.reduce(
            (max, r) => (r.billing_date > max ? r.billing_date : max),
            first.billing_date,
          );

          return {
            member_id: memberId,
            member_name: first.member_name,
            store_id: first.store_id,
            store_name: first.store_name,
            unpaid_months: unpaidMonths,
            total_unpaid_amount: totalUnpaidAmount,
            last_billing_date: lastBillingDate,
            payment_method: first.payment_method,
            receivable_status: rollUpReceivableStatus(
              memberRecords.map((r) => r.receivable_status),
            ),
          };
        },
      );

      if (query.unpaid_month) {
        const targetMonth = formatMonthSlash(query.unpaid_month);
        items = items.filter((i) => i.unpaid_months.includes(targetMonth));
      }

      items = [...items].sort((a, b) => b.total_unpaid_amount - a.total_unpaid_amount);

      const page = query.page ?? 1;
      const pageSize = query.page_size ?? 50;
      const total = items.length;
      const start = (page - 1) * pageSize;
      const paged = items.slice(start, start + pageSize);

      return { items: paged, total_count: total, page, page_size: pageSize };
    },

    getUnpaidDetail(
      memberId: string,
      scope: BillingDataScope,
    ): GetUnpaidDetailResponse | undefined {
      this._seed();
      const records = this._rows.filter(
        (r) =>
          r.member_id === memberId && r.outstanding_amount > 0 && scope({ store_id: r.store_id }),
      );
      if (records.length === 0) return undefined;

      const first = records[0]!;
      const totalUnpaidAmount = records.reduce((sum, r) => sum + r.outstanding_amount, 0);
      const receivableStatus = rollUpReceivableStatus(records.map((r) => r.receivable_status));

      // JACCS subrogation eligibility (F-01 #400): a main-contract/JACCS line item is eligible
      // only when its billing_month is within the member's 3 most-recent unpaid months.
      const sortedMonths = Array.from(new Set(records.map((r) => r.billing_month))).sort();
      const recentThreeMonths = new Set(sortedMonths.slice(-3));

      const lineItems: UnpaidLineItem[] = [];
      for (const record of records) {
        const unpaidLineItems = this._lineItems.filter(
          (li) => li.billing_record_id === record.id && li.payment_status === 'unpaid',
        );
        for (const li of unpaidLineItems) {
          const contractType: UnpaidContractType =
            record.billing_type === 'ad_hoc'
              ? 'ad_hoc'
              : li.contract_id === 'main'
                ? 'main'
                : 'option';
          const isMainJaccs = contractType === 'main' && record.payment_method === 'jaccs';

          lineItems.push({
            id: li.id,
            month: formatMonthSlash(record.billing_month),
            contract_type: contractType,
            contract_name: li.label,
            amount: li.amount,
            status: record.receivable_status,
            payment_method: record.payment_method,
            jaccs_subrogation_eligible: isMainJaccs
              ? recentThreeMonths.has(record.billing_month)
              : undefined,
          });
        }
      }

      return {
        member_id: memberId,
        member_name: first.member_name,
        store_id: first.store_id,
        store_name: first.store_name,
        total_unpaid_amount: totalUnpaidAmount,
        receivable_status: receivableStatus,
        line_items: lineItems,
      };
    },

    issueConveniencePayment(input: IssueConveniencePaymentRequest, scope: BillingDataScope) {
      this._seed();
      const memberRecords = this._rows.filter(
        (r) =>
          r.member_id === input.member_id &&
          r.outstanding_amount > 0 &&
          scope({ store_id: r.store_id }),
      );
      if (memberRecords.length === 0) return { ok: false as const, error: 'not_found' as const };

      let targetRecords: BillingRecord[];
      let targetLineItemIds: string[];
      if (input.line_item_ids && input.line_item_ids.length > 0) {
        const recordIds = new Set(
          this._lineItems
            .filter((li) => input.line_item_ids!.includes(li.id))
            .map((li) => li.billing_record_id),
        );
        targetRecords = memberRecords.filter((r) => recordIds.has(r.id));
        targetLineItemIds = input.line_item_ids;
      } else {
        targetRecords = memberRecords;
        targetLineItemIds = this._lineItems
          .filter(
            (li) =>
              targetRecords.some((r) => r.id === li.billing_record_id) &&
              li.payment_status === 'unpaid',
          )
          .map((li) => li.id);
      }

      const now = new Date().toISOString();
      for (const record of targetRecords) {
        record.receivable_status = 'convenience_payment_in_progress';
        record.updated_at = now;
      }

      const response: IssueConveniencePaymentResponse = {
        member_id: input.member_id,
        updated_line_item_ids: targetLineItemIds,
        receivable_status: 'convenience_payment_in_progress',
      };
      return { ok: true as const, response };
    },

    setBadDebtExclusion(input: BadDebtExclusionRequest, actor: string, scope: BillingDataScope) {
      this._seed();
      const memberRecords = this._rows.filter(
        (r) =>
          r.member_id === input.member_id &&
          r.outstanding_amount > 0 &&
          scope({ store_id: r.store_id }),
      );
      if (memberRecords.length === 0) return { ok: false as const, error: 'not_found' as const };

      let targetRecords: BillingRecord[];
      let targetLineItemIds: string[];
      if (input.line_item_ids && input.line_item_ids.length > 0) {
        const recordIds = new Set(
          this._lineItems
            .filter((li) => input.line_item_ids!.includes(li.id))
            .map((li) => li.billing_record_id),
        );
        targetRecords = memberRecords.filter((r) => recordIds.has(r.id));
        targetLineItemIds = input.line_item_ids;
      } else {
        targetRecords = memberRecords;
        targetLineItemIds = this._lineItems
          .filter(
            (li) =>
              targetRecords.some((r) => r.id === li.billing_record_id) &&
              li.payment_status === 'unpaid',
          )
          .map((li) => li.id);
      }

      const now = new Date().toISOString();
      const isExclude = input.action === 'exclude';
      for (const record of targetRecords) {
        if (isExclude) {
          record.receivable_status = 'bad_debt_excluded';
          record.bad_debt_excluded = true;
        } else {
          record.receivable_status = record.is_bad_debt ? 'bad_debt_target' : 'uncollected';
          record.bad_debt_excluded = false;
        }
        record.bad_debt_exclusion_reason = input.reason;
        record.bad_debt_excluded_by = actor;
        record.bad_debt_excluded_at = now;
        record.updated_at = now;
      }

      const response: BadDebtExclusionResponse = {
        member_id: input.member_id,
        updated_line_item_ids: targetLineItemIds,
        receivable_status: targetRecords[0]?.receivable_status ?? null,
        bad_debt_excluded_by: actor,
        bad_debt_excluded_at: now,
      };
      return { ok: true as const, response };
    },

    // -------------------------------------------------------------------------
    // F-01-02: Upcoming billing (翌月請求予定) — derived read-model
    // -------------------------------------------------------------------------
    getUpcomingBilling(
      query: GetUpcomingBillingQuery,
      scope: BillingDataScope,
    ): GetUpcomingBillingResponse {
      this._seed();
      const nextMonth = nextBillingMonth();
      const records = this._rows.filter(
        (r) =>
          scope({ store_id: r.store_id }) &&
          r.billing_month === nextMonth &&
          r.confirmation_status === 'unconfirmed',
      );

      const allEntries: UpcomingBillingEntry[] = records.map((r) => {
        const billingType: UpcomingBillingType =
          r.billing_type === 'ad_hoc' ? 'ad_hoc' : r.notes ? 'with_unpaid_rollover' : 'standard';
        return {
          billing_record_id: r.id,
          member_id: r.member_id,
          member_name: r.member_name,
          billing_type: billingType,
          payment_method: r.payment_method,
          amount: r.billed_amount,
          billing_month: formatMonthSlash(r.billing_month),
          note: billingType === 'with_unpaid_rollover' ? (r.notes ?? '') : '',
          unconfirmed: true,
        };
      });

      const summary = {
        total_amount: allEntries.reduce((sum, e) => sum + e.amount, 0),
        total_count: allEntries.length,
        sbps_amount: allEntries
          .filter((e) => e.payment_method === 'sbps')
          .reduce((sum, e) => sum + e.amount, 0),
        sbps_count: allEntries.filter((e) => e.payment_method === 'sbps').length,
        jaccs_amount: allEntries
          .filter((e) => e.payment_method === 'jaccs')
          .reduce((sum, e) => sum + e.amount, 0),
        jaccs_count: allEntries.filter((e) => e.payment_method === 'jaccs').length,
      };

      const page = query.page ?? 1;
      const pageSize = query.page_size ?? 50;
      const items = allEntries.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

      return { items, total_count: allEntries.length, page, page_size: pageSize, summary };
    },

    // -------------------------------------------------------------------------
    // F-01-03: Refund approval queue (返金手続き一覧) — derived read-model + decisions
    // -------------------------------------------------------------------------
    getRefundQueue(query: GetRefundQueueQuery, scope: BillingDataScope): GetRefundQueueResponse {
      this._seed();
      const allEntries: RefundQueueEntry[] = [];

      for (const refund of this._refundRequests) {
        const record = this._rows.find((r) => r.id === refund.billing_record_id);
        if (!record || !scope({ store_id: record.store_id })) continue;
        allEntries.push(buildRefundQueueEntry(refund, record, this._lineItems));
      }

      const pendingAll = allEntries.filter((e) => e.status === 'pending');
      const pendingSummary = {
        pending_count: pendingAll.length,
        pending_amount: pendingAll.reduce((sum, e) => sum + e.refund_amount, 0),
      };

      let items = allEntries;
      if (query.status) {
        items = items.filter((e) => e.status === query.status);
      }
      if (query.payment_method) {
        items = items.filter((e) => e.payment_method === query.payment_method);
      }
      if (query.requester_role) {
        items = items.filter((e) => e.requester_role === query.requester_role);
      }
      if (query.date_from) {
        items = items.filter(
          (e) => !!e.requested_at && e.requested_at.slice(0, 10) >= query.date_from!,
        );
      }
      if (query.date_to) {
        items = items.filter(
          (e) => !!e.requested_at && e.requested_at.slice(0, 10) <= query.date_to!,
        );
      }
      if (query.search) {
        const needle = query.search.toLowerCase();
        items = items.filter(
          (e) =>
            e.refund_id.toLowerCase().includes(needle) ||
            e.member_name.toLowerCase().includes(needle),
        );
      }

      const sortBy = query.sort_by ?? 'requested_at';
      const sortOrder = query.sort_order ?? 'desc';
      items = [...items].sort((a, b) => {
        const dir = sortOrder === 'asc' ? 1 : -1;
        switch (sortBy) {
          case 'refund_id':
            return a.refund_id.localeCompare(b.refund_id) * dir;
          case 'sale_amount':
            return (a.sale_amount - b.sale_amount) * dir;
          case 'refund_amount':
            return (a.refund_amount - b.refund_amount) * dir;
          case 'status':
            return a.status.localeCompare(b.status) * dir;
          case 'approved_at':
            return (a.approved_at ?? '').localeCompare(b.approved_at ?? '') * dir;
          default:
            return (a.requested_at ?? '').localeCompare(b.requested_at ?? '') * dir;
        }
      });

      const page = query.page ?? 1;
      const pageSize = query.page_size ?? 50;
      const total = items.length;
      const start = (page - 1) * pageSize;
      const paged = items.slice(start, start + pageSize);

      return {
        items: paged,
        total_count: total,
        total_all_items: allEntries.length,
        page,
        page_size: pageSize,
        pending_summary: pendingSummary,
      };
    },

    decideRefundRequest(
      id: string,
      decision: RefundDecision,
      actor: ApprovalActor,
      canApprove: (requesterRole: RefundRequesterRole) => boolean,
      scope: BillingDataScope,
    ) {
      this._seed();
      const refund = this._refundRequests.find((r) => r.id === id);
      if (!refund) return { ok: false as const, error: 'not_found' as const };
      const record = this._rows.find((r) => r.id === refund.billing_record_id);
      if (!record || !scope({ store_id: record.store_id })) {
        return { ok: false as const, error: 'not_found' as const };
      }
      if (refund.status !== 'pending') {
        return { ok: false as const, error: 'not_pending' as const };
      }
      if (!canApprove(refund.requester_role)) {
        return {
          ok: false as const,
          error: 'unauthorized' as const,
          requesterRole: refund.requester_role,
        };
      }

      const now = new Date().toISOString();
      refund.approver_id = actor.id;
      refund.approver_name = actor.name;
      refund.approver_role = actor.role;
      refund.approved_at = now;

      if (decision === 'approve') {
        refund.status = 'completed';
        record.refunded_amount += refund.amount;
        record.outstanding_amount = Math.max(
          0,
          record.billed_amount - record.paid_amount - record.refunded_amount,
        );
        record.refund_status = 'completed';
      } else {
        refund.status = 'rejected';
        record.refund_status = 'rejected';
      }
      record.updated_at = now;
      record.updated_by = actor.name;

      return { ok: true as const, entry: buildRefundQueueEntry(refund, record, this._lineItems) };
    },

    decideBulkRefundRequests(
      ids: string[],
      decision: RefundDecision,
      actor: ApprovalActor,
      canApprove: (requesterRole: RefundRequesterRole) => boolean,
      scope: BillingDataScope,
    ): BulkRefundDecisionResponse {
      this._seed();
      const decided_ids: string[] = [];
      const excluded_ids: { id: string; reason: string }[] = [];

      for (const id of ids) {
        const refund = this._refundRequests.find((r) => r.id === id);
        if (!refund) {
          excluded_ids.push({ id, reason: 'not_found' });
          continue;
        }
        const record = this._rows.find((r) => r.id === refund.billing_record_id);
        if (!record || !scope({ store_id: record.store_id })) {
          excluded_ids.push({ id, reason: 'not_found' });
          continue;
        }
        if (refund.status !== 'pending') {
          excluded_ids.push({ id, reason: 'not_pending' });
          continue;
        }
        if (!canApprove(refund.requester_role)) {
          excluded_ids.push({ id, reason: 'unauthorized' });
          continue;
        }

        const now = new Date().toISOString();
        refund.approver_id = actor.id;
        refund.approver_name = actor.name;
        refund.approver_role = actor.role;
        refund.approved_at = now;

        if (decision === 'approve') {
          refund.status = 'completed';
          record.refunded_amount += refund.amount;
          record.outstanding_amount = Math.max(
            0,
            record.billed_amount - record.paid_amount - record.refunded_amount,
          );
          record.refund_status = 'completed';
        } else {
          refund.status = 'rejected';
          record.refund_status = 'rejected';
        }
        record.updated_at = now;
        record.updated_by = actor.name;

        decided_ids.push(id);
      }

      return { decided_ids, excluded_ids };
    },
  };

  return { billingRecords };
}
