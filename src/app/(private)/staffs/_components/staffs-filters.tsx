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

import { getCrmPositionsOptions, getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';

import {
  STAFF_ROLE_LABELS,
  STAFF_STATUS_LABELS,
  StaffRole,
  StaffStatus,
} from '../_constants/constants';
import { useStaffsFiltersContext } from '../_contexts/staffs-filters-context';

interface StaffsFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  /** Hidden entirely when the header context is scoped to a single store (matches staff-list.tsx L439) */
  isSingleStoreContext?: boolean;
}

const ALL_ROLES_VALUE = '__all_roles__';
const ALL_POSITIONS_VALUE = '__all_positions__';
const ALL_STORES_VALUE = '__all_stores__';
const ALL_STATUS_VALUE = '__all_status__';

export function StaffsFilters({
  isFilterOpen,
  onFilterOpenChange,
  isSingleStoreContext = false,
}: StaffsFiltersProps) {
  const { filters, searchInput, setSearchInput, updateFilter, hasActiveFilters, clearFilters } =
    useStaffsFiltersContext();

  const { data: positionsRes, isLoading: positionsLoading } = useQuery({
    ...getCrmPositionsOptions({ query: { limit: 200 } }),
    enabled: isFilterOpen,
  });
  const positions = positionsRes?.items ?? [];

  const { data: storesRes, isLoading: storesLoading } = useQuery({
    ...getCrmStoresOptions({ query: { page: 1, limit: 100, sort_by: 'name', sort_order: 'asc' } }),
    enabled: isFilterOpen && !isSingleStoreContext,
  });
  const stores = storesRes?.stores ?? [];

  const roleOptions = (Object.values(StaffRole) as StaffRole[]).filter(
    (role) => role !== StaffRole.SYSTEM,
  );

  const activeFilterCount = [
    filters.role,
    filters.position_id,
    filters.store_id,
    filters.status,
  ].filter((v) => v !== null).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Search Row */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="relative max-w-[400px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="名前・メールアドレスで検索..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 rounded-lg pl-9"
          />
        </div>
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="h-9 gap-1.5"
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

      {/* Filter Row - Collapsible */}
      {isFilterOpen && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* ロール */}
            <Select
              value={filters.role ?? ALL_ROLES_VALUE}
              onValueChange={(value) => {
                const newValue = value ?? ALL_ROLES_VALUE;
                updateFilter('role', newValue === ALL_ROLES_VALUE ? null : (newValue as StaffRole));
              }}
              items={toSelectItems([
                { value: ALL_ROLES_VALUE, label: '全ロール' },
                ...roleOptions.map((role) => ({ value: role, label: STAFF_ROLE_LABELS[role] })),
              ])}
            >
              <SelectTrigger className="h-9 w-[160px] rounded-lg">
                <SelectValue placeholder="全ロール" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_ROLES_VALUE}>全ロール</SelectItem>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {STAFF_ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 職位 */}
            <Select
              value={
                filters.position_id != null ? String(filters.position_id) : ALL_POSITIONS_VALUE
              }
              onValueChange={(value) => {
                const newValue = value ?? ALL_POSITIONS_VALUE;
                if (newValue === ALL_POSITIONS_VALUE) {
                  updateFilter('position_id', null);
                  return;
                }
                const n = Number.parseInt(newValue, 10);
                updateFilter('position_id', Number.isNaN(n) ? null : n);
              }}
              items={toSelectItems([
                { value: ALL_POSITIONS_VALUE, label: '全職位' },
                ...positions.map((p) => ({ value: String(p.id), label: p.position_name })),
              ])}
            >
              <SelectTrigger className="h-9 min-w-[200px] rounded-lg">
                <SelectValue placeholder={positionsLoading ? '読み込み中…' : '全職位'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_POSITIONS_VALUE}>全職位</SelectItem>
                {positions.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.position_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 所属店舗 — header context が単一店舗スコープの場合は非表示 */}
            {!isSingleStoreContext && (
              <Select
                value={filters.store_id ?? ALL_STORES_VALUE}
                onValueChange={(value) => {
                  const newValue = value ?? ALL_STORES_VALUE;
                  updateFilter('store_id', newValue === ALL_STORES_VALUE ? null : newValue);
                }}
                items={toSelectItems([
                  { value: ALL_STORES_VALUE, label: '全店舗' },
                  ...stores.map((store) => ({ value: store.id, label: store.name })),
                ])}
              >
                <SelectTrigger className="h-9 min-w-[160px] rounded-lg">
                  <SelectValue placeholder={storesLoading ? '読み込み中…' : '全店舗'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STORES_VALUE}>全店舗</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* ステータス */}
            <Select
              value={filters.status ?? ALL_STATUS_VALUE}
              onValueChange={(value) => {
                const newValue = value ?? ALL_STATUS_VALUE;
                updateFilter(
                  'status',
                  newValue === ALL_STATUS_VALUE ? null : (newValue as StaffStatus),
                );
              }}
              items={toSelectItems([
                { value: ALL_STATUS_VALUE, label: '全ステータス' },
                ...Object.entries(STAFF_STATUS_LABELS).map(([value, label]) => ({ value, label })),
              ])}
            >
              <SelectTrigger className="h-9 w-fit rounded-lg">
                <SelectValue placeholder="全ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUS_VALUE}>全ステータス</SelectItem>
                {Object.entries(STAFF_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* フィルタクリア */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
              すべてクリア
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
