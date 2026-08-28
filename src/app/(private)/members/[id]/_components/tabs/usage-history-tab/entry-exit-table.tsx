'use client';

import { useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { LogIn, LogOut } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { MonthPicker } from '@/components/common/month-picker';
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

import { getCrmMembersByIdUsageHistoryEntriesOptions } from '@/lib/api/@tanstack/react-query.gen';

import { getAuthMethodLabel } from '../../../_constants/auth-method';
import { currentYearMonth, monthToRange } from '../../../_utils/month-range';

interface EntryExitTableProps {
  readonly memberId: string;
}

/** 種別 badge — one table row is one gate event (入館 / 退館), per the UI prototype. */
function EventTypeBadge({ eventType }: { readonly eventType: 'entry' | 'exit' }) {
  if (eventType === 'entry') {
    return (
      <Badge variant="outline" className="bg-info/15 text-info border-info/20 gap-1 text-[10px]">
        <LogIn className="size-3" />
        入館
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-[10px]">
      <LogOut className="size-3" />
      退館
    </Badge>
  );
}

export function EntryExitTable(props: EntryExitTableProps) {
  const { memberId } = props;
  const [month, setMonth] = useState(currentYearMonth);
  const [page, setPage] = useState(1);

  const range = monthToRange(month);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    ...getCrmMembersByIdUsageHistoryEntriesOptions({
      path: { id: memberId },
      query: { from: range.from, to: range.to, page, limit: PAGE_SIZE },
    }),
    placeholderData: keepPreviousData,
  });
  const events = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleMonthChange = (value: string) => {
    setMonth(value);
    setPage(1);
  };

  return (
    <Card className="gap-0 py-0">
      {/* MonthPicker stays outside the boundary so the user can switch months to recover from fetch errors */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
        <CardTitle className="text-base font-semibold">入退館履歴</CardTitle>
        <div className="w-40">
          <MonthPicker value={month} onChange={handleMonthChange} className="w-full" />
        </div>
      </CardHeader>

      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data}
        onRetry={() => refetch()}
        errorTitle="入退館履歴の取得に失敗しました"
        skeleton={
          <CardContent className="space-y-3 px-4 pb-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`entry-exit-row-${index}`} className="h-9 w-full" />
            ))}
          </CardContent>
        }
      >
        <CardContent className="px-0">
          <Table size="md">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">日時</TableHead>
                <TableHead className="text-xs font-semibold">店舗</TableHead>
                <TableHead className="text-xs font-semibold">種別</TableHead>
                <TableHead className="text-xs font-semibold">認証方法</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground px-4 py-8 text-center text-xs"
                  >
                    この月のデータはありません。
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-sm">
                      {formatDateYYYYMMDD_HHMM(event.occurredAt)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{event.storeName}</TableCell>
                    <TableCell>
                      <EventTypeBadge eventType={event.eventType} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {getAuthMethodLabel(event.authMethod)}
                    </TableCell>
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
          totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          total={total}
          limit={PAGE_SIZE}
          isLoading={isFetching}
          onPageChange={setPage}
        />
      </CardContent>
    </Card>
  );
}
