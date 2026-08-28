import { PAGE_SIZE } from '@/constants/app.constants';
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import { BrandEnum } from '@/lib/api/types.gen';
import type { GetCrmCampaignsData } from '@/lib/api/types.gen';

import { CAMPAIGN_ACCEPT_STATE_VALUES } from '../_constants/constants';

type CampaignsQuery = NonNullable<GetCrmCampaignsData['query']>;

const CAMPAIGN_BRANDS = Object.values(BrandEnum) as NonNullable<CampaignsQuery['brandEnum']>[];

const CAMPAIGN_SORT_FIELDS = [
  'id',
  'createdAt',
  'updatedAt',
  'name',
  'recruitmentStart',
  'recruitmentEnd',
] as const satisfies readonly NonNullable<CampaignsQuery['sort']>[];

export type CampaignsFiltersState = {
  page: number;
  limit: number;
  nameQuery: string;
  brandEnum: CampaignsQuery['brandEnum'] | null;
  acceptState: CampaignsQuery['acceptState'] | null;
  recruitmentFrom: string;
  recruitmentTo: string;
  sort: NonNullable<CampaignsQuery['sort']>;
  order: NonNullable<CampaignsQuery['order']>;
};

export function useCampaignsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(PAGE_SIZE),
      nameQuery: parseAsString.withDefault(''),
      brandEnum: parseAsStringEnum(CAMPAIGN_BRANDS),
      acceptState: parseAsStringEnum([...CAMPAIGN_ACCEPT_STATE_VALUES]),
      recruitmentFrom: parseAsString.withDefault(''),
      recruitmentTo: parseAsString.withDefault(''),
      sort: parseAsStringEnum([...CAMPAIGN_SORT_FIELDS]).withDefault('createdAt'),
      order: parseAsStringEnum(['asc', 'desc'] as const).withDefault('desc'),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.nameQuery, (value) =>
    setFilters({ nameQuery: value || null, page: 1 }),
  );

  const updateFilter = <K extends keyof CampaignsFiltersState>(
    key: K,
    value: CampaignsFiltersState[K],
  ) => {
    setFilters({ [key]: value === '' ? null : (value ?? null), page: 1 } as Parameters<
      typeof setFilters
    >[0]);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: PAGE_SIZE,
      nameQuery: null,
      brandEnum: null,
      acceptState: null,
      recruitmentFrom: null,
      recruitmentTo: null,
      sort: 'createdAt',
      order: 'desc',
    });
  };

  /** 詳細フィルターのバッジ件数 (V0 `activeFilterCount`, campaign-list.tsx:L112-114)。検索語は含めない。 */
  const activeFilterCount = [
    filters.brandEnum,
    filters.acceptState,
    filters.recruitmentFrom || null,
    filters.recruitmentTo || null,
  ].filter((value) => value !== null).length;

  const hasActiveFilters: boolean = activeFilterCount > 0 || filters.nameQuery.length > 0;

  const queryParams: CampaignsQuery = {
    page: filters.page,
    limit: filters.limit,
    nameQuery: filters.nameQuery || undefined,
    brandEnum: filters.brandEnum || undefined,
    acceptState: filters.acceptState || undefined,
    recruitmentFrom: filters.recruitmentFrom || undefined,
    recruitmentTo: filters.recruitmentTo || undefined,
    sort: filters.sort,
    order: filters.order,
  };

  return {
    searchInput,
    setSearchInput,
    filters,
    updateFilter,
    setFilters,
    clearFilters,
    activeFilterCount,
    hasActiveFilters,
    queryParams,
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: filters.limit,
    setPageSize: (nextPageSize: number) => setFilters({ limit: nextPageSize, page: 1 }),
  };
}

export type CampaignsFiltersHook = ReturnType<typeof useCampaignsFilters>;
