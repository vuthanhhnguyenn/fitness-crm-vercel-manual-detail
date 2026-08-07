'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
  deleteCrmMembersByIdPersonalDataMutation,
  getCrmMembersByIdQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';

interface PersonalDataDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  /** Whether the member is blacklisted — blocks deletion */
  isBlacklisted: boolean;
}

export function PersonalDataDeleteDialog({
  open,
  onOpenChange,
  memberId,
  isBlacklisted,
}: Readonly<PersonalDataDeleteDialogProps>) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    ...deleteCrmMembersByIdPersonalDataMutation(),
    onSuccess: () => {
      toast.success('個人情報を削除しました');
      onOpenChange(false);
      void queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
    },
    onError: () => {
      toast.error('個人情報の削除に失敗しました');
    },
  });

  const handleConfirm = () => {
    mutate({ path: { id: memberId } });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>個人情報を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            氏名・住所・連絡先等をダミー値に置換します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isBlacklisted && (
          <div className="px-1 pb-2">
            <Alert className="border-destructive/30 bg-destructive/10">
              <AlertDescription className="text-destructive text-xs">
                ブラックリスト登録者のため削除できません
              </AlertDescription>
            </Alert>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isBlacklisted || isPending}
            onClick={handleConfirm}
          >
            削除を実行
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
