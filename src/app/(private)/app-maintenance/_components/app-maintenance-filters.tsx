'use client';

import { APP_MAINTENANCE_STATUS_LABELS } from '@/app/(private)/app-maintenance/_constants/app-maintenance.constants';
import { APP_MAINTENANCE_BRAND_LABELS } from '@/app/(private)/app-maintenance/_constants/app-maintenance.constants';
import type { useAppMaintenanceFilters } from '@/app/(private)/app-maintenance/_hooks/use-app-maintenance-filters.hook';
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

import { AppMaintenanceStatus, AppMaintenanceTargetBrand } from '@/lib/api/types.gen';

function filterActiveClass(active: boolean) {
  return active ? 'border-primary bg-primary/10 text-foreground' : '';
}

interface AppMaintenanceFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  filtersHook: ReturnType<typeof useAppMaintenanceFilters>;
}

export function AppMaintenanceFilters({
  isFilterOpen,
  onFilterOpenChange,
  filtersHook,
}: AppMaintenanceFiltersProps) {
  const { filters, setFilters, searchInput, setSearchInput, activeFilterCount } = filtersHook;

  const BRAND_FILTER_ITEMS = { all: '全ブランド', ...APP_MAINTENANCE_BRAND_LABELS };
  const STATUS_FILTER_ITEMS = { all: '全ステータス', ...APP_MAINTENANCE_STATUS_LABELS };

  return (
    <div className="space-y-3 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-100 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="IDまたはメッセージで検索..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-8 rounded-md pl-9 text-xs"
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
            items={BRAND_FILTER_ITEMS}
            value={filters.brand ?? 'all'}
            onValueChange={(value) =>
              setFilters({
                brand: value === 'all' ? null : (value as AppMaintenanceTargetBrand),
                page: 1,
              })
            }
          >
            <SelectTrigger
              className={`h-8 w-32 text-xs ${filterActiveClass(filters.brand !== null)}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BRAND_FILTER_ITEMS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={STATUS_FILTER_ITEMS}
            value={filters.status ?? 'all'}
            onValueChange={(value) =>
              setFilters({
                status: value === 'all' ? null : (value as AppMaintenanceStatus),
                page: 1,
              })
            }
          >
            <SelectTrigger
              className={`h-8 w-35 text-xs ${filterActiveClass(filters.status !== null)}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_FILTER_ITEMS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
