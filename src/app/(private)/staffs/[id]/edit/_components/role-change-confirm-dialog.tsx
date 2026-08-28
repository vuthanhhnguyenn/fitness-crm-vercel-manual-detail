'use client';

import { AlertTriangle } from 'lucide-react';

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

import { STAFF_ROLE_LABELS, type StaffRole } from '../../../_constants/constants';

interface RoleChangeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previousRole: StaffRole;
  nextRole: StaffRole;
  onConfirm: () => void;
  isPending?: boolean;
}

/**
 * Role-change confirmation — shown only when the role actually changed.
 * src: staff-form.tsx L909-934
 */
export function RoleChangeConfirmDialog({
  open,
  onOpenChange,
  previousRole,
  nextRole,
  onConfirm,
  isPending = false,
}: RoleChangeConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-warning size-5" />
            ロール変更を保存しますか？
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              ロールを「
              <span className="text-foreground font-semibold">
                {STAFF_ROLE_LABELS[previousRole]}
              </span>
              」から「
              <span className="text-foreground font-semibold">{STAFF_ROLE_LABELS[nextRole]}</span>
              」に変更します。
            </span>
            <span className="block">
              変更内容は対象スタッフの
              <span className="text-foreground font-semibold">次回ログイン時から</span>
              反映されます。現在ログイン中の場合、ログアウトまで現在のロール権限のまま動作します。
            </span>
            <span className="block text-xs">この変更は権限変更履歴に記録されます。</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={onConfirm}>
            変更を保存する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
