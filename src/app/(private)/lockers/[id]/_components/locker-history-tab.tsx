'use client';

import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmLockersByIdHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmLockersByIdHistoryResponse } from '@/lib/api/types.gen';

type HistoryRow = GetCrmLockersByIdHistoryResponse['history'][number];

interface LockerHistoryTabProps {
  lockerId: string;
}

export function LockerHistoryTab({ lockerId }: LockerHistoryTabProps) {
  const { data, isLoading } = useQuery({
    ...getCrmLockersByIdHistoryOptions({ path: { id: lockerId } }),
  });

  const history: HistoryRow[] = data?.history ?? [];

  if (isLoading) {
    return (
      <Card className="gap-0 py-0">
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[160px] text-xs font-semibold">日時</TableHead>
            <TableHead className="w-[100px] text-xs font-semibold">操作者</TableHead>
            <TableHead className="w-[140px] text-xs font-semibold">操作内容</TableHead>
            <TableHead className="text-xs font-semibold">詳細</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length > 0 ? (
            history.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-muted-foreground text-xs">{row.date}</TableCell>
                <TableCell className="text-sm">{row.user}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {row.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{row.detail}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground py-8 text-center text-sm">
                履歴はありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="border-t px-4 py-3">
        <p className="text-muted-foreground text-xs">全{history.length}件</p>
      </div>
    </Card>
  );
}
