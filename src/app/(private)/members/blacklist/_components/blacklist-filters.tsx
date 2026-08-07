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

import {
  BLACKLIST_REGISTRATION_SOURCE_OPTIONS,
  UNPAID_FILTER_OPTIONS,
} from '../_constants/blacklist.constants';
import { useBlacklistFiltersContext } from '../_contexts/blacklist-filters-context';

interface BlacklistFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

export function BlacklistFilters({ isFilterOpen, onFilterOpenChange }: BlacklistFiltersProps) {
  const { filters, updateFilter, searchInput, setSearchInput, hasActiveFilters, clearFilters } =
    useBlacklistFiltersContext();

  const activeFilterCount = [filters.reason, filters.unpaid].filter(Boolean).length;

  return (
    <div className="space-y-3 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-100 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9 text-xs"
            placeholder="会員ID・氏名で検索"
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
          {/* 登録理由 */}
          <Select
            value={filters.reason ?? 'all'}
            onValueChange={(v) =>
              updateFilter('reason', v === 'all' ? null : (v as typeof filters.reason))
            }
            items={BLACKLIST_REGISTRATION_SOURCE_OPTIONS}
          >
            <SelectTrigger className={`h-8 w-32 text-xs ${filterActiveClass(!!filters.reason)}`}>
              <SelectValue placeholder="全登録理由" />
            </SelectTrigger>
            <SelectContent>
              {BLACKLIST_REGISTRATION_SOURCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 未納金 */}
          <Select
            value={filters.unpaid ?? 'all'}
            onValueChange={(v) =>
              updateFilter('unpaid', v === 'all' ? null : (v as typeof filters.unpaid))
            }
            items={UNPAID_FILTER_OPTIONS}
          >
            <SelectTrigger className={`h-8 w-36 text-xs ${filterActiveClass(!!filters.unpaid)}`}>
              <SelectValue placeholder="未納金：全件" />
            </SelectTrigger>
            <SelectContent>
              {UNPAID_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="xs"
              onClick={clearFilters}
              className="text-muted-foreground ml-auto h-8"
            >
              すべてクリア
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
