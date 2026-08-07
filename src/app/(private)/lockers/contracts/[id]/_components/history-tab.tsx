'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';

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

import { getCrmLockersContractsByIdChangeHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmLockersContractsByIdChangeHistoryResponse } from '@/lib/api/types.gen';

type HistoryRow = GetCrmLockersContractsByIdChangeHistoryResponse['history'][number];

interface HistoryTabProps {
  contractId: string;
}

export function HistoryTab({ contractId }: HistoryTabProps) {
  const { data, isLoading } = useQuery({
    ...getCrmLockersContractsByIdChangeHistoryOptions({ path: { id: contractId } }),
  });

  const history: HistoryRow[] = data?.history ?? [];

  if (isLoading) {
    return (
      <Card className="gap-0 py-0">
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="gap-0 py-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs font-semibold">更新日時</TableHead>
            <TableHead className="text-xs font-semibold">操作者</TableHead>
            <TableHead className="text-xs font-semibold">変更フィールド</TableHead>
            <TableHead className="text-xs font-semibold">変更前</TableHead>
            <TableHead className="w-12 text-center text-xs font-semibold" />
            <TableHead className="text-xs font-semibold">変更後</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((row, i) => (
            <TableRow key={i}>
              <TableCell className="text-sm">{row.date}</TableCell>
              <TableCell className="text-sm">{row.user}</TableCell>
              <TableCell className="text-sm font-medium">
                {row.field ?? <span className="text-muted-foreground">&mdash;</span>}
              </TableCell>
              <TableCell className="text-sm">
                {row.from ? row.from : <span className="text-muted-foreground">&mdash;</span>}
              </TableCell>
              <TableCell className="text-center">
                <ArrowRight className="text-muted-foreground inline size-4" />
              </TableCell>
              <TableCell className="text-sm">
                {row.to === '新規作成' ? (
                  <Badge
                    variant="outline"
                    className="border-info/20 bg-info/15 text-info text-xs font-medium"
                  >
                    {row.to}
                  </Badge>
                ) : (
                  row.to
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
