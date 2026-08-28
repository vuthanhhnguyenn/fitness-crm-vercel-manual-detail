'use client';

import {
  APP_MAINTENANCE_BRAND_LABELS,
  APP_MAINTENANCE_STATUS_BADGE_CLASSES,
  APP_MAINTENANCE_STATUS_LABELS,
} from '@/app/(private)/app-maintenance/_constants/app-maintenance.constants';
import { formatDatetimeISO } from '@/utils/format.util';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { type AppMaintenanceItemResponse, AppMaintenanceStatus } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

interface AppMaintenanceColumnsProps {
  onEditClick?: (id: string) => void;
  onDeleteClick?: (row: AppMaintenanceItemResponse) => void;
}

export function appMaintenanceColumns({
  onEditClick,
  onDeleteClick,
}: AppMaintenanceColumnsProps): ColumnDef<AppMaintenanceItemResponse>[] {
  return [
    {
      accessorKey: 'id',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">ID</span>,
      meta: { className: 'w-[100px]' },
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
    },
    {
      accessorKey: 'targetBrand',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">ブランド</span>,
      meta: { className: 'w-[110px]' },
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">
          {APP_MAINTENANCE_BRAND_LABELS[row.original.targetBrand]}
        </Badge>
      ),
    },
    {
      accessorKey: 'startsAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="開始日時" />,
      meta: { className: 'w-[150px]' },
      cell: ({ row }) => (
        <span className="text-xs whitespace-nowrap">
          {formatDatetimeISO(row.original.startsAt)}
        </span>
      ),
    },
    {
      accessorKey: 'endsAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="終了日時" />,
      meta: { className: 'w-[150px]' },
      cell: ({ row }) => (
        <span className="text-xs whitespace-nowrap">{formatDatetimeISO(row.original.endsAt)}</span>
      ),
    },
    {
      accessorKey: 'message',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">メッセージ</span>,
      meta: { className: 'min-w-[280px]' },
      cell: ({ row }) => (
        <span className="block max-w-md truncate text-xs" title={row.original.message}>
          {row.original.message}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">ステータス</span>,
      meta: { className: 'w-[110px]' },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn('text-[10px]', APP_MAINTENANCE_STATUS_BADGE_CLASSES[row.original.status])}
        >
          {APP_MAINTENANCE_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => null,
      meta: { className: 'w-10' },
      cell: ({ row }) => {
        const item = row.original;
        const isInProgress = item.status === AppMaintenanceStatus.IN_PROGRESS;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" />}
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <RoleGatedMenuItem
                requiredPermission={Permission.AppMaintenanceEdit}
                denyBadge="System"
                onClick={() => onEditClick?.(item.id)}
              >
                <Pencil className="size-4" />
                編集
              </RoleGatedMenuItem>

              <DropdownMenuSeparator />

              {isInProgress ? (
                <DropdownMenuItem
                  disabled
                  className="text-muted-foreground flex-col items-start gap-0"
                  onSelect={(event) => event.preventDefault()}
                >
                  <div className="flex items-center gap-2">
                    <Trash2 className="size-4" />
                    <span>削除できません</span>
                  </div>
                  <span className="text-muted-foreground/80 ml-6 text-[10px]">
                    メンテナンス実施中のため
                  </span>
                </DropdownMenuItem>
              ) : (
                <RoleGatedMenuItem
                  requiredPermission={Permission.AppMaintenanceDelete}
                  denyBadge="System"
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDeleteClick?.(item)}
                >
                  <Trash2 className="size-4" />
                  削除
                </RoleGatedMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
