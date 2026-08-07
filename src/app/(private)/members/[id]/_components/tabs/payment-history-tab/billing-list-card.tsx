'use client';

import { useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { useQuery } from '@tanstack/react-query';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { TablePagination } from '@/components/common/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmMembersByIdBillingOptions } from '@/lib/api/@tanstack/react-query.gen';

import { BillingStatusBadge } from './billing-status-badge';

interface BillingListCardProps {
  readonly memberId: string;
}

export function BillingListCard({ memberId }: BillingListCardProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useQuery(
    getCrmMembersByIdBillingOptions({
      path: { id: memberId },
      query: { page, limit: PAGE_SIZE },
    }),
  );

  const isEmpty = !data?.items || data.items.length === 0;
  const total = data?.total ?? 0;
  const limit = data?.limit ?? PAGE_SIZE;
  const totalPages = Math.ceil(total / limit);

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      onRetry={refetch}
      emptyTitle="請求履歴はありません"
      skeleton={
        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm">請求一覧</CardTitle>
          </CardHeader>
          <div className="space-y-3 px-4 pb-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`billing-list-row-${index}`} className="h-9 w-full" />
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
          <CardTitle className="text-sm">請求一覧</CardTitle>
        </CardHeader>
        <Table size="md">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">請求月</TableHead>
              <TableHead className="text-xs font-semibold">請求種別</TableHead>
              <TableHead className="text-right text-xs font-semibold">金額</TableHead>
              <TableHead className="text-xs font-semibold">ステータス</TableHead>
              <TableHead className="text-xs font-semibold">請求日</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items && data.items.length > 0 ? (
              data.items.map((item) => (
                <TableRow key={`${item.month}-${item.type}-${item.billingDate}`}>
                  <TableCell className="text-sm font-medium">{item.month}</TableCell>
                  <TableCell>
                    <Badge
                      variant={item.type === 'oneTime' ? 'outline' : 'default'}
                      className="text-[10px]"
                    >
                      {item.type === 'oneTime' ? '都度' : '月次'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    ¥{item.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <BillingStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.billingDate}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  請求履歴がありません
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
