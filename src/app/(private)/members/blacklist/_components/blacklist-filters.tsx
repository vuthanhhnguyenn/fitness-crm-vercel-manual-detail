'use client';

import { toSelectItems } from '@/utils/app.util';
import { Search } from 'lucide-react';

import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { BlacklistSource, UnpaidFilter } from '@/lib/api/types.gen';

import {
  BLACKLIST_SEARCH_MAX_LENGTH,
  BLACKLIST_SOURCE_LABEL,
  BLACKLIST_SOURCE_OPTIONS,
  UNPAID_FILTER_LABEL,
  UNPAID_FILTER_OPTIONS,
} from '../_constants/blacklist.constants';
import { useBlacklistFiltersContext } from '../_contexts/blacklist-filters-context';

/** FR-020 — highlights a control while it holds a non-default value (V0 `filterActiveClass`). */
function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

interface BlacklistFiltersProps {
  /** FR-025 — the denominator: active entries before any in-screen filter. */
  totalAll: number;
  /** FR-022 — the numerator: rows surviving the active filters. */
  total: number;
}

export function BlacklistFilters({ totalAll, total }: Readonly<BlacklistFiltersProps>) {
  const { filters, updateFilter, searchInput, setSearchInput, hasActiveFilters, clearFilters } =
    useBlacklistFiltersContext();

  /** FR-023 — 登録理由 verbatim, then the 未納金 label; whichever is at its default is omitted. */
  const filterSummary = [
    filters.source ? BLACKLIST_SOURCE_LABEL[filters.source] : '',
    filters.unpaid ? UNPAID_FILTER_LABEL[filters.unpaid] : '',
  ];

  return (
    <>
      <div className="space-y-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative max-w-100 flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              className="pl-9 text-xs"
              placeholder="会員ID・氏名で検索"
              maxLength={BLACKLIST_SEARCH_MAX_LENGTH}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/**
           * FR-019 — both filters are permanently visible and there is no 詳細フィルター
           * collapse button. V0 states the rule directly:
           * 「A8: フィルター2個以下は常時展開（折りたたみなし）」.
           */}
          <div className="ml-auto flex items-center gap-2">
            {/* 登録理由 — the registration-path axis (強制退会 / 手動登録), not the reason axis */}
            <Select
              value={filters.source ?? 'all'}
              onValueChange={(v) =>
                updateFilter('source', v === 'all' ? null : (v as BlacklistSource))
              }
              items={toSelectItems(BLACKLIST_SOURCE_OPTIONS)}
            >
              <SelectTrigger className={`h-8 w-35 text-xs ${filterActiveClass(!!filters.source)}`}>
                <SelectValue placeholder="全登録理由" />
              </SelectTrigger>
              <SelectContent>
                {BLACKLIST_SOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 未納金 */}
            <Select
              value={filters.unpaid ?? 'all'}
              onValueChange={(v) =>
                updateFilter('unpaid', v === 'all' ? null : (v as UnpaidFilter))
              }
              items={toSelectItems(UNPAID_FILTER_OPTIONS)}
            >
              <SelectTrigger className={`h-8 w-35 text-xs ${filterActiveClass(!!filters.unpaid)}`}>
                <SelectValue placeholder="未納金：全件" />
              </SelectTrigger>
              <SelectContent>
                {UNPAID_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <FilterResultBanner
        show={hasActiveFilters}
        totalCount={totalAll}
        filteredCount={total}
        filterSummary={filterSummary}
        onClear={clearFilters}
      />
    </>
  );
}
