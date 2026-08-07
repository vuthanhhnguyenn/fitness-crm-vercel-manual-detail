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
  deleteCrmControllersByIdMutation,
  getCrmControllersQueryKey,
  getCrmEquipmentSummaryQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

interface ControllerDeleteDialogProps {
  controllerId: string;
  controllerName: string;
  deviceCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ControllerDeleteDialog({
  controllerId,
  controllerName,
  deviceCount,
  open,
  onOpenChange,
}: ControllerDeleteDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const hasConnectedDevices = deviceCount > 0;

  const deleteMutation = useMutation({
    ...deleteCrmControllersByIdMutation(),
    onSuccess: () => {
      toast.success('接点制御装置を削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmControllersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getCrmEquipmentSummaryQueryKey() });
      onOpenChange(false);
      router.push(navigate('/controllers'));
    },
    onError: () => {
      toast.error('紐付き機器が存在するため削除できません');
      onOpenChange(false);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>接点制御装置を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {hasConnectedDevices ? (
              <>
                この接点制御装置には紐付き機器が {deviceCount} 件存在するため削除できません。
                先に紐付き機器の接続を解除してください。
              </>
            ) : (
              <>「{controllerName}」を削除します。この操作は取り消せません。</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteMutation.isPending || hasConnectedDevices}
            onClick={(event) => {
              event.preventDefault();
              deleteMutation.mutate({ path: { id: controllerId } });
            }}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
