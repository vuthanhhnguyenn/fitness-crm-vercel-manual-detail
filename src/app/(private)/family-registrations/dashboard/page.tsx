'use client';

import { useState } from 'react';

import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { navigate } from '@/lib/routes/routes.util';

import { FamilyRegistrationsChart } from './_components/family-registrations-chart';
import { FamilyRegistrationsDashboardHeader } from './_components/family-registrations-dashboard-header';
import { FamilyRegistrationsDashboardKpiCards } from './_components/family-registrations-dashboard-kpi-cards';
import { FamilyRegistrationsPrimaryAnalysis } from './_components/family-registrations-primary-analysis';
import { FamilyRegistrationsStatsCharts } from './_components/family-registrations-stats-charts';

type Period = 'this_month' | 'last_3_months' | 'last_year';

const PERIOD_LABELS: Record<Period, string> = {
  this_month: '今月',
  last_3_months: '過去3ヶ月',
  last_year: '過去1年',
};

const BREADCRUMB_ITEMS = [
  { url: navigate('/family-registrations'), label: '家族入会' },
  { label: 'ダッシュボード' },
] as const;

export default function FamilyRegistrationsDashboardPage() {
  const [period, setPeriod] = useState<Period>('this_month');

  return (
    <div className="flex flex-1 flex-col">
      <FamilyRegistrationsDashboardHeader breadcrumbItems={BREADCRUMB_ITEMS} />

      {/* 期間切替タブ */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="h-8">
            {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="px-3 text-xs">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button variant="outline" size="default" className="gap-2">
          <Download className="size-4" />
          エクスポート
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-auto">
        {/* サマリカード */}
        <div className="border-b py-4">
          <FamilyRegistrationsDashboardKpiCards period={period} />
        </div>

        {/* グラフ */}
        <div className="bg-muted/30 space-y-4 border-b p-4">
          <FamilyRegistrationsChart period={period} />
        </div>
        {/* 統計グラフ */}
        <div className="bg-muted/30 space-y-4 border-b p-4">
          <FamilyRegistrationsStatsCharts period={period} />
        </div>

        {/* 主会員分析 */}
        <div className="py-4">
          <FamilyRegistrationsPrimaryAnalysis period={period} />
        </div>
      </div>
    </div>
  );
}
