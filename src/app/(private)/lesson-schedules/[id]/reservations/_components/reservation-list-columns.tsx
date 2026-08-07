'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Check, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { Reservation } from '@/lib/api/types.gen';

import { MemberLimitedProfilePopover } from './member-limited-profile-popover';

export function ReservationStatusBadge({ status }: { status: Reservation['status'] }) {
  switch (status) {
    case 'confirmed':
      return (
        <Badge variant="outline" className="bg-info/10 text-info border-info/20 text-[10px]">
          予約済
        </Badge>
      );
    case 'tentative':
      return (
        <Badge
          variant="outline"
          className="bg-warning/10 text-warning border-warning/20 text-[10px]"
        >
          仮予約
        </Badge>
      );
    case 'attended':
      return (
        <Badge
          variant="outline"
          className="bg-success/10 text-success border-success/20 text-[10px]"
        >
          出席確認済
        </Badge>
      );
    case 'no_show':
      return (
        <Badge
          variant="outline"
          className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
        >
          無断キャンセル
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge
          variant="outline"
          className="bg-muted text-muted-foreground border-border text-[10px]"
        >
          キャンセル済
        </Badge>
      );
    default:
      return null;
  }
}

interface ReservationListColumnsOptions {
  onAttendanceChange: (reservationId: string, status: Reservation['attendance_status']) => void;
  onCancelReservation: (reservation: Reservation) => void;
  /** FR-009 — whether the current role may change attendance status */
  canManageAttendance: boolean;
  /** FR-008 — whether the current role may cancel a reservation */
  canManageReservation: boolean;
}

function AttendanceLabel({ status }: { status: Reservation['attendance_status'] }) {
  if (status === 'confirmed') {
    return (
      <span className="text-success inline-flex items-center gap-1 text-[10px]">
        <Check className="size-3" />
        出席
      </span>
    );
  }
  if (status === 'no_show') {
    return (
      <span className="text-destructive inline-flex items-center gap-1 text-[10px]">
        <X className="size-3" />
        無断欠席
      </span>
    );
  }
  return <span className="text-muted-foreground text-[10px]">未確認</span>;
}

export function getReservationListColumns({
  onAttendanceChange,
  onCancelReservation,
  canManageAttendance,
  canManageReservation,
}: ReservationListColumnsOptions): ColumnDef<Reservation>[] {
  return [
    {
      id: 'sequence',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="h-auto gap-1 p-0 text-xs font-semibold hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          No.
          <ArrowUpDown className="text-muted-foreground size-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.index + 1}</span>,
    },
    {
      accessorKey: 'member_name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="h-auto gap-1 p-0 text-xs font-semibold hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          会員名
          <ArrowUpDown className="text-muted-foreground size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const reservation = row.original;
        return (
          <div className="flex items-center gap-2">
            <MemberLimitedProfilePopover reservation={reservation}>
              <button className="cursor-pointer text-left text-sm font-medium hover:underline">
                {reservation.member_name}
              </button>
            </MemberLimitedProfilePopover>
            {reservation.penalty_active && (
              <Badge variant="secondary" className="bg-destructive/15 text-destructive text-[10px]">
                ペナルティ中
              </Badge>
            )}
            {!reservation.penalty_active && reservation.remaining_sessions === 0 && (
              <Badge variant="secondary" className="bg-destructive/15 text-destructive text-[10px]">
                残回数不足
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'plan_type',
      header: () => <span className="text-xs font-semibold">プラン</span>,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="text-xs">
            <span className="text-muted-foreground">{r.plan_type}</span>
            {r.remaining_sessions !== undefined && (
              <span
                className={`ml-1 font-medium ${
                  r.remaining_sessions === 0
                    ? 'text-destructive'
                    : r.remaining_sessions <= 1
                      ? 'text-warning'
                      : 'text-muted-foreground'
                }`}
              >
                残{r.remaining_sessions}回
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'space_number',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="h-auto gap-1 p-0 text-xs font-semibold hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          スペース
          <ArrowUpDown className="text-muted-foreground size-3" />
        </Button>
      ),
      cell: ({ row }) =>
        row.original.space_number ? (
          <Badge variant="outline" className="text-[10px]">
            {row.original.space_number}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      id: 'reservation_date',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="h-auto gap-1 p-0 text-xs font-semibold hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          予約日時
          <ArrowUpDown className="text-muted-foreground size-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.reservation_date} {row.original.reservation_time}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="h-auto gap-1 p-0 text-xs font-semibold hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          ステータス
          <ArrowUpDown className="text-muted-foreground size-3" />
        </Button>
      ),
      cell: ({ row }) => <ReservationStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'attendance_status',
      header: () => <span className="text-xs font-semibold">出席</span>,
      cell: ({ row }) => {
        const r = row.original;
        if (!canManageAttendance) {
          return (
            <span className="inline-flex h-6 items-center px-2">
              <AttendanceLabel status={r.attendance_status} />
            </span>
          );
        }
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="hover:bg-accent hover:text-accent-foreground inline-flex h-6 items-center justify-center rounded-md px-2 text-[10px]">
              <AttendanceLabel status={r.attendance_status} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={() => onAttendanceChange(r.id, 'unconfirmed')}>
                <span className="text-muted-foreground">未確認に戻す</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAttendanceChange(r.id, 'confirmed')}>
                <span className="text-success">出席確認済</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAttendanceChange(r.id, 'no_show')}>
                <span className="text-destructive">無断キャンセル</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    {
      id: 'cancel_action',
      header: () => null,
      cell: ({ row }) =>
        canManageReservation ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onCancelReservation(row.original);
            }}
          >
            取消
          </Button>
        ) : null,
    },
  ];
}
