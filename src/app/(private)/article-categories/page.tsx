'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { BRAND_LABELS } from '@/app/(private)/brands/_constants/brand.constants';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { Empty } from '@/components/common/data-state-boundary/empty';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import {
  deleteCrmArticleCategoriesByIdMutation,
  getCrmArticleCategoriesOptions,
  getCrmArticleCategoriesQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { ArticleCategoryItemResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { UserRole } from '@/types/permission.type';

import { ArticleCategoryDeleteAction } from './_components/article-category-delete-action';
import { ArticleCategoryFilters } from './_components/article-category-filters';
import { ArticleCategoryTableColumns } from './_components/article-category-table-columns';
import {
  ARTICLE_CATEGORY_TYPE_LABELS,
  PUBLISH_STATUS_LABELS,
} from './_constants/article-category.constants';
import { useArticleCategoryFilters } from './_hooks/use-article-category-filters';

function ArticleCategoriesPageContent() {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ArticleCategoryItemResponse | null>(null);

  const filtersHook = useArticleCategoryFilters();
  const {
    filters,
    setFilters,
    hasActiveFilters,
    clearFilters,
    queryParams,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
  } = filtersHook;
  const filterSummary = [
    filters.query ? `"${filters.query}"` : '',
    filters.type ? ARTICLE_CATEGORY_TYPE_LABELS[filters.type] : '',
    filters.brandEnum ? BRAND_LABELS[filters.brandEnum] : '',
    filters.isPublic === undefined
      ? ''
      : PUBLISH_STATUS_LABELS[String(filters.isPublic) as 'true' | 'false'],
  ];

  const { data, isLoading, isError, isFetching } = useQuery({
    ...getCrmArticleCategoriesOptions({ query: queryParams }),
    // Keep the previous page's data while the query key changes (search/filter/page)
    // so the table doesn't flash back to the skeleton. isLoading is only true on the
    // first load (before anything is cached).
    placeholderData: keepPreviousData,
  });
  const categories = data?.items ?? [];
  const pagination = data?.pagination;
  const totalFilterCategories = pagination?.totalItems ?? 0;
  const totalAllCategories = data?.totalAllItems ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    ...deleteCrmArticleCategoriesByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'カテゴリを削除しました');
      queryClient.invalidateQueries({
        queryKey: getCrmArticleCategoriesQueryKey(),
      });
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('カテゴリの削除に失敗しました');
    },
  });

  const sorting: SortingState = filters.sort
    ? [{ id: filters.sort, desc: filters.order === 'desc' }]
    : [];

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    if (next.length === 0) {
      setFilters({ sort: null, order: 'asc' });
      return;
    }
    setFilters({
      sort: next[0].id as typeof filters.sort,
      order: next[0].desc ? 'desc' : 'asc',
    });
  };

  const columns: ColumnDef<ArticleCategoryItemResponse>[] = useMemo(
    () =>
      ArticleCategoryTableColumns({
        onEditClick: (id) => {
          router.push(navigate('/article-categories/[id]/edit', id));
        },
        onDeleteClick: (category) => {
          setDeleteTarget(category);
        },
      }),
    [router],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        breadcrumb={<BackLink label="お知らせ管理に戻る" href={navigate('/announcements')} />}
        title="カテゴリマスタ"
        badge={
          <Badge
            variant="outline"
            className="text-muted-foreground text-xs font-normal tabular-nums"
          >
            {totalAllCategories.toLocaleString()}件
          </Badge>
        }
        actions={
          <RoleGatedButton
            allowedRoles={[UserRole.Headquarter, UserRole.System]}
            denyTooltip="カテゴリマスタの作成は本部のみ可能です"
            className="gap-1"
            onClick={() => router.push(navigate('/article-categories/create'))}
          >
            <Plus className="size-4" />
            新規登録
          </RoleGatedButton>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-4">
        <Card className="flex min-h-0 flex-col gap-0 rounded-xl border p-0">
          <ArticleCategoryFilters
            isFilterOpen={isFilterOpen}
            onFilterOpenChange={setIsFilterOpen}
            filtersHook={filtersHook}
          />

          <FilterResultBanner
            show={hasActiveFilters}
            totalCount={totalAllCategories}
            filteredCount={totalFilterCategories}
            filterSummary={filterSummary}
            onClear={clearFilters}
          />

          <DataTable
            tableSize="md"
            isLoading={isLoading}
            isFetching={isFetching}
            columns={columns}
            data={categories}
            variant="simple"
            className="h-full min-h-0 flex-1 rounded-none border-x-0 border-b-0"
            containerClassName="h-full"
            tableOptions={{
              onSortingChange: handleSortingChange,
              manualSorting: true,
              state: { sorting },
            }}
            emptyContent={
              <Empty
                variant={filtersHook.hasActiveFilters ? 'filtered' : 'empty'}
                entityLabel="カテゴリ"
                onAction={filtersHook.clearFilters}
              />
            }
          />

          {totalFilterCategories > 0 && !isError && (
            <TablePaginationWithSize
              currentPage={page}
              total={totalFilterCategories}
              pageSize={limit}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </Card>
      </div>

      <ArticleCategoryDeleteAction
        category={deleteTarget}
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

export default function ArticleCategoriesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ArticleCategoriesPageContent />
    </Suspense>
  );
}
