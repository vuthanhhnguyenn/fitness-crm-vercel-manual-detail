'use client';

import { useState } from 'react';

import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';

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

import type { LessonBrand } from '@/lib/api/types.gen';

import {
  LESSON_BRAND_LABELS,
  LESSON_CATEGORY_OPTIONS,
  LESSON_STATUS_LABELS,
  PERSONAL_CATEGORY_OPTIONS,
  STUDIO_CATEGORY_OPTIONS,
} from '../_constants/constants';
import type { UseLessonsFiltersReturn } from '../_hooks/use-lessons-filters';

const ALL = 'all';

function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

/** First element of a single-axis array filter, or the "all" sentinel. */
function singleValue(values: string[]): string {
  return values.length > 0 ? values[0] : ALL;
}

interface LessonsFilterBarProps {
  variant: 'lesson' | 'personal';
  filtersHook: UseLessonsFiltersReturn;
  searchPlaceholder: string;
}

export function LessonsFilterBar({
  variant,
  filtersHook,
  searchPlaceholder,
}: LessonsFilterBarProps) {
  const { filters, setFilters, searchInput, setSearchInput, hasActiveFilters, clearFilters } =
    filtersHook;
  const [expanded, setExpanded] = useState(false);

  const isLesson = variant === 'lesson';
  const categoryOptions = isLesson ? STUDIO_CATEGORY_OPTIONS : PERSONAL_CATEGORY_OPTIONS;

  const activeFilterCount = [
    isLesson && filters.lesson_category.length > 0,
    filters.category.length > 0,
    filters.brand.length > 0,
    filters.status.length > 0,
    isLesson && filters.include_deleted,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-[400px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9 text-xs"
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={activeFilterCount > 0 ? 'default' : 'outline'}
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setExpanded((prev) => !prev)}
          >
            <SlidersHorizontal className="size-4" />
            {expanded ? '閉じる' : '詳細フィルター'}
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-0.5 h-5 px-1 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
            {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="flex flex-wrap items-center gap-2">
          {isLesson && (
            <Select
              value={singleValue(filters.lesson_category)}
              onValueChange={(value) =>
                setFilters({ lesson_category: value && value !== ALL ? [value] : null, page: 1 })
              }
            >
              <SelectTrigger
                className={`h-8 w-[160px] text-xs ${filterActiveClass(filters.lesson_category.length > 0)}`}
              >
                <SelectValue placeholder="全区分">
                  {filters.lesson_category.length > 0
                    ? (LESSON_CATEGORY_OPTIONS.find(
                        (option) => option.value === filters.lesson_category[0],
                      )?.label ?? filters.lesson_category[0])
                    : '全区分'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>全区分</SelectItem>
                {LESSON_CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={singleValue(filters.category)}
            onValueChange={(value) =>
              setFilters({ category: value && value !== ALL ? [value] : null, page: 1 })
            }
          >
            <SelectTrigger
              className={`h-8 w-[140px] text-xs ${filterActiveClass(filters.category.length > 0)}`}
            >
              <SelectValue placeholder={isLesson ? '全カテゴリ' : '全区分'}>
                {filters.category.length > 0
                  ? (categoryOptions.find((option) => option.value === filters.category[0])
                      ?.label ?? filters.category[0])
                  : isLesson
                    ? '全カテゴリ'
                    : '全区分'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{isLesson ? '全カテゴリ' : '全区分'}</SelectItem>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={singleValue(filters.brand)}
            onValueChange={(value) =>
              setFilters({ brand: value === ALL ? null : [value as LessonBrand], page: 1 })
            }
          >
            <SelectTrigger
              className={`h-8 w-[120px] text-xs ${filterActiveClass(filters.brand.length > 0)}`}
            >
              <SelectValue placeholder="全ブランド">
                {filters.brand.length > 0 ? LESSON_BRAND_LABELS[filters.brand[0]] : '全ブランド'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全ブランド</SelectItem>
              {(['fit365', 'joyfit'] as LessonBrand[]).map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {LESSON_BRAND_LABELS[brand]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={singleValue(filters.status)}
            onValueChange={(value) =>
              setFilters({
                status: value === ALL ? null : [value as 'active' | 'inactive'],
                page: 1,
              })
            }
          >
            <SelectTrigger
              className={`h-8 w-[120px] text-xs ${filterActiveClass(filters.status.length > 0)}`}
            >
              <SelectValue placeholder="全ステータス">
                {filters.status.length > 0
                  ? LESSON_STATUS_LABELS[filters.status[0]]
                  : '全ステータス'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全ステータス</SelectItem>
              <SelectItem value="active">{LESSON_STATUS_LABELS.active}</SelectItem>
              <SelectItem value="inactive">{LESSON_STATUS_LABELS.inactive}</SelectItem>
            </SelectContent>
          </Select>

          {isLesson && (
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs">
              <Checkbox
                checked={filters.include_deleted}
                onCheckedChange={(value) =>
                  setFilters({ include_deleted: value === true ? true : null, page: 1 })
                }
                className="size-4"
              />
              削除済みも含めて表示
            </label>
          )}

          <Button
            variant="ghost"
            size="sm"
            className={`text-muted-foreground h-8 text-xs ${isLesson ? '' : 'ml-auto'}`}
            disabled={!hasActiveFilters}
            onClick={clearFilters}
          >
            すべてクリア
          </Button>
        </div>
      )}
    </div>
  );
}
