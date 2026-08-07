'use client';

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

import {
  CAMPAIGN_ACCEPT_STATUS_LABELS,
  CAMPAIGN_BRAND_LABELS,
  type CampaignAcceptStatus,
  type StoreListBrand,
} from '../_constants/constants';
import { useCampaignsFiltersContext } from '../_contexts/campaigns-filters-context';

interface CampaignsFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

export function CampaignsFilters({
  isFilterOpen,
  onFilterOpenChange,
}: Readonly<CampaignsFiltersProps>) {
  const { filters, searchInput, setSearchInput, updateFilter, hasActiveFilters, clearFilters } =
    useCampaignsFiltersContext();

  const brand = filters.brand as StoreListBrand | null;
  const acceptStatus = filters.accept_status as CampaignAcceptStatus | null;
  const recruitmentPeriodStart = filters.recruitment_period_start;
  const recruitmentPeriodEnd = filters.recruitment_period_end;

  const recruitmentStartDate = recruitmentPeriodStart
    ? parse(recruitmentPeriodStart, 'yyyy/MM/dd', new Date(), { locale: ja })
    : undefined;
  const recruitmentEndDate = recruitmentPeriodEnd
    ? parse(recruitmentPeriodEnd, 'yyyy/MM/dd', new Date(), { locale: ja })
    : undefined;

  const activeFilterCount = [
    brand,
    acceptStatus,
    recruitmentPeriodStart,
    recruitmentPeriodEnd,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative max-w-[400px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="キャンペーン名で検索..."
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <Select
                value={filters.brand ?? 'all'}
                onValueChange={(value) => {
                  updateFilter('brand', value === 'all' ? null : (value as StoreListBrand));
                }}
              >
                <SelectTrigger size="sm" className="w-fit min-w-[140px] rounded-lg">
                  <SelectValue placeholder="全ブランド">
                    {brand ? CAMPAIGN_BRAND_LABELS[brand] : '全ブランド'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ブランド</SelectItem>
                  {Object.entries(CAMPAIGN_BRAND_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Select
                value={filters.accept_status ?? 'all'}
                onValueChange={(value) => {
                  updateFilter(
                    'accept_status',
                    value === 'all' ? null : (value as CampaignAcceptStatus),
                  );
                }}
              >
                <SelectTrigger size="sm" className="w-fit min-w-[140px] rounded-lg">
                  <SelectValue placeholder="全ステータス">
                    {acceptStatus ? CAMPAIGN_ACCEPT_STATUS_LABELS[acceptStatus] : '全ステータス'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ステータス</SelectItem>
                  {Object.entries(CAMPAIGN_ACCEPT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <DatePicker
                date={recruitmentStartDate}
                onDateChange={(date) => {
                  updateFilter(
                    'recruitment_period_start',
                    date ? format(date, 'yyyy/MM/dd', { locale: ja }) : '',
                  );
                }}
                placeholder="日付を選択"
              />
            </div>

            <div className="flex flex-col gap-1">
              <DatePicker
                date={recruitmentEndDate}
                onDateChange={(date) => {
                  updateFilter(
                    'recruitment_period_end',
                    date ? format(date, 'yyyy/MM/dd', { locale: ja }) : '',
                  );
                }}
                placeholder="日付を選択"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="xs"
              onClick={clearFilters}
              className="text-muted-foreground h-8"
            >
              すべてクリア
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
