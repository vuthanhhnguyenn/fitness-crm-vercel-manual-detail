'use client';

import { Suspense, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { FilterResult } from '@/components/common/filter-result';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import {
  deleteCrmRoutinesByIdMutation,
  getCrmRoutineCategoriesOptions,
  getCrmRoutinesByIdQueryKey,
  getCrmRoutinesOptions,
  getCrmRoutinesQueryKey,
  patchCrmRoutinesByIdPublishStatusMutation,
  postCrmRoutinesByIdDuplicateMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { RoutineListItem } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { RoutineDeleteDialog } from './_components/routine-delete-dialog';
import { RoutineFilters } from './_components/routine-filters';
import { RoutineRowActions } from './_components/routine-row-actions';
import { getRoutineTableColumns } from './_components/routine-table-columns';
import {
  ROUTINE_PAGE_SIZE_OPTIONS,
  ROUTINE_PUBLISH_STATUS_LABELS,
} from './_constants/routine.constants';
import { useRoutineFilters } from './_hooks/use-routine-filters.hook';

function RoutinesPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoutineListItem | null>(null);

  const {
    filters,
    queryParams,
    searchInput,
    setSearchInput,
    setFilters,
    clearFilters,
    currentPage,
    setCurrentPage,
    setPageSize,
    pageSize,
    hasActiveFilters,
    activeFilterCount,
  } = useRoutineFilters();

  const sorting: SortingState = filters.rt_sort_by
    ? [{ id: filters.rt_sort_by, desc: filters.rt_sort_order === 'desc' }]
    : [];

  const { data, isLoading } = useQuery({
    ...getCrmRoutinesOptions({ query: queryParams }),
  });

  const { data: categoriesData } = useQuery({ ...getCrmRoutineCategoriesOptions() });
  const categories = categoriesData?.items ?? [];

  const invalidateList = () => {
    queryClient.invalidateQueries({ queryKey: getCrmRoutinesQueryKey() });
  };

  const publishMutation = useMutation({
    ...patchCrmRoutinesByIdPublishStatusMutation(),
    onSuccess: (result) => {
      toast.success(
        result.routine.publishStatus === 'published'
          ? `「${result.routine.name}」を公開にしました`
          : `「${result.routine.name}」を非公開にしました`,
      );
      invalidateList();
      queryClient.invalidateQueries({
        queryKey: getCrmRoutinesByIdQueryKey({ path: { id: result.routine.id } }),
      });
    },
    onError: (error) => {
      toast.error(error.error || 'ステータスの変更に失敗しました');
      invalidateList();
    },
  });

  const duplicateMutation = useMutation({
    ...postCrmRoutinesByIdDuplicateMutation(),
    onSuccess: (result) => {
      toast.success(`「${result.routine.name}」を作成しました`, {
        description: '公開ステータス: 非公開。複製先の編集画面に移動します',
      });
      invalidateList();
      router.push(navigate('/routines/[id]/edit', result.routine.id));
    },
    onError: (error) => toast.error(error.error || '複製に失敗しました'),
  });

  const deleteMutation = useMutation({
    ...deleteCrmRoutinesByIdMutation(),
    onSuccess: () => {
      toast.success('ルーティンを削除しました');
      setDeleteTarget(null);
      invalidateList();
    },
    onError: (error) => {
      toast.error(error.error || '削除に失敗しました');
      invalidateList();
    },
  });

  const items = data?.items ?? [];
  const total = data?.pagination.totalItems ?? 0;
  const totalAllItems = data?.pagination.totalAllItems ?? 0;
  const page = data?.pagination.page ?? currentPage;
  const limit = data?.pagination.limit ?? pageSize;

  const columns = getRoutineTableColumns((routine) => (
    <RoutineRowActions
      routine={routine}
      onEdit={() => router.push(navigate('/routines/[id]/edit', routine.id))}
      onDuplicate={() => duplicateMutation.mutate({ path: { id: routine.id } })}
      onTogglePublish={() =>
        publishMutation.mutate({
          path: { id: routine.id },
          body: {
            publishStatus: routine.publishStatus === 'published' ? 'unpublished' : 'published',
          },
        })
      }
      onDelete={() => setDeleteTarget(routine)}
    />
  ));

  return (
    <>
      <PageHeader
        title="ルーティン管理"
        badge={
          <Badge variant="outline" className="text-xs">
            {totalAllItems.toLocaleString()}件
          </Badge>
        }
        actions={
          <RoleGatedButton
            requiredPermission={Permission.RoutinesCreate}
            className="gap-1"
            denyTooltip="ルーティンの登録権限がありません"
            onClick={() => router.push(navigate('/routines/create'))}
          >
            <Plus className="size-4" />
            新規登録
          </RoleGatedButton>
        }
      />

      <div className="bg-background flex flex-1 flex-col px-6 py-4">
        {hasActiveFilters && (
          <FilterResult
            className="mb-4"
            totalCount={totalAllItems}
            filteredCount={total}
            filterSummary={[
              filters.rt_keyword ? `"${filters.rt_keyword}"` : '',
              filters.rt_category
                ? (categories.find((category) => category.id === filters.rt_category)?.name ??
                  filters.rt_category)
                : '',
              filters.rt_status ? ROUTINE_PUBLISH_STATUS_LABELS[filters.rt_status] : '',
            ]}
            onClear={clearFilters}
          />
        )}

        <Card className="gap-0 overflow-hidden rounded-xl border py-0">
          <div className="space-y-3 px-4 py-3">
            <RoutineFilters
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              isFilterOpen={isFilterOpen}
              setIsFilterOpen={setIsFilterOpen}
              activeFilterCount={activeFilterCount}
              categoryId={filters.rt_category}
              publishStatus={filters.rt_status}
              onCategoryChange={(categoryId) => setFilters({ rt_category: categoryId, rt_page: 1 })}
              onStatusChange={(status) => setFilters({ rt_status: status, rt_page: 1 })}
              onClearFilters={clearFilters}
            />
          </div>

          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading}
            variant="simple"
            className="rounded-none border-x-0 border-b-0"
            onRowClick={(row) => router.push(navigate('/routines/[id]', row.id))}
            emptyContent={
              <Empty
                variant={hasActiveFilters ? 'filtered' : 'empty'}
                entityLabel="ルーティン"
                onAction={hasActiveFilters ? clearFilters : undefined}
              />
            }
            tableOptions={{
              manualSorting: true,
              getRowId: (originalRow) => originalRow.id,
              onSortingChange: (updater) => {
                const next = typeof updater === 'function' ? updater(sorting) : updater;
                if (next.length === 0) {
                  setFilters({ rt_sort_by: null, rt_sort_order: null, rt_page: 1 });
                  return;
                }
                setFilters({
                  rt_sort_by: next[0]?.id as typeof filters.rt_sort_by,
                  rt_sort_order: next[0]?.desc ? 'desc' : 'asc',
                  rt_page: 1,
                });
              },
              state: { sorting },
            }}
          />

          {total > 0 && (
            <TablePaginationWithSize
              total={total}
              currentPage={page}
              pageSize={limit}
              pageSizeOptions={ROUTINE_PAGE_SIZE_OPTIONS}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </Card>
      </div>

      <RoutineDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        routineName={deleteTarget?.name ?? ''}
        isPublished={deleteTarget?.publishStatus === 'published'}
        isSubmitting={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate({ path: { id: deleteTarget.id } });
        }}
      />
    </>
  );
}

export default function RoutinesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RoutinesPageContent />
    </Suspense>
  );
}
