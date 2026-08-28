'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { BrandBadge } from '@/components/common/brand-badge';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { DataTableRowActions } from '@/components/common/data-table/data-table-row-action';
import { Badge } from '@/components/ui/badge';

import type { ArticleCategoryItemResponse } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import {
  ARTICLE_CATEGORY_TYPE_BADGE_CLASSES,
  ARTICLE_CATEGORY_TYPE_LABELS,
  PUBLISH_STATUS_BADGE_CLASSES,
  PUBLISH_STATUS_LABELS,
} from '../_constants/article-category.constants';

interface ArticleCategoryTableColumnsProps {
  onEditClick?: (id: string) => void;
  onDeleteClick?: (category: ArticleCategoryItemResponse) => void;
}

export function ArticleCategoryTableColumns({
  onEditClick,
  onDeleteClick,
}: ArticleCategoryTableColumnsProps): ColumnDef<ArticleCategoryItemResponse>[] {
  return [
    {
      accessorKey: 'id',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">ID</span>,
      meta: { className: 'w-[100px]' },
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="カテゴリ名" />,
      meta: { className: 'min-w-[180px]' },
      cell: ({ row }) => <span className="text-xs font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'description',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">説明</span>,
      meta: { className: 'min-w-[200px]' },
      cell: ({ row }) => (
        <span className="text-muted-foreground block max-w-50 truncate text-xs">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: 'type',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">種別</span>,
      meta: { className: 'w-[90px]' },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-[10px] ${ARTICLE_CATEGORY_TYPE_BADGE_CLASSES[row.original.type]}`}
        >
          {ARTICLE_CATEGORY_TYPE_LABELS[row.original.type]}
        </Badge>
      ),
    },
    {
      id: 'brand',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">ブランド</span>,
      meta: { className: 'w-[140px]' },
      cell: ({ row }) => (
        <BrandBadge key={`${row.original.brandEnum}`} brand={row.original.brandEnum} />
      ),
    },
    {
      accessorKey: 'order',
      header: ({ column }) => <DataTableColumnHeader column={column} title="表示順" />,
      meta: { className: 'w-[60px] text-center' },
      cell: ({ row }) => (
        <span className="text-muted-foreground text-center text-xs">{row.original.order}</span>
      ),
    },
    {
      accessorKey: 'articleCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="記事数" />,
      meta: { className: 'w-[80px]' },
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.articleCount}件</span>
      ),
    },
    {
      accessorKey: 'isPublic',
      enableSorting: false,
      header: () => <span className="text-xs font-semibold">公開状況</span>,
      meta: { className: 'w-[80px]' },
      cell: ({ row }) => {
        const key = String(row.original.isPublic) as 'true' | 'false';
        return (
          <Badge variant="outline" className={`text-[10px] ${PUBLISH_STATUS_BADGE_CLASSES[key]}`}>
            {PUBLISH_STATUS_LABELS[key]}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      enableSorting: false,
      header: () => null,
      meta: { className: 'w-10' },
      cell: ({ row }) => (
        <DataTableRowActions
          row={row.original}
          actions={['edit', 'delete']}
          permissions={{
            edit: Permission.ArticleCategoriesEdit,
            delete: Permission.ArticleCategoriesDelete,
          }}
          handlers={{
            edit: (category) => {
              onEditClick?.(category.id);
            },
            delete: (category) => {
              onDeleteClick?.(category);
            },
          }}
        />
      ),
    },
  ];
}
