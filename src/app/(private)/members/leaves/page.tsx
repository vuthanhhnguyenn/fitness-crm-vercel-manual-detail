'use client';

import { Suspense, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { TablePagination } from '@/components/common/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { getCrmLeavesOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { LeavesFilters } from './_components/leaves-filters';
import { LeavesTableColumns } from './_components/leaves-table-columns';
import { LeavesFiltersProvider } from './_contexts/leaves-filters-context';
import { useLeavesFilters } from './_hooks/use-leaves-filters';

function LeavesPageContent() {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filtersHook = useLeavesFilters();
  const { queryParams, filters, setFilters, currentPage, setCurrentPage } = filtersHook;

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

  const { data, isLoading } = useQuery({
    ...getCrmLeavesOptions({ query: queryParams }),
  });

  const leaves = data?.leaves ?? [];
  const totalPages = data?.total_pages ?? 1;
  const total = data?.total ?? 0;
  const pageSize = filtersHook.pageSize;

  const columns = LeavesTableColumns();

  return (
    <LeavesFiltersProvider value={filtersHook}>
      <main className="bg-muted/40 min-h-0 flex-1 overflow-auto p-6">
        {/* Page Header */}
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-xl font-semibold">休会・退会管理</h1>
          <Badge variant="secondary" className="text-xs">
            {total}件
          </Badge>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="gap-0 py-0">
            {/* Toolbar / Filters */}
            <LeavesFilters isFilterOpen={isFilterOpen} onFilterOpenChange={setIsFilterOpen} />

            {/* Table */}
            <DataTable
              columns={columns}
              data={leaves}
              isLoading={isLoading}
              variant="simple"
              className="rounded-none border-x-0 border-b-0"
              containerClassName={
                isFilterOpen ? 'max-h-[calc(100vh-330px)]' : 'max-h-[calc(100vh-280px)]'
              }
              onRowClick={(row) => router.push(navigate('/members/leaves/[id]', row.id))}
              tableOptions={{
                state: { sorting },
                onSortingChange: handleSortingChange,
                manualSorting: true,
              }}
            />

            {/* Pagination */}
            {total > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={total}
                limit={pageSize}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
              />
            )}
          </Card>
        </div>
      </main>
    </LeavesFiltersProvider>
  );
}

export default function LeavesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LeavesPageContent />
    </Suspense>
  );
}
