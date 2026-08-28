'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { getCrmFranchiseCompaniesOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { FranchiseCompanyListItem } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { FranchiseCompanyDeleteDialog } from './[id]/_components/franchise-company-delete-dialog';
import { FranchiseCompaniesFilters } from './_components/franchise-companies-filters';
import { FranchiseCompaniesTableColumns } from './_components/franchise-companies-table-columns';
import {
  FRANCHISE_COMPANY_STATUS_LABELS,
  FRANCHISE_COMPANY_TYPE_LABELS,
} from './_constants/constants';
import { useFranchiseCompaniesFilters } from './_hooks/use-franchise-companies-filters';

function FranchiseCompaniesPageContent() {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<FranchiseCompanyListItem | null>(null);
  const filtersHook = useFranchiseCompaniesFilters();
  const {
    filters,
    setFilters,
    queryParams,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    hasActiveFilters,
    clearFilters,
  } = filtersHook;

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    ...getCrmFranchiseCompaniesOptions({
      query: queryParams,
    }),
    placeholderData: keepPreviousData,
  });

  // 抽出バナー / ヘッダーバッジ用の絞り込み前件数（一覧APIは絞り込み後の total のみ返す）
  const { data: unfilteredData } = useQuery({
    ...getCrmFranchiseCompaniesOptions({ query: { page: 1, limit: 1 } }),
    enabled: hasActiveFilters,
  });

  const companies = data?.franchise_companies ?? [];
  const pagination = data?.pagination;
  const filteredTotal = pagination?.total ?? 0;
  const totalCompanies = hasActiveFilters
    ? (unfilteredData?.pagination.total ?? filteredTotal)
    : filteredTotal;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const filterSummary = [
    filters.search ? `"${filters.search}"` : '',
    filters.company_type ? `区分: ${FRANCHISE_COMPANY_TYPE_LABELS[filters.company_type]}` : '',
    filters.status ? `ステータス: ${FRANCHISE_COMPANY_STATUS_LABELS[filters.status]}` : '',
  ];

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

  const columns = useMemo(
    () =>
      FranchiseCompaniesTableColumns({
        onDeleteClick: (company) => setDeleteTarget(company),
      }),
    [],
  );

  const deleteBlockedReason =
    deleteTarget && deleteTarget.managed_store_count > 0 ? '管轄店舗が存在するため' : null;

  return (
    <>
      <PageHeader
        title="FC企業管理"
        badge={
          <Badge
            variant="outline"
            className="text-muted-foreground text-xs font-normal tabular-nums"
          >
            {totalCompanies.toLocaleString()}件
          </Badge>
        }
        actions={
          <RoleGatedButton
            requiredPermission={Permission.FCCompaniesCreate}
            className="gap-1"
            onClick={() => router.push(navigate('/franchise-companies/create'))}
          >
            <Plus className="size-4" />
            新規登録
          </RoleGatedButton>
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-6 pt-4">
        <Card className="gap-0 overflow-hidden rounded-xl border p-0">
          <div className="px-4 py-3">
            <FranchiseCompaniesFilters filtersHook={filtersHook} />
          </div>

          <FilterResultBanner
            show={hasActiveFilters}
            totalCount={totalCompanies}
            filteredCount={filteredTotal}
            filterSummary={filterSummary}
            onClear={clearFilters}
          />

          <DataTable
            columns={columns}
            data={companies}
            isLoading={isLoading}
            isFetching={isFetching}
            variant="simple"
            className="rounded-none border-x-0 border-b-0"
            containerClassName={
              hasActiveFilters ? 'max-h-[calc(100vh-370px)]' : 'max-h-[calc(100vh-320px)]'
            }
            onRowClick={(row) => router.push(navigate('/franchise-companies/[id]', row.id))}
            emptyContent={
              isError ? (
                <Empty
                  title="FC企業一覧の取得に失敗しました"
                  description="時間をおいて再度お試しください。"
                  onAction={() => void refetch()}
                  actionLabel="再試行"
                />
              ) : (
                <Empty
                  variant={hasActiveFilters ? 'filtered' : 'empty'}
                  entityLabel="FC企業"
                  onAction={hasActiveFilters ? clearFilters : undefined}
                />
              )
            }
            tableOptions={{
              onSortingChange: handleSortingChange,
              manualSorting: true,
              state: {
                sorting,
              },
            }}
          />

          <TablePaginationWithSize
            currentPage={page}
            total={filteredTotal}
            pageSize={limit}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      </div>

      <FranchiseCompanyDeleteDialog
        companyId={deleteTarget?.id ?? ''}
        companyName={deleteTarget?.display_name ?? ''}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        redirectOnSuccess={false}
        blockedReason={deleteBlockedReason}
        wording="list"
      />
    </>
  );
}

export default function FranchiseCompaniesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <FranchiseCompaniesPageContent />
    </Suspense>
  );
}
