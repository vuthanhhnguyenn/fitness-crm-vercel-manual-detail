'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { ExternalLink, XCircle } from 'lucide-react';
import { toast } from 'sonner';

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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { navigate } from '@/lib/routes/routes.util';

interface LessonDeleteDialogProps {
  lessonName: string;
  usageCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Delete confirmation (FR-003-P1-15/16 / research D5). Phase 1 is UI-only.
 * - usage_count > 0  → blocking alert, disabled confirm, link to in-use schedules.
 * - usage_count === 0 → required delete reason, enabled confirm → toast → close.
 */
export function LessonDeleteDialog({
  lessonName,
  usageCount,
  open,
  onOpenChange,
}: LessonDeleteDialogProps) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [showError, setShowError] = useState(false);

  const inUse = usageCount > 0;

  const reasonInvalid = reason.trim().length === 0;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setReason('');
      setShowError(false);
    }
    onOpenChange(next);
  };

  const handleConfirm = () => {
    if (inUse) return;
    if (reasonInvalid) {
      setShowError(true);
      return;
    }
    toast.success('レッスンを削除しました');
    handleOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>レッスンを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            『{lessonName}』を削除します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>

        {inUse ? (
          <div className="flex flex-col gap-3">
            <Alert variant="destructive">
              <XCircle className="size-4" />
              <AlertDescription>
                このレッスンはスケジュールで使用中のため削除できません。
              </AlertDescription>
            </Alert>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-auto justify-start gap-1 p-0 text-xs"
              onClick={() => {
                handleOpenChange(false);
                router.push(navigate('/lesson-schedules'));
              }}
            >
              使用中のスケジュールを確認 ({usageCount}件)
              <ExternalLink className="size-3" />
            </Button>
          </div>
        ) : (
          <div className="px-1">
            <p className="mb-1 text-xs font-medium">
              削除理由 <span className="text-destructive">*</span>
            </p>
            <Textarea
              value={reason}
              maxLength={1000}
              className="min-h-[80px] text-sm"
              placeholder="削除する理由を入力してください（変更履歴に記録されます）"
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
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={inUse}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
