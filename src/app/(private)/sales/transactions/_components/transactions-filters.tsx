'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { toSelectItems } from '@/utils/app.util';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from 'lucide-react';

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

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { TransactionRecord } from '@/lib/api/types.gen';

import type { useTransactionsFilters } from '../_hooks/use-transactions-filters.hook';

const TRANSACTION_TYPE_OPTIONS = [
  { value: 'all', label: '全種別' },
  { value: 'sale', label: '売上' },
  { value: 'refund', label: '返金' },
  { value: 'payment', label: '入金' },
  { value: 'repayment', label: '払戻' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'all', label: '全決済手段' },
  { value: 'sbps', label: 'SBPS' },
  { value: 'jaccs', label: 'JACCS' },
  { value: 'cash', label: '現金' },
  { value: 'other', label: 'その他' },
];

// Exported for reuse in the page-level filter-result summary (matches the UI
// prototype's `buildFilterSummary` label set for the 決済 filter).
export const PAYMENT_METHOD_LABELS: Record<TransactionRecord['payment_method'], string> = {
  sbps: 'SBPS',
  jaccs: 'JACCS',
  cash: '現金',
  other: 'その他',
};

function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

interface TransactionsFiltersProps {
  filterState: ReturnType<typeof useTransactionsFilters>;
}

export function TransactionsFilters({ filterState }: Readonly<TransactionsFiltersProps>) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { filters, setFilters, searchInput, setSearchInput, activeFilterCount } = filterState;

  const { data: storesRes } = useQuery({
    ...getCrmStoresOptions(),
    enabled: isFilterOpen || Boolean(filters.tf_store_id),
  });
  const stores = storesRes?.stores ?? [];
  const storeSelectOptions = [
    { value: 'all', label: '全店舗' },
    ...stores.map((store) => ({ value: store.id, label: store.name })),
  ];

  const dateRange: DateRange | undefined =
    filters.tf_date_from || filters.tf_date_to
      ? {
          from: filters.tf_date_from ? new Date(filters.tf_date_from) : undefined,
          to: filters.tf_date_to ? new Date(filters.tf_date_to) : undefined,
        }
      : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="会員ID・氏名で検索..."
            className="h-8 pl-8 text-sm"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>

        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="ml-auto h-8 gap-1 text-xs"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <SlidersHorizontal className="size-3" />
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
          <DateRangePicker
            date={dateRange}
            placeholder="取引日で絞り込み"
            className={`h-8 justify-start gap-2 px-3 text-xs font-normal ${filterActiveClass(
              Boolean(filters.tf_date_from || filters.tf_date_to),
            )}`}
            onDateChange={(range) =>
              setFilters({
                tf_date_from: range?.from ? toIsoDate(range.from) : null,
                tf_date_to: range?.to ? toIsoDate(range.to) : null,
                tf_page: 1,
              })
            }
          />

          <Select
            value={filters.tf_store_id ?? 'all'}
            onValueChange={(value) =>
              setFilters({ tf_store_id: value === 'all' ? null : value, tf_page: 1 })
            }
            items={toSelectItems(storeSelectOptions)}
          >
            <SelectTrigger
              className={`h-8 w-40 text-xs ${filterActiveClass(filters.tf_store_id != null)}`}
            >
              <SelectValue placeholder="全店舗" />
            </SelectTrigger>
            <SelectContent>
              {storeSelectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.tf_transaction_type ?? 'all'}
            onValueChange={(value) =>
              setFilters({
                tf_transaction_type:
                  value === 'all'
                    ? null
                    : (value as NonNullable<typeof filters.tf_transaction_type>),
                tf_page: 1,
              })
            }
            items={toSelectItems(TRANSACTION_TYPE_OPTIONS)}
          >
            <SelectTrigger
              className={`h-8 w-30 text-xs ${filterActiveClass(filters.tf_transaction_type != null)}`}
            >
              <SelectValue placeholder="全種別" />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.tf_payment_method ?? 'all'}
            onValueChange={(value) =>
              setFilters({
                tf_payment_method:
                  value === 'all' ? null : (value as NonNullable<typeof filters.tf_payment_method>),
                tf_page: 1,
              })
            }
            items={toSelectItems(PAYMENT_METHOD_OPTIONS)}
          >
            <SelectTrigger
              className={`h-8 w-35 text-xs ${filterActiveClass(filters.tf_payment_method != null)}`}
            >
              <SelectValue placeholder="全決済手段" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground ml-auto h-8 text-xs"
            onClick={filterState.clearFilters}
            disabled={activeFilterCount === 0 && !searchInput}
          >
            <X className="mr-1 size-3" />
            すべてクリア
          </Button>
        </div>
      )}
    </div>
  );
}
