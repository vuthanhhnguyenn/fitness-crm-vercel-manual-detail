'use client';

import { formatDate, formatYen } from '@/utils/format.util';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmMembersByIdPaymentSummaryOptions } from '@/lib/api/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';

import { PAYMENT_PERIOD_OPTIONS, type PaymentPeriod } from './payment-period';

interface PaymentSummaryCardProps {
  readonly memberId: string;
  /** Period filter shared with the ledger; switches the aggregation period */
  readonly period: PaymentPeriod;
}

export function PaymentSummaryCard({ memberId, period }: PaymentSummaryCardProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmMembersByIdPaymentSummaryOptions({
      path: { id: memberId },
      query: { period },
    }),
    // Keep the previous period's figures so changing the period does not flash back to the skeleton
    placeholderData: keepPreviousData,
  });

  const periodLabel =
    data?.periodLabel ?? PAYMENT_PERIOD_OPTIONS.find((option) => option.value === period)?.label;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">支払いサマリー（{periodLabel}）</CardTitle>
      </CardHeader>
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={false}
        onRetry={refetch}
        errorTitle="支払いサマリーの取得に失敗しました"
        skeleton={
          <CardContent className="px-4">
            <div className="flex flex-col gap-4">
              <div>
                <Skeleton className="mb-2 h-3 w-20" />
                <Skeleton className="h-8 w-40" />
              </div>
              <div className="flex flex-col gap-3 border-t pt-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`payment-summary-row-${index}`}
                    className="flex items-center justify-between"
                  >
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        }
      >
        <CardContent className="px-4">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-muted-foreground mb-1 text-xs">売上合計</p>
              <p className="text-2xl font-bold">{formatYen(data?.totalSales ?? 0)}</p>
            </div>
            <div className="flex flex-col gap-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">返金合計</span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    data?.refundTotal && data.refundTotal > 0
                      ? 'text-destructive'
                      : 'text-muted-foreground',
                  )}
                >
                  {data?.refundTotal && data.refundTotal > 0
                    ? `-${formatYen(data.refundTotal)}`
                    : '¥0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">差引合計</span>
                <span className="text-sm font-medium">{formatYen(data?.netAmount ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">最終入金日</span>
                <span className="text-sm font-medium">{formatDate(data?.lastPaymentDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">決済方法</span>
                <div className="flex items-center gap-1">
                  <CreditCard className="text-muted-foreground size-4" />
                  <span className="text-sm font-medium">{data?.paymentMethod ?? '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </DataStateBoundary>
    </Card>
  );
}
