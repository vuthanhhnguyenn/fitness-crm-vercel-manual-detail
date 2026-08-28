'use client';

import { useRef, useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';
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
  getCrmStaffsByIdOptions,
  getCrmStaffsQueryKey,
  postCrmStaffsByIdActivateMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import { UserRole } from '@/types/permission.type';

interface StaffReactivateActionProps {
  staffId: string;
  staffName: string;
}

/**
 * "有効化する" — the counterpart to StaffDeactivateAction's "後から有効化することが
 * できます" promise (BUG-Y01DETAIL-05: no such control existed anywhere for an
 * already-inactive account).
 */
export function StaffReactivateAction({ staffId, staffName }: StaffReactivateActionProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const isSubmittingRef = useRef(false);

  const activateMutation = useMutation({
    ...postCrmStaffsByIdActivateMutation(),
    onSuccess: () => {
      toast.success('スタッフを有効化しました', {
        description: `${staffName}は再びCRMにログインできるようになります。`,
      });
      queryClient.invalidateQueries({ queryKey: getCrmStaffsQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getCrmStaffsByIdOptions({ path: { id: staffId } }).queryKey,
      });
      setOpen(false);
    },
    onError: () => {
      toast.error('スタッフの有効化に失敗しました');
    },
    onSettled: () => {
      isSubmittingRef.current = false;
    },
  });

  const handleConfirm = () => {
    if (isSubmittingRef.current || activateMutation.isPending) return;
    isSubmittingRef.current = true;
    activateMutation.mutate({ path: { id: staffId } });
  };

  const trigger = (
    <RoleGatedButton
      allowedRoles={[UserRole.Headquarter, UserRole.System]}
      denyTooltip="本部権限が必要です"
      variant="outline"
      size="sm"
      className="w-full"
      disabled={activateMutation.isPending}
      onClick={() => setOpen(true)}
    >
      <RotateCcw className="size-4" />
      有効化する
    </RoleGatedButton>
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger}

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>このスタッフを有効化しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            有効化すると、このスタッフは再びCRMにログインできるようになります。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={activateMutation.isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={activateMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              handleConfirm();
            }}
          >
            有効化する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
