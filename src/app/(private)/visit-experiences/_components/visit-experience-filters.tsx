'use client';

import { useState } from 'react';

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

import { cn } from '@/lib/utils';

import type {
  VisitExperienceDateRangeFilter,
  VisitExperienceStatus,
} from '@/types/api/visit-experience.type';

import {
  BRAND_OPTIONS,
  BRAND_SELECT_ITEMS,
  DATE_RANGE_OPTIONS,
  DATE_RANGE_SELECT_ITEMS,
  STATUS_OPTIONS,
  STATUS_SELECT_ITEMS,
  STORE_OPTIONS,
  STORE_SELECT_ITEMS,
} from '../_constants/constants';

interface VisitExperienceFiltersProps {
  search: string;
  status: string;
  brandName: string;
  storeName: string;
  dateRange: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: VisitExperienceStatus | '') => void;
  onBrandChange: (value: string) => void;
  onStoreChange: (value: string) => void;
  onDateRangeChange: (value: VisitExperienceDateRangeFilter | '') => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

const filterActiveClass = (value: string, defaultValue: string) =>
  value === defaultValue ? '' : 'border-primary bg-primary/10 text-foreground';

export function VisitExperienceFilters({
  search,
  status,
  brandName,
  storeName,
  dateRange,
  onSearchChange,
  onStatusChange,
  onBrandChange,
  onStoreChange,
  onDateRangeChange,
  onClearFilters,
  hasActiveFilters,
  activeFilterCount,
}: VisitExperienceFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-3 border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-100 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9 text-xs"
            placeholder="予約番号・氏名で検索"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
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

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status || '全ステータス'}
            items={STATUS_SELECT_ITEMS}
            onValueChange={(v) => {
              if (v == null) return;
              onStatusChange(v === '全ステータス' ? '' : (v as VisitExperienceStatus));
            }}
          >
            <SelectTrigger className={cn('h-8 w-35 text-xs', filterActiveClass(status, ''))}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || '全ステータス'} value={opt.value || '全ステータス'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={brandName || '全ブランド'}
            items={BRAND_SELECT_ITEMS}
            onValueChange={(v) => {
              if (v == null) return;
              onBrandChange(v === '全ブランド' ? '' : v);
            }}
          >
            <SelectTrigger className={cn('h-8 w-35 text-xs', filterActiveClass(brandName, ''))}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRAND_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || '全ブランド'} value={opt.value || '全ブランド'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={storeName || '全店舗'}
            items={STORE_SELECT_ITEMS}
            onValueChange={(v) => {
              if (v == null) return;
              onStoreChange(v === '全店舗' ? '' : v);
            }}
          >
            <SelectTrigger
              className={cn('h-8 w-[180px] text-xs', filterActiveClass(storeName, ''))}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="全店舗">全店舗</SelectItem>
              {STORE_OPTIONS.map((store) => (
                <SelectItem key={store} value={store} className="text-xs">
                  {store}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={dateRange || '全期間'}
            items={DATE_RANGE_SELECT_ITEMS}
            onValueChange={(v) => {
              if (v == null) return;
              onDateRangeChange(v === '全期間' ? '' : (v as VisitExperienceDateRangeFilter));
            }}
          >
            <SelectTrigger className={cn('h-8 w-35 text-xs', filterActiveClass(dateRange, ''))}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || '全期間'} value={opt.value || '全期間'}>
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
              onClick={onClearFilters}
            >
              すべてクリア
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
