'use client';

import { useState } from 'react';

import { BillingListCard } from './billing-list-card';
import { PaymentLedgerCard } from './payment-ledger-card';
import type { PaymentPeriod } from './payment-period';
import { PaymentSummaryCard } from './payment-summary-card';

interface PaymentHistoryTabProps {
  readonly memberId: string;
}

export function PaymentHistoryTab({ memberId }: PaymentHistoryTabProps) {
  // The ledger's period filter also drives the payment summary's aggregation period
  const [period, setPeriod] = useState<PaymentPeriod>('all');

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* Left Column (60%) */}
      <div className="flex w-full flex-col gap-4 md:w-[60%]">
        <PaymentLedgerCard memberId={memberId} period={period} onPeriodChange={setPeriod} />
        <BillingListCard memberId={memberId} />
      </div>

      {/* Right Column (40%) — the sticky wrapper must sit here, outside the card's own
          state boundary, so it has the full column height to stick within */}
      <div className="w-full md:w-[40%]">
        <div className="sticky top-0">
          <PaymentSummaryCard memberId={memberId} period={period} />
        </div>
      </div>
    </div>
  );
}
