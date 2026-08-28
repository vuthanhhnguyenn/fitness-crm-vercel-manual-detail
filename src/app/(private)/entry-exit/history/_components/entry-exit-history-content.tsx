'use client';

import { useMemo, useState } from 'react';

import { useCurrentStore } from '@/contexts/current-store.context';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef, SortingState } from '@tanstack/react-table';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { DataTable } from '@/components/common/data-table';
import { FilterResult } from '@/components/common/filter-result';
import { PageHeader } from '@/components/common/page-header';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { getCrmEntryExitLogsHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';

import { MemberQuickViewSheet } from '../../_components/member-quick-view-sheet';
import { useEntryExitHistoryFilters } from '../_hooks/use-entry-exit-history-filters.hook';
import { EntryExitHistoryCsvExportButton } from './entry-exit-history-csv-export-button';
import { EntryExitHistoryFilters } from './entry-exit-history-filters';
import {
  type HistoryVisitRow,
  entryExitHistoryTableColumns,
} from './entry-exit-history-table-columns';

export function EntryExitHistoryContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const filtersHook = useEntryExitHistoryFilters();
  const { filters, setFilters, queryParams, currentPage, setCurrentPage, pageSize, setPageSize } =
    filtersHook;

  // Avoid firing the query with the default "all stores" scope before the caller's
  // real, role-resolved store scope is known — matching entry-exit-section.tsx's
  // (feature 013) enabled/isStoreScopeLoading pattern (research.md R6).
  const { isLoading: isStoreScopeLoading } = useCurrentStore();

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmEntryExitLogsHistoryOptions({ query: queryParams }),
    enabled: !isStoreScopeLoading,
  });

  const history = data?.history ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const sorting: SortingState = filters.sort_by
    ? [{ id: filters.sort_by, desc: filters.sort_order === 'desc' }]
    : [];

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    if (next.length === 0) {
      setFilters({ sort_by: 'visit_date', sort_order: 'desc' });
      return;
    }

    setFilters({
      sort_by: next[0].id as typeof filters.sort_by,
      sort_order: next[0].desc ? 'desc' : 'asc',
    });
  };

  const columns: ColumnDef<HistoryVisitRow>[] = useMemo(() => entryExitHistoryTableColumns(), []);

  // FR-012 / research.md R7: pass the exit log id for a completed visit (context
  // resolves to 'exit' → "退館済み"), else the entry log id (in-progress → "在館中",
  // denied → "入館拒否").
  const handleRowClick = (row: HistoryVisitRow) => {
    setSelectedLogId(row.visit_status === 'completed' ? row.exit_log_id : row.entry_log_id);
  };

  return (
    <>
      <PageHeader
        title="入退館履歴"
        badge={
          <Badge
            variant="outline"
            className="text-muted-foreground text-xs font-normal tabular-nums"
          >
            {total.toLocaleString()}件
          </Badge>
        }
        actions={
          <EntryExitHistoryCsvExportButton exportQueryParams={filtersHook.exportQueryParams} />
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-6 py-4">
        {filtersHook.hasActiveFilters && (
          <FilterResult
            totalCount={total}
            filteredCount={total}
            filterSummary={[
              filters.search ? `"${filters.search}"` : '',
              filters.store_id ?? '',
              filters.auth_method === 'qr'
                ? 'QRコード'
                : filters.auth_method === 'nfc'
                  ? 'NFCカード'
                  : '',
              filters.result === 'success' ? '成功' : filters.result === 'denied' ? '拒否' : '',
            ]}
            onClear={filtersHook.clearFilters}
            className="mt-0 mb-0"
          />
        )}
        <Card className="gap-0 overflow-hidden rounded-xl border p-0">
          <EntryExitHistoryFilters
            isFilterOpen={isFilterOpen}
            onFilterOpenChange={setIsFilterOpen}
            filtersHook={filtersHook}
          />

          {isError ? (
            <div className="flex min-h-80 items-center justify-center px-6 py-10">
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm font-medium">入退館履歴の取得に失敗しました</p>
                <button
                  type="button"
                  className="text-primary text-sm underline-offset-4 hover:underline"
                  onClick={() => refetch()}
                >
                  再試行
                </button>
              </div>
            </div>
          ) : (
            <DataTable
              tableSize="md"
              columns={columns}
              data={history}
              isLoading={isLoading || isStoreScopeLoading}
              variant="simple"
              className="rounded-none border-x-0 border-b-0"
              containerClassName={
                isFilterOpen ? 'max-h-[calc(100vh-370px)]' : 'max-h-[calc(100vh-320px)]'
              }
              onRowClick={handleRowClick}
              tableOptions={{
                onSortingChange: handleSortingChange,
                manualSorting: true,
                state: { sorting },
              }}
              emptyContent={
                <Empty
                  variant={filtersHook.hasActiveFilters ? 'filtered' : 'empty'}
                  entityLabel="入退館履歴"
                  onAction={filtersHook.hasActiveFilters ? filtersHook.clearFilters : undefined}
                />
              }
            />
          )}

          <TablePaginationWithSize
            total={total}
            currentPage={page}
            pageSize={limit}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      </div>

      <MemberQuickViewSheet
        logId={selectedLogId}
        onOpenChange={(open) => !open && setSelectedLogId(null)}
      />
    </>
  );
}
