'use client';

import { useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
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

import { LessonStatusBadge } from './lesson-status-badge';

interface LessonTableProps {
  readonly memberId: string;
}

export function LessonTable(props: LessonTableProps) {
  const { memberId } = props;
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useQuery(
    getCrmMembersByIdUsageHistoryLessonsOptions({
      path: { id: memberId },
      query: { page, limit: PAGE_SIZE },
    }),
  );
  const reservations = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data}
      onRetry={() => {
        void refetch();
      }}
      skeleton={
        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <CardTitle>レッスン予約履歴</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`lesson-row-${index}`} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>
      }
    >
      <Card className="gap-0 py-0">
        <CardHeader className="px-4 py-3">
          <CardTitle>レッスン予約履歴</CardTitle>
        </CardHeader>

        <CardContent className="px-0">
          {reservations.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              レッスン予約履歴がありません。
            </div>
          ) : (
            <>
              <Table size="md">
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>レッスン名</TableHead>
                    <TableHead>担当</TableHead>
                    <TableHead>状態</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-sm">
                        {format(parseISO(row.lesson_date), 'yyyy/MM/dd')}
                      </TableCell>
                      <TableCell className="text-sm">{row.lesson_name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {row.instructor_name}
                      </TableCell>
                      <TableCell>
                        <LessonStatusBadge status={row.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                total={data?.total ?? 0}
                limit={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </DataStateBoundary>
  );
}
