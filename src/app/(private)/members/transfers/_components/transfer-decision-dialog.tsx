'use client';

import { useState } from 'react';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { Loader2 } from 'lucide-react';

import { OptionalMark } from '@/components/common/field-marker';
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

import { TransferStatus } from '@/lib/api/types.gen';

import type { TransferItem } from './transfer-table-columns';

/**
 * What happens after approval depends on the brand and the stage, so the confirmation has to
 * say which one it is — an operator approving a FIT365 request at the origin stage is starting
 * a second approval, not completing a transfer.
 */
function approveDescription(transfer: TransferItem): string {
  if (transfer.brand === 'joyfit') return '承認後、システムが自動で移籍を実行します。';
  if (transfer.status === TransferStatus.FROM_STORE_PENDING) {
    return '承認後、移籍先店舗への承認依頼が送信されます。';
  }
  return '承認後、移籍が実行されます。';
}

interface TransferDecisionDialogProps {
  action: 'approve' | 'reject';
  transfer: TransferItem | null;
  isPending: boolean;
  onConfirm: (comment: string | undefined) => void;
  onCancel: () => void;
}

export function TransferDecisionDialog({
  action,
  transfer,
  isPending,
  onConfirm,
  onCancel,
}: Readonly<TransferDecisionDialogProps>) {
  const [comment, setComment] = useState('');
  const isApprove = action === 'approve';

  // Cleared when the dialog closes, so a comment typed for one request cannot leak into the
  // next one. Done in the handler rather than an effect to avoid a cascading render.
  function handleClose() {
    setComment('');
    onCancel();
  }

  return (
    <AlertDialog
      open={transfer !== null}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isApprove ? '移籍申請を承認しますか？' : '移籍申請を否認しますか？'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {transfer && (
              <>
                <strong>{transfer.member_name}</strong>（{transfer.member_id}）の移籍申請を
                {isApprove ? '承認' : '否認'}します。
                {isApprove
                  ? approveDescription(transfer)
                  : '否認後、申請者へ通知され、案件はクローズされます。'}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2">
          <Label className="text-sm">
            コメント
            <OptionalMark />
          </Label>
          <Textarea
            className="resize-none text-sm"
            rows={3}
            maxLength={TEXTAREA_MAX_LENGTH}
            placeholder={
              isApprove
                ? '承認コメントを入力してください（任意）'
                : '否認理由を入力してください（任意）'
            }
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className={
              isApprove
                ? undefined
                : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            }
            disabled={isPending}
            onClick={() => onConfirm(comment.trim() || undefined)}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isApprove ? '承認する' : '否認する'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
