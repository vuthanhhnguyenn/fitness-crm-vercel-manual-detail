'use client';

import type { DateRange } from 'react-day-picker';

import { toSelectItems } from '@/utils/app.util';
import { format } from 'date-fns';
import { Search, X } from 'lucide-react';

import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { RefundQueueEntry } from '@/lib/api/types.gen';

import type { useRefundFilters } from '../_hooks/use-refund-filters.hook';
import {
  PAYMENT_METHOD_LABELS,
  REFUND_STATUS_LABELS,
  REQUESTER_ROLE_FILTER_LABELS,
} from './refund-queue-table';

type RefundStatus = RefundQueueEntry['status'];
type PaymentMethod = RefundQueueEntry['payment_method'];
type RequesterRole = RefundQueueEntry['requester_role'];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'all', label: '全決済手段' },
  ...Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label })),
];

const REQUESTER_ROLE_OPTIONS = [
  { value: 'all', label: '全ロール' },
  ...Object.entries(REQUESTER_ROLE_FILTER_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_OPTIONS = [
  { value: 'all', label: '全ステータス' },
  ...Object.entries(REFUND_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

interface RefundFiltersProps {
  filterState: ReturnType<typeof useRefundFilters>;
}

/** FR-015: search + status/payment-method/requester-role/date-range filters for the refund queue. */
export function RefundFilters({ filterState }: Readonly<RefundFiltersProps>) {
  const { filters, setFilters, searchInput, setSearchInput } = filterState;

  const dateRange: DateRange | undefined =
    filters.rf_date_from || filters.rf_date_to
      ? {
          from: filters.rf_date_from ? new Date(filters.rf_date_from) : undefined,
          to: filters.rf_date_to ? new Date(filters.rf_date_to) : undefined,
        }
      : undefined;

  return (
    <div className="flex items-center gap-2">
      <div className="relative max-w-100 flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          className="pl-9 text-xs"
          placeholder="返金ID・会員名で検索..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
        {searchInput && (
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2"
            onClick={() => setSearchInput('')}
          >
            <X className="text-muted-foreground size-3" />
          </button>
        )}
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <DateRangePicker
          date={dateRange}
          placeholder="申請日で絞り込み"
          className="h-8 justify-start gap-2 px-3 text-xs font-normal"
          onDateChange={(range) =>
            setFilters({
              rf_date_from: range?.from ? toIsoDate(range.from) : null,
              rf_date_to: range?.to ? toIsoDate(range.to) : null,
              rf_page: 1,
            })
          }
        />

        <Select
          value={filters.rf_payment_method ?? 'all'}
          onValueChange={(value) =>
            setFilters({
              rf_payment_method: value === 'all' ? null : (value as PaymentMethod),
              rf_page: 1,
            })
          }
          items={toSelectItems(PAYMENT_METHOD_OPTIONS)}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs">
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

        <Select
          value={filters.rf_requester_role ?? 'all'}
          onValueChange={(value) =>
            setFilters({
              rf_requester_role: value === 'all' ? null : (value as RequesterRole),
              rf_page: 1,
            })
          }
          items={toSelectItems(REQUESTER_ROLE_OPTIONS)}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="全ロール" />
          </SelectTrigger>
          <SelectContent>
            {REQUESTER_ROLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.rf_status ?? 'all'}
          onValueChange={(value) =>
            setFilters({
              rf_status: value === 'all' ? null : (value as RefundStatus),
              rf_page: 1,
            })
          }
          items={toSelectItems(STATUS_OPTIONS)}
        >
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="全ステータス" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
