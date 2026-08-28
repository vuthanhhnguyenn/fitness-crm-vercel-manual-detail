'use client';

import type { Dispatch, SetStateAction } from 'react';

import { formatDateYYYYMMDD, parseDate } from '@/utils/date.util';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { LockerPendingLocation as LockerPendingLocationValue } from '@/lib/api/types.gen';

import { LOCKER_PENDING_LOCATION_LABELS } from '../../_constants/constants';
import { LockerPendingStoreSelect } from './locker-pending-store-select';

function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

type LockerPendingSlotsFiltersProps = {
  activeFilterCount: number;
  clearFilters: () => void;
  filters: {
    locker_pending_cancel_from: string;
    locker_pending_cancel_to: string;
    locker_pending_location: LockerPendingLocationValue | null;
    locker_pending_store_id: string | null;
  };
  hasActiveFilters: boolean;
  isFilterOpen: boolean;
  searchInput: string;
  setFilters: (value: {
    locker_pending_cancel_from?: string | null;
    locker_pending_cancel_to?: string | null;
    locker_pending_location?: LockerPendingLocationValue | null;
    locker_pending_page?: number;
    locker_pending_store_id?: string | null;
  }) => void;
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
  setSearchInput: (value: string) => void;
};

/**
 * Search and filters for the pending-release list tab (FR-008).
 * There are 4 filters (store / location / cancellation date From-To), so they are collapsed under advanced filters.
 */
export function LockerPendingSlotsFilters({
  activeFilterCount,
  clearFilters,
  filters,
  hasActiveFilters,
  isFilterOpen,
  searchInput,
  setFilters,
  setIsFilterOpen,
  setSearchInput,
}: LockerPendingSlotsFiltersProps) {
  // The cancellation date is passed to the API as a `YYYY/MM/DD` string. The DatePicker works with Date, so convert both ways.
  // Use the date-fns based util instead of `toISOString()` to avoid timezone shifts.
  const cancelFromDate = parseDate(filters.locker_pending_cancel_from) ?? undefined;
  const cancelToDate = parseDate(filters.locker_pending_cancel_to) ?? undefined;

  const handleCancelDateChange = (
    key: 'locker_pending_cancel_from' | 'locker_pending_cancel_to',
    date: Date | undefined,
  ) => {
    setFilters({
      [key]: date ? formatDateYYYYMMDD(date) : null,
      locker_pending_page: 1,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-100 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="スロット番号・会員名で検索"
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
          <LockerPendingStoreSelect
            value={filters.locker_pending_store_id}
            isActive={filters.locker_pending_store_id !== null}
            onChange={(storeId) =>
              setFilters({ locker_pending_store_id: storeId, locker_pending_page: 1 })
            }
          />

          <Select
            value={filters.locker_pending_location ?? 'all'}
            onValueChange={(value) => {
              setFilters({
                locker_pending_location:
                  value === 'all' ? null : (value as LockerPendingLocationValue),
                locker_pending_page: 1,
              });
            }}
          >
            <SelectTrigger
              size="sm"
              className={`h-8 min-w-40 text-xs ${filterActiveClass(filters.locker_pending_location !== null)}`}
            >
              <SelectValue>
                {filters.locker_pending_location
                  ? LOCKER_PENDING_LOCATION_LABELS[filters.locker_pending_location]
                  : '全てのロケーション'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全てのロケーション</SelectItem>
              {Object.entries(LOCKER_PENDING_LOCATION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <DatePicker
              date={cancelFromDate}
              placeholder="解約日From"
              onDateChange={(date) => handleCancelDateChange('locker_pending_cancel_from', date)}
            />
            <span className="text-muted-foreground text-xs">〜</span>
            <DatePicker
              date={cancelToDate}
              placeholder="解約日To"
              onDateChange={(date) => handleCancelDateChange('locker_pending_cancel_to', date)}
            />
          </div>

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
