'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import { Database, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import {
  deleteCrmExercisesByIdMutation,
  getCrmExercisesOptions,
  getCrmExercisesQueryKey,
  postCrmExercisesByIdPublishStatusMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmExercisesResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission, UserRole } from '@/types/permission.type';

import { ExerciseDeleteDialogs } from './_components/exercise-delete-dialogs';
import { ExercisesFilters } from './_components/exercises-filters';
import { ExercisesTableColumns } from './_components/exercises-table-columns';
import { useExercisesFilters } from './_hooks/use-exercises-filters';

type ExerciseRow = NonNullable<GetCrmExercisesResponse>['items'][number];

function ExercisesPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteState, setDeleteState] = useState<{
    row: ExerciseRow | null;
    mode: 'blocked' | 'confirm' | null;
  }>({ row: null, mode: null });
  const filtersHook = useExercisesFilters();
  const { filters, setFilters, queryParams, currentPage, setCurrentPage, pageSize, setPageSize } =
    filtersHook;

  const { data, isLoading } = useQuery({
    ...getCrmExercisesOptions({
      query: queryParams,
    }),
  });
  const publishMutation = useMutation({
    ...postCrmExercisesByIdPublishStatusMutation(),
    onSuccess: (response) => {
      toast.success('ステータスを更新しました');
      if (response.incompleteStepWarning) {
        toast.warning('公開は完了しましたが、解説ステップに未入力があります');
      }
      void queryClient.invalidateQueries({ queryKey: getCrmExercisesQueryKey() });
    },
    onError: () => {
      toast.error('処理に失敗しました');
    },
  });

  const deleteMutation = useMutation({
    ...deleteCrmExercisesByIdMutation(),
    onSuccess: () => {
      toast.success('エクササイズを削除しました');
      void queryClient.invalidateQueries({ queryKey: getCrmExercisesQueryKey() });
      setDeleteState({ row: null, mode: null });
    },
    onError: () => {
      toast.error('処理に失敗しました');
    },
  });

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const total = pagination?.totalItems ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const sorting: SortingState = filters.sortBy
    ? [{ id: filters.sortBy, desc: filters.sortOrder === 'desc' }]
    : [];

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    if (next.length === 0) {
      setFilters({ sortBy: 'updatedAt', sortOrder: 'desc' });
      return;
    }
    setFilters({
      sortBy: next[0]!.id as typeof filters.sortBy,
      sortOrder: next[0]!.desc ? 'desc' : 'asc',
      page: 1,
    });
  };

  const columns = useMemo(
    () =>
      ExercisesTableColumns({
        onEdit: (id) => router.push(navigate('/exercises/[id]/edit', id)),
        onTogglePublish: (row) =>
          publishMutation.mutate({
            path: { id: row.id },
            body: { publishStatus: row.publishStatus === 'private' ? 'public' : 'private' },
          }),
        onDelete: (row) =>
          setDeleteState({
            row,
            mode: row.canDelete ? 'confirm' : 'blocked',
          }),
      }),
    [publishMutation, router],
  );

  return (
    <>
      <PageHeader
        title="エクササイズ管理"
        badge={
          <Badge variant="outline" className="text-xs">
            {total}件
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <RoleGatedButton
              allowedRoles={[UserRole.System, UserRole.Headquarter]}
              type="button"
              variant="outline"
              className="gap-1"
              denyTooltip="参照マスタ管理は本部のみアクセスできます"
              onClick={() => router.push(navigate('/exercise-master'))}
            >
              <Database className="size-4" />
              参照マスタ管理
            </RoleGatedButton>
            <RoleGatedButton
              requiredPermission={Permission.ExercisesCreate}
              onClick={() => router.push(navigate('/exercises/create'))}
            >
              <Plus className="size-4" />
              新規登録
            </RoleGatedButton>
          </div>
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-6 pt-4">
        <Card className="gap-3 overflow-hidden rounded-xl border p-0">
          <div className="p-3 pb-0">
            <ExercisesFilters
              filtersHook={filtersHook}
              isExpanded={isFilterOpen}
              onExpandedChange={setIsFilterOpen}
            />
          </div>

          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading}
            variant="simple"
            onRowClick={(row) => router.push(navigate('/exercises/[id]', row.id))}
            className="[&_thead_tr]:bg-muted/50 rounded-none border-x-0 border-b-0 text-xs [&_table]:text-xs [&_td]:text-xs [&_td]:leading-4 [&_th]:text-xs [&_th]:leading-4 [&_th]:font-semibold [&_thead_tr]:h-10"
            containerClassName={
              isFilterOpen ? 'max-h-[calc(100vh-330px)]' : 'max-h-[calc(100vh-286px)]'
            }
            tableOptions={{
              onSortingChange: handleSortingChange,
              manualSorting: true,
              state: {
                sorting,
              },
            }}
            emptyContent={
              <div className="text-muted-foreground flex h-24 items-center justify-center text-sm">
                登録されたエクササイズはありません
              </div>
            }
          />

          {total > 0 && (
            <TablePaginationWithSize
              currentPage={page}
              total={total}
              onPageChange={setCurrentPage}
              pageSize={limit}
              onPageSizeChange={setPageSize}
            />
          )}
        </Card>
      </div>

      <ExerciseDeleteDialogs
        mode={deleteState.mode}
        open={Boolean(deleteState.mode)}
        onOpenChange={(open) => {
          if (!open) setDeleteState({ row: null, mode: null });
        }}
        exerciseName={deleteState.row?.nameJa ?? ''}
        blockReason={deleteState.row?.deleteBlockReason}
        onConfirmDelete={() => {
          if (!deleteState.row) return;
          deleteMutation.mutate({ path: { id: deleteState.row.id } });
        }}
      />
    </>
  );
}

export default function ExercisesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ExercisesPageContent />
    </Suspense>
  );
}
