'use client';

import { useState } from 'react';

import type { Column, ColumnDef } from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { TextWithTooltip } from '@/components/common/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { GetCrmStaffsResponse } from '@/lib/api/types.gen';

import { UserRole } from '@/types/permission.type';

import {
  STAFF_ROLE_BADGE_CLASSES,
  STAFF_ROLE_LABELS,
  STAFF_STATUS_CLASSES,
  STAFF_STATUS_LABELS,
  type StaffRole,
  StaffStatus,
} from '../_constants/constants';
import { formatRelativeTime } from '../_utils/format-relative-time.util';
import { StaffDeactivateAction } from './staff-deactivate-action';
import { StaffDeleteAction } from './staff-delete-action';

type Staff = GetCrmStaffsResponse['staffs'][number];

interface StaffsTableColumnsProps {
  onEditClick?: (staffId: string) => void;
  onPositionClick?: (positionId: number) => void;
  onResendInvite?: (staffId: string, email: string) => void;
  isSingleStoreContext?: boolean;
}

/** Sort-direction tooltip toggle — port from staff-list.tsx `renderSortableHead` (L306-L336) */
function SortableColumnHeader<TData>({ column, title }: { column: Column<TData>; title: string }) {
  const isSorted = column.getIsSorted();
  const SortIcon = isSorted === false ? ArrowUpDown : isSorted === 'desc' ? ArrowDown : ArrowUp;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <Button
            variant="ghost"
            className="group/sort h-auto gap-1 p-0 text-xs font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(isSorted === 'desc' ? false : true)}
          >
            {title}
            <SortIcon
              className={
                isSorted === false
                  ? 'text-muted-foreground/40 group-hover/sort:text-foreground size-3 transition-colors'
                  : 'text-foreground size-3'
              }
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">
            {isSorted === 'desc' ? 'クリックで昇順ソート' : 'クリックで降順ソート'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ActionsCell({
  staff,
  onEditClick,
  onResendInvite,
}: {
  staff: Staff;
  onEditClick?: (staffId: string) => void;
  onResendInvite?: (staffId: string, email: string) => void;
}) {
  const [open, setOpen] = useState(false);
  // Confirmation dialogs are rendered as siblings of the DropdownMenu (not children of
  // DropdownMenuContent) — the menu's Popup unmounts its subtree whenever it closes
  // (Base UI's Menu.Item closes on click by default), which would tear down a dialog
  // mounted inside it before it could ever render. See BUG-Y01LIST-08/09.
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'delete' | null>(null);
  const isInvited = staff.status === StaffStatus.INVITED;

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="sm" />}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <RoleGatedMenuItem
            allowedRoles={[UserRole.Headquarter, UserRole.System]}
            onClick={() => onEditClick?.(staff.id)}
          >
            <Pencil className="size-4" />
            編集
          </RoleGatedMenuItem>
          {isInvited && (
            <>
              <DropdownMenuSeparator />
              <RoleGatedMenuItem
                allowedRoles={[UserRole.Headquarter, UserRole.System]}
                className="text-info"
                onClick={() => onResendInvite?.(staff.id, staff.email)}
              >
                <RefreshCw className="size-4" />
                再招待
              </RoleGatedMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <RoleGatedMenuItem
            allowedRoles={[UserRole.Headquarter, UserRole.System]}
            className="text-warning"
            onClick={() => setConfirmAction('deactivate')}
          >
            <Ban className="size-4" />
            無効化
          </RoleGatedMenuItem>
          <DropdownMenuSeparator />
          <RoleGatedMenuItem
            allowedRoles={[UserRole.Headquarter, UserRole.System]}
            className="text-destructive"
            onClick={() => setConfirmAction('delete')}
          >
            <Trash2 className="size-4" />
            削除
          </RoleGatedMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <StaffDeactivateAction
        staffId={staff.id}
        staffName={staff.name}
        open={confirmAction === 'deactivate'}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setConfirmAction(null);
        }}
      />
      <StaffDeleteAction
        staffId={staff.id}
        open={confirmAction === 'delete'}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setConfirmAction(null);
        }}
      />
    </>
  );
}

