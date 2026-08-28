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
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { StudioDetail } from '@/lib/api';
import {
  deleteCrmStudiosByIdMutation,
  getCrmStudiosByIdQueryKey,
  getCrmStudiosQueryKey,
  putCrmStudiosByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';
import { isDeleteBlocked } from '@/lib/utils/studio-action-permissions.util';

interface StudioDeleteDialogProps {
  open: boolean;
  studio: StudioDetail;
  assignedLessonCount: number;
  onOpenChange: (open: boolean) => void;
}

export function StudioDeleteDialog({
  open,
  studio,
  assignedLessonCount,
  onOpenChange,
}: Readonly<StudioDeleteDialogProps>) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isBlocked = isDeleteBlocked(assignedLessonCount);
  const canDeactivateInstead = isBlocked && studio.status === 'active';

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

  const deactivateMutation = useMutation({
    ...putCrmStudiosByIdMutation(),
    onSuccess: () => {
      toast.success('スタジオを無効化しました');
      queryClient.invalidateQueries({ queryKey: getCrmStudiosQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getCrmStudiosByIdQueryKey({ path: { id: studio.id } }),
      });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('スタジオの無効化に失敗しました');
    },
  });

  const handleConfirm = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (!isBlocked) {
        deleteMutation.mutate({ path: { id: studio.id } });
      }
    },
    [deleteMutation, isBlocked, studio.id],
  );

  const handleDeactivateInstead = useCallback(() => {
    deactivateMutation.mutate({
      path: { id: studio.id },
      body: {
        name: studio.name,
        store_id: studio.store_id,
        studio_type: studio.studio_type,
        capacity: studio.capacity,
        buffer_value: studio.buffer_value,
        operating_hours: studio.usage_hours,
        equipment_notes: studio.equipment_notes,
        internal_notes: studio.internal_notes,
        status: 'inactive',
      },
    });
  }, [deactivateMutation, studio]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBlocked ? 'このスタジオは削除できません' : 'スタジオを削除しますか？'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBlocked
              ? `「${studio.name}」は${assignedLessonCount}件のレッスンで使用中です。`
              : `「${studio.name}」を削除します。この操作は取り消せません。`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isBlocked && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              このスタジオは{assignedLessonCount}
              件のレッスンで使用中のため削除できません。利用を止める場合は削除ではなく「無効化」に切り替えてください。
            </AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending || deactivateMutation.isPending}>
            キャンセル
          </AlertDialogCancel>
          {canDeactivateInstead && (
            <Button
              type="button"
              variant="outline"
              disabled={deactivateMutation.isPending}
              onClick={handleDeactivateInstead}
            >
              {deactivateMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              代わりに無効化する
            </Button>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={<span className={isBlocked ? 'inline-flex' : 'contents'} />}>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isBlocked || deleteMutation.isPending}
                  onClick={handleConfirm}
                >
                  {deleteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  削除する
                </AlertDialogAction>
              </TooltipTrigger>
              {isBlocked && (
                <TooltipContent>
                  <p className="text-xs">
                    {assignedLessonCount}
                    件のレッスンで使用中のため削除できません。紐付きレッスンをすべて解除すると削除できます
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
