'use client';

import { useState } from 'react';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';

import {
  getCrmBillingRecordsByIdQueryKey,
  getCrmBillingRecordsQueryKey,
  patchCrmBillingRecordsByIdConfirmationMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import { Permission } from '@/types/permission.type';

interface BillingConfirmationStatusCardProps {
  billingRecordId: string;
  confirmationStatus: 'unconfirmed' | 'confirmed';
  confirmedBy: string | null;
  confirmedAt: string | null;
  memberName: string;
  billingDate: string;
  billedAmount: number;
}

export function BillingConfirmationStatusCard({
  billingRecordId,
  confirmationStatus,
  confirmedBy,
  confirmedAt,
  memberName,
  billingDate,
  billedAmount,
}: Readonly<BillingConfirmationStatusCardProps>) {
  const queryClient = useQueryClient();
  const isConfirmed = confirmationStatus === 'confirmed';
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const mutation = useMutation({
    ...patchCrmBillingRecordsByIdConfirmationMutation(),
    onSuccess: (_data, variables) => {
      const nextStatus = variables.body?.status;
      toast.success(
        nextStatus === 'confirmed' ? 'この請求を確定しました' : '請求を未確定に戻しました',
      );
      queryClient.invalidateQueries({
        queryKey: getCrmBillingRecordsByIdQueryKey({
          path: { id: billingRecordId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmBillingRecordsQueryKey(),
      });
    },
    onError: () => {
      toast.error('操作に失敗しました');
    },
  });

  const handleToggle = () => {
    mutation.mutate({
      path: { id: billingRecordId },
      body: { status: isConfirmed ? 'unconfirmed' : 'confirmed' },
    });
    setConfirmDialogOpen(false);
  };

  return (
    <Card
      className={`gap-0 py-0 ${
        isConfirmed ? 'border-success/30 bg-success/15' : 'border-warning/30 bg-warning/15'
      }`}
    >
      <div className="flex items-center gap-4 px-6 py-4">
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
            isConfirmed ? 'bg-success/15' : 'bg-warning/15'
          }`}
        >
          {isConfirmed ? (
            <CheckCircle2 className="text-success size-4" />
          ) : (
            <AlertTriangle className="text-warning size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${isConfirmed ? 'text-success' : 'text-warning'}`}>
            {isConfirmed ? '確定済み' : '未確定'}
          </p>
          <p className="text-muted-foreground text-xs">確定すると変更が不可になります</p>
          {isConfirmed && confirmedBy && (
            <p className="text-muted-foreground text-xs">
              確定者: {confirmedBy}
              {confirmedAt && <> / {formatDateYYYYMMDD_HHMM(confirmedAt)}</>}
            </p>
          )}
        </div>
        <RoleGatedButton
          requiredPermission={Permission.SalesConfirm}
          denyTooltip="請求確定の権限がありません"
          variant={isConfirmed ? 'outline' : 'default'}
          size="sm"
          className="h-8 shrink-0 gap-2 text-xs"
          disabled={mutation.isPending}
          onClick={() => setConfirmDialogOpen(true)}
        >
          {isConfirmed ? (
            <>
              <Unlock className="size-3" />
              未確定に戻す
            </>
          ) : (
            <>
              <Lock className="size-3" />
              この請求を確定する
            </>
          )}
        </RoleGatedButton>
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-warning size-5" />
              {isConfirmed ? '請求を未確定に戻す' : '請求を確定'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isConfirmed
                ? '確定済みの請求を未確定に戻します。未確定に戻した後は、再度確定操作を実行する必要があります。'
                : '確定後は請求明細の追加・変更ができなくなります。'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {isConfirmed ? (
            <Alert className="bg-destructive/15 border-destructive/20 text-destructive">
              <AlertTriangle className="size-4" />
              <AlertDescription className="text-xs">
                決済事業者への送信が完了している場合、別途決済事業者への取消処理が必要になります。
              </AlertDescription>
            </Alert>
          ) : (
            <div className="bg-muted/50 space-y-2 rounded-lg border p-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">請求ID</span>
                <span className="font-mono font-medium">{billingRecordId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">利用者</span>
                <span className="font-medium">{memberName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">請求日</span>
                <span className="font-medium">{billingDate}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">請求総額</span>
                <span className="font-bold">¥{billedAmount.toLocaleString('ja-JP')}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle} disabled={mutation.isPending}>
              {isConfirmed ? '未確定に戻す' : '確定する'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
