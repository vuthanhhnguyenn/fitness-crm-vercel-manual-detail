'use client';

import { Suspense, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { getCrmMainContractsOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { ContractsFilters } from './_components/contracts-filters';
import { useContractsTableColumns } from './_components/contracts-table-columns';
import { ContractsFiltersProvider } from './_contexts/contracts-filters-context';
import { useContractsFilters } from './_hooks/use-contracts-filters';

function ContractsPageContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const router = useRouter();
  const filtersHook = useContractsFilters();
  const { filters, setFilters, queryParams, currentPage, setCurrentPage, pageSize, setPageSize } =
    filtersHook;

  const { data, isLoading } = useQuery({
    ...getCrmMainContractsOptions({
      query: queryParams,
    }),
  });

  const contracts = data?.main_contracts ?? [];
  const pagination = data?.pagination;
  const totalContracts = pagination?.total ?? 0;
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

  const columns = useContractsTableColumns();

  return (
    <>
      <PageHeader
        title="主契約管理"
        badge={
          <Badge variant="outline" className="text-xs">
            {totalContracts}件
          </Badge>
        }
        actions={
          <RoleGatedButton
            requiredPermission={Permission.ContractsCreate}
            onClick={() => router.push(navigate('/contracts/create'))}
          >
            <Plus className="size-4" />
            新規登録
          </RoleGatedButton>
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-6 pt-4">
        <Card className="gap-3 overflow-hidden rounded-xl border p-0">
          <div className="p-3 pb-0">
            <ContractsFiltersProvider value={filtersHook}>
              <ContractsFilters isFilterOpen={isFilterOpen} onFilterOpenChange={setIsFilterOpen} />
            </ContractsFiltersProvider>
          </div>

          <DataTable
            columns={columns}
            data={contracts}
            isLoading={isLoading}
            variant="simple"
            className="rounded-none border-x-0 border-b-0"
            containerClassName={
              isFilterOpen ? 'max-h-[calc(100vh-330px)]' : 'max-h-[calc(100vh-286px)]'
            }
            onRowClick={(row) => router.push(navigate('/contracts/[id]', row.id))}
            tableOptions={{
              onSortingChange: handleSortingChange,
              manualSorting: true,
              state: {
                sorting,
              },
            }}
          />

          {totalContracts > 0 && (
            <TablePaginationWithSize
              currentPage={page}
              total={totalContracts}
              onPageChange={setCurrentPage}
              pageSize={limit}
              onPageSizeChange={setPageSize}
            />
          )}
        </Card>
      </div>
    </>
  );
}

export default function ContractsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ContractsPageContent />
    </Suspense>
  );
}
