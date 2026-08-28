'use client';

import { useState } from 'react';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { RequiredMark } from '@/components/common/field-marker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmTransfersByIdQueryKey,
  getCrmTransfersQueryKey,
  patchCrmTransfersByIdUnlockMutation,
} from '@/lib/api/@tanstack/react-query.gen';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transferId: string;
}

/**
 * FR-012 manual override confirmation. The reason is mandatory — it is the audit trail for
 * overriding a cancellation-fee lock that may cost the member money — so the confirm action
 * stays disabled until a non-whitespace reason is entered.
 */
export function TransferUnlockDialog({ open, onOpenChange, transferId }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');

  // Cleared on close rather than in an effect, so reopening always starts from a blank draft
  // without triggering a cascading render.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setReason('');
    onOpenChange(nextOpen);
  }

  const { mutate: unlock, isPending } = useMutation({
    ...patchCrmTransfersByIdUnlockMutation(),
    onSuccess: () => {
      toast.success('自動移籍の除外理由を手動解除しました');
      void queryClient.invalidateQueries({ queryKey: getCrmTransfersQueryKey() });
      void queryClient.invalidateQueries({
        queryKey: getCrmTransfersByIdQueryKey({ path: { id: transferId } }),
      });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('手動解除に失敗しました');
    },
  });

  const isReasonValid = reason.trim().length > 0;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>解約手数料期間中の移籍を強制実行しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            キャンペーン縛り期間（解約手数料期間）中ですが、管理者権限で移籍を通します。
            会員に解約手数料が発生する可能性があります。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2">
          <Label className="text-sm">
            解除理由
            <RequiredMark />
          </Label>
          <Textarea
            className="resize-none text-sm"
            placeholder="手動解除の理由を入力してください（例: 会員同意済み、会員に手数料説明済み）"
            rows={3}
            maxLength={TEXTAREA_MAX_LENGTH}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={!isReasonValid || isPending}
            onClick={() => unlock({ path: { id: transferId }, body: { reason: reason.trim() } })}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            解除して移籍を通す
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
