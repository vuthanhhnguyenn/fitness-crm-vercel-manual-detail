'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmBillingRecordsByIdQueryKey,
  getCrmBillingRecordsRefundRequestsQueryKey,
  postCrmBillingRecordsByIdRefundRequestsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { BillingRecordDetail } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import {
  type BillingRefundRequestDialogValues,
  billingRefundRequestDialogSchema,
} from '../_schemas/billing-refund-request-dialog.schema';

const PAYMENT_METHOD_ALERT_LABELS: Record<BillingRecordDetail['payment_method'], string> = {
  sbps: 'SBPS',
  jaccs: 'JACCS（口座振替）',
  cash: '現金',
  other: 'その他',
};

interface BillingRefundRequestDialogProps {
  record: BillingRecordDetail;
}

export function BillingRefundRequestDialog({ record }: Readonly<BillingRefundRequestDialogProps>) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isFullRefund, setIsFullRefund] = useState(true);
  const [lineAmounts, setLineAmounts] = useState<Record<string, string>>({});

  const form = useForm<BillingRefundRequestDialogValues>({
    resolver: zodResolver(billingRefundRequestDialogSchema),
    mode: 'onSubmit',
    defaultValues: { reason: '' },
  });

  const {
    id: billingRecordId,
    payment_method: paymentMethod,
    billing_date: billingDate,
    line_items: lineItems,
  } = record;
  const outstandingTotal = record.billed_amount - record.refunded_amount;

  const [now] = useState(() => Date.now());
  const daysSincePayment = Math.floor(
    (now - new Date(billingDate.replace(/\//g, '-')).getTime()) / 86_400_000,
  );
  const isSbps = paymentMethod === 'sbps';
  const isSbpsOverLimit = isSbps && daysSincePayment > 90;

  const reset = () => {
    setIsFullRefund(true);
    setLineAmounts({});
    form.reset();
  };

  const mutation = useMutation({
    ...postCrmBillingRecordsByIdRefundRequestsMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getCrmBillingRecordsByIdQueryKey({
          path: { id: billingRecordId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmBillingRecordsRefundRequestsQueryKey(),
      });
      toast.success('返金申請を送信しました');
      reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || '返金申請の送信に失敗しました');
    },
  });

  const totalRefund = isFullRefund
    ? outstandingTotal
    : lineItems.reduce((sum, item) => sum + Number(lineAmounts[item.id] || 0), 0);
  // TODO: validates against line item's original amount, not remaining balance after prior refunds — can overrefund. Revisit once spec/API defines remaining balance.
  const hasOverAmountLine =
    !isFullRefund && lineItems.some((item) => Number(lineAmounts[item.id] || 0) > item.amount);
  const isPartialRefund = !isFullRefund && totalRefund > 0 && totalRefund < outstandingTotal;

  const getPaymentMethodAlert = useMemo(() => {
    if (!isSbps) {
      return (
        <Alert className="bg-info/15 border-info/20 text-info">
          <AlertTriangle className="size-4" />
          <AlertDescription className="text-xs">
            この請求は{' '}
            <span className="font-semibold">{PAYMENT_METHOD_ALERT_LABELS[paymentMethod]}</span>
            決済です。承認後、手動返金または CASHPOST での対応が必要です。
          </AlertDescription>
        </Alert>
      );
    }

    if (isSbpsOverLimit) {
      return (
        <Alert className="bg-warning/15 border-warning/20 text-warning">
          <AlertTriangle className="size-4" />
          <AlertDescription className="text-xs">
            この請求は SBPS 決済です。決済日（{billingDate}
            ）から90日を超過しているため、SBPS
            取消での返金はできません。別途対応（銀行振込等での返金）をご検討ください。
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="bg-info/15 border-info/20 text-info">
        <AlertTriangle className="size-4" />
        <AlertDescription className="text-xs">
          この請求は SBPS 決済です。承認後、決済日（{billingDate}
          ）から90日以内に SBPS 取消で返金されます。
        </AlertDescription>
      </Alert>
    );
  }, [isSbps, isSbpsOverLimit, billingDate, paymentMethod]);

  const handleSubmit = form.handleSubmit((values) => {
    if (totalRefund <= 0) return;
    mutation.mutate({
      path: { id: billingRecordId },
      body: isFullRefund
        ? { type: 'full', reason: values.reason.trim() }
        : {
            type: 'partial',
            reason: values.reason.trim(),
            line_item_refunds: lineItems
              .filter((item) => Number(lineAmounts[item.id] || 0) > 0)
              .map((item) => ({
                line_item_id: item.id,
                amount: Number(lineAmounts[item.id]),
              })),
          },
    });
  });

  return (
    <>
      <RoleGatedButton
        requiredPermission={Permission.SalesRefundInitiate}
        denyTooltip="返金申請の権限がありません"
        variant="outline"
        size="sm"
        className="text-destructive border-destructive/20 hover:bg-destructive/15 h-7 gap-1 text-xs"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="size-3" />
        返金申請
      </RoleGatedButton>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="sm:max-w-140">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">返金申請</DialogTitle>
            <DialogDescription className="text-xs">
              承認後、決済方法に応じた返金処理へ進みます
            </DialogDescription>
          </DialogHeader>

          {getPaymentMethodAlert}

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <Label className="text-xs">全額返金</Label>
                <p className="text-muted-foreground mt-0.5 text-[10px]">
                  OFFで明細ごとに返金額を指定
                </p>
              </div>
              <Switch checked={isFullRefund} onCheckedChange={setIsFullRefund} />
            </div>

            {!isFullRefund && (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="h-8 px-3 text-[10px] font-semibold">明細</TableHead>
                      <TableHead className="h-8 px-3 text-right text-[10px] font-semibold">
                        請求額
                      </TableHead>
                      <TableHead className="h-8 w-35 px-3 text-right text-[10px] font-semibold">
                        返金額
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item) => {
                      const current = Number(lineAmounts[item.id] || 0);
                      const isOver = current > item.amount;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="px-3 py-2 text-xs">{item.label}</TableCell>
                          <TableCell className="text-muted-foreground px-3 py-2 text-right text-xs tabular-nums">
                            {item.amount.toLocaleString('ja-JP')}円
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <Input
                              type="number"
                              className={`h-7 text-right text-xs tabular-nums ${isOver ? 'border-destructive' : ''}`}
                              value={lineAmounts[item.id] ?? ''}
                              onChange={(event) =>
                                setLineAmounts((prev) => ({
                                  ...prev,
                                  [item.id]: event.target.value,
                                }))
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">返金合計</span>
                {isPartialRefund && (
                  <Badge
                    variant="outline"
                    className="bg-warning/15 text-warning border-warning/20 px-1 py-0 text-[10px]"
                  >
                    部分返金
                  </Badge>
                )}
              </div>
              <span className="text-sm font-bold tabular-nums">
                {totalRefund.toLocaleString('ja-JP')}円
              </span>
            </div>

            <Form {...form}>
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">
                      返金事由 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-20 text-sm"
                        placeholder="返金事由を具体的に記載してください"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button
              size="sm"
              disabled={totalRefund <= 0 || hasOverAmountLine || mutation.isPending}
              onClick={handleSubmit}
            >
              申請
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
