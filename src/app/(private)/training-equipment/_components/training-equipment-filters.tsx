'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { ToolType } from '@/lib/api/types.gen';

import {
  TRAINING_EQUIPMENT_KEYWORD_MAX_LENGTH,
  TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
  TRAINING_EQUIPMENT_STATUS_FILTER_OPTIONS,
} from '../_constants/training-equipment.constants';
import type { TrainingEquipmentUrlFilters } from '../_hooks/use-training-equipment-filters.hook';

function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

interface TrainingEquipmentFiltersProps {
  filters: Pick<TrainingEquipmentUrlFilters, 'te_tool' | 'te_status'>;
  /** Tool-type master, fetched once by the list page and shared here. */
  toolTypes: ToolType[];
  searchInput: string;
  setSearchInput: (value: string) => void;
  setFilters: (
    value: Partial<Pick<TrainingEquipmentUrlFilters, 'te_page' | 'te_tool' | 'te_status'>>,
  ) => void;
}

/**
 * FR-002 toolbar. With only two filters it stays permanently expanded (no collapsing).
 */
export function TrainingEquipmentFilters({
  filters,
  toolTypes,
  searchInput,
  setSearchInput,
  setFilters,
}: TrainingEquipmentFiltersProps) {
  const selectedToolType = filters.te_tool
    ? toolTypes.find((item) => item.id === filters.te_tool)
    : undefined;
  const selectedStatus = TRAINING_EQUIPMENT_STATUS_FILTER_OPTIONS.find(
    (option) => option.value === filters.te_status,
  );

  return (
    <div className="flex items-center gap-2">
      <div className="relative max-w-100 flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          className="pl-9 text-xs"
          placeholder="機材名で検索"
          maxLength={TRAINING_EQUIPMENT_KEYWORD_MAX_LENGTH}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Select
          value={filters.te_tool ?? 'all'}
          onValueChange={(value) =>
            setFilters({ te_tool: value === 'all' ? null : value, te_page: 1 })
          }
        >
          <SelectTrigger
            className={`h-8 w-45 text-xs ${filterActiveClass(Boolean(filters.te_tool))}`}
          >
            <SelectValue placeholder="全器具種別">
              {filters.te_tool ? (selectedToolType?.name ?? filters.te_tool) : '全器具種別'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全器具種別</SelectItem>
            {toolTypes.map((toolType) => (
              <SelectItem key={toolType.id} value={toolType.id}>
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
            className={`h-8 w-45 text-xs ${filterActiveClass(
              filters.te_status !== TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
            )}`}
          >
            <SelectValue>{selectedStatus?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TRAINING_EQUIPMENT_STATUS_FILTER_OPTIONS.map((option) => (
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
