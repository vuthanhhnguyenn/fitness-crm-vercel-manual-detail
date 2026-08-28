'use client';

import { toSelectItems } from '@/utils/app.util';
import { useQuery } from '@tanstack/react-query';
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

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';

import {
  ALL_OPTION_VALUE,
  TRANSFER_APPLIED_PERIOD_OPTIONS,
  TRANSFER_AUTO_OPTIONS,
  TRANSFER_BRAND_OPTIONS,
  TRANSFER_STATUS_OPTIONS,
} from '../_constants/constants';
import { useTransferFiltersContext } from '../_contexts/transfer-filters-context';

function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

interface TransferFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

export function TransferFilters({
  isFilterOpen,
  onFilterOpenChange,
}: Readonly<TransferFiltersProps>) {
  const { filters, searchInput, setSearchInput, updateFilter, clearFilters, activeFilterCount } =
    useTransferFiltersContext();

  // Stores come from the API, not a hardcoded list — the endpoint returns only the stores this
  // user can access, so the dropdown can never offer a store whose rows they cannot see.
  const { data: storesRes } = useQuery({
    ...getCrmStoresOptions({
      query: { page: 1, limit: 100, sort_by: 'name', sort_order: 'asc' },
    }),
  });

  const storeOptions = [
    ...(storesRes?.stores ?? []).map((store) => ({ value: store.id, label: store.name })),
  ];
  const fromStoreOptions = [
    { value: ALL_OPTION_VALUE, label: '全店舗（移籍元）' },
    ...storeOptions,
  ];
  const toStoreOptions = [{ value: ALL_OPTION_VALUE, label: '全店舗（移籍先）' }, ...storeOptions];

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Toolbar row */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-[400px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="申請ID・会員名で検索"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8 pl-9 text-xs"
          />
        </div>
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="ml-auto h-8 gap-1 text-xs"
          onClick={() => onFilterOpenChange(!isFilterOpen)}
        >
          <SlidersHorizontal className="size-4" />
          {isFilterOpen ? (
            <>
              閉じる <ChevronUp className="size-3" />
            </>
          ) : (
            <>
              詳細フィルター <ChevronDown className="size-3" />
            </>
          )}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 size-5 rounded-full p-0 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Expandable filter bar — six controls in V0 order */}
      {isFilterOpen && (
        <div className="flex flex-wrap items-center gap-2">
          {/* ステータス */}
          <Select
            value={filters.status ?? ALL_OPTION_VALUE}
            onValueChange={(v) =>
              updateFilter('status', v === ALL_OPTION_VALUE ? null : (v as typeof filters.status))
            }
            items={toSelectItems(TRANSFER_STATUS_OPTIONS)}
          >
            <SelectTrigger
              className={`h-8 w-[140px] text-xs ${filterActiveClass(filters.status !== null)}`}
            >
              <SelectValue placeholder="全ステータス" />
            </SelectTrigger>
            <SelectContent>
              {TRANSFER_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 移籍元店舗 */}
          <Select
            value={filters.from_store_id ?? ALL_OPTION_VALUE}
            onValueChange={(v) => updateFilter('from_store_id', v === ALL_OPTION_VALUE ? null : v)}
            items={toSelectItems(fromStoreOptions)}
          >
            <SelectTrigger
              className={`h-8 w-[160px] text-xs ${filterActiveClass(filters.from_store_id !== null)}`}
            >
              <SelectValue placeholder="全店舗（移籍元）" />
            </SelectTrigger>
            <SelectContent>
              {fromStoreOptions.map((store) => (
                <SelectItem key={store.value} value={store.value} className="text-xs">
                  {store.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 移籍先店舗 */}
          <Select
            value={filters.to_store_id ?? ALL_OPTION_VALUE}
            onValueChange={(v) => updateFilter('to_store_id', v === ALL_OPTION_VALUE ? null : v)}
            items={toSelectItems(toStoreOptions)}
          >
            <SelectTrigger
              className={`h-8 w-[160px] text-xs ${filterActiveClass(filters.to_store_id !== null)}`}
            >
              <SelectValue placeholder="全店舗（移籍先）" />
            </SelectTrigger>
            <SelectContent>
              {toStoreOptions.map((store) => (
                <SelectItem key={store.value} value={store.value} className="text-xs">
                  {store.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* ブランド */}
          <Select
            value={filters.brand ?? ALL_OPTION_VALUE}
            onValueChange={(v) =>
              updateFilter('brand', v === ALL_OPTION_VALUE ? null : (v as typeof filters.brand))
            }
            items={toSelectItems(TRANSFER_BRAND_OPTIONS)}
          >
            <SelectTrigger
              className={`h-8 w-[130px] text-xs ${filterActiveClass(filters.brand !== null)}`}
            >
              <SelectValue placeholder="全ブランド" />
            </SelectTrigger>
            <SelectContent>
              {TRANSFER_BRAND_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value} className="text-xs">
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 申請日 */}
          <Select
            value={filters.applied_period ?? ALL_OPTION_VALUE}
            onValueChange={(v) =>
              updateFilter(
                'applied_period',
                v === ALL_OPTION_VALUE ? null : (v as typeof filters.applied_period),
              )
            }
            items={toSelectItems(TRANSFER_APPLIED_PERIOD_OPTIONS)}
          >
            <SelectTrigger
              className={`h-8 w-[120px] text-xs ${filterActiveClass(filters.applied_period !== null)}`}
            >
              <SelectValue placeholder="全期間" />
            </SelectTrigger>
            <SelectContent>
              {TRANSFER_APPLIED_PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 自動移籍 */}
          <Select
            value={filters.auto_transfer ?? ALL_OPTION_VALUE}
            onValueChange={(v) =>
              updateFilter(
                'auto_transfer',
                v === ALL_OPTION_VALUE ? null : (v as typeof filters.auto_transfer),
              )
            }
            items={toSelectItems(TRANSFER_AUTO_OPTIONS)}
          >
            <SelectTrigger
              className={`h-8 w-[140px] text-xs ${filterActiveClass(filters.auto_transfer !== null)}`}
            >
              <SelectValue placeholder="自動移籍: すべて" />
            </SelectTrigger>
            <SelectContent>
              {TRANSFER_AUTO_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* すべてクリア */}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground ml-auto h-8 text-xs"
            onClick={clearFilters}
          >
            すべてクリア
          </Button>
        </div>
      )}
    </div>
  );
}
