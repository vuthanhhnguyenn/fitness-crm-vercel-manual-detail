'use client';

import {
  CRM_MAINTENANCE_STATUS_BADGE_CLASSES,
  CRM_MAINTENANCE_STATUS_LABELS,
} from '@/app/(private)/crm-maintenance/_constants/crm-maintenance.constants';
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

import { type CrmMaintenanceItemResponse, CrmMaintenanceStatus } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

interface CrmMaintenanceColumnsProps {
  onEditClick?: (id: string) => void;
  onDeleteClick?: (row: CrmMaintenanceItemResponse) => void;
}

export function crmMaintenanceColumns({
  onEditClick,
  onDeleteClick,
}: CrmMaintenanceColumnsProps): ColumnDef<CrmMaintenanceItemResponse>[] {
  return [
    {
      accessorKey: 'id',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">ID</span>,
      meta: { className: 'w-[90px]' },
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
    },
    {
      accessorKey: 'title',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">タイトル</span>,
      meta: { className: 'min-w-[260px]' },
      cell: ({ row }) => (
        <span className="block max-w-md truncate text-xs font-medium" title={row.original.title}>
          {row.original.title}
        </span>
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
      accessorKey: 'status',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">ステータス</span>,
      meta: { className: 'w-[120px]' },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn('text-[10px]', CRM_MAINTENANCE_STATUS_BADGE_CLASSES[row.original.status])}
        >
          {CRM_MAINTENANCE_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    // NOTE: 通知列は今回のリリースでは非表示（次回リリースで再表示予定）
    // {
    //   // FR-007 事前通知の送信状況: 完了は再通知不要のため「—」
    //   accessorKey: 'notified',
    //   enableSorting: false,
    //   header: () => <span className="text-xs font-semibold">通知</span>,
    //   meta: { className: 'w-[90px]' },
    //   cell: ({ row }) => {
    //     if (row.original.status === CrmMaintenanceStatus.COMPLETED) {
    //       return <span className="text-muted-foreground text-xs">—</span>;
    //     }
    //     return row.original.notified ? (
    //       <Badge
    //         variant="outline"
    //         className={cn('gap-1 text-[10px]', CRM_MAINTENANCE_NOTIFIED_BADGE_CLASS)}
    //       >
    //         <span className="bg-success size-1.5 rounded-full" />済
    //       </Badge>
    //     ) : (
    //       <Badge
    //         variant="outline"
    //         className={cn('text-[10px]', CRM_MAINTENANCE_UNNOTIFIED_BADGE_CLASS)}
    //       >
    //         未
    //       </Badge>
    //     );
    //   },
    // },
    {
      accessorKey: 'allowedUserCount',
      enableSorting: false,
      header: () => <span className="block text-right text-xs font-semibold">許可ユーザー</span>,
      meta: { className: 'w-[100px] text-right' },
      cell: ({ row }) => (
        <span className="text-xs tabular-nums">{row.original.allowedUserCount}名</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="作成日" />,
      meta: { className: 'w-[150px]' },
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {formatDatetimeISO(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => null,
      meta: { className: 'w-10' },
      cell: ({ row }) => {
        const item = row.original;
        const isInProgress = item.status === CrmMaintenanceStatus.IN_PROGRESS;

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
                requiredPermission={Permission.CrmMaintenanceEdit}
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
                  requiredPermission={Permission.CrmMaintenanceDelete}
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
