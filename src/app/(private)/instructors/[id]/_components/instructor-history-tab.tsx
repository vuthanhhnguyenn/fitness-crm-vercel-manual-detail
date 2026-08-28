'use client';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { useQuery } from '@tanstack/react-query';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmInstructorsByIdHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';

import { HISTORY_FIELD_LABELS, formatHistoryValue } from '../_constants/labels';

interface InstructorHistoryTabProps {
  instructorId: string;
  instructorName: string;
  active: boolean;
}

export function InstructorHistoryTab({
  instructorId,
  instructorName,
  active,
}: InstructorHistoryTabProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmInstructorsByIdHistoryOptions({ path: { id: instructorId } }),
    enabled: Boolean(instructorId) && active,
  });

  const entries = data?.entries ?? [];

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && entries.length === 0}
        onRetry={() => refetch()}
        emptyTitle="変更履歴がありません"
      >
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
            {entries.map((entry, i) => {
              const fieldLabel = entry.field
                ? (HISTORY_FIELD_LABELS[entry.field] ?? entry.field)
                : null;
              return (
                <TableRow key={i}>
                  <TableCell className="text-sm whitespace-nowrap first:pl-4">
                    {formatDateYYYYMMDD_HHMM(entry.timestamp, entry.timestamp)}
                  </TableCell>
                  <TableCell className="text-sm">{entry.operator}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {fieldLabel ?? <span className="text-muted-foreground">&mdash;</span>}
                  </TableCell>
                  <TableCell className="max-w-44 truncate text-sm">
                    {entry.before != null ? (
                      formatHistoryValue(entry.field, entry.before)
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-muted-foreground text-xs">→</span>
                  </TableCell>
                  <TableCell className="max-w-50 text-sm last:pr-4">
                    {entry.is_creation ? (
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant="outline"
                          className="bg-info/15 text-info border-info/20 w-fit text-xs font-medium"
                        >
                          新規作成
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          インストラクター {instructorName}を新規登録
                        </span>
                      </div>
                    ) : entry.after != null ? (
                      formatHistoryValue(entry.field, entry.after)
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DataStateBoundary>
    </Card>
  );
}
