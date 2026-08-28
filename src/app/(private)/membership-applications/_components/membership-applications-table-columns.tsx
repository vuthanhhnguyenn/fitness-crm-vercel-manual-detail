'use client';

import { formatDateYYYYMMDD, formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import type { MembershipApplication } from '@/lib/api/types.gen';

import {
  ENROLLMENT_ROUTE_BADGE_CLASSES,
  ENROLLMENT_ROUTE_LABELS,
  OVERDUE_TOOLTIP,
  PENDING_OVERDUE_THRESHOLD_HOURS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from '../_constants/constants';
import type { MembershipApplicationsSortBy } from '../_hooks/use-membership-applications-filters';

interface SortableHeaderProps {
  label: string;
  sortKey: MembershipApplicationsSortBy;
  activeSortBy: MembershipApplicationsSortBy;
  sortOrder: 'asc' | 'desc';
  onToggle: (key: MembershipApplicationsSortBy) => void;
}

/** The three V0 sort tooltips, keyed by whether/how this column is currently sorted. */
function SortableHeader({
  label,
  sortKey,
  activeSortBy,
  sortOrder,
  onToggle,
}: Readonly<SortableHeaderProps>) {
  const isActive = activeSortBy === sortKey;
  const tooltip = !isActive
    ? 'クリックでソート'
    : sortOrder === 'desc'
      ? 'クリックで昇順ソート'
      : 'クリックで降順ソート';

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Button
          variant="ghost"
          className="h-auto gap-1 p-0 text-xs font-semibold hover:bg-transparent"
          onClick={() => onToggle(sortKey)}
        >
          {label}
          {isActive ? (
            sortOrder === 'desc' ? (
              <ArrowDown className="size-3" />
            ) : (
              <ArrowUp className="size-3" />
            )
          ) : (
            <ArrowUpDown className="text-muted-foreground size-3" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/** Derived client-side from `application_date` — never stored, since it changes with the clock (research R4). */
function isPendingOverdue(app: MembershipApplication): boolean {
  if (app.status !== 'pending') return false;
  const appliedAt = new Date(app.application_date).getTime();
  return Date.now() - appliedAt >= PENDING_OVERDUE_THRESHOLD_HOURS * 60 * 60 * 1000;
}

export function getMembershipApplicationsColumns(
  sortBy: MembershipApplicationsSortBy,
  sortOrder: 'asc' | 'desc',
  onToggleSort: (key: MembershipApplicationsSortBy) => void,
): ColumnDef<MembershipApplication>[] {
  const sortableHeader = (label: string, key: MembershipApplicationsSortBy) => (
    <SortableHeader
      label={label}
      sortKey={key}
      activeSortBy={sortBy}
      sortOrder={sortOrder}
      onToggle={onToggleSort}
    />
  );

  return [
    {
      accessorKey: 'id',
      header: () => sortableHeader('申請ID', 'id'),
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
      meta: { className: 'w-[140px] text-xs font-semibold' },
    },
    {
      accessorKey: 'applicant_name',
      header: () => sortableHeader('氏名', 'applicant_name'),
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.applicant_name}</span>,
      meta: { className: 'min-w-[120px] text-xs font-semibold' },
    },
    {
      accessorKey: 'status',
      header: () => sortableHeader('ステータス', 'status'),
      cell: ({ row }) => {
        const status = row.original.status;
        const overdue = isPendingOverdue(row.original);
        return (
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="outline" className={`text-[10px] ${STATUS_BADGE_CLASSES[status]}`}>
              {STATUS_LABELS[status]}
            </Badge>
            {overdue && (
              <Tooltip>
                <TooltipTrigger render={<span className="inline-flex" />}>
                  <Badge
                    variant="outline"
                    className="bg-warning/15 text-warning border-warning/20 gap-1 text-[10px]"
                  >
                    <AlertTriangle className="size-3" />
                    対応超過
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{OVERDUE_TOOLTIP}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
      meta: { className: 'w-[140px] text-xs font-semibold' },
    },
    {
      accessorKey: 'blacklist_state',
      header: 'BL照合',
      cell: ({ row }) =>
        row.original.blacklist_state === 'matched' ? (
          <Badge
            variant="outline"
            className="bg-warning/15 text-warning border-warning/20 gap-1 text-[10px]"
          >
            <AlertTriangle className="size-3" />
            BL一致
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
      meta: { className: 'w-[80px] text-xs font-semibold' },
    },
    {
      accessorKey: 'brand_name',
      header: 'ブランド',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">
          {row.original.brand_name}
        </Badge>
      ),
      meta: { className: 'w-[100px] text-xs font-semibold' },
    },
    {
      accessorKey: 'store_name',
      header: '申請店舗',
      cell: ({ row }) => <span className="text-xs">{row.original.store_name}</span>,
      meta: { className: 'w-[160px] text-xs font-semibold' },
    },
    {
      accessorKey: 'plan_name',
      header: 'プラン',
      cell: ({ row }) => <span className="text-xs">{row.original.plan_name}</span>,
      meta: { className: 'w-[160px] text-xs font-semibold' },
    },
    {
      accessorKey: 'campaign_name',
      header: 'キャンペーン',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.campaign_name ?? '—'}</span>
      ),
      meta: { className: 'w-[160px] text-xs font-semibold' },
    },
    {
      accessorKey: 'application_date',
      header: () => sortableHeader('申請日時', 'application_date'),
      cell: ({ row }) => (
        <span className="text-xs">{formatDateYYYYMMDD_HHMM(row.original.application_date)}</span>
      ),
      meta: { className: 'w-[140px] text-xs font-semibold' },
    },
    {
      accessorKey: 'enrollment_route',
      header: '入会経路',
      cell: ({ row }) => {
        const route = row.original.enrollment_route;
        return (
          <Badge
            variant="outline"
            className={`text-[10px] ${ENROLLMENT_ROUTE_BADGE_CLASSES[route]}`}
          >
            {ENROLLMENT_ROUTE_LABELS[route]}
          </Badge>
        );
      },
      meta: { className: 'w-[80px] text-xs font-semibold' },
    },
    {
      accessorKey: 'usage_start_date',
      header: () => sortableHeader('利用開始日', 'usage_start_date'),
      cell: ({ row }) => (
        <span className="text-xs">{formatDateYYYYMMDD(row.original.usage_start_date)}</span>
      ),
      meta: { className: 'w-[110px] text-xs font-semibold' },
    },
  ];
}
