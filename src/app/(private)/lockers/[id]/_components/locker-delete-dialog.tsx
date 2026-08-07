'use client';

import { useRouter } from 'next/navigation';

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
  deleteCrmLockersByIdMutation,
  getCrmLockersQueryKey,
  getCrmLockersSummaryQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

interface LockerDeleteDialogProps {
  lockerId: string;
  lockerName: string;
  hasActiveSlots?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LockerDeleteDialog({
  lockerId,
  lockerName,
  hasActiveSlots = false,
  open,
  onOpenChange,
}: LockerDeleteDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const deleteMutation = useMutation({
    ...deleteCrmLockersByIdMutation(),
    onSuccess: (data) => {
      toast.success(data.message || 'ロッカーを削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmLockersQueryKey(), refetchType: 'all' });
      queryClient.invalidateQueries({
        queryKey: getCrmLockersSummaryQueryKey(),
        refetchType: 'all',
      });
      onOpenChange(false);
      router.push(navigate('/lockers'));
    },
    onError: () => {
      toast.error('ロッカーの削除に失敗しました');
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ロッカー削除</AlertDialogTitle>
          <AlertDialogDescription>
            {hasActiveSlots
              ? 'このロッカーは削除できません。'
              : `ロッカー ${lockerName} を削除します。この操作は取り消せません。`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {hasActiveSlots ? (
          <div className="bg-destructive/10 border-destructive/20 rounded-lg border px-4 py-3">
            <p className="text-destructive text-sm">
              使用中・開放待ちのスロットが存在するため、このロッカーは削除できません。すべてのスロットを「利用可」状態にしてから削除してください。
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            配下のすべてのスロットと関連データが削除されます。
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {hasActiveSlots ? '閉じる' : 'キャンセル'}
          </AlertDialogCancel>
          {!hasActiveSlots ? (
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                deleteMutation.mutate({ path: { id: lockerId } });
              }}
            >
              削除する
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
