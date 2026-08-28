'use client';

import { useForm } from 'react-hook-form';

import { toSelectItems } from '@/utils/app.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmBillingRecordsQueryKey,
  getCrmBillingRecordsSummaryQueryKey,
  postCrmBillingRecordsRefundRequestsBulkMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import {
  type SalesBulkRefundDialogSubmitValues,
  type SalesBulkRefundDialogValues,
  salesBulkRefundDialogSchema,
} from '../_schemas/sales-bulk-refund-dialog.schema';

const REASON_CODE_OPTIONS = [
  { value: 'duplicate_charge', label: '重複請求' },
  { value: 'contract_cancellation', label: '契約解約' },
  { value: 'billing_error', label: '請求誤り' },
  { value: 'member_request', label: '会員要望' },
  { value: 'other', label: 'その他' },
];

interface SalesBulkRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billingRecordIds: string[];
  onSuccess?: () => void;
}

export function SalesBulkRefundDialog({
  open,
  onOpenChange,
  billingRecordIds,
  onSuccess,
}: Readonly<SalesBulkRefundDialogProps>) {
  const queryClient = useQueryClient();

  const form = useForm<SalesBulkRefundDialogValues, unknown, SalesBulkRefundDialogSubmitValues>({
    resolver: zodResolver(salesBulkRefundDialogSchema),
    mode: 'onSubmit',
    defaultValues: { reason_code: '', detail: '' },
  });

  const mutation = useMutation({
    ...postCrmBillingRecordsRefundRequestsBulkMutation(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: getCrmBillingRecordsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getCrmBillingRecordsSummaryQueryKey() });
      toast.success(`${result.created.length}件の返金申請を送信しました`);
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => {
      toast.error('返金申請の送信に失敗しました');
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    if (billingRecordIds.length === 0) return;
    mutation.mutate({
      body: {
        billing_record_ids: billingRecordIds,
        reason_code: values.reason_code,
        detail: values.detail.trim() || null,
      },
    });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) form.reset();
      }}
    >
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle className="text-base">返金申請</DialogTitle>
          <DialogDescription>
            {billingRecordIds.length}件の売上データに対して返金申請を行います。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <div className="space-y-4 py-2">
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-muted-foreground mb-1 text-xs">対象件数</p>
              <p className="text-sm font-medium">{billingRecordIds.length}件</p>
            </div>
            <FormField
              control={form.control}
              name="reason_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">
                    返金理由 <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? '')}
                    items={toSelectItems(REASON_CODE_OPTIONS)}
                  >
                    <FormControl>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="返金理由を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REASON_CODE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="detail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">詳細・備考</FormLabel>
                  <FormControl>
                    <Textarea placeholder="返金理由の詳細を入力してください" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button variant="destructive" disabled={mutation.isPending} onClick={handleSubmit}>
            返金申請を送信
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
