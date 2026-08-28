'use client';

import { BRAND_LABELS } from '@/app/(private)/brands/_constants/brand.constants';
import { filterActiveClass } from '@/utils/app.util';
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

import { ArticleCategoryType, BrandEnum } from '@/lib/api/types.gen';

import {
  ARTICLE_CATEGORY_TYPE_LABELS,
  PUBLISH_STATUS_LABELS,
} from '../_constants/article-category.constants';
import type { useArticleCategoryFilters } from '../_hooks/use-article-category-filters';

interface ArticleCategoryFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  filtersHook: ReturnType<typeof useArticleCategoryFilters>;
}

export function ArticleCategoryFilters({
  isFilterOpen,
  onFilterOpenChange,
  filtersHook,
}: ArticleCategoryFiltersProps) {
  const { filters, searchInput, setSearchInput, updateFilter, activeDetailFilterCount } =
    filtersHook;

  const BRAND_FILTER_ITEMS = {
    all: '全ブランド',
    ...BRAND_LABELS,
  };

  const TYPE_FILTER_ITEMS = {
    all: '全種別',
    ...ARTICLE_CATEGORY_TYPE_LABELS,
  };

  const PUBLISH_STATUS_FILTER_ITEMS = {
    all: '全ステータス',
    ...PUBLISH_STATUS_LABELS,
  };

  return (
    <div className="space-y-3 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-100 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="カテゴリ名・説明で検索..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-8 rounded-md pl-9 text-xs"
          />
        </div>

        <Button
          variant={activeDetailFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="ml-auto h-8 gap-1.5 text-xs"
          onClick={() => onFilterOpenChange(!isFilterOpen)}
        >
          <SlidersHorizontal className="size-4" />
          {isFilterOpen ? '閉じる' : '詳細フィルター'}
          {activeDetailFilterCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 px-1 text-[10px]">
              {activeDetailFilterCount}
            </Badge>
          )}
          {isFilterOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </Button>
      </div>

      {isFilterOpen && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            items={TYPE_FILTER_ITEMS}
            value={filters.type ?? 'all'}
            onValueChange={(value) =>
              updateFilter('type', value === 'all' ? null : (value as ArticleCategoryType))
            }
          >
            <SelectTrigger
              className={`h-8 w-32.5 text-xs ${filterActiveClass(filters.type !== null)}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_FILTER_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={BRAND_FILTER_ITEMS}
            value={filters.brandEnum ?? 'all'}
            onValueChange={(value) =>
              updateFilter('brandEnum', value === 'all' ? null : (value as BrandEnum))
            }
          >
            <SelectTrigger
              className={`h-8 w-40 text-xs ${filterActiveClass(filters.brandEnum !== null)}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BRAND_FILTER_ITEMS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={PUBLISH_STATUS_FILTER_ITEMS}
            value={filters.isPublic === null ? 'all' : String(filters.isPublic)}
            onValueChange={(value) =>
              updateFilter('isPublic', value === 'all' ? null : value === 'true')
            }
          >
            <SelectTrigger
              className={`h-8 w-30 text-xs ${filterActiveClass(filters.isPublic !== null)}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PUBLISH_STATUS_FILTER_ITEMS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
