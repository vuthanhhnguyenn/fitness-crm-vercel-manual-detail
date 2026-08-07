'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

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

import type { GetCrmSurveysResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

import {
  SURVEY_STATUS_BADGE_CLASSES,
  SURVEY_STATUS_LABELS,
  SURVEY_TYPE_BADGE_CLASSES,
  SURVEY_TYPE_LABELS,
} from '../_constants/constants';
import { SurveyTriggerBadge } from './survey-trigger-badge';

type SurveyRow = GetCrmSurveysResponse['surveys'][number];

interface SurveysTableColumnsProps {
  onEditClick?: (id: string) => void;
  onDeleteClick?: (survey: SurveyRow) => void;
}

function ActionsCell({
  survey,
  onEditClick,
  onDeleteClick,
}: {
  survey: SurveyRow;
  onEditClick?: (id: string) => void;
  onDeleteClick?: (survey: SurveyRow) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" />}
        onClick={(event) => event.stopPropagation()}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <RoleGatedMenuItem
          requiredPermission={Permission.SurveysEdit}
          onClick={(event) => {
            event.stopPropagation();
            onEditClick?.(survey.id);
          }}
        >
          <Pencil className="size-4" />
          編集
        </RoleGatedMenuItem>
        <DropdownMenuSeparator />
        <RoleGatedMenuItem
          requiredPermission={Permission.SurveysDelete}
          className="text-destructive focus:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            onDeleteClick?.(survey);
          }}
        >
          <Trash2 className="size-4" />
          削除
        </RoleGatedMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SurveysTableColumns({
  onEditClick,
  onDeleteClick,
}: SurveysTableColumnsProps): ColumnDef<SurveyRow>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      meta: { className: 'w-[88px]' },
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.id}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="アンケート名" />,
      meta: { className: 'min-w-[220px]' },
      cell: ({ row }) => <span className="text-xs font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="種別" />,
      meta: { className: 'w-[120px]' },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn('text-[10px]', SURVEY_TYPE_BADGE_CLASSES[row.original.type])}
        >
          {SURVEY_TYPE_LABELS[row.original.type]}
        </Badge>
      ),
    },
    {
      accessorKey: 'trigger',
      enableSorting: false,
      header: ({ column }) => <DataTableColumnHeader column={column} title="発動トリガー" />,
      meta: { className: 'w-[132px]' },
      cell: ({ row }) => <SurveyTriggerBadge trigger={row.original.trigger} />,
    },
    {
      accessorKey: 'brand',
      enableSorting: false,
      header: ({ column }) => <DataTableColumnHeader column={column} title="ブランド" />,
      meta: { className: 'w-[110px]' },
      cell: ({ row }) => <BrandBadge brand={row.original.brand} />,
    },
    {
      accessorKey: 'question_count',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="設問数" className="justify-end" />
      ),
      meta: { className: 'w-[84px] text-right' },
      cell: ({ row }) => (
        <span className="inline-block w-full text-right text-xs">
          {row.original.question_count}問
        </span>
      ),
    },
    {
      accessorKey: 'response_count',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="回答件数" className="justify-end" />
      ),
      meta: { className: 'w-[104px] text-right' },
      cell: ({ row }) => (
        <span className="inline-block w-full text-right text-xs">
          {row.original.response_count.toLocaleString()}件
        </span>
      ),
    },
    {
      accessorKey: 'response_rate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="回答率" className="justify-end" />
      ),
      meta: { className: 'w-[90px] text-right' },
      cell: ({ row }) => (
        <span className="inline-block w-full text-right text-xs">
          {row.original.response_rate.toFixed(1)}%
        </span>
      ),
    },
    {
      accessorKey: 'last_response_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="最終回答日" />,
      meta: { className: 'w-[120px]' },
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.last_response_date ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="状態" />,
      meta: { className: 'w-[92px]' },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn('text-[10px]', SURVEY_STATUS_BADGE_CLASSES[row.original.status])}
        >
          {SURVEY_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => null,
      meta: { className: 'w-[52px]' },
      cell: ({ row }) => (
        <ActionsCell
          survey={row.original}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      ),
    },
  ];
}
