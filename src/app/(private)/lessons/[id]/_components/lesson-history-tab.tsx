'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

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

import { getCrmLessonContentsByIdHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';

import { HISTORY_ACTION_CLASSES } from '../_constants/constants';

interface LessonHistoryTabProps {
  lessonId: string;
  canViewHistory: boolean;
  active: boolean;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : format(date, 'yyyy/MM/dd HH:mm');
}

/**
 * 変更履歴 tab — read-only change-log table (日時 / 操作者 / 操作 / 変更内容)
 * with a total-count footer. Fetched lazily, role-gated (FR-003-P1-18 / D7).
 */
export function LessonHistoryTab({ lessonId, canViewHistory, active }: LessonHistoryTabProps) {
  const { data, isLoading } = useQuery({
    ...getCrmLessonContentsByIdHistoryOptions({ path: { id: lessonId } }),
    enabled: Boolean(lessonId) && canViewHistory && active,
  });

  const entries = data?.data.entries ?? [];
  const total = data?.data.total ?? 0;

  return (
    <Card className="gap-0 py-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[160px] text-xs font-semibold">日時</TableHead>
            <TableHead className="w-[140px] text-xs font-semibold">操作者</TableHead>
            <TableHead className="w-[80px] text-xs font-semibold">操作</TableHead>
            <TableHead className="text-xs font-semibold">変更内容</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={4}>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground py-8 text-center text-sm">
                変更履歴はありません
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground text-xs">
                  {formatTimestamp(entry.timestamp)}
                </TableCell>
                <TableCell className="text-sm">{entry.operator}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-normal',
                      HISTORY_ACTION_CLASSES[entry.action] ??
                        'bg-muted text-muted-foreground border-border',
                    )}
                  >
                    {entry.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {entry.detail?.trim() ? entry.detail : '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex items-center border-t px-4 py-3">
        <p className="text-muted-foreground text-xs">全{total}件</p>
      </div>
    </Card>
  );
}
