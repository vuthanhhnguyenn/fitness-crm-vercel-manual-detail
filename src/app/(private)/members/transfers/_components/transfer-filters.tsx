'use client';

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

import { useTransferFiltersContext } from '../_contexts/transfer-filters-context';

const MOCK_STORES = [
  { value: 'all', label: '全店舗（移籍先）' },
  { value: 'store-joyfit-001', label: 'JOYFIT池袋店' },
  { value: 'store-joyfit-002', label: 'JOYFIT新宿店' },
  { value: 'store-joyfit-003', label: 'JOYFIT渋谷店' },
  { value: 'store-joyfit-004', label: 'JOYFIT横浜店' },
  { value: 'store-fit365-001', label: 'FIT365八潮店' },
  { value: 'store-fit365-002', label: 'FIT365川口店' },
  { value: 'store-fit365-003', label: 'FIT365大宮店' },
  { value: 'store-fit365-004', label: 'FIT365越谷店' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: '全ステータス' },
  { value: 'pending', label: '申請中' },
  { value: 'from_store_approved', label: '店舗承認済' },
  { value: 'approved', label: '承認済' },
  { value: 'rejected', label: '却下' },
  { value: 'completed', label: '移籍完了' },
];

const APPLIED_PERIOD_OPTIONS = [
  { value: 'all', label: '全期間' },
  { value: 'this_month', label: '今月' },
  { value: 'last_month', label: '先月' },
  { value: 'this_year', label: '今年' },
];

const BRAND_OPTIONS = [
  { value: 'all', label: '全ブランド' },
  { value: 'joyfit', label: 'JOYFIT' },
  { value: 'fit365', label: 'FIT365' },
];

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

      {/* Expandable filter bar */}
      {isFilterOpen && (
        <div className="flex flex-wrap items-center gap-2">
          {/* ステータス */}
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(v) =>
              updateFilter('status', v === 'all' ? null : (v as typeof filters.status))
            }
            items={STATUS_OPTIONS}
          >
            <SelectTrigger
              className={`h-8 w-[140px] text-xs ${filterActiveClass(filters.status !== null)}`}
            >
              <SelectValue placeholder="全ステータス" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 移籍元店舗 */}
          <Select
            value={filters.from_store_id ?? 'all'}
            onValueChange={(v) => updateFilter('from_store_id', v === 'all ' ? null : v)}
            items={MOCK_STORES}
          >
            <SelectTrigger
              className={`h-8 w-[160px] text-xs ${filterActiveClass(filters.from_store_id !== null)}`}
            >
              <SelectValue placeholder="全店舗（移籍元）" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_STORES.map((store) => (
                <SelectItem key={store.value} value={store.value} className="text-xs">
                  {store.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 移籍先店舗 */}
          <Select
            value={filters.to_store_id ?? 'all'}
            onValueChange={(v) => updateFilter('to_store_id', v === 'all' ? null : v)}
            items={MOCK_STORES}
          >
            <SelectTrigger
              className={`h-8 w-[160px] text-xs ${filterActiveClass(filters.to_store_id !== null)}`}
            >
              <SelectValue placeholder="全店舗（移籍先）" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_STORES.map((store) => (
                <SelectItem key={store.value} value={store.value} className="text-xs">
                  {store.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* ブランド */}
          <Select
            value={filters.brand ?? 'all'}
            onValueChange={(v) =>
              updateFilter('brand', v === 'all' ? null : (v as typeof filters.brand))
            }
            items={BRAND_OPTIONS}
          >
            <SelectTrigger
              className={`h-8 w-[130px] text-xs ${filterActiveClass(filters.brand !== null)}`}
            >
              <SelectValue placeholder="全ブランド" />
            </SelectTrigger>
            <SelectContent>
              {BRAND_OPTIONS.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className={item.value !== 'all' ? 'text-xs' : ''}
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 申請日 */}
          <Select
            value={filters.applied_period ?? 'all'}
            onValueChange={(v) =>
              updateFilter(
                'applied_period',
                v === 'all' ? null : (v as typeof filters.applied_period),
              )
            }
            items={APPLIED_PERIOD_OPTIONS}
          >
            <SelectTrigger
              className={`h-8 w-[120px] text-xs ${filterActiveClass(filters.applied_period !== null)}`}
            >
              <SelectValue placeholder="全期間" />
            </SelectTrigger>
            <SelectContent>
              {APPLIED_PERIOD_OPTIONS.map((opt) => (
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
