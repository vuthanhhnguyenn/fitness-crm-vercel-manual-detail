import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import type { GetCrmBillingRecordsTransactionsData } from '@/lib/api/types.gen';

type TransactionLedgerQuery = NonNullable<GetCrmBillingRecordsTransactionsData['query']>;

const TRANSACTION_TYPE_VALUES = ['sale', 'refund', 'payment', 'repayment'] satisfies Array<
  NonNullable<TransactionLedgerQuery['transaction_type']>
>;
const PAYMENT_METHOD_VALUES = ['sbps', 'jaccs', 'cash', 'other'] satisfies Array<
  NonNullable<TransactionLedgerQuery['payment_method']>
>;

export function useTransactionsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      tf_date_from: parseAsString,
      tf_date_to: parseAsString,
      tf_store_id: parseAsString,
      tf_transaction_type: parseAsStringEnum(TRANSACTION_TYPE_VALUES),
      tf_payment_method: parseAsStringEnum(PAYMENT_METHOD_VALUES),
      tf_search: parseAsString.withDefault(''),
      tf_page: parseAsInteger.withDefault(1),
      tf_page_size: parseAsInteger.withDefault(50),
    },
    { history: 'push', shallow: false },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.tf_search, (value) =>
    setFilters({ tf_search: value || null, tf_page: 1 }),
  );

  const queryParams: TransactionLedgerQuery = {
    date_from: filters.tf_date_from ?? undefined,
    date_to: filters.tf_date_to ?? undefined,
    store_id: filters.tf_store_id ?? undefined,
    transaction_type: filters.tf_transaction_type ?? undefined,
    payment_method: filters.tf_payment_method ?? undefined,
    search: filters.tf_search || undefined,
    page: filters.tf_page,
    page_size: filters.tf_page_size,
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      tf_date_from: null,
      tf_date_to: null,
      tf_store_id: null,
      tf_transaction_type: null,
      tf_payment_method: null,
      tf_search: null,
      tf_page: 1,
    });
  };

  const activeFilterCount = [
    filters.tf_date_from != null,
    filters.tf_date_to != null,
    filters.tf_store_id != null,
    filters.tf_transaction_type != null,
    filters.tf_payment_method != null,
  ].filter(Boolean).length;

  return {
    filters,
    setFilters,
    queryParams,
    searchInput,
    setSearchInput,
    clearFilters,
    currentPage: filters.tf_page,
    setCurrentPage: (page: number) => setFilters({ tf_page: page }),
    pageSize: filters.tf_page_size,
    setPageSize: (pageSize: number) => setFilters({ tf_page_size: pageSize, tf_page: 1 }),
    hasActiveFilters: activeFilterCount > 0 || filters.tf_search.length > 0,
    activeFilterCount,
  };
}
