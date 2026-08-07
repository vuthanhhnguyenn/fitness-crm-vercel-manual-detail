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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface SurveyDisableDialogProps {
  disabled: boolean;
  isPending: boolean;
  open: boolean;
  reason: string;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
}

export function SurveyDisableDialog({
  disabled,
  isPending,
  open,
  reason,
  onOpenChange,
  onReasonChange,
  onConfirm,
}: SurveyDisableDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="sm" className="w-full" disabled={disabled || isPending} />
        }
      >
        無効化する
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>このアンケートを無効化しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            無効化すると新規の回答は受け付けなくなります。既存の回答データは保持されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Textarea
            placeholder="例: 設問の見直しが必要なため一時停止"
            rows={3}
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending || disabled}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            無効化する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
