'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
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

import { getCrmStudiosByIdHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmStudiosByIdHistoryResponse } from '@/lib/api/types.gen';

interface StudioHistoryTabProps {
  studioId: string;
  active: boolean;
}

type StudioChangeHistoryEntry = NonNullable<
  GetCrmStudiosByIdHistoryResponse['data']
>['entries'][number];

type HistoryRow = {
  timestamp: string;
  user: string;
  action: string;
  field: string | null;
  before: string | null;
  after: string | null;
  note: string | null;
  isCreate: boolean;
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : format(date, 'yyyy/MM/dd HH:mm');
}

function expandHistoryRows(entries: StudioChangeHistoryEntry[]): HistoryRow[] {
  const rows: HistoryRow[] = [];

  for (const entry of entries) {
    if (entry.action === '作成' || !entry.diffs || entry.diffs.length === 0) {
      rows.push({
        timestamp: entry.timestamp,
        user: entry.user,
        action: entry.action,
        field: null,
        before: null,
        after: null,
        note: entry.note ?? null,
        isCreate: true,
      });
      continue;
    }

    for (const diff of entry.diffs) {
      rows.push({
        timestamp: entry.timestamp,
        user: entry.user,
        action: entry.action,
        field: diff.field,
        before: diff.before,
        after: diff.after,
        note: entry.note ?? null,
        isCreate: false,
      });
    }
  }

  return rows;
}

export function StudioHistoryTab({ studioId, active }: StudioHistoryTabProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmStudiosByIdHistoryOptions({ path: { id: studioId } }),
    enabled: Boolean(studioId) && active,
  });

  const entries = data?.data.entries ?? [];
  const rows = expandHistoryRows(entries);

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && rows.length === 0}
      onRetry={() => void refetch()}
      emptyTitle="変更履歴はありません"
      skeleton={
        <Card className="gap-0 py-0">
          <Table>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      }
    >
      <Card className="gap-0 py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold first:pl-4">更新日時</TableHead>
              <TableHead className="text-xs font-semibold">操作者</TableHead>
              <TableHead className="text-xs font-semibold">変更フィールド</TableHead>
              <TableHead className="text-xs font-semibold">変更前</TableHead>
              <TableHead className="w-12 text-center text-xs font-semibold" />
              <TableHead className="text-xs font-semibold last:pr-4">変更後</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm whitespace-nowrap first:pl-4">
                  {formatTimestamp(row.timestamp)}
                </TableCell>
                <TableCell className="text-sm">{row.user}</TableCell>
                <TableCell className="text-sm font-medium">
                  {row.field ? row.field : <span className="text-muted-foreground">&mdash;</span>}
                </TableCell>
                <TableCell className="max-w-44 truncate text-sm">
                  {row.before ? row.before : <span className="text-muted-foreground">&mdash;</span>}
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-muted-foreground text-xs">&rarr;</span>
                </TableCell>
                <TableCell className="max-w-[200px] text-sm last:pr-4">
                  {row.isCreate ? (
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant="outline"
                        className="bg-info/15 text-info border-info/20 w-fit text-xs font-medium"
                      >
                        新規作成
                      </Badge>
                      {row.note && (
                        <span className="text-muted-foreground text-xs">{row.note}</span>
                      )}
                    </div>
                  ) : (
                    (row.after ?? <span className="text-muted-foreground">&mdash;</span>)
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </DataStateBoundary>
  );
}
