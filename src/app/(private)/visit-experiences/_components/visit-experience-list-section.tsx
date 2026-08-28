'use client';

import { useMemo } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useCurrentStore } from '@/contexts/current-store.context';
import { useQuery } from '@tanstack/react-query';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';

import { getCrmVisitExperiencesOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import type { VisitExperience, VisitExperienceStatus } from '@/types/api/visit-experience.type';
import { VISIT_EXPERIENCE_STATUS_LABELS } from '@/types/api/visit-experience.type';

import { DATE_RANGE_OPTIONS } from '../_constants/constants';
import { useVisitExperienceFilters } from '../_hooks/use-visit-experience-filters';
import { VisitExperienceFilters } from './visit-experience-filters';
import { getVisitExperienceColumns } from './visit-experience-table-columns';

export function VisitExperienceListSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canSelectAllStores, restrictedStores } = useCurrentStore();
  const showStoreColumn = canSelectAllStores || restrictedStores.length > 1;

  const {
    filters,
    searchInput,
    setSearchInput,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    queryParams,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
  } = useVisitExperienceFilters();

  const { search, status, brand_name, store_name, bl_match, date_range } = filters;

  const { data, isLoading } = useQuery({
    ...getCrmVisitExperiencesOptions({ query: queryParams }),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  // Count before search/filters (still store-scoped) — powers the FilterResultBanner's
  // "全N件中" text; returned by the same request, no second call needed.
  const totalAllItems = data?.total_all_items ?? total;

  const filterSummary = useMemo(
    () => [
      search ? `"${search}"` : '',
      status ? VISIT_EXPERIENCE_STATUS_LABELS[status as VisitExperienceStatus] : '',
      brand_name,
      store_name,
      bl_match ? 'BL照合: 要注意者のみ' : '',
      date_range
        ? (DATE_RANGE_OPTIONS.find((opt) => opt.value === date_range)?.label ?? date_range)
        : '',
    ],
    [search, status, brand_name, store_name, bl_match, date_range],
  );

  const columns = useMemo(() => getVisitExperienceColumns(showStoreColumn), [showStoreColumn]);

  const handleRowClick = (item: VisitExperience) => {
    const returnTo = searchParams.toString();
    const href = navigate('/visit-experiences/[id]', item.id);
    router.push(returnTo ? `${href}?returnTo=${encodeURIComponent(returnTo)}` : href);
  };

  const getRowClassName = (item: VisitExperience) =>
    item.bl_match ? 'bg-destructive/5 hover:bg-destructive/10' : undefined;

  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <VisitExperienceFilters
        search={searchInput}
        status={status}
        brandName={brand_name}
        storeName={store_name}
        blMatch={bl_match}
        dateRange={date_range}
        showStoreFilter={showStoreColumn}
        onSearchChange={setSearchInput}
        onStatusChange={(value) => updateFilter('status', value)}
        onBrandChange={(value) => updateFilter('brand_name', value)}
        onStoreChange={(value) => updateFilter('store_name', value)}
        onBlMatchChange={(value) => updateFilter('bl_match', value)}
        onDateRangeChange={(value) => updateFilter('date_range', value)}
        activeFilterCount={activeFilterCount}
      />
      <FilterResultBanner
        show={hasActiveFilters}
        totalCount={totalAllItems}
        filteredCount={total}
        filterSummary={filterSummary}
        onClear={clearFilters}
        className="rounded-none border-x-0 border-t-0"
      />
      <DataTable
        columns={columns}
        data={items}
        variant="simple"
        isLoading={isLoading}
        onRowClick={handleRowClick}
        getRowClassName={getRowClassName}
        className="rounded-none border-x-0 border-b-0"
        emptyContent={
          <Empty
            variant={hasActiveFilters ? 'filtered' : 'empty'}
            entityLabel="見学・体験"
            onAction={clearFilters}
          />
        }
      />
      <TablePaginationWithSize
        total={total}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        className="border-t-0!"
      />
    </div>
  );
}
