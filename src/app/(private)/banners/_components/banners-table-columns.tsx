'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Globe, Smartphone } from 'lucide-react';

import { BrandBadge } from '@/components/common/brand-badge';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { DataTableRowActions } from '@/components/common/data-table/data-table-row-action';
import { Badge } from '@/components/ui/badge';

import type { BannerItemResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

import { BANNER_STATUS_BADGE_CLASSES, BANNER_STATUS_LABELS } from '../_constants/banner.constants';
import { BannerThumbnail } from './banner-thumbnail';

interface BannersTableColumnsProps {
  onEditClick?: (id: string) => void;
  onDeleteClick?: (banner: BannerItemResponse) => void;
}

export function BannersTableColumns({
  onEditClick,
  onDeleteClick,
}: BannersTableColumnsProps): ColumnDef<BannerItemResponse>[] {
  return [
    {
      accessorKey: 'order',
      header: ({ column }) => <DataTableColumnHeader column={column} title="順" />,
      meta: { className: 'w-[48px]' },
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.order}</span>
      ),
    },
    {
      accessorKey: 'imageUrl',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">バナー画像</span>,
      meta: { className: 'w-[140px]' },
      cell: ({ row }) => (
        <BannerThumbnail
          src={row.original.imageUrl}
          alt={row.original.title}
          width={120}
          height={60}
        />
      ),
    },
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="タイトル（管理用）" />,
      meta: { className: 'min-w-[180px]' },
      cell: ({ row }) => <span className="text-xs font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: 'brand',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">ブランド</span>,
      meta: { className: 'min-w-[120px]' },
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.brandEnum.map((brandEnum) => (
            <BrandBadge key={`${row.original.id}-${brandEnum}`} brand={brandEnum} />
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'linkUrl',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">遷移先URL</span>,
      meta: { className: 'min-w-[180px]' },
      cell: ({ row }) => (
        <span className="text-muted-foreground block max-w-180 truncate text-xs">
          {row.original.linkUrl ? (
            <span className="block truncate" title={row.original.linkUrl}>
              {row.original.linkUrl}
            </span>
          ) : (
            <span className="text-muted-foreground/50">—</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: 'periodStart',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">掲載期間</span>,
      meta: { className: 'w-[200px]' },
      cell: ({ row }) => (
        <div className="text-muted-foreground text-xs leading-5 whitespace-nowrap">
          {row.original.periodStart} 〜<br />
          {row.original.periodEnd}
        </div>
      ),
    },
    {
      accessorKey: 'webEnabled',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">WEB</span>,
      meta: { className: 'w-[60px] text-center' },
      cell: ({ row }) =>
        row.original.webEnabled ? (
          <Badge
            variant="outline"
            className="bg-success/15 text-success border-success/20 gap-0.5 text-[10px]"
          >
            <Globe className="size-3" />
            ON
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground text-[10px]">
            OFF
          </Badge>
        ),
    },
    {
      accessorKey: 'mobileEnabled',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">モバイル</span>,
      meta: { className: 'w-[72px] text-center' },
      cell: ({ row }) =>
        row.original.mobileEnabled ? (
          <Badge
            variant="outline"
            className="bg-success/15 text-success border-success/20 gap-0.5 text-[10px]"
          >
            <Smartphone className="size-3" />
            ON
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground text-[10px]">
            OFF
          </Badge>
        ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="公開状況" />,
      meta: { className: 'w-[90px]' },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn('text-[10px]', BANNER_STATUS_BADGE_CLASSES[row.original.status])}
        >
          {BANNER_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => null,
      meta: { className: 'w-10' },
      cell: ({ row }) => (
        <DataTableRowActions
          row={row.original}
          actions={['edit', 'delete']}
          permissions={{
            edit: Permission.BannersEdit,
            delete: Permission.BannersDelete,
          }}
          handlers={{
            edit: (banner) => {
              onEditClick?.(banner.id);
            },
            delete: (banner) => {
              onDeleteClick?.(banner);
            },
          }}
        />
      ),
    },
  ];
}
