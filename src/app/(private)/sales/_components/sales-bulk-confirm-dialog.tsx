'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import type { BillingRecordListItem } from '@/lib/api';
import {
  getCrmBillingRecordsQueryKey,
  getCrmBillingRecordsRefundRequestsQueryKey,
  getCrmBillingRecordsSummaryQueryKey,
  patchCrmBillingRecordsConfirmMutation,
} from '@/lib/api/@tanstack/react-query.gen';

interface SalesBulkConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  unconfirmedSelectedRecords: BillingRecordListItem[];
  onSuccess?: () => void;
}

export function SalesBulkConfirmDialog({
  open,
  onOpenChange,
  selectedIds,
  unconfirmedSelectedRecords,
  onSuccess,
}: Readonly<SalesBulkConfirmDialogProps>) {
  const queryClient = useQueryClient();

  const confirmMutation = useMutation({
    ...patchCrmBillingRecordsConfirmMutation(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: getCrmBillingRecordsQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmBillingRecordsSummaryQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmBillingRecordsRefundRequestsQueryKey(),
      });
      toast.success(`${result.confirmed_ids.length}件を確定しました`);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => {
      toast.error('確定に失敗しました');
    },
  });

  const unconfirmedSelectedTotal = unconfirmedSelectedRecords.reduce(
    (sum, item) => sum + item.billed_amount,
    0,
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="bg-warning/15 flex size-8 items-center justify-center rounded-full">
              <Lock className="text-warning size-4" />
            </span>
            選択した売上を一括確定しますか？
          </AlertDialogTitle>
          <AlertDialogDescription>
            対象の売上を一括確定します。確定後は明細の追加・変更ができなくなります。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="bg-muted/50 space-y-2 rounded-lg border p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">選択件数</span>
            <span className="tabular-nums">{selectedIds.length}件</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">確定対象</span>
            <span className="tabular-nums">{unconfirmedSelectedRecords.length}件</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>売上合計</span>
            <span className="tabular-nums">
              ¥{unconfirmedSelectedTotal.toLocaleString('ja-JP')}
            </span>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={confirmMutation.isPending}
            onClick={() => confirmMutation.mutate({ body: { ids: selectedIds } })}
          >
            確定する
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
