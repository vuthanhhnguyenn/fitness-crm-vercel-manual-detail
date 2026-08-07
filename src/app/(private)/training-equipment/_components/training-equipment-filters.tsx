'use client';

import { type Dispatch, type SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from 'lucide-react';

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

import { getCrmToolTypesOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { TrainingEquipmentItem } from '@/lib/api/types.gen';

import {
  TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
  TRAINING_EQUIPMENT_STATUS_FILTER_OPTIONS,
} from '../_constants/training-equipment.constants';
import type { TrainingEquipmentUrlFilters } from '../_hooks/use-training-equipment-filters.hook';

function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

function buildFilterSummary({
  searchInput,
  toolTypeLabel,
  statusLabel,
}: {
  searchInput: string;
  toolTypeLabel: string | null;
  statusLabel: string | null;
}) {
  const parts: string[] = [];
  if (searchInput) parts.push(`検索: "${searchInput}"`);
  if (toolTypeLabel) parts.push(`器具種別: ${toolTypeLabel}`);
  if (statusLabel) parts.push(`設置状態: ${statusLabel}`);
  return parts.join('、');
}

interface TrainingEquipmentFiltersProps {
  activeFilterCount: number;
  clearFilterSelects: () => void;
  clearFilters: () => void;
  filters: Pick<TrainingEquipmentUrlFilters, 'te_tool_type' | 'te_status'>;
  hasActiveFilters: boolean;
  isFilterOpen: boolean;
  searchInput: string;
  setFilters: (
    value: Partial<Pick<TrainingEquipmentUrlFilters, 'te_page' | 'te_tool_type' | 'te_status'>>,
  ) => void;
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
  setSearchInput: (value: string) => void;
  total: number;
  totalUnfiltered?: number;
  showBanner?: boolean;
}

export function TrainingEquipmentFilters({
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
  totalUnfiltered,
  showBanner = true,
}: TrainingEquipmentFiltersProps) {
  const { data: toolTypesRes } = useQuery({
    ...getCrmToolTypesOptions(),
    enabled: isFilterOpen || Boolean(filters.te_tool_type),
  });

  const toolTypes = toolTypesRes?.items ?? [];
  const selectedToolType = filters.te_tool_type
    ? toolTypes.find((item) => item.code === filters.te_tool_type)
    : undefined;
  const selectedStatus = TRAINING_EQUIPMENT_STATUS_FILTER_OPTIONS.find(
    (option) => option.value === filters.te_status,
  );

  return (
    <div className="space-y-3">
      {showBanner && hasActiveFilters && (
        <Alert className="py-2">
          <AlertDescription className="flex items-center justify-between text-xs">
            <span>
              全 {totalUnfiltered ?? total} 件中 <span className="font-medium">{total} 件</span>
              を抽出中
              {buildFilterSummary({
                searchInput,
                toolTypeLabel: selectedToolType?.name ?? null,
                statusLabel:
                  filters.te_status !== TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT
                    ? (selectedStatus?.label ?? null)
                    : null,
              }) && (
                <span className="text-muted-foreground ml-1">
                  :{' '}
                  {buildFilterSummary({
                    searchInput,
                    toolTypeLabel: selectedToolType?.name ?? null,
                    statusLabel:
                      filters.te_status !== TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT
                        ? (selectedStatus?.label ?? null)
                        : null,
                  })}
                </span>
              )}
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

      <div className="flex items-center gap-2">
        <div className="relative max-w-[400px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9 text-xs"
            placeholder="機材名、設置場所で検索"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="ml-auto h-8 gap-1 text-xs"
          onClick={() => setIsFilterOpen((open) => !open)}
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
            value={filters.te_tool_type ?? 'all'}
            onValueChange={(value) =>
              setFilters({
                te_tool_type:
                  value === 'all' ? null : (value as TrainingEquipmentItem['tool_type']),
                te_page: 1,
              })
            }
          >
            <SelectTrigger
              className={`h-8 w-[180px] text-xs ${filterActiveClass(Boolean(filters.te_tool_type))}`}
            >
              <SelectValue placeholder="全器具種別">
                {filters.te_tool_type
                  ? (selectedToolType?.name ?? filters.te_tool_type)
                  : '全器具種別'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全器具種別</SelectItem>
              {toolTypes.map((toolType) => (
                <SelectItem key={toolType.id} value={toolType.code}>
                  {toolType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.te_status}
            onValueChange={(value) =>
              setFilters({
                te_status: value as TrainingEquipmentUrlFilters['te_status'],
                te_page: 1,
              })
            }
          >
            <SelectTrigger
              className={`h-8 w-[180px] text-xs ${filterActiveClass(
                filters.te_status !== TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
              )}`}
            >
              <SelectValue placeholder="廃棄を除く（デフォルト）">
                {selectedStatus?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TRAINING_EQUIPMENT_STATUS_FILTER_OPTIONS.map((option) => (
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
            onClick={clearFilterSelects}
          >
            すべてクリア
          </Button>
        </div>
      )}
    </div>
  );
}
