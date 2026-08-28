'use client';

import { useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import { Link2 } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { postCrmStaffsByIdMagicLinkMutation } from '@/lib/api/@tanstack/react-query.gen';

import { UserRole } from '@/types/permission.type';

interface StaffMagicLinkActionProps {
  staffId: string;
  staffName: string;
  /** Any role may issue for their own account; otherwise Headquarter/System only — src: staff-detail.tsx L161-171 */
  allowedRoles: readonly UserRole[];
}

/**
 * "CRMのログイン用URLを送る" header action + sent-confirmation dialog
 * src: staff-detail.tsx L161-171 (action), L389-401 (dialog)
 */
export function StaffMagicLinkAction({
  staffId,
  staffName,
  allowedRoles,
}: StaffMagicLinkActionProps) {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const mutation = useMutation({
    ...postCrmStaffsByIdMagicLinkMutation(),
    onSuccess: (res) => {
      setSentTo(res.sent_to);
    },
    onError: () => {
      toast.error('ログイン用URLの発行に失敗しました');
    },
  });

  return (
    <>
      <RoleGatedButton
        variant="outline"
        allowedRoles={allowedRoles}
        denyTooltip="本部管理者権限が必要です"
        className="gap-1"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate({ path: { id: staffId } })}
      >
        <Link2 className="size-4" />
        CRMのログイン用URLを送る
      </RoleGatedButton>

      <AlertDialog open={sentTo !== null} onOpenChange={(open) => !open && setSentTo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ログイン用URLを送信しました</AlertDialogTitle>
            <AlertDialogDescription>
              {staffName} さんのメールアドレス（{sentTo}
              ）にCRMのログイン用URLを送信しました。本人がメールを開いてURLをタップすると、CRMにログインできます。URLの有効期限は1時間です。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSentTo(null)}>閉じる</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
