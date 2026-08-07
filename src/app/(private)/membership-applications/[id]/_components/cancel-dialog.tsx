'use client';

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

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: string;
  cancelReason: string;
  onCancelReasonChange: (value: string) => void;
  onConfirm: () => void;
}

export function CancelDialog({
  open,
  onOpenChange,
  paymentMethod,
  cancelReason,
  onCancelReasonChange,
  onConfirm,
}: Readonly<CancelDialogProps>) {
  const isCreditCard = paymentMethod === 'クレジットカード';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>申請を取り消しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            取り消すと申請者に通知されます。この操作は元に戻せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* 決済方式別の返金案内 */}
        <Alert
          className={isCreditCard ? 'border-info/50 bg-info/10' : 'border-warning/50 bg-warning/10'}
        >
          <AlertDescription
            className={`text-xs ${isCreditCard ? 'text-info' : 'text-warning-foreground'}`}
          >
            {isCreditCard
              ? 'カード決済の取消処理を実行します（90日以内）。'
              : '口座振替の返金は手動対応となります（CASHPOSTまたは振込）。'}
          </AlertDescription>
        </Alert>
        <div className="flex flex-col gap-2">
          <Label className="text-sm">
            取り消し理由 <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder="取り消し理由を入力してください..."
            rows={3}
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
