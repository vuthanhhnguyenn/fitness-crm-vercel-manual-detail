'use client';

import { formatDate } from '@/utils/format.util';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil } from 'lucide-react';

import { DataTableColumnCheckbox } from '@/components/common/data-table/data-table-column-checkbox';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { GetCrmMembersResponse } from '@/lib/api/types.gen';
import { MemberStatus } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import {
  GATE_STOP_CLASSES,
  GATE_STOP_LABEL,
  MEMBER_STATUS_CLASSES,
  MEMBER_STATUS_LABELS,
  shouldShowMemberStatusDot,
} from '../_constants/constants';

interface MembersTableColumnsProps {
  /** Whether the bulk-select column is shown (HQ/System only) */
  canBulkChange?: boolean;
  /** True when the filtered result spans more than the current page */
  hasMorePages?: boolean;
  /** Called when the header checkbox selects the whole current page while more pages exist */
  onRequestSelectAll?: () => void;
  /** Navigate to the member edit screen */
  onEditClick?: (memberId: string) => void;
}

// Pure factory (no hooks) so the page can memoize the returned column defs. Their
// inline `header` render functions are what `flexRender` treats as component types;
// a fresh identity each render remounts the sort-tooltip and makes it blink.
export function MembersTableColumns({
  canBulkChange = false,
  hasMorePages = false,
  onRequestSelectAll,
  onEditClick,
}: MembersTableColumnsProps): ColumnDef<NonNullable<GetCrmMembersResponse['members']>[0]>[] {
  const selectColumn: ColumnDef<NonNullable<GetCrmMembersResponse['members']>[0]> = {
    id: 'select',
    header: ({ table }) => {
      const allPageSelected = table.getIsAllPageRowsSelected();
      const somePageSelected = table.getIsSomePageRowsSelected();
      return (
        <div className="w-[32px] px-2 py-2.5">
          <Checkbox
            aria-label="このページ全選択"
            checked={allPageSelected}
            indeterminate={somePageSelected && !allPageSelected}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              if (value && hasMorePages) {
                onRequestSelectAll?.();
              }
            }}
          />
        </div>
      );
    },
    cell: ({ row }) => <DataTableColumnCheckbox row={row} />,
    enableSorting: false,
    enableHiding: false,
  };

  const actionsColumn: ColumnDef<NonNullable<GetCrmMembersResponse['members']>[0]> = {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const memberId = row.original.id || '';
      if (!memberId) return null;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="sm" />}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <RoleGatedMenuItem
              requiredPermission={Permission.MembersEdit}
              onClick={(e) => {
                e.stopPropagation();
                onEditClick?.(memberId);
              }}
            >
              <Pencil className="mr-2 size-4" />
              編集
            </RoleGatedMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableHiding: false,
  };

  return [
    ...(canBulkChange ? [selectColumn] : []),
    {
      accessorKey: 'member_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="会員ID" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.original.member_number || '-'}
        </span>
      ),
      meta: { label: '会員ID' },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="氏名" />,
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.name_kanji || '-'}</span>
      ),
      meta: { label: '氏名' },
    },
    {
      accessorKey: 'store_name',
      header: '店舗名',
      cell: ({ row }) => <span className="text-xs">{row.original.store_name || '-'}</span>,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ステータス" />,
      meta: { label: 'ステータス' },
      cell: ({ row }) => {
        const status = row.original.status as MemberStatus | undefined;
        // Gate stop is an independent flag, but the list shows ONE badge and gives
        // the gate stop precedence — the restriction is what the operator has to act
        // on (prototype behaviour, confirmed 2026-08-10). The underlying status is
        // still filterable and is shown in full on the member detail screen.
        if (row.original.has_gate_stop) {
          return (
            <Badge className={`border text-[10px] ${GATE_STOP_CLASSES}`}>
              <span className="mr-1 inline-block size-1.5 rounded-full bg-current" />
              {GATE_STOP_LABEL}
            </Badge>
          );
        }
        if (!status) return <span>-</span>;
        return (
          <Badge className={`border text-[10px] ${MEMBER_STATUS_CLASSES[status]}`}>
            {shouldShowMemberStatusDot(status) && (
              <span className="mr-1 inline-block size-1.5 rounded-full bg-current" />
            )}
            {MEMBER_STATUS_LABELS[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'contract_name',
      header: '主契約名',
      cell: ({ row }) => <span className="text-xs">{row.original.contract_name || '-'}</span>,
    },
    {
      accessorKey: 'joined_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="入会日" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {formatDate(row.original.joined_at, '-')}
        </span>
      ),
      meta: { label: '入会日' },
    },
    {
      accessorKey: 'last_visit_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="最終来館日" />,
      cell: ({ row }) => (
        <span className="text-xs">{formatDate(row.original.last_visit_date, '-')}</span>
      ),
      meta: { label: '最終来館日' },
    },
    actionsColumn,
  ];
}
