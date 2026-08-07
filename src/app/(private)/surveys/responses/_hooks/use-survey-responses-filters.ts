import { useEffect, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { MemberType, StoreListBrand, SurveyTemplateType } from '@/lib/api/types.gen';
import type { GetCrmSurveysResponsesData } from '@/lib/api/types.gen';

export type SurveyResponsesFiltersState = {
  page: number;
  limit: number;
  search: string;
  survey_id: string;
  period_from: string;
  period_to: string;
  brand: StoreListBrand | null;
  store_id: string;
  template_type: SurveyTemplateType | null;
  member_type: MemberType | null;
};

export function useSurveyResponsesFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(PAGE_SIZE),
      search: parseAsString.withDefault(''),
      survey_id: parseAsString.withDefault(''),
      period_from: parseAsString.withDefault(''),
      period_to: parseAsString.withDefault(''),
      brand: parseAsStringEnum(Object.values(StoreListBrand)),
      store_id: parseAsString.withDefault(''),
      template_type: parseAsStringEnum(Object.values(SurveyTemplateType)),
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
        setFilters({ search: searchInput || null, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search, searchInput, setFilters]);

  const updateFilter = <K extends keyof SurveyResponsesFiltersState>(
    key: K,
    value: SurveyResponsesFiltersState[K],
  ) => {
    setFilters({ [key]: value ?? null, page: 1 } as Parameters<typeof setFilters>[0]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: PAGE_SIZE,
      search: null,
      survey_id: null,
      period_from: null,
      period_to: null,
      brand: null,
      store_id: null,
      template_type: null,
      member_type: null,
    });
  };

  const hasActiveFilters =
    filters.search.length > 0 ||
    filters.survey_id.length > 0 ||
    filters.period_from.length > 0 ||
    filters.period_to.length > 0 ||
    filters.brand !== null ||
    filters.store_id.length > 0 ||
    filters.template_type !== null ||
    filters.member_type !== null;

  const queryParams: NonNullable<GetCrmSurveysResponsesData['query']> = {
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    survey_id: filters.survey_id || undefined,
    period_from: filters.period_from || undefined,
    period_to: filters.period_to || undefined,
    brand: filters.brand || undefined,
    store_id: filters.store_id || undefined,
    template_type: filters.template_type || undefined,
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
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: filters.limit,
    setPageSize: (nextLimit: number) => setFilters({ limit: nextLimit, page: 1 }),
  };
}
