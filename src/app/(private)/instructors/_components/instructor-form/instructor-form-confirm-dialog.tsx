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

import { joinFullName } from '../instructor-form.schema';
import type { InstructorFormMode, InstructorFormValues } from '../instructor-form.schema';

interface InstructorFormConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: InstructorFormMode;
  values: Partial<InstructorFormValues>;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const MODE_LABELS: Record<InstructorFormMode, { title: string; confirmLabel: string }> = {
  create: { title: '以下の内容で登録します。よろしいですか？', confirmLabel: 'この内容で登録する' },
  edit: { title: '以下の内容で保存します。よろしいですか？', confirmLabel: 'この内容で保存する' },
};

const ROLE_LABELS: Record<string, string> = {
  trainer: 'トレーナー',
  instructor: 'インストラクター',
  body_care_therapist: 'ボディケアセラピスト',
};

export function InstructorFormConfirmDialog({
  open,
  onOpenChange,
  mode,
  values,
  onConfirm,
  isSubmitting = false,
}: Readonly<InstructorFormConfirmDialogProps>) {
  const labels = MODE_LABELS[mode];
  const fullName = joinFullName(values.lastName ?? '', values.firstName ?? '');
  const roleLabel = (values.roleClassifications ?? []).map((r) => ROLE_LABELS[r] ?? r).join('、');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.title}</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">保存内容の確認</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-left">
            <span className="text-muted-foreground text-sm">氏名</span>
            <span className="text-sm">{fullName || '（未入力）'}</span>
            <span className="text-muted-foreground text-sm">ニックネーム</span>
            <span className="text-sm">{values.nickname || '（未入力）'}</span>
            <span className="text-muted-foreground text-sm">役割区分</span>
            <span className="text-sm">{roleLabel || '（未選択）'}</span>
            {values.crmAccountLinkStaffName && (
              <>
                <span className="text-muted-foreground text-sm">CRMアカウント紐づけ</span>
                <span className="text-sm">{values.crmAccountLinkStaffName}</span>
              </>
            )}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSubmitting}>
            {labels.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
