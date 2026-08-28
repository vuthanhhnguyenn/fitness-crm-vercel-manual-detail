'use client';

import Link from 'next/link';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';

import type { GetCrmBlacklistResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  BLACKLIST_SOURCE_LABEL,
  getBlacklistSourceBadgeClass,
} from '../_constants/blacklist.constants';

type BlacklistRow = NonNullable<GetCrmBlacklistResponse['blacklist']>[number];

/**
 * FR-006 — six columns. V0 renders a seventh, 照合結果, which is **not** built: the
 * contract's `matchResult` is an FR-024 (Could) placeholder that is null at v0.4, and the
 * client confirmed on 2026-07-29 that the column stays hidden (spec Q-01).
 */
export function BlacklistTableColumns(): ColumnDef<BlacklistRow>[] {
  return [
    {
      accessorKey: 'member_number',
      header: '会員ID',
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.original.member_number}
        </span>
      ),
    },
    {
      accessorKey: 'member_name',
      header: '氏名',
      cell: ({ row }) => (
        /**
         * FR-008 — the name is its own link to the member detail. `stopPropagation` keeps
         * the row's own navigation (to the blacklist detail) from firing as well, so the
         * two destinations stay distinguishable.
         */
        <Link
          href={navigate('/members/[id]', row.original.member_id)}
          className="text-sm font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.member_name}
        </Link>
      ),
    },
    {
      accessorKey: 'store_name',
      header: '店舗名',
      // FR-009 — a member with no primary store shows a dash, not an empty cell.
      cell: ({ row }) => <span className="text-xs">{row.original.store_name ?? '—'}</span>,
    },
    {
      accessorKey: 'source',
      header: '登録理由',
      cell: ({ row }) => {
        // The registration-path axis. The stored reason categories are never shown (FR-043a).
        const source = row.original.source;
        return (
          <Badge
            variant="outline"
            className={`text-[10px] ${getBlacklistSourceBadgeClass(source)}`}
          >
            {BLACKLIST_SOURCE_LABEL[source]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'unpaid_amount',
      header: () => <div className="text-right">未納金額</div>,
      cell: ({ row }) => {
        const amount = row.original.unpaid_amount;
        return (
          <div
            className={`text-right text-xs ${
              amount > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'
            }`}
          >
            ¥{amount.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'registered_at',
      header: '登録日',
      cell: ({ row }) => (
        <span className="text-xs">{formatDateYYYYMMDD(row.original.registered_at)}</span>
      ),
    },
  ];
}
