'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmFamilyRegistrationsDashboardOptions } from '@/lib/api/@tanstack/react-query.gen';

type Period = 'this_month' | 'last_3_months' | 'last_year';

const PERIOD_KPI: Record<
  Period,
  {
    completedTrend: number;
    familyRatioTrend: number;
    avgChildrenTrend: number;
    autoApprovalTrend: number;
    periodLabel: string;
    periodDesc: string;
  }
> = {
  this_month: {
    completedTrend: 8.3,
    familyRatioTrend: 5.8,
    avgChildrenTrend: 2.1,
    autoApprovalTrend: 1.9,
    periodLabel: '前月比',
    periodDesc: '今月',
  },
  last_3_months: {
    completedTrend: 22.1,
    familyRatioTrend: -2.3,
    avgChildrenTrend: 4.5,
    autoApprovalTrend: -1.5,
    periodLabel: '前四半期比',
    periodDesc: '過去3ヶ月',
  },
  last_year: {
    completedTrend: 35.4,
    familyRatioTrend: 12.1,
    avgChildrenTrend: 6.8,
    autoApprovalTrend: 3.2,
    periodLabel: '前年比',
    periodDesc: '過去1年',
  },
};

function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${positive ? 'text-emerald-600' : 'text-rose-600'}`}
    >
      {positive ? <ArrowUpRight className="size-3" /> : <TrendingDown className="size-3" />}
      {positive ? '+' : ''}
      {value}%
    </span>
  );
}

function TrendFooter({
  value,
  periodDesc,
  positiveText,
  negativeText,
  periodLabel,
}: {
  value: number;
  periodDesc: string;
  positiveText: string;
  negativeText: string;
  periodLabel: string;
}) {
  const positive = value >= 0;
  return (
    <>
      <p
        className={`mt-3 inline-flex items-center gap-1 text-sm font-medium ${positive ? 'text-emerald-700' : 'text-rose-700'}`}
      >
        {positive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
        {periodDesc}は{positive ? positiveText : negativeText}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">{periodLabel}</p>
    </>
  );
}

function KpiCardSkeleton() {
  return (
    <Card className="rounded-lg py-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>
        <Skeleton className="mt-2 h-8 w-20" />
        <Skeleton className="mt-3 h-4 w-32" />
        <Skeleton className="mt-1 h-3 w-16" />
      </CardContent>
    </Card>
  );
}

interface FamilyRegistrationsDashboardKpiCardsProps {
  period: Period;
}

export function FamilyRegistrationsDashboardKpiCards({
  period,
}: FamilyRegistrationsDashboardKpiCardsProps) {
  const { isLoading, data } = useQuery(
    getCrmFamilyRegistrationsDashboardOptions({ query: { period } }),
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 px-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const kpi = PERIOD_KPI[period];
  const monthCompleted = data?.month_completed ?? 0;
  const familyMemberRatio = Math.round((data?.family_member_ratio ?? 0) * 1000) / 10;
  const avgChildrenPerPrimary = data?.avg_children_per_primary ?? 0;
  const autoApprovalRate = Math.round((data?.auto_approval_rate ?? 0) * 1000) / 10;

  return (
    <div className="grid gap-4 px-4 sm:grid-cols-4">
      {/* 家族会員入会件数 */}
      <Card className="rounded-lg py-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm">家族会員入会件数</p>
            <TrendBadge value={kpi.completedTrend} />
          </div>
          <p className="text-foreground mt-2 text-2xl font-semibold">
            {monthCompleted.toLocaleString()}件
          </p>
          <TrendFooter
            value={kpi.completedTrend}
            periodDesc={kpi.periodDesc}
            positiveText="上昇傾向"
            negativeText="下降傾向"
            periodLabel={kpi.periodLabel}
          />
        </CardContent>
      </Card>

      {/* 家族会員比率 */}
      <Card className="rounded-lg py-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm">家族会員比率</p>
            <TrendBadge value={kpi.familyRatioTrend} />
          </div>
          <p className="text-foreground mt-2 text-2xl font-semibold">{familyMemberRatio}%</p>
          <TrendFooter
            value={kpi.familyRatioTrend}
            periodDesc={kpi.periodDesc}
            positiveText="招待反応は良好"
            negativeText="比率が低下中"
            periodLabel={kpi.periodLabel}
          />
        </CardContent>
      </Card>

      {/* 家族会員の平均人数 */}
      <Card className="rounded-lg py-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm">家族会員の平均人数</p>
            <TrendBadge value={kpi.avgChildrenTrend} />
          </div>
          <p className="text-foreground mt-2 text-2xl font-semibold">{avgChildrenPerPrimary}人</p>
          <TrendFooter
            value={kpi.avgChildrenTrend}
            periodDesc={kpi.periodDesc}
            positiveText="増加中"
            negativeText="減少中"
            periodLabel={kpi.periodLabel}
          />
        </CardContent>
      </Card>

      {/* 自動承認率 */}
      <Card className="rounded-lg py-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm">自動承認率</p>
            <TrendBadge value={kpi.autoApprovalTrend} />
          </div>
          <p className="text-foreground mt-2 text-2xl font-semibold">{autoApprovalRate}%</p>
          <TrendFooter
            value={kpi.autoApprovalTrend}
            periodDesc={kpi.periodDesc}
            positiveText="承認率は安定"
            negativeText="承認率が低下中"
            periodLabel={kpi.periodLabel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
