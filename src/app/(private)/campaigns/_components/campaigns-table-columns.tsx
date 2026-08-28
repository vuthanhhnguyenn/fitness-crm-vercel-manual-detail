'use client';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';
import { Ticket } from 'lucide-react';

import { BrandBadge } from '@/components/common/brand-badge';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

import type { CampaignListItemResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import {
  CAMPAIGN_ACCEPT_STATE_BADGE_CLASSES,
  CAMPAIGN_ACCEPT_STATE_LABELS,
} from '../_constants/constants';
import { CampaignRowActions } from './campaign-row-actions';

type CampaignsTableColumnsProps = {
  onDeleteClick: (campaign: CampaignListItemResponse) => void;
};

/** V0 campaign-list.tsx:L272-315 の8列を同じ順序で並べる。 */
export function CampaignsTableColumns({
  onDeleteClick,
}: CampaignsTableColumnsProps): ColumnDef<CampaignListItemResponse>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
      meta: { className: 'w-[90px]' },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="キャンペーン名" />,
      cell: ({ row }) => (
        <div className="flex max-w-[360px] items-center gap-2">
          <span className="min-w-0 truncate text-xs font-medium" title={row.original.name}>
            {row.original.name}
          </span>
          {row.original.hasPromotionCode && (
            <Badge variant="outline" className="shrink-0 gap-1 text-[10px]">
              <Ticket className="size-3" />
              コードあり
            </Badge>
          )}
        </div>
      ),
      meta: { className: 'min-w-[220px] max-w-[360px]' },
    },
    {
      accessorKey: 'campaignCode',
      header: () => <span className="text-xs font-semibold">コード</span>,
      cell: ({ row }) =>
        row.original.campaignCode ? (
          <code className="bg-muted text-foreground inline-flex rounded px-2 py-1 font-mono text-xs font-normal">
            {row.original.campaignCode}
          </code>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
      meta: { className: 'min-w-[140px]' },
      enableSorting: false,
    },
    {
      accessorKey: 'brandEnum',
      header: () => <span className="text-xs font-semibold">ブランド</span>,
      cell: ({ row }) => <BrandBadge brand={row.original.brandEnum} />,
      meta: { className: 'w-[110px]' },
      enableSorting: false,
    },
    {
      accessorKey: 'recruitmentStart',
      header: ({ column }) => <DataTableColumnHeader column={column} title="募集期間" />,
      cell: ({ row }) => (
        <span className="text-xs">
          {formatDateYYYYMMDD(row.original.recruitmentStart)} 〜{' '}
          {formatDateYYYYMMDD(row.original.recruitmentEnd)}
        </span>
      ),
      meta: { className: 'w-[200px]' },
    },
    {
      accessorKey: 'acceptState',
      header: () => <span className="text-xs font-semibold">受付可否</span>,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            'text-[10px]',
            CAMPAIGN_ACCEPT_STATE_BADGE_CLASSES[row.original.acceptState],
          )}
        >
          {CAMPAIGN_ACCEPT_STATE_LABELS[row.original.acceptState]}
        </Badge>
      ),
      meta: { className: 'w-[110px]' },
      enableSorting: false,
    },
    {
      accessorKey: 'planName',
      header: () => <span className="text-xs font-semibold">適用主契約</span>,
      cell: ({ row }) => (
        <Badge variant="outline" className="rounded-4xl text-[10px] font-medium">
          {row.original.planName}
        </Badge>
      ),
      meta: { className: 'min-w-[140px]' },
      enableSorting: false,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">操作</span>,
      cell: ({ row }) => (
        <CampaignRowActions
          campaignId={row.original.id}
          onDeleteClick={() => onDeleteClick(row.original)}
        />
      ),
      meta: { className: 'w-10' },
    },
  ];
}
