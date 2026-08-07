'use client';

import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmBrandsOptions, getCrmPositionsOptions } from '@/lib/api/@tanstack/react-query.gen';

import {
  STAFF_BRAND_LABELS,
  STAFF_STATUS_LABELS,
  StaffBrand,
  StaffStatus,
} from '../_constants/constants';
import { useStaffsFiltersContext } from '../_contexts/staffs-filters-context';

interface StaffsFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

const ALL_POSITIONS_VALUE = '__all__';

export function StaffsFilters({ isFilterOpen, onFilterOpenChange }: StaffsFiltersProps) {
  const { filters, searchInput, setSearchInput, updateFilter, hasActiveFilters, clearFilters } =
    useStaffsFiltersContext();

  const { data: positionsRes, isLoading: positionsLoading } = useQuery({
    ...getCrmPositionsOptions(),
    enabled: isFilterOpen,
  });
  const positions = positionsRes?.positions ?? [];

  const { data: brandsRes, isLoading: brandsLoading } = useQuery({
    ...getCrmBrandsOptions(),
    enabled: isFilterOpen,
  });
  const apiBrands = brandsRes?.brands ?? [];

  const brandOptionLabel = (code: StaffBrand): string => {
    const fromApi = apiBrands.find((b) => b.code === code);
    if (fromApi) return fromApi.display_name;
    return STAFF_BRAND_LABELS[code];
  };

  const positionInList =
    filters.position_id != null ? positions.some((p) => p.id === filters.position_id) : false;

  const selectedPositionLabel =
    filters.position_id != null
      ? positions.find((p) => p.id === filters.position_id)?.position_name
      : null;

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
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => onFilterOpenChange(!isFilterOpen)}
        >
          <SlidersHorizontal className="size-4" />
          {isFilterOpen ? '閉じる' : '詳細フィルター'}
        </Button>
      </div>

      {/* Filter Row - Collapsible */}
      {isFilterOpen && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
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
            >
              <SelectTrigger className="h-9 min-w-[200px] rounded-lg">
                <div className="flex items-center gap-1.5">
                  <SelectValue placeholder="全職位">
                    {selectedPositionLabel ??
                      (filters.position_id != null && !positionInList
                        ? positionsLoading
                          ? '読み込み中…'
                          : `職位 #${filters.position_id}`
                        : null) ??
                      '全職位'}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_POSITIONS_VALUE}>全職位</SelectItem>
                {filters.position_id != null && !positionInList ? (
                  <SelectItem value={String(filters.position_id)}>
                    {positionsLoading ? '読み込み中…' : `職位 #${filters.position_id}`}
                  </SelectItem>
                ) : null}
                {positions.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.position_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ブランド — labels from Y-07 API when available, else constants */}
            <Select
              value={filters.brand ?? ''}
              onValueChange={(value) => {
                const newValue = value ?? '';
                updateFilter('brand', (newValue as StaffBrand) || null);
              }}
            >
              <SelectTrigger className="h-9 w-fit min-w-[140px] rounded-lg">
                <div className="flex items-center gap-1.5">
                  <SelectValue placeholder="全ブランド">
                    {filters.brand
                      ? brandsLoading && apiBrands.length === 0
                        ? '読み込み中…'
                        : brandOptionLabel(filters.brand)
                      : '全ブランド'}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STAFF_BRAND_LABELS) as StaffBrand[]).map((code) => (
                  <SelectItem key={code} value={code}>
                    {brandOptionLabel(code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ステータス */}
            <Select
              value={filters.status ?? ''}
              onValueChange={(value) => {
                const newValue = value ?? '';
                updateFilter('status', (newValue as StaffStatus) || null);
              }}
            >
              <SelectTrigger className="h-9 w-fit rounded-lg">
                <div className="flex items-center gap-1.5">
                  <SelectValue placeholder="全ステータス">
                    {filters.status ? STAFF_STATUS_LABELS[filters.status] : '全ステータス'}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
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
