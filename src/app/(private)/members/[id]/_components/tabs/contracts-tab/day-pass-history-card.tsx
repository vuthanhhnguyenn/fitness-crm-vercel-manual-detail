'use client';

import { formatDate, formatYen } from '@/utils/format.util';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmMembersByIdContractsDayPassHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';

const STATUS_LABEL: Record<string, string> = {
  used: '使用済み',
  unused: '未使用',
  expired: '期限切れ',
};

const STATUS_CLASS: Record<string, string> = {
  used: 'border-success/20 bg-success/15 text-success',
  unused: 'border-primary/20 bg-primary/15 text-primary',
  expired: 'text-muted-foreground',
};

interface DayPassHistoryCardProps {
  memberId: string;
}

export function DayPassHistoryCard({ memberId }: DayPassHistoryCardProps) {
  const { data, isLoading } = useQuery(
    getCrmMembersByIdContractsDayPassHistoryOptions({
      path: { id: memberId },
    }),
  );

  if (isLoading) return <Skeleton className="h-32 w-full rounded-lg" />;

  const history = data?.day_pass_history ?? [];

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-sm">1DayPass購入履歴</CardTitle>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs font-semibold">購入日</TableHead>
            <TableHead className="text-xs font-semibold">利用店舗</TableHead>
            <TableHead className="text-right text-xs font-semibold">金額</TableHead>
            <TableHead className="text-xs font-semibold">有効期限</TableHead>
            <TableHead className="text-xs font-semibold">状態</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length > 0 ? (
            history.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="text-sm">{formatDate(h.purchased_at)}</TableCell>
                <TableCell className="text-sm">{h.store_name}</TableCell>
                <TableCell className="text-right text-sm">{formatYen(h.amount)}</TableCell>
                <TableCell className="text-sm">{formatDate(h.expires_at)}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${STATUS_CLASS[h.status] ?? 'text-muted-foreground'}`}
                  >
                    {STATUS_LABEL[h.status] ?? h.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground py-6 text-center text-sm">
                該当のデータがありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
