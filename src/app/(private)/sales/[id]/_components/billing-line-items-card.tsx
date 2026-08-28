'use client';

import { useState } from 'react';

import { downloadCsv } from '@/utils/csv.util';
import { useMutation } from '@tanstack/react-query';
import { Download, MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Billing } from '@/lib/api';
import type { BillingLineItem } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { BillingAddLineItemDialog } from './billing-add-line-item-dialog';

function formatYen(amount: number): string {
  return `${amount.toLocaleString('ja-JP')}円`;
}

const PAYMENT_STATUS_LABELS: Record<BillingLineItem['payment_status'], string> = {
  unpaid: '入金未確認',
  confirmed: '入金確認済み',
  refunded: '返金済み',
  canceled: 'キャンセル',
};

function getPaymentStatusBadgeProps(status: BillingLineItem['payment_status']): {
  className: string;
  label: string;
} {
  switch (status) {
    case 'confirmed':
      return {
        className: 'bg-success/15 text-success border-success/20',
        label: PAYMENT_STATUS_LABELS.confirmed,
      };
    case 'refunded':
      return {
        className: 'bg-info/15 text-info border-info/20',
        label: PAYMENT_STATUS_LABELS.refunded,
      };
    case 'unpaid':
    default:
      return {
        className: 'bg-warning/15 text-warning border-warning/20',
        label: PAYMENT_STATUS_LABELS.unpaid,
      };
  }
}

function ReceiptMenuItem({
  billingRecordId,
  lineItem,
}: Readonly<{
  billingRecordId: string;
  lineItem: BillingLineItem;
}>) {
  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await Billing.getCrmBillingRecordsByIdLineItemsByLineItemIdReceipt({
        path: { id: billingRecordId, lineItemId: lineItem.id },
        parseAs: 'blob',
        throwOnError: true,
      });
      return data as Blob;
    },
    onSuccess: (blob) => {
      downloadCsv(blob, `receipt-${lineItem.id}.pdf`);
      toast.success('領収書をダウンロードしました');
    },
    onError: () => {
      toast.error('領収書のダウンロードに失敗しました');
    },
  });

  return (
    <DropdownMenuItem
      disabled={lineItem.payment_status !== 'confirmed' || mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      <Download className="mr-2 size-4" />
      領収書発行
    </DropdownMenuItem>
  );
}

interface BillingLineItemsCardProps {
  billingRecordId: string;
  memberId: string;
  lineItems: BillingLineItem[];
  confirmationStatus: 'unconfirmed' | 'confirmed';
  outstandingAmount: number;
}

export function BillingLineItemsCard({
  billingRecordId,
  memberId,
  lineItems,
  confirmationStatus,
  outstandingAmount,
}: Readonly<BillingLineItemsCardProps>) {
  const [addOpen, setAddOpen] = useState(false);
  const isConfirmed = confirmationStatus === 'confirmed';

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="bg-muted/50 flex items-center justify-between border-b px-4 py-3">
        <CardTitle className="text-sm font-medium">請求明細情報</CardTitle>
        <RoleGatedButton
          requiredPermission={Permission.SalesLineItemAdd}
          denyTooltip="明細追加の権限がありません"
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          disabled={isConfirmed}
          onClick={() => setAddOpen(true)}
        >
          <Plus className="size-3" />
          明細追加
        </RoleGatedButton>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-25 text-xs font-semibold">請求明細ID</TableHead>
              <TableHead className="text-xs font-semibold">請求項目</TableHead>
              <TableHead className="text-right text-xs font-semibold">請求額</TableHead>
              <TableHead className="text-center text-xs font-semibold">税率</TableHead>
              <TableHead className="text-xs font-semibold">入金状態</TableHead>
              <TableHead className="w-22.5 text-xs font-semibold" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.id}</TableCell>
                <TableCell className="text-xs">
                  {item.label}
                  {item.reason && (
                    <p className="text-muted-foreground text-[10px]">{item.reason}</p>
                  )}
                </TableCell>
                <TableCell className="text-right text-xs">{formatYen(item.amount)}</TableCell>
                <TableCell className="text-center text-xs">
                  {Math.round(item.tax_rate * 100)}%
                </TableCell>
                <TableCell>
                  {(() => {
                    const badgeProps = getPaymentStatusBadgeProps(item.payment_status);
                    return (
                      <Badge
                        variant="outline"
                        className={`px-1 py-0 text-[10px] font-normal ${badgeProps.className}`}
                      >
                        {badgeProps.label}
                      </Badge>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="hover:bg-accent hover:text-accent-foreground inline-flex size-7 cursor-pointer items-center justify-center rounded-md">
                      <MoreHorizontal className="text-muted-foreground size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* F-01 L308: 領収書は入金確認済みの明細のみ発行可（L313 入金未確認はブロック。#107 明細単位） */}
                      {/* #232: 要件外の「編集」アクション削除 */}
                      <ReceiptMenuItem billingRecordId={billingRecordId} lineItem={item} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <BillingAddLineItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        billingRecordId={billingRecordId}
        memberId={memberId}
        outstandingAmount={outstandingAmount}
      />
    </Card>
  );
}
