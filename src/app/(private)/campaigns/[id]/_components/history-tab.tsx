'use client';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';

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

import { getCrmCampaignsByIdChangeHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';

import { CAMPAIGN_INFO_BADGE_CLASS } from '../../_constants/constants';

interface HistoryTabProps {
  campaignId: string;
}

export function HistoryTab({ campaignId }: Readonly<HistoryTabProps>) {
  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmCampaignsByIdChangeHistoryOptions({ path: { id: campaignId } }),
  });

  const history = data?.items ?? [];

  return (
    <Card className="gap-0 py-0">
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={history.length === 0}
        onRetry={refetch}
        emptyState={{ variant: 'empty', entityLabel: '変更履歴' }}
        skeleton={
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-40 text-xs font-semibold">更新日時</TableHead>
              <TableHead className="w-25 text-xs font-semibold">操作者</TableHead>
              <TableHead className="w-30 text-xs font-semibold">変更フィールド</TableHead>
              <TableHead className="text-xs font-semibold">変更前</TableHead>
              <TableHead className="w-12 text-center text-xs font-semibold" />
              <TableHead className="text-xs font-semibold">変更後</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((row, index) => (
              <TableRow key={`${row.date}-${index}`}>
                <TableCell className="text-xs">{formatDateYYYYMMDD_HHMM(row.date)}</TableCell>
                <TableCell className="text-xs">{row.user}</TableCell>
                <TableCell className="text-xs font-medium">
                  {row.field ?? <span className="text-muted-foreground">&mdash;</span>}
                </TableCell>
                <TableCell className="max-w-50 truncate text-xs" title={row.from ?? undefined}>
                  {row.from ?? <span className="text-muted-foreground">&mdash;</span>}
                </TableCell>
                <TableCell className="text-center">
                  <ArrowRight className="text-muted-foreground inline size-4" />
                </TableCell>
                <TableCell className="max-w-50 truncate text-xs" title={row.to ?? undefined}>
                  {/* バッジは inline-flex なのでセルの truncate では切れない。 */}
                  {row.field === null ? (
                    <Badge
                      variant="outline"
                      className={cn('max-w-full text-xs font-medium', CAMPAIGN_INFO_BADGE_CLASS)}
                    >
                      <span className="min-w-0 truncate">{row.to}</span>
                    </Badge>
                  ) : (
                    <span className="font-medium">{row.to}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataStateBoundary>
    </Card>
  );
}
