'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

import type { FranchiseCompanyListItem } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import {
  FRANCHISE_COMPANY_STATUS_BADGE_CLASSES,
  FRANCHISE_COMPANY_STATUS_LABELS,
  FRANCHISE_COMPANY_TYPE_BADGE_CLASSES,
  FRANCHISE_COMPANY_TYPE_LABELS,
} from '../_constants/constants';
import { FranchiseCompanyRowActions } from './franchise-company-row-actions';

interface FranchiseCompaniesTableColumnsProps {
  onDeleteClick?: (company: FranchiseCompanyListItem) => void;
}

export function FranchiseCompaniesTableColumns({
  onDeleteClick,
}: FranchiseCompaniesTableColumnsProps = {}): ColumnDef<FranchiseCompanyListItem>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="FC企業ID" />,
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
      meta: { className: 'w-[120px]' },
    },
    {
      accessorKey: 'display_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="法人名（表示名）" />,
      cell: ({ row }) => <span className="text-xs font-medium">{row.original.display_name}</span>,
      meta: { className: 'min-w-[280px]' },
    },
    {
      accessorKey: 'type',
      header: () => <span className="text-xs font-semibold">直営/FC区分</span>,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn('text-[10px]', FRANCHISE_COMPANY_TYPE_BADGE_CLASSES[row.original.type])}
        >
          {FRANCHISE_COMPANY_TYPE_LABELS[row.original.type]}
        </Badge>
      ),
      meta: { className: 'w-[120px]' },
      enableSorting: false,
    },
    {
      accessorKey: 'managed_store_count',
      header: () => <span className="text-right text-xs font-semibold">管轄店舗数</span>,
      cell: ({ row }) => (
        <span className="block text-right text-xs tabular-nums">
          {row.original.managed_store_count}
        </span>
      ),
      meta: { className: 'w-[120px]' },
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: () => <span className="text-xs font-semibold">ステータス</span>,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn('text-[10px]', FRANCHISE_COMPANY_STATUS_BADGE_CLASSES[row.original.status])}
        >
          {FRANCHISE_COMPANY_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
      meta: { className: 'w-[100px]' },
      enableSorting: false,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">操作</span>,
      cell: ({ row }) => (
        <FranchiseCompanyRowActions company={row.original} onDeleteClick={onDeleteClick} />
      ),
      meta: { className: 'w-10' },
      enableHiding: false,
      enableSorting: false,
    },
  ];
}
