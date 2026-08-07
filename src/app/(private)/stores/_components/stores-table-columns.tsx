'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Check, MoreHorizontal, Pencil } from 'lucide-react';

import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { GetCrmStoresResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

import {
  STORE_AREA_LABELS,
  STORE_BRAND_BADGE_CLASSES,
  STORE_BRAND_LABELS,
  STORE_STATUS_BADGE_CLASSES,
  STORE_STATUS_LABELS,
  type StoreListBrand,
  type StoreListStatus,
} from '../_constants/constants';

type StoreRow = GetCrmStoresResponse['stores'][number];

interface StoresTableColumnsProps {
  onEditClick?: (storeId: string) => void;
}

function ActionsCell({
  storeId,
  onEditClick,
}: {
  storeId: string;
  onEditClick?: (storeId: string) => void;
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
          requiredPermission={Permission.StoresEdit}
          onClick={(e) => {
            e.stopPropagation();
            onEditClick?.(storeId);
          }}
        >
          <Pencil className="size-4" />
          編集
        </RoleGatedMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StoresTableColumns({
  onEditClick,
}: StoresTableColumnsProps): ColumnDef<StoreRow>[] {
  return [
    {
      accessorKey: 'store_id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="店舗ID" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.store_id}</span>,
      meta: { label: '店舗ID' },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="店舗名" />,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      meta: { label: '店舗名' },
    },
    {
      accessorKey: 'brand',
      header: 'ブランド',
      cell: ({ row }) => {
        const brand = row.original.brand as StoreListBrand;
        return (
          <Badge variant="outline" className={cn(STORE_BRAND_BADGE_CLASSES[brand], 'text-[10px]')}>
            {STORE_BRAND_LABELS[brand]}
          </Badge>
        );
      },
      meta: { label: 'ブランド' },
    },
    {
      accessorKey: 'area',
      header: 'エリア',
      cell: ({ row }) => (
        <span>{row.original.area != null ? STORE_AREA_LABELS[row.original.area] : '—'}</span>
      ),
      meta: { label: 'エリア' },
    },
    {
      accessorKey: 'club_code',
      header: 'クラブコード',
      cell: ({ row }) => <span>{row.original.club_code ?? '—'}</span>,
      meta: { label: 'クラブコード' },
    },
    {
      accessorKey: 'operating_company_name',
      header: '運営企業',
      cell: ({ row }) => (
        <span className="max-w-[14rem] truncate" title={row.original.operating_company_name}>
          {row.original.operating_company_name}
        </span>
      ),
      meta: { label: '運営企業' },
    },
    {
      id: 'is_fc',
      header: 'FC',
      cell: ({ row }) =>
        row.original.fc_company_id !== null && (
          <Check className="size-4 text-emerald-600" aria-label="FC" />
        ),
      meta: { label: 'FC' },
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      cell: ({ row }) => {
        const status = row.original.status as StoreListStatus;
        return (
          <Badge
            variant="outline"
            className={cn(STORE_STATUS_BADGE_CLASSES[status], 'text-[10px]')}
          >
            {STORE_STATUS_LABELS[status]}
          </Badge>
        );
      },
      meta: { label: 'ステータス' },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <ActionsCell storeId={row.original.id} onEditClick={onEditClick} />,
      enableHiding: false,
    },
  ];
}
