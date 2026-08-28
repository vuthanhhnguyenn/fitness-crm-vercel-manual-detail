'use client';

import { useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { formatDate } from '@/utils/format.util';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { MonthPicker } from '@/components/common/month-picker';
import { TablePagination } from '@/components/common/table-pagination';
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

import { getCrmMembersByIdContractsOptionUsageOptions } from '@/lib/api/@tanstack/react-query.gen';

import { currentYearMonth, monthToRange } from '../../../_utils/month-range';

interface OptionUsageCardProps {
  readonly memberId: string;
}

export function OptionUsageCard(props: OptionUsageCardProps) {
  const { memberId } = props;
  const [month, setMonth] = useState(currentYearMonth);
  const [page, setPage] = useState(1);

  const range = monthToRange(month);
  const query = { from: range.from, to: range.to, page, limit: PAGE_SIZE };

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    ...getCrmMembersByIdContractsOptionUsageOptions({
      path: { id: memberId },
      query,
    }),
    placeholderData: keepPreviousData,
  });

  const records = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleMonthChange = (value: string) => {
    setMonth(value);
    setPage(1);
  };

  return (
    <Card className="gap-0 py-0">
      {/* MonthPicker stays outside the boundary so the user can switch months to recover from fetch errors */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
        <CardTitle className="text-base font-semibold">オプション利用履歴</CardTitle>
        <div className="w-40">
          <MonthPicker value={month} onChange={handleMonthChange} className="w-full" />
        </div>
      </CardHeader>

      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data}
        onRetry={() => {
          void refetch();
        }}
        errorTitle="オプション利用履歴の取得に失敗しました"
        skeleton={
          <CardContent className="space-y-3 px-4 pb-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`option-usage-row-${index}`} className="h-9 w-full" />
            ))}
          </CardContent>
        }
      >
        <CardContent className="px-0">
          {/* The header stays mounted even when a month has no records, so the columns remain readable */}
          <Table size="md">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">日付</TableHead>
                <TableHead className="text-xs font-semibold">店舗</TableHead>
                <TableHead className="text-xs font-semibold">オプション名</TableHead>
                <TableHead className="text-right text-xs font-semibold">回数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground px-4 py-8 text-center text-xs"
                  >
                    この月のデータはありません。
                  </TableCell>
                </TableRow>
              ) : (
                records.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm">{formatDate(row.date)}</TableCell>
                    <TableCell className="text-sm">{row.storeName}</TableCell>
                    <TableCell className="text-sm font-medium">{row.optionName}</TableCell>
                    <TableCell className="text-right text-sm">{row.count}回</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </DataStateBoundary>

      {/* Pagination stays outside the boundary (like 請求一覧): a page that renders 0 rows must
          still let the user go back to a previous page. */}
      <CardContent className="px-0 py-0">
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          total={total}
          limit={PAGE_SIZE}
          onPageChange={setPage}
          isLoading={isFetching}
        />
      </CardContent>
    </Card>
  );
}
