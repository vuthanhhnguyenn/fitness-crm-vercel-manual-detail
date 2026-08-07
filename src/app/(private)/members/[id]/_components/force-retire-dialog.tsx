'use client';

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmBlacklistQueryKey,
  getCrmLeavesQueryKey,
  getCrmMembersByIdQueryKey,
  getCrmMembersQueryKey,
  postCrmMembersByIdForceWithdrawMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { MainBrand } from '@/lib/api/types.gen';

// ── Props ─────────────────────────────────────────────────────────────────────
interface ForceRetireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberBrand: MainBrand;
}

// ── ForceRetireDialog ─────────────────────────────────────────────────────────
export function ForceRetireDialog({
  open,
  onOpenChange,
  memberId,
  memberBrand,
}: Readonly<ForceRetireDialogProps>) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    ...postCrmMembersByIdForceWithdrawMutation(),
    onSuccess: () => {
      toast.success('強制退会を実行しました');
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
      queryClient.invalidateQueries({ queryKey: getCrmMembersQueryKey(), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: getCrmLeavesQueryKey(), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: getCrmBlacklistQueryKey(), refetchType: 'all' });
      handleClose();
    },
    onError: () => {
      toast.error('強制退会に失敗しました');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setReason(''), 300);
  };

  const handleExecute = () => {
    mutation.mutate({
      path: { id: memberId },
      body: { reason: reason.trim() },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>強制退会を実行しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            この操作は取り消せません。ブラックリストに自動登録されます。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3 px-1 pb-2">
          {/* ブランド×決済手段条件表示 */}
          <div className="space-y-2 rounded-lg border p-3 text-sm">
            <p className="font-medium">強制退会の条件（ブランド×決済手段）</p>
            <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <p className="text-foreground font-medium">JOYFIT</p>
                <p
                  className={
                    memberBrand === MainBrand.JOYFIT
                      ? 'bg-muted text-foreground rounded px-2 py-1 font-medium'
                      : ''
                  }
                >
                  SBPS: 2ヶ月連続未納
                </p>
                <p>JACCS: 1ヶ月未納（代位弁済なし）</p>
              </div>
              <div className="space-y-1">
                <p className="text-foreground font-medium">FIT365</p>
                <p
                  className={
                    memberBrand === MainBrand.FIT365
                      ? 'bg-muted text-foreground rounded px-2 py-1 font-medium'
                      : ''
                  }
                >
                  SBPS: 2ヶ月連続未納
                </p>
                <p>JACCS: 3ヶ月猶予後</p>
              </div>
            </div>
          </div>

          {/* 理由入力 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="force-retire-reason" className="text-sm font-medium">
              理由 <span className="text-destructive ml-1 text-xs">*</span>
            </Label>
            <Textarea
              id="force-retire-reason"
              placeholder="強制退会の理由を入力..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-20 resize-none text-sm"
              disabled={mutation.isPending}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReason('')} disabled={mutation.isPending}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            disabled={!reason.trim() || mutation.isPending}
            onClick={handleExecute}
          >
            強制退会を実行
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
