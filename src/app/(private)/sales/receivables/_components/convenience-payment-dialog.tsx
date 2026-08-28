'use client';

// Client component: dialog local state and React Query mutation require the browser.
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
  getCrmBillingRecordsReceivablesByMemberIdQueryKey,
  getCrmBillingRecordsReceivablesQueryKey,
  postCrmBillingRecordsReceivablesConveniencePaymentMutation,
} from '@/lib/api/@tanstack/react-query.gen';

interface ConveniencePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  lineItemIds?: string[];
}

export function ConveniencePaymentDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  lineItemIds,
}: Readonly<ConveniencePaymentDialogProps>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...postCrmBillingRecordsReceivablesConveniencePaymentMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getCrmBillingRecordsReceivablesQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getCrmBillingRecordsReceivablesByMemberIdQueryKey({ path: { memberId } }),
      });
      toast.success('コンビニ決済URLを発行しました');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('コンビニ決済URLの発行に失敗しました');
    },
  });

  const targetLabel =
    lineItemIds && lineItemIds.length > 0
      ? `${memberName}（明細: ${lineItemIds.join(', ')}）`
      : memberName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base">コンビニ決済URL発行</DialogTitle>
          <DialogDescription>
            {targetLabel}（{memberId}）にコンビニ決済の支払いURLを発行します。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 space-y-1 rounded-md p-3 text-sm">
            <p className="text-muted-foreground text-xs">処理内容</p>
            <p>
              JACCS電算システム経由でコンビニ支払い用のURLを発行し、SMS/メールで会員に送信します。
            </p>
          </div>
          <p className="text-muted-foreground text-xs">
            ※ 支払い確認後、入出金明細に入金レコードが追加され、未回収フラグが解除されます。
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                body: { member_id: memberId, line_item_ids: lineItemIds },
              })
            }
          >
            URLを発行する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
