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
  deleteCrmEquipmentByIdMutation,
  getCrmEquipmentQueryKey,
  getCrmEquipmentSummaryQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

interface EquipmentDeleteDialogProps {
  equipmentId: string;
  equipmentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EquipmentDeleteDialog({
  equipmentId,
  equipmentName,
  open,
  onOpenChange,
}: EquipmentDeleteDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const deleteMutation = useMutation({
    ...deleteCrmEquipmentByIdMutation(),
    onSuccess: () => {
      toast.success('接続機器を削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmEquipmentQueryKey() });
      queryClient.invalidateQueries({ queryKey: getCrmEquipmentSummaryQueryKey() });
      onOpenChange(false);
      router.push(navigate('/equipment'));
    },
    onError: () => {
      toast.error('接続機器の削除に失敗しました');
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>接続機器を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{equipmentName}」を削除します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              deleteMutation.mutate({ path: { id: equipmentId } });
            }}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
