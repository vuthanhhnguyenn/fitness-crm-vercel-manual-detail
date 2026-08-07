'use client';

import type { Dispatch, SetStateAction } from 'react';

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

import type {
  LockerContractStatus as LockerContractStatusValue,
  LockerOptionType as LockerOptionTypeValue,
} from '@/lib/api/types.gen';

import {
  LOCKER_CONTRACT_STATUS_LABELS,
  LOCKER_OPTION_TYPE_LABELS,
} from '../../_constants/constants';

function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

type LockerContractsFiltersProps = {
  activeFilterCount: number;
  clearFilters: () => void;
  filters: {
    locker_contracts_status: LockerContractStatusValue | null;
    locker_contracts_type: LockerOptionTypeValue | null;
  };
  hasActiveFilters: boolean;
  isFilterOpen: boolean;
  searchInput: string;
  setFilters: (value: {
    locker_contracts_page?: number;
    locker_contracts_status?: LockerContractStatusValue | null;
    locker_contracts_type?: LockerOptionTypeValue | null;
  }) => void;
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
  setSearchInput: (value: string) => void;
};

export function LockerContractsFilters({
  activeFilterCount,
  clearFilters,
  filters,
  hasActiveFilters,
  isFilterOpen,
  searchInput,
  setFilters,
  setIsFilterOpen,
  setSearchInput,
}: LockerContractsFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-100 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="契約ID・会員名で検索"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8 pl-9 text-xs"
          />
        </div>
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="ml-auto h-8 gap-1 text-xs"
          onClick={() => setIsFilterOpen((prev) => !prev)}
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
            value={filters.locker_contracts_status ?? 'all'}
            onValueChange={(value) => {
              setFilters({
                locker_contracts_status:
                  value === 'all' ? null : (value as LockerContractStatusValue),
                locker_contracts_page: 1,
              });
            }}
          >
            <SelectTrigger
              size="sm"
              className={`h-8 w-40 text-xs ${filterActiveClass(filters.locker_contracts_status !== null)}`}
            >
              <SelectValue>
                {filters.locker_contracts_status
                  ? LOCKER_CONTRACT_STATUS_LABELS[filters.locker_contracts_status]
                  : '全ステータス'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ステータス</SelectItem>
              {Object.entries(LOCKER_CONTRACT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.locker_contracts_type ?? 'all'}
            onValueChange={(value) => {
              setFilters({
                locker_contracts_type: value === 'all' ? null : (value as LockerOptionTypeValue),
                locker_contracts_page: 1,
              });
            }}
          >
            <SelectTrigger
              size="sm"
              className={`h-8 w-45 text-xs ${filterActiveClass(filters.locker_contracts_type !== null)}`}
            >
              <SelectValue>
                {filters.locker_contracts_type
                  ? LOCKER_OPTION_TYPE_LABELS[filters.locker_contracts_type]
                  : '全てのオプション'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全てのオプション</SelectItem>
              {Object.entries(LOCKER_OPTION_TYPE_LABELS).map(([value, label]) => (
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
