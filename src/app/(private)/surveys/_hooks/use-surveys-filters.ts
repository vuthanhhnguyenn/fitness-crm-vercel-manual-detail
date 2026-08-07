import { useEffect, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import type { GetCrmSurveysData } from '@/lib/api/types.gen';
import { StoreListBrand, SurveyTemplateStatus, SurveyTemplateType } from '@/lib/api/types.gen';

import { SURVEY_SORT_FIELDS, type SurveySortField } from '../_constants/constants';

export type SurveysFiltersState = {
  page: number;
  limit: number;
  search: string;
  type: SurveyTemplateType | null;
  brand: StoreListBrand | null;
  status: SurveyTemplateStatus | null;
  sort_by: SurveySortField;
  sort_order: 'asc' | 'desc';
};

export function useSurveysFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(PAGE_SIZE),
      search: parseAsString.withDefault(''),
      type: parseAsStringEnum<SurveyTemplateType>(Object.values(SurveyTemplateType)),
      brand: parseAsStringEnum<StoreListBrand>(Object.values(StoreListBrand)),
      status: parseAsStringEnum<SurveyTemplateStatus>(Object.values(SurveyTemplateStatus)),
      sort_by: parseAsStringEnum([...SURVEY_SORT_FIELDS]).withDefault('id'),
      sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('asc'),
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

  const updateFilter = <K extends keyof SurveysFiltersState>(
    key: K,
    value: SurveysFiltersState[K],
  ) => {
    setFilters({ [key]: value ?? null, page: 1 } as Parameters<typeof setFilters>[0]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: PAGE_SIZE,
      search: null,
      type: null,
      brand: null,
      status: null,
      sort_by: 'id',
      sort_order: 'asc',
    });
  };

  const hasActiveFilters =
    filters.search.length > 0 ||
    filters.type !== null ||
    filters.brand !== null ||
    filters.status !== null;

  const queryParams: NonNullable<GetCrmSurveysData['query']> = {
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    type: filters.type || undefined,
    brand: filters.brand || undefined,
    status: filters.status || undefined,
    sort_by: filters.sort_by as SurveySortField,
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
    queryParams,
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: filters.limit,
    setPageSize: (nextLimit: number) => setFilters({ limit: nextLimit, page: 1 }),
  };
}
