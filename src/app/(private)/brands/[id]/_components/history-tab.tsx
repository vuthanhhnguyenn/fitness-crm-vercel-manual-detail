'use client';

import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmBrandsByIdChangeHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';

export function HistoryTab({ brandId }: { brandId: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmBrandsByIdChangeHistoryOptions({ path: { id: brandId } }),
  });

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data || data.histories.length === 0}
      onRetry={() => refetch()}
      emptyTitle="変更履歴がありません"
    >
      <Card className="gap-0 overflow-hidden rounded-lg border p-0">
        <div className="flex items-center gap-2 border-b px-4 pt-4 pb-3">
          <History className="size-4" />
          <h2 className="text-sm font-semibold">変更履歴</h2>
        </div>

        <div className="overflow-x-auto">
          <Table className="h-[40px] min-w-[980px]">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 text-xs font-semibold">変更日時</TableHead>
                <TableHead className="px-4 text-xs font-semibold">変更者</TableHead>
                <TableHead className="px-4 text-xs font-semibold">対象</TableHead>
                <TableHead className="px-4 text-xs font-semibold">変更項目</TableHead>
                <TableHead className="px-4 text-xs font-semibold">変更前</TableHead>
                <TableHead className="px-4 text-xs font-semibold">変更後</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.histories.map((history) => (
                <TableRow key={`${history.changed_at}-${history.changed_field}`}>
                  <TableCell className="text-muted-foreground px-4 py-4 text-xs">
                    {history.changed_at}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-xs">{history.changed_by}</TableCell>
                  <TableCell className="text-muted-foreground px-4 py-4 text-xs">
                    {history.target_display_name}
                  </TableCell>
                  <TableCell className="px-4 text-xs font-medium">
                    {history.changed_field}
                  </TableCell>
                  <TableCell className="text-muted-foreground px-4 py-4 text-xs">
                    {history.before_value}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-xs font-medium">
                    {history.after_value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </DataStateBoundary>
  );
}
