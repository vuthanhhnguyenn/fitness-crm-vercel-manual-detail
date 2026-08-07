import { useEffect, useState } from 'react';

import { endOfDay, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { MemberType, StoreListBrand } from '@/lib/api/types.gen';
import type { GetCrmSurveysAnalyticsData } from '@/lib/api/types.gen';

export const SURVEY_ANALYTICS_PERIOD_LABELS = {
  all: '全期間',
  current_month: '今月',
  last_month: '先月',
  last_3_months: '過去3ヶ月',
  last_6_months: '過去6ヶ月',
  last_1_year: '過去1年',
} as const;

export type SurveyAnalyticsPeriod = keyof typeof SURVEY_ANALYTICS_PERIOD_LABELS;

export type SurveyAnalyticsFiltersState = {
  search: string;
  survey_id: string;
  period: SurveyAnalyticsPeriod;
  brand: StoreListBrand | null;
  store_id: string;
  member_type: MemberType | null;
};

function formatSurveyAnalyticsDate(date: Date) {
  return format(date, 'yyyy/MM/dd');
}

export function getSurveyAnalyticsPeriodRange(period: SurveyAnalyticsPeriod) {
  const today = new Date();

  switch (period) {
    case 'current_month':
      return {
        period_from: formatSurveyAnalyticsDate(startOfMonth(today)),
        period_to: formatSurveyAnalyticsDate(endOfDay(today)),
      };
    case 'last_month': {
      const lastMonth = subMonths(today, 1);
      return {
        period_from: formatSurveyAnalyticsDate(startOfMonth(lastMonth)),
        period_to: formatSurveyAnalyticsDate(endOfMonth(lastMonth)),
      };
    }
    case 'last_3_months':
      return {
        period_from: formatSurveyAnalyticsDate(startOfMonth(subMonths(today, 2))),
        period_to: formatSurveyAnalyticsDate(endOfDay(today)),
      };
    case 'last_6_months':
      return {
        period_from: formatSurveyAnalyticsDate(startOfMonth(subMonths(today, 5))),
        period_to: formatSurveyAnalyticsDate(endOfDay(today)),
      };
    case 'last_1_year':
      return {
        period_from: formatSurveyAnalyticsDate(startOfMonth(subMonths(today, 11))),
        period_to: formatSurveyAnalyticsDate(endOfDay(today)),
      };
    case 'all':
    default:
      return undefined;
  }
}

export function useSurveyAnalyticsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      survey_id: parseAsString.withDefault(''),
      period: parseAsString.withDefault('all'),
      brand: parseAsStringEnum(Object.values(StoreListBrand)),
      store_id: parseAsString.withDefault(''),
      member_type: parseAsStringEnum(Object.values(MemberType)),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const [searchInput, setSearchInput] = useState(() => filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput || null });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search, searchInput, setFilters]);

  const updateFilter = <K extends keyof SurveyAnalyticsFiltersState>(
    key: K,
    value: SurveyAnalyticsFiltersState[K],
  ) => {
    setFilters({ [key]: value ?? null } as Parameters<typeof setFilters>[0]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      search: null,
      survey_id: null,
      period: 'all',
      brand: null,
      store_id: null,
      member_type: null,
    });
  };

  const hasActiveFilters =
    filters.search.length > 0 ||
    filters.survey_id.length > 0 ||
    filters.period !== 'all' ||
    filters.brand !== null ||
    filters.store_id.length > 0 ||
    filters.member_type !== null;

  const periodRange = getSurveyAnalyticsPeriodRange(filters.period as SurveyAnalyticsPeriod);

  const queryParams: NonNullable<GetCrmSurveysAnalyticsData['query']> = {
    search: filters.search || undefined,
    survey_id: filters.survey_id || undefined,
    period_from: periodRange?.period_from,
    period_to: periodRange?.period_to,
    brand: filters.brand || undefined,
    store_id: filters.store_id || undefined,
    member_type: filters.member_type || undefined,
  };

  return {
    searchInput,
    setSearchInput,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    queryParams,
  };
}
