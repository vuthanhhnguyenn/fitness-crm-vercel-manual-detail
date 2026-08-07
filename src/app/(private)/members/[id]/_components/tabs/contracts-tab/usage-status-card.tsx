'use client';

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmMembersByIdUsageStatusOptions } from '@/lib/api/@tanstack/react-query.gen';

interface UsageStatusCardProps {
  memberId: string;
}

export function UsageStatusCard({ memberId }: UsageStatusCardProps) {
  const { data, isLoading } = useQuery(
    getCrmMembersByIdUsageStatusOptions({
      path: { id: memberId },
    }),
  );

  if (isLoading) return <Skeleton className="h-36 w-full rounded-lg" />;

  const monthlyVisits = data?.monthly_visits ?? 0;
  const monthlyVisitsDiff: number = data?.monthly_visits_diff ?? 0;
  const peakTimeSlot = data?.peak_time_slot ?? null;
  const frequentStore = data?.frequent_store ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">利用状況</CardTitle>
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
        </div>
      </CardContent>
    </Card>
  );
}
