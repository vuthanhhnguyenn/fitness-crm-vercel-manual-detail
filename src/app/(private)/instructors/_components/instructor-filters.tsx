'use client';

import { useState } from 'react';

import { toSelectItems } from '@/utils/app.util';
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

import { InstructorSearch } from './instructor-search';

const filterActiveClass = (value: string) =>
  value ? 'border-primary bg-primary/10 text-foreground' : '';

const ROLE_OPTIONS = [
  { value: '', label: '全役割区分' },
  { value: 'trainer', label: 'トレーナー' },
  { value: 'instructor', label: 'インストラクター' },
  { value: 'body_care_therapist', label: 'ボディケアセラピスト' },
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

const ROLE_ITEMS = toSelectItems(ROLE_OPTIONS);
const BRAND_ITEMS = toSelectItems(BRAND_OPTIONS);
const STATUS_ITEMS = toSelectItems(STATUS_OPTIONS);

interface InstructorFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterRole: string;
  filterBrand: string;
  filterStatus: string;
  onRoleChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export function InstructorFilters({
  search,
  onSearchChange,
  filterRole,
  filterBrand,
  filterStatus,
  onRoleChange,
  onBrandChange,
  onStatusChange,
  onClearFilters,
  activeFilterCount,
}: InstructorFiltersProps) {
  const [filterExpanded, setFilterExpanded] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <InstructorSearch value={search} onChange={onSearchChange} />
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
          <Select
            items={ROLE_ITEMS}
            value={filterRole || '全役割区分'}
            onValueChange={(v) => {
              if (v == null) return;
              onRoleChange(v === '全役割区分' ? '' : v);
            }}
          >
            <SelectTrigger className={`h-8 w-[160px] text-xs ${filterActiveClass(filterRole)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value || '全役割区分'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={BRAND_ITEMS}
            value={filterBrand || '全ブランド'}
            onValueChange={(v) => {
              if (v == null) return;
              onBrandChange(v === '全ブランド' ? '' : v);
            }}
          >
            <SelectTrigger className={`h-8 w-[140px] text-xs ${filterActiveClass(filterBrand)}`}>
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
            items={STATUS_ITEMS}
            value={filterStatus || '全ステータス'}
            onValueChange={(v) => {
              if (v == null) return;
              onStatusChange(v === '全ステータス' ? '' : v);
            }}
          >
            <SelectTrigger className={`h-8 w-[140px] text-xs ${filterActiveClass(filterStatus)}`}>
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
