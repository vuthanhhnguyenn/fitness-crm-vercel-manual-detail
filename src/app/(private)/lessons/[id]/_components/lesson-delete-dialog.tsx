'use client';

import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, XCircle } from 'lucide-react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

import {
  deleteCrmLessonContentsByIdMutation,
  getCrmLessonContentsQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  type LessonDeleteReasonValues,
  lessonDeleteReasonSchema,
} from '../../_schemas/lesson-delete-dialog.schema';

interface LessonDeleteDialogProps {
  lessonId: string;
  lessonName: string;
  usageCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Delete confirmation (FR-003-P1-15/16 / research D5).
 * - usage_count > 0  → blocking alert, disabled confirm, link to in-use schedules.
 * - usage_count === 0 → required delete reason, enabled confirm → API call → redirect to list.
 */
export function LessonDeleteDialog({
  lessonId,
  lessonName,
  usageCount,
  open,
  onOpenChange,
}: LessonDeleteDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const inUse = usageCount > 0;

  const form = useForm<LessonDeleteReasonValues>({
    resolver: zodResolver(lessonDeleteReasonSchema),
    mode: 'onSubmit',
    defaultValues: { reason: '' },
  });

  const deleteMutation = useMutation({
    ...deleteCrmLessonContentsByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message ?? 'レッスンを削除しました');
      queryClient.invalidateQueries({
        queryKey: getCrmLessonContentsQueryKey(),
      });
      handleOpenChange(false);
      router.push(navigate('/lessons'));
    },
    onError: () => {
      toast.error('レッスンの削除に失敗しました');
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  const handleConfirm = form.handleSubmit((values) => {
    if (inUse) return;
    deleteMutation.mutate({
      path: { id: lessonId },
      body: { reason: values.reason.trim() },
    });
  });

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>レッスンを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            『{lessonName}』を削除します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>

        {inUse ? (
          <div className="flex flex-col gap-3">
            <Alert variant="destructive">
              <XCircle className="size-4" />
              <AlertDescription>
                このレッスンはスケジュールで使用中のため削除できません。
              </AlertDescription>
            </Alert>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-auto justify-start gap-1 p-0 text-xs"
              onClick={() => {
                handleOpenChange(false);
                router.push(navigate('/lesson-schedules'));
              }}
            >
              使用中のスケジュールを確認 ({usageCount}件)
              <ExternalLink className="size-3" />
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem className="px-1">
                  <FormLabel className="text-xs font-medium">
                    削除理由 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-20 text-sm"
                      placeholder="削除する理由を入力してください（変更履歴に記録されます）"
                      disabled={deleteMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={inUse || deleteMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
