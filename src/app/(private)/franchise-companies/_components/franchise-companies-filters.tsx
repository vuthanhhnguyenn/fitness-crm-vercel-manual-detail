'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { cn } from '@/lib/utils';

import {
  FRANCHISE_COMPANY_STATUS_LABELS,
  FRANCHISE_COMPANY_STATUS_OPTIONS,
  FRANCHISE_COMPANY_TYPE_LABELS,
  FRANCHISE_COMPANY_TYPE_OPTIONS,
} from '../_constants/constants';
import { useFranchiseCompaniesFilters } from '../_hooks/use-franchise-companies-filters';

/** 既定値以外が選択されているフィルターを強調する（UI v0 fc-company-list） */
const ACTIVE_FILTER_CLASS = 'border-primary bg-primary/10 text-foreground';

interface FranchiseCompaniesFiltersProps {
  filtersHook: ReturnType<typeof useFranchiseCompaniesFilters>;
}

export function FranchiseCompaniesFilters({
  filtersHook,
}: Readonly<FranchiseCompaniesFiltersProps>) {
  const { filters, searchInput, setSearchInput, updateFilter } = filtersHook;

  return (
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

      {/* A8: フィルター2個以下は常時展開（折りたたみなし） */}
      <div className="ml-auto flex items-center gap-2">
        <Select
          value={filters.company_type ?? 'all'}
          onValueChange={(value) =>
            updateFilter(
              'company_type',
              value === 'all' ? null : (value as NonNullable<typeof filters.company_type>),
            )
          }
        >
          <SelectTrigger
            className={cn(
              'h-8 w-[120px] rounded-lg text-xs',
              filters.company_type !== null && ACTIVE_FILTER_CLASS,
            )}
          >
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
          <SelectTrigger
            className={cn(
              'h-8 w-[140px] rounded-lg text-xs',
              filters.status !== null && ACTIVE_FILTER_CLASS,
            )}
          >
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
      </div>
    </div>
  );
}
