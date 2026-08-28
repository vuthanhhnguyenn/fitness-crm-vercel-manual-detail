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

import type { BillingRecordDetail, FeeAdjustment, FeeAdjustmentPattern } from '@/lib/api/types.gen';

import { BillingFeeAdjustmentDialog } from './billing-fee-adjustment-dialog';

const PATTERN_LABELS: Record<FeeAdjustmentPattern, string> = {
  fixed_amount: '金額指定',
  discount_amount: '値引き額指定',
  discount_percent: '割引率指定',
  surcharge: '値増し額指定',
};

const FEE_ADJUSTMENT_STATUS_LABELS: Record<FeeAdjustment['status'], string> = {
  applied: '適用済み',
  pending: '次回適用予定',
};

function getFeeAdjustmentStatusBadgeClass(status: FeeAdjustment['status']): string {
  return status === 'applied'
    ? 'bg-success/15 text-success border-success/20'
    : 'bg-warning/15 text-warning border-warning/20';
}

function formatAdjustmentValue(pattern: FeeAdjustmentPattern, value: number): string {
  switch (pattern) {
    case 'discount_amount':
      return `-${value.toLocaleString('ja-JP')}円`;
    case 'discount_percent':
      return `-${value}%`;
    case 'surcharge':
      return `+${value.toLocaleString('ja-JP')}円`;
    case 'fixed_amount':
      return `${value.toLocaleString('ja-JP')}円`;
  }
}

interface BillingFeeAdjustmentsCardProps {
  record: BillingRecordDetail;
}

export function BillingFeeAdjustmentsCard({ record }: Readonly<BillingFeeAdjustmentsCardProps>) {
  const { fee_adjustments: feeAdjustments, line_items: lineItems } = record;

  const targetLabel = (targetLineItemId: string | null) =>
    targetLineItemId
      ? (lineItems.find((item) => item.id === targetLineItemId)?.label ?? targetLineItemId)
      : '請求全体';

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="bg-muted/50 flex items-center justify-between border-b px-4 py-3">
        <CardTitle className="text-sm font-medium">会費調整</CardTitle>
        <BillingFeeAdjustmentDialog record={record} />
      </CardHeader>
      <CardContent className="p-0">
        {feeAdjustments.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">会費調整履歴はありません</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">調整対象</TableHead>
                <TableHead className="text-right text-xs font-semibold">調整前</TableHead>
                <TableHead className="text-xs font-semibold">調整</TableHead>
                <TableHead className="text-right text-xs font-semibold">調整後</TableHead>
                <TableHead className="text-xs font-semibold">事由</TableHead>
                <TableHead className="text-xs font-semibold">状態</TableHead>
                <TableHead className="text-xs font-semibold">適用者</TableHead>
                <TableHead className="text-xs font-semibold">登録日時</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeAdjustments.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs font-medium">
                    {targetLabel(item.target_line_item_id)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right text-xs tabular-nums">
                    ¥{item.original_amount.toLocaleString('ja-JP')}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-medium">
                      {PATTERN_LABELS[item.pattern].replace('指定', '')}{' '}
                    </span>
                    <span className="text-muted-foreground">
                      {formatAdjustmentValue(item.pattern, item.value)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium tabular-nums">
                    ¥{item.resulting_amount.toLocaleString('ja-JP')}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{item.reason}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`px-1 py-0 text-[10px] font-normal ${getFeeAdjustmentStatusBadgeClass(item.status)}`}
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
  );
}
