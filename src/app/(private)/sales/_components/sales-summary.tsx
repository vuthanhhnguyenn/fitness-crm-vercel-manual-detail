'use client';

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';

import { SummaryCard } from '@/components/common/summary-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import {
  getCrmBillingRecordsOptions,
  getCrmBillingRecordsSummaryOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

function formatYen(amount: number): string {
  return amount.toLocaleString('ja-JP');
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-5 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="gap-0 py-4">
          <CardContent className="px-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-7 w-20" />
            <Skeleton className="mt-1 h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface SalesSummaryProps {
  billingMonth: string;
  storeId?: string;
}

export function SalesSummary({ billingMonth, storeId }: Readonly<SalesSummaryProps>) {
  const { data, isLoading } = useQuery(
    getCrmBillingRecordsSummaryOptions({
      query: { billing_month: billingMonth, store_id: storeId },
    }),
  );
  const { data: unpaidData } = useQuery(
    getCrmBillingRecordsOptions({
      query: {
        billing_month: billingMonth,
        store_id: storeId,
        unpaid_only: true,
        limit: 1,
      },
    }),
  );

  if (isLoading || !data) {
    return <SummarySkeleton />;
  }

  const totalCount = data.confirmed_count + data.unconfirmed_count;

  return (
    <div className="grid grid-cols-5 gap-4">
      <SummaryCard
        title="売上合計"
        value={formatYen(data.total_sales)}
        prefix="¥"
        subValue={`${totalCount}件（当月）`}
      />
      <SummaryCard
        title="入金合計"
        value={formatYen(data.total_payments)}
        prefix="¥"
        // subValue={`入金${data.payment_count}件（当月）`}
        subValue={
          <div className="flex flex-wrap items-center justify-between gap-x-2">
            <span className="text-muted-foreground text-[11px]">
              入金{data.payment_count}件（当月）
            </span>
            <Link
              href={navigate('/sales/transactions', {
                billing_month: billingMonth,
                store_id: storeId,
                unpaid_only: true,
              })}
            >
              <Button variant="link" size="sm" className="h-auto gap-0.5 p-0 text-[11px]">
                入出金明細
                <ArrowRight className="size-3" />
              </Button>
            </Link>
          </div>
        }
      />
      <SummaryCard
        title="未納合計"
        value={formatYen(data.total_outstanding)}
        prefix="¥"
        tone="warning"
        subValue={
          <div className="flex flex-wrap items-center justify-between gap-x-2">
            <span className="text-muted-foreground text-[11px]">
              未回収{unpaidData?.total ?? 0}件（当月）
            </span>
            <Link
              href={navigate('/sales/receivables', {
                billing_month: billingMonth,
                store_id: storeId,
                unpaid_only: true,
              })}
            >
              <Button variant="link" size="sm" className="h-auto gap-0.5 p-0 text-[11px]">
                請求・未回収管理
                <ArrowRight className="size-3" />
              </Button>
            </Link>
          </div>
        }
      />
      <SummaryCard
        title="返金合計"
        value={formatYen(data.total_refunds)}
        prefix="¥"
        tone="muted"
        subValue={`返金${data.refund_count}件（当月）`}
      />
      <SummaryCard
        title="請求確定状況"
        value={`${data.confirmed_count}/${totalCount}`}
        subValue={`未確定${data.unconfirmed_count}件・貸倒${data.bad_debt_count}件 ¥${formatYen(data.bad_debt_amount)}`}
      />
    </div>
  );
}
