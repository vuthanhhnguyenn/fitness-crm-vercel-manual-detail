import { memo } from 'react';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import type { BillingRecordDetail } from '@/lib/api/types.gen';

import { BillingBasicInfoCard } from './billing-basic-info-card';
import { BillingConfirmationStatusCard } from './billing-confirmation-status-card';
import { BillingFeeAdjustmentsCard } from './billing-fee-adjustments-card';
import { BillingLineItemsCard } from './billing-line-items-card';
import { BillingRefundHistoryCard } from './billing-refund-history-card';

interface BillingBasicTabProps {
  record: BillingRecordDetail;
}

function BillingBasicTabComponent({ record }: Readonly<BillingBasicTabProps>) {
  return (
    <div className="space-y-4">
      <BillingConfirmationStatusCard
        billingRecordId={record.id}
        confirmationStatus={record.confirmation_status}
        confirmedBy={record.confirmed_by}
        confirmedAt={record.confirmed_at}
        memberName={record.member_name}
        billingDate={record.billing_date}
        billedAmount={record.billed_amount}
      />

      <div className="flex gap-6">
        <div className="min-w-0 flex-1 space-y-4">
          <BillingLineItemsCard
            billingRecordId={record.id}
            memberId={record.member_id}
            lineItems={record.line_items}
            confirmationStatus={record.confirmation_status}
            outstandingAmount={record.outstanding_amount}
          />

          <BillingFeeAdjustmentsCard record={record} />

          <BillingRefundHistoryCard record={record} />
        </div>

        <div className="w-90 shrink-0 space-y-4">
          <BillingBasicInfoCard record={record} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">請求集計</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              <div className="grid grid-cols-2 gap-4">
                <SummaryItem
                  label="請求総額"
                  value={`¥${record.billed_amount.toLocaleString('ja-JP')}`}
                  highlight
                />
                <SummaryItem
                  label="未納額"
                  value={`¥${record.outstanding_amount.toLocaleString('ja-JP')}`}
                  destructive={record.outstanding_amount > 0}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <SummaryItem label="作成日時" value={formatDateYYYYMMDD_HHMM(record.created_at)} />
                <SummaryItem label="更新日時" value={formatDateYYYYMMDD_HHMM(record.updated_at)} />
                <SummaryItem label="最終更新者" value={record.updated_by} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export const BillingBasicTab = memo(BillingBasicTabComponent);

function SummaryItem({
  label,
  value,
  highlight = false,
  destructive = false,
}: Readonly<{
  label: string;
  value: string;
  highlight?: boolean;
  destructive?: boolean;
}>) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      <p
        className={`tabular-nums ${highlight ? 'text-sm font-bold' : 'text-sm font-semibold'} ${
          destructive ? 'text-destructive' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}
