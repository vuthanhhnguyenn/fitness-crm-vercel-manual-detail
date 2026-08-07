'use client';

import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';

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
  STORE_AREA_LABELS,
  STORE_BRAND_LABELS,
  STORE_STATUS_LABELS,
  StoreArea,
  StoreListBrand,
  StoreListStatus,
} from '../_constants/constants';
import { useStoresFiltersContext } from '../_contexts/stores-filters-context';

interface StoresFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

export function StoresFilters({ isFilterOpen, onFilterOpenChange }: StoresFiltersProps) {
  const { filters, searchInput, setSearchInput, updateFilter, hasActiveFilters, clearFilters } =
    useStoresFiltersContext();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative max-w-[400px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="店舗名・クラブコードで検索..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8 rounded-lg pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8 gap-1.5"
          onClick={() => onFilterOpenChange(!isFilterOpen)}
        >
          <SlidersHorizontal className="size-4" />
          {isFilterOpen ? '閉じる' : '詳細フィルター'}
          {isFilterOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
      </div>

      {isFilterOpen && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.brand ?? 'all'}
              onValueChange={(value) => {
                updateFilter('brand', value === 'all' ? null : (value as StoreListBrand));
              }}
            >
              <SelectTrigger size="sm" className="w-fit rounded-lg">
                <div className="flex items-center gap-1.5">
                  <SelectValue placeholder="全ブランド">
                    {filters.brand ? STORE_BRAND_LABELS[filters.brand] : '全ブランド'}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ブランド</SelectItem>
                {Object.entries(STORE_BRAND_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.area ?? 'all'}
              onValueChange={(value) => {
                updateFilter('area', value === 'all' ? null : (value as StoreArea));
              }}
            >
              <SelectTrigger size="sm" className="w-fit rounded-lg">
                <div className="flex items-center gap-1.5">
                  <SelectValue placeholder="全エリア">
                    {filters.area ? STORE_AREA_LABELS[filters.area] : '全エリア'}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全エリア</SelectItem>
                {Object.entries(STORE_AREA_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status ?? 'all'}
              onValueChange={(value) => {
                updateFilter('status', value === 'all' ? null : (value as StoreListStatus));
              }}
            >
              <SelectTrigger size="sm" className="w-fit rounded-lg">
                <div className="flex items-center gap-1.5">
                  <SelectValue placeholder="全ステータス">
                    {filters.status ? STORE_STATUS_LABELS[filters.status] : '全ステータス'}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ステータス</SelectItem>
                {Object.entries(STORE_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="xs"
              onClick={clearFilters}
              className="text-muted-foreground h-8"
            >
              すべてクリア
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
