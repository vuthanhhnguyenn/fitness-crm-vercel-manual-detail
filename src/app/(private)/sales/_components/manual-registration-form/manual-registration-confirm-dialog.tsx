'use client';

import { AlertTriangle, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ManualRegistrationConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeName: string;
  memberName: string;
  billingDate: string;
  billingMonth: string;
  lineItemCount: number;
  totalAmount: number;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function ManualRegistrationConfirmDialog({
  open,
  onOpenChange,
  storeName,
  memberName,
  billingDate,
  billingMonth,
  lineItemCount,
  totalAmount,
  isSubmitting,
  onConfirm,
}: Readonly<ManualRegistrationConfirmDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-warning size-5" />
            <DialogTitle className="text-base font-bold">確定状態で登録</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            確定後は請求明細の追加・変更ができなくなります。
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 space-y-2 rounded-lg border p-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">店舗</span>
            <span className="font-medium">{storeName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">利用者</span>
            <span className="font-medium">{memberName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">請求日</span>
            <span className="font-medium">{billingDate}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">適用月</span>
            <span className="font-medium">{billingMonth.replace('-', '/')}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">明細件数</span>
            <span className="font-medium">{lineItemCount}件</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">請求総額（税込）</span>
            <span className="font-medium tabular-nums">¥{totalAmount.toLocaleString('ja-JP')}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button size="sm" className="gap-2" disabled={isSubmitting} onClick={onConfirm}>
            <Lock className="size-3" />
            確定状態で登録
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
