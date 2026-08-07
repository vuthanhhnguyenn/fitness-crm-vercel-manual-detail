'use client';

import { formatISODateLocal } from '@/utils/date.util';

import { Card } from '@/components/ui/card';

import type { LessonScheduleListItem } from '@/lib/api/types.gen';

import { LessonScheduleWeeklyCalendarSkeleton } from './lesson-schedule-skeletons';
import { WeeklyLessonCard } from './weekly-lesson-card';

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

function getWeekDays(weekStart: string): Date[] {
  const start = new Date(weekStart);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDayHeader(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}/${d}`;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function DailyFooter({ events }: { events: LessonScheduleListItem[] }) {
  if (events.length === 0) return null;
  const totalRate = events.reduce(
    (sum, e) => sum + Math.round((e.booked_count / Math.max(e.capacity, 1)) * 100),
    0,
  );
  const avgRate = Math.round(totalRate / events.length);
  const avgColor =
    avgRate >= 90 ? 'text-success' : avgRate >= 70 ? 'text-info' : 'text-muted-foreground';

  return (
    <div className="border-border/50 bg-muted/30 border-t px-2 py-2">
      <div className="text-muted-foreground flex items-center justify-between text-[10px]">
        <span>{events.length}件</span>
        <span className={`font-medium ${avgColor}`}>平均{avgRate}%</span>
      </div>
    </div>
  );
}

interface WeeklyCalendarViewProps {
  schedules: LessonScheduleListItem[];
  weekStart: string;
  isLoading?: boolean;
  onScheduleClick?: (item: LessonScheduleListItem) => void;
  onEditClick?: (item: LessonScheduleListItem) => void;
  canEdit?: boolean;
}

export function WeeklyCalendarView({
  schedules,
  weekStart,
  isLoading = false,
  onScheduleClick,
  onEditClick,
  canEdit = false,
}: WeeklyCalendarViewProps) {
  if (isLoading) return <LessonScheduleWeeklyCalendarSkeleton />;

  const weekDays = getWeekDays(weekStart);

  const byDate = new Map<string, LessonScheduleListItem[]>();
  schedules.forEach((s) => {
    const dateKey = s.start_time.slice(0, 10);
    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
    byDate.get(dateKey)!.push(s);
  });

  return (
    <Card className="h-[560px] shrink-0 gap-0 overflow-hidden overflow-y-auto py-0">
      <div className="grid grid-cols-7">
        {weekDays.map((day, idx) => {
          const isSun = idx === 6;
          const today = isToday(day);
          return (
            <div
              key={idx}
              className={`flex flex-col ${today ? 'bg-primary/[0.05]' : ''} ${idx !== 0 ? 'border-border/50 border-l' : ''}`}
            >
              {/* Day header */}
              <div
                className={`border-border/50 border-b py-2 text-center ${
                  today
                    ? 'bg-primary/10'
                    : isSun
                      ? 'bg-muted/50 text-destructive'
                      : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                <span className={`text-xs font-medium ${today ? 'text-primary font-bold' : ''}`}>
                  {DAY_LABELS[idx]} {formatDayHeader(day)}
                </span>
                {today && (
                  <span className="bg-primary text-primary-foreground ml-1 rounded px-1 text-[10px]">
                    今日
                  </span>
                )}
              </div>

              {/* Event cards stack */}
              <div className="flex flex-1 flex-col gap-1 p-1" style={{ minHeight: '380px' }}>
                {(() => {
                  const dateKey = formatISODateLocal(day);
                  const daySchedules = (byDate.get(dateKey) ?? []).sort((a, b) =>
                    a.start_time.localeCompare(b.start_time),
                  );
                  if (daySchedules.length === 0) {
                    return (
                      <div className="flex flex-1 items-center justify-center">
                        <p className="text-muted-foreground/50 text-[10px]">レッスンなし</p>
                      </div>
                    );
                  }
                  return daySchedules.map((s) => (
                    <WeeklyLessonCard
                      key={s.id}
                      item={s}
                      onScheduleClick={onScheduleClick}
                      onEditClick={onEditClick}
                      canEdit={canEdit}
                    />
                  ));
                })()}
              </div>

              {/* Daily summary footer */}
              {(() => {
                const dateKey = formatISODateLocal(day);
                const daySchedules = byDate.get(dateKey) ?? [];
                return <DailyFooter events={daySchedules} />;
              })()}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
