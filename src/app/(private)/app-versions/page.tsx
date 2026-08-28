'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import {
  deleteCrmAppVersionsByIdMutation,
  getCrmAppVersionsOptions,
  getCrmAppVersionsQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import type { AppVersionRecord } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { AppVersionDeleteDialog } from './_components/app-version-delete-dialog';
import { AppVersionFilters } from './_components/app-version-filters';
import { AppVersionTableColumns } from './_components/app-version-table-columns';
import { useAppVersionsFilters } from './_hooks/use-app-versions-filters';

function AppVersionsPageContent() {
  const [deleteTarget, setDeleteTarget] = useState<AppVersionRecord | null>(null);
  const filtersHook = useAppVersionsFilters();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    ...getCrmAppVersionsOptions({ query: filtersHook.queryParams }),
  });

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalFilteredItems = pagination?.totalItems ?? 0;
  const totalAllItems = data?.totalAllItems ?? 0;
  const page = pagination?.page ?? filtersHook.currentPage;
  const limit = pagination?.limit ?? filtersHook.pageSize;

  const deleteMutation = useMutation({
    ...deleteCrmAppVersionsByIdMutation(),
    onSuccess: () => {
      toast.success('アプリバージョンを削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmAppVersionsQueryKey() });
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('アプリバージョンの削除に失敗しました');
    },
  });

  const columns: ColumnDef<AppVersionRecord>[] = useMemo(
    () =>
      AppVersionTableColumns({
        onEditClick: (id) => {
          router.push(navigate('/app-versions/[id]/edit', id));
        },
        onDeleteClick: (item) => {
          setDeleteTarget(item);
        },
      }),
    [router],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="アプリ配信バージョン管理"
        badge={
          <Badge
            variant="outline"
            className="text-muted-foreground text-xs font-normal tabular-nums"
          >
            {totalAllItems.toLocaleString()}件
          </Badge>
        }
        actions={
          <RoleGatedButton
            requiredPermission={Permission.AppVersionsCreate}
            type="button"
            className="gap-1"
            denyTooltip="本部権限が必要です"
            onClick={() => router.push(navigate('/app-versions/create'))}
          >
            <Plus className="size-4" />
            新規登録
          </RoleGatedButton>
        }
      />

      <div className="bg-background flex min-h-0 flex-1 flex-col gap-4 px-6 py-4">
        <Card className="flex min-h-0 flex-col gap-0 rounded-xl border p-0">
          <AppVersionFilters filtersHook={filtersHook} />

          <DataTable
            isLoading={isLoading}
            tableSize="md"
            columns={columns}
            data={items}
            variant="simple"
            className="h-full min-h-0 flex-1 rounded-none border-x-0 border-b-0"
            containerClassName="h-full"
            onRowClick={(item) => router.push(navigate('/app-versions/[id]', item.id))}
            emptyContent={
              <Empty
                variant={filtersHook.hasActiveFilters ? 'filtered' : 'empty'}
                entityLabel="カテゴリ"
                onAction={filtersHook.hasActiveFilters ? filtersHook.clearFilters : undefined}
              />
            }
          />

          {totalFilteredItems > 0 && !isError && (
            <TablePaginationWithSize
              currentPage={page}
              total={totalFilteredItems}
              pageSize={limit}
              onPageChange={filtersHook.setCurrentPage}
              onPageSizeChange={filtersHook.setPageSize}
              pageSizeOptions={[20, 50, 100]}
            />
          )}
        </Card>
      </div>

      <AppVersionDeleteDialog
        item={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate({ path: { id: deleteTarget.id } });
          }
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

export default function AppVersionsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AppVersionsPageContent />
    </Suspense>
  );
}
