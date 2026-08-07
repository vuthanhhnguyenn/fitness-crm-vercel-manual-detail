'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { DataTable } from '@/components/common/data-table';
import { TablePagination } from '@/components/common/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { getCrmTransfersOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { TransferFilters } from './_components/transfer-filters';
import { TransferTableColumns } from './_components/transfer-table-columns';
import { TransferFiltersProvider } from './_contexts/transfer-filters-context';
import { useTransferFilters } from './_hooks/use-transfer-filters';

function TransferListPageContent() {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filtersHook = useTransferFilters();
  const { queryParams, currentPage, setCurrentPage, pageSize } = filtersHook;

  const { data, isLoading } = useQuery({
    ...getCrmTransfersOptions({ query: queryParams }),
  });

  const transfers = useMemo(() => data?.transfers ?? [], [data?.transfers]);
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.total_pages ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const columns = TransferTableColumns();

  return (
    <div>
      <div className="mb-4 flex items-center gap-4 px-6 pt-6">
        <h1 className="text-xl font-bold">移籍管理</h1>
        <Badge variant="secondary" className="text-xs">
          {total.toLocaleString()}件
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <Card className="gap-0 overflow-hidden rounded-xl p-0">
          <TransferFiltersProvider value={filtersHook}>
            <TransferFilters isFilterOpen={isFilterOpen} onFilterOpenChange={setIsFilterOpen} />
          </TransferFiltersProvider>

          <DataTable
            columns={columns}
            data={transfers}
            isLoading={isLoading}
            variant="simple"
            onRowClick={(row) => {
              router.push(navigate('/members/transfers/[id]', row.id));
            }}
            className="rounded-none border-x-0 border-b-0"
            containerClassName={
              isFilterOpen ? 'max-h-[calc(100vh-340px)]' : 'max-h-[calc(100vh-290px)]'
            }
          />

          {total > 0 && (
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setCurrentPage}
              isLoading={isLoading}
              showPageNumbers={false}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

export default function TransferListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">読み込み中...</div>
        </div>
      }
    >
      <TransferListPageContent />
    </Suspense>
  );
}
