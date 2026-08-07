import { VisitRow } from '@/app/api/_schemas/member.schema';
import { type ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { LogIn, LogOut } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

import { getAuthMethodLabel } from './auth-method-label';

export const VISIT_COLUMNS: ColumnDef<VisitRow>[] = [
  {
    accessorKey: 'entry_time',
    header: '日時',
    size: 200,
    cell: ({ row }) => (
      <span className="text-sm">
        {format(parseISO(row.original.entry_time), 'yyyy/MM/dd HH:mm')}
      </span>
    ),
  },
  {
    accessorKey: 'store_name',
    header: '店舗',
    cell: ({ row }) => <span className="text-sm">{row.original.store_name}</span>,
  },
  {
    id: 'type',
    header: '種別',
    cell: ({ row }) => {
      const isEntry = !row.original.exit_time;
      return (
        <Badge
          variant="outline"
          className={`gap-1 text-[10px] ${
            isEntry ? 'bg-info/15 text-info border-info/20' : 'text-muted-foreground border-muted'
          }`}
        >
          {isEntry ? <LogIn className="size-3" /> : <LogOut className="size-3" />}
          {isEntry ? '入館' : '退館'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'entry_method',
    header: '認証方法',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {getAuthMethodLabel(row.original.entry_method)}
      </span>
    ),
  },
];
