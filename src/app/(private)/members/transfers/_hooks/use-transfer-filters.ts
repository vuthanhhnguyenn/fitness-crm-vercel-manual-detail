import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import type { GetCrmTransfersData, TransferBrand, TransferStatus } from '@/lib/api/types.gen';

import {
  TRANSFER_APPLIED_PERIOD_OPTIONS,
  TRANSFER_AUTO_OPTIONS,
  TRANSFER_BRAND_LABELS,
  TRANSFER_STATUS_LABELS,
} from '../_constants/constants';

type AppliedPeriod = 'this_month' | 'last_month' | 'this_year';
type AutoTransfer = 'eligible' | 'excluded';
type SortBy = NonNullable<NonNullable<GetCrmTransfersData['query']>['sort_by']>;

export type TransferFilters = {
  page: number;
  pageSize: number;
  search: string;
  status: TransferStatus | null;
  from_store_id: string | null;
  to_store_id: string | null;
  store_id: string | null;
  brand: TransferBrand | null;
  applied_period: AppliedPeriod | null;
  auto_transfer: AutoTransfer | null;
  sort_by: SortBy;
  sort_order: 'asc' | 'desc';
};

const TRANSFER_STATUS_VALUES = Object.keys(TRANSFER_STATUS_LABELS) as TransferStatus[];

export function useTransferFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      pageSize: parseAsInteger.withDefault(PAGE_SIZE),
      search: parseAsString.withDefault(''),
      // Status values come from the generated enum, so a removed status can never linger here.
      status: parseAsStringEnum<TransferStatus>(TRANSFER_STATUS_VALUES),
      from_store_id: parseAsString,
      to_store_id: parseAsString,
      store_id: parseAsString,
      brand: parseAsStringEnum<TransferBrand>(['joyfit', 'fit365']),
      applied_period: parseAsStringEnum<AppliedPeriod>(['this_month', 'last_month', 'this_year']),
      auto_transfer: parseAsStringEnum<AutoTransfer>(['eligible', 'excluded']),
      sort_by: parseAsStringEnum<SortBy>([
        'applied_at',
        'scheduled_date',
        'member_name',
        'id',
      ]).withDefault('applied_at'),
      sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('desc'),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.search, (value) =>
    setFilters({ search: value || null, page: 1 }),
  );

  const updateFilter = <K extends keyof TransferFilters>(key: K, value: TransferFilters[K]) => {
    // Sorting keeps the current page; every other change resets to page 1 so the user is never
    // left on a page that no longer exists in the narrowed result set.
    if (key === 'sort_by' || key === 'sort_order') {
      setFilters({ [key]: value } as Parameters<typeof setFilters>[0]);
    } else {
      setFilters({ [key]: value, page: 1 } as Parameters<typeof setFilters>[0]);
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      search: null,
      status: null,
      from_store_id: null,
      to_store_id: null,
      store_id: null,
      brand: null,
      applied_period: null,
      auto_transfer: null,
      sort_by: 'applied_at',
      sort_order: 'desc',
    });
  };

  const activeFilterCount = [
    filters.status,
    filters.from_store_id,
    filters.to_store_id,
    filters.brand,
    filters.applied_period,
    filters.auto_transfer,
  ].filter((value) => value !== null).length;

  const hasActiveFilters = activeFilterCount > 0 || filters.search.length > 0;

  /**
   * Joined labels of the active filters, for the result banner. Store filters resolve to a
   * name via `storeNameById` when the caller can supply one; otherwise the raw id is shown
   * rather than nothing, so the banner never claims a filter that it cannot describe.
   */
  const buildFilterSummary = (storeNameById?: (id: string) => string | undefined): string[] => {
    const parts: string[] = [];
    if (filters.search) parts.push(`"${filters.search}"`);
    if (filters.status) parts.push(TRANSFER_STATUS_LABELS[filters.status]);
    if (filters.from_store_id) {
      parts.push(`移籍元: ${storeNameById?.(filters.from_store_id) ?? filters.from_store_id}`);
    }
    if (filters.to_store_id) {
      parts.push(`移籍先: ${storeNameById?.(filters.to_store_id) ?? filters.to_store_id}`);
    }
    if (filters.brand) parts.push(TRANSFER_BRAND_LABELS[filters.brand]);
    if (filters.applied_period) {
      const label = TRANSFER_APPLIED_PERIOD_OPTIONS.find(
        (o) => o.value === filters.applied_period,
      )?.label;
      if (label) parts.push(`申請: ${label}`);
    }
    if (filters.auto_transfer) {
      const label = TRANSFER_AUTO_OPTIONS.find((o) => o.value === filters.auto_transfer)?.label;
      if (label) parts.push(`自動移籍: ${label}`);
    }
    return parts;
  };

  const queryParams: NonNullable<GetCrmTransfersData['query']> = {
    page: filters.page,
    limit: filters.pageSize,
    search: filters.search || undefined,
    status: filters.status ?? undefined,
    from_store_id: filters.from_store_id ?? undefined,
    to_store_id: filters.to_store_id ?? undefined,
    store_id: filters.store_id ?? undefined,
    brand: filters.brand ?? undefined,
    applied_period: filters.applied_period ?? undefined,
    auto_transfer: filters.auto_transfer ?? undefined,
    sort_by: filters.sort_by,
    sort_order: filters.sort_order,
  };

  return {
    searchInput,
    setSearchInput,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    buildFilterSummary,
    queryParams,
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: filters.pageSize,
    setPageSize: (nextPageSize: number) => setFilters({ pageSize: nextPageSize, page: 1 }),
  };
}
