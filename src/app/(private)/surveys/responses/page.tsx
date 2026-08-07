'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { downloadCsv } from '@/utils/csv.util';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import {
  getCrmSurveysResponsesOptions,
  postCrmSurveysResponsesExportMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmSurveysResponsesResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { SurveyResponsesFilters } from './_components/survey-responses-filters';
import { SurveyResponsesTableColumns } from './_components/survey-responses-table-columns';
import { SurveyResponsesFiltersProvider } from './_contexts/survey-responses-filters-context';
import { useSurveyResponsesFilters } from './_hooks/use-survey-responses-filters';

type SurveyResponseRow = GetCrmSurveysResponsesResponse['responses'][number];

function SurveyResponsesPageContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filtersHook = useSurveyResponsesFilters();
  const { queryParams, currentPage, setCurrentPage, pageSize, setPageSize } = filtersHook;
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmSurveysResponsesOptions({ query: queryParams }),
  });

  const responses = data?.responses ?? [];
  const pagination = data?.pagination;
  const totalResponses = pagination?.total ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const columns: ColumnDef<SurveyResponseRow>[] = useMemo(() => SurveyResponsesTableColumns(), []);
  const exportMutation = useMutation({
    ...postCrmSurveysResponsesExportMutation(),
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
        breadcrumb={<BackLink label="アンケート管理に戻る" href={navigate('/surveys')} />}
        title="回答データ一覧"
        badge={<Badge variant="secondary">{totalResponses}件</Badge>}
        subtitle={
          queryParams.survey_id ? `選択中アンケートID: ${queryParams.survey_id}` : undefined
        }
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
        <Card className="gap-3 overflow-hidden rounded-xl border p-0">
          <div className="p-3 pb-0">
            <SurveyResponsesFiltersProvider value={filtersHook}>
              <SurveyResponsesFilters
                isFilterOpen={isFilterOpen}
                onFilterOpenChange={setIsFilterOpen}
              />
            </SurveyResponsesFiltersProvider>
          </div>

          {isError ? (
            <div className="flex min-h-80 items-center justify-center px-6 py-10">
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm font-medium">回答データの取得に失敗しました</p>
                <button
                  type="button"
                  className="text-primary text-sm underline-offset-4 hover:underline"
                  onClick={() => refetch()}
                >
                  再試行
                </button>
              </div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={responses}
              isLoading={isLoading}
              variant="simple"
              className="rounded-none border-x-0 border-b-0"
              containerClassName={
                isFilterOpen ? 'max-h-[calc(100vh-330px)]' : 'max-h-[calc(100vh-286px)]'
              }
              onRowClick={(row) => {
                router.push(navigate('/surveys/responses/[responseId]', row.id, queryParams));
              }}
            />
          )}

          {totalResponses > 0 && !isError && (
            <TablePaginationWithSize
              currentPage={page}
              total={totalResponses}
              pageSize={limit}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </Card>
      </div>
    </>
  );
}

export default function SurveyResponsesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SurveyResponsesPageContent />
    </Suspense>
  );
}
