'use client';

import { useRouter } from 'next/navigation';

import type { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';

import { Badge } from '@/components/ui/badge';

import type { GetCrmBlacklistResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  BLACKLIST_REGISTRATION_SOURCE_LABEL,
  getRegistrationSourceBadgeClass,
} from '../_constants/blacklist.constants';

type BlacklistRow = NonNullable<GetCrmBlacklistResponse['blacklist']>[number];

export function BlacklistTableColumns(): ColumnDef<BlacklistRow>[] {
  const router = useRouter();

  return [
    {
      accessorKey: 'memberId',
      header: '会員ID',
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.memberId}</span>
      ),
    },
    {
      accessorKey: 'memberName',
      header: '氏名',
      cell: ({ row }) => (
        <span
          className="cursor-pointer text-sm font-medium hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            router.push(navigate('/members/[id]', row.original.memberId));
          }}
        >
          {row.original.memberName}
        </span>
      ),
    },
    {
      accessorKey: 'storeName',
      header: '店舗名',
      cell: ({ row }) => <span className="text-xs">{row.original.storeName}</span>,
    },
    {
      accessorKey: 'registrationSource',
      header: '登録理由',
      cell: ({ row }) => {
        const source = row.original.registrationSource;
        return (
          <Badge
            variant="outline"
            className={`text-[10px] ${getRegistrationSourceBadgeClass(source)}`}
          >
            {BLACKLIST_REGISTRATION_SOURCE_LABEL[source]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'unpaidAmount',
      header: () => <div className="text-right">未納金額</div>,
      cell: ({ row }) => {
        const amount = row.original.unpaidAmount;
        return (
          <div
            className={`text-right text-xs font-medium ${
              amount > 0 ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            ¥{amount.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'registeredAt',
      header: '登録日',
      cell: ({ row }) => (
        <span className="text-xs">{format(parseISO(row.original.registeredAt), 'yyyy/MM/dd')}</span>
      ),
    },
  ];
}
