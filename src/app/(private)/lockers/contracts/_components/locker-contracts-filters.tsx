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
  filters: {
    locker_contracts_status: LockerContractStatusValue | null;
    locker_contracts_type: LockerOptionTypeValue | null;
  };
  searchInput: string;
  setFilters: (value: {
    locker_contracts_page?: number;
    locker_contracts_status?: LockerContractStatusValue | null;
    locker_contracts_type?: LockerOptionTypeValue | null;
  }) => void;
  setSearchInput: (value: string) => void;
};

/**
 * Search and filters for the contract list tab.
 * There are only 2 filters (status and option contract), so per common GUI rule A8
 * (2 filters or fewer stay always expanded) there is no collapsible section.
 */
export function LockerContractsFilters({
  filters,
  searchInput,
  setFilters,
  setSearchInput,
}: LockerContractsFiltersProps) {
  return (
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

      <div className="ml-auto flex items-center gap-2">
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
                : '全てのステータス'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全てのステータス</SelectItem>
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
            className={`h-8 w-48 text-xs ${filterActiveClass(filters.locker_contracts_type !== null)}`}
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
      </div>
    </div>
  );
}
