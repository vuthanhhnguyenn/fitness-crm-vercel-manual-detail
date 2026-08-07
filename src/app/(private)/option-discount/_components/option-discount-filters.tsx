'use client';

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

import { OptionDiscountStatus, OptionDiscountType } from '@/lib/api/types.gen';

import {
  OPTION_DISCOUNT_STATUS_LABELS,
  OPTION_DISCOUNT_TYPE_LABELS,
} from '../_constants/constants';
import { useOptionDiscountFiltersContext } from '../_contexts/option-discount-filters-context';

interface OptionDiscountFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

export function OptionDiscountFilters({
  isFilterOpen,
  onFilterOpenChange,
}: OptionDiscountFiltersProps) {
  const { filters, searchInput, setSearchInput, updateFilter, hasActiveFilters, clearFilters } =
    useOptionDiscountFiltersContext();

  const activeFilterCount = [filters.discount_type !== null, filters.status !== null].filter(
    Boolean,
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative max-w-100 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="セット割名・コードで検索..."
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
          <Select
            value={filters.discount_type ?? 'all'}
            onValueChange={(value) =>
              updateFilter('discount_type', value === 'all' ? null : (value as OptionDiscountType))
            }
          >
            <SelectTrigger size="sm" className="w-fit rounded-lg">
              <SelectValue placeholder="全タイプ">
                {filters.discount_type
                  ? OPTION_DISCOUNT_TYPE_LABELS[filters.discount_type]
                  : '全タイプ'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全タイプ</SelectItem>
              {Object.entries(OPTION_DISCOUNT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status ?? 'all'}
            onValueChange={(value) =>
              updateFilter('status', value === 'all' ? null : (value as OptionDiscountStatus))
            }
          >
            <SelectTrigger size="sm" className="w-fit rounded-lg">
              <SelectValue placeholder="全ステータス">
                {filters.status ? OPTION_DISCOUNT_STATUS_LABELS[filters.status] : '全ステータス'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ステータス</SelectItem>
              {Object.entries(OPTION_DISCOUNT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
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
