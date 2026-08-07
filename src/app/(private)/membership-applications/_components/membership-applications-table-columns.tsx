'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { MembershipApplication } from '@/lib/api/types.gen';

import { STATUS_BADGE_CLASSES, STATUS_OPTIONS } from '../_constants/constants';

interface ApplicationDateHeaderProps {
  sortOrder: 'asc' | 'desc';
  onToggle: () => void;
}

function getStatusLabel(status: string): string {
  const option = STATUS_OPTIONS.find((opt) => opt.value === status);
  return option?.label || status;
}

function ApplicationDateHeader({ sortOrder, onToggle }: Readonly<ApplicationDateHeaderProps>) {
  return (
    <Button
      variant="ghost"
      className="h-auto gap-1 p-0 text-xs font-semibold hover:bg-transparent"
      onClick={onToggle}
    >
      申請日時
      {sortOrder === 'desc' ? (
        <ArrowDown className="text-foreground size-3" />
      ) : (
        <ArrowUp className="text-foreground size-3" />
      )}
    </Button>
  );
}

export function getMembershipApplicationsColumns(
  sortOrder: 'asc' | 'desc',
  onToggleSortOrder: () => void,
): ColumnDef<MembershipApplication>[] {
  return [
    {
      accessorKey: 'id',
      header: '申請ID',
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
      meta: { className: 'w-[140px] text-xs font-semibold' },
    },
    {
      accessorKey: 'applicant_name',
      header: '氏名',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.applicant_name}</span>,
      meta: { className: 'min-w-[120px] text-xs font-semibold' },
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      cell: ({ row }) => {
        const status = row.original.status;
        const label = getStatusLabel(status);
        return (
          <Badge variant="outline" className={`text-[10px] ${STATUS_BADGE_CLASSES[status] ?? ''}`}>
            {label}
          </Badge>
        );
      },
      meta: { className: 'w-[100px] text-xs font-semibold' },
    },
    {
      accessorKey: 'blacklist_match',
      header: 'BL照合',
      cell: ({ row }) =>
        row.original.blacklist_match ? (
          <Badge
            variant="outline"
            className="bg-destructive/15 text-destructive border-destructive/20 gap-1 text-[10px]"
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
      header: '店舗',
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
      accessorKey: 'campaign',
      header: 'キャンペーン',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.campaign === 'なし' ? '—' : row.original.campaign}
        </span>
      ),
      meta: { className: 'w-[160px] text-xs font-semibold' },
    },
    {
      accessorKey: 'application_date',
      header: () => <ApplicationDateHeader sortOrder={sortOrder} onToggle={onToggleSortOrder} />,
      cell: ({ row }) => {
        const iso = row.original.application_date;
        // Format: "2026/03/30 09:15"
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatted = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        return <span className="text-xs">{formatted}</span>;
      },
      meta: { className: 'w-[140px] text-xs font-semibold' },
      enableSorting: false,
    },
    {
      accessorKey: 'start_date',
      header: '利用開始日',
      cell: ({ row }) => <span className="text-xs">{row.original.start_date}</span>,
      meta: { className: 'w-[110px] text-xs font-semibold' },
    },
  ];
}
