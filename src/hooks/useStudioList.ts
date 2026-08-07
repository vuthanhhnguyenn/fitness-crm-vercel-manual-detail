'use client';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

export function useStudioList() {
  const [params, setParams] = useQueryStates({
    search: parseAsString.withDefault(''),
    store_id: parseAsString.withDefault(''),
    studio_type: parseAsString.withDefault(''),
    brand: parseAsString.withDefault(''),
    status: parseAsString.withDefault(''),
    sort_by: parseAsString.withDefault('id'),
    sort_order: parseAsString.withDefault('asc'),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(50),
  });

  const resetFilters = () => {
    void setParams({
      search: '',
      store_id: '',
      studio_type: '',
      brand: '',
      status: '',
      page: 1,
    });
  };

  return {
    params,
    setParams,
    resetFilters,
  };
}
