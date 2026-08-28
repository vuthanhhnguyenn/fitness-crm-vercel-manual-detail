'use client';

import { useState } from 'react';

import { ALL_STORES, useCurrentStore } from '@/contexts/current-store.context';
import { toSelectItems } from '@/utils/app.util';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';

import { SearchableSelect } from '@/components/common/searchable-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { Store } from '@/lib/api/types.gen';

import { StudioSearch } from './studio-search';

const filterActiveClass = (value: string) =>
  value ? 'border-primary bg-primary/10 text-foreground' : '';

const TYPE_OPTIONS = [
  { value: '', label: '全区分' },
  { value: 'studio-lesson', label: 'スタジオレッスン用' },
  { value: 'pt', label: 'PT用' },
  { value: 'body-care', label: 'ボディケア用' },
];

const BRAND_OPTIONS = [
  { value: '', label: '全ブランド' },
  { value: 'joyfit', label: 'JOYFIT' },
  { value: 'fit365', label: 'FIT365' },
  { value: 'joyfit24', label: 'JOYFIT24' },
  { value: 'joyfit_yoga', label: 'JOYFIT YOGA' },
  { value: 'joyfit_plus', label: 'JOYFIT+' },
];

const STATUS_OPTIONS = [
  { value: '', label: '全ステータス' },
  { value: 'active', label: '有効' },
  { value: 'inactive', label: '無効' },
];

const TYPE_ITEMS = toSelectItems(TYPE_OPTIONS);
const BRAND_ITEMS = toSelectItems(BRAND_OPTIONS);
const STATUS_ITEMS = toSelectItems(STATUS_OPTIONS);

// toSelectItems keys the "empty" option by its label, so the first key of each
// map is the sentinel used for the unselected/"all" state.
const TYPE_ALL_KEY = Object.keys(TYPE_ITEMS)[0];
const BRAND_ALL_KEY = Object.keys(BRAND_ITEMS)[0];
const STATUS_ALL_KEY = Object.keys(STATUS_ITEMS)[0];

interface StudioFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  storeId: string;
  onStoreIdChange: (value: string) => void;
  studioType: string;
  onStudioTypeChange: (value: string) => void;
  brand: string;
  onBrandChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  activeFilterCount: number;
  onClearFilters: () => void;
}

export function StudioFilters({
  search,
  onSearchChange,
  storeId,
  onStoreIdChange,
  studioType,
  onStudioTypeChange,
  brand,
  onBrandChange,
  status,
  onStatusChange,
  activeFilterCount,
  onClearFilters,
}: StudioFiltersProps) {
  const [filterExpanded, setFilterExpanded] = useState(false);

  // FR-001-05: the store filter is shown only for users who can access 2+ stores
  // and are currently viewing the header's "全店舗" scope — mirrors
  // entry-exit-history-filters.tsx's showStoreFilter logic.
  const { currentStoreId } = useCurrentStore();
  const isAllStoresScope = currentStoreId === ALL_STORES;
  const { data: probeData } = useQuery({
    ...getCrmStoresOptions({ query: { page: 1, limit: 2, sort_by: 'name', sort_order: 'asc' } }),
    enabled: isAllStoresScope,
  });
  const showStoreFilter = isAllStoresScope && (probeData?.pagination.total ?? 0) >= 2;

  const [storeSelectOpen, setStoreSelectOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const { data: storeData, isFetching: isStoreFetching } = useQuery({
    ...getCrmStoresOptions({
      query: {
        page: 1,
        limit: 20,
        search: (storeSelectOpen ? storeSearch : storeId) || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
    enabled: showStoreFilter && (storeSelectOpen || !!storeId),
  });
  const stores = storeData?.stores ?? [];
  const selectedStoreForDisplay =
    stores.find((store) => store.id === storeId) ??
    (selectedStore?.id === storeId ? selectedStore : undefined);

  return (
    <div className="space-y-3 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <StudioSearch value={search} onChange={onSearchChange} />
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={() => setFilterExpanded(!filterExpanded)}
        >
          <SlidersHorizontal className="size-4" />
          詳細フィルター
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 px-1 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
          {filterExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </Button>
      </div>

      {filterExpanded && (
        <div className="flex flex-wrap items-center gap-2">
          {showStoreFilter && (
            <SearchableSelect<Store>
              value={storeId || null}
              valueLabel={selectedStoreForDisplay?.name ?? '全店舗'}
              options={stores}
              placeholder="全店舗"
              searchPlaceholder="店舗を検索..."
              emptyMessage="該当する店舗がありません"
              loadingMessage="店舗を読み込み中..."
              clearLabel="全店舗"
              open={storeSelectOpen}
              onOpenChange={setStoreSelectOpen}
              onSearchChange={setStoreSearch}
              onSelect={(store) => {
                setSelectedStore(store);
                onStoreIdChange(store?.id ?? '');
              }}
              getOptionKey={(store) => store.id}
              getOptionLabel={(store) => store.name}
              isLoading={isStoreFetching}
              triggerClassName={`h-8 w-40 text-xs ${filterActiveClass(storeId)}`}
            />
          )}

          <Select
            value={studioType || TYPE_ALL_KEY}
            onValueChange={(v) => {
              if (v == null) return;
              onStudioTypeChange(v === TYPE_ALL_KEY ? '' : v);
            }}
            items={TYPE_ITEMS}
          >
            <SelectTrigger className={`h-8 w-40 text-xs ${filterActiveClass(studioType)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={brand || BRAND_ALL_KEY}
            onValueChange={(v) => {
              if (v == null) return;
              onBrandChange(v === BRAND_ALL_KEY ? '' : v);
            }}
            items={BRAND_ITEMS}
          >
            <SelectTrigger className={`h-8 w-35 text-xs ${filterActiveClass(brand)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BRAND_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status || STATUS_ALL_KEY}
            onValueChange={(v) => {
              if (v == null) return;
              onStatusChange(v === STATUS_ALL_KEY ? '' : v);
            }}
            items={STATUS_ITEMS}
          >
            <SelectTrigger className={`h-8 w-35 text-xs ${filterActiveClass(status)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground ml-auto h-8 text-xs"
              onClick={onClearFilters}
            >
              すべてクリア
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
