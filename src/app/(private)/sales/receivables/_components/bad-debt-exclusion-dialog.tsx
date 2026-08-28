'use client';

import { useForm } from 'react-hook-form';

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
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmBillingRecordsReceivablesByMemberIdQueryKey,
  getCrmBillingRecordsReceivablesQueryKey,
  postCrmBillingRecordsReceivablesBadDebtExclusionMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import {
  type BadDebtExclusionDialogValues,
  badDebtExclusionDialogSchema,
} from '../_schemas/bad-debt-exclusion-dialog.schema';

export type BadDebtDialogMode = 'exclude' | 'release';

interface BadDebtExclusionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  mode: BadDebtDialogMode;
  lineItemIds?: string[];
}

export function BadDebtExclusionDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  mode,
  lineItemIds,
}: Readonly<BadDebtExclusionDialogProps>) {
  const queryClient = useQueryClient();
  const isRelease = mode === 'release';

  const form = useForm<BadDebtExclusionDialogValues>({
    resolver: zodResolver(badDebtExclusionDialogSchema),
    mode: 'onSubmit',
    defaultValues: { reason: '' },
  });

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) form.reset();
  };

  const mutation = useMutation({
    ...postCrmBillingRecordsReceivablesBadDebtExclusionMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getCrmBillingRecordsReceivablesQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getCrmBillingRecordsReceivablesByMemberIdQueryKey({ path: { memberId } }),
      });
      toast.success(isRelease ? '貸倒対象外指定を解除しました' : '貸倒対象外に指定しました');
      handleOpenChange(false);
    },
    onError: () => {
      toast.error(isRelease ? '指定の解除に失敗しました' : '対象外指定に失敗しました');
    },
  });

  const handleConfirm = form.handleSubmit((values) => {
    mutation.mutate({
      body: {
        member_id: memberId,
        line_item_ids: lineItemIds,
        action: mode,
        reason: values.reason.trim(),
      },
    });
  });

  const targetLabel =
    lineItemIds && lineItemIds.length > 0
      ? `${memberName}（明細: ${lineItemIds.join(', ')}）`
      : memberName;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isRelease ? '貸倒対象外指定の解除' : '貸倒対象外指定'}
          </DialogTitle>
          <DialogDescription>
            {isRelease
              ? `${targetLabel}（${memberId}）の貸倒対象外指定を解除します。`
              : `${targetLabel}（${memberId}）を貸倒対象外に指定します。`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <div className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">
                    {isRelease ? '解除理由' : '指定理由'}{' '}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        isRelease
                          ? '貸倒対象外指定を解除する理由を入力してください（必須）'
                          : '貸倒対象外とする理由を入力してください（必須）'
                      }
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-muted-foreground text-xs">
              {isRelease
                ? '※ 解除した担当者・日時・理由が記録されます。解除後は通常の貸倒判定の対象に戻ります。'
                : '※ 指定した担当者・日時・理由が記録されます。対象外指定の解除も可能です。'}
            </p>
          </div>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            キャンセル
          </Button>
          <Button disabled={mutation.isPending} onClick={handleConfirm}>
            {isRelease ? '指定を解除する' : '対象外に指定する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
