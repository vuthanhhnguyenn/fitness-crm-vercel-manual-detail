'use client';

// Client page: nuqs URL filters, React Query data, row selection & action menus
// make the whole list interactive (same justification as the sibling list screens).
import { Suspense, useState } from 'react';

import { useRouter } from 'next/navigation';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';

import {
  deleteCrmPositionsByIdMutation,
  getCrmPositionsOptions,
  getCrmPositionsQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import type { PositionListItem } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

import { PermissionPreviewPanel } from './_components/permission-preview-panel';
import { PositionDeleteDialog } from './_components/position-delete-dialog';
import {
  PositionPermissionFilter,
  findPermissionLabel,
} from './_components/position-permission-filter';
import { PositionRowActions } from './_components/position-row-actions';
import { PositionTableHeaderRow, PositionTableRow } from './_components/position-table-columns';
import { POSITION_PAGE_SIZE_OPTIONS } from './_constants/position.constants';
import { usePositionFilters } from './_hooks/use-position-filters.hook';

function PositionsPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<PositionListItem | null>(null);

  const {
    filters,
    queryParams,
    searchInput,
    setSearchInput,
    clearFilters,
    currentPage,
    setCurrentPage,
    setPageSize,
    pageSize,
    permission,
    setPermission,
    selectedPositionId,
    setSelectedPositionId,
    hasActiveConditions,
  } = usePositionFilters();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    ...getCrmPositionsOptions({ query: queryParams }),
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const filteredTotal = data?.pagination.totalItems ?? 0;
  const totalAll = data?.pagination.totalAllItems ?? 0;
  const headerCount = hasActiveConditions ? filteredTotal : totalAll;

  const deleteMutation = useMutation({
    ...deleteCrmPositionsByIdMutation(),
    onSuccess: (_result, variables) => {
      toast.success('職位を削除しました');
      // 削除した職位が選択中ならプレビューをプレースホルダーへ戻す (FR-014)
      if (variables.path.id === selectedPositionId) {
        setSelectedPositionId(null);
      }
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: getCrmPositionsQueryKey() });
    },
    onError: (error) => {
      toast.error(error.error || '職位の削除に失敗しました');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: getCrmPositionsQueryKey() });
    },
  });

  const goToEdit = (id: number) => router.push(navigate('/positions/[id]/edit', id));
  const goToClone = (id: number) => router.push(navigate('/positions/create', { cloneFrom: id }));

  return (
    <>
      <PageHeader
        title="職位マスター管理"
        badge={
          <Badge variant="outline" className="text-xs">
            {headerCount}件
          </Badge>
        }
        actions={
          <RoleGatedButton
            requiredPermission={Permission.PositionsCreate}
            className="gap-1"
            denyTooltip="職位の追加権限がありません"
            onClick={() => router.push(navigate('/positions/create'))}
          >
            <Plus className="size-4" />
            職位を追加
          </RoleGatedButton>
        }
      />

      <div className="bg-background flex-1 px-6 py-4">
        {/* 2-Pane Layout (PAR038) */}
        <div className="grid grid-cols-[1fr_400px] items-start gap-4">
          {/* Left Pane: Position List */}
          <Card className="gap-0 py-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              <div className="relative max-w-[360px] flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  placeholder="職位名で検索..."
                  className="pl-9 text-xs"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>
              <PositionPermissionFilter selectedKey={permission} onSelect={setPermission} />
            </div>

            <FilterResultBanner
              show={hasActiveConditions}
              totalCount={totalAll}
              filteredCount={filteredTotal}
              filterSummary={[
                permission ? `権限「${findPermissionLabel(permission)}」を持つ職位` : '',
                filters.search ? `"${filters.search}"` : '',
              ]}
              onClear={clearFilters}
            />

            <div
              className={cn(
                'overflow-x-auto transition-opacity',
                isFetching && !isLoading && 'opacity-50',
              )}
            >
              <Table>
                <TableHeader>
                  <PositionTableHeaderRow />
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    // 行シェイプに合わせたスケルトン（スピナー単体は不可 — code-rule II）
                    Array.from({ length: 5 }, (_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-2.5 w-48" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-3 w-10" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-3 w-8" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="size-8" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && isError && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        <div className="flex flex-col items-center gap-3 py-10">
                          <p className="text-muted-foreground text-sm">職位の取得に失敗しました</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => void refetch()}
                          >
                            再試行
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !isError && items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        <Empty
                          variant={hasActiveConditions ? 'filtered' : 'empty'}
                          entityLabel="職位"
                          onAction={hasActiveConditions ? clearFilters : undefined}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading &&
                    !isError &&
                    items.map((position) => (
                      <PositionTableRow
                        key={position.id}
                        position={position}
                        isSelected={selectedPositionId === position.id}
                        onToggleSelect={() =>
                          setSelectedPositionId(
                            selectedPositionId === position.id ? null : position.id,
                          )
                        }
                        onSelect={() => setSelectedPositionId(position.id)}
                        actions={
                          <PositionRowActions
                            position={position}
                            onEdit={() => goToEdit(position.id)}
                            onClone={() => goToClone(position.id)}
                            onDelete={() => setDeleteTarget(position)}
                          />
                        }
                      />
                    ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            <TablePaginationWithSize
              total={filteredTotal}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={POSITION_PAGE_SIZE_OPTIONS}
            />
          </Card>

          {/* Right Pane: Permission Preview */}
          <div className="sticky top-0">
            <PermissionPreviewPanel positionId={selectedPositionId} onEdit={goToEdit} />
          </div>
        </div>
      </div>

      <PositionDeleteDialog
        position={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate({ path: { id: deleteTarget.id } });
        }}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}

export default function PositionsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PositionsPageContent />
    </Suspense>
  );
}
