'use client';

import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { RejectTransferBodySchema } from '@/app/api/_schemas/transfer.schema';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmTransfersByIdQueryKey,
  getCrmTransfersQueryKey,
  patchCrmTransfersByIdRejectMutation,
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

export function TransferRejectDialog({ open, onOpenChange, transfer }: Readonly<Props>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(RejectTransferBodySchema),
    defaultValues: { comment: '' },
  });

  const { mutate: reject, isPending } = useMutation({
    ...patchCrmTransfersByIdRejectMutation(),
    onSuccess: () => {
      toast.success('移籍申請を却下しました');
      queryClient.invalidateQueries({ queryKey: getCrmTransfersQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getCrmTransfersByIdQueryKey({ path: { id: transfer.id } }),
      });
      router.push(navigate('/members/transfers'));
    },
    onError: () => {
      toast.error('却下処理に失敗しました');
      onOpenChange(false);
    },
  });

  function onSubmit(values: FormValues) {
    reject({ path: { id: transfer.id }, body: { comment: values.comment || undefined } });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>移籍申請を却下しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {transfer.member_name} さんの移籍申請を却下します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2">
          <Label className="text-sm">
            コメント <span className="text-muted-foreground text-xs font-normal">任意</span>
          </Label>
          <Textarea
            placeholder="却下理由を入力してください（任意）"
            rows={3}
            {...register('comment')}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit(onSubmit)}
            variant="destructive"
            disabled={isPending}
          >
            却下する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
