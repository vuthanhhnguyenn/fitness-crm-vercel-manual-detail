'use client';

import { useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { useCurrentStore } from '@/contexts/current-store.context';
import { useQuery } from '@tanstack/react-query';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { DataTable } from '@/components/common/data-table';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Card } from '@/components/ui/card';

import { getCrmMembershipApplicationsOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { MembershipApplication } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { PAGE_SIZE_OPTIONS } from '../_constants/constants';
import { useMembershipApplicationsFiltersContext } from '../_contexts/membership-applications-filters-context';
import { getMembershipApplicationsColumns } from './membership-applications-table-columns';

export function MembershipApplicationsTable() {
  const {
    showFilters,
    queryParams,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    filters,
    toggleSort,
    hasActiveFilters,
    clearFilters,
  } = useMembershipApplicationsFiltersContext();
  const router = useRouter();
  // See page.tsx's isStoreScopeLoading comment — same guard so this independent query
  // doesn't fire against the pre-resolution "all stores" scope either.
  const { isLoading: isStoreScopeLoading } = useCurrentStore();
  const { data, isLoading, isError } = useQuery({
    ...getCrmMembershipApplicationsOptions({ query: queryParams }),
    enabled: !isStoreScopeLoading,
  });

  const columns = useMemo(
    () => getMembershipApplicationsColumns(filters.sort_by, filters.sort_order, toggleSort),
    [filters.sort_by, filters.sort_order, toggleSort],
  );

  const applications = data?.applications ?? [];
  const pagination = data?.pagination;

  const getRowClassName = (row: MembershipApplication) =>
    row.blacklist_state === 'matched'
      ? 'bg-destructive/5 hover:bg-destructive/10'
      : 'hover:bg-muted/50';

  const containerClassName = showFilters
    ? 'max-h-[calc(100vh-370px)]'
    : 'max-h-[calc(100vh-320px)]';

  return (
    <Card className="gap-0 rounded-t-none py-0">
      <DataTable
        columns={columns}
        data={applications}
        variant="simple"
        isLoading={isLoading || isStoreScopeLoading}
        onRowClick={(row) => router.push(navigate('/membership-applications/[id]', row.id))}
        getRowClassName={getRowClassName}
        tableOptions={{ manualSorting: true }}
        className="rounded-none! border-none!"
        containerClassName={containerClassName}
        emptyContent={
          !isLoading && !isStoreScopeLoading && applications.length === 0 ? (
            <Empty
              variant={hasActiveFilters ? 'filtered' : 'empty'}
              entityLabel="入会申請"
              onAction={clearFilters}
            />
          ) : undefined
        }
      />

      {pagination && !isError && (
        <TablePaginationWithSize
          total={pagination.total}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          className="border-t-0!"
        />
      )}
    </Card>
  );
}
