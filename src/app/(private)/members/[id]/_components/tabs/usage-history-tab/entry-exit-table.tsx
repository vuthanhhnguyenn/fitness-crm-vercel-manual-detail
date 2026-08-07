'use client';

import { useMemo, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { LogIn, LogOut } from 'lucide-react';

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

import {
  getCrmMembersByIdStoresOptions,
  getCrmMembersByIdUsageHistoryEntriesOptions,
} from '@/lib/api/@tanstack/react-query.gen';

import { getAuthMethodLabel } from './auth-method-label';

interface EntryExitTableProps {
  readonly memberId: string;
}

const PERIOD_OPTIONS = [
  { value: 'this_month', label: '今月' },
  { value: 'last_month', label: '先月' },
  { value: '3months', label: '過去3ヶ月' },
  { value: '6months', label: '過去6ヶ月' },
] as const;

export function EntryExitTable(props: EntryExitTableProps) {
  const { memberId } = props;
  const [storeFilter, setStoreFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<
    'this_month' | 'last_month' | '3months' | '6months'
  >('this_month');
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading: isEntriesLoading,
    isError: isEntriesError,
  } = useQuery(
    getCrmMembersByIdUsageHistoryEntriesOptions({
      path: { id: memberId },
      query: { store: storeFilter, period: periodFilter, page, limit: PAGE_SIZE },
    }),
  );
  const records = data?.items ?? [];
  const total = data?.total ?? 0;

  const { data: storesData, isLoading: isStoresLoading } = useQuery(
    getCrmMembersByIdStoresOptions({
      path: { id: memberId },
    }),
  );

  const stores = useMemo(
    () => [
      { value: 'all', label: '全店舗' },
      ...(storesData?.stores ?? []).map((store) => ({
        value: store.id,
        label: store.name,
      })),
    ],
    [storesData?.stores],
  );

  const isLoading = isEntriesLoading || isStoresLoading;
  const isError = isEntriesError;

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data}
      skeleton={
        <Card className="gap-0 py-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
            <CardTitle>入退館履歴</CardTitle>
            <div className="flex gap-3">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-40" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`entry-exit-row-${index}`} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>
      }
    >
      <Card className="gap-0 py-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
          <CardTitle>入退館履歴</CardTitle>
          <div className="flex gap-3">
            <Select
              value={storeFilter}
              onValueChange={(value) => {
                setStoreFilter(value ?? 'all');
                setPage(1);
              }}
              items={stores}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="店舗を選択" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.value} value={store.value}>
                    {store.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={periodFilter}
              onValueChange={(value) => {
                setPeriodFilter(value as 'this_month' | 'last_month' | '3months' | '6months');
                setPage(1);
              }}
              items={PERIOD_OPTIONS}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="期間を選択" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          {records.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              該当の入退館履歴がありません。
            </div>
          ) : (
            <>
              <Table size="md">
                <TableHeader>
                  <TableRow>
                    <TableHead>日時</TableHead>
                    <TableHead>店舗</TableHead>
                    <TableHead>種別</TableHead>
                    <TableHead>認証方法</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm">
                        {format(parseISO(record.entry_time), 'yyyy/MM/dd HH:mm')}
                      </TableCell>
                      <TableCell className="text-sm">{record.store_name}</TableCell>
                      <TableCell>
                        {(() => {
                          const isEntry = !record.exit_time;
                          return (
                            <Badge
                              variant="outline"
                              className={`gap-1 text-[10px] ${
                                isEntry
                                  ? 'bg-info/15 text-info border-info/20'
                                  : 'text-muted-foreground border-muted'
                              }`}
                            >
                              {isEntry ? (
                                <LogIn className="size-3" />
                              ) : (
                                <LogOut className="size-3" />
                              )}
                              {isEntry ? '入館' : '退館'}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {getAuthMethodLabel(record.entry_method)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={page}
                totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
                total={total}
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
