'use client';

import { useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
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
  deleteCrmStudiosByIdMutation,
  getCrmStudiosQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';
import { isDeleteBlocked } from '@/lib/utils/studio-action-permissions.util';

interface StudioDeleteDialogProps {
  open: boolean;
  studioId: string;
  studioName: string;
  assignedLessonCount: number;
  onOpenChange: (open: boolean) => void;
}

export function StudioDeleteDialog({
  open,
  studioId,
  studioName,
  assignedLessonCount,
  onOpenChange,
}: StudioDeleteDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isBlocked = isDeleteBlocked(assignedLessonCount);

  const deleteMutation = useMutation({
    ...deleteCrmStudiosByIdMutation(),
    onSuccess: () => {
      toast.success('スタジオを削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmStudiosQueryKey() });
      onOpenChange(false);
      router.push(navigate('/studios'));
    },
    onError: () => {
      toast.error('スタジオの削除に失敗しました');
    },
  });

  const handleConfirm = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (!isBlocked) {
        deleteMutation.mutate({ path: { id: studioId } });
      }
    },
    [deleteMutation, isBlocked, studioId],
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <AlertDialogTitle>スタジオを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{studioName}」を削除します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isBlocked && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              このスタジオは{assignedLessonCount}件のレッスンで使用中のため削除できません。
            </AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isBlocked || deleteMutation.isPending}
            onClick={handleConfirm}
          >
            {deleteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
