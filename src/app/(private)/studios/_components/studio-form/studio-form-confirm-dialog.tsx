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

import type { StudioFormMode, StudioFormValues } from '../studio-form.schema';

interface StudioFormConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: StudioFormMode;
  values: Partial<StudioFormValues>;
  storeName?: string;
  onConfirm: () => void;
}

const MODE_LABELS: Record<StudioFormMode, { title: string; confirmLabel: string }> = {
  create: {
    title: '以下の内容で登録します。よろしいですか？',
    confirmLabel: 'この内容で登録する',
  },
  edit: {
    title: 'この内容で変更を保存しますか？',
    confirmLabel: 'この内容で保存する',
  },
};

const STUDIO_TYPE_LABELS: Record<string, string> = {
  normal: 'ノーマル',
  hot_yoga: 'ホットヨガ',
  virtual: 'バーチャル',
};

export function StudioFormConfirmDialog({
  open,
  onOpenChange,
  mode,
  values,
  storeName,
  onConfirm,
}: StudioFormConfirmDialogProps) {
  const labels = MODE_LABELS[mode];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.title}</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">保存内容の確認</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-left">
            <span className="text-muted-foreground text-sm">スタジオ名</span>
            <span className="text-sm">{values.name || '（未入力）'}</span>
            <span className="text-muted-foreground text-sm">所属店舗</span>
            <span className="text-sm">{storeName || '（未選択）'}</span>
            <span className="text-muted-foreground text-sm">スタジオ区分</span>
            <span className="text-sm">
              {values.studioType ? STUDIO_TYPE_LABELS[values.studioType] : '（未選択）'}
            </span>
            <span className="text-muted-foreground text-sm">物理定員</span>
            <span className="text-sm">
              {values.capacity ? `${values.capacity}名` : '（未入力）'}
            </span>
            <span className="text-muted-foreground text-sm">バッファ値</span>
            <span className="text-sm">
              {values.bufferValue !== undefined ? `${values.bufferValue}名` : '（未入力）'}
            </span>
            <span className="text-muted-foreground text-sm">利用可能時間</span>
            <span className="text-sm">{values.operatingHours || '（未入力）'}</span>
            <span className="text-muted-foreground text-sm">ステータス</span>
            <span className="text-sm">{values.status === 'inactive' ? '無効' : '有効'}</span>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{labels.confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
