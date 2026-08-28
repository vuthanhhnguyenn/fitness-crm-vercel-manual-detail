'use client';

import { useState } from 'react';

import { formatDate } from '@/utils/format.util';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Dumbbell, LoaderCircle } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
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

import { getCrmMembersByIdTrainingRecordsOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmMembersByIdTrainingRecordsData } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

type TrainingRecordsPeriod = Exclude<
  NonNullable<GetCrmMembersByIdTrainingRecordsData['query']>['period'],
  undefined
>;

const PERIOD_OPTIONS: Array<{ label: string; value: TrainingRecordsPeriod }> = [
  { label: '全期間', value: 'all' },
  { label: '今月', value: 'this_month' },
  { label: '過去3ヶ月', value: 'last_3_months' },
  { label: '過去1年', value: 'last_1_year' },
];

export function TrainingRecordsTab({ memberId }: { memberId: string }) {
  const [period, setPeriod] = useState<TrainingRecordsPeriod>('all');
  const queryOptions: Parameters<typeof getCrmMembersByIdTrainingRecordsOptions>[0] = {
    path: { id: memberId },
    query: { period },
  };

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    ...getCrmMembersByIdTrainingRecordsOptions(queryOptions),
    // Keep the previous period's rows while the new one loads, so changing the
    // filter never flashes the table (and its Select) back to a skeleton.
    placeholderData: keepPreviousData,
  });
  const showOverlay = isFetching && !isLoading;
  const summary = data?.summary;
  const trainingHistory = data?.trainingHistory ?? [];
  const selectedPeriodLabel =
    PERIOD_OPTIONS.find((item) => item.value === period)?.label ?? '全期間';

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="w-full md:w-[60%]">
        <Card className="gap-0 py-0">
          {/* Header stays OUTSIDE the boundary: the period Select is the only way out of an
              empty / error state, so it must never be swapped away. */}
          <CardHeader className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold">トレーニング記録</CardTitle>
              <Select
                value={period}
                onValueChange={(value) => setPeriod(value as TrainingRecordsPeriod)}
                items={PERIOD_OPTIONS}
              >
                <SelectTrigger className="h-8 w-32 text-xs">
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
            </div>
          </CardHeader>
          <DataStateBoundary
            isLoading={isLoading}
            isError={isError}
            isEmpty={!data}
            errorTitle="トレーニング記録の取得に失敗しました"
            onRetry={() => refetch()}
          >
            <div className="relative">
              {showOverlay && (
                <div className="bg-background/40 pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                  <LoaderCircle className="text-muted-foreground h-6 w-6 animate-spin" />
                </div>
              )}
              {trainingHistory.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                  <Dumbbell className="mb-2 size-8 opacity-40" />
                  <p className="text-sm">この期間にトレーニング記録がありません</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-semibold">実施日</TableHead>
                      <TableHead className="text-xs font-semibold">ルーティン名</TableHead>
                      <TableHead className="text-right text-xs font-semibold">実施時間</TableHead>
                      <TableHead className="text-right text-xs font-semibold">
                        消費カロリー
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className={cn('transition-opacity', showOverlay && 'opacity-50')}>
                    {trainingHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(item.date)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{item.routineName}</TableCell>
                        <TableCell className="text-right text-sm">{item.durationMin}分</TableCell>
                        <TableCell className="text-right text-sm">{item.calories}kcal</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DataStateBoundary>
        </Card>
      </div>

      <div className="w-full md:w-[40%]">
        <div className="sticky top-0 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                記録サマリー（{selectedPeriodLabel}）
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={cn(
                    'grid grid-cols-2 gap-x-8 gap-y-4 transition-opacity',
                    showOverlay && 'opacity-50',
                  )}
                >
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">実施回数</p>
                    <p className="text-2xl font-bold">
                      {(summary?.trainingCount ?? 0).toLocaleString()}
                      <span className="ml-1 text-sm font-normal">回</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">合計時間</p>
                    <p className="text-2xl font-bold">
                      {(summary?.totalDurationMin ?? 0).toLocaleString()}
                      <span className="ml-1 text-sm font-normal">分</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">合計消費カロリー</p>
                    <p className="text-sm font-semibold">
                      {(summary?.totalCalories ?? 0).toLocaleString()} kcal
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">最多ルーティン</p>
                    <p className="text-sm font-semibold">
                      {summary?.mostFrequentRoutineName ?? '-'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
