'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
  deleteCrmMainContractsByIdMutation,
  getCrmMainContractsQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  DeleteContractSchema,
  type DeleteContractSchema as DeleteContractValues,
} from '../../_schemas/delete-contract.schema';

interface ContractDeleteDialogProps {
  contractId: string;
  contractName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContractDeleteDialog({
  contractId,
  contractName,
  open,
  onOpenChange,
}: ContractDeleteDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<DeleteContractValues>({
    resolver: zodResolver(DeleteContractSchema),
    mode: 'onChange',
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (open) form.reset({ reason: '' });
  }, [form, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const deleteMutation = useMutation({
    ...deleteCrmMainContractsByIdMutation(),
    onSuccess: (data) => {
      toast.success(data.message || '主契約を削除しました');
      queryClient.invalidateQueries({
        queryKey: getCrmMainContractsQueryKey(),
        refetchType: 'all',
      });
      onOpenChange(false);
      router.push(navigate('/contracts'));
    },
    onError: () => {
      toast.error('主契約の削除に失敗しました');
    },
  });

  const onSubmit = (values: DeleteContractValues) => {
    deleteMutation.mutate({
      path: { id: contractId },
      body: { reason: values.reason },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>主契約を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="text-foreground font-medium">{contractName}</span>{' '}
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
