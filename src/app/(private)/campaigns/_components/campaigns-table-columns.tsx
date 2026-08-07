'use client';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';

import { BrandBadge } from '@/components/common/brand-badge';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

import type { GetCrmCampaignsResponse, StoreListBrand } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import {
  CAMPAIGN_ACCEPT_STATUS_BADGE_CLASSES,
  CAMPAIGN_ACCEPT_STATUS_LABELS,
} from '../_constants/constants';
import { CampaignRowActions } from './campaign-row-actions';

type CampaignRow = GetCrmCampaignsResponse['campaigns'][number];

export function CampaignsTableColumns(): ColumnDef<CampaignRow>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
      meta: { className: 'min-w-[90px]' },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="キャンペーン名" />,
      cell: ({ row }) => <span className="text-xs font-medium">{row.original.name}</span>,
      meta: { className: 'min-w-[220px]' },
    },
    {
      accessorKey: 'code',
      header: 'コード',
      cell: ({ row }) => (
        <code className="bg-muted text-foreground inline-flex rounded px-2 py-1 font-mono text-xs font-normal">
          {row.original.code}
        </code>
      ),
      meta: { className: 'min-w-[120px]' },
      enableSorting: false,
    },
    {
      accessorKey: 'brand',
      header: () => <span className="text-xs font-semibold">ブランド</span>,
      cell: ({ row }) => <BrandBadge brand={row.original.brand as StoreListBrand} />,
      meta: { className: 'min-w-[120px]' },
    },
    {
      accessorKey: 'recruitment_period_start',
      header: ({ column }) => <DataTableColumnHeader column={column} title="募集期間" />,
      cell: ({ row }) => (
        <span className="text-xs">
          {formatDateYYYYMMDD(row.original.recruitment_period_start)} 〜{' '}
          {formatDateYYYYMMDD(row.original.recruitment_period_end)}
        </span>
      ),
      meta: { className: 'min-w-[180px]' },
    },
    {
      accessorKey: 'accept_status',
      header: () => <span className="text-xs font-semibold">受付可否</span>,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            'text-[10px]',
            CAMPAIGN_ACCEPT_STATUS_BADGE_CLASSES[row.original.accept_status],
          )}
        >
          {CAMPAIGN_ACCEPT_STATUS_LABELS[row.original.accept_status]}
        </Badge>
      ),
      meta: { className: 'min-w-[110px]' },
    },
    {
      accessorKey: 'main_contract_name',
      header: '適用主契約',
      cell: ({ row }) => (
        <Badge variant="outline" className="rounded-4xl text-[10px] font-medium">
          {row.original.main_contract_name}
        </Badge>
      ),
      meta: { className: 'min-w-[160px]' },
      enableSorting: false,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">操作</span>,
      cell: ({ row }) => <CampaignRowActions campaignId={row.original.id} />,
      meta: { className: 'w-10' },
    },
  ];
}
