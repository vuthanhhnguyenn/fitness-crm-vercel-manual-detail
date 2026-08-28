'use client';

// Client-only: column cells carry click handlers and render inside a client table.
import Link from 'next/link';

import type { ColumnDef } from '@tanstack/react-table';

import { BrandBadge } from '@/components/common/brand-badge';
import { Badge } from '@/components/ui/badge';

import type { GetCrmLeavesResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { LEAVE_STATUS_CLASSES, LEAVE_STATUS_LABELS } from '../_constants/constants';
import { LeavesRowActions } from './leaves-row-actions';

type LeaveRow = NonNullable<GetCrmLeavesResponse['leaves']>[number];

interface LeavesTableColumnsOptions {
  /** FR-008 — 店舗名 only earns a column when the caller can see more than one store. */
  showStoreColumn: boolean;
  onCancelClick: (row: LeaveRow) => void;
}

export function LeavesTableColumns({
  showStoreColumn,
  onCancelClick,
}: LeavesTableColumnsOptions): ColumnDef<LeaveRow>[] {
  const columns: ColumnDef<LeaveRow>[] = [
    {
      accessorKey: 'member_number',
      header: '会員ID',
      // FR-009 — the operator-facing member number, never the internal UUID.
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.original.member_number}
        </span>
      ),
      enableSorting: false,
      meta: { className: 'w-25' },
    },
    {
      accessorKey: 'member_name',
      header: '会員名',
      // FR-011 — opens the member, not the application, so the row click is stopped here.
      cell: ({ row }) => (
        <Link
          href={navigate('/members/[id]', row.original.member_id)}
          className="text-sm font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.member_name}
        </Link>
      ),
      enableSorting: false,
      meta: { label: '会員名' },
    },
    {
      accessorKey: 'brand',
      header: 'ブランド',
      cell: ({ row }) => <BrandBadge brand={row.original.brand} />,
      enableSorting: false,
      meta: { className: 'w-25' },
    },
  ];

  if (showStoreColumn) {
    columns.push({
      accessorKey: 'store_name',
      header: '店舗名',
      cell: ({ row }) => <span className="text-xs">{row.original.store_name}</span>,
      enableSorting: false,
    });
  }

  columns.push(
    {
      accessorKey: 'status',
      header: 'ステータス',
      // FR-010 — the list only ever carries the four in-progress states; the plain
      // 処理完了 variant lives on the detail screen alone (research.md §3).
      cell: ({ row }) => {
        const status = row.original.status;
        const cfg = LEAVE_STATUS_CLASSES[status];
        return (
          <Badge variant="outline" className={`text-[10px] ${cfg.badge}`}>
            <span className={`mr-1 inline-block size-1.5 rounded-full ${cfg.dot}`} />
            {LEAVE_STATUS_LABELS[status]}
          </Badge>
        );
      },
      enableSorting: false,
      meta: { label: 'ステータス', className: 'w-30' },
    },
    {
      accessorKey: 'applied_at',
      header: '申請日',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.applied_at}</span>
      ),
      enableSorting: false,
      meta: { label: '申請日', className: 'w-25' },
    },
    {
      accessorKey: 'scheduled_date',
      header: '予定日',
      cell: ({ row }) => <span className="text-xs">{row.original.scheduled_date}</span>,
      enableSorting: false,
      meta: { label: '予定日', className: 'w-25' },
    },
    {
      accessorKey: 'end_date',
      header: '終了日',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.end_date ?? '—'}</span>
      ),
      enableSorting: false,
      meta: { className: 'w-25' },
    },
    {
      accessorKey: 'unpaid_amount',
      header: '未納金',
      cell: ({ row }) => {
        const amount = row.original.unpaid_amount;
        return (
          <span
            className={`block text-right text-xs ${amount > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
          >
            {amount > 0 ? `¥${amount.toLocaleString()}` : '¥0'}
          </span>
        );
      },
      enableSorting: false,
      meta: { className: 'w-25 text-right' },
    },
    {
      id: 'actions',
      header: () => null,
      // FR-041 — the menu must not double as a row click; it opens the dialog only.
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <LeavesRowActions row={row.original} onCancelClick={onCancelClick} />
        </div>
      ),
      enableSorting: false,
      meta: { className: 'w-14' },
    },
  );

  return columns;
}
