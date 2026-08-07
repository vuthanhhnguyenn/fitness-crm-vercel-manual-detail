'use client';

import { useQuery } from '@tanstack/react-query';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import { MemberType, StoreListBrand, SurveyTemplateType } from '@/lib/api/types.gen';

import {
  SURVEY_BRAND_LABELS,
  SURVEY_RESPONSE_MEMBER_TYPE_LABELS,
  SURVEY_TYPE_LABELS,
} from '../../_constants/constants';
import { useSurveyResponsesFiltersContext } from '../_contexts/survey-responses-filters-context';

interface SurveyResponsesFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

export function SurveyResponsesFilters({
  isFilterOpen,
  onFilterOpenChange,
}: Readonly<SurveyResponsesFiltersProps>) {
  const { filters, searchInput, setSearchInput, updateFilter, hasActiveFilters, clearFilters } =
    useSurveyResponsesFiltersContext();

  const { data: storesData } = useQuery({
    ...getCrmStoresOptions({ query: { page: 1, limit: 100 } }),
  });

  const storeOptions =
    storesData?.stores?.map((store) => ({
      value: store.id,
      label: `${store.store_id} ${store.name}`,
    })) ?? [];

  const periodFromDate = filters.period_from
    ? parse(filters.period_from, 'yyyy/MM/dd', new Date(), { locale: ja })
    : undefined;
  const periodToDate = filters.period_to
    ? parse(filters.period_to, 'yyyy/MM/dd', new Date(), { locale: ja })
    : undefined;

  const activeFilterCount = [
    filters.search.length > 0,
    filters.period_from.length > 0,
    filters.period_to.length > 0,
    filters.brand !== null,
    filters.store_id.length > 0,
    filters.template_type !== null,
    filters.member_type !== null,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative max-w-[400px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="アンケート名で検索..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-8 rounded-lg pl-9"
          />
        </div>
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="ml-auto h-8 gap-1.5"
          onClick={() => onFilterOpenChange(!isFilterOpen)}
        >
          <SlidersHorizontal className="size-4" />
          {isFilterOpen ? '閉じる' : '詳細フィルター'}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 px-1 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
          {isFilterOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
      </div>

      {isFilterOpen && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <DatePicker
              date={periodFromDate}
              onDateChange={(date) => {
                updateFilter('period_from', date ? format(date, 'yyyy/MM/dd', { locale: ja }) : '');
              }}
              disabledDate={periodToDate ? (date) => date > periodToDate : undefined}
              placeholder="開始日"
            />
          </div>

          <div className="flex flex-col gap-1">
            <DatePicker
              date={periodToDate}
              onDateChange={(date) => {
                updateFilter('period_to', date ? format(date, 'yyyy/MM/dd', { locale: ja }) : '');
              }}
              disabledDate={periodFromDate ? (date) => date < periodFromDate : undefined}
              placeholder="終了日"
            />
          </div>

          <Select
            value={filters.brand ?? 'all'}
            onValueChange={(value) => {
              updateFilter('brand', value && value !== 'all' ? (value as StoreListBrand) : null);
            }}
          >
            <SelectTrigger className="h-8 min-w-[140px] rounded-lg text-xs">
              <SelectValue placeholder="全ブランド">
                {filters.brand ? SURVEY_BRAND_LABELS[filters.brand] : '全ブランド'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ブランド</SelectItem>
              {Object.entries(SURVEY_BRAND_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.store_id || 'all'}
            onValueChange={(value) => {
              updateFilter('store_id', value && value !== 'all' ? value : '');
            }}
          >
            <SelectTrigger className="h-8 min-w-[180px] rounded-lg text-xs">
              <SelectValue placeholder="全店舗">
                {storeOptions.find((store) => store.value === filters.store_id)?.label ?? '全店舗'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全店舗</SelectItem>
              {storeOptions.map((store) => (
                <SelectItem key={store.value} value={store.value}>
                  {store.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.member_type ?? 'all'}
            onValueChange={(value) => {
              updateFilter('member_type', value && value !== 'all' ? (value as MemberType) : null);
            }}
          >
            <SelectTrigger className="h-8 min-w-[160px] rounded-lg text-xs">
              <SelectValue placeholder="全区分">
                {filters.member_type
                  ? SURVEY_RESPONSE_MEMBER_TYPE_LABELS[filters.member_type]
                  : '全区分'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全区分</SelectItem>
              {Object.entries(SURVEY_RESPONSE_MEMBER_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.template_type ?? 'all'}
            onValueChange={(value) => {
              updateFilter(
                'template_type',
                value && value !== 'all' ? (value as SurveyTemplateType) : null,
              );
            }}
          >
            <SelectTrigger className="h-8 min-w-[150px] rounded-lg text-xs">
              <SelectValue placeholder="すべての種別">
                {filters.template_type ? SURVEY_TYPE_LABELS[filters.template_type] : 'すべての種別'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての種別</SelectItem>
              {Object.entries(SURVEY_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
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
