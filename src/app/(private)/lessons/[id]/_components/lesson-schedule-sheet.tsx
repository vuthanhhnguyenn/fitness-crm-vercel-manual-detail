'use client';

import { useRouter } from 'next/navigation';

import { CalendarDays, ExternalLink, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import type { GetCrmLessonContentsByIdSchedulesResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';
import { cn } from '@/lib/utils';

import { getCapacityToneClass } from '../_constants/constants';

type ScheduleSummary = NonNullable<GetCrmLessonContentsByIdSchedulesResponse>['data'];
type RecurringPattern = ScheduleSummary['recurring_patterns'][number];

interface LessonScheduleSheetProps {
  lessonName: string;
  schedule: ScheduleSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "全件表示" Sheet — recurring-pattern summary (instructors as D-04 links,
 * multi-instructor n名) + full per-session list with capacity color coding
 * (FR-003-P1-09 / 09a / 10).
 */
export function LessonScheduleSheet({
  lessonName,
  schedule,
  open,
  onOpenChange,
}: LessonScheduleSheetProps) {
  const router = useRouter();
  const { recurring_patterns, sessions, total } = schedule;

  // D-04 instructor master page does not exist yet (research D6); the link is a
  // navigation entry point only — its destination is out of scope for Phase 1.
  const handleInstructorClick = () => {
    // no-op: D-04 instructor master route not yet defined
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-[480px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[480px]">
        <div className="shrink-0 border-b px-6 py-4">
          <SheetHeader className="gap-0 p-0">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="size-4" />
              {lessonName} のスケジュール
              <Badge variant="secondary" className="text-[10px]">
                {total}件
              </Badge>
            </SheetTitle>
            <SheetDescription className="sr-only">全{total}件の開催予定</SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {recurring_patterns.length > 0 && (
            <>
              <div className="space-y-3 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-foreground text-xs font-semibold">繰り返し設定</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {recurring_patterns.length}件
                  </Badge>
                </div>
                {recurring_patterns.map((pattern: RecurringPattern) => (
                  <div key={pattern.id} className="bg-muted/50 space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-2 text-[10px] font-medium">
                          毎週 {pattern.days.join('・')}
                        </Badge>
                        <span className="text-xs font-medium">{pattern.time}</span>
                      </div>
                      {pattern.period && (
                        <span className="text-muted-foreground text-[10px]">{pattern.period}</span>
                      )}
                    </div>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span>{pattern.studio}</span>
                      <span className="flex flex-wrap items-center gap-1">
                        {pattern.instructors.length > 1 && (
                          <span>{pattern.instructors.length}名:</span>
                        )}
                        {pattern.instructors.map((instructor, idx) => (
                          <span key={instructor.instructor_id} className="inline-flex items-center">
                            <button
                              type="button"
                              onClick={handleInstructorClick}
                              className="text-primary inline-flex items-center gap-0.5 hover:underline"
                            >
                              {instructor.name}
                              <ExternalLink className="size-3" />
                            </button>
                            {idx < pattern.instructors.length - 1 && <span>、</span>}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="-mx-6 w-[calc(100%+48px)]" />
            </>
          )}

          <div className="py-4">
            <p className="text-foreground mb-3 text-xs font-semibold">個別スケジュール一覧</p>
            {sessions.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                スケジュールはありません
              </p>
            ) : (
              <div className="divide-y">
                {sessions.map((session) => (
                  <button
                    type="button"
                    key={session.id}
                    onClick={() =>
                      router.push(navigate('/lesson-schedules/[id]/reservations', session.id))
                    }
                    className="hover:bg-muted/40 flex w-full items-center gap-3 rounded py-3 text-left transition-colors"
                  >
                    <CalendarDays className="text-muted-foreground size-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{session.date}</p>
                      <p className="text-muted-foreground text-xs">
                        {session.time} · {session.studio}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 text-xs font-semibold tabular-nums',
                        getCapacityToneClass(session.booked, session.capacity),
                      )}
                    >
                      {session.booked}/{session.capacity}名
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t px-6 py-4">
          <Button
            type="button"
            className="h-9 w-full text-sm"
            onClick={() => router.push(navigate('/lesson-schedules/create'))}
          >
            <Plus className="mr-2 size-4" />
            スケジュールを追加
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
