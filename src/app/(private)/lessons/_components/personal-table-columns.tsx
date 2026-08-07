'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

import type { PersonalPlanItem } from '@/lib/api/types.gen';

import { PERSONAL_CATEGORY_CLASSES } from '../_constants/constants';

export const personalTableColumns: ColumnDef<PersonalPlanItem>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground font-mono text-xs">{row.original.id}</span>
    ),
    meta: { className: 'w-[100px]' },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="プラン名" />,
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium">{row.original.name}</p>
        {row.original.description ? (
          <p className="text-muted-foreground text-[11px]">{row.original.description}</p>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: 'category',
    header: ({ column }) => <DataTableColumnHeader column={column} title="プラン区分" />,
    cell: ({ row }) => {
      const category = row.original.category;
      const className =
        PERSONAL_CATEGORY_CLASSES[category] ?? 'bg-muted text-muted-foreground border-border';
      return (
        <Badge variant="outline" className={`text-[11px] ${className}`}>
          {category}
        </Badge>
      );
    },
    meta: { className: 'w-[140px]' },
  },
  {
    accessorKey: 'duration',
    header: ({ column }) => <DataTableColumnHeader column={column} title="所要時間" />,
    cell: ({ row }) => <span className="text-xs">{row.original.duration}分</span>,
    meta: { className: 'w-[100px]' },
  },
  {
    accessorKey: 'price',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="料金" className="justify-end" />
    ),
    cell: ({ row }) => (
      <span className="block text-right text-xs font-medium">
        ¥{row.original.price.toLocaleString()}
      </span>
    ),
    meta: { className: 'w-[120px] text-right' },
  },
];
