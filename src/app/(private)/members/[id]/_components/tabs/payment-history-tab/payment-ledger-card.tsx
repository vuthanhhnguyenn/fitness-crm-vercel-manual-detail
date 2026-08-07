'use client';

import { useCallback, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { useQuery } from '@tanstack/react-query';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { TablePagination } from '@/components/common/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmMembersByIdPaymentHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';

interface PaymentLedgerCardProps {
  readonly memberId: string;
}

type PaymentPeriod = 'all' | 'thisMonth' | 'lastMonth' | '3months' | '6months';
type PaymentType = 'all' | 'sale' | 'refund';

const PERIOD_OPTIONS: Array<{ value: PaymentPeriod; label: string }> = [
  { value: 'all', label: '全期間' },
  { value: 'thisMonth', label: '今月' },
  { value: 'lastMonth', label: '先月' },
  { value: '3months', label: '過去3ヶ月' },
  { value: '6months', label: '過去6ヶ月' },
];

const TYPE_OPTIONS: Array<{ value: PaymentType; label: string }> = [
  { value: 'all', label: '全種別' },
  { value: 'sale', label: '売上' },
  { value: 'refund', label: '返金' },
];

export function PaymentLedgerCard({ memberId }: PaymentLedgerCardProps) {
  const [period, setPeriod] = useState<PaymentPeriod>('all');
  const [type, setType] = useState<PaymentType>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery(
    getCrmMembersByIdPaymentHistoryOptions({
      path: { id: memberId },
      query: { page, limit: PAGE_SIZE, period, type },
    }),
  );

  const handlePeriodChange = useCallback((nextPeriod: PaymentPeriod | null) => {
    setPeriod(nextPeriod ?? 'all');
    setPage(1);
  }, []);

  const handleTypeChange = useCallback((nextType: PaymentType | null) => {
    setType(nextType ?? 'all');
    setPage(1);
  }, []);

  const isEmpty = !data?.items || data.items.length === 0;
  const total = data?.total ?? 0;
  const limit = data?.limit ?? PAGE_SIZE;
  const totalPages = Math.ceil(total / limit);

  const formatAmount = useCallback((amount: number): string => {
    if (amount < 0) {
      return `-¥${Math.abs(amount).toLocaleString()}`;
    }
    return `¥${amount.toLocaleString()}`;
  }, []);

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      onRetry={refetch}
      emptyTitle="入出金履歴はありません"
      skeleton={
        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">入出金明細</CardTitle>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
          </CardHeader>
          <div className="space-y-3 px-4 pb-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`payment-ledger-row-${index}`} className="h-9 w-full" />
            ))}
          </div>
          <CardContent className="px-4 pt-0 pb-4">
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      }
    >
      <Card className="gap-0 py-0">
        <CardHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">入出金明細</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={handlePeriodChange} items={PERIOD_OPTIONS}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={type} onValueChange={handleTypeChange} items={TYPE_OPTIONS}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <Table size="md">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">日付</TableHead>
              <TableHead className="text-xs font-semibold">種別</TableHead>
              <TableHead className="text-xs font-semibold">内容</TableHead>
              <TableHead className="text-right text-xs font-semibold">金額</TableHead>
              <TableHead className="text-xs font-semibold">決済方法</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items && data.items.length > 0 ? (
              data.items.map((item) => (
                <TableRow key={`${item.date}-${item.type}-${item.amount}`}>
                  <TableCell className="text-sm">{item.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={item.type === 'refund' ? 'secondary' : 'default'}
                      className="text-[10px]"
                    >
                      {item.type === 'refund' ? '返金' : '売上'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{item.content}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right text-sm font-medium',
                      item.amount < 0 && 'text-destructive',
                    )}
                  >
                    {formatAmount(item.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{item.method}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  該当する履歴はありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <CardContent className="px-0 py-0">
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </DataStateBoundary>
  );
}
