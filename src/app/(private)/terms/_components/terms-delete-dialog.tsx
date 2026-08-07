'use client';

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
  deleteCrmTermsByIdMutation,
  getCrmTermsQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';

interface TermsDeleteDialogProps {
  readonly termId: string;
  readonly termName: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onDeleted?: () => void;
}

export function TermsDeleteDialog({
  termId,
  termName,
  open,
  onOpenChange,
  onDeleted,
}: TermsDeleteDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    ...deleteCrmTermsByIdMutation(),
    onSuccess: (data) => {
      toast.success(data.message || '規約を削除しました');
      queryClient.invalidateQueries({
        queryKey: getCrmTermsQueryKey(),
      });
      onOpenChange(false);
      onDeleted?.();
    },
    onError: () => {
      toast.error('規約の削除に失敗しました');
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>規約を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{termName}
            」を論理削除します。実データは保持され、「削除済みも含めて表示」チェックで再表示できます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              deleteMutation.mutate({
                path: {
                  id: termId,
                },
              });
            }}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
