'use client';

import { useMemo, useState } from 'react';

import { useInfiniteQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';

import { SearchableSelect } from '@/components/common/searchable-select';
import { TextWithTooltip } from '@/components/common/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  getCrmMainContractsInfiniteOptions,
  getCrmStoresInfiniteOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import {
  type GetCrmMainContractsResponse,
  type GetCrmStoresResponse,
  MainBrand,
  type Store,
} from '@/lib/api/types.gen';

import {
  BRAND_GROUP_LABELS,
  JOIN_PERIOD_LABELS,
  LAST_VISIT_LABELS,
  MEMBER_STATUS_FILTER_OPTIONS,
} from '../_constants/constants';
import { useMembersFiltersContext } from '../_contexts/members-filters-context';

type ContractItem = GetCrmMainContractsResponse['main_contracts'][number];

interface MembersFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

// nuqs treats '' as null; use a sentinel for the "all" option
const ALL = 'all';

export function MembersFilters({ isFilterOpen, onFilterOpenChange }: MembersFiltersProps) {
  const {
    filters,
    searchInput,
    setSearchInput,
    updateFilter,
    isAllStoresScope,
    selectStoreFilter,
    selectContractFilter,
    storeFilterLabel,
    contractFilterLabel,
    promoCodeOptions,
    promoCodeLabel,
  } = useMembersFiltersContext();

  const {
    main_contract_id,
    status_group,
    brand_group,
    store_id,
    join_period,
    last_visit,
    promo_code,
  } = filters;

  const selectedStoreId = store_id[0] ?? null;
  const selectedContractId = main_contract_id[0] ?? null;

  // --- 店舗 (store) searchable filter ---
  const [storeOpen, setStoreOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const {
    data: storesData,
    isFetching: isStoresFetching,
    fetchNextPage: fetchNextStores,
    hasNextPage: hasMoreStores,
    isFetchingNextPage: isFetchingMoreStores,
  } = useInfiniteQuery({
    ...getCrmStoresInfiniteOptions({
      query: {
        limit: 20,
        search: storeSearch || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
    enabled: isAllStoresScope && isFilterOpen && storeOpen,
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetCrmStoresResponse, allPages) => {
      const currentPage = allPages.length;
      const totalPages = lastPage.pagination?.total_pages ?? 0;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
  const stores = useMemo(
    () => storesData?.pages.flatMap((page) => page.stores ?? []) ?? [],
    [storesData],
  );

  // --- 主契約プラン (main contract) searchable filter ---
  const [contractOpen, setContractOpen] = useState(false);
  const [contractSearch, setContractSearch] = useState('');
  const {
    data: contractsData,
    isFetching: isContractsFetching,
    fetchNextPage: fetchNextContracts,
    hasNextPage: hasMoreContracts,
    isFetchingNextPage: isFetchingMoreContracts,
  } = useInfiniteQuery({
    ...getCrmMainContractsInfiniteOptions({
      query: { limit: 20, search: contractSearch || undefined },
    }),
    enabled: isFilterOpen && contractOpen,
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetCrmMainContractsResponse, allPages) => {
      const currentPage = allPages.length;
      const totalPages = lastPage.pagination?.total_pages ?? 0;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
  const contracts = useMemo(
    () => contractsData?.pages.flatMap((page) => page.main_contracts ?? []) ?? [],
    [contractsData],
  );

  const activeFilterCount = [
    isAllStoresScope && store_id.length > 0,
    status_group !== null,
    main_contract_id.length > 0,
    brand_group.length > 0,
    join_period !== null,
    last_visit !== null,
    promo_code !== null,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-[400px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="会員ID・氏名・カナ・電話番号・メールアドレス・旧会員Noで検索"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8 pl-9 text-xs"
          />
        </div>
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="ml-auto h-8 gap-1 text-xs"
          onClick={() => onFilterOpenChange(!isFilterOpen)}
        >
          <SlidersHorizontal className="size-4" />
          {isFilterOpen ? '閉じる' : '詳細フィルター'}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 px-1 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
          {isFilterOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </Button>
      </div>

      {isFilterOpen && (
        <div className="flex flex-wrap items-center gap-2">
          {/* 店舗 — only when browsing the header's "全店舗" scope (a specific header
              store already scopes the whole list, so a page-local store filter would
              be redundant/overridden). */}
          {isAllStoresScope && (
            <SearchableSelect<Store>
              value={selectedStoreId}
              valueLabel={storeFilterLabel ?? '全店舗'}
              options={stores}
              placeholder="全店舗"
              searchPlaceholder="店舗名・店舗IDで検索..."
              emptyMessage="該当する店舗がありません"
              loadingMessage="店舗を読み込み中..."
              clearLabel="全店舗"
              open={storeOpen}
              onOpenChange={setStoreOpen}
              onSearchChange={setStoreSearch}
              onSelect={(store) => selectStoreFilter(store)}
              getOptionKey={(store) => store.id}
              getOptionLabel={(store) => store.name}
              getOptionKeywords={(store) =>
                [store.name, store.store_id, store.id, store.club_code].filter(Boolean).join(' ')
              }
              renderOption={(store) => (
                <TextWithTooltip
                  text={store.name}
                  wrapperClassName="w-full"
                  className="w-full"
                  side="right"
                  align="center"
                />
              )}
              isLoading={isStoresFetching}
              hasMore={hasMoreStores}
              isLoadingMore={isFetchingMoreStores}
              onLoadMore={fetchNextStores}
              loadingMoreMessage="読み込み中..."
              triggerClassName={`h-8 w-[160px] text-xs ${filterActiveClass(store_id.length > 0)}`}
              contentClassName="min-w-[280px]"
            />
          )}

          {/* ステータス — 4 grouped options + ゲートストップ. Each option expands to the
              DB statuses it covers; ゲートストップ instead sends `has_gate_stop` (it is
              orthogonal to status), so it also returns e.g. 休会中 members. */}
          <Select
            value={status_group ?? ALL}
            onValueChange={(value) => updateFilter('status_group', value === ALL ? null : value)}
          >
            <SelectTrigger
              className={`h-8 w-[140px] text-xs ${filterActiveClass(status_group !== null)}`}
            >
              <SelectValue>
                {MEMBER_STATUS_FILTER_OPTIONS.find((option) => option.value === status_group)
                  ?.label ?? '全ステータス'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全ステータス</SelectItem>
              {MEMBER_STATUS_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 主契約プラン */}
          <SearchableSelect<ContractItem>
            value={selectedContractId}
            valueLabel={contractFilterLabel ?? '全プラン'}
            options={contracts}
            placeholder="全プラン"
            searchPlaceholder="プラン名・コードで検索..."
            emptyMessage="該当するプランがありません"
            loadingMessage="プランを読み込み中..."
            clearLabel="全プラン"
            open={contractOpen}
            onOpenChange={setContractOpen}
            onSearchChange={setContractSearch}
            onSelect={(contract) => selectContractFilter(contract)}
            getOptionKey={(contract) => contract.id}
            getOptionLabel={(contract) => contract.name}
            getOptionKeywords={(contract) =>
              [contract.name, contract.code, contract.id].filter(Boolean).join(' ')
            }
            renderOption={(contract) => (
              <TextWithTooltip
                text={contract.name}
                wrapperClassName="w-full"
                className="w-full"
                side="right"
                align="center"
              />
            )}
            isLoading={isContractsFetching}
            hasMore={hasMoreContracts}
            isLoadingMore={isFetchingMoreContracts}
            onLoadMore={fetchNextContracts}
            loadingMoreMessage="読み込み中..."
            triggerClassName={`h-8 w-[160px] text-xs ${filterActiveClass(main_contract_id.length > 0)}`}
            contentClassName="min-w-[280px]"
          />

          {/* ブランド — the brand GROUP axis (JOYFIT / FIT365). Store sub-brands
              (JOYFIT24, JOYFIT+, …) are a different axis and are not offered here. */}
          <Select
            value={brand_group.length > 0 ? brand_group[0] : ALL}
            onValueChange={(value) =>
              updateFilter('brand_group', value === ALL ? [] : [value as MainBrand])
            }
          >
            <SelectTrigger
              className={`h-8 w-[140px] text-xs ${filterActiveClass(brand_group.length > 0)}`}
            >
              <SelectValue>
                {brand_group.length > 0
                  ? BRAND_GROUP_LABELS[brand_group[0] as MainBrand]
                  : '全ブランド'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全ブランド</SelectItem>
              {Object.entries(BRAND_GROUP_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 入会期間 */}
          <Select
            value={join_period ?? ALL}
            onValueChange={(value) => updateFilter('join_period', value === ALL ? null : value)}
          >
            <SelectTrigger
              className={`h-8 w-[140px] text-xs ${filterActiveClass(join_period !== null)}`}
            >
              <SelectValue>
                {join_period ? (JOIN_PERIOD_LABELS[join_period] ?? '全期間') : '全期間'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全期間</SelectItem>
              {Object.entries(JOIN_PERIOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 最終来館日 */}
          <Select
            value={last_visit ?? ALL}
            onValueChange={(value) => updateFilter('last_visit', value === ALL ? null : value)}
          >
            <SelectTrigger
              className={`h-8 w-[180px] text-xs ${filterActiveClass(last_visit !== null)}`}
            >
              <SelectValue>
                {last_visit
                  ? (LAST_VISIT_LABELS[last_visit] ?? '全期間（最終来館日）')
                  : '全期間（最終来館日）'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全期間（最終来館日）</SelectItem>
              {Object.entries(LAST_VISIT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* プロモコード — options come from the campaign master; the screen shows
              the campaign name but the filter sends the CODE (G-06 FR-011). */}
          <Select
            value={promo_code ?? ALL}
            onValueChange={(value) => updateFilter('promo_code', value === ALL ? null : value)}
          >
            <SelectTrigger
              className={`h-8 w-fit max-w-[240px] min-w-[140px] text-xs ${filterActiveClass(
                promo_code !== null,
              )}`}
            >
              <SelectValue>{promoCodeLabel ?? '全プロモコード'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全プロモコード</SelectItem>
              {promoCodeOptions.map((option) => (
                <SelectItem key={option.code} value={option.code}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
