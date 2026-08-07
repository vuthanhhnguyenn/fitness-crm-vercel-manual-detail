import { Card, CardContent } from '@/components/ui/card';

import type { GetCrmSurveysAnalyticsResponse } from '@/lib/api/types.gen';

interface SurveyAnalyticsKpiSummaryProps {
  kpis: GetCrmSurveysAnalyticsResponse['kpis'];
}

export function SurveyAnalyticsKpiSummary({ kpis }: SurveyAnalyticsKpiSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-muted-foreground mb-1 text-xs">総回答数</p>
          <p className="text-xl font-bold whitespace-nowrap">
            {kpis.total_responses.toLocaleString()}件
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-muted-foreground mb-1 text-xs">回答率</p>
          <p className="text-xl font-bold whitespace-nowrap">{kpis.response_rate.toFixed(1)}%</p>
        </CardContent>
      </Card>
    </div>
  );
}
