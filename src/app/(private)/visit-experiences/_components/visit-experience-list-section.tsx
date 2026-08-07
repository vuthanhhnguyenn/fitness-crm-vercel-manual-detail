'use client';

import { useCallback, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

import { useDebounce } from '@/hooks/use-debounce.hook';

import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmVisitExperiencesOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import type {
  GetVisitExperiencesQuery,
  VisitExperienceStatus,
} from '@/types/api/visit-experience.type';
import { VISIT_EXPERIENCE_STATUS_LABELS } from '@/types/api/visit-experience.type';

import { VisitExperienceFilters } from './visit-experience-filters';

const STATUS_BADGE_VARIANTS: Record<VisitExperienceStatus, string> = {
  application_received: 'bg-muted text-muted-foreground border-border',
  info_missing: 'bg-warning/10 text-warning border-warning/30',
  bl_checking: 'bg-destructive/10 text-destructive border-destructive/30',
  visiting: 'bg-info/10 text-info border-info/30',
  visit_completed: 'bg-muted text-muted-foreground border-border',
  membership_applied: 'bg-success/10 text-success border-success/30',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function VisitExperienceListSection() {
  const router = useRouter();

  const [queryStates, setQueryStates] = useQueryStates({
    search: parseAsString.withDefault(''),
    status: parseAsString.withDefault(''),
    brand_name: parseAsString.withDefault(''),
    store_name: parseAsString.withDefault(''),
    date_range: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(50),
  });

  const { search, status, brand_name, store_name, date_range, page, limit } = queryStates;

  const debouncedSearch = useDebounce(search, 300);

  const queryParams = useMemo((): GetVisitExperiencesQuery => {
    const params: GetVisitExperiencesQuery = {
      page,
      limit: limit as 25 | 50 | 100 | 200,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (status) params.status = status as VisitExperienceStatus;
    if (brand_name) params.brand_name = brand_name;
    if (store_name) params.store_name = store_name;
    if (date_range) params.date_range = date_range as GetVisitExperiencesQuery['date_range'];
    return params;
  }, [debouncedSearch, status, brand_name, store_name, date_range, page, limit]);

  const { data, isLoading } = useQuery({
    ...getCrmVisitExperiencesOptions({ query: queryParams }),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const activeFilterCount = [status, brand_name, store_name, date_range].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0 || search !== '';

  // const buildFilterSummary = () => {
  //   const parts: string[] = [];
  //   if (search) parts.push(`検索: "${search}"`);
  //   if (status) parts.push(`ステータス: ${VISIT_EXPERIENCE_STATUS_LABELS[status as VisitExperienceStatus]}`);
  //   if (brand_name) parts.push(`ブランド: ${brand_name}`);
  //   if (store_name) parts.push(`店舗: ${store_name}`);
  //   if (date_range) {
  //     const label = DATE_RANGE_OPTIONS.find((opt) => opt.value === date_range)?.label ?? date_range;
  //     parts.push(`期間: ${label}`);
  //   }
  //   return parts.join(' / ');
  // };

  const clearAllFilters = useCallback(() => {
    void setQueryStates({
      search: '',
      status: '',
      brand_name: '',
      store_name: '',
      date_range: '',
      page: 1,
    });
  }, [setQueryStates]);

  const handlePageChange = (newPage: number) => {
    void setQueryStates({ page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    void setQueryStates({ limit: newSize, page: 1 });
  };

  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <VisitExperienceFilters
        search={search}
        status={status}
        brandName={brand_name}
        storeName={store_name}
        dateRange={date_range}
        onSearchChange={(value) => void setQueryStates({ search: value, page: 1 })}
        onStatusChange={(value) => void setQueryStates({ status: value, page: 1 })}
        onBrandChange={(value) => void setQueryStates({ brand_name: value, page: 1 })}
        onStoreChange={(value) => void setQueryStates({ store_name: value, page: 1 })}
        onDateRangeChange={(value) => void setQueryStates({ date_range: value, page: 1 })}
        onClearFilters={clearAllFilters}
        hasActiveFilters={hasActiveFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Active filter banner */}
      {/* {hasActiveFilters && (
        <Alert className="rounded-none border-x-0 border-t-0 py-2">
          <AlertDescription className="flex items-center justify-between">
            <span className="text-xs">
              全 {total} 件中 {items.length === total ? total : items.length} 件を抽出中
              {buildFilterSummary() && (
                <span className="text-muted-foreground ml-2">（{buildFilterSummary()}）</span>
              )}
            </span>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={clearAllFilters}>
              <X className="size-3" />
              クリア
            </Button>
          </AlertDescription>
        </Alert>
      )} */}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">予約番号</TableHead>
              <TableHead className="text-xs">氏名</TableHead>
              <TableHead className="text-xs">ステータス</TableHead>
              <TableHead className="text-xs">BL照合</TableHead>
              <TableHead className="text-xs">ブランド</TableHead>
              <TableHead className="text-xs">店舗</TableHead>
              <TableHead className="text-xs">予約日時</TableHead>
              <TableHead className="text-xs">見学開始</TableHead>
              <TableHead className="text-xs">見学終了（予定/実績）</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center">
                  {hasActiveFilters ? (
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-muted-foreground text-sm">該当のデータがありません。</p>
                      <Button variant="outline" size="sm" onClick={clearAllFilters}>
                        条件をクリア
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">データがありません。</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  className={`cursor-pointer ${
                    item.bl_match ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => router.push(navigate('/visit-experiences/[id]', item.id))}
                >
                  <TableCell className="text-xs font-medium">{item.id}</TableCell>
                  <TableCell className="text-xs">{item.customer_name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_BADGE_VARIANTS[item.status]}`}
                    >
                      {VISIT_EXPERIENCE_STATUS_LABELS[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.bl_match ? (
                      <Badge
                        variant="outline"
                        className="border-destructive/30 bg-destructive/10 text-destructive gap-1 text-xs"
                      >
                        <AlertTriangle className="size-3" />
                        BL一致
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{item.brand_name}</TableCell>
                  <TableCell className="text-xs">{item.store_name}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(item.reserved_at)}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(item.visit_start_at)}</TableCell>
                  <TableCell className="text-xs">
                    {item.visit_end_actual_at ? (
                      <span>
                        {formatDateTime(item.visit_end_actual_at)}
                        <span className="text-muted-foreground ml-1">（実績）</span>
                      </span>
                    ) : (
                      <span>
                        {formatDateTime(item.visit_end_scheduled_at)}
                        <span className="text-muted-foreground ml-1">（予定）</span>
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <TablePaginationWithSize
          total={total}
          currentPage={page}
          pageSize={limit}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[25, 50, 100, 200]}
        />
      )}
    </div>
  );
}
