'use client';

import { BRAND_LABELS } from '@/app/(private)/brands/_constants/brand.constants';
import { filterActiveClass } from '@/utils/app.util';
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

import type { BrandEnum, CampaignAcceptState } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { CAMPAIGN_ACCEPT_STATE_LABELS } from '../_constants/constants';
import { useCampaignsFiltersContext } from '../_contexts/campaigns-filters-context';

interface CampaignsFiltersProps {
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}

const DATE_FORMAT = 'yyyy-MM-dd';

function toDate(value: string): Date | undefined {
  return value ? parse(value, DATE_FORMAT, new Date(), { locale: ja }) : undefined;
}

export function CampaignsFilters({
  isFilterOpen,
  onFilterOpenChange,
}: Readonly<CampaignsFiltersProps>) {
  const { filters, searchInput, setSearchInput, updateFilter, activeFilterCount } =
    useCampaignsFiltersContext();

  const brandEnum = filters.brandEnum as BrandEnum | null;
  const acceptState = filters.acceptState as CampaignAcceptState | null;

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: 検索 + 詳細フィルタートグル */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-[400px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="キャンペーン名で検索..."
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

      {/* Row 2: 展開フィルター */}
      {isFilterOpen && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={brandEnum ?? 'all'}
            onValueChange={(value) => {
              updateFilter('brandEnum', value === 'all' ? null : (value as BrandEnum));
            }}
          >
            <SelectTrigger
              size="sm"
              className={cn(
                'w-fit max-w-[240px] min-w-[140px] rounded-lg text-xs',
                filterActiveClass(brandEnum !== null),
              )}
            >
              <SelectValue placeholder="全ブランド">
                {brandEnum ? BRAND_LABELS[brandEnum] : '全ブランド'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ブランド</SelectItem>
              {Object.entries(BRAND_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={acceptState ?? 'all'}
            onValueChange={(value) => {
              updateFilter('acceptState', value === 'all' ? null : (value as CampaignAcceptState));
            }}
          >
            <SelectTrigger
              size="sm"
              className={cn(
                'w-[140px] rounded-lg text-xs',
                filterActiveClass(acceptState !== null),
              )}
            >
              <SelectValue placeholder="全受付状況">
                {acceptState ? CAMPAIGN_ACCEPT_STATE_LABELS[acceptState] : '全受付状況'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全受付状況</SelectItem>
              {Object.entries(CAMPAIGN_ACCEPT_STATE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* #36 募集期間フィルター: 指定範囲と重なるキャンペーンを残す */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground shrink-0 text-xs">募集開始日</span>
            <DatePicker
              date={toDate(filters.recruitmentFrom)}
              onDateChange={(date) => {
                updateFilter('recruitmentFrom', date ? format(date, DATE_FORMAT) : '');
              }}
              placeholder="開始日"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-muted-foreground shrink-0 text-xs">募集終了日</span>
            <DatePicker
              date={toDate(filters.recruitmentTo)}
              onDateChange={(date) => {
                updateFilter('recruitmentTo', date ? format(date, DATE_FORMAT) : '');
              }}
              placeholder="終了日"
            />
          </div>
        </div>
      )}
    </div>
  );
}
