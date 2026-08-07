'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock, MapPin, User } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { Badge } from '@/components/ui/badge';

import type { LessonScheduleListItem } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

interface LessonHeaderProps {
  schedule: LessonScheduleListItem;
  remainingSeats?: number;
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), 'M月d日（E）', { locale: ja });
  } catch {
    return iso;
  }
}

function formatTimeRange(start: string, end: string): string {
  try {
    return `${format(new Date(start), 'HH:mm')}〜${format(new Date(end), 'HH:mm')}`;
  } catch {
    return `${start}〜${end}`;
  }
}

export function LessonHeader({ schedule, remainingSeats }: LessonHeaderProps) {
  const isCancelled = schedule.status === 'cancelled';

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <BackLink label="予約管理に戻る" href={navigate('/lesson-schedules')} />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold">{schedule.lesson_name}</h1>
            {isCancelled && (
              <Badge variant="destructive" className="text-xs">
                中止済み
              </Badge>
            )}
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-foreground font-medium">{formatDate(schedule.start_time)}</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {formatTimeRange(schedule.start_time, schedule.end_time)}
            </span>
            {schedule.studio_name && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {schedule.studio_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <User className="size-3.5" />
              {schedule.instructor_name}
            </span>
          </div>
        </div>

        {!isCancelled && remainingSeats !== undefined && (
          <Badge variant="outline" className="shrink-0 text-xs">
            残り{remainingSeats}席
          </Badge>
        )}
      </div>
    </div>
  );
}
