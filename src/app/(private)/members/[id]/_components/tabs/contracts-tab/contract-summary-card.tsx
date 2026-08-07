'use client';

import { formatYen } from '@/utils/format.util';
import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmMembersByIdContractsSummaryOptions } from '@/lib/api/@tanstack/react-query.gen';

interface ContractSummaryCardProps {
  memberId: string;
}

export function ContractSummaryCard({ memberId }: ContractSummaryCardProps) {
  const { data, isLoading } = useQuery(
    getCrmMembersByIdContractsSummaryOptions({
      path: { id: memberId },
    }),
  );

  if (isLoading) return <Skeleton className="h-48 w-full rounded-lg" />;

  const hasUnpaidFee = (data?.unpaid_amount ?? 0) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">契約サマリー</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">主契約名</p>
            <p className="text-sm font-medium">{data?.plan_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">月額合計</p>
            <p className="text-lg font-semibold">{formatYen(data?.total_monthly_fee ?? 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">次回請求日</p>
            <p className="text-sm font-medium">
              {data?.billing_day ? `毎月${data.billing_day}日` : '—'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">決済方法</p>
            <div className="flex items-center gap-1">
              <CreditCard className="text-muted-foreground size-4" />
              <p className="text-sm font-medium">
                {data?.payment_method === 'credit_card' ? 'クレジットカード' : '口座振替'}
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
              {hasUnpaidFee ? formatYen(data!.unpaid_amount) : '¥0'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
