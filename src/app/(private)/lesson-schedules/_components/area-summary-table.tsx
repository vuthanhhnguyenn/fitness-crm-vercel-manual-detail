'use client';

import { useMemo, useState } from 'react';

import { ArrowUpDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { StoreScheduleSummary } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

type SortKey =
  | 'store_name'
  | 'total_lessons'
  | 'occupancy_rate'
  | 'assigned_staff_count'
  | 'alert_count'
  | 'in_progress_lesson_name';

function formatInProgress(store: StoreScheduleSummary): string {
  if (store.in_progress_lesson_name && store.in_progress_start_time) {
    return `${store.in_progress_lesson_name} ${store.in_progress_start_time}〜`;
  }
  return '—';
}

interface AreaSummaryTableProps {
  stores: StoreScheduleSummary[];
  focusedStoreId?: string | null;
  onStoreClick?: (storeId: string) => void;
}

function SortableHeader({ label, onSort }: { label: string; onSort: () => void }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <Button
            variant="ghost"
            className="group/sort h-auto gap-1 p-0 text-xs font-semibold hover:bg-transparent"
            onClick={onSort}
          >
            {label}
            <ArrowUpDown className="text-muted-foreground group-hover/sort:text-foreground size-3 transition-colors" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">クリックで降順ソート</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function getSortValue(store: StoreScheduleSummary, key: SortKey): string | number {
  switch (key) {
    case 'store_name':
      return store.store_name;
    case 'total_lessons':
      return store.total_lessons;
    case 'occupancy_rate':
      return store.occupancy_rate;
    case 'assigned_staff_count':
      return store.assigned_staff_count;
    case 'alert_count':
      return store.alert_count;
    case 'in_progress_lesson_name':
      return store.in_progress_lesson_name ?? '';
  }
}

export function AreaSummaryTable({ stores, focusedStoreId, onStoreClick }: AreaSummaryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('store_name');
  const [sortDesc, setSortDesc] = useState(false);

  const sortedStores = useMemo(() => {
    return [...stores].sort((a, b) => {
      const aVal = getSortValue(a, sortKey);
      const bVal = getSortValue(b, sortKey);
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), 'ja');
      return sortDesc ? -cmp : cmp;
    });
  }, [stores, sortKey, sortDesc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortDesc(false);
    }
  };

  return (
    <Card className="flex shrink-0 flex-col gap-0 overflow-hidden py-0">
      <div className="bg-background flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">店舗一覧</span>
          <Badge variant="secondary" className="text-[10px]">
            全{stores.length}店舗
          </Badge>
        </div>
        {stores.length > 3 && (
          <span className="text-muted-foreground text-[10px]">↕ スクロールで全店舗表示</span>
        )}
      </div>
      <div className="h-[220px] shrink-0 overflow-y-scroll">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 sticky top-0 z-10">
              <TableHead className="text-xs font-semibold">
                <SortableHeader label="店舗名" onSort={() => handleSort('store_name')} />
              </TableHead>
              <TableHead className="w-[100px] text-center text-xs font-semibold">
                <SortableHeader label="本日レッスン" onSort={() => handleSort('total_lessons')} />
              </TableHead>
              <TableHead className="w-[140px] text-center text-xs font-semibold">
                <SortableHeader label="平均予約率" onSort={() => handleSort('occupancy_rate')} />
              </TableHead>
              <TableHead className="w-[100px] text-center text-xs font-semibold">
                <SortableHeader
                  label="スタッフ"
                  onSort={() => handleSort('assigned_staff_count')}
                />
              </TableHead>
              <TableHead className="w-[100px] text-center text-xs font-semibold">
                <SortableHeader label="アラート" onSort={() => handleSort('alert_count')} />
              </TableHead>
              <TableHead className="text-xs font-semibold">
                <SortableHeader
                  label="実施中"
                  onSort={() => handleSort('in_progress_lesson_name')}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStores.map((store) => {
              const isFocused = focusedStoreId === store.store_id;
              const rate = Math.round(store.occupancy_rate);
              const barColor =
                rate >= 80 ? 'bg-success' : rate >= 60 ? 'bg-warning' : 'bg-destructive';

              return (
                <TableRow
                  key={store.store_id}
                  className={cn(
                    'hover:bg-accent/50 cursor-pointer',
                    isFocused && 'bg-primary/5 shadow-[inset_4px_0_0_0_var(--primary)]',
                  )}
                  onClick={() => onStoreClick?.(store.store_id)}
                >
                  <TableCell
                    className={cn('text-sm', isFocused ? 'text-primary font-bold' : 'font-medium')}
                  >
                    {store.store_name}
                  </TableCell>
                  <TableCell className="text-center text-xs">{store.total_lessons}コマ</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="bg-muted h-2 w-16 overflow-hidden rounded-full">
                        <div
                          className={cn('h-full rounded-full', barColor)}
                          style={{ width: `${Math.min(rate, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs">{rate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    {store.assigned_staff_count}名
                  </TableCell>
                  <TableCell className="text-center">
                    {store.alert_count > 0 ? (
                      <Badge
                        variant="secondary"
                        className="bg-destructive/15 text-destructive h-auto px-1 py-0 text-[10px]"
                      >
                        {store.alert_count}件
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatInProgress(store)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
