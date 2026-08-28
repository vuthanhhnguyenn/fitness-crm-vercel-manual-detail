'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  EXERCISE_LEVEL_OPTIONS,
  EXERCISE_STATUS_LABELS,
  EXERCISE_STATUS_OPTIONS,
} from '../_constants/constants';
import { useExerciseMasterOptions } from '../_hooks/use-exercise-master-options';
import type { useExercisesFilters } from '../_hooks/use-exercises-filters';

type FiltersHook = ReturnType<typeof useExercisesFilters>;

interface ExercisesFiltersProps {
  filtersHook: FiltersHook;
  isExpanded: boolean;
  onExpandedChange: (open: boolean) => void;
}

export function ExercisesFilters({
  filtersHook,
  isExpanded,
  onExpandedChange,
}: ExercisesFiltersProps) {
  const { filters, setFilters, clearFilters, hasActiveFilters, searchInput, setSearchInput } =
    filtersHook;
  const { categoryOptions, primaryMuscleOptions, toolOptions } = useExerciseMasterOptions();

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="エクササイズ名で検索"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onExpandedChange(!isExpanded)}
            className="gap-2"
          >
            <SlidersHorizontal className="size-4" />
            {isExpanded ? '閉じる' : '詳細フィルター'}
          </Button>
          {hasActiveFilters && (
            <Button type="button" variant="ghost" onClick={clearFilters} className="gap-2">
              <X className="size-4" />
              クリア
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.categoryId ?? '__all__'}
            onValueChange={(value) =>
              setFilters({ categoryId: value === '__all__' ? null : value, page: 1 })
            }
          >
            <SelectTrigger className="w-fit min-w-[140px] rounded-lg">
              <SelectValue>
                {filters.categoryId
                  ? (categoryOptions.find((item) => item.id === filters.categoryId)?.label ??
                    '全てのカテゴリ')
                  : '全てのカテゴリ'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全てのカテゴリ</SelectItem>
              {categoryOptions.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.primaryMuscleId ?? '__all__'}
            onValueChange={(value) =>
              setFilters({ primaryMuscleId: value === '__all__' ? null : value, page: 1 })
            }
          >
            <SelectTrigger className="w-fit min-w-[140px] rounded-lg">
              <SelectValue>
                {filters.primaryMuscleId
                  ? (primaryMuscleOptions.find((item) => item.id === filters.primaryMuscleId)
                      ?.label ?? '全ての主働筋')
                  : '全ての主働筋'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全ての主働筋</SelectItem>
              {primaryMuscleOptions.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.toolId ?? '__all__'}
            onValueChange={(value) =>
              setFilters({ toolId: value === '__all__' ? null : value, page: 1 })
            }
          >
            <SelectTrigger className="w-fit min-w-[140px] rounded-lg">
              <SelectValue>
                {filters.toolId
                  ? (toolOptions.find((item) => item.id === filters.toolId)?.label ??
                    '全ての器具種別')
                  : '全ての器具種別'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全ての器具種別</SelectItem>
              {toolOptions.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.level ?? '__all__'}
            onValueChange={(value) =>
              setFilters({
                level: value === '__all__' ? null : (value as typeof filters.level),
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-fit min-w-[140px] rounded-lg">
              <SelectValue>
                {filters.level
                  ? (EXERCISE_LEVEL_OPTIONS.find((item) => item.value === filters.level)?.label ??
                    '全てのレベル')
                  : '全てのレベル'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全てのレベル</SelectItem>
              {EXERCISE_LEVEL_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.publishStatus ?? '__all__'}
            onValueChange={(value) =>
              setFilters({
                publishStatus: value === '__all__' ? null : (value as typeof filters.publishStatus),
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-fit min-w-[140px] rounded-lg">
              <SelectValue>
                {filters.publishStatus
                  ? EXERCISE_STATUS_LABELS[
                      filters.publishStatus as keyof typeof EXERCISE_STATUS_LABELS
                    ]
                  : '全てのステータス'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全てのステータス</SelectItem>
              {EXERCISE_STATUS_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {EXERCISE_STATUS_LABELS[item.value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
