'use client';

import { useState } from 'react';

import { formatDate } from '@/utils/format.util';
import { useQuery } from '@tanstack/react-query';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmMembersByIdPointsOptions } from '@/lib/api/@tanstack/react-query.gen';
import { Brand } from '@/lib/api/types.gen';

type PointHistoryPeriod = 'all' | 'this_month' | 'last_3_months' | 'last_1_year';

const PERIOD_OPTIONS: { value: PointHistoryPeriod; label: string }[] = [
  { value: 'all', label: '全期間' },
  { value: 'this_month', label: '今月' },
  { value: 'last_3_months', label: '過去3ヶ月' },
  { value: 'last_1_year', label: '過去1年' },
];

export function PointsTab({ memberId, brand }: { memberId: string; brand: Brand }) {
  const [period, setPeriod] = useState<PointHistoryPeriod>('all');
  const { data, isLoading, isError, refetch } = useQuery(
    getCrmMembersByIdPointsOptions({
      path: { id: memberId },
      query: { period },
    }),
  );
  const pointName = brand === 'fit365' ? 'ベアレージポイント' : 'ENJOYポイント';

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data}
      onRetry={() => refetch()}
    >
      {data
        ? (() => {
            const earnList = data.earn_history ?? [];
            const spendList = data.spend_history ?? [];
            const balance = data.point_balance ?? 0;

            return (
              <div className="flex flex-col gap-4">
                <Card>
                  <CardContent className="flex items-center justify-between gap-3 px-4 py-4">
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs">{pointName}残高</p>
                      <p className="text-3xl font-bold">
                        {balance.toLocaleString()}{' '}
                        <span className="text-muted-foreground text-sm font-normal">pt</span>
                      </p>
                    </div>
                    <Select
                      value={period}
                      onValueChange={(value) => setPeriod(value as PointHistoryPeriod)}
                      items={PERIOD_OPTIONS}
                    >
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIOD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="w-full md:w-3/5">
                    <Card className="gap-0 py-0">
                      <CardHeader className="px-4 py-3">
                        <CardTitle className="text-sm">獲得履歴</CardTitle>
                      </CardHeader>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs font-semibold">日付</TableHead>
                            <TableHead className="text-xs font-semibold">事由</TableHead>
                            <TableHead className="text-right text-xs font-semibold">
                              ポイント数
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {earnList.length > 0 ? (
                            earnList.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="text-muted-foreground text-sm">
                                  {formatDate(item.date)}
                                </TableCell>
                                <TableCell className="text-sm font-medium">{item.reason}</TableCell>
                                <TableCell className="text-right text-sm font-semibold text-emerald-600">
                                  +{item.points.toLocaleString()}pt
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-muted-foreground py-4 text-center text-sm"
                              >
                                該当のデータがありません。
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>

                  <div className="w-full md:w-2/5">
                    <Card className="gap-0 py-0">
                      <CardHeader className="px-4 py-3">
                        <CardTitle className="text-sm">消費履歴</CardTitle>
                      </CardHeader>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs font-semibold">日付</TableHead>
                            <TableHead className="text-xs font-semibold">事由</TableHead>
                            <TableHead className="text-right text-xs font-semibold">
                              ポイント数
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {spendList.length > 0 ? (
                            spendList.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="text-muted-foreground text-sm">
                                  {formatDate(item.date)}
                                </TableCell>
                                <TableCell className="text-sm font-medium">{item.reason}</TableCell>
                                <TableCell className="text-destructive text-right text-sm font-semibold">
                                  -{item.points.toLocaleString()}pt
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-muted-foreground py-4 text-center text-sm"
                              >
                                該当のデータがありません。
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                </div>
              </div>
            );
          })()
        : null}
    </DataStateBoundary>
  );
}
