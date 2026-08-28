'use client';

import {
  AlertTriangle,
  BarChart3,
  Calendar as CalendarIcon,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

import type { LessonScheduleKpiSummary } from '@/lib/api/types.gen';

interface KpiSummaryProps {
  kpi: LessonScheduleKpiSummary;
}

export function KpiSummary({ kpi }: KpiSummaryProps) {
  const rate = Math.round(kpi.occupancy_rate);
  const change = Math.round(kpi.occupancy_rate_change_pct * 10) / 10;
  const totalChanges = kpi.cancelled_count + kpi.time_changed_count + kpi.instructor_changed_count;

  return (
    <div className="grid shrink-0 grid-cols-2 gap-4 md:grid-cols-4">
      {/* Card 1: 本日のレッスン */}
      <Card>
        <CardContent className="px-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-muted-foreground text-xs">本日のレッスン</span>
            <CalendarIcon className="text-info size-4" />
          </div>
          <p className="text-2xl font-bold">
            {kpi.total_lessons}
            <span className="text-muted-foreground ml-1 text-sm font-normal">コマ</span>
          </p>
          <p className="text-muted-foreground mt-1 text-[11px]">
            スタジオ {kpi.studio_lesson_count} / パーソナル {kpi.personal_lesson_count}
          </p>
        </CardContent>
      </Card>

      {/* Card 2: 予約充足率 */}
      <Card>
        <CardContent className="px-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-muted-foreground text-xs">予約充足率</span>
            <BarChart3 className="text-success size-4" />
          </div>
          <p className="text-2xl font-bold">
            {rate}
            <span className="text-muted-foreground ml-0.5 text-sm font-normal">%</span>
          </p>
          <div className="mt-1 flex items-center gap-2">
            <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-success h-full rounded-full"
                style={{ width: `${Math.min(rate, 100)}%` }}
              />
            </div>
            <span
              className={`flex items-center gap-0.5 text-[11px] ${change >= 0 ? 'text-success' : 'text-destructive'}`}
            >
              {change >= 0 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {change >= 0 ? '+' : ''}
              {change}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: 本日の変更 */}
      <Card>
        <CardContent className="px-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-muted-foreground text-xs">本日の変更</span>
            <AlertTriangle className="text-warning size-4" />
          </div>
          <p className="text-2xl font-bold">
            {totalChanges}
            <span className="text-muted-foreground ml-1 text-sm font-normal">件</span>
          </p>
          <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[11px]">
            <span>キャンセル {kpi.cancelled_count}</span>
            <span>時間変更 {kpi.time_changed_count}</span>
            <span>担当変更 {kpi.instructor_changed_count}</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: 本日の担当スタッフ */}
      <Card>
        <CardContent className="px-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-muted-foreground text-xs">本日の担当スタッフ</span>
            <Users className="text-info size-4" />
          </div>
          <p className="text-2xl font-bold">
            {kpi.assigned_staff_count}
            <span className="text-muted-foreground ml-1 text-sm font-normal">名</span>
          </p>
          <p className="text-muted-foreground mt-1 text-[11px]">
            インストラクター {kpi.instructor_staff_count} / トレーナー {kpi.trainer_staff_count}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
