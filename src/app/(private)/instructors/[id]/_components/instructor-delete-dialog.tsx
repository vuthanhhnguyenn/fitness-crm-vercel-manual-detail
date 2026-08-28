'use client';

import { useRouter } from 'next/navigation';

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
  deleteCrmInstructorsByIdMutation,
  getCrmInstructorsQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

interface InstructorDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  instructorName: string;
  assignedScheduleCount: number;
}

export function InstructorDeleteDialog({
  open,
  onOpenChange,
  instructorId,
  instructorName,
  assignedScheduleCount,
}: InstructorDeleteDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    ...deleteCrmInstructorsByIdMutation(),
    onSuccess: () => {
      toast.success(`${instructorName}を削除しました`);
      queryClient.invalidateQueries({ queryKey: getCrmInstructorsQueryKey() });
      router.push(navigate('/instructors'));
    },
    onError: (error: Error) => {
      toast.error(error.message || '削除に失敗しました');
      onOpenChange(false);
    },
  });

  const isBlocked = assignedScheduleCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <AlertDialogTitle>指導者を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{instructorName}」のプロフィールを削除します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isBlocked && (
          <Alert variant="destructive">
            <AlertDescription>
              この指導者は{assignedScheduleCount}
              件のスケジュールに割り当てられているため削除できません。
            </AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isBlocked || deleteMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              deleteMutation.mutate({ path: { id: instructorId } });
            }}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
