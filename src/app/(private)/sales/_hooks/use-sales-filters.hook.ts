import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import type { GetCrmBillingRecordsData } from '@/lib/api/types.gen';

type BillingRecordsQuery = NonNullable<GetCrmBillingRecordsData['query']>;

const BILLING_TYPE_VALUES = ['monthly', 'ad_hoc', 'manual'] satisfies Array<
  NonNullable<BillingRecordsQuery['billing_type']>
>;
const CONFIRMATION_STATUS_VALUES = ['unconfirmed', 'confirmed'] satisfies Array<
  NonNullable<BillingRecordsQuery['confirmation_status']>
>;
const SORT_BY_VALUES = [
  'billing_date',
  'billed_amount',
  'outstanding_amount',
  'id',
  'store_name',
  'member_name',
  'billing_type',
  'payment_method',
  'confirmation_status',
] satisfies Array<NonNullable<BillingRecordsQuery['sort_by']>>;

function currentBillingMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function useSalesFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      sf_month: parseAsString.withDefault(currentBillingMonth()),
      sf_store_id: parseAsString,
      sf_billing_type: parseAsStringEnum(BILLING_TYPE_VALUES),
      sf_confirmation_status: parseAsStringEnum(CONFIRMATION_STATUS_VALUES),
      sf_unpaid_only: parseAsBoolean.withDefault(false),
      sf_search: parseAsString.withDefault(''),
      sf_sort_by: parseAsStringEnum(SORT_BY_VALUES),
      sf_sort_order: parseAsStringEnum(['asc', 'desc']),
      sf_page: parseAsInteger.withDefault(1),
      sf_limit: parseAsInteger.withDefault(20),
    },
    { history: 'push', shallow: false },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.sf_search, (value) =>
    setFilters({ sf_search: value || null, sf_page: 1 }),
  );

  const queryParams: BillingRecordsQuery = {
    billing_month: filters.sf_month,
    store_id: filters.sf_store_id ?? undefined,
    billing_type: filters.sf_billing_type ?? undefined,
    confirmation_status: filters.sf_confirmation_status ?? undefined,
    unpaid_only: filters.sf_unpaid_only || undefined,
    search: filters.sf_search || undefined,
    sort_by: filters.sf_sort_by ?? undefined,
    sort_order:
      filters.sf_sort_order === 'asc' || filters.sf_sort_order === 'desc'
        ? filters.sf_sort_order
        : undefined,
    page: filters.sf_page,
    limit: filters.sf_limit,
  };

  const clearFilterSelects = () => {
    setFilters({
      sf_store_id: null,
      sf_billing_type: null,
      sf_confirmation_status: null,
      sf_unpaid_only: false,
      sf_page: 1,
    });
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      sf_store_id: null,
      sf_billing_type: null,
      sf_confirmation_status: null,
      sf_unpaid_only: false,
      sf_search: null,
      sf_page: 1,
    });
  };

  const activeFilterCount = [
    filters.sf_store_id != null,
    filters.sf_billing_type != null,
    filters.sf_confirmation_status != null,
    filters.sf_unpaid_only,
  ].filter(Boolean).length;

  return {
    filters,
    setFilters,
    queryParams,
    searchInput,
    setSearchInput,
    clearFilters,
    clearFilterSelects,
    currentPage: filters.sf_page,
    setCurrentPage: (page: number) => setFilters({ sf_page: page }),
    pageSize: filters.sf_limit,
    setPageSize: (limit: number) => setFilters({ sf_limit: limit, sf_page: 1 }),
    hasActiveFilters: activeFilterCount > 0 || filters.sf_search.length > 0,
    activeFilterCount,
  };
}
