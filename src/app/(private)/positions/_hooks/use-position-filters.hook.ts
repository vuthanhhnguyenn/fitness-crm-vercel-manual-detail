import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import type { GetCrmPositionsData } from '@/lib/api/types.gen';

import {
  POSITION_PERMISSION_CATEGORIES,
  type PositionPermissionKey,
} from '../_constants/position-permissions.constant';
import {
  POSITION_DEFAULT_PAGE_SIZE,
  POSITION_PAGE_SIZE_OPTIONS,
} from '../_constants/position.constants';

type PositionQuery = NonNullable<GetCrmPositionsData['query']>;

const PERMISSION_KEY_VALUES = POSITION_PERMISSION_CATEGORIES.flatMap((category) =>
  category.permissions.map((permission) => permission.key),
);

export function usePositionFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      permission: parseAsStringEnum<PositionPermissionKey>(PERMISSION_KEY_VALUES),
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(POSITION_DEFAULT_PAGE_SIZE),
      // V0 deep-link parameter: preselects the preview pane (PAR021)
      positionId: parseAsInteger,
    },
    { history: 'push', shallow: false },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.search, (value) =>
    setFilters({ search: value || null, page: 1 }),
  );

  const normalizedPageSize = (POSITION_PAGE_SIZE_OPTIONS as readonly number[]).includes(
    filters.limit,
  )
    ? filters.limit
    : POSITION_DEFAULT_PAGE_SIZE;

  const queryParams: PositionQuery = {
    search: filters.search || undefined,
    permission: filters.permission ?? undefined,
    includeTotalAll: true,
    page: filters.page,
    limit: normalizedPageSize,
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ search: null, permission: null, page: 1 });
  };

  return {
    filters,
    queryParams,
    searchInput,
    setSearchInput,
    clearFilters,
    currentPage: filters.page,
    setCurrentPage: (page: number) => setFilters({ page }),
    setPageSize: (limit: number) => setFilters({ limit, page: 1 }),
    pageSize: normalizedPageSize,
    permission: filters.permission,
    setPermission: (key: PositionPermissionKey | null) => setFilters({ permission: key, page: 1 }),
    selectedPositionId: filters.positionId,
    setSelectedPositionId: (id: number | null) => setFilters({ positionId: id }),
    hasActiveConditions: filters.search.length > 0 || filters.permission != null,
  };
}
