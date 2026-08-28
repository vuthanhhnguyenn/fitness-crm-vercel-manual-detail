'use client';

import { useState } from 'react';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { toast } from 'sonner';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePagination } from '@/components/common/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  getCrmLessonSchedulesByScheduleIdReservationsQueryKey,
  patchCrmLessonSchedulesByScheduleIdReservationsByReservationIdAttendanceMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type {
  LessonScheduleListItem,
  Reservation,
  ReservationListResponse,
} from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { isOwnSessionScope, scopedManageRoles } from '../_utils/session-scope.util';
import { getReservationListColumns } from './reservation-list-columns';

const PAGE_SIZE = 7;

interface ReservationListTableProps {
  scheduleId: string;
  schedule: LessonScheduleListItem;
  data: ReservationListResponse;
  isCancelled: boolean;
  onAddReservation: () => void;
  onCancelReservation: (reservation: Reservation) => void;
}

export function ReservationListTable({
  scheduleId,
  schedule,
  data,
  isCancelled,
  onAddReservation,
  onCancelReservation,
}: ReservationListTableProps) {
  const [, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [sorting, setSorting] = useState<SortingState>([]);
  const queryClient = useQueryClient();
  const { hasPermission, user } = useAuthUser();

  const isOwnSession = isOwnSessionScope(user, schedule);
  const canManageReservation = hasPermission(Permission.LessonsReservationManage) && isOwnSession;
  const canManageAttendance = hasPermission(Permission.LessonsAttendanceManage) && isOwnSession;

  const attendanceMutation = useMutation({
    ...patchCrmLessonSchedulesByScheduleIdReservationsByReservationIdAttendanceMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getCrmLessonSchedulesByScheduleIdReservationsQueryKey({
          path: { scheduleId },
        }),
      });
    },
    onError: () => {
      toast.error('出席状況の更新に失敗しました');
    },
  });

  const handleAttendanceChange = (
    reservationId: string,
    status: Reservation['attendance_status'],
  ) => {
    attendanceMutation.mutate({
      path: { scheduleId, reservationId },
      body: { attendance_status: status },
    });
  };

  const columns = getReservationListColumns({
    onAttendanceChange: handleAttendanceChange,
    onCancelReservation,
    canManageReservation,
    canManageAttendance,
    isCancelled,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data.reservations,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: data.totalPages,
  });

  return (
    <Card className="pb-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">予約者一覧</CardTitle>
            <Badge variant="secondary" className="text-[10px]">
              {data.total}件
            </Badge>
          </div>
          <RoleGatedButton
            requiredPermission={Permission.LessonsReservationManage}
            allowedRoles={scopedManageRoles(isOwnSession)}
            size="sm"
            className="h-8 text-xs"
            disabled={isCancelled}
            tooltip={isCancelled ? 'このレッスンは中止されています' : undefined}
            onClick={onAddReservation}
          >
            <Plus className="mr-1 size-3" />
            予約を追加
          </RoleGatedButton>
        </div>
      </CardHeader>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-xs font-semibold">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Empty
                  variant="empty"
                  title="予約者はいません"
                  description="このレッスンにはまだ予約がありません"
                  action={
                    !isCancelled && (
                      <RoleGatedButton
                        requiredPermission={Permission.LessonsReservationManage}
                        allowedRoles={scopedManageRoles(isOwnSession)}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={onAddReservation}
                      >
                        <Plus className="mr-1 size-3" />
                        予約を追加
                      </RoleGatedButton>
                    )
                  }
                />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={`hover:bg-accent/50 ${row.original.penalty_active ? 'bg-destructive/10' : ''}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {data.totalPages > 1 && (
        <TablePagination
          currentPage={data.page}
          totalPages={data.totalPages}
          total={data.total}
          limit={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </Card>
  );
}
