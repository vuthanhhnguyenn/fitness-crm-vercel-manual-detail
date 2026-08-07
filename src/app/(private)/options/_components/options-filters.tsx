'use client';

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';

import { BRAND_LABELS } from '@/components/common/brand-badge';
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

import { getCrmStoresByIdOptions, getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import { Brand, OptionStatus, OptionType, type Store, StoreListBrand } from '@/lib/api/types.gen';

import { OPTION_STATUS_LABELS, OPTION_TYPE_LABELS } from '../_constants/constants';
import { useOptionsFiltersContext } from '../_contexts/options-filters-context';

interface OptionsFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

const STORE_FILTER_INITIAL_LIMIT = 20;
// Keep store search results fresh while the filter popup is reopened to avoid immediate refetch.
const STORE_FILTER_CACHE_MS = 5 * 60 * 1000;

export function OptionsFilters({ isFilterOpen, onFilterOpenChange }: OptionsFiltersProps) {
  const { filters, searchInput, setSearchInput, updateFilter, hasActiveFilters, clearFilters } =
    useOptionsFiltersContext();

  const [isStorePopoverOpen, setIsStorePopoverOpen] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  const { data: storesRes, isFetching: isStoresFetching } = useQuery({
    ...getCrmStoresOptions({
      query: {
        page: 1,
        limit: STORE_FILTER_INITIAL_LIMIT,
        search: storeSearchQuery || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
    enabled: isFilterOpen && isStorePopoverOpen,
    staleTime: STORE_FILTER_CACHE_MS,
  });

  const stores = storesRes?.stores ?? [];
  const selectedStoreFromOptions = filters.store_id
    ? stores.find((store) => store.id === filters.store_id)
    : undefined;

  const { data: selectedStoreRes } = useQuery({
    ...getCrmStoresByIdOptions({ path: { id: filters.store_id ?? '' } }),
    enabled: isFilterOpen && !!filters.store_id && !selectedStoreFromOptions,
    staleTime: STORE_FILTER_CACHE_MS,
  });

  const selectedStoreLabel = filters.store_id
    ? (selectedStoreFromOptions?.name ?? selectedStoreRes?.store?.name)
    : '全店舗';

  const handleStoreSelect = (store: Store | null) => {
    updateFilter('store_id', store?.id ?? null);
  };

  const activeFilterCount = [
    filters.brand !== null,
    filters.option_type !== null,
    filters.status !== null,
    filters.store_id !== null,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative max-w-100 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="オプション名・コードで検索..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8 rounded-lg pl-9 text-xs"
          />
        </div>
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="ml-auto h-8 gap-1.5 text-xs"
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
          {/* Brand */}
          <Select
            value={filters.brand ?? 'all'}
            onValueChange={(v) => updateFilter('brand', v === 'all' ? null : (v as StoreListBrand))}
          >
            <SelectTrigger size="sm" className="w-fit rounded-lg">
              <SelectValue placeholder="全ブランド">
                {filters.brand ? BRAND_LABELS[filters.brand as unknown as Brand] : '全ブランド'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ブランド</SelectItem>
              {Object.values(StoreListBrand).map((b) => (
                <SelectItem key={b} value={b}>
                  {BRAND_LABELS[b as unknown as Brand]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Option Type */}
          <Select
            value={filters.option_type ?? 'all'}
            onValueChange={(v) =>
              updateFilter('option_type', v === 'all' ? null : (v as OptionType))
            }
          >
            <SelectTrigger size="sm" className="w-fit rounded-lg">
              <SelectValue placeholder="全種別">
                {filters.option_type ? OPTION_TYPE_LABELS[filters.option_type] : '全種別'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全種別</SelectItem>
              {Object.values(OptionType).map((t) => (
                <SelectItem key={t} value={t}>
                  {OPTION_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(v) => updateFilter('status', v === 'all' ? null : (v as OptionStatus))}
          >
            <SelectTrigger size="sm" className="w-fit rounded-lg">
              <SelectValue placeholder="全ステータス">
                {filters.status ? OPTION_STATUS_LABELS[filters.status] : '全ステータス'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ステータス</SelectItem>
              {Object.values(OptionStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {OPTION_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Store */}
          <SearchableSelect
            value={filters.store_id}
            valueLabel={selectedStoreLabel}
            options={stores}
            placeholder="全店舗"
            searchPlaceholder="店舗名・店舗IDで検索..."
            emptyMessage="該当する店舗がありません"
            loadingMessage="店舗を読み込み中..."
            clearLabel="全店舗"
            open={isStorePopoverOpen}
            onOpenChange={setIsStorePopoverOpen}
            onSearchChange={setStoreSearchQuery}
            onSelect={handleStoreSelect}
            getOptionKey={(store) => store.id}
            getOptionLabel={(store) => store.name}
            getOptionKeywords={(store) =>
              [store.name, store.store_id, store.id, store.club_code].filter(Boolean).join(' ')
            }
            renderOption={(store) => (
              <div className="flex min-w-0 flex-col items-start gap-0.5">
                <TextWithTooltip
                  text={store.name}
                  wrapperClassName="w-full"
                  className="w-full"
                  side="right"
                  align="center"
                />
              </div>
            )}
            isLoading={isStoresFetching}
            triggerClassName="h-8 w-64 justify-between rounded-lg px-3 text-xs font-normal"
          />

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground ml-auto h-8 text-xs"
              onClick={clearFilters}
            >
              すべてクリア
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
