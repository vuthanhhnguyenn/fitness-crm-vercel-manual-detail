'use client';

import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  MANUAL_NOTIFICATION_CHANNEL_OPTIONS,
  MANUAL_NOTIFICATION_STATUS_LABELS,
  MANUAL_NOTIFICATION_STATUS_OPTIONS,
  MANUAL_NOTIFICATION_TARGET_LABELS,
  MANUAL_NOTIFICATION_TARGET_OPTIONS,
  type ManualNotificationChannel,
} from '../_constants/manual-notification.constants';
import type { useManualNotificationFilters } from '../_hooks/use-manual-notification-filters';

type ManualNotificationFiltersHook = ReturnType<typeof useManualNotificationFilters>;

const CHANNEL_FILTER_LABELS: Record<ManualNotificationChannel, string> = {
  sms: 'SMS',
  push: 'プッシュ通知',
  email: 'メール',
  in_app: 'アプリ内通知',
};

interface ManualNotificationsFiltersProps {
  readonly filtersHook: ManualNotificationFiltersHook;
  readonly isFilterOpen: boolean;
  readonly onFilterOpenChange: (open: boolean) => void;
  readonly filteredTotal: number;
  readonly totalAllItems: number;
}

function activeClass(active: boolean) {
  return active ? 'border-primary bg-primary/10 text-foreground' : '';
}

export function ManualNotificationsFilters({
  filtersHook,
  isFilterOpen,
  onFilterOpenChange,
  filteredTotal,
  totalAllItems,
}: ManualNotificationsFiltersProps) {
  const { filters, searchInput, setSearchInput, setFilters, clearFilters, hasActiveFilters } =
    filtersHook;
  const activeFilterCount = [filters.status, filters.channel, filters.targetType].filter(
    Boolean,
  ).length;

  const summary = [
    filters.q.trim() ? `"${filters.q.trim()}"` : null,
    filters.status ? MANUAL_NOTIFICATION_STATUS_LABELS[filters.status] : null,
    filters.channel ? CHANNEL_FILTER_LABELS[filters.channel] : null,
    filters.targetType ? MANUAL_NOTIFICATION_TARGET_LABELS[filters.targetType] : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-[400px] min-w-[240px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="キーワードで検索..."
            className="h-8 pl-9 text-xs"
            maxLength={100}
          />
        </div>

        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="ml-auto h-8 gap-1.5"
          onClick={() => onFilterOpenChange(!isFilterOpen)}
        >
          <SlidersHorizontal className="size-3.5" />
          <span className="font-normal">{isFilterOpen ? '閉じる' : '詳細フィルター'}</span>

          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
          {isFilterOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
      </div>

      {isFilterOpen && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(value) =>
              void setFilters({
                status: value === 'all' ? null : (value as typeof filters.status),
                page: 1,
              })
            }
          >
            <SelectTrigger
              className={`${activeClass(filters.status !== null)} h-8 w-[140px] text-xs`}
            >
              <SelectValue>
                {filters.status
                  ? MANUAL_NOTIFICATION_STATUS_LABELS[filters.status]
                  : '全ステータス'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ステータス</SelectItem>
              {MANUAL_NOTIFICATION_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {MANUAL_NOTIFICATION_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.channel ?? 'all'}
            onValueChange={(value) =>
              void setFilters({
                channel: value === 'all' ? null : (value as typeof filters.channel),
                page: 1,
              })
            }
          >
            <SelectTrigger
              className={`${activeClass(filters.channel !== null)} h-8 w-[148px] text-xs`}
            >
              <SelectValue>
                {filters.channel ? CHANNEL_FILTER_LABELS[filters.channel] : '全チャネル'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全チャネル</SelectItem>
              {MANUAL_NOTIFICATION_CHANNEL_OPTIONS.map((channel) => (
                <SelectItem key={channel} value={channel}>
                  {CHANNEL_FILTER_LABELS[channel]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.targetType ?? 'all'}
            onValueChange={(value) =>
              void setFilters({
                targetType: value === 'all' ? null : (value as typeof filters.targetType),
                page: 1,
              })
            }
          >
            <SelectTrigger
              className={`${activeClass(filters.targetType !== null)} h-8 w-[140px] text-xs`}
            >
              <SelectValue>
                {filters.targetType
                  ? MANUAL_NOTIFICATION_TARGET_LABELS[filters.targetType]
                  : '全配信対象'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全配信対象</SelectItem>
              {MANUAL_NOTIFICATION_TARGET_OPTIONS.map((targetType) => (
                <SelectItem key={targetType} value={targetType}>
                  {MANUAL_NOTIFICATION_TARGET_LABELS[targetType]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {hasActiveFilters && (
        <Alert className="-mx-4 flex flex-col gap-2 rounded-none border-x-0 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <AlertDescription className="text-xs">
            全 {totalAllItems} 件中 {filteredTotal} 件を抽出中
            {summary.length > 0 ? (
              <span className="text-muted-foreground ml-1">：{summary.join('・')}</span>
            ) : null}
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={clearFilters}
          >
            <X className="size-3.5" />
            条件をクリア
          </Button>
        </Alert>
      )}
    </div>
  );
}
