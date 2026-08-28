'use client';

import { useForm, useWatch } from 'react-hook-form';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

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
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmBillingRecordsTransactionsQueryKey,
  postCrmBillingRecordsByIdRefundRequestsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { TransactionRecord } from '@/lib/api/types.gen';

import {
  type TransactionRefundRequestDialogSubmitValues,
  type TransactionRefundRequestDialogValues,
  createTransactionRefundRequestDialogSchema,
} from '../_schemas/transaction-refund-request-dialog.schema';

interface TransactionRefundRequestDialogProps {
  row: TransactionRecord | null;
  onOpenChange: (open: boolean) => void;
}

export function TransactionRefundRequestDialog({
  row,
  onOpenChange,
}: Readonly<TransactionRefundRequestDialogProps>) {
  return (
    <Dialog open={row !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-130">
        {row && (
          // Keyed by row.id so switching the target transaction always starts from a clean form
          // (no reset-on-prop-change effect needed).
          <TransactionRefundRequestForm
            key={row.id}
            row={row}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface TransactionRefundRequestFormProps {
  row: TransactionRecord;
  onClose: () => void;
}

function TransactionRefundRequestForm({
  row,
  onClose,
}: Readonly<TransactionRefundRequestFormProps>) {
  const queryClient = useQueryClient();

  const form = useForm<
    TransactionRefundRequestDialogValues,
    unknown,
    TransactionRefundRequestDialogSubmitValues
  >({
    resolver: zodResolver(createTransactionRefundRequestDialogSchema(row.amount_inc_tax)),
    mode: 'onSubmit',
    defaultValues: {
      is_full_refund: true,
      partial_amount: '',
      reason: '',
    },
  });

  const isFullRefund = useWatch({ control: form.control, name: 'is_full_refund' }) ?? true;
  const partialAmount = useWatch({ control: form.control, name: 'partial_amount' }) ?? '';

  const mutation = useMutation({
    ...postCrmBillingRecordsByIdRefundRequestsMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getCrmBillingRecordsTransactionsQueryKey() });
      toast.success('返金申請を送信しました');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || '返金申請の送信に失敗しました');
    },
  });

  const currentAmount = isFullRefund ? row.amount_inc_tax : Number(partialAmount || 0);
  const isPartial = currentAmount > 0 && currentAmount < row.amount_inc_tax;

  const handleSubmit = form.handleSubmit((values) => {
    mutation.mutate({
      path: { id: row.billing_record_id },
      body: values.is_full_refund
        ? { type: 'full', reason: values.reason.trim() }
        : {
            type: 'partial',
            reason: values.reason.trim(),
            line_item_refunds: [
              { line_item_id: row.billing_line_item_id, amount: Number(values.partial_amount) },
            ],
          },
    });
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-base font-bold">返金申請</DialogTitle>
        <DialogDescription className="text-xs">
          取引 {row.id} に対して返金を申請します。承認後、決済方法に応じた返金処理へ進みます。
        </DialogDescription>
      </DialogHeader>

      {row.payment_method === 'sbps' ? (
        <Alert className="bg-info/10 border-info/20 text-info">
          <AlertTriangle className="size-4" />
          <AlertDescription className="text-xs">
            この請求は <span className="font-semibold">SBPS</span>{' '}
            決済です。承認後、決済日から90日以内にSBPS取消で返金されます。
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-info/10 border-info/20 text-info">
          <AlertTriangle className="size-4" />
          <AlertDescription className="text-xs">
            この請求は <span className="font-semibold">{row.payment_method.toUpperCase()}</span>{' '}
            決済です。承認後、手動返金 または CASHPOST で返金されます。
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <div className="space-y-4">
          <div className="bg-muted/50 space-y-1 rounded-lg border px-3 py-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">会員</span>
              <span className="font-medium">
                {row.member_name}（{row.member_id}）
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">請求明細ID</span>
              <span className="font-mono">{row.billing_line_item_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">税込額</span>
              <span className="font-medium tabular-nums">
                {row.amount_inc_tax.toLocaleString('ja-JP')}円
              </span>
            </div>
          </div>

          <FormField
            control={form.control}
            name="is_full_refund"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0 rounded-lg border px-3 py-2">
                <div>
                  <Label className="text-xs">全額返金</Label>
                  <p className="text-muted-foreground mt-0.5 text-[10px]">OFFで返金額を指定</p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (checked) form.setValue('partial_amount', '');
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {!isFullRefund && (
            <FormField
              control={form.control}
              name="partial_amount"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">返金額</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        className="h-8 pr-8 text-right text-sm tabular-nums"
                        placeholder="0"
                        {...field}
                      />
                      <span className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 text-xs">
                        円
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">返金合計</span>
              {isPartial && (
                <Badge
                  variant="outline"
                  className="bg-info/15 text-info border-info/20 px-1 py-0 text-[10px]"
                >
                  部分返金
                </Badge>
              )}
            </div>
            <span className="text-sm font-bold tabular-nums">
              {currentAmount.toLocaleString('ja-JP')}円
            </span>
          </div>

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
                    maxLength={TEXTAREA_MAX_LENGTH}
                    placeholder="返金事由を具体的に記載してください"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose}>
          キャンセル
        </Button>
        <Button size="sm" disabled={mutation.isPending} onClick={handleSubmit}>
          返金申請を送信
        </Button>
      </DialogFooter>
    </>
  );
}
