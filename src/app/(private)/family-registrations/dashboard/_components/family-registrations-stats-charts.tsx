'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmFamilyRegistrationsDashboardOptions } from '@/lib/api/@tanstack/react-query.gen';

type Period = 'this_month' | 'last_3_months' | 'last_year';

// ── カラーパレット (theme chart variables, 70% intensity) ────
const COLORS = [
  'color-mix(in oklch, var(--color-chart-1) 70%, transparent)',
  'color-mix(in oklch, var(--color-chart-2) 70%, transparent)',
  'color-mix(in oklch, var(--color-chart-3) 70%, transparent)',
  'color-mix(in oklch, var(--color-chart-4) 70%, transparent)',
  'color-mix(in oklch, var(--color-chart-5) 70%, transparent)',
  'color-mix(in oklch, var(--color-chart-3) 50%, var(--color-chart-5))',
];

// ── Skeleton ─────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <Card className="rounded-lg py-0 shadow-sm">
      <CardHeader className="px-4 pt-4 pb-2">
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Skeleton className="h-[200px] w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────
function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background rounded-md border px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill ?? p.color }}>
          {p.name ?? p.dataKey}: <span className="font-semibold">{p.value}</span>
          {p.unit ?? ''}
        </p>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-background rounded-md border px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{name}</p>
      <p className="text-muted-foreground">{value}件</p>
    </div>
  );
}

// ── Custom Legend ─────────────────────────────────────────────
function renderCustomLegend(props: any) {
  const { payload } = props;
  return (
    <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
      {payload.map((entry: any, i: number) => (
        <li key={i} className="flex items-center gap-1.5 text-xs">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

// ── Props ─────────────────────────────────────────────────────
interface FamilyRegistrationsStatsChartsProps {
  period: Period;
}

export function FamilyRegistrationsStatsCharts({ period }: FamilyRegistrationsStatsChartsProps) {
  const { isLoading, data } = useQuery(
    getCrmFamilyRegistrationsDashboardOptions({ query: { period } }),
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <ChartSkeleton key={i} />
        ))}
      </div>
    );
  }

  // const monthlyTrend = data?.monthly_trend ?? [];
  const byMemberType = data?.by_member_type ?? [];
  const familySizeDist = data?.family_size_distribution ?? [];
  const byRelationship = data?.by_relationship ?? [];
  const avgUsage = data?.avg_usage_comparison;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* ── ① 家族会員入会数の推移（月次）─────────────────────── */}
      {/* <Card className="rounded-lg py-0 shadow-sm">
        <CardHeader className="px-4 pb-2 pt-4">
          <CardTitle className="text-sm font-semibold">家族会員入会数の推移（月次）</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {monthlyTrend.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">データがありません</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={monthlyTrend}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                barSize={18}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v: string) => v.slice(5)} // show MM only
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar
                  dataKey="count"
                  name="入会件数"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card> */}

      {/* ── ② 主会員種別別の家族会員比率 ──────────────────────── */}
      <Card className="gap-0 rounded-lg py-0 shadow-sm">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm font-semibold">主会員種別別の家族会員比率</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {byMemberType.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">データがありません</p>
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <PieChart>
                <Pie
                  data={byMemberType}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="45%"
                  outerRadius={72}
                  innerRadius={36}
                  paddingAngle={2}
                  label={({ cx, cy, midAngle, outerRadius: or, percent }) => {
                    if (percent == null || percent < 0.05) return null;
                    const safeMidAngle = midAngle ?? 0;
                    const RAD = Math.PI / 180;
                    const x = cx + (or + 14) * Math.cos(-safeMidAngle * RAD);
                    const y = cy + (or + 14) * Math.sin(-safeMidAngle * RAD);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="hsl(var(--foreground))"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={10}
                      >
                        {`${Math.round(percent * 100)}%`}
                      </text>
                    );
                  }}
                >
                  {byMemberType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend content={renderCustomLegend} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── ③ 家族会員数の分布（1名 / 2名 / 3名以上）─────────── */}
      <Card className="rounded-lg py-0 shadow-sm">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm font-semibold">
            家族会員数の分布（1名・2名・3名以上）
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {familySizeDist.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">データがありません</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={familySizeDist}
                layout="vertical"
                margin={{ top: 4, right: 32, left: 8, bottom: 0 }}
                barSize={22}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                  width={52}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="count" name="主会員数" radius={[0, 4, 4, 0]}>
                  {familySizeDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── ④ 関係性別の内訳（配偶者・子供・親など）─────────── */}
      <Card className="gap-0 rounded-lg py-0 shadow-sm">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm font-semibold">
            関係性別の内訳（配偶者・子供・親など）
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {byRelationship.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">データがありません</p>
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <PieChart>
                <Pie
                  data={byRelationship}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="45%"
                  outerRadius={72}
                  paddingAngle={2}
                  label={({ cx, cy, midAngle, outerRadius: or, percent }) => {
                    if (percent == null || percent < 0.05) return null;
                    const safeMidAngle = midAngle ?? 0;
                    const RAD = Math.PI / 180;
                    const x = cx + (or + 14) * Math.cos(-safeMidAngle * RAD);
                    const y = cy + (or + 14) * Math.sin(-safeMidAngle * RAD);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="hsl(var(--foreground))"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={10}
                      >
                        {`${Math.round(percent * 100)}%`}
                      </text>
                    );
                  }}
                >
                  {byRelationship.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend content={renderCustomLegend} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      {/* 平均利用回数比較 */}
      <Card className="gap-0 rounded-lg py-0 shadow-sm">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BarChart2 className="size-4" />
            家族会員の平均利用回数（通常会員との比較）
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-2 rounded-md border p-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {[
                {
                  label: '家族会員',
                  value: avgUsage?.family_member ?? 0,
                  color: 'color-mix(in oklch, var(--color-chart-1) 70%, transparent)',
                },
                {
                  label: '通常会員',
                  value: avgUsage?.regular_member ?? 0,
                  color: 'color-mix(in oklch, var(--color-chart-2) 70%, transparent)',
                },
              ].map((item) => {
                const max = Math.max(
                  avgUsage?.family_member ?? 0,
                  avgUsage?.regular_member ?? 0,
                  1,
                );
                const pct = Math.round((item.value / max) * 100);
                return (
                  <div key={item.label} className="space-y-2 rounded-md border p-4">
                    <p className="text-muted-foreground text-xs">{item.label}</p>
                    <p className="text-2xl font-semibold" style={{ color: item.color }}>
                      {item.value}
                      <span className="text-muted-foreground ml-1 text-sm font-normal">回/月</span>
                    </p>
                    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
