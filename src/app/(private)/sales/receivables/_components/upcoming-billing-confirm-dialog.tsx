'use client';

// Client component: dialog is opened from client state and requires React Query hooks.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  getCrmBillingRecordsUpcomingBillingOptions,
  getCrmBillingRecordsUpcomingBillingQueryKey,
  patchCrmBillingRecordsConfirmMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { UpcomingBillingSummary } from '@/lib/api/types.gen';

function formatYen(amount: number): string {
  return amount.toLocaleString('ja-JP');
}

interface UpcomingBillingConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: UpcomingBillingSummary | undefined;
}

export function UpcomingBillingConfirmDialog({
  open,
  onOpenChange,
  summary,
}: Readonly<UpcomingBillingConfirmDialogProps>) {
  const queryClient = useQueryClient();

  // Fetch the full unconfirmed set (up to the API's max page size) only while the dialog is
  // open, so "confirm all" targets every unconfirmed entry in scope, not just the current page.
  const { data: fullData, isFetching: isFetchingIds } = useQuery({
    ...getCrmBillingRecordsUpcomingBillingOptions({ query: { page: 1, page_size: 200 } }),
    enabled: open,
  });

  const mutation = useMutation({
    ...patchCrmBillingRecordsConfirmMutation(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: getCrmBillingRecordsUpcomingBillingQueryKey() });
      toast.success(`${result.confirmed_ids.length}件を確定しました`);
      onOpenChange(false);
    },
    onError: () => {
      toast.error('請求確定に失敗しました');
    },
  });

  const ids = fullData?.items.map((item) => item.billing_record_id) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base">請求を確定する</DialogTitle>
          <DialogDescription>以下の内容で請求を確定します。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 space-y-2 rounded-md p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">対象件数</span>
              <span className="font-semibold tabular-nums">{summary?.total_count ?? 0}件</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">合計金額</span>
              <span className="font-semibold tabular-nums">
                ¥{formatYen(summary?.total_amount ?? 0)}
              </span>
            </div>
            <div className="mt-2 space-y-1 border-t pt-2">
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>SBPS（{summary?.sbps_count ?? 0}件）</span>
                <span className="tabular-nums">¥{formatYen(summary?.sbps_amount ?? 0)}</span>
              </div>
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>JACCS（{summary?.jaccs_count ?? 0}件）</span>
                <span className="tabular-nums">¥{formatYen(summary?.jaccs_amount ?? 0)}</span>
              </div>
            </div>
          </div>
          <p className="text-destructive text-xs">
            ※ 確定後は変更できません。内容を十分にご確認ください。
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            disabled={ids.length === 0 || isFetchingIds || mutation.isPending}
            onClick={() => mutation.mutate({ body: { ids } })}
          >
            <Lock className="mr-2 size-4" />
            確定する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
