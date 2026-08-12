'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { getCrmNotificationsOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmNotificationsResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { useManualNotificationFilters } from '../_hooks/use-manual-notification-filters';
import { ManualNotificationsFilters } from './manual-notifications-filters';
import { ManualNotificationsTable } from './manual-notifications-table';

type ManualNotificationRow = GetCrmNotificationsResponse['items'][number];

export function ManualNotificationsPageContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const router = useRouter();
  const filtersHook = useManualNotificationFilters();
  const { queryParams, currentPage, setCurrentPage, pageSize, setPageSize } = filtersHook;

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    ...getCrmNotificationsOptions({ query: queryParams }),
    placeholderData: keepPreviousData,
  });

  const items: ManualNotificationRow[] = data?.items ?? [];
  const pagination = data?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const totalAllItems = pagination?.totalAllItems ?? totalItems;
  const sorting: SortingState = [
    { id: filtersHook.filters.sort, desc: filtersHook.filters.order === 'desc' },
  ];

  const handleSortingChange = (
    updater: SortingState | ((previous: SortingState) => SortingState),
  ) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    const nextSort = next[0];

    if (!nextSort) {
      void filtersHook.setFilters({ sort: 'updatedAt', order: 'desc', page: 1 });
      return;
    }

    if (nextSort.id !== 'id' && nextSort.id !== 'title' && nextSort.id !== 'status') return;

    void filtersHook.setFilters({
      sort: nextSort.id,
      order: nextSort.desc ? 'desc' : 'asc',
      page: 1,
    });
  };

  return (
    <div>
      <PageHeader
        title="手動配信通知"
        className="bg-white"
        badge={
          <Badge variant="outline" className="text-xs">
            {isLoading ? '...' : `${totalAllItems}件`}
          </Badge>
        }
        actions={
          <RoleGatedButton
            requiredPermission={Permission.ManualNotificationsCreate}
            size="sm"
            className="h-8 rounded-lg px-3 text-sm"
            onClick={() => router.push(navigate('/manual-notifications/create'))}
          >
            <Plus className="size-3.5" />
            新規登録
          </RoleGatedButton>
        }
      />

      <div className="bg-background flex flex-1 flex-col gap-4 px-6 py-4">
        <Card className="gap-0 overflow-hidden rounded-xl border p-0">
          <div className="px-4 py-3">
            <ManualNotificationsFilters
              filtersHook={filtersHook}
              isFilterOpen={isFilterOpen}
              onFilterOpenChange={setIsFilterOpen}
              filteredTotal={totalItems}
              totalAllItems={totalAllItems}
            />
          </div>

          <ManualNotificationsTable
            items={items}
            total={totalItems}
            currentPage={pagination?.page ?? currentPage}
            pageSize={pagination?.limit ?? pageSize}
            isLoading={isLoading}
            isFetching={isFetching}
            isError={isError}
            onRetry={() => void refetch()}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            hasActiveFilters={filtersHook.hasActiveFilters}
            onClearFilters={filtersHook.clearFilters}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            onRowClick={(row) => router.push(navigate('/manual-notifications/[id]', row.id))}
          />
        </Card>
      </div>
    </div>
  );
}
