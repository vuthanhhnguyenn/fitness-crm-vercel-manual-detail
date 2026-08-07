'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  AlertDialog,
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
  deleteCrmOptionsByIdMutation,
  getCrmOptionsQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

const DeleteOptionSchema = z.object({
  reason: z.string().min(1, '削除理由は必須です'),
});

type DeleteOptionValues = z.infer<typeof DeleteOptionSchema>;

interface OptionDeleteDialogProps {
  optionId: string;
  optionName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectOnSuccess?: boolean;
}

export function OptionDeleteDialog({
  optionId,
  optionName,
  open,
  onOpenChange,
  redirectOnSuccess = true,
}: OptionDeleteDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<DeleteOptionValues>({
    resolver: zodResolver(DeleteOptionSchema),
    mode: 'onChange',
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({ reason: '' });
    }
  }, [form, open]);

  const deleteMutation = useMutation({
    ...deleteCrmOptionsByIdMutation(),
    onSuccess: (data) => {
      toast.success(data.message || 'オプションを削除しました');
      queryClient.invalidateQueries({
        queryKey: getCrmOptionsQueryKey(),
        refetchType: 'all',
      });
      onOpenChange(false);
      if (redirectOnSuccess) {
        router.push(navigate('/options'));
      }
    },
    onError: () => {
      toast.error('オプションの削除に失敗しました');
    },
  });

  const onSubmit = (values: DeleteOptionValues) => {
    deleteMutation.mutate({
      path: { id: optionId },
      body: { reason: values.reason },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>オプションを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="text-foreground font-medium">{optionName}</span>{' '}
            を削除します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    削除理由 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="削除理由を入力してください"
                      disabled={deleteMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>キャンセル</AlertDialogCancel>
              <Button
                type="submit"
                variant="destructive"
                disabled={!form.formState.isValid || deleteMutation.isPending}
              >
                削除する
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
