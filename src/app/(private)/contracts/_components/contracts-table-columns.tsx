'use client';
import { useRouter } from 'next/navigation';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Store } from 'lucide-react';

import { BrandBadge } from '@/components/common/brand-badge';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { Brand, GetCrmMainContractsResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import {
  MAIN_CONTRACT_OTHER_STORE_USAGE_LABELS,
  MAIN_CONTRACT_STATUS_BADGE_CLASSES,
  MAIN_CONTRACT_STATUS_LABELS,
  MAIN_CONTRACT_TYPE_BADGE_CLASSES,
  MAIN_CONTRACT_TYPE_LABELS,
} from '../_constants/constants';
import { getContractEditState } from '../_utils/contract-action-state';

type MainContractRow = GetCrmMainContractsResponse['main_contracts'][number];

function formatYen(value: number): string {
  return `¥${value.toLocaleString()}`;
}

export function useContractsTableColumns(): ColumnDef<MainContractRow>[] {
  const router = useRouter();
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
      meta: {
        className: 'min-w-[86px]',
      },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="主契約名" />,
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.name}</span>,
      meta: {
        className: 'min-w-[220px]',
      },
    },
    {
      accessorKey: 'code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="コード" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.code}</span>
      ),
      meta: {
        className: 'min-w-[110px]',
      },
    },
    {
      accessorKey: 'old_code',
      header: '旧コード',
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.original.old_code ?? '―'}
        </span>
      ),
      meta: {
        className: 'min-w-[110px]',
      },
      enableSorting: false,
    },
    {
      accessorKey: 'contract_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="契約タイプ" />,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-[10px] ${MAIN_CONTRACT_TYPE_BADGE_CLASSES[row.original.contract_type]}`}
        >
          {MAIN_CONTRACT_TYPE_LABELS[row.original.contract_type]}
        </Badge>
      ),
      meta: {
        className: 'min-w-[120px]',
      },
    },
    {
      accessorKey: 'brand',
      header: 'ブランド',
      cell: ({ row }) => <BrandBadge brand={row.original.brand as Brand} />,
      meta: {
        className: 'min-w-[110px]',
      },
    },
    {
      accessorKey: 'parent_contract_name',
      header: '親主契約',
      cell: ({ row }) =>
        row.original.parent_contract_name ? (
          <span className="flex items-center gap-1 pl-6 text-xs font-medium">
            <span className="text-muted-foreground">└</span>
            {row.original.parent_contract_name}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">―</span>
        ),
      meta: {
        className: 'min-w-[180px]',
      },
      enableSorting: false,
    },
    {
      accessorKey: 'start_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="利用開始日" />,
      cell: ({ row }) => (
        <span className="text-xs">{formatDateYYYYMMDD(row.original.start_date)}</span>
      ),
      meta: {
        className: 'min-w-[110px]',
      },
    },
    {
      accessorKey: 'price_including_tax',
      header: ({ column }) => <DataTableColumnHeader column={column} title="料金(税込)" />,
      cell: ({ row }) => (
        <span className="block text-right text-xs font-medium">
          {formatYen(row.original.price_including_tax)}
        </span>
      ),
      meta: {
        className: 'min-w-[120px] text-right',
      },
    },
    {
      accessorKey: 'suspension_fee',
      header: ({ column }) => <DataTableColumnHeader column={column} title="休会時請求額" />,
      cell: ({ row }) => (
        <span className="block text-right text-xs">
          {row.original.suspension_fee > 0 ? formatYen(row.original.suspension_fee) : '―'}
        </span>
      ),
      meta: {
        className: 'min-w-[130px] text-right',
      },
    },
    {
      accessorKey: 'monthly_limit',
      header: ({ column }) => <DataTableColumnHeader column={column} title="回数上限" />,
      cell: ({ row }) => (
        <span className="block text-right text-xs">
          {row.original.monthly_limit !== null && row.original.monthly_limit !== undefined
            ? `${row.original.monthly_limit}回`
            : '―'}
        </span>
      ),
      meta: {
        className: 'min-w-[90px] text-right',
      },
    },
    {
      accessorKey: 'tax_rate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="税率" />,
      cell: ({ row }) => <span className="block text-right text-xs">{row.original.tax_rate}%</span>,
      meta: {
        className: 'min-w-[72px] text-right',
      },
    },
    {
      accessorKey: 'suspendable_months',
      header: '休会可能月',
      cell: ({ row }) => <span className="text-xs">{row.original.suspendable_months}</span>,
      meta: {
        className: 'min-w-[100px]',
      },
      enableSorting: false,
    },
    {
      accessorKey: 'cancellable_months',
      header: '退会可能月',
      cell: ({ row }) => <span className="text-xs">{row.original.cancellable_months}</span>,
      meta: {
        className: 'min-w-[100px]',
      },
      enableSorting: false,
    },
    {
      accessorKey: 'active_contracts',
      header: ({ column }) => <DataTableColumnHeader column={column} title="有効契約" />,
      cell: ({ row }) => (
        <span
          className={`block text-right text-xs${
            row.original.status !== 'active' && row.original.active_contracts > 0
              ? 'text-warning'
              : ''
          }`}
        >
          {row.original.active_contracts?.toLocaleString()}
        </span>
      ),
      meta: {
        className: 'min-w-[100px] text-right',
      },
    },
    {
      accessorKey: 'other_store_usage',
      header: '他店舗利用',
      cell: ({ row }) => (
        <span className="text-xs">
          {MAIN_CONTRACT_OTHER_STORE_USAGE_LABELS[row.original.other_store_usage]}
        </span>
      ),
      meta: {
        className: 'min-w-[95px]',
      },
      enableSorting: false,
    },
    {
      accessorKey: 'companion_benefit_enabled',
      header: '同伴特典',
      cell: ({ row }) =>
        row.original.companion_benefit_enabled ? (
          <Badge
            variant="outline"
            className="bg-success/15 text-success border-success/20 text-[10px]"
          >
            あり
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">―</span>
        ),
      meta: {
        className: 'min-w-[90px]',
      },
      enableSorting: false,
    },
    {
      accessorKey: 'enabled_stores',
      header: ({ column }) => <DataTableColumnHeader column={column} title="店舗" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Store className="text-muted-foreground size-3" />
          <span
            className={`text-xs${row.original.enabled_stores === 0 ? 'text-muted-foreground' : ''}`}
          >
            {row.original.enabled_stores}/{row.original.total_stores} 店舗
          </span>
        </div>
      ),
      meta: {
        className: 'min-w-[105px]',
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="状態" />,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-[10px] ${MAIN_CONTRACT_STATUS_BADGE_CLASSES[row.original.status]}`}
        >
          {MAIN_CONTRACT_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
      meta: {
        className: 'min-w-[88px]',
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const contractId = row.original.id || '';
        const { canEdit, editBlockedMessage } = getContractEditState(row.original);
        if (!contractId) return null;
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
                requiredPermission={Permission.ContractsEdit}
                disabled={!canEdit}
                tooltip={editBlockedMessage}
                onClick={() => {
                  router.push(navigate('/contracts/[id]/edit', contractId));
                }}
              >
                <Pencil className="size-4" />
                編集
              </RoleGatedMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      meta: {
        className: 'w-10',
      },
    },
  ];
}
