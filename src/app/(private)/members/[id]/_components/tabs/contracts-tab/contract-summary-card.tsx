'use client';

import { formatDate, formatYen } from '@/utils/format.util';
import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmMembersByIdContractsSummaryOptions } from '@/lib/api/@tanstack/react-query.gen';

interface ContractSummaryCardProps {
  memberId: string;
}

const PAYMENT_METHOD_LABELS: Record<'credit_card' | 'bank_transfer', string> = {
  credit_card: 'SBPS（クレジットカード）',
  bank_transfer: '口座振替',
};

export function ContractSummaryCard({ memberId }: ContractSummaryCardProps) {
  const { data, isLoading, isError, refetch } = useQuery(
    getCrmMembersByIdContractsSummaryOptions({
      path: { id: memberId },
    }),
  );

  const unpaidAmount = data?.unpaidAmount ?? 0;
  const hasUnpaidFee = unpaidAmount > 0;

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data}
      onRetry={() => refetch()}
      errorTitle="契約サマリーの取得に失敗しました"
      emptyTitle="契約サマリーはありません"
      skeleton={<Skeleton className="h-48 w-full rounded-lg" />}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">契約サマリー</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-muted-foreground mb-1 text-xs">主契約名</p>
              <p className="text-sm font-medium">{data?.planName ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">月額合計</p>
              <p className="text-lg font-semibold">{formatYen(data?.totalMonthlyFee ?? 0)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">次回請求日</p>
              <p className="text-sm font-medium">{formatDate(data?.nextBillingDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">決済方法</p>
              <div className="flex items-center gap-1">
                <CreditCard className="text-muted-foreground size-4" />
                <p className="text-sm font-medium">
                  {data?.paymentMethod ? PAYMENT_METHOD_LABELS[data.paymentMethod] : '—'}
                </p>
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground mb-1 text-xs">未納金額</p>
              <p
                className={`text-sm font-medium ${
                  hasUnpaidFee ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                {formatYen(unpaidAmount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DataStateBoundary>
  );
}
