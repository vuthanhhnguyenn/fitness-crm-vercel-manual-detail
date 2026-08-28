'use client';

import {
  TERMS_BRAND_LABELS,
  TERMS_STATUS_LABELS,
} from '@/app/(private)/terms/_constants/constants';
import type { useTermsFilters } from '@/app/(private)/terms/_hooks/use-terms-filters';
import { Search } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { TermsBrand, TermsStatus } from '@/lib/api/types.gen';

const BRAND_FILTER_ITEMS = { all: '全ブランド', ...TERMS_BRAND_LABELS };
const STATUS_FILTER_ITEMS = { all: '全ステータス', ...TERMS_STATUS_LABELS };

function filterActiveClass(active: boolean) {
  return active ? 'border-primary bg-primary/10 text-foreground' : '';
}

interface TermsFiltersProps {
  filtersHook: ReturnType<typeof useTermsFilters>;
}

export function TermsFilters({ filtersHook }: Readonly<TermsFiltersProps>) {
  const { filters, setFilters, searchInput, setSearchInput } = filtersHook;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3">
      <div className="relative max-w-100 min-w-60 flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="規約ID・規約名で検索..."
          className="pl-9 text-xs"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Select
          items={BRAND_FILTER_ITEMS}
          value={filters.brandEnum ?? 'all'}
          onValueChange={(value) =>
            setFilters({
              brandEnum: value === 'all' ? null : (value as TermsBrand),
              page: 1,
            })
          }
        >
          <SelectTrigger
            className={`h-8 w-35 text-xs ${filterActiveClass(filters.brandEnum !== null)}`}
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
          items={STATUS_FILTER_ITEMS}
          value={filters.status ?? 'all'}
          onValueChange={(value) =>
            setFilters({
              status: value === 'all' ? null : (value as TermsStatus),
              page: 1,
            })
          }
        >
          <SelectTrigger
            className={`h-8 w-35 text-xs ${filterActiveClass(filters.status !== null)}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_FILTER_ITEMS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex cursor-pointer items-center gap-2 text-xs select-none">
          <Checkbox
            checked={filters.includeDeleted}
            onCheckedChange={(checked) => setFilters({ includeDeleted: !!checked, page: 1 })}
            className="size-4"
          />
          削除済みも含めて表示
        </label>
      </div>
    </div>
  );
}
