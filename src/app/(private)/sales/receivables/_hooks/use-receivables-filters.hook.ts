'use client';

// Client hook: nuqs reads/writes the browser URL search params.
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

export type ReceivablesTab = 'receivable' | 'upcoming';
const TAB_VALUES = ['receivable', 'upcoming'] satisfies ReceivablesTab[];

/**
 * URL-backed filter/pagination state for the receivables screen (未回収一覧 / 翌月請求予定 tabs).
 * Both tabs live on one page (US1/US2 share `receivables/page.tsx`), so each tab's page/pageSize
 * is tracked independently to avoid cross-tab interference.
 */
export function useReceivablesFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      rf_tab: parseAsStringEnum(TAB_VALUES).withDefault('receivable'),
      rf_month: parseAsString,
      rf_page: parseAsInteger.withDefault(1),
      rf_limit: parseAsInteger.withDefault(50),
      rf_upcoming_page: parseAsInteger.withDefault(1),
      rf_upcoming_limit: parseAsInteger.withDefault(50),
    },
    { history: 'push', shallow: false },
  );

  return {
    filters,
    setTab: (tab: ReceivablesTab) => setFilters({ rf_tab: tab, rf_page: 1, rf_upcoming_page: 1 }),
    setMonthFilter: (month: string | null) => setFilters({ rf_month: month, rf_page: 1 }),
    currentPage: filters.rf_page,
    setCurrentPage: (page: number) => setFilters({ rf_page: page }),
    pageSize: filters.rf_limit,
    setPageSize: (limit: number) => setFilters({ rf_limit: limit, rf_page: 1 }),
    upcomingPage: filters.rf_upcoming_page,
    setUpcomingPage: (page: number) => setFilters({ rf_upcoming_page: page }),
    upcomingPageSize: filters.rf_upcoming_limit,
    setUpcomingPageSize: (limit: number) =>
      setFilters({ rf_upcoming_limit: limit, rf_upcoming_page: 1 }),
  };
}
