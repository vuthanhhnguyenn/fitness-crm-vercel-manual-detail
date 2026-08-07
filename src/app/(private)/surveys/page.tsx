'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { toast } from 'sonner';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import {
  deleteCrmSurveysByIdMutation,
  getCrmSurveysOptions,
  getCrmSurveysQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmSurveysResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { SurveyDeleteDialog } from './[id]/_components/survey-delete-dialog';
import { SurveyListHeaderActions } from './_components/survey-list-header-actions';
import { SurveysFilters } from './_components/surveys-filters';
import { SurveysTableColumns } from './_components/surveys-table-columns';
import { SurveysFiltersProvider } from './_contexts/surveys-filters-context';
import { useSurveysFilters } from './_hooks/use-surveys-filters';

type SurveyRow = GetCrmSurveysResponse['surveys'][number];

function SurveysPageContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SurveyRow | null>(null);
  const filtersHook = useSurveysFilters();
  const { filters, setFilters, queryParams, currentPage, setCurrentPage, pageSize, setPageSize } =
    filtersHook;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmSurveysOptions({ query: queryParams }),
  });

  const deleteMutation = useMutation({
    ...deleteCrmSurveysByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'アンケートを削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmSurveysQueryKey(), refetchType: 'all' });
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('アンケートの削除に失敗しました');
    },
  });

  const surveys = data?.surveys ?? [];
  const pagination = data?.pagination;
  const totalSurveys = pagination?.total ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const sorting: SortingState = filters.sort_by
    ? [{ id: filters.sort_by, desc: filters.sort_order === 'desc' }]
    : [];

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    if (next.length === 0) {
      setFilters({ sort_by: 'id', sort_order: 'asc' });
      return;
    }

    setFilters({
      sort_by: next[0].id as typeof filters.sort_by,
      sort_order: next[0].desc ? 'desc' : 'asc',
    });
  };

  const columns: ColumnDef<SurveyRow>[] = useMemo(
    () =>
      SurveysTableColumns({
        onEditClick: (id) => {
          router.push(navigate('/surveys/[id]/edit', id));
        },
        onDeleteClick: (survey) => {
          setDeleteTarget(survey);
        },
      }),
    [router],
  );

  return (
    <>
      <PageHeader
        title="アンケート管理"
        badge={<Badge variant="secondary">{totalSurveys}件</Badge>}
        actions={<SurveyListHeaderActions />}
      />

      <div className="flex flex-1 flex-col gap-4 p-6 pt-4">
        <Card className="gap-3 overflow-hidden rounded-xl border p-0">
          <div className="p-3 pb-0">
            <SurveysFiltersProvider value={filtersHook}>
              <SurveysFilters isFilterOpen={isFilterOpen} onFilterOpenChange={setIsFilterOpen} />
            </SurveysFiltersProvider>
          </div>

          {isError ? (
            <div className="flex min-h-80 items-center justify-center px-6 py-10">
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm font-medium">アンケート一覧の取得に失敗しました</p>
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
              data={surveys}
              isLoading={isLoading || deleteMutation.isPending}
              variant="simple"
              className="rounded-none border-x-0 border-b-0"
              containerClassName={
                isFilterOpen ? 'max-h-[calc(100vh-330px)]' : 'max-h-[calc(100vh-286px)]'
              }
              onRowClick={(row) => {
                if (deleteTarget) {
                  return;
                }
                router.push(navigate('/surveys/[id]', row.id));
              }}
              tableOptions={{
                onSortingChange: handleSortingChange,
                manualSorting: true,
                state: { sorting },
              }}
            />
          )}

          {totalSurveys > 0 && !isError && (
            <TablePaginationWithSize
              currentPage={page}
              total={totalSurveys}
              pageSize={limit}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </Card>
      </div>

      {deleteTarget && (
        <SurveyDeleteDialog
          surveyName={deleteTarget.name}
          open={Boolean(deleteTarget)}
          isPending={deleteMutation.isPending}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteTarget(null);
            }
          }}
          onConfirm={() => {
            deleteMutation.mutate({ path: { id: deleteTarget.id } });
          }}
        />
      )}
    </>
  );
}

export default function SurveysPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SurveysPageContent />
    </Suspense>
  );
}
