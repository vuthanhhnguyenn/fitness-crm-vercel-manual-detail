'use client';

import { TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { useCurrentStore } from '@/contexts/current-store.context';
import { toSelectItems } from '@/utils/app.util';
import { formatISODateLocal } from '@/utils/date.util';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';

import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  getCrmMembershipApplicationsOptions,
  getCrmStoresOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';

import {
  BLACKLIST_OPTIONS,
  BRAND_OPTIONS,
  ENROLLMENT_ROUTE_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from '../_constants/constants';
import { useMembershipApplicationsFiltersContext } from '../_contexts/membership-applications-filters-context';

function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

/** Base UI's `<Select>` reports a deselected value as `null` — treat that as "all". */
function valueOrAll(v: string | null): string {
  return v ?? 'all';
}

/** Condition summary joined with「・」, in the fixed order the result banner uses. */
function buildFilterSummary(
  filters: ReturnType<typeof useMembershipApplicationsFiltersContext>['filters'],
  isAllStoresView: boolean,
  storeName: string | undefined,
  searchInput: string,
  isDateRangeChanged: boolean,
  defaultDateFrom: string,
  defaultDateTo: string,
): string[] {
  const parts: string[] = [];
  if (filters.status) parts.push(`ステータス: ${STATUS_LABELS[filters.status]}`);
  if (isAllStoresView && filters.brand) parts.push(`ブランド: ${filters.brand}`);
  if (isAllStoresView && filters.store) parts.push(`店舗: ${storeName ?? filters.store}`);
  if (isDateRangeChanged) {
    const from = (filters.date_from || defaultDateFrom).replaceAll('-', '/');
    const to = (filters.date_to || defaultDateTo).replaceAll('-', '/');
    parts.push(`期間: ${from}〜${to}`);
  }
  if (filters.blacklist !== 'all') {
    parts.push(`BL照合: ${filters.blacklist === 'match' ? '一致のみ' : '一致なし'}`);
  }
  if (filters.route) {
    parts.push(
      `入会経路: ${{ mobile: 'モバイル', manual: '手動', referral: '紹介経由' }[filters.route]}`,
    );
  }
  if (searchInput) parts.push(`検索: "${searchInput}"`);
  return parts;
}

export function MembershipApplicationsFilters() {
  const {
    showFilters,
    setShowFilters,
    searchInput,
    setSearchInput,
    filters,
    setFilters,
    clearFilters,
    activeFilterCount,
    hasActiveFilters,
    isDateRangeChanged,
    defaultDateFrom,
    defaultDateTo,
    isAllStoresView,
    queryParams,
  } = useMembershipApplicationsFiltersContext();

  // See page.tsx's isStoreScopeLoading comment — same guard so this independent
  // subscriber doesn't force the shared query to fire before the store scope resolves.
  const { isLoading: isStoreScopeLoading } = useCurrentStore();

  // Store options for the all-stores view only (FR-015) — hidden entirely otherwise.
  const { data: storesData } = useQuery({
    ...getCrmStoresOptions({ query: { page: 1, limit: 100, sort_by: 'name', sort_order: 'asc' } }),
    enabled: isAllStoresView,
  });
  const stores = storesData?.stores ?? [];
  const selectedStoreName = stores.find((s) => s.id === filters.store)?.name;
  const storeOptions = [
    { value: 'all', label: '全店舗' },
    ...stores.map((s) => ({ value: s.id, label: s.name })),
  ];

  const filterSummary = buildFilterSummary(
    filters,
    isAllStoresView,
    selectedStoreName,
    searchInput,
    isDateRangeChanged,
    defaultDateFrom,
    defaultDateTo,
  );

  // Shares its cache entry with the table's identical query (same queryKey) —
  // this is not a second network request, just a second subscriber, and it's
  // what lets the banner show filtered-vs-total (FR-008).
  const { data: listData } = useQuery({
    ...getCrmMembershipApplicationsOptions({ query: queryParams }),
    enabled: !isStoreScopeLoading,
  });

  return (
    <div>
      <div className="space-y-3 px-4 py-3">
        {/* Search + filter toggle row */}
        <div className="flex items-center gap-2">
          <div className="relative max-w-100 flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              className="pl-9 text-xs"
              placeholder="申請ID・氏名で検索..."
              value={searchInput}
              maxLength={TEXT_MAX_LENGTH}
              onChange={(e) => setSearchInput(e.target.value.slice(0, TEXT_MAX_LENGTH))}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={activeFilterCount > 0 ? 'default' : 'outline'}
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => setShowFilters((prev) => !prev)}
            >
              <SlidersHorizontal className="size-4" />
              {showFilters ? '閉じる' : '詳細フィルター'}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-5 px-1 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
              {showFilters ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </Button>
          </div>
        </div>

        {/* Expandable filter row */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {/* ステータス — 7 options incl. 自動承認済 */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => {
                const value = valueOrAll(v);
                setFilters({ status: value === 'all' ? '' : (value as typeof filters.status) });
              }}
              items={toSelectItems(STATUS_OPTIONS)}
            >
              <SelectTrigger
                className={cn('h-8 w-35 text-xs', filterActiveClass(!!filters.status))}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ブランド・店舗 — all-stores view only (FR-015) */}
            {isAllStoresView && (
              <>
                <Select
                  value={filters.brand || 'all'}
                  onValueChange={(v) => {
                    const value = valueOrAll(v);
                    setFilters({ brand: value === 'all' ? '' : value });
                  }}
                  items={toSelectItems(BRAND_OPTIONS)}
                >
                  <SelectTrigger
                    className={cn('h-8 w-35 text-xs', filterActiveClass(!!filters.brand))}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAND_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.store || 'all'}
                  onValueChange={(v) => {
                    const value = valueOrAll(v);
                    setFilters({ store: value === 'all' ? '' : value });
                  }}
                  items={toSelectItems(storeOptions)}
                >
                  <SelectTrigger
                    className={cn('h-8 w-45 text-xs', filterActiveClass(!!filters.store))}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {storeOptions.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className={opt.value === 'all' ? undefined : 'text-xs'}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {/* 申請日レンジ — defaults to the last 7 days (FR-007) */}
            <DateRangePicker
              date={{
                from: new Date(`${filters.date_from || defaultDateFrom}T00:00:00`),
                to: new Date(`${filters.date_to || defaultDateTo}T00:00:00`),
              }}
              onDateChange={(range) =>
                setFilters({
                  date_from: range?.from ? formatISODateLocal(range.from) : '',
                  date_to: range?.to ? formatISODateLocal(range.to) : '',
                })
              }
              className={cn(
                'h-8 justify-start gap-2 px-3 text-xs font-normal',
                filterActiveClass(isDateRangeChanged),
              )}
              placeholder="期間を選択"
            />

            {/* BL照合 — tri-state */}
            <Select
              value={filters.blacklist}
              onValueChange={(v) =>
                setFilters({ blacklist: valueOrAll(v) as typeof filters.blacklist })
              }
              items={toSelectItems(BLACKLIST_OPTIONS)}
            >
              <SelectTrigger
                className={cn('h-8 w-42 text-xs', filterActiveClass(filters.blacklist !== 'all'))}
              >
                <span className="text-muted-foreground mr-1">BL照合:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLACKLIST_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 入会経路 */}
            <Select
              value={filters.route || 'all'}
              onValueChange={(v) => {
                const value = valueOrAll(v);
                setFilters({ route: value === 'all' ? '' : (value as typeof filters.route) });
              }}
              items={toSelectItems(ENROLLMENT_ROUTE_OPTIONS)}
            >
              <SelectTrigger className={cn('h-8 w-35 text-xs', filterActiveClass(!!filters.route))}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENROLLMENT_ROUTE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <FilterResultBanner
        show={hasActiveFilters}
        totalCount={listData?.unfiltered_total ?? 0}
        filteredCount={listData?.pagination.total ?? 0}
        filterSummary={filterSummary}
        onClear={clearFilters}
      />
    </div>
  );
}
