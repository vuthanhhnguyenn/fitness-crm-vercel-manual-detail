'use client';

import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmMembersByIdPaymentSummaryOptions } from '@/lib/api/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';

interface PaymentSummaryCardProps {
  readonly memberId: string;
}

export function PaymentSummaryCard({ memberId }: PaymentSummaryCardProps) {
  const { data, isLoading, isError, refetch } = useQuery(
    getCrmMembersByIdPaymentSummaryOptions({
      path: { id: memberId },
    }),
  );

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={false}
      onRetry={refetch}
      skeleton={
        <Card className="sticky">
          <CardHeader>
            <CardTitle className="text-sm">支払いサマリー</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="flex flex-col gap-4">
              <div>
                <Skeleton className="mb-2 h-3 w-20" />
                <Skeleton className="h-8 w-40" />
              </div>
              <div className="flex flex-col gap-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle className="text-sm">支払いサマリー</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-muted-foreground mb-1 text-xs">今月請求額</p>
              <p className="text-2xl font-bold">
                ¥{data?.currentMonthAmount?.toLocaleString() ?? '0'}
              </p>
            </div>
            <div className="flex flex-col gap-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">未回収合計</span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    data?.unpaidTotal && data.unpaidTotal > 0
                      ? 'text-destructive font-bold'
                      : 'text-muted-foreground',
                  )}
                >
                  ¥{data?.unpaidTotal?.toLocaleString() ?? '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">最終入金日</span>
                <span className="text-sm font-medium">{data?.lastPaymentDate ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">決済方法</span>
                <div className="flex items-center gap-1">
                  <CreditCard className="text-muted-foreground size-4" />
                  <span className="text-sm font-medium">{data?.paymentMethod ?? '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DataStateBoundary>
  );
}
