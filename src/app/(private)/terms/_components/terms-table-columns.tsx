import { formatDateYYYYMMDD } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { GetCrmTermsResponse } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { TERMS_STATUS_LABELS } from '../_constants/constants';

export type TermsListItem = GetCrmTermsResponse['items'][number];

interface TermsTableColumnsOptions {
  onEditClick: (termId: string) => void;
  onDeleteClick: (term: TermsListItem) => void;
}

function getStatusBadgeClass(status: TermsListItem['status']) {
  switch (status) {
    case 'published':
      return 'bg-success/15 text-success border-success/20';
    case 'expired':
      return 'border-border bg-muted text-muted-foreground';
    case 'draft':
      return 'bg-warning/15 text-warning border-warning/20';
  }
}

function TermsActionsCell({
  term,
  onEditClick,
  onDeleteClick,
}: Readonly<
  TermsTableColumnsOptions & {
    term: TermsListItem;
  }
>) {
  return (
    <div
      className="flex justify-end"
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="操作メニュー"
          className="hover:bg-muted flex size-8 items-center justify-center rounded-md"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <RoleGatedMenuItem
            requiredPermission={Permission.TermsEdit}
            onClick={() => onEditClick(term.id)}
          >
            <Pencil className="size-4" />
            編集
          </RoleGatedMenuItem>
          {!term.isDeleted ? (
            <>
              <DropdownMenuSeparator />
              <RoleGatedMenuItem
                requiredPermission={Permission.TermsDelete}
                className="text-destructive"
                onClick={() => onDeleteClick(term)}
              >
                <Trash2 className="size-4" />
                削除
              </RoleGatedMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function getTermsTableColumns({
  onEditClick,
  onDeleteClick,
}: TermsTableColumnsOptions): ColumnDef<TermsListItem>[] {
  return [
    {
      accessorKey: 'id',
      header: () => <span className="text-xs font-semibold">ID</span>,
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
      meta: { className: 'w-[60px]' },
    },
    {
      accessorKey: 'title',
      header: () => <span className="text-xs font-semibold">規約名</span>,
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.title}</span>,
      meta: { className: 'min-w-[160px]' },
    },
    {
      accessorKey: 'version',
      header: () => <span className="text-xs font-semibold">現行バージョン</span>,
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-[10px]">
          {row.original.version}
        </Badge>
      ),
      meta: { className: 'w-[100px]' },
    },
    {
      accessorKey: 'brandEnum',
      header: () => <span className="text-xs font-semibold">ブランド</span>,
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">
          {row.original.brandEnum}
        </Badge>
      ),
      meta: { className: 'w-[160px]' },
    },
    {
      accessorKey: 'effectiveFrom',
      header: () => <span className="text-xs font-semibold">適用開始日</span>,
      cell: ({ row }) => (
        <span className="text-xs">{formatDateYYYYMMDD(row.original.effectiveFrom, '-')}</span>
      ),
      meta: { className: 'w-[120px]' },
    },
    {
      accessorKey: 'status',
      header: () => <span className="text-xs font-semibold">ステータス</span>,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-[10px] ${getStatusBadgeClass(row.original.status)}`}
        >
          {TERMS_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
      meta: { className: 'w-[100px]' },
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <TermsActionsCell
          term={row.original}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      ),
      meta: { className: 'w-10' },
    },
  ];
}
