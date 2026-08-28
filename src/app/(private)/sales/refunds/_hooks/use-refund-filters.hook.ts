'use client';

import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import type { GetCrmBillingRecordsRefundRequestsData } from '@/lib/api/types.gen';

type RefundQueueQuery = NonNullable<GetCrmBillingRecordsRefundRequestsData['query']>;

const STATUS_VALUES = ['pending', 'completed', 'rejected'] satisfies Array<
  NonNullable<RefundQueueQuery['status']>
>;
const PAYMENT_METHOD_VALUES = ['sbps', 'jaccs', 'cash', 'other'] satisfies Array<
  NonNullable<RefundQueueQuery['payment_method']>
>;
const REQUESTER_ROLE_VALUES = ['staff', 'manager', 'headquarter'] satisfies Array<
  NonNullable<RefundQueueQuery['requester_role']>
>;
const SORT_BY_VALUES = [
  'refund_id',
  'sale_amount',
  'refund_amount',
  'status',
  'requested_at',
  'approved_at',
] satisfies Array<NonNullable<RefundQueueQuery['sort_by']>>;

/**
 * nuqs-backed filter/sort/pagination state for the refund approval queue (F-01 FR-015).
 * Mirrors `use-sales-filters.hook.ts`'s shape/conventions.
 */
export function useRefundFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      rf_status: parseAsStringEnum(STATUS_VALUES),
      rf_payment_method: parseAsStringEnum(PAYMENT_METHOD_VALUES),
      rf_requester_role: parseAsStringEnum(REQUESTER_ROLE_VALUES),
      rf_date_from: parseAsString,
      rf_date_to: parseAsString,
      rf_search: parseAsString.withDefault(''),
      rf_sort_by: parseAsStringEnum(SORT_BY_VALUES),
      rf_sort_order: parseAsStringEnum(['asc', 'desc']),
      rf_page: parseAsInteger.withDefault(1),
      rf_page_size: parseAsInteger.withDefault(50),
    },
    { history: 'push', shallow: false },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.rf_search, (value) =>
    setFilters({ rf_search: value || null, rf_page: 1 }),
  );

  const queryParams: RefundQueueQuery = {
    status: filters.rf_status ?? undefined,
    payment_method: filters.rf_payment_method ?? undefined,
    requester_role: filters.rf_requester_role ?? undefined,
    date_from: filters.rf_date_from ?? undefined,
    date_to: filters.rf_date_to ?? undefined,
    search: filters.rf_search || undefined,
    sort_by: filters.rf_sort_by ?? undefined,
    sort_order:
      filters.rf_sort_order === 'asc' || filters.rf_sort_order === 'desc'
        ? filters.rf_sort_order
        : undefined,
    page: filters.rf_page,
    page_size: filters.rf_page_size,
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      rf_status: null,
      rf_payment_method: null,
      rf_requester_role: null,
      rf_date_from: null,
      rf_date_to: null,
      rf_search: null,
      rf_page: 1,
    });
  };

  const activeFilterCount =
    [
      filters.rf_status != null,
      filters.rf_payment_method != null,
      filters.rf_requester_role != null,
      filters.rf_date_from != null || filters.rf_date_to != null,
    ].filter(Boolean).length + (filters.rf_search ? 1 : 0);

  return {
    filters,
    setFilters,
    queryParams,
    searchInput,
    setSearchInput,
    clearFilters,
    currentPage: filters.rf_page,
    setCurrentPage: (page: number) => setFilters({ rf_page: page }),
    pageSize: filters.rf_page_size,
    setPageSize: (pageSize: number) => setFilters({ rf_page_size: pageSize, rf_page: 1 }),
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0,
  };
}
