'use client';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle, MoreHorizontal, XCircle } from 'lucide-react';

import { BrandBadge } from '@/components/common/brand-badge';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { Brand, GetCrmTransfersResponse } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { isTransferPending } from '../_constants/constants';
import { TransferAutoBadge } from './transfer-auto-badge';
import { TransferStatusBadge } from './transfer-status-badge';

export type TransferItem = NonNullable<GetCrmTransfersResponse['transfers']>[0];

/**
 * FR-013 / PAR020: only an eligible JOYFIT row that is still awaiting a decision may take part
 * in a bulk approval.
 *
 * The status check matters: an already-完了 JOYFIT row is still "eligible", so without it the
 * row would offer a checkbox that the endpoint then rejects with
 * "すでに完了または否認されています" — an action the UI should never have offered.
 */
export function isTransferSelectable(transfer: TransferItem): boolean {
  return (
    transfer.brand === 'joyfit' &&
    transfer.auto_transfer_eligible === true &&
    isTransferPending(transfer.status)
  );
}

function isTransferExcluded(transfer: TransferItem): boolean {
  return (
    transfer.brand === 'joyfit' &&
    transfer.auto_transfer_eligible === false &&
    isTransferPending(transfer.status)
  );
}

interface TransferTableColumnsProps {
  onApproveClick: (transfer: TransferItem) => void;
  onRejectClick: (transfer: TransferItem) => void;
  /**
   * Whether the current user holds MembersTransfersApprove. A role without it (e.g. Observer)
   * gets neither column at all — not a disabled checkbox/menu — since it can never act on any
   * row (BUG-A02-030).
   */
  canApprove: boolean;
}

/**
 * Pure factory (no hooks) so the page can memoize the returned column defs. Their inline
 * `header`/`cell` render functions are what `flexRender` treats as component types; a fresh
 * identity on every render remounts the sort tooltip and makes it blink on refetch.
 */
export function TransferTableColumns({
  onApproveClick,
  onRejectClick,
  canApprove,
}: TransferTableColumnsProps): ColumnDef<TransferItem>[] {
  const selectColumn: ColumnDef<TransferItem> = {
    id: 'select',
    header: ({ table }) => {
      const rows = table.getRowModel().rows;
      const selectableRows = rows.filter((row) => isTransferSelectable(row.original));
      const selectedCount = selectableRows.filter((row) => row.getIsSelected()).length;
      const allSelected = selectableRows.length > 0 && selectedCount === selectableRows.length;
      return (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            aria-label="全選択"
            checked={allSelected}
            indeterminate={selectedCount > 0 && !allSelected}
            // Disabled when nothing on this page can be bulk-approved, so the control never
            // looks available on a page of FIT365 / excluded rows.
            disabled={selectableRows.length === 0}
            onCheckedChange={(value) => {
              selectableRows.forEach((row) => row.toggleSelected(!!value));
            }}
          />
        </div>
      );
    },
    cell: ({ row }) => {
      const transfer = row.original;
      // stopPropagation is essential: the whole row is a navigation target, so without it
      // ticking a checkbox would send the user to the detail screen instead (PAR033).
      if (isTransferSelectable(transfer)) {
        return (
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              aria-label={`${transfer.member_name}を選択`}
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
            />
          </div>
        );
      }
      if (isTransferExcluded(transfer)) {
        return (
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger render={<span className="inline-flex" />}>
                  <Checkbox checked={false} disabled aria-label="選択不可" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">除外理由のため個別対応が必要です</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      }
      // FIT365 is out of scope for automatic transfer — no checkbox at all, not a disabled one.
      return <span />;
    },
    enableSorting: false,
    enableHiding: false,
    meta: { className: 'w-[44px] text-center' },
  };

  const middleColumns: ColumnDef<TransferItem>[] = [
    {
      accessorKey: 'member_id',
      header: '会員ID',
      meta: { className: 'w-[100px]' },
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.member_id}</span>
      ),
    },
    {
      accessorKey: 'member_name',
      header: '会員名',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.member_name}</span>,
    },
    {
      accessorKey: 'brand',
      header: 'ブランド',
      meta: { className: 'w-[100px]' },
      cell: ({ row }) => <BrandBadge brand={row.original.brand as Brand} />,
    },
    {
      accessorKey: 'from_store_name',
      header: '移籍元店舗',
      cell: ({ row }) => <span className="text-xs">{row.original.from_store_name}</span>,
    },
    {
      accessorKey: 'to_store_name',
      header: '移籍先店舗',
      cell: ({ row }) => <span className="text-xs">{row.original.to_store_name}</span>,
    },
    {
      accessorKey: 'applied_at',
      header: '申請日',
      meta: { className: 'w-[100px]' },
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {formatDateYYYYMMDD(row.original.applied_at)}
        </span>
      ),
    },
    {
      accessorKey: 'scheduled_date',
      header: '移籍予定日',
      meta: { className: 'w-[100px]' },
      cell: ({ row }) => (
        <span className="text-xs">{formatDateYYYYMMDD(row.original.scheduled_date)}</span>
      ),
    },
    {
      id: 'auto_transfer',
      header: '自動移籍可否',
      meta: { className: 'w-[120px]' },
      enableSorting: false,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <TransferAutoBadge transfer={row.original} />
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      meta: { className: 'w-[130px]' },
      cell: ({ row }) => <TransferStatusBadge status={row.original.status} size="sm" />,
    },
  ];

  const actionsColumn: ColumnDef<TransferItem> = {
    id: 'actions',
    header: '',
    meta: { className: 'w-[56px]' },
    enableSorting: false,
    cell: ({ row }) => {
      const transfer = row.original;
      // A decided transfer has nothing left to approve or reject, so the trigger is absent
      // rather than present-but-empty.
      if (!isTransferPending(transfer.status)) return null;
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger className="hover:bg-muted flex size-8 items-center justify-center rounded-md">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">アクションを開く</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <RoleGatedMenuItem
                requiredPermission={Permission.MembersTransfersApprove}
                denyBadge="権限"
                tooltip={transfer.can_act ? undefined : 'この申請の担当店舗ではありません'}
                disabled={!transfer.can_act}
                onClick={() => onApproveClick(transfer)}
              >
                <CheckCircle className="size-4" />
                承認
              </RoleGatedMenuItem>
              <DropdownMenuSeparator />
              <RoleGatedMenuItem
                requiredPermission={Permission.MembersTransfersApprove}
                denyBadge="権限"
                tooltip={transfer.can_act ? undefined : 'この申請の担当店舗ではありません'}
                disabled={!transfer.can_act}
                className="text-destructive"
                onClick={() => onRejectClick(transfer)}
              >
                <XCircle className="size-4" />
                否認
              </RoleGatedMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  };

  return [
    ...(canApprove ? [selectColumn] : []),
    ...middleColumns,
    ...(canApprove ? [actionsColumn] : []),
  ];
}
