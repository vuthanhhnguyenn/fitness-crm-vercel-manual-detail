'use client';

import { formatDateYYYYMMDD, formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTableRowActions } from '@/components/common/data-table/data-table-row-action';
import { Badge } from '@/components/ui/badge';

import { AppVersionRecord } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { APP_VERSION_BRAND_LABELS, BRAND_BADGE_CLASSES } from '../_constants/app-version.constants';

interface AppVersionTableColumnsProps {
  onEditClick?: (id: string) => void;
  onDeleteClick?: (item: AppVersionRecord) => void;
}

export function AppVersionTableColumns({
  onEditClick,
  onDeleteClick,
}: AppVersionTableColumnsProps): ColumnDef<AppVersionRecord>[] {
  return [
    {
      accessorKey: 'id',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">ID</span>,
      meta: { className: 'w-15' },
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
    },
    {
      accessorKey: 'brandEnum',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">ブランド</span>,
      meta: { className: 'w-25' },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-[10px] ${BRAND_BADGE_CLASSES[row.original.brandEnum]}`}
        >
          {APP_VERSION_BRAND_LABELS[row.original.brandEnum]}
        </Badge>
      ),
    },
    {
      accessorKey: 'iosVersionName',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">iOSバージョン</span>,
      meta: { className: 'w-35' },
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.iosVersionName}{' '}
          <span className="text-muted-foreground">({row.original.iosBuildNumber})</span>
        </span>
      ),
    },
    {
      accessorKey: 'androidVersionName',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">Androidバージョン</span>,
      meta: { className: 'w-35' },
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.androidVersionName}{' '}
          <span className="text-muted-foreground">({row.original.androidBuildNumber})</span>
        </span>
      ),
    },
    {
      accessorKey: 'remarks',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">備考</span>,
      meta: { className: 'min-w-45 max-w-70' },
      cell: ({ row }) =>
        row.original.remarks ? (
          <span className="block truncate text-xs" title={row.original.remarks}>
            {row.original.remarks}
          </span>
        ) : (
          <span className="text-muted-foreground/50 text-xs">—</span>
        ),
    },
    {
      accessorKey: 'releaseDate',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">リリース日</span>,
      meta: { className: 'w-30' },
      cell: ({ row }) => (
        <span className="text-xs">{formatDateYYYYMMDD(row.original.releaseDate)}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">作成日</span>,
      meta: { className: 'w-35' },
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {formatDateYYYYMMDD_HHMM(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: 'updatedAt',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">更新日</span>,
      meta: { className: 'w-35' },
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.updatedAt ? (
            formatDateYYYYMMDD_HHMM(row.original.updatedAt)
          ) : (
            <span className="text-muted-foreground/50">—</span>
          )}
        </span>
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
            edit: Permission.AppVersionsEdit,
            delete: Permission.AppVersionsDelete,
          }}
          handlers={{
            edit: (item) => {
              onEditClick?.(item.id);
            },
            delete: (item) => {
              onDeleteClick?.(item);
            },
          }}
        />
      ),
    },
  ];
}
