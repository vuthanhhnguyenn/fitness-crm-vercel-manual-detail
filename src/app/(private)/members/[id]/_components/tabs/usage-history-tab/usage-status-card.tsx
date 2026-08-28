'use client';

import { useQuery } from '@tanstack/react-query';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmMembersByIdUsageStatusOptions } from '@/lib/api/@tanstack/react-query.gen';

interface UsageStatusCardProps {
  readonly memberId: string;
}

export function UsageStatusCard(props: UsageStatusCardProps) {
  const { memberId } = props;
  const { data, isLoading, isError, refetch } = useQuery(
    getCrmMembersByIdUsageStatusOptions({
      path: { id: memberId },
    }),
  );

  const monthlyVisits = data?.monthlyVisits ?? 0;
  const monthlyVisitsDiff: number = data?.monthlyVisitsDiff ?? 0;
  const peakTimeSlot = data?.peakTimeSlot ?? null;
  const frequentStore = data?.frequentStore ?? null;
  const monthlyLessons = data?.monthlyLessons ?? 0;
  const monthlyLessonsDiff: number = data?.monthlyLessonsDiff ?? 0;
  const monthlyOptions = data?.monthlyOptions ?? 0;
  const monthlyOptionsBreakdown = data?.monthlyOptionsBreakdown ?? [];
  const optionsBreakdownLabel = monthlyOptionsBreakdown
    .map((item) => `${item.label} ${item.count}`)
    .join(' / ');

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data}
      onRetry={() => refetch()}
      errorTitle="利用状況の取得に失敗しました"
      emptyTitle="利用状況はありません"
      skeleton={<Skeleton className="h-36 w-full rounded-lg" />}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">利用状況</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-muted-foreground mb-1 text-xs">今月来館回数</p>
              <p className="text-2xl font-bold">{monthlyVisits}回</p>
              {monthlyVisitsDiff !== 0 && (
                <p
                  className={`mt-1 text-xs ${monthlyVisitsDiff > 0 ? 'text-success' : 'text-destructive'}`}
                >
                  前月比 {monthlyVisitsDiff > 0 ? `+${monthlyVisitsDiff}` : monthlyVisitsDiff}回
                </p>
              )}
            </div>

            {(peakTimeSlot ?? frequentStore) && (
              <div className="flex flex-col gap-3 border-t pt-3">
                {peakTimeSlot && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">よく利用する時間帯</span>
                    <span className="text-sm font-medium">{peakTimeSlot}</span>
                  </div>
                )}
                {frequentStore && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">よく利用する店舗</span>
                    <span className="text-sm font-medium">{frequentStore}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">レッスン予約数（今月）</span>
                <div className="text-right">
                  <span className="text-sm font-medium">{monthlyLessons}回</span>
                  {monthlyLessonsDiff !== 0 && (
                    <span
                      className={`ml-2 text-xs ${monthlyLessonsDiff > 0 ? 'text-success' : 'text-destructive'}`}
                    >
                      前月比{' '}
                      {monthlyLessonsDiff > 0 ? `+${monthlyLessonsDiff}` : monthlyLessonsDiff}回
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground text-xs">オプション利用数（今月）</span>
                <div className="text-right">
                  <span className="text-sm font-medium">{monthlyOptions}回</span>
                  {optionsBreakdownLabel && (
                    <p className="text-muted-foreground text-xs">{optionsBreakdownLabel}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DataStateBoundary>
  );
}
