'use client';

import {
  TERMS_BRAND_LABELS,
  TERMS_STATUS_BADGE_CLASSES,
  TERMS_STATUS_LABELS,
} from '@/app/(private)/terms/_constants/constants';
import { formatDate } from '@/utils/format.util';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { TextWithTooltip } from '@/components/common/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { TermsListItemResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { UserRole } from '@/types/permission.type';

interface TermsColumnsProps {
  onEditClick?: (row: TermsListItemResponse) => void;
  onDeleteClick?: (row: TermsListItemResponse) => void;
}

export function termsColumns({
  onEditClick,
  onDeleteClick,
}: TermsColumnsProps = {}): ColumnDef<TermsListItemResponse>[] {
  return [
    {
      accessorKey: 'id',
      header: () => <span className="text-xs font-semibold">ID</span>,
      meta: { className: 'w-15' },
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
    },
    {
      accessorKey: 'title',
      header: () => <span className="text-xs font-semibold">規約名</span>,
      meta: { className: 'min-w-40' },
      cell: ({ row }) => (
        <TextWithTooltip text={row.original.title} className="max-w-70 text-sm font-medium" />
      ),
    },
    {
      accessorKey: 'version',
      header: () => <span className="text-xs font-semibold">現行バージョン</span>,
      meta: { className: 'w-25' },
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-[10px]">
          {row.original.version}
        </Badge>
      ),
    },
    {
      accessorKey: 'brandEnum',
      header: () => <span className="text-xs font-semibold">ブランド</span>,
      meta: { className: 'w-30' },
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">
          {TERMS_BRAND_LABELS[row.original.brandEnum]}
        </Badge>
      ),
    },
    {
      accessorKey: 'effectiveFrom',
      header: () => <span className="text-xs font-semibold">適用開始日</span>,
      meta: { className: 'w-30' },
      cell: ({ row }) => <span className="text-xs">{formatDate(row.original.effectiveFrom)}</span>,
    },
    {
      accessorKey: 'status',
      header: () => <span className="text-xs font-semibold">ステータス</span>,
      meta: { className: 'w-25' },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn('text-[10px]', TERMS_STATUS_BADGE_CLASSES[row.original.status])}
        >
          {TERMS_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => null,
      meta: { className: 'w-10' },
      cell: ({ row }) => {
        const item = row.original;

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
                allowedRoles={[UserRole.Headquarter, UserRole.System]}
                onClick={() => onEditClick?.(item)}
              >
                <Pencil className="size-4" />
                編集
              </RoleGatedMenuItem>
              <DropdownMenuSeparator />
              <RoleGatedMenuItem
                allowedRoles={[UserRole.Headquarter, UserRole.System]}
                className="text-destructive focus:text-destructive"
                onClick={() => onDeleteClick?.(item)}
              >
                <Trash2 className="size-4" />
                削除
              </RoleGatedMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
