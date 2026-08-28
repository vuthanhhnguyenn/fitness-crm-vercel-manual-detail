'use client';

import { useState } from 'react';

import { toSelectItems } from '@/utils/app.util';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';

import type { useSalesFilters } from '../_hooks/use-sales-filters.hook';

const BILLING_TYPE_LABELS: Record<string, string> = {
  monthly: '月次請求',
  ad_hoc: '都度請求',
  manual: '手動請求',
};

const CONFIRMATION_STATUS_OPTIONS = [
  { value: 'all', label: '全ステータス' },
  { value: 'confirmed', label: '確定済' },
  { value: 'unconfirmed', label: '未確定' },
];

function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

interface SalesFiltersProps {
  filterState: ReturnType<typeof useSalesFilters>;
}

export function SalesFilters({ filterState }: Readonly<SalesFiltersProps>) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { filters, setFilters, searchInput, setSearchInput, activeFilterCount } = filterState;

  const { data: storesRes } = useQuery({
    ...getCrmStoresOptions(),
    enabled: isFilterOpen || Boolean(filters.sf_store_id),
  });
  const stores = storesRes?.stores ?? [];
  const storeSelectOptions = [
    { value: 'all', label: '全店舗' },
    ...stores.map((store) => ({ value: store.id, label: store.name })),
  ];
  const billingTypeSelectOptions = [
    { value: 'all', label: '全請求区分' },
    ...Object.entries(BILLING_TYPE_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-100 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9 text-xs"
            placeholder="請求ID・利用者名で検索..."
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
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="ml-auto h-8 gap-1 text-xs"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
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
        <div className="flex items-center gap-2">
          <Select
            value={filters.sf_confirmation_status ?? 'all'}
            onValueChange={(value) =>
              setFilters({
                sf_confirmation_status:
                  value === 'all' ? null : (value as 'unconfirmed' | 'confirmed'),
                sf_page: 1,
              })
            }
            items={toSelectItems(CONFIRMATION_STATUS_OPTIONS)}
          >
            <SelectTrigger
              className={`h-8 w-35 text-xs ${filterActiveClass(filters.sf_confirmation_status != null)}`}
            >
              <SelectValue placeholder="全ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ステータス</SelectItem>
              <SelectItem value="confirmed">確定済</SelectItem>
              <SelectItem value="unconfirmed">未確定</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sf_store_id ?? 'all'}
            onValueChange={(value) =>
              setFilters({
                sf_store_id: value === 'all' ? null : value,
                sf_page: 1,
              })
            }
            items={toSelectItems(storeSelectOptions)}
          >
            <SelectTrigger
              className={`h-8 w-40 text-xs ${filterActiveClass(filters.sf_store_id != null)}`}
            >
              <SelectValue placeholder="全店舗" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全店舗</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.sf_billing_type ?? 'all'}
            onValueChange={(value) =>
              setFilters({
                sf_billing_type:
                  value === 'all' ? null : (value as 'monthly' | 'ad_hoc' | 'manual'),
                sf_page: 1,
              })
            }
            items={toSelectItems(billingTypeSelectOptions)}
          >
            <SelectTrigger
              className={`h-8 w-35 text-xs ${filterActiveClass(filters.sf_billing_type != null)}`}
            >
              <SelectValue placeholder="全請求区分" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全請求区分</SelectItem>
              {Object.entries(BILLING_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="mx-1 h-5 self-center!" />
          <label
            htmlFor="sales-unpaid-only"
            className="flex cursor-pointer items-center gap-2 text-xs"
          >
            <Checkbox
              id="sales-unpaid-only"
              className="size-4"
              checked={filters.sf_unpaid_only}
              onCheckedChange={(checked) =>
                setFilters({ sf_unpaid_only: checked === true, sf_page: 1 })
              }
            />
            未納のみ
          </label>
        </div>
      )}
    </div>
  );
}

export { BILLING_TYPE_LABELS };
