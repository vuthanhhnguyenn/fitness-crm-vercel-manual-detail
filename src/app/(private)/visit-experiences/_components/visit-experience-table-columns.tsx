'use client';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

import type { VisitExperience, VisitExperienceStatus } from '@/types/api/visit-experience.type';
import { VISIT_EXPERIENCE_STATUS_LABELS } from '@/types/api/visit-experience.type';

const STATUS_BADGE_VARIANTS: Record<VisitExperienceStatus, string> = {
  application_received: 'bg-muted text-muted-foreground border-border',
  info_missing: 'bg-warning/10 text-warning border-warning/30',
  bl_checking: 'bg-destructive/10 text-destructive border-destructive/30',
  visiting: 'bg-info/10 text-info border-info/30',
  visit_completed: 'bg-secondary text-secondary-foreground border-border',
  membership_applied: 'bg-success/10 text-success border-success/30',
  cancelled: 'bg-foreground/5 text-foreground border-foreground/20',
};

export function getVisitExperienceColumns(showStoreColumn: boolean): ColumnDef<VisitExperience>[] {
  return [
    {
      accessorKey: 'id',
      header: '予約番号',
      cell: ({ row }) => <span className="text-xs font-medium">{row.original.id}</span>,
      meta: { className: 'text-xs' },
    },
    {
      accessorKey: 'customer_name',
      header: '氏名',
      cell: ({ row }) => <span className="text-xs">{row.original.customer_name}</span>,
      meta: { className: 'text-xs' },
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-xs ${STATUS_BADGE_VARIANTS[row.original.status]}`}
        >
          {VISIT_EXPERIENCE_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: 'bl_match',
      header: 'BL照合',
      cell: ({ row }) =>
        row.original.bl_match ? (
          <Badge
            variant="outline"
            className="border-destructive/30 bg-destructive/10 text-destructive gap-1 text-xs"
          >
            <AlertTriangle className="size-3" />
            BL一致
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      accessorKey: 'brand_name',
      header: 'ブランド',
      cell: ({ row }) => <span className="text-xs">{row.original.brand_name}</span>,
      meta: { className: 'text-xs' },
    },
    ...(showStoreColumn
      ? [
          {
            accessorKey: 'store_name',
            header: '店舗',
            cell: ({ row }) => <span className="text-xs">{row.original.store_name}</span>,
            meta: { className: 'text-xs' },
          } satisfies ColumnDef<VisitExperience>,
        ]
      : []),
    {
      accessorKey: 'reserved_at',
      header: '予約日時',
      cell: ({ row }) => (
        <span className="text-xs">{formatDateYYYYMMDD_HHMM(row.original.reserved_at)}</span>
      ),
      meta: { className: 'text-xs' },
    },
    {
      accessorKey: 'visit_start_at',
      header: '見学開始',
      cell: ({ row }) => (
        <span className="text-xs">{formatDateYYYYMMDD_HHMM(row.original.visit_start_at)}</span>
      ),
      meta: { className: 'text-xs' },
    },
    {
      id: 'visit_end_at',
      header: '見学終了（予定/実績）',
      cell: ({ row }) =>
        row.original.visit_end_actual_at ? (
          <span className="text-xs">
            {formatDateYYYYMMDD_HHMM(row.original.visit_end_actual_at)}
            <span className="text-muted-foreground ml-1">（実績）</span>
          </span>
        ) : (
          <span className="text-xs">
            {formatDateYYYYMMDD_HHMM(row.original.visit_end_scheduled_at)}
            <span className="text-muted-foreground ml-1">（予定）</span>
          </span>
        ),
      meta: { className: 'text-xs' },
    },
  ];
}
