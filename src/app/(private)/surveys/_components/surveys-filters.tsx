'use client';

import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';

import { BRAND_LABELS } from '@/components/common/brand-badge';
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

import {
  Brand,
  StoreListBrand,
  SurveyTemplateStatus,
  SurveyTemplateType,
} from '@/lib/api/types.gen';

import { SURVEY_STATUS_LABELS, SURVEY_TYPE_LABELS } from '../_constants/constants';
import { useSurveysFiltersContext } from '../_contexts/surveys-filters-context';

interface SurveysFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

export function SurveysFilters({ isFilterOpen, onFilterOpenChange }: SurveysFiltersProps) {
  const { filters, searchInput, setSearchInput, updateFilter, hasActiveFilters, clearFilters } =
    useSurveysFiltersContext();

  const activeFilterCount = [
    filters.type !== null,
    filters.brand !== null,
    filters.status !== null,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative max-w-100 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="アンケート名で検索..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-8 rounded-lg pl-9 text-xs"
          />
        </div>

        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="ml-auto h-8 gap-1.5 text-xs"
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
            value={filters.type ?? 'all'}
            onValueChange={(value) =>
              updateFilter('type', value === 'all' ? null : (value as SurveyTemplateType))
            }
          >
            <SelectTrigger size="sm" className="w-fit rounded-lg">
              <SelectValue placeholder="すべての種別">
                {filters.type ? SURVEY_TYPE_LABELS[filters.type] : 'すべての種別'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての種別</SelectItem>
              {Object.values(SurveyTemplateType).map((type) => (
                <SelectItem key={type} value={type}>
                  {SURVEY_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.brand ?? 'all'}
            onValueChange={(value) =>
              updateFilter('brand', value === 'all' ? null : (value as StoreListBrand))
            }
          >
            <SelectTrigger size="sm" className="w-fit rounded-lg">
              <SelectValue placeholder="すべてのブランド">
                {filters.brand
                  ? BRAND_LABELS[filters.brand as unknown as Brand]
                  : 'すべてのブランド'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのブランド</SelectItem>
              {Object.values(StoreListBrand).map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {BRAND_LABELS[brand as unknown as Brand]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status ?? 'all'}
            onValueChange={(value) =>
              updateFilter('status', value === 'all' ? null : (value as SurveyTemplateStatus))
            }
          >
            <SelectTrigger size="sm" className="w-fit rounded-lg">
              <SelectValue placeholder="すべての状態">
                {filters.status ? SURVEY_STATUS_LABELS[filters.status] : 'すべての状態'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての状態</SelectItem>
              {Object.values(SurveyTemplateStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {SURVEY_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground ml-auto h-8 text-xs"
              onClick={clearFilters}
            >
              すべてクリア
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
