'use client';

import { useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { DataTable } from '@/components/common/data-table';
import { TablePagination } from '@/components/common/table-pagination';
import { Card } from '@/components/ui/card';

import { getCrmMembershipApplicationsOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { MembershipApplication } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { useMembershipApplicationsFiltersContext } from '../_contexts/membership-applications-filters-context';
import { getMembershipApplicationsColumns } from './membership-applications-table-columns';

export function MembershipApplicationsTable() {
  const { queryParams, currentPage, setCurrentPage, pageSize, toggleSortOrder, filters } =
    useMembershipApplicationsFiltersContext();
  const router = useRouter();
  const { data, isLoading } = useQuery(getCrmMembershipApplicationsOptions({ query: queryParams }));

  const columns = useMemo(
    () => getMembershipApplicationsColumns(filters.sort_order, toggleSortOrder),
    [filters.sort_order, toggleSortOrder],
  );

  const applications = data?.applications ?? [];
  const pagination = data?.pagination;

  const getRowClassName = (row: MembershipApplication) =>
    row.blacklist_match ? 'bg-destructive/5 hover:bg-destructive/10' : undefined;

  return (
    <Card className="gap-0 rounded-t-none py-0">
      <DataTable
        columns={columns}
        data={applications}
        variant="simple"
        isLoading={isLoading}
        onRowClick={(row) => router.push(navigate('/membership-applications/[id]', row.id))}
        getRowClassName={getRowClassName}
        tableOptions={{ manualSorting: true }}
        className="rounded-none! border-none!"
      />

      {pagination && (
        <div className="border-t">
          <TablePagination
            currentPage={currentPage}
            totalPages={pagination.total_pages}
            total={pagination.total}
            limit={pageSize}
            onPageChange={setCurrentPage}
            className="border-t-0!"
          />
        </div>
      )}
    </Card>
  );
}
