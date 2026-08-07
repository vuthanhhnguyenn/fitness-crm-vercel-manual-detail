'use client';

import { useState } from 'react';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { GetCrmStaffsResponse } from '@/lib/api/types.gen';

import {
  STAFF_ROLE_LABELS,
  STAFF_STATUS_CLASSES,
  STAFF_STATUS_LABELS,
  type StaffRole,
  StaffStatus,
} from '../_constants/constants';
import { StaffDeleteAction } from './staff-delete-action';

type Staff = GetCrmStaffsResponse['staffs'][number];

interface StaffsTableColumnsProps {
  onEditClick?: (staffId: string) => void;
}

function ActionsCell({
  staffId,
  onEditClick,
}: {
  staffId: string;
  onEditClick?: (staffId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" />}
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onEditClick?.(staffId);
          }}
        >
          <Pencil className="size-4" />
          編集
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <StaffDeleteAction
          staffId={staffId}
          onOpenChange={(alertOpen) => {
            if (!alertOpen) setOpen(false);
          }}
          trigger={
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault();
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Trash2 className="text-destructive size-4" />
              削除
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StaffsTableColumns({ onEditClick }: StaffsTableColumnsProps): ColumnDef<Staff>[] {
  return [
    {
      accessorKey: 'staff_id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="管理者ID" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.staff_id}</span>,
      meta: {
        label: '管理者ID',
      },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="管理者名" />,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      meta: {
        label: '管理者名',
      },
    },
    {
      accessorKey: 'email',
      header: 'メールアドレス',
      cell: ({ row }) => <span className="">{row.original.email}</span>,
      meta: {
        label: 'メールアドレス',
      },
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <DataTableColumnHeader column={column} title="権限" />,
      cell: ({ row }) => (
        <span className="">
          <Badge variant="secondary">
            {STAFF_ROLE_LABELS[row.original.role as StaffRole] || '-'}
          </Badge>
        </span>
      ),
      meta: {
        label: '権限',
      },
    },
    {
      accessorKey: 'brand',
      header: 'ブランド',
      cell: ({ row }) => <span className="">{row.original.brand_display_name || '-'}</span>,
      meta: {
        label: 'ブランド',
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ステータス" />,
      cell: ({ row }) => (
        <Badge className={STAFF_STATUS_CLASSES[row.original.status as StaffStatus]}>
          {STAFF_STATUS_LABELS[row.original.status as StaffStatus]}
        </Badge>
      ),
      meta: {
        label: 'ステータス',
      },
    },
    {
      accessorKey: 'last_login',
      header: ({ column }) => <DataTableColumnHeader column={column} title="最終ログイン" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDateYYYYMMDD_HHMM(row.original.last_login)}
        </span>
      ),
      meta: {
        label: '最終ログイン',
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <ActionsCell staffId={row.original.id} onEditClick={onEditClick} />,
      enableHiding: false,
      enableSorting: false,
    },
  ];
}
