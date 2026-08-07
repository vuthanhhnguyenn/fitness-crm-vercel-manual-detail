'use client';

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Download, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmFamilyRegistrationsSummaryOptions } from '@/lib/api/@tanstack/react-query.gen';

// ─── Types ───────────────────────────────────────────────────────────────────

type Period = 'this_month' | 'this_week' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  this_month: '今月',
  this_week: '今週',
  all: '全期間',
};

// ─── Sub-component: KPI Card ──────────────────────────────────────────────────

function KpiCard({ label, value, subLabel }: { label: string; value: string; subLabel?: string }) {
  return (
    <Card className="rounded-lg py-0 shadow-sm">
      <CardContent className="p-4">
        <p className="text-foreground text-sm">{label}</p>
        <p className="text-foreground mt-2 text-2xl font-semibold">{value}</p>
        {subLabel && <p className="text-muted-foreground mt-1 text-xs">{subLabel}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Sub-component: Loading Skeleton ─────────────────────────────────────────

function SummarySkeleton() {
  return (
    <div className="space-y-4">
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-lg py-0 shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-7 w-16" />
              <Skeleton className="mt-1 h-2 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 親会員別統計 skeleton */}
      <Card className="gap-0 rounded-lg py-0 shadow-sm">
        <CardHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-36 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-x-4">
            {[0, 1].map((col) => (
              <div key={col} className="overflow-hidden rounded-md border">
                <div className="divide-y">
                  {[1, 2, 3, 4, 5].map((row) => (
                    <div
                      key={row}
                      className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-x-3 px-3 py-2.5"
                    >
                      <Skeleton className="size-5 rounded-full" />
                      <Skeleton className="h-3 w-full max-w-[120px]" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const FamilyRegistrationsSummary = () => {
  const [period, setPeriod] = useState<Period>('this_month');

  const { isLoading, data: summaryData } = useQuery(
    getCrmFamilyRegistrationsSummaryOptions({ query: { period } }),
  );

  const periodLabel = PERIOD_LABELS[period];

  return (
    <div className="space-y-4">
      {/* ── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-base font-semibold">家族入会サマリ</h2>
          <p className="text-muted-foreground text-xs">期間別の申請状況を確認できます</p>
        </div>
        <Button variant="outline" size="default" className="gap-2">
          <Download className="size-4" />
          エクスポート
        </Button>
      </div>

      {/* ── 期間切替タブ ── */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="w-fit">
        <TabsList className="h-8">
          {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
            <TabsTrigger key={key} value={key} className="px-3 text-xs">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <SummarySkeleton />
      ) : (
        <>
          {/* ── 今月のサマリ KPI ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="総招待数"
              value={`${(summaryData?.total_invites ?? 0).toLocaleString()}件`}
              subLabel={`${periodLabel}の総招待数`}
            />
            <KpiCard
              label="総入会件数"
              value={`${(summaryData?.total_completed ?? 0).toLocaleString()}件`}
              subLabel="家族会員のみ"
            />
            <KpiCard
              label="家族会員比率"
              value={`${((summaryData?.family_member_ratio ?? 0) * 100).toFixed(1)}%`}
              subLabel="全会員に占める割合"
            />
            <KpiCard
              label="招待承諾率"
              value={`${((summaryData?.acceptance_rate ?? 0) * 100).toFixed(1)}%`}
              subLabel={`${periodLabel}の承諾率`}
            />
          </div>

          {/* ── 親会員別統計 ── */}
          <Card className="gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="size-4" />
                  親会員別統計
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  子会員の平均人数：
                  <span className="ml-1 font-semibold">
                    {summaryData?.avg_children_per_primary ?? 0}人
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {(summaryData?.top_primary_members?.length ?? 0) === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">データがありません</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4">
                  {[
                    summaryData!.top_primary_members.slice(
                      0,
                      Math.ceil(summaryData!.top_primary_members.length / 2),
                    ),
                    summaryData!.top_primary_members.slice(
                      Math.ceil(summaryData!.top_primary_members.length / 2),
                    ),
                  ].map((columnMembers, colIndex) => (
                    <div key={colIndex} className="overflow-hidden rounded-md border">
                      <div className="divide-y">
                        {columnMembers.map((member, rowIndex) => {
                          const index =
                            colIndex * Math.ceil(summaryData!.top_primary_members.length / 2) +
                            rowIndex;
                          return (
                            <div
                              key={member.primary_member_id}
                              className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-x-3 px-3 py-2.5"
                            >
                              <span
                                className={`inline-flex size-5 items-center justify-center rounded-full text-xs font-bold ${
                                  index === 0
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : index === 1
                                      ? 'bg-gray-100 text-gray-600'
                                      : index === 2
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {index + 1}
                              </span>
                              <span className="truncate text-sm">{member.primary_member_name}</span>
                              <span className="text-foreground shrink-0 text-sm font-semibold">
                                {member.family_count}人
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
