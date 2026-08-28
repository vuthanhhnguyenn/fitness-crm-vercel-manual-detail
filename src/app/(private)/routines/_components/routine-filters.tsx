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

import { getCrmRoutineCategoriesOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { RoutinePublishStatus } from '@/lib/api/types.gen';

import { ROUTINE_PUBLISH_STATUS_LABELS } from '../_constants/routine.constants';

const CATEGORY_ALL = '__all_categories__';
const STATUS_ALL = '__all_statuses__';

type RoutineFiltersProps = {
  searchInput: string;
  setSearchInput: (value: string) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  activeFilterCount: number;
  categoryId: string | null;
  publishStatus: RoutinePublishStatus | null;
  onCategoryChange: (categoryId: string | null) => void;
  onStatusChange: (status: RoutinePublishStatus | null) => void;
  onClearFilters: () => void;
};

export function RoutineFilters({
  searchInput,
  setSearchInput,
  isFilterOpen,
  setIsFilterOpen,
  activeFilterCount,
  categoryId,
  publishStatus,
  onCategoryChange,
  onStatusChange,
  onClearFilters,
}: RoutineFiltersProps) {
  const { data: categoriesData } = useQuery({ ...getCrmRoutineCategoriesOptions() });
  const categories = categoriesData?.items ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-[400px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9 text-xs"
            placeholder="ルーティン名で検索"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={activeFilterCount > 0 ? 'default' : 'outline'}
            size="sm"
            className="h-8 gap-1 text-xs"
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
      </div>

      {isFilterOpen && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={categoryId ?? CATEGORY_ALL}
            onValueChange={(value) => onCategoryChange(value === CATEGORY_ALL ? null : value)}
          >
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue placeholder="全てのカテゴリ">
                {categoryId
                  ? (categories.find((category) => category.id === categoryId)?.name ?? categoryId)
                  : '全てのカテゴリ'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CATEGORY_ALL}>全てのカテゴリ</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={publishStatus ?? STATUS_ALL}
            onValueChange={(value) =>
              onStatusChange(value === STATUS_ALL ? null : (value as RoutinePublishStatus))
            }
          >
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="全てのステータス">
                {publishStatus ? ROUTINE_PUBLISH_STATUS_LABELS[publishStatus] : '全てのステータス'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_ALL}>全てのステータス</SelectItem>
              <SelectItem value="published">{ROUTINE_PUBLISH_STATUS_LABELS.published}</SelectItem>
              <SelectItem value="unpublished">
                {ROUTINE_PUBLISH_STATUS_LABELS.unpublished}
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground ml-auto h-8 text-xs"
            onClick={onClearFilters}
          >
            すべてクリア
          </Button>
        </div>
      )}
    </div>
  );
}
