'use client';

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
}

export function FranchiseCompanyDeleteDialog({
  companyId,
  companyName,
  open,
  onOpenChange,
  onDeleted,
  blockedReason = null,
  redirectOnSuccess = true,
}: Readonly<FranchiseCompanyDeleteDialogProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    ...deleteCrmFranchiseCompaniesByIdMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getCrmFranchiseCompaniesQueryKey(),
        refetchType: 'all',
      });
      if (!redirectOnSuccess) {
        void queryClient.invalidateQueries({
          queryKey: getCrmFranchiseCompaniesByIdQueryKey({ path: { id: companyId } }),
          refetchType: 'all',
        });
      }
      onOpenChange(false);
      onDeleted?.();
      if (redirectOnSuccess) {
        router.push(navigate('/franchise-companies'));
      }
    },
  });

  const handleDelete = () => {
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
            <span className="font-medium">{companyName}</span>
            {blockedReason ? (
              <> は削除できません。{blockedReason}</>
            ) : (
              <> を削除します。管轄店舗がある場合は削除できません。</>
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
