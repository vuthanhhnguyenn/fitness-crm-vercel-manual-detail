'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
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
import { useFranchiseCompaniesFilters } from './_hooks/use-franchise-companies-filters';

function FranchiseCompaniesPageContent() {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FranchiseCompanyListItem | null>(null);
  const filtersHook = useFranchiseCompaniesFilters();
  const { filters, setFilters, queryParams, currentPage, setCurrentPage, pageSize, setPageSize } =
    filtersHook;

  const { data, isLoading } = useQuery({
    ...getCrmFranchiseCompaniesOptions({
      query: queryParams,
    }),
  });

  const companies = data?.franchise_companies ?? [];
  const pagination = data?.pagination;
  const totalCompanies = pagination?.total ?? 0;
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

  const columns = useMemo(
    () =>
      FranchiseCompaniesTableColumns({
        onDeleteClick: (company) => setDeleteTarget(company),
      }),
    [],
  );

  const deleteBlockedReason = deleteTarget
    ? [
        deleteTarget.status === 'active' ? '有効なFC企業は削除できません' : null,
        deleteTarget.managed_store_count > 0 ? '管轄店舗があるため削除できません' : null,
      ]
        .filter(Boolean)
        .join(' / ') || null
    : null;

  return (
    <>
      <PageHeader
        title="FC企業管理"
        badge={
          <Badge variant="outline" className="text-xs">
            {totalCompanies}件
          </Badge>
        }
        actions={
          <RoleGatedButton
            requiredPermission={Permission.FCCompaniesCreate}
            size="sm"
            onClick={() => router.push(navigate('/franchise-companies/create'))}
          >
            <Plus className="size-4" />
            新規登録
          </RoleGatedButton>
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-6 pt-4">
        <Card className="gap-3 overflow-hidden rounded-xl border p-0">
          <div className="p-3 pb-0">
            <FranchiseCompaniesFilters
              isFilterOpen={isFilterOpen}
              onFilterOpenChange={setIsFilterOpen}
              filtersHook={filtersHook}
            />
          </div>

          {isLoading || totalCompanies > 0 ? (
            <>
              <DataTable
                columns={columns}
                data={companies}
                isLoading={isLoading}
                variant="simple"
                className="rounded-none border-x-0 border-b-0"
                containerClassName={
                  isFilterOpen ? 'max-h-[calc(100vh-370px)]' : 'max-h-[calc(100vh-320px)]'
                }
                onRowClick={(row) => router.push(navigate('/franchise-companies/[id]', row.id))}
                tableOptions={{
                  onSortingChange: handleSortingChange,
                  manualSorting: true,
                  state: {
                    sorting,
                  },
                }}
              />

              {totalCompanies > 0 && (
                <TablePaginationWithSize
                  currentPage={page}
                  total={totalCompanies}
                  pageSize={limit}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              )}
            </>
          ) : (
            <div className="p-4">
              <Empty
                title={
                  filters.search || filters.company_type || filters.status
                    ? '条件に合うFC企業がありません'
                    : 'FC企業がありません'
                }
                description={
                  filters.search || filters.company_type || filters.status
                    ? '検索条件またはフィルターを変更してください。'
                    : '表示するFC企業がありません。'
                }
              />
              {(filters.search || filters.company_type || filters.status) && (
                <div className="mt-4 flex justify-center">
                  <RoleGatedButton variant="outline" size="sm" onClick={filtersHook.clearFilters}>
                    条件をクリア
                  </RoleGatedButton>
                </div>
              )}
            </div>
          )}
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
