'use client';
import { useState } from 'react';

import { TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmMembersByIdQueryKey,
  getCrmMembersQueryKey,
  postCrmMembersByIdPersonalDataAnonymizeMutation,
} from '@/lib/api/@tanstack/react-query.gen';

const PERSONAL_DATA_DELETE_CONFIRMATION = 'ANONYMIZE';
/** Mirrors the backend's 500-char cap on the audit reason (A-01 FR-018). */
const PERSONAL_DATA_DELETE_REASON_MAX_LENGTH = 500;

interface PersonalDataDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  /** Whether the member is blacklisted — blocks deletion (A-01 FR-018) */
  isBlacklisted: boolean;
  /** Whether the member has unpaid fees — blocks deletion (A-01 FR-018) */
  hasUnpaidFee: boolean;
}

export function PersonalDataDeleteDialog({
  open,
  onOpenChange,
  memberId,
  isBlacklisted,
  hasUnpaidFee,
}: Readonly<PersonalDataDeleteDialogProps>) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const { mutate, isPending } = useMutation({
    ...postCrmMembersByIdPersonalDataAnonymizeMutation(),
    onSuccess: () => {
      toast.success('個人情報を削除しました');
      handleClose();
      void queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
      void queryClient.invalidateQueries({ queryKey: getCrmMembersQueryKey() });
    },
    onError: () => {
      toast.error('個人情報の削除に失敗しました');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setReason('');
      setConfirmation('');
    }, 300);
  };

  const handleConfirm = () => {
    mutate({
      path: { id: memberId },
      body: { reason: reason.trim(), confirmation: PERSONAL_DATA_DELETE_CONFIRMATION },
    });
  };

  // A-01 FR-018: blacklisted members and members with unpaid fees cannot be deleted
  const hasBlocker = isBlacklisted || hasUnpaidFee;
  const blockerMessage =
    isBlacklisted && hasUnpaidFee
      ? 'ブラックリスト登録者かつ未納金があるため削除できません'
      : isBlacklisted
        ? 'ブラックリスト登録者のため削除できません'
        : '未納金があるため削除できません';

  const isConfirmationValid = confirmation.trim() === PERSONAL_DATA_DELETE_CONFIRMATION;
  const canSubmit = !hasBlocker && !isPending && !!reason.trim() && isConfirmationValid;

  return (
    <AlertDialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>個人情報を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            氏名・住所・連絡先等をダミー値に置換します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasBlocker && (
          <div className="px-1 pb-2">
            <Alert className="border-destructive/30 bg-destructive/10">
              <AlertDescription className="text-destructive text-xs">
                {blockerMessage}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {!hasBlocker && (
          <div className="flex flex-col gap-3 px-1 pb-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="personal-data-delete-reason" className="text-sm font-medium">
                削除理由 <span className="text-destructive ml-1 text-xs">*</span>
              </Label>
              <Textarea
                id="personal-data-delete-reason"
                rows={3}
                maxLength={PERSONAL_DATA_DELETE_REASON_MAX_LENGTH}
                placeholder="例：会員からの削除依頼"
                className="resize-none text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="personal-data-delete-confirmation" className="text-sm font-medium">
                確認 <span className="text-destructive ml-1 text-xs">*</span>
              </Label>
              <p className="text-muted-foreground text-xs">
                取り消せない操作です。実行するには{' '}
                <code className="font-mono font-semibold">{PERSONAL_DATA_DELETE_CONFIRMATION}</code>{' '}
                と入力してください。
              </p>
              <Input
                id="personal-data-delete-confirmation"
                autoComplete="off"
                maxLength={TEXT_MAX_LENGTH}
                placeholder={PERSONAL_DATA_DELETE_CONFIRMATION}
                className="font-mono text-sm"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={!canSubmit} onClick={handleConfirm}>
            削除を実行
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
