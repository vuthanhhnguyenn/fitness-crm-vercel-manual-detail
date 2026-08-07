'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Store, Trash2 } from 'lucide-react';

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

import type { GetCrmOptionDiscountsResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

import {
  OPTION_DISCOUNT_STATUS_BADGE_CLASSES,
  OPTION_DISCOUNT_STATUS_LABELS,
  OPTION_DISCOUNT_TYPE_BADGE_CLASSES,
  OPTION_DISCOUNT_TYPE_LABELS,
  formatOptionDiscountValue,
} from '../_constants/constants';

type OptionDiscountRow = GetCrmOptionDiscountsResponse['option_discounts'][number];

interface OptionsTableColumnsProps {
  onEditClick?: (id: string) => void;
  onDeleteClick?: (optionDiscount: OptionDiscountRow) => void;
}

function ActionsCell({
  optionDiscount,
  onEditClick,
  onDeleteClick,
}: {
  optionDiscount: OptionDiscountRow;
  onEditClick?: (id: string) => void;
  onDeleteClick?: (optionDiscount: OptionDiscountRow) => void;
}) {
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
          requiredPermission={Permission.OptionDiscountsEdit}
          onClick={(e) => {
            e.stopPropagation();
            onEditClick?.(optionDiscount.id);
          }}
        >
          <Pencil className="size-4" />
          編集
        </RoleGatedMenuItem>
        <DropdownMenuSeparator />
        <RoleGatedMenuItem
          requiredPermission={Permission.OptionDiscountsDelete}
          className="text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick?.(optionDiscount);
          }}
        >
          <Trash2 className="size-4" />
          削除
        </RoleGatedMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OptionDiscountTableColumns({
  onEditClick,
  onDeleteClick,
}: OptionsTableColumnsProps): ColumnDef<OptionDiscountRow>[] {
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="セット割名" />,
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
      accessorKey: 'target_contracts',
      header: () => <span className="text-xs font-semibold">対象契約</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.target_contracts.map((contract) => (
            <Badge key={contract} variant="outline" className="text-[10px]">
              {contract}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'target_options',
      header: () => <span className="text-xs font-semibold">対象オプション</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.target_options.map((option) => (
            <Badge key={option} variant="outline" className="text-[10px]">
              {option}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'discount_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="割引タイプ" />,
      cell: ({ row }) => {
        const type = row.original.discount_type;
        return (
          <Badge
            variant="outline"
            className={cn('text-[10px]', OPTION_DISCOUNT_TYPE_BADGE_CLASSES[type])}
          >
            {OPTION_DISCOUNT_TYPE_LABELS[type]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'discount_value',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="割引額" className="justify-end" />
      ),
      cell: ({ row }) => (
        <div className="text-right text-xs font-medium">
          {formatOptionDiscountValue(row.original.discount_type, row.original.discount_value)}
        </div>
      ),
    },
    {
      accessorKey: 'store_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="店舗" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Store className="text-muted-foreground size-3" />
          <span className="text-xs">{row.original.store_name ?? '全店舗'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'applied_count',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="適用数" className="justify-end" />
      ),
      cell: ({ row }) => (
        <div className="text-right text-xs">{row.original.applied_count.toLocaleString()}件</div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="状態" />,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant="outline"
            className={cn('text-[10px]', OPTION_DISCOUNT_STATUS_BADGE_CLASSES[status])}
          >
            {OPTION_DISCOUNT_STATUS_LABELS[status]}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: () => null,
      enableSorting: false,
      cell: ({ row }) => (
        <ActionsCell
          optionDiscount={row.original}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      ),
    },
  ];
}
