'use client';

import {
  AlertTriangle,
  BarChart3,
  Calendar as CalendarIcon,
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
          <p className="text-muted-foreground mt-1 text-[11px]">定員 {kpi.total_capacity}名</p>
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
            <span className="text-success flex items-center gap-0.5 text-[11px]">
              <TrendingUp className="size-3" />
              {kpi.total_booked}/{kpi.total_capacity}
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
            {kpi.cancelled_count}
            <span className="text-muted-foreground ml-1 text-sm font-normal">件</span>
          </p>
          <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[11px]">
            <span>キャンセル {kpi.cancelled_count}</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: アラート */}
      <Card>
        <CardContent className="px-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-muted-foreground text-xs">要対応アラート</span>
            <Users className="text-info size-4" />
          </div>
          <p className={`text-2xl font-bold ${kpi.alert_count > 0 ? 'text-destructive' : ''}`}>
            {kpi.alert_count}
            <span className="text-muted-foreground ml-1 text-sm font-normal">件</span>
          </p>
          <p className="text-muted-foreground mt-1 text-[11px]">
            {kpi.alert_count > 0 ? '確認が必要です' : '異常なし'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
