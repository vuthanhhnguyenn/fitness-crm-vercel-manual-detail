'use client';

import { useState } from 'react';

import { toast } from 'sonner';

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

interface LessonDeactivateDialogProps {
  lessonName: string;
  /** true → re-activation flow (有効化), false → deactivation flow (無効化). */
  isReactivation: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Deactivate / re-activate confirmation (FR-003-P1-14 / research D9).
 * Phase 1 is UI-only: validate the required reason (deactivate) → toast → close.
 * No backend write.
 */
export function LessonDeactivateDialog({
  lessonName,
  isReactivation,
  open,
  onOpenChange,
}: LessonDeactivateDialogProps) {
  const [reason, setReason] = useState('');
  const [showError, setShowError] = useState(false);

  const reasonRequired = !isReactivation;
  const reasonInvalid = reasonRequired && reason.trim().length === 0;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setReason('');
      setShowError(false);
    }
    onOpenChange(next);
  };

  const handleConfirm = () => {
    if (reasonInvalid) {
      setShowError(true);
      return;
    }
    toast.success(isReactivation ? 'レッスンを有効化しました' : 'レッスンを無効化しました');
    handleOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isReactivation ? 'このレッスンを有効化しますか？' : 'このレッスンを無効化しますか？'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isReactivation ? (
              <>『{lessonName}』を有効化すると、再びスケジュールで利用できるようになります。</>
            ) : (
              <>
                無効化すると、今後このレッスンで新規の予約枠を作成できなくなります。既存の予約はそのまま有効です。
                <br />※ 後から再度有効化できます。
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {reasonRequired && (
          <div className="px-1">
            <p className="mb-1 text-xs font-medium">
              無効化の理由 <span className="text-destructive">*</span>
            </p>
            <Textarea
              value={reason}
              maxLength={1000}
              className="min-h-[80px] text-sm"
              placeholder="無効化する理由を入力してください（変更履歴に記録されます）"
              onChange={(e) => {
                setReason(e.target.value);
                if (showError) setShowError(false);
              }}
            />
            {showError && reasonInvalid && (
              <p className="text-destructive mt-1 text-xs">理由を入力してください</p>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className={
              isReactivation
                ? 'bg-success text-success-foreground hover:bg-success/90'
                : 'bg-warning text-warning-foreground hover:bg-warning/90'
            }
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            {isReactivation ? '有効化する' : '無効化する'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
