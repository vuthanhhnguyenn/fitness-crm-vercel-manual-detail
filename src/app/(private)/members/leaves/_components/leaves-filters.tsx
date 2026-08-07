'use client';

import { useQuery } from '@tanstack/react-query';
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

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import { Brand } from '@/lib/api/types.gen';

import { BRAND_LABELS } from '../../_constants/constants';
import {
  LEAVE_STATUS_OPTIONS,
  LEAVE_TYPE_OPTIONS,
  SCHEDULED_PERIOD_OPTIONS,
} from '../_constants/constants';
import { useLeavesFiltersContext } from '../_contexts/leaves-filters-context';

interface LeavesFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

export function LeavesFilters({ isFilterOpen, onFilterOpenChange }: LeavesFiltersProps) {
  const { filters, updateFilter, searchInput, setSearchInput, hasActiveFilters, clearFilters } =
    useLeavesFiltersContext();

  const { data: storesRes } = useQuery({
    ...getCrmStoresOptions({
      query: { page: 1, limit: 100, sort_by: 'name', sort_order: 'asc' },
    }),
  });
  const stores = storesRes?.stores ?? [];

  const activeFilterCount = [
    filters.type,
    filters.status,
    filters.brand,
    filters.store_id,
    filters.scheduled_period,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-100 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9 text-xs"
            placeholder="申請ID・会員名で検索"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={activeFilterCount > 0 ? 'default' : 'outline'}
            size="sm"
            className="h-8 gap-1 text-xs"
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
      </div>

      {isFilterOpen && (
        <div className="flex flex-wrap items-center gap-2">
          {/* 種別 */}
          <Select
            value={filters.type ?? 'all'}
            onValueChange={(v) =>
              updateFilter('type', v === 'all' ? null : (v as 'suspension' | 'withdrawal'))
            }
            items={LEAVE_TYPE_OPTIONS}
          >
            <SelectTrigger className={`h-8 w-27.5 text-xs ${filterActiveClass(!!filters.type)}`}>
              <SelectValue placeholder="全種別" />
            </SelectTrigger>
            <SelectContent>
              {LEAVE_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* ステータス */}
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(v) =>
              updateFilter('status', v === 'all' ? null : (v as typeof filters.status))
            }
            items={LEAVE_STATUS_OPTIONS}
          >
            <SelectTrigger className={`h-8 w-40 text-xs ${filterActiveClass(!!filters.status)}`}>
              <SelectValue placeholder="全ステータス" />
            </SelectTrigger>
            <SelectContent>
              {LEAVE_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 店舗 */}
          <Select
            value={filters.store_id ?? 'all'}
            onValueChange={(v) => updateFilter('store_id', v === 'all' ? null : v)}
          >
            <SelectTrigger className={`h-8 w-40 text-xs ${filterActiveClass(!!filters.store_id)}`}>
              <SelectValue>
                {filters.store_id
                  ? (stores.find((s) => s.id === filters.store_id)?.name ?? filters.store_id)
                  : '全店舗'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全店舗</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* ブランド */}
          <Select
            value={filters.brand ?? 'all'}
            onValueChange={(v) => updateFilter('brand', v === 'all' ? null : v)}
          >
            <SelectTrigger className={`h-8 w-32.5 text-xs ${filterActiveClass(!!filters.brand)}`}>
              <SelectValue>
                {filters.brand ? BRAND_LABELS[filters.brand as Brand] : '全ブランド'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ブランド</SelectItem>
              {Object.entries(BRAND_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 予定期間 */}
          <Select
            value={filters.scheduled_period ?? 'all'}
            onValueChange={(v) =>
              updateFilter(
                'scheduled_period',
                v === 'all' ? null : (v as typeof filters.scheduled_period),
              )
            }
            items={SCHEDULED_PERIOD_OPTIONS}
          >
            <SelectTrigger
              className={`h-8 w-30 text-xs ${filterActiveClass(!!filters.scheduled_period)}`}
            >
              <SelectValue placeholder="全期間" />
            </SelectTrigger>
            <SelectContent>
              {SCHEDULED_PERIOD_OPTIONS.map((opt) => (
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
