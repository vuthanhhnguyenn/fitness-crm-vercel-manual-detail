'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { Mail } from 'lucide-react';

import { DataTable } from '@/components/common/data-table';
import { TablePagination } from '@/components/common/table-pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { getCrmStaffsOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmStaffsResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { InviteStaffModal } from './_components/invite-staff-modal';
import { StaffsFilters } from './_components/staffs-filters';
import { StaffsTableColumns } from './_components/staffs-table-columns';
import { StaffsFiltersProvider } from './_contexts/staffs-filters-context';
import { useStaffsFilters } from './_hooks/use-staffs-filters';

type Staff = GetCrmStaffsResponse['staffs'][number];

function StaffsPageContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const filtersHook = useStaffsFilters();
  const { filters, setFilters, queryParams, currentPage, setCurrentPage, pageSize } = filtersHook;
  const router = useRouter();
  // ─── Fetch staffs list ─────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    ...getCrmStaffsOptions({
      query: queryParams,
    }),
  });

  const staffs = data?.staffs ?? [];
  const pagination = data?.pagination;
  const totalStaffs = pagination?.total ?? 0;
  const totalPages = pagination?.total_pages ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  // ─── Sorting ───────────────────────────────────────────────────────────────

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

  // ─── Columns ───────────────────────────────────────────────────────────────

  const columns: ColumnDef<Staff>[] = useMemo(
    () =>
      StaffsTableColumns({
        onEditClick: (id) => {
          router.push(navigate('/staffs/[id]/edit', id));
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="">
      {/* Header Section */}
      <div className="flex flex-col gap-3 px-4 py-4 pb-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">スタッフ管理</h1>
          <span className="text-muted-foreground text-sm">{totalStaffs}件</span>
        </div>
        <Button className="w-full gap-2 sm:w-auto" onClick={() => setIsInviteModalOpen(true)}>
          <Mail className="size-4" />
          スタッフを招待
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Filters + Table in one Card */}
        <Card className="gap-3 overflow-hidden rounded-xl border p-0 shadow-sm">
          {/* Filters */}
          <div className="p-3 pb-0">
            <StaffsFiltersProvider value={filtersHook}>
              <StaffsFilters isFilterOpen={isFilterOpen} onFilterOpenChange={setIsFilterOpen} />
            </StaffsFiltersProvider>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={staffs}
            isLoading={isLoading}
            variant="simple"
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
            onRowClick={(row) => {
              router.push(navigate('/staffs/[id]', row.id));
            }}
          />

          {/* Pagination */}
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            total={totalStaffs}
            limit={limit}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        </Card>
      </div>

      {/* Invite Staff Modal */}
      <InviteStaffModal open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen} />
    </div>
  );
}

export default function StaffsPage() {
  return (
    <Suspense>
      <StaffsPageContent />
    </Suspense>
  );
}
