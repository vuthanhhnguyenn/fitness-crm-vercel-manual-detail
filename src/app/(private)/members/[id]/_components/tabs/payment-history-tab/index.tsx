'use client';

import { BillingListCard } from './billing-list-card';
import { PaymentLedgerCard } from './payment-ledger-card';
import { PaymentSummaryCard } from './payment-summary-card';

interface PaymentHistoryTabProps {
  readonly memberId: string;
}

export function PaymentHistoryTab({ memberId }: PaymentHistoryTabProps) {
  return (
    <div className="flex gap-4">
      {/* Left Column (60%) */}
      <div className="flex w-[60%] flex-col gap-4">
        <PaymentLedgerCard memberId={memberId} />
        <BillingListCard memberId={memberId} />
      </div>

      {/* Right Column (40%) */}
      <div className="w-[40%]">
        <PaymentSummaryCard memberId={memberId} />
      </div>
    </div>
  );
}
