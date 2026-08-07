'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import { MemberType, StoreListBrand } from '@/lib/api/types.gen';

import {
  SURVEY_BRAND_LABELS,
  SURVEY_RESPONSE_MEMBER_TYPE_LABELS,
} from '../../_constants/constants';
import { useSurveyAnalyticsFiltersContext } from '../_contexts/survey-analytics-filters-context';
import {
  SURVEY_ANALYTICS_PERIOD_LABELS,
  type SurveyAnalyticsPeriod,
} from '../_hooks/use-survey-analytics-filters';

interface SurveyAnalyticsFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  surveyName?: string;
  totalResponses?: number;
}

function filterActiveClass(value: string, defaultValue: string) {
  return value !== defaultValue ? 'border-primary bg-primary/10 text-foreground' : '';
}

export function SurveyAnalyticsFilters({
  isFilterOpen,
  onFilterOpenChange,
  surveyName,
  totalResponses,
}: Readonly<SurveyAnalyticsFiltersProps>) {
  const { filters, searchInput, setSearchInput, updateFilter, clearFilters } =
    useSurveyAnalyticsFiltersContext();

  const { data: storesData } = useQuery({
    ...getCrmStoresOptions({ query: { page: 1, limit: 100 } }),
  });

  const storeOptions =
    storesData?.stores?.map((store) => ({
      value: store.id,
      label: `${store.store_id} ${store.name}`,
    })) ?? [];

  const selectedStoreLabel =
    storeOptions.find((store) => store.value === filters.store_id)?.label ?? '全店舗';
  const selectedPeriod = filters.period as SurveyAnalyticsPeriod;

  const activeFilterCount = [
    searchInput.length > 0,
    filters.period !== 'all',
    filters.brand !== null,
    filters.store_id.length > 0,
    filters.member_type !== null,
  ].filter(Boolean).length;

  const filterSummary = [
    filters.period !== 'all' ? SURVEY_ANALYTICS_PERIOD_LABELS[selectedPeriod] : '',
    filters.brand ? SURVEY_BRAND_LABELS[filters.brand] : '',
    filters.store_id ? selectedStoreLabel : '',
    filters.member_type ? SURVEY_RESPONSE_MEMBER_TYPE_LABELS[filters.member_type] : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const filteredSummaryText =
    searchInput !== '' || activeFilterCount > 0
      ? `絞り込み中: ${[filterSummary, searchInput ? `"${searchInput}"` : ''].filter(Boolean).join(' · ')}`
      : '全件';

  const targetSummaryText = surveyName
    ? ` — 対象: ${surveyName}（${(totalResponses ?? 0).toLocaleString()}件）`
    : '';

  return (
    <Card className="mb-6 gap-0 py-0">
      <div className="space-y-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative max-w-[400px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="アンケート名で検索..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Button
            variant={activeFilterCount > 0 ? 'default' : 'outline'}
            size="sm"
            className="ml-auto h-8 gap-1 text-xs"
            onClick={() => onFilterOpenChange(!isFilterOpen)}
          >
            <SlidersHorizontal className="size-3" />
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
              value={filters.period}
              onValueChange={(value) => {
                updateFilter('period', value as SurveyAnalyticsPeriod);
              }}
            >
              <SelectTrigger
                className={`h-8 w-[120px] text-xs ${filterActiveClass(filters.period, 'all')}`}
              >
                <SelectValue>{SURVEY_ANALYTICS_PERIOD_LABELS[selectedPeriod]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SURVEY_ANALYTICS_PERIOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.brand ?? 'all'}
              onValueChange={(value) => {
                updateFilter('brand', value === 'all' ? null : (value as StoreListBrand));
              }}
            >
              <SelectTrigger
                className={`h-8 w-fit max-w-[240px] min-w-[140px] text-xs ${filterActiveClass(filters.brand ?? 'all', 'all')}`}
              >
                <SelectValue>
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
              <SelectTrigger
                className={`h-8 w-fit max-w-[240px] min-w-[140px] text-xs ${filterActiveClass(filters.store_id || 'all', 'all')}`}
              >
                <SelectValue>{selectedStoreLabel}</SelectValue>
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
                updateFilter('member_type', value === 'all' ? null : (value as MemberType));
              }}
            >
              <SelectTrigger
                className={`h-8 w-fit max-w-[240px] min-w-[140px] text-xs ${filterActiveClass(filters.member_type ?? 'all', 'all')}`}
              >
                <SelectValue>
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

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground ml-auto h-8 text-xs"
              onClick={clearFilters}
            >
              すべてクリア
            </Button>
          </div>
        )}
      </div>

      <div className="text-muted-foreground border-t px-4 py-2 text-xs">
        {filteredSummaryText}
        {targetSummaryText}
      </div>
    </Card>
  );
}
