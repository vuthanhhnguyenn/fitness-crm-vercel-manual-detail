'use client';

import { BRAND_LABELS } from '@/app/(private)/brands/_constants/brand.constants';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';

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

import { BannerChannel, BannerStatus, BrandEnum } from '@/lib/api/types.gen';

import { BANNER_CHANNEL_LABELS, BANNER_STATUS_LABELS } from '../_constants/banner.constants';
import type { useBannersFilters } from '../_hooks/use-banners-filters';

function filterActiveClass(active: boolean) {
  return active ? 'border-primary bg-primary/10 text-foreground' : '';
}

interface BannersFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  filtersHook: ReturnType<typeof useBannersFilters>;
}

export function BannersFilters({
  isFilterOpen,
  onFilterOpenChange,
  filtersHook,
}: BannersFiltersProps) {
  const {
    filters,
    searchInput,
    setSearchInput,
    updateFilter,
    hasActiveFilters,
    activeDetailFilterCount,
    clearFilters,
  } = filtersHook;

  const BRAND_FILTER_ITEMS = {
    all: '全ブランド',
    ...BRAND_LABELS,
  };

  const CHANNEL_FILTER_ITEMS = {
    all: '全チャネル',
    ...BANNER_CHANNEL_LABELS,
  };

  const STATUS_FILTER_ITEMS = {
    all: '全ステータス',
    ...BANNER_STATUS_LABELS,
  };

  return (
    <div className="space-y-3 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-100 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="タイトルで検索..."
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
          <Select
            items={BRAND_FILTER_ITEMS}
            value={filters.brandEnum ?? 'all'}
            onValueChange={(value) =>
              updateFilter('brandEnum', value === 'all' ? null : (value as BrandEnum))
            }
          >
            <SelectTrigger
              className={`h-8 w-40 text-xs ${filterActiveClass(filters.brandEnum !== null)}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BRAND_FILTER_ITEMS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={CHANNEL_FILTER_ITEMS}
            value={filters.channel ?? 'all'}
            onValueChange={(value) =>
              updateFilter('channel', value === 'all' ? null : (value as BannerChannel))
            }
          >
            <SelectTrigger
              className={`h-8 w-35 text-xs ${filterActiveClass(filters.channel !== null)}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CHANNEL_FILTER_ITEMS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={STATUS_FILTER_ITEMS}
            value={filters.status ?? 'all'}
            onValueChange={(value) =>
              updateFilter('status', value === 'all' ? null : (value as BannerStatus))
            }
          >
            <SelectTrigger
              className={`h-8 w-30 text-xs ${filterActiveClass(filters.status !== null)}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_FILTER_ITEMS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
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
