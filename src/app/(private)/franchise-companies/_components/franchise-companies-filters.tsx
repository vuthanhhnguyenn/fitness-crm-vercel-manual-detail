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
  FRANCHISE_COMPANY_STATUS_LABELS,
  FRANCHISE_COMPANY_STATUS_OPTIONS,
  FRANCHISE_COMPANY_TYPE_LABELS,
  FRANCHISE_COMPANY_TYPE_OPTIONS,
} from '../_constants/constants';
import { useFranchiseCompaniesFilters } from '../_hooks/use-franchise-companies-filters';

interface FranchiseCompaniesFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  filtersHook: ReturnType<typeof useFranchiseCompaniesFilters>;
}

export function FranchiseCompaniesFilters({
  isFilterOpen,
  onFilterOpenChange,
  filtersHook,
}: Readonly<FranchiseCompaniesFiltersProps>) {
  const { filters, searchInput, setSearchInput, updateFilter, hasActiveFilters, clearFilters } =
    filtersHook;

  const activeFilterCount = [filters.company_type !== null, filters.status !== null].filter(
    Boolean,
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative max-w-[400px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="法人名で検索..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
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
            value={filters.company_type ?? 'all'}
            onValueChange={(value) =>
              updateFilter(
                'company_type',
                value === 'all' ? null : (value as NonNullable<typeof filters.company_type>),
              )
            }
          >
            <SelectTrigger className="h-8 w-[120px] rounded-lg text-xs">
              <SelectValue placeholder="全区分">
                {filters.company_type
                  ? FRANCHISE_COMPANY_TYPE_LABELS[filters.company_type]
                  : '全区分'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FRANCHISE_COMPANY_TYPE_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status ?? 'all'}
            onValueChange={(value) =>
              updateFilter(
                'status',
                value === 'all' ? null : (value as NonNullable<typeof filters.status>),
              )
            }
          >
            <SelectTrigger className="h-8 w-[140px] rounded-lg text-xs">
              <SelectValue placeholder="全ステータス">
                {filters.status ? FRANCHISE_COMPANY_STATUS_LABELS[filters.status] : '全ステータス'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FRANCHISE_COMPANY_STATUS_OPTIONS.map(({ value, label }) => (
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
