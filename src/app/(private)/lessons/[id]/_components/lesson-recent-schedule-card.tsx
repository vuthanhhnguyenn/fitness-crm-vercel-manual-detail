'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmLessonContentsByIdSchedulesOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';
import { cn } from '@/lib/utils';

import { getCapacityToneClass } from '../_constants/constants';
import { LessonScheduleSheet } from './lesson-schedule-sheet';

interface LessonRecentScheduleCardProps {
  lessonId: string;
  lessonName: string;
}

/**
 * "直近のスケジュール" card — top 3 sessions + total badge, with the
 * "全{n}件を表示" sheet trigger and row → reservation navigation
 * (FR-003-P1-08 / 10). Shares its query with the schedule sheet.
 */
export function LessonRecentScheduleCard({ lessonId, lessonName }: LessonRecentScheduleCardProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading } = useQuery({
    ...getCrmLessonContentsByIdSchedulesOptions({ path: { id: lessonId } }),
    enabled: Boolean(lessonId),
  });

  const schedule = data?.data;
  const sessions = schedule?.sessions ?? [];
  const total = schedule?.total ?? 0;
  const topSessions = sessions.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">直近のスケジュール</CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            全{total}件
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : topSessions.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">スケジュールはありません</p>
        ) : (
          <div className="space-y-2">
            {topSessions.map((session) => (
              <button
                type="button"
                key={session.id}
                onClick={() =>
                  router.push(navigate('/lesson-schedules/[id]/reservations', session.id))
                }
                className="bg-muted/50 hover:bg-muted flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
              >
                <CalendarDays className="text-muted-foreground size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {session.date} {session.time}
                  </p>
                  <p className="text-muted-foreground text-xs">{session.studio}</p>
                </div>
                <span
                  className={cn(
                    'text-xs font-medium tabular-nums',
                    getCapacityToneClass(session.booked, session.capacity),
                  )}
                >
                  {session.booked}/{session.capacity}名
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 flex-1 text-xs"
            disabled={total === 0}
            onClick={() => setSheetOpen(true)}
          >
            全{total}件を表示
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => router.push(navigate('/lesson-schedules/create'))}
          >
            <Plus className="mr-1 size-3" />
            スケジュール追加
          </Button>
        </div>
      </CardContent>

      {schedule && (
        <LessonScheduleSheet
          lessonName={lessonName}
          schedule={schedule}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </Card>
  );
}
