import { useMemo, useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { ALL_STORES, useCurrentStore } from '@/contexts/current-store.context';
import { useQuery } from '@tanstack/react-query';
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs';

import { useDebouncedUrlSearch } from '@/hooks/use-debounced-url-search.hook';

import {
  getCrmCampaignsOptions,
  getCrmMainContractsByIdOptions,
  getCrmStoresByIdOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmMembersData } from '@/lib/api/types.gen';
import { MainBrand } from '@/lib/api/types.gen';

import {
  MEMBER_STATUS_FILTER_GATE_STOP,
  MEMBER_STATUS_FILTER_OPTIONS,
} from '../_constants/constants';
import { joinPeriodToRange, lastVisitToRange } from '../_utils/filter-ranges';

export type MembersFilters = {
  page: number;
  limit: number;
  search: string;
  main_contract_id: string[];
  /**
   * One of `MEMBER_STATUS_FILTER_OPTIONS`, not a raw `MemberStatus`: the screen
   * offers 4 grouped options plus ゲートストップ, and each is expanded into the DB
   * statuses (or into `has_gate_stop`) when the query is built.
   */
  status_group: string | null;
  brand_group: MainBrand[];
  store_id: string[];
  join_period: string | null;
  last_visit: string | null;
  promo_code: string | null;
  has_unpaid: boolean | null;
  sort_by: string;
  sort_order: 'asc' | 'desc';
};

export function useMembersFilters() {
  // Header store scope: a specific store selected in the header switcher scopes
  // the whole list to it; only when the header is "全店舗" does the page-local
  // 店舗 filter apply.
  const { currentStoreId } = useCurrentStore();
  const isAllStoresScope = currentStoreId === ALL_STORES;

  // Use nuqs for URL query parameters
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(PAGE_SIZE),
      search: parseAsString.withDefault(''),
      main_contract_id: parseAsArrayOf(parseAsString).withDefault([]),
      status_group: parseAsStringEnum<string>(
        MEMBER_STATUS_FILTER_OPTIONS.map((option) => option.value),
      ),
      brand_group: parseAsArrayOf(
        parseAsStringEnum<MainBrand>(Object.values(MainBrand)),
      ).withDefault([]),
      store_id: parseAsArrayOf(parseAsString).withDefault([]),
      join_period: parseAsString,
      last_visit: parseAsString,
      promo_code: parseAsString,
      has_unpaid: parseAsBoolean,
      sort_by: parseAsString.withDefault('member_number'),
      sort_order: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('asc'),
    },
    {
      history: 'push',
      shallow: false,
    },
  );

  const { searchInput, setSearchInput } = useDebouncedUrlSearch(filters.search, (value) =>
    setFilters({ search: value || null, page: 1 }),
  );

  const [storeFilterPick, setStoreFilterPick] = useState<{ id: string; name: string } | null>(null);
  const [contractFilterPick, setContractFilterPick] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const updateFilter = <K extends keyof MembersFilters>(key: K, value: MembersFilters[K]) => {
    const pageReset = { page: 1 } as const;
    if (key === 'main_contract_id' || key === 'brand_group' || key === 'store_id') {
      const arrValue = value as string[];
      setFilters({
        [key]: arrValue.length > 0 ? arrValue : null,
        ...pageReset,
      } as Parameters<typeof setFilters>[0]);
    } else if (
      key === 'status_group' ||
      key === 'join_period' ||
      key === 'last_visit' ||
      key === 'promo_code' ||
      key === 'has_unpaid'
    ) {
      setFilters({ [key]: value ?? null, ...pageReset } as Parameters<typeof setFilters>[0]);
    } else {
      setFilters({ [key]: value, ...pageReset } as Parameters<typeof setFilters>[0]);
    }
  };

  // Pick a store/contract filter and remember its name in one step, so the label
  // is available immediately without a by-id round-trip.
  const selectStoreFilter = (store: { id: string; name: string } | null) => {
    setStoreFilterPick(store ? { id: store.id, name: store.name } : null);
    updateFilter('store_id', store ? [store.id] : []);
  };
  const selectContractFilter = (contract: { id: string; name: string } | null) => {
    setContractFilterPick(contract ? { id: contract.id, name: contract.name } : null);
    updateFilter('main_contract_id', contract ? [contract.id] : []);
  };

  const clearFilters = () => {
    setSearchInput('');
    setStoreFilterPick(null);
    setContractFilterPick(null);
    setFilters({
      page: 1,
      search: null,
      main_contract_id: null,
      status_group: null,
      brand_group: null,
      store_id: null,
      join_period: null,
      last_visit: null,
      promo_code: null,
      has_unpaid: null,
      sort_by: 'member_number',
      sort_order: 'asc',
    });
  };

  const hasActiveFilters: boolean =
    filters.main_contract_id.length > 0 ||
    filters.status_group !== null ||
    filters.brand_group.length > 0 ||
    (isAllStoresScope && filters.store_id.length > 0) ||
    filters.join_period !== null ||
    filters.last_visit !== null ||
    filters.promo_code !== null ||
    filters.has_unpaid !== null ||
    filters.search.length > 0;

  // A specific header store wins; when the header is "全店舗" the page-local
  // store filter (if any) takes over.
  const effectiveStoreId = isAllStoresScope ? (filters.store_id[0] ?? undefined) : currentStoreId;

  // Single source of truth for the active filter labels (trigger + banner).
  // The by-id lookup runs ONLY on deep-link/refresh — when an id is in the URL
  // but we never captured its name via selectStoreFilter/selectContractFilter.
  const storeFilterId = filters.store_id[0] ?? null;
  // Use the remembered name only when it matches the current filter id.
  const storeNameFromPick = storeFilterPick?.id === storeFilterId ? storeFilterPick.name : null;
  const { data: storeByIdRes } = useQuery({
    ...getCrmStoresByIdOptions({ path: { id: storeFilterId ?? '' } }),
    enabled: isAllStoresScope && !!storeFilterId && !storeNameFromPick,
  });
  const storeFilterLabel = storeFilterId
    ? (storeNameFromPick ?? storeByIdRes?.store?.name ?? storeFilterId)
    : null;

  const contractFilterId = filters.main_contract_id[0] ?? null;
  const contractNameFromPick =
    contractFilterPick?.id === contractFilterId ? contractFilterPick.name : null;
  const { data: contractByIdRes } = useQuery({
    ...getCrmMainContractsByIdOptions({ path: { id: contractFilterId ?? '' } }),
    enabled: !!contractFilterId && !contractNameFromPick,
  });
  const contractFilterLabel = contractFilterId
    ? (contractNameFromPick ?? contractByIdRes?.main_contract?.name ?? contractFilterId)
    : null;

  // プロモコード options come from the campaign master: the filter travels as the
  // campaign CODE, while the dropdown and the result banner show its name
  // (QA01 §4-3). Kept here so the trigger and the banner cannot disagree.
  const { data: campaignsRes } = useQuery(getCrmCampaignsOptions({ query: { limit: 200 } }));
  const promoCodeOptions = useMemo(
    () =>
      (campaignsRes?.items ?? []).flatMap((campaign) =>
        campaign.campaignCode ? [{ code: campaign.campaignCode, name: campaign.name }] : [],
      ),
    [campaignsRes],
  );
  const promoCodeLabel = filters.promo_code
    ? (promoCodeOptions.find((option) => option.code === filters.promo_code)?.name ??
      filters.promo_code)
    : null;

  // ゲートストップ is not a status: it sends `has_gate_stop` and no `status`, so it
  // matches gate-stopped members whatever their own status is. Every other option
  // fans out to the DB statuses it groups.
  const selectedStatusGroup = MEMBER_STATUS_FILTER_OPTIONS.find(
    (option) => option.value === filters.status_group,
  );
  const isGateStopFilter = filters.status_group === MEMBER_STATUS_FILTER_GATE_STOP;

  const queryParams: NonNullable<GetCrmMembersData['query']> = {
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    main_contract_id: filters.main_contract_id.length > 0 ? filters.main_contract_id : undefined,
    status: selectedStatusGroup?.statuses.length ? selectedStatusGroup.statuses : undefined,
    has_gate_stop: isGateStopFilter ? true : undefined,
    brand_group: filters.brand_group.length > 0 ? filters.brand_group : undefined,
    store_id: effectiveStoreId ? [effectiveStoreId] : undefined,
    ...joinPeriodToRange(filters.join_period),
    ...lastVisitToRange(filters.last_visit),
    promo_code: filters.promo_code ?? undefined,
    has_unpaid: filters.has_unpaid ?? undefined,
    sort_by: filters.sort_by as NonNullable<GetCrmMembersData['query']>['sort_by'],
    sort_order: filters.sort_order,
  };

  return {
    // Search input (local state for debouncing)
    searchInput,
    setSearchInput,
    // Filters from URL
    filters,
    // Update functions
    updateFilter,
    setFilters,
    clearFilters,
    // Computed
    hasActiveFilters,
    queryParams,
    // Header store scope (drives whether the page-local 店舗 filter is shown)
    isAllStoresScope,
    selectStoreFilter,
    selectContractFilter,
    storeFilterLabel,
    contractFilterLabel,
    promoCodeOptions,
    promoCodeLabel,
    // Sort helpers
    handleSortChange: (field: string, order: 'asc' | 'desc') => {
      setFilters({ sort_by: field, sort_order: order });
    },
    handleSearchExecute: () => {
      setFilters({ search: searchInput || null, page: 1 });
    },
    currentPage: filters.page,
    setCurrentPage: (nextPage: number) => setFilters({ page: nextPage }),
    pageSize: filters.limit,
    setPageSize: (nextSize: number) => setFilters({ limit: nextSize, page: 1 }),
  };
}
