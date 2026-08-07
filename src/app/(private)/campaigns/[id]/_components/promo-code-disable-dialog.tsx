'use client';

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
import { Textarea } from '@/components/ui/textarea';

import { type PromoCodeListRow } from './promo-code-table';

interface PromoCodeDisableDialogProps {
  open: boolean;
  target: PromoCodeListRow | null;
  reason: string;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
}

export function PromoCodeDisableDialog({
  open,
  target,
  reason,
  onOpenChange,
  onReasonChange,
  onSubmit,
}: PromoCodeDisableDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onOpenChange(false);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>このプロモーションコードを無効化しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            無効化後は該当コードを入力した会員に「無効なコードです」エラーが表示されます。操作履歴（操作者・日時・理由）を記録します。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {target ? (
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1">
              <label className="text-muted-foreground text-xs">対象コード</label>
              <code className="bg-muted w-fit rounded px-2 py-1 font-mono text-sm">
                {target.code}
              </code>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="disable-reason" className="text-muted-foreground text-xs">
                無効化理由（操作履歴に記録）
              </label>
              <Textarea
                id="disable-reason"
                placeholder="例: 想定上限を超過したため早期終了"
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                rows={3}
              />
            </div>
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={onSubmit} disabled={!reason.trim()}>
            無効化する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
