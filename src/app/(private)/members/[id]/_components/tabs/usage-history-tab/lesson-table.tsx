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

import { getCrmMembersByIdUsageHistoryLessonsOptions } from '@/lib/api/@tanstack/react-query.gen';

import { currentYearMonth, monthToRange } from '../../../_utils/month-range';
import { LessonStatusBadge } from './lesson-status-badge';

interface LessonTableProps {
  readonly memberId: string;
}

export function LessonTable(props: LessonTableProps) {
  const { memberId } = props;
  const [month, setMonth] = useState(currentYearMonth);
  const [page, setPage] = useState(1);

  const range = monthToRange(month);
  const query = { from: range.from, to: range.to, page, limit: PAGE_SIZE };

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    ...getCrmMembersByIdUsageHistoryLessonsOptions({
      path: { id: memberId },
      query,
    }),
    placeholderData: keepPreviousData,
  });
  const reservations = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const handleMonthChange = (value: string) => {
    setMonth(value);
    setPage(1);
  };

  return (
    <Card className="gap-0 py-0">
      {/* MonthPicker stays outside the boundary so the user can switch months to recover from fetch errors */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
        <CardTitle className="text-base font-semibold">レッスン予約履歴</CardTitle>
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
        errorTitle="レッスン予約履歴の取得に失敗しました"
        skeleton={
          <CardContent className="space-y-3 px-4 pb-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`lesson-row-${index}`} className="h-9 w-full" />
            ))}
          </CardContent>
        }
      >
        <CardContent className="px-0">
          <Table size="md">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">日付</TableHead>
                <TableHead className="text-xs font-semibold">レッスン名</TableHead>
                <TableHead className="text-xs font-semibold">担当</TableHead>
                <TableHead className="text-xs font-semibold">状態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground px-4 py-8 text-center text-xs"
                  >
                    この月のデータはありません。
                  </TableCell>
                </TableRow>
              ) : (
                reservations.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm">{formatDate(row.lessonDate)}</TableCell>
                    <TableCell className="text-sm font-medium">{row.lessonName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.instructorName}
                    </TableCell>
                    <TableCell>
                      <LessonStatusBadge status={row.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {reservations.length > 0 && (
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              total={data?.total ?? 0}
              limit={PAGE_SIZE}
              isLoading={isFetching}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </DataStateBoundary>
    </Card>
  );
}