export function StaffsTableColumns({
  onEditClick,
  onPositionClick,
  onResendInvite,
  isSingleStoreContext = false,
}: StaffsTableColumnsProps): ColumnDef<Staff>[] {
  const columns: ColumnDef<Staff>[] = [
    {
      accessorKey: 'staff_id',
      header: ({ column }) => <SortableColumnHeader column={column} title="スタッフID" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.staff_id}</span>,
      meta: { label: 'スタッフID' },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableColumnHeader column={column} title="氏名" />,
      cell: ({ row }) =>
        row.original.status === StaffStatus.INVITED ? (
          <span className="text-muted-foreground/70 font-normal italic">未登録</span>
        ) : (
          <TextWithTooltip
            text={row.original.name}
            className="max-w-40 font-medium"
            wrapperClassName="min-w-0"
          />
        ),
      meta: { label: '氏名' },
    },
    {
      accessorKey: 'email',
      header: 'メールアドレス',
      cell: ({ row }) => <span>{row.original.email}</span>,
      meta: { label: 'メールアドレス' },
    },
    {
      accessorKey: 'role',
      header: 'ロール',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-[10px] ${STAFF_ROLE_BADGE_CLASSES[row.original.role as StaffRole]}`}
        >
          {STAFF_ROLE_LABELS[row.original.role as StaffRole] || '-'}
        </Badge>
      ),
      enableSorting: false,
      meta: { label: 'ロール' },
    },
    {
      accessorKey: 'position_name',
      header: ({ column }) => <SortableColumnHeader column={column} title="職位" />,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 hover:bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            onPositionClick?.(row.original.position_id);
          }}
        >
          <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer text-[10px]">
            {row.original.position_name}
          </Badge>
        </Button>
      ),
      meta: { label: '職位' },
    },
    ...(isSingleStoreContext
      ? []
      : [
          {
            id: 'linked_store_name',
            header: '所属店舗',
            cell: ({ row }: { row: { original: Staff } }) => (
              <span className="text-muted-foreground">{row.original.linked_store_name ?? '—'}</span>
            ),
            enableSorting: false,
            meta: { label: '所属店舗' },
          } satisfies ColumnDef<Staff>,
        ]),
    {
      id: 'linked_fc_company_name',
      header: 'FC企業',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.linked_fc_company_name ?? '—'}</span>
      ),
      enableSorting: false,
      meta: { label: 'FC企業' },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <SortableColumnHeader column={column} title="ステータス" />,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-[10px] ${STAFF_STATUS_CLASSES[row.original.status as StaffStatus]}`}
        >
          {STAFF_STATUS_LABELS[row.original.status as StaffStatus]}
        </Badge>
      ),
      meta: { label: 'ステータス' },
    },
    {
      accessorKey: 'last_login',
      header: ({ column }) => <SortableColumnHeader column={column} title="最終ログイン" />,
      cell: ({ row }) => {
        if (row.original.status === StaffStatus.INVITED) {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-info font-medium">未ログイン</span>
              {row.original.invited_at && (
                <span className="text-muted-foreground text-[10px]">
                  招待: {row.original.invited_at.slice(0, 10).replaceAll('-', '/')}
                </span>
              )}
            </div>
          );
        }
        if (!row.original.last_login) {
          return <span className="text-muted-foreground">未ログイン</span>;
        }
        return (
          <span className="text-muted-foreground" title={row.original.last_login}>
            {formatRelativeTime(row.original.last_login)}
          </span>
        );
      },
      meta: { label: '最終ログイン' },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionsCell
          staff={row.original}
          onEditClick={onEditClick}
          onResendInvite={onResendInvite}
        />
      ),
      enableHiding: false,
      enableSorting: false,
    },
  ];

  return columns;
}
