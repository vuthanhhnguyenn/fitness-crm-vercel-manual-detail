'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import type { LessonScheduleListItem, ReservationStatsResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

interface ReservationStatsPanelProps {
  schedule: LessonScheduleListItem;
  statsData: ReservationStatsResponse;
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: '予約済（確定）',
  tentative: '仮予約',
  attended: '出席確認済',
  no_show: '無断キャンセル',
  cancelled: 'キャンセル済',
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-info',
  tentative: 'bg-warning',
  attended: 'bg-success',
  no_show: 'bg-destructive',
  cancelled: 'bg-muted-foreground/40',
};

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), 'yyyy/M/d(E)', { locale: ja });
  } catch {
    return iso;
  }
}

function formatTimeRange(start: string, end: string): string {
  try {
    return `${format(new Date(start), 'H:mm')} 〜 ${format(new Date(end), 'H:mm')}`;
  } catch {
    return `${start} 〜 ${end}`;
  }
}

function getInstructorInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`;
  }
  return name.slice(0, 2);
}

function navigateToLessonContent(): void {
  // D-02 lesson content management — placeholder until route is available
  navigate('/');
}

export function ReservationStatsPanel({ schedule, statsData }: ReservationStatsPanelProps) {
  const stats = statsData.stats;

  return (
    <div className="space-y-4">
      {/* Lesson Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">レッスン情報</CardTitle>
            <span
              className="text-muted-foreground hover:text-foreground cursor-pointer text-[10px] transition-colors"
              onClick={navigateToLessonContent}
            >
              レッスン内容管理で編集 →
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">レッスン名</span>
            <span
              className="text-primary cursor-pointer font-medium hover:underline"
              onClick={navigateToLessonContent}
            >
              {schedule.lesson_name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">日付</span>
            <span>{formatDate(schedule.start_time)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">時間</span>
            <span>{formatTimeRange(schedule.start_time, schedule.end_time)}</span>
          </div>
          {schedule.studio_name && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">スタジオ</span>
              <span>{schedule.studio_name}</span>
            </div>
          )}
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground shrink-0">担当講師</span>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <Avatar className="size-5">
                  <AvatarFallback className="text-[8px]">
                    {getInstructorInitials(schedule.instructor_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{schedule.instructor_name}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">定員</span>
            <span>{stats.total_capacity}名</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">予約数</span>
            <span>{stats.total_reserved}名</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">繰り返し</span>
            <span>単発</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">予約統計</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.status_breakdown.map((item) => (
            <div key={item.status}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs">{STATUS_LABELS[item.status] ?? item.status}</span>
                <span className="text-xs font-medium">
                  {item.count}名（{item.percentage}%）
                </span>
              </div>
              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full ${STATUS_COLORS[item.status] ?? 'bg-muted-foreground/40'}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
