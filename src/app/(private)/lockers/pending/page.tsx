'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import { Unlock } from 'lucide-react';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePagination } from '@/components/common/table-pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import {
  getCrmLockersPendingSlotsOptions,
  getCrmStoresOptions,
} from '@/lib/api/@tanstack/react-query.gen';

import { Permission } from '@/types/permission.type';

import { ReleaseConfirmDialog } from '../_components/release-confirm-dialog';
import { useLockerBulkRelease } from '../_hooks/use-locker-bulk-release.hook';
import {
  type LockerSlotReleaseTarget,
  releaseTargetsFromSelection,
} from '../_utils/locker-slot-release.util';
import { LockerPendingSlotsFilters } from './_components/locker-pending-slots-filters';
import { getLockerPendingSlotsTableColumns } from './_components/locker-pending-slots-table-columns';
import { useLockerPendingSlotsFilters } from './_hooks/use-locker-pending-slots-filters';

function LockerPendingSlotsPageContent() {
  const { hasPermission } = useAuthUser();
  const canRelease = hasPermission(Permission.LockersEdit);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Map<string, LockerSlotReleaseTarget>>(
    new Map(),
  );
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [releaseTargets, setReleaseTargets] = useState<string[]>([]);
  const { releaseTargets: releaseSelectedTargets, isReleasing } = useLockerBulkRelease();
  const {
    filters,
    queryParams,
    searchInput,
    setSearchInput,
    setFilters,
    clearFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    hasActiveFilters,
    activeFilterCount,
  } = useLockerPendingSlotsFilters();

  const { data, isLoading } = useQuery({
    ...getCrmLockersPendingSlotsOptions({
      query: queryParams,
    }),
  });

  const { data: storesResponse } = useQuery({
    ...getCrmStoresOptions({
      query: {
        page: 1,
        limit: 100,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
  });

  const pendingSlots = useMemo(() => data?.pending_slots ?? [], [data?.pending_slots]);
  const stores = storesResponse?.stores ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.total_pages ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const sorting: SortingState = filters.locker_pending_sort_by
    ? [{ id: filters.locker_pending_sort_by, desc: filters.locker_pending_sort_order === 'desc' }]
    : [];

  const selectedIds = useMemo(() => new Set(selectedItems.keys()), [selectedItems]);
  const selectedCount = selectedItems.size;
  const currentPageIds = pendingSlots.map((row) => row.id);
  const areAllCurrentRowsSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));

  const toggleRow = useCallback((target: LockerSlotReleaseTarget) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(target.id)) {
        next.delete(target.id);
      } else {
        next.set(target.id, target);
      }
      return next;
    });
  }, []);

  const toggleAllCurrentRows = useCallback(() => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (areAllCurrentRowsSelected) {
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        pendingSlots.forEach((row) => {
          next.set(row.id, {
            id: row.id,
            locker_id: row.locker_id,
            slot_number: row.slot_number,
          });
        });
      }
      return next;
    });
  }, [areAllCurrentRowsSelected, currentPageIds, pendingSlots]);

  const handleBulkRelease = useCallback(() => {
    const targets = releaseTargetsFromSelection(selectedItems);
    setReleaseTargets(targets.map((target) => target.slot_number));
    setReleaseDialogOpen(true);
  }, [selectedItems]);

  const handleConfirmRelease = useCallback(() => {
    releaseSelectedTargets(releaseTargetsFromSelection(selectedItems), {
      onSuccess: () => {
        setReleaseDialogOpen(false);
        setSelectedItems(new Map());
      },
    });
  }, [releaseSelectedTargets, selectedItems]);

  const columns = useMemo(
    () =>
      getLockerPendingSlotsTableColumns({
        canSelect: canRelease,
        areAllCurrentRowsSelected,
        selectedIds,
        toggleAllCurrentRows,
        toggleRow,
      }),
    [canRelease, areAllCurrentRowsSelected, selectedIds, toggleAllCurrentRows, toggleRow],
  );

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    if (next.length === 0) {
      setFilters({ locker_pending_sort_by: null, locker_pending_sort_order: null });
      return;
    }

    setFilters({
      locker_pending_sort_by: next[0]?.id ?? 'pending_since',
      locker_pending_sort_order: next[0]?.desc ? 'desc' : 'asc',
    });
  };

  return (
    <>
      <Card className="gap-3 overflow-hidden rounded-xl border p-0">
        <div className="p-3 pb-0">
          <div className="flex flex-col gap-3">
            <LockerPendingSlotsFilters
              activeFilterCount={activeFilterCount}
              clearFilters={clearFilters}
              filters={filters}
              hasActiveFilters={hasActiveFilters}
              isFilterOpen={isFilterOpen}
              searchInput={searchInput}
              setFilters={setFilters}
              setIsFilterOpen={setIsFilterOpen}
              setSearchInput={setSearchInput}
              stores={stores}
            />

            {canRelease && selectedCount > 0 && (
              <div className="border-primary/20 bg-primary/10 flex items-center gap-3 rounded-lg border px-3 py-2">
                <span className="text-primary text-sm font-medium">{selectedCount}件選択中</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Map())}>
                  選択解除
                </Button>
                <div className="bg-primary/20 h-4 w-px" />
                <RoleGatedButton
                  requiredPermission={Permission.LockersEdit}
                  denyTooltip="開放操作の権限がありません"
                  size="sm"
                  className="gap-1"
                  onClick={handleBulkRelease}
                >
                  <Unlock className="size-3.5" />
                  一括開放
                </RoleGatedButton>
              </div>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={pendingSlots}
          isLoading={isLoading}
          variant="simple"
          className="rounded-none border-x-0 border-b-0"
          containerClassName={
            isFilterOpen ? 'max-h-[calc(100vh-400px)]' : 'max-h-[calc(100vh-340px)]'
          }
          tableOptions={{
            manualSorting: true,
            onSortingChange: handleSortingChange,
            state: { sorting },
          }}
        />

        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </Card>

      <ReleaseConfirmDialog
        open={releaseDialogOpen}
        onOpenChange={setReleaseDialogOpen}
        targetSlots={releaseTargets}
        onConfirm={handleConfirmRelease}
        isPending={isReleasing}
      />
    </>
  );
}

export default function LockerPendingSlotsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LockerPendingSlotsPageContent />
    </Suspense>
  );
}
