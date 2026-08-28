'use client';

import { useRef } from 'react';

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
  deleteCrmFranchiseCompaniesByIdStoresByStoreIdMutation,
  getCrmFranchiseCompaniesByIdLinkableStoresQueryKey,
  getCrmFranchiseCompaniesByIdQueryKey,
  getCrmFranchiseCompaniesQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';

interface UnlinkStoreDialogProps {
  companyId: string;
  store: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
}

export function UnlinkStoreDialog({
  companyId,
  store,
  onOpenChange,
}: Readonly<UnlinkStoreDialogProps>) {
  const queryClient = useQueryClient();
  const isSubmittingRef = useRef(false);

  const unlinkMutation = useMutation({
    ...deleteCrmFranchiseCompaniesByIdStoresByStoreIdMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getCrmFranchiseCompaniesByIdQueryKey({ path: { id: companyId } }),
      });
      void queryClient.invalidateQueries({
        queryKey: getCrmFranchiseCompaniesByIdLinkableStoresQueryKey({ path: { id: companyId } }),
      });
      void queryClient.invalidateQueries({ queryKey: getCrmFranchiseCompaniesQueryKey() });
      toast.success('店舗の紐づけを解除しました');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('紐づけの解除に失敗しました');
    },
    onSettled: () => {
      isSubmittingRef.current = false;
    },
  });

  const handleUnlink = () => {
    if (!store || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    unlinkMutation.mutate({ path: { id: companyId, storeId: store.id } });
  };

  return (
    <AlertDialog open={store !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>店舗の紐づけを解除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「<span className="font-medium">{store?.name}</span>
            」の管轄店舗への紐づけを解除します。変更は変更履歴に記録されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={unlinkMutation.isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction disabled={unlinkMutation.isPending} onClick={handleUnlink}>
            解除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
