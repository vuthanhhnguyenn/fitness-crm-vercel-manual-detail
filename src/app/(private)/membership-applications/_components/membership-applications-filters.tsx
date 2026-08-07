'use client';

import { useState } from 'react';

import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { cn } from '@/lib/utils';

import { BLACKLIST_OPTIONS, BRAND_OPTIONS, STATUS_OPTIONS } from '../_constants/constants';
import { useMembershipApplicationsFiltersContext } from '../_contexts/membership-applications-filters-context';

const MOCK_STORES = [
  'FIT365八潮店',
  'FIT365草加店',
  'FIT365越谷店',
  'ジョイフィット24越谷店',
  'ジョイフィット24草加店',
];

export function MembershipApplicationsFilters() {
  const { searchInput, setSearchInput, filters, setFilters, clearFilters, hasActiveFilters } =
    useMembershipApplicationsFiltersContext();

  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [
    !!filters.status,
    !!filters.brand,
    !!filters.store,
    filters.blacklist !== 'all',
    !!filters.date_from || !!filters.date_to,
  ].filter(Boolean).length;

  const filterActiveClass = (value: string, defaultValue: string) =>
    value === defaultValue ? '' : 'border-primary bg-primary/10 text-foreground';

  return (
    <div className="space-y-3 px-4 py-3">
      {/* Search + filter toggle row */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-100 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9 text-xs"
            placeholder="申請ID・氏名で検索..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={activeFilterCount > 0 ? 'default' : 'outline'}
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            <SlidersHorizontal className="size-4" />
            {showFilters ? '閉じる' : '詳細フィルター'}
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-0.5 h-5 px-1 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
            {showFilters ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </Button>
        </div>
      </div>

      {/* Expandable filter row */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <Select
            value={filters.status || '全ステータス'}
            onValueChange={(v) =>
              setFilters({
                status: v === '全ステータス' ? null : (v as typeof filters.status),
                page: 1,
              })
            }
            items={STATUS_OPTIONS}
          >
            <SelectTrigger
              className={cn('h-8 w-35 text-xs', filterActiveClass(filters.status, ''))}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value || '全ステータス'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Brand */}
          <Select
            value={filters.brand || '全ブランド'}
            onValueChange={(v) => setFilters({ brand: v === '全ブランド' ? null : v, page: 1 })}
          >
            <SelectTrigger className={cn('h-8 w-35 text-xs', filterActiveClass(filters.brand, ''))}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRAND_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value || '全ブランド'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Store */}
          <Select
            value={filters.store || '全店舗'}
            onValueChange={(v) => setFilters({ store: v === '全店舗' ? null : v, page: 1 })}
          >
            <SelectTrigger
              className={cn('h-8 w-[180px] text-xs', filterActiveClass(filters.store, ''))}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="全店舗">全店舗</SelectItem>
              {MOCK_STORES.map((store) => (
                <SelectItem key={store} value={store} className="text-xs">
                  {store}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Date range */}
          <DateRangePicker
            date={
              filters.date_from || filters.date_to
                ? {
                    from: filters.date_from ? new Date(filters.date_from) : undefined,
                    to: filters.date_to ? new Date(filters.date_to) : undefined,
                  }
                : undefined
            }
            onDateChange={(range: { from?: Date; to?: Date } | undefined) => {
              setFilters({
                date_from: range?.from ? range.from.toISOString().slice(0, 10) : null,
                date_to: range?.to ? range.to.toISOString().slice(0, 10) : null,
                page: 1,
              });
            }}
            className="text-xs"
            placeholder="申請日を選択"
          />

          {/* Blacklist */}
          <Select
            value={filters.blacklist}
            onValueChange={(v) => setFilters({ blacklist: v as typeof filters.blacklist, page: 1 })}
            items={BLACKLIST_OPTIONS}
          >
            <SelectTrigger
              className={cn('h-8 w-42 text-xs', filterActiveClass(filters.blacklist, 'all'))}
            >
              <span className="text-muted-foreground mr-1">BL照合:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLACKLIST_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear */}
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
