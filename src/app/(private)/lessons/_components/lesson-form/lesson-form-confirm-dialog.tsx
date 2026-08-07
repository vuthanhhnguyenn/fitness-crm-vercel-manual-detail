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

import type { LessonFormMode, LessonFormValues } from '../../_schemas/lesson-form.schema';

interface LessonFormConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: LessonFormMode;
  values: Partial<LessonFormValues>;
  onConfirm: () => void;
}

const MODE_LABELS: Record<LessonFormMode, { title: string; confirmLabel: string }> = {
  create: {
    title: '以下の内容で登録します。よろしいですか？',
    confirmLabel: 'この内容で登録する',
  },
  edit: {
    title: 'この内容で変更を保存しますか？',
    confirmLabel: 'この内容で保存する',
  },
  duplicate: {
    title: '以下の内容で登録します。よろしいですか？',
    confirmLabel: 'この内容で登録する',
  },
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  studio: 'スタジオレッスン',
  personal: 'パーソナルトレーニング',
  bodycare: 'ボディケア',
};

const PRICING_LABELS: Record<string, string> = {
  free: '無料',
  monthly: '有料（月払）',
  per_use: '有料（都次）',
};

export function LessonFormConfirmDialog({
  open,
  onOpenChange,
  mode,
  values,
  onConfirm,
}: LessonFormConfirmDialogProps) {
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
            <span className="text-muted-foreground text-sm">レッスン区分</span>
            <span className="text-sm">{LESSON_TYPE_LABELS[values.lessonType ?? 'studio']}</span>
            <span className="text-muted-foreground text-sm">レッスン名</span>
            <span className="text-sm">{values.name || '（未入力）'}</span>
            <span className="text-muted-foreground text-sm">料金種別</span>
            <span className="text-sm">{PRICING_LABELS[values.pricingType ?? 'free']}</span>
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
