'use client';

import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { ApproveTransferBodySchema } from '@/app/api/_schemas/transfer.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmTransfersByIdQueryKey,
  getCrmTransfersQueryKey,
  patchCrmTransfersByIdApproveMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmTransfersByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

type TransferDetail = NonNullable<GetCrmTransfersByIdResponse>['transfer'];
type FormValues = { comment?: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: TransferDetail;
}

export function TransferApproveDialog({ open, onOpenChange, transfer }: Readonly<Props>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(ApproveTransferBodySchema),
    defaultValues: { comment: '' },
  });

  const { mutate: approve, isPending } = useMutation({
    ...patchCrmTransfersByIdApproveMutation(),
    onSuccess: () => {
      toast.success('移籍申請を承認しました');
      queryClient.invalidateQueries({ queryKey: getCrmTransfersQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getCrmTransfersByIdQueryKey({ path: { id: transfer.id } }),
      });
      router.push(navigate('/members/transfers'));
    },
    onError: () => {
      toast.error('承認処理に失敗しました');
      onOpenChange(false);
    },
  });

  function onSubmit(values: FormValues) {
    approve({ path: { id: transfer.id }, body: { comment: values.comment || undefined } });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>移籍申請を承認しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {transfer.member_name} さんの {transfer.from_store_name} から {transfer.to_store_name}{' '}
            への移籍を承認します。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2">
          <Label className="text-sm">
            コメント <span className="text-muted-foreground text-xs font-normal">任意</span>
          </Label>
          <Textarea
            placeholder="承認コメントを入力してください（任意）"
            rows={3}
            {...register('comment')}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            承認する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
