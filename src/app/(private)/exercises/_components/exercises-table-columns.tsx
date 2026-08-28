'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

import type { GetCrmExercisesResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import {
  EXERCISE_CATEGORY_BADGE_CLASSES,
  EXERCISE_LEVEL_BADGE_CLASSES,
  EXERCISE_LEVEL_LABELS,
  EXERCISE_STATUS_BADGE_CLASSES,
  EXERCISE_STATUS_DOT_CLASSES,
  EXERCISE_STATUS_LABELS,
} from '../_constants/constants';
import { ExerciseRowActions } from './exercise-row-actions';

type ExerciseRow = NonNullable<GetCrmExercisesResponse>['items'][number];

interface ExercisesTableColumnsProps {
  onEdit: (id: string) => void;
  onTogglePublish: (row: ExerciseRow) => void;
  onDelete: (row: ExerciseRow) => void;
}

export function ExercisesTableColumns({
  onEdit,
  onTogglePublish,
  onDelete,
}: ExercisesTableColumnsProps): ColumnDef<ExerciseRow>[] {
  return [
    {
      accessorKey: 'nameJa',
      header: ({ column }) => <DataTableColumnHeader column={column} title="エクササイズ名" />,
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{row.original.nameJa}</p>
          <p className="text-muted-foreground font-mono text-[10px]">{row.original.exerciseCode}</p>
        </div>
      ),
    },
    {
      accessorKey: 'categoryName',
      header: () => <span className="text-xs font-semibold">カテゴリ</span>,
      cell: ({ row }) => (
        <Badge variant="outline" className={cn('text-[10px]', EXERCISE_CATEGORY_BADGE_CLASSES)}>
          {row.original.categoryName}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'primaryMuscleName',
      header: () => <span className="text-xs font-semibold">主働筋</span>,
      cell: ({ row }) => <span className="text-xs">{row.original.primaryMuscleName}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'toolName',
      header: () => <span className="text-xs font-semibold">器具種別</span>,
      cell: ({ row }) => <span className="text-xs">{row.original.toolName}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'level',
      header: () => <span className="text-xs font-semibold">レベル</span>,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn('text-[10px]', EXERCISE_LEVEL_BADGE_CLASSES[row.original.level])}
        >
          {EXERCISE_LEVEL_LABELS[row.original.level]}
        </Badge>
      ),
      enableSorting: false,
      meta: { className: 'w-[110px]' },
    },
    {
      accessorKey: 'publishStatus',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ステータス" />,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            'gap-1 text-[10px]',
            EXERCISE_STATUS_BADGE_CLASSES[row.original.publishStatus],
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              EXERCISE_STATUS_DOT_CLASSES[row.original.publishStatus],
            )}
          />
          {EXERCISE_STATUS_LABELS[row.original.publishStatus]}
        </Badge>
      ),
      meta: { className: 'w-[110px]' },
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="最終更新日" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {new Date(row.original.updatedAt).toLocaleDateString('ja-JP')}
        </span>
      ),
      meta: { className: 'w-[130px]' },
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <ExerciseRowActions
          row={row.original}
          onEdit={onEdit}
          onTogglePublish={onTogglePublish}
          onDelete={onDelete}
        />
      ),
      enableSorting: false,
      meta: { className: 'w-[48px]' },
    },
  ];
}
