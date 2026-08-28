'use client';

import { formatDatetimeISO } from '@/utils/format.util';

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

import type { CrmMaintenanceDetailResponse } from '@/lib/api/types.gen';

interface CrmMaintenanceNotifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance: Pick<CrmMaintenanceDetailResponse, 'title' | 'startsAt' | 'endsAt' | 'message'>;
  onConfirm: () => void;
  isPending: boolean;
}

export function CrmMaintenanceNotifyDialog({
  open,
  onOpenChange,
  maintenance,
  onConfirm,
  isPending,
}: CrmMaintenanceNotifyDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>メンテナンス予定を通知しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            対象CRMユーザーに、以下の内容を通知します。
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* 通知内容プレビュー (登録情報の再利用) */}
        <div className="bg-muted/40 flex flex-col gap-2 rounded-md border p-3">
          <div>
            <p className="text-muted-foreground mb-0.5 text-xs">タイトル</p>
            <p className="text-sm font-medium">{maintenance.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground mb-0.5 text-xs">開始日時</p>
              <p className="text-sm">{formatDatetimeISO(maintenance.startsAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 text-xs">終了日時</p>
              <p className="text-sm">{formatDatetimeISO(maintenance.endsAt)}</p>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5 text-xs">メンテナンスメッセージ</p>
            <p className="text-sm whitespace-pre-wrap">{maintenance.message}</p>
          </div>
          <p className="text-muted-foreground border-t pt-2 text-xs">
            ※アクセスを許可されたユーザーには「メンテナンス中もアクセス可能」である旨が追記されます。
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? '送信中...' : '通知を送信する'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
