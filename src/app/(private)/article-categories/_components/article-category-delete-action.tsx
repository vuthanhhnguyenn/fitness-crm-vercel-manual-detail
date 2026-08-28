'use client';

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

import type { ArticleCategoryItemResponse } from '@/lib/api/types.gen';

interface ArticleCategoryDeleteActionProps {
  category: ArticleCategoryItemResponse | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function ArticleCategoryDeleteAction({
  category,
  onOpenChange,
  onConfirm,
  isPending,
}: ArticleCategoryDeleteActionProps) {
  return (
    <AlertDialog open={category !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>カテゴリを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {category && (
              <>
                「{category.name}」を削除します。
                {category.articleCount > 0 && (
                  <>
                    このカテゴリに紐づく記事（{category.articleCount}
                    件）は「未分類」に移動されます。
                  </>
                )}
                この操作は取り消せません。
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? '削除中...' : '削除する'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
