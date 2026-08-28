'use client';

import { useRef } from 'react';

import { useRouter } from 'next/navigation';

import { useMutation, useQueryClient } from '@tanstack/react-query';

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

import {
  deleteCrmFranchiseCompaniesByIdMutation,
  getCrmFranchiseCompaniesByIdQueryKey,
  getCrmFranchiseCompaniesQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

interface FranchiseCompanyDeleteDialogProps {
  companyId: string;
  companyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  blockedReason?: string | null;
  redirectOnSuccess?: boolean;
  /** 確認文の文言。UI v0 は詳細画面と一覧行メニューで言い回しが異なる（FR-031 はどちらも充足） */
  wording?: 'detail' | 'list';
}

export function FranchiseCompanyDeleteDialog({
  companyId,
  companyName,
  open,
  onOpenChange,
  onDeleted,
  blockedReason = null,
  redirectOnSuccess = true,
  wording = 'detail',
}: Readonly<FranchiseCompanyDeleteDialogProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isSubmittingRef = useRef(false);

  const deleteMutation = useMutation({
    ...deleteCrmFranchiseCompaniesByIdMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getCrmFranchiseCompaniesQueryKey(),
      });
      if (!redirectOnSuccess) {
        void queryClient.invalidateQueries({
          queryKey: getCrmFranchiseCompaniesByIdQueryKey({ path: { id: companyId } }),
        });
      }
      onOpenChange(false);
      onDeleted?.();
      if (redirectOnSuccess) {
        router.push(navigate('/franchise-companies'));
      }
    },
    onSettled: () => {
      isSubmittingRef.current = false;
    },
  });

  const handleDelete = () => {
    // Ref guard (not just `deleteMutation.isPending`): two clicks dispatched in the
    // same tick both read the pre-mutate render state, so a state-only guard can
    // still let a second DELETE through.
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    deleteMutation.mutate({
      path: { id: companyId },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {blockedReason ? 'FC企業を削除できません' : 'FC企業を削除しますか？'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            「<span className="font-medium">{companyName}</span>」
            {/* FR-031: 論理削除であること・変更履歴が保持されることを明示する */}
            {blockedReason ? (
              <>は削除できません。{blockedReason}。</>
            ) : wording === 'detail' ? (
              <>を論理削除します。変更履歴は保持されます。</>
            ) : (
              <>を削除します。変更履歴は保持されます。この操作は取り消せません。</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {blockedReason ? (
            <AlertDialogAction onClick={() => onOpenChange(false)}>閉じる</AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel disabled={deleteMutation.isPending}>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                削除する
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
