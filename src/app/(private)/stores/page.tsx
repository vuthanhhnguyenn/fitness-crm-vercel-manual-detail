'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePagination } from '@/components/common/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmStoresResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { StoresFilters } from './_components/stores-filters';
import { StoresTableColumns } from './_components/stores-table-columns';
import { StoresFiltersProvider } from './_contexts/stores-filters-context';
import { useStoresFilters } from './_hooks/use-stores-filters';

type StoreRow = GetCrmStoresResponse['stores'][number];

function StoresPageContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filtersHook = useStoresFilters();
  const { filters, setFilters, queryParams, currentPage, setCurrentPage, pageSize } = filtersHook;
  const router = useRouter();

  const { data, isLoading } = useQuery({
    ...getCrmStoresOptions({
      query: queryParams,
    }),
  });

  const stores = data?.stores ?? [];
  const pagination = data?.pagination;
  const totalStores = pagination?.total ?? 0;
  const totalPages = pagination?.total_pages ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const sorting: SortingState = filters.sort_by
    ? [{ id: filters.sort_by, desc: filters.sort_order === 'desc' }]
    : [];

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    if (next.length === 0) {
      setFilters({ sort_by: null, sort_order: null });
    } else {
      setFilters({ sort_by: next[0].id, sort_order: next[0].desc ? 'desc' : 'asc' });
    }
  };

  const columns: ColumnDef<StoreRow>[] = useMemo(
    () =>
      StoresTableColumns({
        onEditClick: (id) => {
          router.push(navigate('/stores/[id]/edit', id));
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="">
      <div className="flex flex-row items-center justify-between gap-3 px-6 py-6 pb-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">店舗管理</h1>
          <Badge variant="secondary">{totalStores}件</Badge>
        </div>
        <RoleGatedButton
          requiredPermission={Permission.StoresCreate}
          type="button"
          size="sm"
          className="gap-1"
          onClick={() => router.push(navigate('/stores/create'))}
        >
          <Plus className="size-4" />
          新規登録
        </RoleGatedButton>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6 pt-4">
        <Card className="gap-3 overflow-hidden rounded-xl border p-0">
          <div className="p-3 pb-0">
            <StoresFiltersProvider value={filtersHook}>
              <StoresFilters isFilterOpen={isFilterOpen} onFilterOpenChange={setIsFilterOpen} />
            </StoresFiltersProvider>
          </div>

          <DataTable
            columns={columns}
            data={stores}
            isLoading={isLoading}
            variant="simple"
            onRowClick={(row) => {
              router.push(navigate('/stores/[id]', row.id));
            }}
            className="rounded-none border-x-0 border-b-0"
            containerClassName={
              isFilterOpen ? 'max-h-[calc(100vh-370px)]' : 'max-h-[calc(100vh-320px)]'
            }
            tableOptions={{
              onSortingChange: handleSortingChange,
              manualSorting: true,
              state: {
                sorting,
              },
            }}
          />

          {totalStores > 0 && (
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              total={totalStores}
              limit={limit}
              onPageChange={setCurrentPage}
              isLoading={isLoading}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

export default function StoresPage() {
  return (
    <Suspense fallback={<Loading />}>
      <StoresPageContent />
    </Suspense>
  );
}
