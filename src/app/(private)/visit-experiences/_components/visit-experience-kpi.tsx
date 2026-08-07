'use client';

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmVisitExperiencesSummaryOptions } from '@/lib/api/@tanstack/react-query.gen';

export function VisitExperienceKpi() {
  const { data, isLoading } = useQuery({
    ...getCrmVisitExperiencesSummaryOptions(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  const todayApplications = data?.today_applications ?? 0;
  const visitingCount = data?.visiting_count ?? 0;
  const todayMembershipCount = data?.today_membership_count ?? 0;
  const todayCancelledCount = data?.today_cancelled_count ?? 0;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">本日申込</span>
            <div className="flex items-baseline gap-1">
              <span className="text-foreground text-2xl font-semibold">{todayApplications}</span>
              <span className="text-muted-foreground text-xs">件</span>
            </div>
            <span className="text-muted-foreground text-xs">本日の新規申込数</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-warning/30 p-4">
        <CardContent className="p-0">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">見学中</span>
            <div className="flex items-baseline gap-1">
              <span className="text-warning text-2xl font-semibold">{visitingCount}</span>
              <span className="text-muted-foreground text-xs">件</span>
            </div>
            <span className="text-muted-foreground text-xs">現在施設内にいる人数</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-success/30 p-4">
        <CardContent className="p-0">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">入会申請済</span>
            <div className="flex items-baseline gap-1">
              <span className="text-success text-2xl font-semibold">{todayMembershipCount}</span>
              <span className="text-muted-foreground text-xs">件</span>
            </div>
            <span className="text-muted-foreground text-xs">本日の入会申請数</span>
          </div>
        </CardContent>
      </Card>

      <Card className={todayCancelledCount > 0 ? 'border-destructive/30 p-4' : 'p-4'}>
        <CardContent className="p-0">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">当日キャンセル</span>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-2xl font-semibold ${
                  todayCancelledCount > 0 ? 'text-destructive' : 'text-foreground'
                }`}
              >
                {todayCancelledCount}
              </span>
              <span className="text-muted-foreground text-xs">件</span>
            </div>
            <span className="text-muted-foreground text-xs">本日のキャンセル数</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
