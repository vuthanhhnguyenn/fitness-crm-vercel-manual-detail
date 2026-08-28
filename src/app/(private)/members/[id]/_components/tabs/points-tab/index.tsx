'use client';

import { useState } from 'react';

import { formatDate } from '@/utils/format.util';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, LoaderCircle } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { MonthPicker } from '@/components/common/month-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { getCrmMembersByIdPointsOptions } from '@/lib/api/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';

import { currentYearMonth, monthToRange } from '../../../_utils/month-range';

type PointKind = '獲得' | '消費';
type SortColumn = 'date' | 'kind';
type SortOrder = 'asc' | 'desc';

export function PointsTab({ memberId }: { memberId: string }) {
  const [month, setMonth] = useState(currentYearMonth);
  const [sortBy, setSortBy] = useState<SortColumn>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const range = monthToRange(month);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    ...getCrmMembersByIdPointsOptions({
      path: { id: memberId },
      query: { from: range.from, to: range.to },
    }),
    // Keep the previous month's data so switching months does not flash back to the skeleton
    placeholderData: keepPreviousData,
  });

  // `keepPreviousData` keeps the old month on screen while the new one loads, so show a dimming
  // overlay instead of a skeleton (same pattern as the shared DataTable).
  const showOverlay = isFetching && !isLoading;

  // A-01 FR-011 "the name is resolved dynamically from the brands master" — per the design
  // (Member Financial History) the server returns the resolved pointName; the FE just displays it
  const pointName = data?.pointName ?? 'ポイント';

  function handleSort(column: SortColumn) {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  }

  function renderSortIcon(column: SortColumn) {
    if (sortBy !== column) {
      return (
        <ArrowUpDown className="group-hover/sort:text-foreground text-muted-foreground size-3 transition-colors" />
      );
    }
    return sortOrder === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
  }

  function sortTooltip(column: SortColumn) {
    if (sortBy !== column) return 'クリックで昇順ソート';
    return sortOrder === 'asc' ? 'クリックで降順ソート' : 'クリックで昇順ソート';
  }

  const earnList = data?.earnHistory ?? [];
  const spendList = data?.spendHistory ?? [];
  const balance = data?.pointBalance ?? 0;

  const totalEarned = earnList.reduce((sum, item) => sum + item.points, 0);
  const totalSpent = spendList.reduce((sum, item) => sum + item.points, 0);
  const expiringPoints = data?.expiringPoints ?? 0;
  const expiringAt = data?.expiringAt ?? null;

  const unifiedHistory = [
    ...earnList.map((item) => ({ ...item, kind: '獲得' as PointKind })),
    ...spendList.map((item) => ({ ...item, kind: '消費' as PointKind })),
  ].sort((a, b) => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'date') return a.date.localeCompare(b.date) * dir;
    return a.kind.localeCompare(b.kind) * dir;
  });

  const boundaryProps = {
    isLoading,
    isError,
    isEmpty: !data,
    onRetry: () => {
      void refetch();
    },
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* Left column: unified table. MonthPicker stays outside the boundary so months can be switched on error */}
      <div className="w-full md:w-3/5">
        <Card className="gap-0 py-0">
          <CardHeader className="px-4 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{pointName}履歴</CardTitle>
              <div className="w-40">
                <MonthPicker value={month} onChange={setMonth} className="w-full" />
              </div>
            </div>
          </CardHeader>
          <DataStateBoundary
            {...boundaryProps}
            errorTitle={`${pointName}履歴の取得に失敗しました`}
            skeleton={
              <div className="space-y-3 px-4 pb-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={`point-row-${index}`} className="h-9 w-full" />
                ))}
              </div>
            }
          >
            <div className="relative">
              {showOverlay && (
                <div className="bg-background/40 pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                  <LoaderCircle className="text-muted-foreground size-6 animate-spin" />
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger render={<span className="inline-flex" />}>
                            <Button
                              variant="ghost"
                              className="group/sort h-auto gap-1 p-0 text-xs font-semibold hover:bg-transparent"
                              onClick={() => handleSort('date')}
                            >
                              日付
                              {renderSortIcon('date')}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">{sortTooltip('date')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger render={<span className="inline-flex" />}>
                            <Button
                              variant="ghost"
                              className="group/sort h-auto gap-1 p-0 text-xs font-semibold hover:bg-transparent"
                              onClick={() => handleSort('kind')}
                            >
                              種別
                              {renderSortIcon('kind')}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">{sortTooltip('kind')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-xs font-semibold">事由</TableHead>
                    <TableHead className="text-right text-xs font-semibold">ポイント数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={cn('transition-opacity', showOverlay && 'opacity-50')}>
                  {unifiedHistory.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-muted-foreground py-8 text-center text-xs"
                      >
                        この月のデータはありません。
                      </TableCell>
                    </TableRow>
                  ) : (
                    unifiedHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(item.date)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              item.kind === '獲得'
                                ? 'bg-success/15 text-success border-success/20 text-[10px]'
                                : 'bg-destructive/15 text-destructive border-destructive/20 text-[10px]'
                            }
                          >
                            {item.kind}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{item.reason}</TableCell>
                        <TableCell
                          className={
                            item.kind === '獲得'
                              ? 'text-success text-right text-sm font-semibold'
                              : 'text-destructive text-right text-sm font-semibold'
                          }
                        >
                          {item.kind === '獲得' ? '+' : '-'}
                          {item.points.toLocaleString()}pt
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </DataStateBoundary>
        </Card>
      </div>

      {/* Right column: point summary */}
      <div className="w-full md:w-2/5">
        <div className="sticky top-0 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">ポイントサマリー</CardTitle>
            </CardHeader>
            <DataStateBoundary
              {...boundaryProps}
              errorTitle="ポイントサマリーの取得に失敗しました"
              skeleton={
                <CardContent className="space-y-3 px-4">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              }
            >
              <CardContent
                className={cn('px-4 transition-opacity', showOverlay && 'opacity-50')}
                aria-busy={showOverlay}
              >
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">残高</p>
                    <p className="text-3xl font-bold">
                      {balance.toLocaleString()}
                      <span className="text-muted-foreground ml-1 text-sm font-normal">pt</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">期間内獲得合計</span>
                      <span className="text-success text-sm font-semibold">
                        +{totalEarned.toLocaleString()}pt
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">期間内消費合計</span>
                      <span className="text-destructive text-sm font-semibold">
                        -{totalSpent.toLocaleString()}pt
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">失効予定</span>
                      <span className="text-muted-foreground text-sm font-medium">
                        {expiringPoints.toLocaleString()}pt
                        {expiringAt && `（${formatDate(expiringAt)}）`}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </DataStateBoundary>
          </Card>
        </div>
      </div>
    </div>
  );
}
