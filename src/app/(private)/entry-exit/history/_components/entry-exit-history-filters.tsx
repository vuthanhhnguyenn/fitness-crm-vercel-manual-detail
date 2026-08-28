'use client';

import { useState } from 'react';

import type { useEntryExitHistoryFilters } from '@/app/(private)/entry-exit/history/_hooks/use-entry-exit-history-filters.hook';
import { ALL_STORES, useCurrentStore } from '@/contexts/current-store.context';
import { toSelectItems } from '@/utils/app.util';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';

import { SearchableSelect } from '@/components/common/searchable-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { Store } from '@/lib/api/types.gen';

const AUTH_METHOD_OPTIONS = [
  { value: 'qr', label: 'QRコード' },
  { value: 'nfc', label: 'NFCカード' },
];

const RESULT_OPTIONS = [
  { value: 'success', label: '成功' },
  { value: 'denied', label: '拒否' },
];

function filterActiveClass(active: boolean) {
  return active ? 'border-primary bg-primary/10 text-foreground' : '';
}

interface EntryExitHistoryFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  filtersHook: ReturnType<typeof useEntryExitHistoryFilters>;
}

export function EntryExitHistoryFilters({
  isFilterOpen,
  onFilterOpenChange,
  filtersHook,
}: EntryExitHistoryFiltersProps) {
  const {
    filters,
    searchInput,
    setSearchInput,
    updateFilter,
    hasActiveFilters,
    activeDetailFilterCount,
    clearFilters,
  } = filtersHook;

  // FR-004: the store filter is shown only for users who can access 2+ stores
  // and are currently viewing the header's "全店舗" scope — mirrors
  // entry-exit-header-controls.tsx's showStoreOverride logic exactly.
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
        search: (storeSelectOpen ? storeSearch : filters.store_id) || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
    enabled: showStoreFilter && (storeSelectOpen || !!filters.store_id),
  });
  const stores = storeData?.stores ?? [];
  const selectedStoreForDisplay =
    stores.find((store) => store.id === filters.store_id) ??
    (selectedStore?.id === filters.store_id ? selectedStore : undefined);

  return (
    <div className="space-y-3 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-100 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="利用者名・会員IDで検索..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-8 rounded-md pl-9 text-xs"
          />
        </div>

        <Button
          variant={activeDetailFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="ml-auto h-8 gap-1.5 text-xs"
          onClick={() => onFilterOpenChange(!isFilterOpen)}
        >
          <SlidersHorizontal className="size-4" />
          {isFilterOpen ? '閉じる' : '詳細フィルター'}
          {activeDetailFilterCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 px-1 text-[10px]">
              {activeDetailFilterCount}
            </Badge>
          )}
          {isFilterOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </Button>
      </div>

      {isFilterOpen && (
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker
            date={{
              from: parseISO(filters.date_from),
              to: parseISO(filters.date_to),
            }}
            onDateChange={(range) => {
              if (!range?.from || !range?.to) return;
              updateFilter('date_from', format(range.from, 'yyyy-MM-dd'));
              updateFilter('date_to', format(range.to, 'yyyy-MM-dd'));
            }}
            className="h-8 text-xs"
            placeholder="期間を選択"
          />

          {showStoreFilter && (
            <div className="flex items-center gap-1.5">
              <SearchableSelect<Store>
                value={filters.store_id}
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
                  updateFilter('store_id', store?.id ?? null);
                }}
                getOptionKey={(store) => store.id}
                getOptionLabel={(store) => store.name}
                isLoading={isStoreFetching}
                triggerClassName={`h-8 text-xs ${filterActiveClass(filters.store_id !== null)}`}
              />
            </div>
          )}

          <Select
            value={filters.auth_method ?? 'all'}
            onValueChange={(value) =>
              updateFilter('auth_method', value === 'all' ? null : (value as 'qr' | 'nfc'))
            }
            items={{ all: '全認証方式', ...toSelectItems(AUTH_METHOD_OPTIONS) }}
          >
            <SelectTrigger
              className={`h-8 w-32 text-xs ${filterActiveClass(filters.auth_method !== null)}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全認証方式</SelectItem>
              {AUTH_METHOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.result ?? 'all'}
            onValueChange={(value) =>
              updateFilter('result', value === 'all' ? null : (value as 'success' | 'denied'))
            }
            items={{ all: '全処理結果', ...toSelectItems(RESULT_OPTIONS) }}
          >
            <SelectTrigger
              className={`h-8 w-30 text-xs ${filterActiveClass(filters.result !== null)}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全処理結果</SelectItem>
              {RESULT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
