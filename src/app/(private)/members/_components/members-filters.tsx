'use client';

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
import { Brand, ContractType, MemberStatus } from '@/lib/api/types.gen';

import { BRAND_LABELS, CONTRACT_TYPE_LABELS, MEMBER_STATUS_LABELS } from '../_constants/constants';
import { useMembersFiltersContext } from '../_contexts/members-filters-context';

const PERIOD_OPTIONS = [
  { value: '30', label: '過去1ヶ月' },
  { value: '90', label: '過去3ヶ月' },
  { value: '180', label: '過去6ヶ月' },
  { value: '365', label: '過去1年' },
];

interface MembersFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

export function MembersFilters({ isFilterOpen, onFilterOpenChange }: MembersFiltersProps) {
  const { filters, searchInput, setSearchInput, updateFilter, hasActiveFilters, clearFilters } =
    useMembersFiltersContext();
  const { data: storesRes } = useQuery({
    ...getCrmStoresOptions({
      query: {
        page: 1,
        limit: 100,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
  });
  const stores = storesRes?.stores ?? [];

  const { contract_type, status, brand, store_id, last_visit_days } = filters;

  const periodValue =
    last_visit_days !== null && last_visit_days !== undefined ? String(last_visit_days) : 'all';

  const activeFilterCount = [
    status.length > 0,
    contract_type.length > 0,
    brand.length > 0,
    store_id.length > 0,
    last_visit_days !== null && last_visit_days !== undefined,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-[400px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="会員ID・氏名・カナ・電話番号・メールアドレス・旧会員番号"
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
            value={store_id.length > 0 ? store_id[0] : 'all'}
            onValueChange={(value) => {
              const newValue = value ?? 'all';
              if (newValue === 'all') {
                updateFilter('store_id', []);
              } else {
                updateFilter('store_id', [newValue]);
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className={`h-8 w-[160px] text-xs ${filterActiveClass(store_id.length > 0)}`}
            >
              <SelectValue>
                {store_id.length > 0
                  ? (stores.find((store) => store.id === store_id[0])?.name ?? store_id[0])
                  : '全店舗'}
              </SelectValue>
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
            value={status.length > 0 ? status[0] : 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                updateFilter('status', []);
              } else {
                updateFilter('status', [value as MemberStatus]);
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className={`h-8 w-[140px] text-xs ${filterActiveClass(status.length > 0)}`}
            >
              <SelectValue>
                {status.length > 0
                  ? MEMBER_STATUS_LABELS[status[0] as MemberStatus]
                  : '全ステータス'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ステータス</SelectItem>
              {Object.entries(MEMBER_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={contract_type.length > 0 ? contract_type[0] : 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                updateFilter('contract_type', []);
              } else {
                updateFilter('contract_type', [value as ContractType]);
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className={`h-8 w-[140px] text-xs ${filterActiveClass(contract_type.length > 0)}`}
            >
              <SelectValue>
                {contract_type.length > 0
                  ? CONTRACT_TYPE_LABELS[contract_type[0] as ContractType]
                  : '全契約種別'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全契約種別</SelectItem>
              {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={brand.length > 0 ? brand[0] : 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                updateFilter('brand', []);
              } else {
                updateFilter('brand', [value as Brand]);
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className={`h-8 w-[140px] text-xs ${filterActiveClass(brand.length > 0)}`}
            >
              <SelectValue>
                {brand.length > 0 ? BRAND_LABELS[brand[0] as Brand] : '全ブランド'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ブランド</SelectItem>
              {Object.entries(BRAND_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={periodValue}
            onValueChange={(value) => {
              const newValue = value ?? 'all';
              if (newValue === 'all') {
                updateFilter('last_visit_days', null);
              } else {
                updateFilter('last_visit_days', parseInt(newValue, 10));
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className={`h-8 w-[140px] text-xs ${filterActiveClass(
                last_visit_days !== null && last_visit_days !== undefined,
              )}`}
            >
              <SelectValue>
                {last_visit_days !== null && last_visit_days !== undefined
                  ? (PERIOD_OPTIONS.find((o) => o.value === String(last_visit_days))?.label ??
                    '全期間')
                  : '全期間'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全期間</SelectItem>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground ml-auto h-8 text-xs"
            >
              すべてクリア
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
