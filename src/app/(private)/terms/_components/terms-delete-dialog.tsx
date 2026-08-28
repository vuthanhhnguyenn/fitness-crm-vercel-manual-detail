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
  getCrmTermsByIdQueryKey,
  getCrmTermsQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';

interface TermsDeleteDialogTarget {
  id: string;
  title: string;
}

interface TermsDeleteDialogProps {
  target: TermsDeleteDialogTarget | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function TermsDeleteDialog({
  target,
  onOpenChange,
  onDeleted,
}: Readonly<TermsDeleteDialogProps>) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    ...deleteCrmTermsByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || '規約を削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmTermsQueryKey() });
      if (target) {
        queryClient.invalidateQueries({
          queryKey: getCrmTermsByIdQueryKey({ path: { id: target.id } }),
        });
      }
      onOpenChange(false);
      onDeleted?.();
    },
    onError: () => {
      toast.error('規約の削除に失敗しました');
    },
  });

  const handleDelete = () => {
    if (deleteMutation.isPending || !target) return;
    deleteMutation.mutate({ path: { id: target.id } });
  };

  return (
    <AlertDialog open={target !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>規約を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{target?.title}
            」を論理削除します。実データは保持されますが、通常検索からは除外されます。「削除済みも含めて表示」チェックで再表示できます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            {deleteMutation.isPending ? '削除中...' : '削除する'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
