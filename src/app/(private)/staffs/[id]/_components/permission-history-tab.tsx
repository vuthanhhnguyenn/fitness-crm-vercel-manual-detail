'use client';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { useQuery } from '@tanstack/react-query';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmStaffsByIdPermissionHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';

interface PermissionHistoryTabProps {
  staffId: string;
}

/**
 * 変更履歴 tab — 日時/操作者/変更内容 table, newest first, 全{N}件 footer
 * src: staff-detail.tsx L321-346
 */
export function PermissionHistoryTab({ staffId }: PermissionHistoryTabProps) {
  const { data } = useQuery({
    ...getCrmStaffsByIdPermissionHistoryOptions({
      path: { id: staffId },
      query: { page: 1, limit: 100 },
    }),
  });
  const history = data?.history ?? [];
  const total = data?.pagination.total ?? 0;

  if (history.length === 0) {
    return (
      <Card className="gap-0 py-0">
        <Empty variant="empty" entityLabel="変更履歴" />
        <div className="flex items-center border-t px-4 py-3">
          <p className="text-muted-foreground text-xs">全{total}件</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="gap-0 py-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[160px] text-xs font-semibold">日時</TableHead>
            <TableHead className="w-[200px] text-xs font-semibold">操作者</TableHead>
            <TableHead className="text-xs font-semibold">変更内容</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="text-muted-foreground text-xs">
                {formatDateYYYYMMDD_HHMM(entry.changed_at)}
              </TableCell>
              <TableCell className="text-sm">
                {entry.operator_name}（{entry.operator_position}）
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {entry.change_description}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center border-t px-4 py-3">
        <p className="text-muted-foreground text-xs">全{total}件</p>
      </div>
    </Card>
  );
}
