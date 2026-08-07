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

import type { Brand, MainContractStatus, MainContractType } from '@/lib/api/types.gen';

import {
  COMPANION_BENEFIT_FILTER_LABELS,
  MAIN_CONTRACT_BRAND_LABELS,
  MAIN_CONTRACT_STATUS_LABELS,
  MAIN_CONTRACT_TYPE_LABELS,
} from '../_constants/constants';
import { useContractsFiltersContext } from '../_contexts/contracts-filters-context';

interface ContractsFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

export function ContractsFilters({
  isFilterOpen,
  onFilterOpenChange,
}: Readonly<ContractsFiltersProps>) {
  const { filters, searchInput, setSearchInput, updateFilter, hasActiveFilters, clearFilters } =
    useContractsFiltersContext();
  const activeFilterCount = [
    filters.contract_type,
    filters.status,
    filters.brand,
    filters.companion_benefit !== 'all' ? filters.companion_benefit : null,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative max-w-[400px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="主契約名・ID・コードで検索..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8 rounded-lg pl-9"
          />
        </div>
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="ml-auto h-8 gap-1.5"
          onClick={() => onFilterOpenChange(!isFilterOpen)}
        >
          <SlidersHorizontal className="size-4" />
          {isFilterOpen ? '閉じる' : '詳細フィルター'}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 px-1 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
          {isFilterOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
      </div>

      {isFilterOpen && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.contract_type ?? 'all'}
              onValueChange={(value) => {
                updateFilter('contract_type', value === 'all' ? null : (value as MainContractType));
              }}
            >
              <SelectTrigger size="sm" className="w-fit min-w-[140px] rounded-lg">
                <SelectValue placeholder="全タイプ">
                  {filters.contract_type
                    ? MAIN_CONTRACT_TYPE_LABELS[filters.contract_type]
                    : '全タイプ'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全タイプ</SelectItem>
                {Object.entries(MAIN_CONTRACT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.brand ?? 'all'}
              onValueChange={(value) => {
                updateFilter('brand', value === 'all' ? null : (value as Brand));
              }}
            >
              <SelectTrigger size="sm" className="w-fit min-w-[140px] rounded-lg">
                <SelectValue placeholder="全ブランド">
                  {filters.brand ? MAIN_CONTRACT_BRAND_LABELS[filters.brand] : '全ブランド'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ブランド</SelectItem>
                {Object.entries(MAIN_CONTRACT_BRAND_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status ?? 'all'}
              onValueChange={(value) => {
                updateFilter('status', value === 'all' ? null : (value as MainContractStatus));
              }}
            >
              <SelectTrigger size="sm" className="w-fit min-w-[140px] rounded-lg">
                <SelectValue placeholder="全ステータス">
                  {filters.status ? MAIN_CONTRACT_STATUS_LABELS[filters.status] : '全ステータス'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ステータス</SelectItem>
                {Object.entries(MAIN_CONTRACT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.companion_benefit}
              onValueChange={(value) => {
                updateFilter(
                  'companion_benefit',
                  value as keyof typeof COMPANION_BENEFIT_FILTER_LABELS,
                );
              }}
            >
              <SelectTrigger size="sm" className="w-fit min-w-[140px] rounded-lg">
                <SelectValue placeholder="同伴特典">
                  同伴特典: {COMPANION_BENEFIT_FILTER_LABELS[filters.companion_benefit]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(COMPANION_BENEFIT_FILTER_LABELS) as Array<
                    [keyof typeof COMPANION_BENEFIT_FILTER_LABELS, string]
                  >
                ).map(([value, label]) => (
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
