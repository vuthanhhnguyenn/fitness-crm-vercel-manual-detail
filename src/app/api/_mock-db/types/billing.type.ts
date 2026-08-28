import type {
  AddLineItemRequest,
  ApplyFeeAdjustmentRequest,
  BadDebtExclusionRequest,
  BadDebtExclusionResponse,
  BillingLineItem,
  BillingRecord,
  BillingRecordDetail,
  BillingRecordListItem,
  BillingSummary,
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
  RefundApproverRole,
  RefundDecision,
  RefundQueueEntry,
  RefundRequest,
  RefundRequesterRole,
  StoreMemberOption,
  SubmitRefundRequest,
} from '@/app/api/_schemas/billing.schema';

/** Data-scope predicate — returns true when a caller may see/act on this store's records. */
export type BillingDataScope = (record: { store_id: string }) => boolean;

export type BillingListResult = {
  items: BillingRecordListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AddLineItemError =
  | 'not_found'
  | 'confirmed'
  | 'outstanding_balance'
  | 'invalid_contract';
export type ApplyFeeAdjustmentError = 'not_found' | 'confirmed';
export type SubmitRefundError = 'not_found' | 'invalid_line_item_amount';
export type ManualRegistrationError =
  | 'outstanding_balance'
  | 'store_member_mismatch'
  | 'invalid_contract'
  | 'reason_required';

/** Caller identity captured at refund-request creation time (F-01-01/02/03). */
export type RefundActor = { id: string; name: string; role: RefundRequesterRole };
/** Caller identity recorded on a refund approve/reject decision. */
export type ApprovalActor = { id: string; name: string; role: RefundApproverRole };

export type RefundDecisionError = 'not_found' | 'not_pending' | 'unauthorized';

export type BillingRecordsType = {
  _rows: BillingRecord[];
  _lineItems: BillingLineItem[];
  _feeAdjustments: FeeAdjustment[];
  _refundRequests: RefundRequest[];
  _seeded: boolean;
  _seed(): void;

  getList(query: GetBillingRecordsQuery, scope: BillingDataScope): BillingListResult;

  getSummary(
    params: { store_id?: string; billing_month?: string },
    scope: BillingDataScope,
  ): BillingSummary;

  getById(id: string, scope: BillingDataScope): BillingRecordDetail | undefined;

  hasOutstandingBalance(memberId: string): boolean;

  confirmMany(
    ids: string[],
    confirmedBy: string,
    scope: BillingDataScope,
  ): { confirmed_ids: string[]; skipped_ids: string[] };

  toggleConfirmation(
    id: string,
    status: ConfirmationStatus,
    actor: string,
    scope: BillingDataScope,
  ): BillingRecord | undefined;

  addLineItem(
    billingRecordId: string,
    input: AddLineItemRequest,
    actor: string,
    scope: BillingDataScope,
  ): { ok: true; lineItem: BillingLineItem } | { ok: false; error: AddLineItemError };

  applyFeeAdjustment(
    billingRecordId: string,
    input: ApplyFeeAdjustmentRequest,
    actor: string,
    scope: BillingDataScope,
  ): { ok: true; feeAdjustment: FeeAdjustment } | { ok: false; error: ApplyFeeAdjustmentError };

  createRefundRequest(
    billingRecordId: string,
    input: SubmitRefundRequest,
    actor: RefundActor,
    scope: BillingDataScope,
  ): { ok: true; refundRequest: RefundRequest } | { ok: false; error: SubmitRefundError };

  createBulkRefundRequests(
    billingRecordIds: string[],
    reasonCode: string,
    detail: string | null,
    actor: RefundActor,
    scope: BillingDataScope,
  ): { billing_record_id: string; refund_request_id: string }[];

  getTransactionLedger(
    query: GetTransactionLedgerQuery,
    scope: BillingDataScope,
  ): GetTransactionLedgerResponse;

  getUnpaidReceivables(
    query: GetUnpaidReceivablesQuery,
    scope: BillingDataScope,
  ): GetUnpaidReceivablesResponse;

  getUnpaidDetail(memberId: string, scope: BillingDataScope): GetUnpaidDetailResponse | undefined;

  issueConveniencePayment(
    input: IssueConveniencePaymentRequest,
    scope: BillingDataScope,
  ): { ok: true; response: IssueConveniencePaymentResponse } | { ok: false; error: 'not_found' };

  setBadDebtExclusion(
    input: BadDebtExclusionRequest,
    actor: string,
    scope: BillingDataScope,
  ): { ok: true; response: BadDebtExclusionResponse } | { ok: false; error: 'not_found' };

  getUpcomingBilling(
    query: GetUpcomingBillingQuery,
    scope: BillingDataScope,
  ): GetUpcomingBillingResponse;

  getRefundQueue(query: GetRefundQueueQuery, scope: BillingDataScope): GetRefundQueueResponse;

  decideRefundRequest(
    id: string,
    decision: RefundDecision,
    actor: ApprovalActor,
    canApprove: (requesterRole: RefundRequesterRole) => boolean,
    scope: BillingDataScope,
  ):
    | { ok: true; entry: RefundQueueEntry }
    | { ok: false; error: RefundDecisionError; requesterRole?: RefundRequesterRole };

  decideBulkRefundRequests(
    ids: string[],
    decision: RefundDecision,
    actor: ApprovalActor,
    canApprove: (requesterRole: RefundRequesterRole) => boolean,
    scope: BillingDataScope,
  ): BulkRefundDecisionResponse;

  createManualRegistration(
    input: ManualBillingRegistrationRequest,
    actor: string,
  ): { ok: true; record: BillingRecord } | { ok: false; error: ManualRegistrationError };

  getStoreMembers(storeId: string): StoreMemberOption[];

  getMemberContractOptions(
    memberId: string,
  ): { id: string; label: string; amount: number; tax_rate: number }[];
};
