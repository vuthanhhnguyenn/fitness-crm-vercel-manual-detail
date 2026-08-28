'use client';

import { formatTime } from '@/utils/date.util';
import { formatDurationMinutes } from '@/utils/format.util';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import type { GetCrmEntryExitLogsHistoryResponse } from '@/lib/api/types.gen';

export type HistoryVisitRow = GetCrmEntryExitLogsHistoryResponse['history'][number];

const AUTH_METHOD_LABELS: Record<HistoryVisitRow['auth_method'], string> = {
  qr: 'QRコード',
  nfc: 'NFCカード',
};

const RESULT_LABELS: Record<HistoryVisitRow['result'], string> = {
  success: '成功',
  denied: '拒否',
};

/** FR-010: in-progress/denied visits never show a real exit time or stay duration. */
function ExitTimeCell({ row }: { row: HistoryVisitRow }) {
  if (row.visit_status === 'in_progress') {
    return <span className="text-success text-xs">在館中</span>;
  }
  return <span className="text-xs">{formatTime(row.exit_time)}</span>;
}

function StayDurationCell({ row }: { row: HistoryVisitRow }) {
  if (row.visit_status !== 'completed') {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  return <span className="text-xs">{formatDurationMinutes(row.stay_duration_minutes)}</span>;
}

export function entryExitHistoryTableColumns(): ColumnDef<HistoryVisitRow>[] {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="利用者" />,
      cell: ({ row }) => {
        const visit = row.original;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage src={visit.avatar_url ?? undefined} alt={visit.name} />
              <AvatarFallback className="text-xs">{visit.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs font-medium">{visit.name}</p>
              <p className="text-muted-foreground text-[10px]">{visit.furigana}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'member_id',
      accessorKey: 'member_id',
      header: '会員ID',
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.member_id}</span>
      ),
    },
    {
      id: 'visit_date',
      accessorKey: 'visit_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="日時" />,
      cell: ({ row }) => <span className="text-xs">{row.original.visit_date}</span>,
    },
    {
      id: 'entry_time',
      accessorKey: 'entry_time',
      header: ({ column }) => <DataTableColumnHeader column={column} title="入館時刻" />,
      cell: ({ row }) => <span className="text-xs">{formatTime(row.original.entry_time)}</span>,
    },
    {
      id: 'exit_time',
      accessorKey: 'exit_time',
      header: ({ column }) => <DataTableColumnHeader column={column} title="退館時刻" />,
      cell: ({ row }) => <ExitTimeCell row={row.original} />,
    },
    {
      id: 'stay_duration_minutes',
      header: '在館時間',
      cell: ({ row }) => <StayDurationCell row={row.original} />,
    },
    {
      id: 'contract_name',
      accessorKey: 'contract_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="契約種別" />,
      cell: ({ row }) => (
        <p
          className="line-clamp-2 max-w-[160px] text-xs leading-tight"
          title={row.original.contract_name}
        >
          {row.original.contract_name}
        </p>
      ),
      meta: { className: 'max-w-[160px]' },
    },
    {
      id: 'gender',
      header: '性別',
      cell: ({ row }) => {
        const gender = row.original.gender;
        const label = gender === 'male' ? '男性' : gender === 'female' ? '女性' : 'その他';
        return <span className="text-xs">{label}</span>;
      },
    },
    {
      id: 'home_store_name',
      header: '所属店舗',
      cell: ({ row }) => <span className="text-xs">{row.original.home_store_name}</span>,
    },
    {
      id: 'visit_store_name',
      header: '入館店舗',
      cell: ({ row }) => <span className="text-xs">{row.original.visit_store_name}</span>,
    },
    {
      id: 'auth_method',
      header: '認証方式',
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-[10px] font-normal">
          {AUTH_METHOD_LABELS[row.original.auth_method]}
        </Badge>
      ),
    },
    {
      id: 'result',
      header: '処理結果',
      cell: ({ row }) => {
        const isSuccess = row.original.result === 'success';
        return (
          <Badge
            variant="outline"
            className={
              isSuccess
                ? 'bg-success/15 text-success border-success/20 text-[10px]'
                : 'bg-destructive/15 text-destructive border-destructive/20 text-[10px]'
            }
          >
            {RESULT_LABELS[row.original.result]}
          </Badge>
        );
      },
    },
  ];
}
