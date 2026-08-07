'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { Percent, Plus } from 'lucide-react';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { getCrmOptionsOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmOptionsResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { OptionDeleteDialog } from './[id]/_components/option-delete-dialog';
import { OptionsFilters } from './_components/options-filters';
import { OptionsTableColumns } from './_components/options-table-columns';
import { OptionsFiltersProvider } from './_contexts/options-filters-context';
import { useOptionsFilters } from './_hooks/use-options-filters';

type OptionRow = GetCrmOptionsResponse['options'][number];

function OptionsPageContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<OptionRow | null>(null);
  const filtersHook = useOptionsFilters();
  const { filters, setFilters, queryParams, currentPage, setCurrentPage, pageSize, setPageSize } =
    filtersHook;
  const router = useRouter();

  const { data, isLoading } = useQuery({
    ...getCrmOptionsOptions({ query: queryParams }),
  });

  const options = data?.options ?? [];
  const pagination = data?.pagination;
  const totalOptions = pagination?.total ?? 0;
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

  const columns: ColumnDef<OptionRow>[] = useMemo(
    () =>
      OptionsTableColumns({
        onEditClick: (id) => {
          router.push(navigate('/options/[id]/edit', id));
        },
        onDeleteClick: (option) => {
          setSelectedOption(option);
        },
      }),
    [router],
  );

  return (
    <div className="">
      <PageHeader
        title="オプション管理"
        badge={<Badge variant="secondary">{totalOptions}件</Badge>}
        actions={
          <>
            <RoleGatedButton
              requiredPermission={Permission.OptionDiscountsView}
              type="button"
              variant="outline"
              className="gap-1"
              onClick={() => router.push(navigate('/option-discount'))}
            >
              <Percent className="size-4" />
              セット割設定
            </RoleGatedButton>
            <RoleGatedButton
              requiredPermission={Permission.OptionsCreate}
              type="button"
              className="gap-1"
              onClick={() => router.push(navigate('/options/create'))}
            >
              <Plus className="size-4" />
              新規登録
            </RoleGatedButton>
          </>
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-6 pt-4">
        <Card className="gap-3 overflow-hidden rounded-xl border p-0">
          <div className="p-3 pb-0">
            <OptionsFiltersProvider value={filtersHook}>
              <OptionsFilters isFilterOpen={isFilterOpen} onFilterOpenChange={setIsFilterOpen} />
            </OptionsFiltersProvider>
          </div>

          <DataTable
            columns={columns}
            data={options}
            isLoading={isLoading}
            variant="simple"
            onRowClick={(row) => {
              router.push(navigate('/options/[id]', row.id));
            }}
            className="rounded-none border-x-0 border-b-0"
            containerClassName={
              isFilterOpen ? 'max-h-[calc(100vh-370px)]' : 'max-h-[calc(100vh-320px)]'
            }
            tableOptions={{
              onSortingChange: handleSortingChange,
              manualSorting: true,
              state: { sorting },
            }}
          />

          {totalOptions > 0 && (
            <TablePaginationWithSize
              currentPage={page}
              total={totalOptions}
              pageSize={limit}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </Card>
      </div>

      {selectedOption && (
        <OptionDeleteDialog
          optionId={selectedOption.id}
          optionName={selectedOption.name}
          open={Boolean(selectedOption)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedOption(null);
            }
          }}
          redirectOnSuccess={false}
        />
      )}
    </div>
  );
}

export default function OptionsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OptionsPageContent />
    </Suspense>
  );
}
