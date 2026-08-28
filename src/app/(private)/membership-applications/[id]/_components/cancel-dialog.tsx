'use client';
// Holds local UI/dialog state and mutation calls — client-only.
import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';

import { RequiredMark } from '@/components/common/field-marker';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  REFUND_GUIDANCE_BANK_TRANSFER,
  REFUND_GUIDANCE_CREDIT_CARD,
  SAME_DAY_CANCEL_LIMIT,
} from '../../_constants/constants';
import type { ApplicationDetail } from './membership-application.utils';

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: ApplicationDetail['payment_method'];
  sameDayCancelCount: number;
  cancelReason: string;
  onCancelReasonChange: (value: string) => void;
  onConfirm: () => void;
}

export function CancelDialog({
  open,
  onOpenChange,
  paymentMethod,
  sameDayCancelCount,
  cancelReason,
  onCancelReasonChange,
  onConfirm,
}: Readonly<CancelDialogProps>) {
  const isCreditCard = paymentMethod === 'credit_card';
  const atLimit = sameDayCancelCount >= SAME_DAY_CANCEL_LIMIT;
  const oneAway = sameDayCancelCount === SAME_DAY_CANCEL_LIMIT - 1;

  let countAlertClass = 'border-muted bg-muted/30 py-2';
  let countTextClass = 'text-muted-foreground';
  if (atLimit) {
    countAlertClass = 'border-destructive/50 bg-destructive/15 py-2';
    countTextClass = 'text-destructive';
  } else if (oneAway) {
    countAlertClass = 'border-warning/50 bg-warning/15 py-2';
    countTextClass = 'text-warning';
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>申請を取り消しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            取り消すと申請者に通知されます。この操作は元に戻せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Alert className={countAlertClass}>
          <AlertDescription className={`text-xs ${countTextClass}`}>
            本日のキャンセル: {sameDayCancelCount} / {SAME_DAY_CANCEL_LIMIT}回（上限）
            {atLimit && '  ─ これ以上のキャンセルは操作不可です'}
            {oneAway && '  ─ 次回キャンセル後は当日操作不可になります'}
          </AlertDescription>
        </Alert>
        <Alert
          className={isCreditCard ? 'border-info/50 bg-info/10' : 'border-warning/50 bg-warning/10'}
        >
          <AlertDescription
            className={`text-xs ${isCreditCard ? 'text-info' : 'text-warning-foreground'}`}
          >
            {isCreditCard ? REFUND_GUIDANCE_CREDIT_CARD : REFUND_GUIDANCE_BANK_TRANSFER}
          </AlertDescription>
        </Alert>
        <div className="flex flex-col gap-2">
          <Label className="text-sm">
            取り消し理由
            <RequiredMark />
          </Label>
          <Textarea
            placeholder="取り消し理由を入力してください..."
            rows={3}
            maxLength={TEXTAREA_MAX_LENGTH}
            value={cancelReason}
            onChange={(e) => onCancelReasonChange(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onCancelReasonChange('')}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={!cancelReason.trim()}
            onClick={onConfirm}
          >
            取り消す
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
