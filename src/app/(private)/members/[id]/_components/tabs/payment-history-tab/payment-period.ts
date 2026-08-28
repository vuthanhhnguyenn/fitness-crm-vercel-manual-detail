import type { GetCrmMembersByIdPaymentHistoryData } from '@/lib/api/types.gen';

/**
 * Period filter for the payment ledger. The payment summary filters on the same value,
 * so the tab owns the state and shares it with both cards.
 *
 * Derived from the generated client rather than re-declared, so adding a period to the
 * Zod schema of `/crm/members/{id}/payment-history` surfaces here as a type error on
 * `PAYMENT_PERIOD_OPTIONS` instead of silently drifting.
 */
export type PaymentPeriod = NonNullable<
  NonNullable<GetCrmMembersByIdPaymentHistoryData['query']>['period']
>;

/** `Record` (not an array) so a period added to the schema fails to compile until labelled. */
const PAYMENT_PERIOD_LABELS: Record<PaymentPeriod, string> = {
  all: '全期間',
  thisMonth: '今月',
  lastMonth: '先月',
  '3months': '過去3ヶ月',
  '6months': '過去6ヶ月',
};

export const PAYMENT_PERIOD_OPTIONS: Array<{ value: PaymentPeriod; label: string }> = (
  Object.keys(PAYMENT_PERIOD_LABELS) as PaymentPeriod[]
).map((value) => ({ value, label: PAYMENT_PERIOD_LABELS[value] }));
