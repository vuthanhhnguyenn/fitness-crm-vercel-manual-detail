'use client';

import type { MouseEvent, ReactElement } from 'react';
import { cloneElement, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
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
  deleteCrmStaffsByIdMutation,
  getCrmStaffsQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { UserRole } from '@/types/permission.type';

type TriggerElement = ReactElement<{ onClick?: (event: MouseEvent) => void }>;

interface StaffDeleteActionProps {
  staffId: string;
  /**
   * Optional custom trigger element (e.g. a row-menu item). Its `onClick` is
   * augmented (not replaced) to open this dialog — no `AlertDialogTrigger`
   * wrapper needed, since `open` here is already fully controlled.
   * If not provided, renders the default destructive button.
   */
  trigger?: TriggerElement;
  /**
   * Fully external open state (e.g. a row-menu item that must live outside the
   * dropdown's own React tree — see staffs-table-columns.tsx ActionsCell). When
   * provided, no trigger is rendered by this component; the caller drives `open`.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Delete confirmation — title "スタッフを削除しますか？", description recommending
 * deactivation instead, キャンセル / 削除する. No reason field (matches the reviewed
 * list/detail delete dialogs) — src: staff-list.tsx L627-648, staff-detail.tsx L373-386
 */
export function StaffDeleteAction({
  staffId,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: StaffDeleteActionProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const isSubmittingRef = useRef(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const deleteMutation = useMutation({
    ...deleteCrmStaffsByIdMutation(),
    onSuccess: (data) => {
      toast.success(data.message || 'スタッフを削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmStaffsQueryKey() });
      handleOpenChange(false);
      router.push(navigate('/staffs'));
    },
    onError: () => {
      toast.error('スタッフの削除に失敗しました');
    },
    onSettled: () => {
      isSubmittingRef.current = false;
    },
  });

  const handleConfirm = () => {
    if (isSubmittingRef.current || deleteMutation.isPending) return;
    isSubmittingRef.current = true;
    deleteMutation.mutate({ path: { id: staffId }, body: {} });
  };

  const effectiveTrigger: TriggerElement | null =
    trigger ??
    (isControlled ? null : (
      <RoleGatedButton
        allowedRoles={[UserRole.Headquarter, UserRole.System]}
        denyTooltip="本部権限が必要です"
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive gap-1"
        disabled={deleteMutation.isPending}
      >
        <Trash2 className="size-4" />
        削除
      </RoleGatedButton>
    ));

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {effectiveTrigger &&
        cloneElement(effectiveTrigger, {
          onClick: (event: MouseEvent) => {
            effectiveTrigger.props.onClick?.(event);
            setInternalOpen(true);
          },
        })}

      <AlertDialogContent onClick={(event) => event.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>スタッフを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            このスタッフアカウントを論理削除します。操作ログは保持されますが、CRMからログインできなくなります。通常は無効化を推奨します。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteMutation.isPending}
            onClick={handleConfirm}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
