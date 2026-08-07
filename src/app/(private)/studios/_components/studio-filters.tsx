'use client';

import { useState } from 'react';

import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const filterActiveClass = (value: string, defaultValue: string) =>
  value !== defaultValue ? 'border-primary bg-primary/10 text-foreground' : '';

const TYPE_OPTIONS = [
  { value: '', label: '全区分' },
  { value: 'studio-lesson', label: 'スタジオレッスン用' },
  { value: 'pt', label: 'PT用' },
  { value: 'body-care', label: 'ボディケア用' },
];

const BRAND_OPTIONS = [
  { value: '', label: '全ブランド' },
  { value: 'joyfit', label: 'JOYFIT' },
  { value: 'fit365', label: 'FIT365' },
  { value: 'joyfit24', label: 'JOYFIT24' },
  { value: 'joyfit_yoga', label: 'JOYFIT YOGA' },
  { value: 'joyfit_plus', label: 'JOYFIT+' },
];

const STATUS_OPTIONS = [
  { value: '', label: '全ステータス' },
  { value: 'active', label: '有効' },
  { value: 'inactive', label: '無効' },
];

interface StudioFiltersProps {
  storeOptions: string[];
  filterStore: string;
  filterType: string;
  filterBrand: string;
  filterStatus: string;
  onStoreChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export function StudioFilters({
  storeOptions,
  filterStore,
  filterType,
  filterBrand,
  filterStatus,
  onStoreChange,
  onTypeChange,
  onBrandChange,
  onStatusChange,
  onClearFilters,
  activeFilterCount,
}: StudioFiltersProps) {
  const [filterExpanded, setFilterExpanded] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={() => setFilterExpanded(!filterExpanded)}
        >
          <SlidersHorizontal className="size-4" />
          詳細フィルター
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 px-1 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
          {filterExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </Button>
      </div>

      {filterExpanded && (
        <div className="flex flex-wrap items-center gap-2">
          {storeOptions.length > 0 && (
            <Select
              value={filterStore || '全店舗'}
              onValueChange={(v) => {
                if (v == null) return;
                onStoreChange(v === '全店舗' ? '' : v);
              }}
            >
              <SelectTrigger
                className={`h-8 w-[160px] text-xs ${filterActiveClass(filterStore, '')}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="全店舗">全店舗</SelectItem>
                {storeOptions.map((store) => (
                  <SelectItem key={store} value={store}>
                    {store}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={filterType || '全区分'}
            onValueChange={(v) => {
              if (v == null) return;
              onTypeChange(v === '全区分' ? '' : v);
            }}
          >
            <SelectTrigger className={`h-8 w-[160px] text-xs ${filterActiveClass(filterType, '')}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value || '全区分'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterBrand || '全ブランド'}
            onValueChange={(v) => {
              if (v == null) return;
              onBrandChange(v === '全ブランド' ? '' : v);
            }}
          >
            <SelectTrigger
              className={`h-8 w-[140px] text-xs ${filterActiveClass(filterBrand, '')}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRAND_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value || '全ブランド'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterStatus || '全ステータス'}
            onValueChange={(v) => {
              if (v == null) return;
              onStatusChange(v === '全ステータス' ? '' : v);
            }}
          >
            <SelectTrigger
              className={`h-8 w-[140px] text-xs ${filterActiveClass(filterStatus, '')}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value || '全ステータス'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground ml-auto h-8 text-xs"
              onClick={onClearFilters}
            >
              すべてクリア
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
