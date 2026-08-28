'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { DataTableRowActions } from '@/components/common/data-table/data-table-row-action';

import type { GetCrmBrandsResponse } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

export type BrandListItem = GetCrmBrandsResponse['brands'][number];

interface BrandTableColumnsProps {
  onEditClick: (brand: BrandListItem) => void;
}

export function BrandTableColumns({
  onEditClick,
}: BrandTableColumnsProps): ColumnDef<BrandListItem>[] {
  return [
    {
      accessorKey: 'brand_id',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">ブランドID</span>,
      meta: { className: 'w-[140px]' },
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-500">{row.original.brand_id}</span>
      ),
    },
    {
      accessorKey: 'display_name',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">ブランド名</span>,
      cell: ({ row }) => (
        <span className="truncate text-xs font-medium" title={row.original.display_name}>
          {row.original.display_name}
        </span>
      ),
    },
    {
      id: 'actions',
      enableSorting: false,
      header: () => null,
      meta: { className: 'w-10' },
      cell: ({ row }) => (
        <DataTableRowActions
          row={row.original}
          actions={['edit']}
          permissions={{ edit: Permission.BrandsEdit }}
          handlers={{ edit: onEditClick }}
        />
      ),
    },
  ];
}
