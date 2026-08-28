'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { termsColumns } from '@/app/(private)/terms/_components/terms-columns';
import { TermsDeleteDialog } from '@/app/(private)/terms/_components/terms-delete-dialog';
import { TermsFilters } from '@/app/(private)/terms/_components/terms-filters';
import {
  TERMS_BRAND_LABELS,
  TERMS_STATUS_LABELS,
  TERMS_TYPE_LABELS,
} from '@/app/(private)/terms/_constants/constants';
import { useTermsFilters } from '@/app/(private)/terms/_hooks/use-terms-filters';
import { useAuthUser } from '@/contexts/auth-user.context';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Empty } from '@/components/common/data-state-boundary/empty';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmTermsOptions } from '@/lib/api/@tanstack/react-query.gen';
import { type TermsListItemResponse, TermsType } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { UserRole } from '@/types/permission.type';

const TYPE_TABS: Array<{ value: TermsType | 'all'; label: string }> = [
  { value: 'all', label: 'すべて' },
  ...Object.values(TermsType).map((type) => ({ value: type, label: TERMS_TYPE_LABELS[type] })),
];

export function TermsListSection() {
  const router = useRouter();
  const { hasRole } = useAuthUser();
  const isTrainer = hasRole([UserRole.Trainer]);
  const [deleteTarget, setDeleteTarget] = useState<TermsListItemResponse | null>(null);

  const filtersHook = useTermsFilters();
  const { filters, setFilters, currentPage, setCurrentPage, pageSize, setPageSize } = filtersHook;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmTermsOptions({ query: filtersHook.queryParams }),
    enabled: !isTrainer,
  });

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;
  // Decoupled from the active tab/filters (PAR001): the API computes this before termsType/brandEnum/status/query filters are applied.
  const nonDeletedCount = pagination?.totalAllItems ?? 0;

  const columns: ColumnDef<TermsListItemResponse>[] = useMemo(
    () =>
      termsColumns({
        onEditClick: (item) => router.push(navigate('/terms/[id]/edit', item.id)),
        onDeleteClick: (item) => setDeleteTarget(item),
      }),
    [router],
  );

  const activeTab = filters.termsType ?? 'all';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="規約文書管理"
        badge={
          <Badge
            variant="outline"
            className="text-muted-foreground text-xs font-normal tabular-nums"
          >
            {nonDeletedCount.toLocaleString()}件
          </Badge>
        }
        actions={
          <RoleGatedButton
            allowedRoles={[UserRole.Headquarter, UserRole.System]}
            className="h-8 gap-1 rounded-[10px] px-3 text-sm font-semibold"
            onClick={() => router.push(navigate('/terms/create'))}
          >
            <Plus className="size-3.5" />
            新規登録
          </RoleGatedButton>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-auto px-6 py-4">
        {isTrainer ? (
          <div className="flex h-full min-h-100 items-center justify-center">
            <Card className="flex w-full max-w-sm flex-col items-center gap-3 p-8 text-center">
              <p className="text-sm font-semibold">この画面を表示する権限がありません</p>
              <p className="text-muted-foreground text-xs">
                規約文書管理はトレーナーロールでは参照できません。
              </p>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setFilters({ termsType: value === 'all' ? null : (value as TermsType), page: 1 });
              }}
              className="gap-4"
            >
              <TabsList variant="line">
                {TYPE_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeTab}>
                <Card className="gap-0 overflow-hidden rounded-xl border p-0">
                  <TermsFilters filtersHook={filtersHook} />

                  <FilterResultBanner
                    show={filtersHook.hasActiveFilters}
                    totalCount={nonDeletedCount}
                    filteredCount={totalItems}
                    filterSummary={[
                      filters.query ? `"${filters.query}"` : '',
                      filters.brandEnum
                        ? (TERMS_BRAND_LABELS[filters.brandEnum] ?? filters.brandEnum)
                        : '',
                      filters.status ? (TERMS_STATUS_LABELS[filters.status] ?? filters.status) : '',
                    ]}
                    onClear={filtersHook.clearFilters}
                  />

                  <DataStateBoundary
                    isLoading={isLoading}
                    isError={isError}
                    isEmpty={false}
                    onRetry={() => void refetch()}
                    errorTitle="規約文書一覧の取得に失敗しました"
                    skeleton={
                      <DataTable
                        tableSize="md"
                        columns={columns}
                        data={[]}
                        isLoading
                        variant="simple"
                        className="rounded-none border-x-0 border-b-0"
                      />
                    }
                  >
                    <DataTable
                      tableSize="md"
                      columns={columns}
                      data={items}
                      variant="simple"
                      className="rounded-none border-x-0 border-b-0"
                      onRowClick={(row) => {
                        router.push(navigate('/terms/[id]', row.id));
                      }}
                      getRowClassName={(row) => (row.isDeleted ? 'opacity-50' : undefined)}
                      emptyContent={
                        <Empty
                          variant={filtersHook.hasActiveFilters ? 'filtered' : 'empty'}
                          entityLabel="規約文書"
                          onAction={filtersHook.clearFilters}
                        />
                      }
                    />
                  </DataStateBoundary>

                  {totalItems > 0 && !isError && (
                    <TablePaginationWithSize
                      currentPage={page}
                      total={totalItems}
                      pageSize={limit}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={setPageSize}
                    />
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <TermsDeleteDialog
        target={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </div>
  );
}
