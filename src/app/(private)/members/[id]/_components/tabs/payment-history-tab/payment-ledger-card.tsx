'use client';

import { useCallback, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { formatDate, formatYen } from '@/utils/format.util';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

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

import { PAYMENT_PERIOD_OPTIONS, type PaymentPeriod } from './payment-period';

interface PaymentLedgerCardProps {
  readonly memberId: string;
  /** Period filter; held by the tab because it is shared with the payment summary */
  readonly period: PaymentPeriod;
  readonly onPeriodChange: (period: PaymentPeriod) => void;
}

type PaymentType = 'all' | 'sale' | 'refund';

const TYPE_OPTIONS: Array<{ value: PaymentType; label: string }> = [
  { value: 'all', label: '全種別' },
  { value: 'sale', label: '売上' },
  { value: 'refund', label: '返金' },
];

export function PaymentLedgerCard({ memberId, period, onPeriodChange }: PaymentLedgerCardProps) {
  const [type, setType] = useState<PaymentType>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    ...getCrmMembersByIdPaymentHistoryOptions({
      path: { id: memberId },
      query: { page, limit: PAGE_SIZE, period, type },
    }),
    // Keep the previous results so changing period/type/page does not flash back to the skeleton
    placeholderData: keepPreviousData,
  });

  const handlePeriodChange = useCallback(
    (nextPeriod: PaymentPeriod | null) => {
      onPeriodChange(nextPeriod ?? 'all');
      setPage(1);
    },
    [onPeriodChange],
  );

  const handleTypeChange = useCallback((nextType: PaymentType | null) => {
    setType(nextType ?? 'all');
    setPage(1);
  }, []);

  // The period/type Selects live outside the boundary (usable even while Loading/Error).
  // `isEmpty` is derived from the whole query being absent (`!data`), not row count, so a
  // filter returning 0 rows shows the table's own empty row. See DataStateBoundary docs.
  const isEmpty = !data;
  const total = data?.total ?? 0;
  const limit = data?.limit ?? PAGE_SIZE;
  const totalPages = Math.ceil(total / limit);

  const formatAmount = useCallback((amount: number): string => {
    if (amount < 0) {
      return `-${formatYen(Math.abs(amount))}`;
    }
    return formatYen(amount);
  }, []);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">入出金明細</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={period}
              onValueChange={handlePeriodChange}
              items={PAYMENT_PERIOD_OPTIONS}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_PERIOD_OPTIONS.map((item) => (
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
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={refetch}
        emptyTitle="入出金履歴はありません"
        errorTitle="入出金明細の取得に失敗しました"
        skeleton={
          <div className="space-y-3 px-4 pb-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`payment-ledger-row-${index}`} className="h-9 w-full" />
            ))}
          </div>
        }
      >
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
                <TableRow key={item.id}>
                  <TableCell className="text-sm">{formatDate(item.date)}</TableCell>
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
      </DataStateBoundary>
      <CardContent className="px-0 py-0">
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          isLoading={isFetching}
          onPageChange={setPage}
        />
      </CardContent>
    </Card>
  );
}
