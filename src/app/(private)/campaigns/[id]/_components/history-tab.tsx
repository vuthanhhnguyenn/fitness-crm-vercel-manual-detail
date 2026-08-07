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

import { getCrmCampaignsByIdChangeHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmCampaignsByIdChangeHistoryResponse } from '@/lib/api/types.gen';

type HistoryRow = GetCrmCampaignsByIdChangeHistoryResponse['history'][number];

interface HistoryTabProps {
  campaignId: string;
}

export function HistoryTab({ campaignId }: HistoryTabProps) {
  const { data, isLoading } = useQuery({
    ...getCrmCampaignsByIdChangeHistoryOptions({ path: { id: campaignId } }),
  });

  const history: HistoryRow[] = data?.history ?? [];

  if (isLoading) {
    return (
      <Card className="gap-0 py-0">
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
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
          {history.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="text-sm">{row.date}</TableCell>
              <TableCell className="text-sm">{row.user}</TableCell>
              <TableCell className="text-sm font-medium">
                {row.field ?? <span className="text-muted-foreground">&mdash;</span>}
              </TableCell>
              <TableCell className="max-w-50 truncate text-sm">
                {row.from ? row.from : <span className="text-muted-foreground">&mdash;</span>}
              </TableCell>
              <TableCell className="text-center">
                <ArrowRight className="text-muted-foreground inline size-4" />
              </TableCell>
              <TableCell className="max-w-50 truncate text-sm">
                {row.field === 'ステータス' ? (
                  <Badge
                    variant="outline"
                    className={`gap-1 text-xs font-medium ${
                      row.to === '有効'
                        ? 'bg-success/15 text-success border-success/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {row.to}
                  </Badge>
                ) : row.to === '新規作成' ? (
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
