'use client';

import { Suspense, useState } from 'react';

import { downloadCsv } from '@/utils/csv.util';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronRight, FileDown } from 'lucide-react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  getCrmSurveysAnalyticsOptions,
  postCrmSurveysAnalyticsExportMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { SurveyAnalyticsFilters } from './_components/survey-analytics-filters';
import { SurveyAnalyticsKpiSummary } from './_components/survey-analytics-kpi-summary';
import { SurveyAnalyticsQuestionCards } from './_components/survey-analytics-question-cards';
import { SurveyAnalyticsFiltersProvider } from './_contexts/survey-analytics-filters-context';
import { useSurveyAnalyticsFilters } from './_hooks/use-survey-analytics-filters';

function SurveyAnalyticsPageContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filtersHook = useSurveyAnalyticsFilters();
  const { queryParams } = filtersHook;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmSurveysAnalyticsOptions({ query: queryParams }),
  });
  const exportMutation = useMutation({
    ...postCrmSurveysAnalyticsExportMutation(),
    onSuccess: (response) => {
      downloadCsv(response.csv, response.filename);
      toast.success(response.message || 'CSVを出力しました');
    },
    onError: (error) => {
      toast.error(error.error || 'CSV出力に失敗しました');
    },
  });

  return (
    <>
      <PageHeader
        breadcrumb={
          <div className="flex items-center gap-1">
            <BackLink label="アンケート管理" href={navigate('/surveys')} />
            <ChevronRight className="text-muted-foreground size-3" />
            <span className="text-muted-foreground text-xs">集計分析</span>
          </div>
        }
        title="アンケート集計分析"
        badge={<Badge variant="secondary">{data?.context.total_responses ?? 0}件</Badge>}
        actions={
          <Button
            variant="outline"
            className="gap-1"
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate({ body: queryParams })}
          >
            <FileDown className="size-4" />
            {exportMutation.isPending ? '出力中...' : 'CSV出力'}
          </Button>
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-6 pt-4">
        <SurveyAnalyticsFiltersProvider value={filtersHook}>
          <SurveyAnalyticsFilters
            isFilterOpen={isFilterOpen}
            onFilterOpenChange={setIsFilterOpen}
            surveyName={data?.context?.survey_name}
            totalResponses={data?.context?.total_responses}
          />
        </SurveyAnalyticsFiltersProvider>

        <DataStateBoundary
          isLoading={isLoading}
          isError={isError}
          isEmpty={!data?.questions?.length}
          onRetry={() => refetch()}
          emptyTitle="集計データが見つかりません"
          emptyDescription="表示できる集計データがありません。"
        >
          <div className="flex flex-col gap-4">
            {data?.kpis && <SurveyAnalyticsKpiSummary kpis={data.kpis} />}
            {data?.questions && <SurveyAnalyticsQuestionCards questions={data.questions} />}
          </div>
        </DataStateBoundary>
      </div>
    </>
  );
}

export default function SurveyAnalyticsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SurveyAnalyticsPageContent />
    </Suspense>
  );
}
