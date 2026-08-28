import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { ExternalLink } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { BillingRecordDetail, RefundRequest } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { BillingRefundRequestDialog } from './billing-refund-request-dialog';

const REFUND_STATUS_LABELS: Record<RefundRequest['status'], string> = {
  pending: '承認待ち',
  approved: '承認済み',
  completed: '返金済み',
  rejected: '却下',
};

function getRefundStatusBadgeClass(status: RefundRequest['status']): string {
  switch (status) {
    case 'pending':
      return 'bg-warning/15 text-warning border-warning/20';
    case 'approved':
      return 'bg-info/15 text-info border-info/20';
    case 'completed':
      return 'bg-success/15 text-success border-success/20';
    case 'rejected':
      return 'bg-destructive/15 text-destructive border-destructive/20';
  }
}

interface BillingRefundHistoryCardProps {
  record: BillingRecordDetail;
}

export function BillingRefundHistoryCard({ record }: Readonly<BillingRefundHistoryCardProps>) {
  const router = useRouter();
  const refundRequests = record.refund_requests;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="bg-muted/50 flex items-center justify-between border-b px-4 py-3">
        <CardTitle className="text-sm font-medium">返金履歴</CardTitle>
        <div className="flex items-center gap-2">
          <Link href={navigate('/sales/refunds')}>
            <Button variant="ghost" size="sm" className="text-muted-foreground h-7 gap-1 text-xs">
              返金手続き一覧
              <ExternalLink className="size-3" />
            </Button>
          </Link>
          <BillingRefundRequestDialog record={record} />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {refundRequests.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">返金申請はありません</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">返金ID</TableHead>
                <TableHead className="text-xs font-semibold">返金額</TableHead>
                <TableHead className="text-xs font-semibold">種別</TableHead>
                <TableHead className="text-xs font-semibold">ステータス</TableHead>
                <TableHead className="text-xs font-semibold">申請者</TableHead>
                <TableHead className="text-xs font-semibold">申請日時</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refundRequests.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => router.push(navigate('/sales/refunds'))}
                >
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {item.id}
                  </TableCell>
                  <TableCell className="text-xs font-medium tabular-nums">
                    {item.amount.toLocaleString('ja-JP')}円
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.type === 'full' ? '全額返金' : '部分返金'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`px-1 py-0 text-[10px] ${getRefundStatusBadgeClass(item.status)}`}
                    >
                      {REFUND_STATUS_LABELS[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{item.requested_by}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDateYYYYMMDD_HHMM(item.requested_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
