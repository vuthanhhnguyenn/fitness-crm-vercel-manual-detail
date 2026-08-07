'use client';

import { type Dispatch, type SetStateAction, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from 'lucide-react';

import { SearchableSelect } from '@/components/common/searchable-select';
import { TextWithTooltip } from '@/components/common/text-with-tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

import { getCrmStoresByIdOptions, getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { Store } from '@/lib/api/types.gen';

import type { EquipmentStatus, EquipmentType } from '../_constants/constants';
import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_TYPE_LABELS } from '../_constants/constants';

function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

function buildFilterSummary({
  searchInput,
  storeName,
  equipmentType,
  equipmentStatus,
}: {
  searchInput: string;
  storeName: string | null;
  equipmentType: EquipmentType | null;
  equipmentStatus: EquipmentStatus | null;
}) {
  const parts: string[] = [];

  if (searchInput) {
    parts.push(`検索: "${searchInput}"`);
  }
  if (storeName) {
    parts.push(`店舗: ${storeName}`);
  }
  if (equipmentType) {
    parts.push(`機器タイプ: ${EQUIPMENT_TYPE_LABELS[equipmentType]}`);
  }
  if (equipmentStatus) {
    parts.push(`ステータス: ${EQUIPMENT_STATUS_LABELS[equipmentStatus]}`);
  }

  return parts.join('、');
}

interface EquipmentFiltersProps {
  activeFilterCount: number;
  clearFilterSelects: () => void;
  clearFilters: () => void;
  filters: {
    equipment_store_id: string | null;
    equipment_type: EquipmentType | null;
    equipment_status: EquipmentStatus | null;
  };
  hasActiveFilters: boolean;
  isFilterOpen: boolean;
  searchInput: string;
  setFilters: (value: {
    equipment_page?: number;
    equipment_store_id?: string | null;
    equipment_type?: EquipmentType | null;
    equipment_status?: EquipmentStatus | null;
  }) => void;
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
  setSearchInput: (value: string) => void;
  total: number;
}

export function EquipmentFilters({
  activeFilterCount,
  clearFilterSelects,
  clearFilters,
  filters,
  hasActiveFilters,
  isFilterOpen,
  searchInput,
  setFilters,
  setIsFilterOpen,
  setSearchInput,
  total,
}: EquipmentFiltersProps) {
  const [isStorePopoverOpen, setIsStorePopoverOpen] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  const { data: storesRes, isFetching: isStoresFetching } = useQuery({
    ...getCrmStoresOptions({
      query: {
        page: 1,
        limit: 20,
        search: storeSearchQuery || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
    enabled: isFilterOpen && isStorePopoverOpen,
  });

  const stores = storesRes?.stores ?? [];
  const selectedStoreFromOptions = filters.equipment_store_id
    ? stores.find((store) => store.id === filters.equipment_store_id)
    : undefined;

  const { data: selectedStoreRes } = useQuery({
    ...getCrmStoresByIdOptions({ path: { id: filters.equipment_store_id ?? '' } }),
    enabled: isFilterOpen && !!filters.equipment_store_id && !selectedStoreFromOptions,
  });

  const selectedStoreLabel = filters.equipment_store_id
    ? (selectedStoreFromOptions?.name ?? selectedStoreRes?.store?.name)
    : '全店舗';

  const filterSummary = buildFilterSummary({
    searchInput,
    storeName:
      filters.equipment_store_id && selectedStoreLabel && selectedStoreLabel !== '全店舗'
        ? selectedStoreLabel
        : null,
    equipmentType: filters.equipment_type,
    equipmentStatus: filters.equipment_status,
  });

  const handleStoreSelect = (store: Store | null) => {
    setFilters({
      equipment_store_id: store?.id ?? null,
      equipment_page: 1,
    });
  };

  return (
    <div className="space-y-4">
      {hasActiveFilters && (
        <Alert className="py-2">
          <AlertDescription className="flex items-center justify-between text-xs">
            <span>
              <span className="font-medium">{total} 件</span>を抽出中
              {filterSummary ? (
                <span className="text-muted-foreground ml-1">: {filterSummary}</span>
              ) : null}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 shrink-0 text-xs"
              onClick={clearFilters}
            >
              <X className="mr-1 size-3" />
              条件をクリア
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative max-w-[400px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="機器名、シリアル、設置場所で検索"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-8 pl-9 text-xs"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={activeFilterCount > 0 ? 'default' : 'outline'}
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => setIsFilterOpen((previous) => !previous)}
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
        </div>

        {isFilterOpen && (
          <div className="flex flex-wrap items-center gap-2">
            <SearchableSelect
              value={filters.equipment_store_id}
              valueLabel={selectedStoreLabel}
              options={stores}
              placeholder="全店舗"
              searchPlaceholder="店舗名・店舗IDで検索..."
              emptyMessage="該当する店舗がありません"
              loadingMessage="店舗を読み込み中..."
              clearLabel="全店舗"
              open={isStorePopoverOpen}
              onOpenChange={setIsStorePopoverOpen}
              onSearchChange={setStoreSearchQuery}
              onSelect={handleStoreSelect}
              getOptionKey={(store) => store.id}
              getOptionLabel={(store) => store.name}
              getOptionKeywords={(store) =>
                [store.name, store.store_id, store.id, store.club_code].filter(Boolean).join(' ')
              }
              renderOption={(store) => (
                <div className="flex min-w-0 flex-col items-start gap-0.5">
                  <TextWithTooltip
                    text={store.name}
                    wrapperClassName="w-full"
                    className="w-full"
                    side="right"
                    align="center"
                  />
                </div>
              )}
              isLoading={isStoresFetching}
              triggerClassName={`h-8 w-64 justify-between rounded-lg px-3 text-xs font-normal ${filterActiveClass(filters.equipment_store_id !== null)}`}
            />

            <Select
              value={filters.equipment_type ?? 'all'}
              onValueChange={(value) => {
                setFilters({
                  equipment_type: value === 'all' ? null : (value as EquipmentType),
                  equipment_page: 1,
                });
              }}
            >
              <SelectTrigger
                className={`h-8 text-xs ${filterActiveClass(filters.equipment_type !== null)}`}
              >
                <SelectValue placeholder="全ての機器タイプ">
                  {filters.equipment_type
                    ? EQUIPMENT_TYPE_LABELS[filters.equipment_type]
                    : '全ての機器タイプ'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ての機器タイプ</SelectItem>
                {Object.entries(EQUIPMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.equipment_status ?? 'all'}
              onValueChange={(value) => {
                setFilters({
                  equipment_status: value === 'all' ? null : (value as EquipmentStatus),
                  equipment_page: 1,
                });
              }}
            >
              <SelectTrigger
                className={`h-8 text-xs ${filterActiveClass(filters.equipment_status !== null)}`}
              >
                <SelectValue placeholder="全てのステータス">
                  {filters.equipment_status
                    ? EQUIPMENT_STATUS_LABELS[filters.equipment_status]
                    : '全てのステータス'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全てのステータス</SelectItem>
                {Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground ml-auto h-8 text-xs"
              onClick={clearFilterSelects}
            >
              すべてクリア
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
