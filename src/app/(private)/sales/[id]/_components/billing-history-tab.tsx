import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { BillingLineItem, FeeAdjustment } from '@/lib/api/types.gen';

const FEE_ADJUSTMENT_STATUS_LABELS: Record<FeeAdjustment['status'], string> = {
  applied: '適用済み',
  pending: '次回適用予定',
};

function getFeeAdjustmentStatusBadgeClass(status: FeeAdjustment['status']): string {
  return status === 'applied'
    ? 'bg-success/15 text-success border-success/20'
    : 'bg-warning/15 text-warning border-warning/20';
}

interface BillingHistoryTabProps {
  feeAdjustments: FeeAdjustment[];
  lineItems: BillingLineItem[];
}

export function BillingHistoryTab({ feeAdjustments, lineItems }: Readonly<BillingHistoryTabProps>) {
  const targetLabel = (targetLineItemId: string | null) =>
    targetLineItemId
      ? (lineItems.find((item) => item.id === targetLineItemId)?.label ?? targetLineItemId)
      : '請求全体';
  return (
    <div className="space-y-4">
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="bg-muted/50 border-b px-4 py-3">
          <CardTitle className="text-sm font-medium">会費調整履歴</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {feeAdjustments.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              会費調整履歴はありません
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">調整対象</TableHead>
                  <TableHead className="text-xs font-semibold">調整前</TableHead>
                  <TableHead className="text-xs font-semibold">調整後</TableHead>
                  <TableHead className="text-xs font-semibold">事由</TableHead>
                  <TableHead className="text-xs font-semibold">状態</TableHead>
                  <TableHead className="text-xs font-semibold">適用者</TableHead>
                  <TableHead className="text-xs font-semibold">適用日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeAdjustments.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs">
                      {targetLabel(item.target_line_item_id)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs tabular-nums">
                      ¥{item.original_amount.toLocaleString('ja-JP')}
                    </TableCell>
                    <TableCell className="text-xs font-medium tabular-nums">
                      ¥{item.resulting_amount.toLocaleString('ja-JP')}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{item.reason}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`px-1 py-0 text-[10px] ${getFeeAdjustmentStatusBadgeClass(item.status)}`}
                      >
                        {FEE_ADJUSTMENT_STATUS_LABELS[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{item.applied_by}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDateYYYYMMDD_HHMM(item.applied_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
