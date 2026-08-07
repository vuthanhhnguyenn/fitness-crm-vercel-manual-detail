'use client';

import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

import { Card, CardContent } from '@/components/ui/card';

import { getCrmFamilyRegistrationsDashboardOptions } from '@/lib/api/@tanstack/react-query.gen';

// Data point type for chart data
type ChartDataPoint = {
  label: string;
  invited: number;
  awaiting_profile: number;
  completed: number;
  rejected: number;
  declined: number;
};

// const weeklyData: ChartDataPoint[] = [
//   { label: '月', invited: 3, awaiting_profile: 2, completed: 1, rejected: 0, declined: 0 },
//   { label: '火', invited: 5, awaiting_profile: 4, completed: 2, rejected: 1, declined: 0 },
//   { label: '水', invited: 2, awaiting_profile: 3, completed: 2, rejected: 0, declined: 1 },
//   { label: '木', invited: 8, awaiting_profile: 6, completed: 3, rejected: 1, declined: 0 },
//   { label: '金', invited: 6, awaiting_profile: 5, completed: 4, rejected: 2, declined: 1 },
//   { label: '土', invited: 1, awaiting_profile: 2, completed: 1, rejected: 0, declined: 0 },
//   { label: '日', invited: 4, awaiting_profile: 3, completed: 2, rejected: 1, declined: 0 },
// ];
const monthlyData: ChartDataPoint[] = [
  { label: '第1週', invited: 18, awaiting_profile: 14, completed: 9, rejected: 2, declined: 3 },
  { label: '第2週', invited: 24, awaiting_profile: 19, completed: 13, rejected: 1, declined: 4 },
  { label: '第3週', invited: 15, awaiting_profile: 12, completed: 10, rejected: 3, declined: 2 },
  { label: '第4週', invited: 29, awaiting_profile: 22, completed: 16, rejected: 2, declined: 5 },
];

const quarterlyData: ChartDataPoint[] = [
  { label: '1月W1', invited: 12, awaiting_profile: 9, completed: 6, rejected: 1, declined: 2 },
  { label: '1月W2', invited: 18, awaiting_profile: 14, completed: 9, rejected: 2, declined: 3 },
  { label: '1月W3', invited: 22, awaiting_profile: 17, completed: 11, rejected: 1, declined: 4 },
  { label: '1月W4', invited: 16, awaiting_profile: 13, completed: 8, rejected: 3, declined: 2 },
  { label: '2月W1', invited: 25, awaiting_profile: 20, completed: 14, rejected: 2, declined: 5 },
  { label: '2月W2', invited: 30, awaiting_profile: 24, completed: 17, rejected: 3, declined: 6 },
  { label: '2月W3', invited: 20, awaiting_profile: 16, completed: 12, rejected: 2, declined: 3 },
  { label: '2月W4', invited: 28, awaiting_profile: 22, completed: 15, rejected: 1, declined: 4 },
  { label: '3月W1', invited: 35, awaiting_profile: 28, completed: 19, rejected: 4, declined: 7 },
  { label: '3月W2', invited: 32, awaiting_profile: 26, completed: 18, rejected: 3, declined: 5 },
  { label: '3月W3', invited: 27, awaiting_profile: 21, completed: 16, rejected: 2, declined: 4 },
  { label: '3月W4', invited: 38, awaiting_profile: 30, completed: 22, rejected: 3, declined: 6 },
];

const PERIOD_TO_DATA: Record<'this_month' | 'last_3_months' | 'last_year', ChartDataPoint[]> = {
  this_month: monthlyData,
  last_3_months: quarterlyData,
  last_year: quarterlyData,
};

const SERIES_LABELS: Record<string, string> = {
  invited: '招待承諾待ち',
  awaiting_profile: '個人情報入力待ち',
  completed: '入会完了',
  rejected: '招待期限切れ',
  declined: '招待辞退',
};

interface FamilyRegistrationsChartProps {
  period: 'this_month' | 'last_3_months' | 'last_year';
}

export function FamilyRegistrationsChart({ period }: FamilyRegistrationsChartProps) {
  // const { data: summaryData } = useQuery(getCrmFamilyRegistrationsSummaryOptions());
  const { isLoading } = useQuery(getCrmFamilyRegistrationsDashboardOptions());

  if (isLoading) {
    return (
      <Card className="rounded-lg py-0 shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <div className="bg-muted h-4 w-40 animate-pulse rounded" />
              <div className="bg-muted/70 h-3 w-56 animate-pulse rounded" />
            </div>
          </div>
          <div className="h-[220px] w-full">
            <div className="bg-muted h-full w-full animate-pulse rounded-b" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartDataPoints = PERIOD_TO_DATA[period];

  return (
    <Card className="rounded-lg py-0 shadow-sm">
      <CardContent className="p-0">
        <div className="p-4">
          <p className="text-foreground text-sm font-semibold">家族入会の推移</p>
          <p className="text-muted-foreground text-xs">選択期間の集計</p>
        </div>

        <div className="h-[220px] w-full px-4 pt-2">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartDataPoints} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="inviteFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="pendingFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-4)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-chart-4)" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value, name) => [`${value} 件`, SERIES_LABELS[name as string] ?? name]}
              />

              <Area
                type="monotone"
                dataKey="invited"
                stroke="color-mix(in oklch, var(--color-chart-1) 70%, transparent)"
                fill="url(#inviteFill)"
                strokeWidth={2}
                dot={false}
                name="invited"
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="color-mix(in oklch, var(--color-chart-2) 70%, transparent)"
                fill="url(#regFill)"
                strokeWidth={2}
                dot={false}
                name="completed"
              />
              <Area
                type="monotone"
                dataKey="awaiting_profile"
                stroke="color-mix(in oklch, var(--color-chart-4) 70%, transparent)"
                fill="url(#pendingFill)"
                strokeWidth={2}
                dot={false}
                name="awaiting_profile"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* <div className="flex flex-wrap gap-4 border-t px-4 py-3">
          {[
            {
              label: '招待承諾待ち',
              value: dashboardData?.by_status?.awaiting_acceptance,
              className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
              valueClass: 'text-yellow-700',
            },
            {
              label: '個人情報入力待ち',
              value: summaryData?.by_status?.awaiting_profile,
              className: 'bg-orange-50 text-orange-700 border-orange-200',
              valueClass: 'text-orange-700',
            },
            {
              label: '入会完了',
              value: summaryData?.by_status?.completed,
              className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              valueClass: 'text-emerald-700',
            },
            {
              label: '招待辞退',
              value: summaryData?.by_status?.declined,
              className: 'bg-rose-50 text-rose-600 border-rose-200',
              valueClass: 'text-rose-600',
            },
            {
              label: '招待期限切れ',
              value: summaryData?.by_status?.expired,
              className: 'bg-muted text-muted-foreground border-border',
              valueClass: 'text-foreground',
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${item.className}`}
            >
              <span>{item.label}</span>
              <span className={`font-semibold ${item.valueClass}`}>{item.value ?? '—'}件</span>
            </div>
          ))}
        </div> */}
      </CardContent>
    </Card>
  );
}
