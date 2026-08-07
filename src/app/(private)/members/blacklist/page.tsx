'use client';

import { Suspense, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { TablePagination } from '@/components/common/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { getCrmBlacklistOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { BlacklistFilters } from './_components/blacklist-filters';
import { BlacklistRegisterSheet } from './_components/blacklist-register-sheet';
import { BlacklistTableColumns } from './_components/blacklist-table-columns';
import { BlacklistFiltersProvider } from './_contexts/blacklist-filters-context';
import { useBlacklistFilters } from './_hooks/use-blacklist-filters';

function BlacklistPageContent() {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const filtersHook = useBlacklistFilters();
  const { queryParams, currentPage, setCurrentPage, pageSize } = filtersHook;

  const { data, isLoading } = useQuery({
    ...getCrmBlacklistOptions({ query: queryParams }),
  });

  const blacklist = data?.blacklist ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.total_pages ?? 1;

  const columns = BlacklistTableColumns();

  return (
    <BlacklistFiltersProvider value={filtersHook}>
      <main className="bg-muted/40 min-h-0 flex-1 overflow-auto p-6">
        {/* Page Header */}
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-xl font-semibold">ブラックリスト管理</h1>
          <Badge variant="secondary" className="text-xs">
            {total}件
          </Badge>
          <div className="ml-auto">
            <Button size="sm" onClick={() => setIsSheetOpen(true)}>
              <Plus className="size-4" />
              手動登録
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="gap-0 py-0">
            {/* Toolbar / Filters */}
            <BlacklistFilters isFilterOpen={isFilterOpen} onFilterOpenChange={setIsFilterOpen} />

            {/* Table */}
            <DataTable
              columns={columns}
              data={blacklist}
              isLoading={isLoading}
              variant="simple"
              className="rounded-none border-x-0 border-b-0"
              containerClassName={
                isFilterOpen ? 'max-h-[calc(100vh-330px)]' : 'max-h-[calc(100vh-280px)]'
              }
              onRowClick={(row) => router.push(navigate('/members/blacklist/[id]', row.id))}
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

      <BlacklistRegisterSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </BlacklistFiltersProvider>
  );
}

export default function BlacklistPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BlacklistPageContent />
    </Suspense>
  );
}
