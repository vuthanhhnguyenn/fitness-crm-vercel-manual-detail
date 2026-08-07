'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { BrandBadge } from '@/components/common/brand-badge';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

import type { LessonContentItem } from '@/lib/api/types.gen';

import {
  LESSON_GENDER_RESTRICTION_CLASSES,
  LESSON_GENDER_RESTRICTION_LABELS,
  LESSON_PRICING_TYPE_LABELS,
  LESSON_STATUS_CLASSES,
  LESSON_STATUS_LABELS,
  type LessonGenderRestriction,
  type LessonPricingType,
  type LessonStatus,
} from '../_constants/constants';

export const lessonTableColumns: ColumnDef<LessonContentItem>[] = [
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="レッスン名" />,
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium">{row.original.name}</p>
        <p className="text-muted-foreground text-[11px]">{row.original.category}</p>
      </div>
    ),
  },
  {
    accessorKey: 'brand',
    header: ({ column }) => <DataTableColumnHeader column={column} title="ブランド" />,
    cell: ({ row }) => <BrandBadge brand={row.original.brand} />,
    meta: { className: 'w-[100px]' },
  },
  {
    accessorKey: 'duration',
    header: ({ column }) => <DataTableColumnHeader column={column} title="時間" />,
    cell: ({ row }) => <span className="text-xs">{row.original.duration}分</span>,
    meta: { className: 'w-[80px]' },
  },
  {
    accessorKey: 'pricing_type',
    header: '料金種別',
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs">
        {LESSON_PRICING_TYPE_LABELS[row.original.pricing_type as LessonPricingType]}
      </span>
    ),
    meta: { className: 'w-[100px]' },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="ステータス" />,
    cell: ({ row }) => {
      const status = row.original.status as LessonStatus;
      return (
        <Badge variant="outline" className={`text-[11px] ${LESSON_STATUS_CLASSES[status]}`}>
          {LESSON_STATUS_LABELS[status]}
        </Badge>
      );
    },
    meta: { className: 'w-[100px]' },
  },
  {
    accessorKey: 'gender_restriction',
    header: '性別制限',
    enableSorting: false,
    cell: ({ row }) => {
      const restriction = row.original.gender_restriction as LessonGenderRestriction;
      return (
        <span className={`text-xs font-medium ${LESSON_GENDER_RESTRICTION_CLASSES[restriction]}`}>
          {LESSON_GENDER_RESTRICTION_LABELS[restriction]}
        </span>
      );
    },
    meta: { className: 'w-[100px]' },
  },
];
