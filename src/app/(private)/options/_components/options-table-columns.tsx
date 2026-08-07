'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Store, Trash2 } from 'lucide-react';

import { BrandBadge } from '@/components/common/brand-badge';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { GetCrmOptionsResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

import {
  OPTION_STATUS_BADGE_CLASSES,
  OPTION_STATUS_LABELS,
  OPTION_TYPE_BADGE_CLASSES,
  OPTION_TYPE_LABELS,
  OPTION_USAGE_RULE_LABELS,
} from '../_constants/constants';

type OptionRow = GetCrmOptionsResponse['options'][number];

interface OptionsTableColumnsProps {
  onEditClick?: (id: string) => void;
  onDeleteClick?: (option: OptionRow) => void;
}

function ActionsCell({
  option,
  onEditClick,
  onDeleteClick,
}: {
  option: OptionRow;
  onEditClick?: (id: string) => void;
  onDeleteClick?: (option: OptionRow) => void;
}) {
  const deleteBlockedReason =
    option.member_count > 0
      ? `利用会員が ${option.member_count.toLocaleString()} 名存在するため削除できません`
      : option.linked_contracts > 0
        ? `紐付け契約が ${option.linked_contracts} 件存在するため削除できません`
        : undefined;

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
          requiredPermission={Permission.OptionsEdit}
          onClick={(e) => {
            e.stopPropagation();
            onEditClick?.(option.id);
          }}
        >
          <Pencil className="size-4" />
          編集
        </RoleGatedMenuItem>
        <DropdownMenuSeparator />
        <RoleGatedMenuItem
          requiredPermission={Permission.OptionsDelete}
          className="text-destructive focus:text-destructive"
          disabled={Boolean(deleteBlockedReason)}
          tooltip={deleteBlockedReason}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick?.(option);
          }}
        >
          <Trash2 className="size-4" />
          削除
        </RoleGatedMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OptionsTableColumns({
  onEditClick,
  onDeleteClick,
}: OptionsTableColumnsProps): ColumnDef<OptionRow>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.id}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="オプション名" />,
      cell: ({ row }) => <span className="text-xs font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="コード" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'brand',
      header: () => <span className="text-xs font-semibold">ブランド</span>,
      cell: ({ row }) => <BrandBadge brand={row.original.brand} />,
    },
    {
      accessorKey: 'prorated_enabled',
      header: () => <span className="text-xs font-semibold">日割り</span>,
      cell: ({ row }) => {
        const { prorated_enabled, prorata_method } = row.original;
        if (!prorated_enabled) {
          return <span className="text-muted-foreground text-xs">－</span>;
        }
        const label = prorata_method === 'daily' ? '日割り計算' : '固定金額';
        return <span className="text-success text-xs">✓ {label}</span>;
      },
    },
    {
      accessorKey: 'option_type',
      header: () => <span className="text-xs font-semibold">種別</span>,
      cell: ({ row }) => {
        const type = row.original.option_type;
        return (
          <Badge variant="outline" className={cn('text-[10px]', OPTION_TYPE_BADGE_CLASSES[type])}>
            {OPTION_TYPE_LABELS[type]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'usage_rule',
      header: () => <span className="text-xs font-semibold">利用可否</span>,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {OPTION_USAGE_RULE_LABELS[row.original.usage_rule]}
        </span>
      ),
    },
    {
      accessorKey: 'price_including_tax',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="料金(税込)" className="justify-end" />
      ),
      cell: ({ row }) => (
        <span className="text-xs font-medium">
          ¥{row.original.price_including_tax.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'tax_rate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="税率" className="justify-end" />
      ),
      cell: ({ row }) => <span className="text-xs">{row.original.tax_rate}%</span>,
    },
    {
      accessorKey: 'member_count',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="利用会員数" className="justify-end" />
      ),
      cell: ({ row }) => (
        <span className="text-xs">{row.original.member_count.toLocaleString()}名</span>
      ),
    },
    {
      accessorKey: 'accounting_code',
      header: () => <span className="text-xs font-semibold">会計コード</span>,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.original.accounting_code}
        </span>
      ),
    },
    {
      accessorKey: 'store_name',
      header: () => <span className="text-xs font-semibold">店舗</span>,
      cell: ({ row }) => {
        const name = row.original.store_name;
        return (
          <div className="flex items-center gap-1">
            <Store className="text-muted-foreground size-3" />
            <span className="text-xs">{name ?? '全店舗'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="状態" />,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant="outline"
            className={cn('text-[10px]', OPTION_STATUS_BADGE_CLASSES[status])}
          >
            {OPTION_STATUS_LABELS[status]}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <ActionsCell
          option={row.original}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      ),
    },
  ];
}
