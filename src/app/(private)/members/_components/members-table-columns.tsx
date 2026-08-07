'use client';

import { useRouter } from 'next/navigation';

import { formatDate } from '@/utils/format.util';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil } from 'lucide-react';

import { DataTableColumnCheckbox } from '@/components/common/data-table/data-table-column-checkbox';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { GetCrmMembersResponse } from '@/lib/api/types.gen';
import { MemberStatus } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { MEMBER_STATUS_CLASSES, MEMBER_STATUS_LABELS } from '../_constants/constants';

interface MembersTableColumnsProps {
  onMemberClick: (memberId: string) => void;
}

export function MembersTableColumns({
  onMemberClick,
}: MembersTableColumnsProps): ColumnDef<NonNullable<GetCrmMembersResponse['members']>[0]>[] {
  const router = useRouter();

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="w-[32px] px-2 py-2.5">
          <Checkbox
            aria-label="Select all"
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
          />
        </div>
      ),
      cell: ({ row }) => <DataTableColumnCheckbox row={row} />,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'member_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="会員ID" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.original.member_number || '-'}
        </span>
      ),
      meta: { label: '会員ID' },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="氏名" />,
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.name_kanji || '-'}</span>
      ),
      meta: { label: '氏名' },
    },
    {
      accessorKey: 'store_name',
      header: '店舗名',
      cell: ({ row }) => <span className="text-xs">{row.original.store_name || '-'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      cell: ({ row }) => {
        const status = row.original.status as MemberStatus | undefined;
        if (!status) return <span>-</span>;
        return (
          <Badge className={`border text-[10px] ${MEMBER_STATUS_CLASSES[status]}`}>
            <span className="mr-1 inline-block size-1.5 rounded-full bg-current" />
            {MEMBER_STATUS_LABELS[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'contract_name',
      header: '主契約名',
      cell: ({ row }) => <span className="text-xs">{row.original.contract_name || '-'}</span>,
    },
    {
      accessorKey: 'joined_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="入会日" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {formatDate(row.original.joined_at, '-')}
        </span>
      ),
      meta: { label: '入会日' },
    },
    {
      accessorKey: 'last_visit_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="最終来館日" />,
      cell: ({ row }) => (
        <span className="text-xs">{formatDate(row.original.last_visit_date, '-')}</span>
      ),
      meta: { label: '最終来館日' },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const memberId = row.original.id || '';
        if (!memberId) return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" />}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMemberClick(memberId);
                }}
              >
                <Eye className="mr-2 size-4" />
                詳細
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(navigate('/members/[id]/edit', memberId));
                }}
              >
                <Pencil className="mr-2 size-4" />
                編集
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableHiding: false,
    },
  ];
}
