'use client';

import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmLessonContentsByIdHistoryQueryKey,
  getCrmLessonContentsByIdQueryKey,
  getCrmLessonContentsQueryKey,
  patchCrmLessonContentsByIdStatusMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import {
  type LessonDeactivateReasonSubmitValues,
  type LessonDeactivateReasonValues,
  buildLessonDeactivateReasonSchema,
} from '../../_schemas/lesson-deactivate-dialog.schema';

interface LessonDeactivateDialogProps {
  lessonId: string;
  lessonName: string;
  /** true → re-activation flow (有効化), false → deactivation flow (無効化). */
  isReactivation: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Deactivate / re-activate confirmation (FR-003-P1-14 / research D9).
 * Validates the required reason (deactivate only), then calls the status API.
 */
export function LessonDeactivateDialog({
  lessonId,
  lessonName,
  isReactivation,
  open,
  onOpenChange,
}: Readonly<LessonDeactivateDialogProps>) {
  const queryClient = useQueryClient();

  const reasonRequired = !isReactivation;

  const form = useForm<LessonDeactivateReasonValues, unknown, LessonDeactivateReasonSubmitValues>({
    resolver: zodResolver(buildLessonDeactivateReasonSchema(reasonRequired)),
    mode: 'onSubmit',
    defaultValues: { reason: '' },
  });

  const statusMutation = useMutation({
    ...patchCrmLessonContentsByIdStatusMutation(),
    onSuccess: (response) => {
      toast.success(
        response.message ??
          (isReactivation ? 'レッスンを有効化しました' : 'レッスンを無効化しました'),
      );
      queryClient.invalidateQueries({
        queryKey: getCrmLessonContentsByIdQueryKey({ path: { id: lessonId } }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmLessonContentsByIdHistoryQueryKey({ path: { id: lessonId } }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmLessonContentsQueryKey(),
      });
      handleOpenChange(false);
    },
    onError: () => {
      toast.error(
        isReactivation ? 'レッスンの有効化に失敗しました' : 'レッスンの無効化に失敗しました',
      );
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  const handleConfirm = form.handleSubmit((values) => {
    statusMutation.mutate({
      path: { id: lessonId },
      body: {
        status: isReactivation ? 'active' : 'inactive',
        reason: reasonRequired ? values.reason.trim() : undefined,
      },
    });
  });

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isReactivation ? 'このレッスンを有効化しますか？' : 'このレッスンを無効化しますか？'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isReactivation ? (
              <>『{lessonName}』を有効化すると、再びスケジュールで利用できるようになります。</>
            ) : (
              <>
                無効化すると、今後このレッスンで新規の予約枠を作成できなくなります。既存の予約はそのまま有効です。
                <br />※ 後から再度有効化できます。
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {reasonRequired && (
          <Form {...form}>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem className="px-1">
                  <FormLabel className="text-xs font-medium">
                    無効化の理由 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-20 text-sm"
                      placeholder="無効化する理由を入力してください（変更履歴に記録されます）"
                      disabled={statusMutation.isPending}
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
          <AlertDialogCancel disabled={statusMutation.isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className={
              isReactivation
                ? 'bg-success text-success-foreground hover:bg-success/90'
                : 'bg-warning text-warning-foreground hover:bg-warning/90'
            }
            disabled={statusMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
          >
            {isReactivation ? '有効化する' : '無効化する'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
