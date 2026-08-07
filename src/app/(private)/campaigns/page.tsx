'use client';

import { Suspense, useMemo, useState } from 'react';

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

import { getCrmCampaignsOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { CampaignsFilters } from './_components/campaigns-filters';
import { CampaignsTableColumns } from './_components/campaigns-table-columns';
import { CampaignsFiltersProvider } from './_contexts/campaigns-filters-context';
import { useCampaignsFilters } from './_hooks/use-campaigns-filters';

function CampaignsPageContent() {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filtersHook = useCampaignsFilters();
  const { filters, setFilters, queryParams, currentPage, setCurrentPage, pageSize, setPageSize } =
    filtersHook;

  const { data, isLoading } = useQuery({
    ...getCrmCampaignsOptions({
      query: queryParams,
    }),
  });

  const campaigns = data?.campaigns ?? [];
  const pagination = data?.pagination;
  const totalCampaigns = pagination?.total ?? 0;
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

  const columns = useMemo(() => CampaignsTableColumns(), []);

  return (
    <>
      <PageHeader
        title="キャンペーン管理"
        badge={
          <Badge variant="outline" className="text-xs">
            {totalCampaigns}件
          </Badge>
        }
        actions={
          <RoleGatedButton
            requiredPermission={Permission.CampaignsCreate}
            onClick={() => router.push(navigate('/campaigns/create'))}
          >
            <Plus className="size-4" />
            新規登録
          </RoleGatedButton>
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-6 pt-4">
        <Card className="gap-3 overflow-hidden rounded-xl border p-0">
          <div className="p-3 pb-0">
            <CampaignsFiltersProvider value={filtersHook}>
              <CampaignsFilters isFilterOpen={isFilterOpen} onFilterOpenChange={setIsFilterOpen} />
            </CampaignsFiltersProvider>
          </div>

          <DataTable
            columns={columns}
            data={campaigns}
            isLoading={isLoading}
            variant="simple"
            onRowClick={(row) => {
              router.push(navigate('/campaigns/[id]', row.id));
            }}
            className="rounded-none border-x-0 border-b-0 text-xs [&_table]:text-xs [&_td]:text-xs [&_td]:leading-4 [&_th]:text-xs [&_th]:leading-4 [&_th]:font-semibold [&_thead_tr]:h-10 [&_thead_tr]:bg-neutral-100"
            containerClassName={
              isFilterOpen ? 'max-h-[calc(100vh-330px)]' : 'max-h-[calc(100vh-286px)]'
            }
            tableOptions={{
              onSortingChange: handleSortingChange,
              manualSorting: true,
              state: {
                sorting,
              },
            }}
          />

          {totalCampaigns > 0 && (
            <TablePaginationWithSize
              currentPage={page}
              total={totalCampaigns}
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

export default function CampaignsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CampaignsPageContent />
    </Suspense>
  );
}
