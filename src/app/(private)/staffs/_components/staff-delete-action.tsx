'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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
  deleteCrmStaffsByIdMutation,
  getCrmStaffsQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  DeleteStaffSchema,
  type DeleteStaffSchema as DeleteStaffValues,
} from '../_schemas/delete-staff.schema';

interface StaffDeleteActionProps {
  staffId: string;
  /**
   * Optional custom trigger element (e.g. DropdownMenuItem).
   * If not provided, renders the default destructive button.
   */
  trigger?: ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export function StaffDeleteAction({ staffId, trigger, onOpenChange }: StaffDeleteActionProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<DeleteStaffValues>({
    resolver: zodResolver(DeleteStaffSchema),
    mode: 'onChange',
    defaultValues: { delete_reason: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({ delete_reason: '' });
    }
  }, [form, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const deleteMutation = useMutation({
    ...deleteCrmStaffsByIdMutation(),
    onSuccess: (data) => {
      toast.success(data.message || 'スタッフを削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmStaffsQueryKey() });
      setOpen(false);
      router.push(navigate('/staffs'));
    },
    onError: () => {
      toast.error('スタッフの削除に失敗しました');
    },
  });

  const onSubmit = (data: DeleteStaffValues) => {
    deleteMutation.mutate({
      path: { id: staffId },
      body: {
        delete_reason: data.delete_reason,
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger ?? (
        <AlertDialogTrigger
          render={
            <Button variant="destructive" size="sm" disabled={deleteMutation.isPending}>
              <Trash2 className="mr-2 size-4" />
              削除
            </Button>
          }
        ></AlertDialogTrigger>
      )}

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>スタッフを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            このスタッフアカウントを削除すると、ログインできなくなります。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="delete_reason"
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
                size="sm"
                disabled={deleteMutation.isPending}
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
