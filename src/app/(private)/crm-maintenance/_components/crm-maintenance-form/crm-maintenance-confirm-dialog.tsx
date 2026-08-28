'use client';

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

import type { CrmMaintenanceFormMode } from '../../_schemas/crm-maintenance-form.schema';

interface CrmMaintenanceConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CrmMaintenanceFormMode;
  summary: { title: string; period: string; allowedUserCount: number };
  onConfirm: () => void;
  isPending: boolean;
}

export function CrmMaintenanceConfirmDialog({
  open,
  onOpenChange,
  mode,
  summary,
  onConfirm,
  isPending,
}: CrmMaintenanceConfirmDialogProps) {
  const isEdit = mode === 'edit';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isEdit ? '変更内容を保存しますか？' : '以下の内容で登録しますか？'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            以下の内容で{isEdit ? '更新' : '登録'}します。内容をご確認ください。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-muted/40 flex flex-col gap-2 rounded-md border p-3">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0 text-xs">タイトル</span>
            <span className="text-xs font-medium">{summary.title || '（未入力）'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0 text-xs">期間</span>
            <span className="text-xs font-medium">{summary.period || '（未設定）'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0 text-xs">許可ユーザー</span>
            <span className="text-xs font-medium">{summary.allowedUserCount}名</span>
          </div>
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
            {isEdit ? '更新を確定する' : '登録を確定する'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
