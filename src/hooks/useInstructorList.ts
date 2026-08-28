'use client';

import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

export function useInstructorList() {
  const [params, setParams] = useQueryStates({
    tab: parseAsStringEnum(['studio', 'pt']).withDefault('studio'),
    search: parseAsString.withDefault(''),
    role: parseAsString.withDefault(''),
    brand: parseAsString.withDefault(''),
    status: parseAsString.withDefault(''),
  });

  const resetFilters = () => {
    void setParams({ search: '', role: '', brand: '', status: '' });
  };

  return { params, setParams, resetFilters };
}
