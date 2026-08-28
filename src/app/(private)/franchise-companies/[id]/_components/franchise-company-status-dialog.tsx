'use client';

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

import {
  getCrmFranchiseCompaniesByIdQueryKey,
  getCrmFranchiseCompaniesQueryKey,
  patchCrmFranchiseCompaniesByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { FranchiseCompanyStatus } from '@/lib/api/types.gen';

interface FranchiseCompanyStatusDialogProps {
  companyId: string;
  companyName: string;
  currentStatus: FranchiseCompanyStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FranchiseCompanyStatusDialog({
  companyId,
  companyName,
  currentStatus,
  open,
  onOpenChange,
}: Readonly<FranchiseCompanyStatusDialogProps>) {
  const queryClient = useQueryClient();
  const activating = currentStatus === FranchiseCompanyStatus.INACTIVE;
  const nextStatus = activating ? FranchiseCompanyStatus.ACTIVE : FranchiseCompanyStatus.INACTIVE;

  const mutation = useMutation({
    ...patchCrmFranchiseCompaniesByIdMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getCrmFranchiseCompaniesByIdQueryKey({ path: { id: companyId } }),
      });
      void queryClient.invalidateQueries({
        queryKey: getCrmFranchiseCompaniesQueryKey(),
      });
      toast.success(activating ? 'FC企業を有効化しました' : 'FC企業を無効化しました');
      onOpenChange(false);
    },
    onError: () => {
      toast.error(activating ? '有効化に失敗しました' : '無効化に失敗しました');
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {activating ? 'FC企業を有効化しますか？' : 'FC企業を無効化しますか？'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            「<span className="font-medium">{companyName}</span>」を
            {activating ? '有効化' : '無効化'}します。
            {!activating && '無効化しても管轄店舗の紐づけは維持されます。'}
            変更は変更履歴に記録されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate({ path: { id: companyId }, body: { status: nextStatus } })
            }
          >
            {activating ? '有効化する' : '無効化する'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
