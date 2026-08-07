'use client';

import { useState } from 'react';

import type { UtilizationSummary } from '@/app/api/_schemas/studio-detail.schema';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StudioUtilizationCardProps {
  utilization: UtilizationSummary;
}

interface UsagePeriod {
  label: string;
  lessonCount: number;
  avgRate: number;
  activeHours: string;
  hourlyRates: Array<{ band: string; rate: number }>;
  trend: number[];
}

const DEFAULT_HOURLY_BANDS = ['10-12時', '12-15時', '15-18時', '18-21時'] as const;
const TREND_SLOT_COUNT = 7;

const DEFAULT_HOURLY_RATES = DEFAULT_HOURLY_BANDS.map((band) => ({ band, rate: 0 }));
const DEFAULT_TREND = Array.from({ length: TREND_SLOT_COUNT }, () => 0);

function withDefaultHourlyRates(rates?: Array<{ band: string; rate: number }>) {
  return rates?.length ? rates : DEFAULT_HOURLY_RATES;
}

function withDefaultTrend(trend?: number[]) {
  return trend?.length ? trend : DEFAULT_TREND;
}

function buildUsagePeriods(u: UtilizationSummary) {
  const day: UsagePeriod = {
    label: '本日',
    lessonCount: u.day_lesson_count ?? 0,
    avgRate: u.day_rate,
    activeHours: u.active_hours ?? '',
    hourlyRates: withDefaultHourlyRates(u.day_hourly_rates),
    trend: withDefaultTrend(u.day_trend),
  };
  const week: UsagePeriod = {
    label: '今週',
    lessonCount: u.week_lesson_count ?? 0,
    avgRate: u.week_rate,
    activeHours: u.active_hours ?? '',
    hourlyRates: withDefaultHourlyRates(u.week_hourly_rates),
    trend: withDefaultTrend(u.week_trend),
  };
  const month: UsagePeriod = {
    label: '今月',
    lessonCount: u.month_lesson_count ?? 0,
    avgRate: u.month_rate,
    activeHours: u.active_hours ?? '',
    hourlyRates: withDefaultHourlyRates(u.month_hourly_rates),
    trend: withDefaultTrend(u.month_trend),
  };
  return { day, week, month } as const;
}

export function StudioUtilizationCard({ utilization }: StudioUtilizationCardProps) {
  const periods = buildUsagePeriods(utilization);
  const [usagePeriod, setUsagePeriod] = useState<'day' | 'week' | 'month'>('week');
  const usage = periods[usagePeriod];

  return (
    <Card>
      <CardContent className="px-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">利用状況</h3>
          <Tabs
            value={usagePeriod}
            onValueChange={(v) => setUsagePeriod(v as 'day' | 'week' | 'month')}
          >
            <TabsList className="h-7">
              <TabsTrigger value="day" className="px-2 text-[11px]">
                日次
              </TabsTrigger>
              <TabsTrigger value="week" className="px-2 text-[11px]">
                週次
              </TabsTrigger>
              <TabsTrigger value="month" className="px-2 text-[11px]">
                月次
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">{usage.label}のレッスン数</span>
            <span className="text-sm font-semibold">{usage.lessonCount}コマ</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">予約充足率</span>
            <span className="text-success text-sm font-semibold">{usage.avgRate}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">稼働時間帯</span>
            <span className="text-sm">{usage.activeHours}</span>
          </div>
        </div>

        <div className="mt-4 border-t pt-3">
          <h4 className="mb-2 text-xs font-semibold">時間帯別稼働率</h4>
          <div className="space-y-2">
            {usage.hourlyRates.map((h) => (
              <div key={h.band}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px]">{h.band}</span>
                  <span
                    className={`text-xs font-medium ${
                      h.rate >= 80
                        ? 'text-success'
                        : h.rate >= 60
                          ? 'text-warning'
                          : 'text-destructive'
                    }`}
                  >
                    {h.rate}%
                  </span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full ${
                      h.rate >= 80 ? 'bg-success' : h.rate >= 60 ? 'bg-warning' : 'bg-destructive'
                    }`}
                    style={{ width: `${h.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t pt-3">
          <h4 className="mb-2 text-xs font-semibold">
            予約トレンド（直近
            {usagePeriod === 'day' ? '7枠' : usagePeriod === 'week' ? '7週' : '7ヶ月'}）
          </h4>
          <div className="flex h-16 items-end gap-1">
            {usage.trend.map((v, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="bg-info/30 w-full rounded-sm transition-all"
                  style={{ height: `${v}%` }}
                />
                <span className="text-muted-foreground text-[9px]">{v}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
