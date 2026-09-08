'use client';

import { type ReactNode, useRef, useState } from 'react';

import { X } from 'lucide-react';

import { RequiredMark } from '@/components/common/field-marker';
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
  type ManualNotificationReturnReason,
  manualNotificationReturnReasonSchema,
} from '../_schemas/manual-notification-action.schema';

interface ManualNotificationReturnDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly inputId: string;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly placeholder: string;
  readonly helperText?: ReactNode;
  readonly confirmLabel: string;
  readonly isPending: boolean;
  readonly onConfirm: (reason: ManualNotificationReturnReason) => void;
  readonly showCloseButton?: boolean;
  readonly contentClassName?: string;
  readonly headerClassName?: string;
  readonly labelClassName?: string;
  readonly confirmClassName?: string;
}

export function ManualNotificationReturnDialog({
  open,
  onOpenChange,
  inputId,
  title,
  description,
  placeholder,
  helperText,
  confirmLabel,
  isPending,
  onConfirm,
  showCloseButton = false,
  contentClassName,
  headerClassName,
  labelClassName,
  confirmClassName,
}: ManualNotificationReturnDialogProps) {
  const [returnReason, setReturnReason] = useState('');
  const [returnError, setReturnError] = useState<string | null>(null);
  const returnReasonRef = useRef<HTMLTextAreaElement>(null);
  const errorId = `${inputId}-error`;

  const handleConfirm = () => {
    const result = manualNotificationReturnReasonSchema.safeParse(returnReason);
    if (!result.success) {
      setReturnError(result.error.issues[0]?.message ?? '差し戻し理由を入力してください');
      returnReasonRef.current?.focus();
      return;
    }

    onConfirm(result.data);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={contentClassName}>
        <AlertDialogHeader className={headerClassName}>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
          {showCloseButton ? (
            <button
              type="button"
              aria-label="閉じる"
              className="text-muted-foreground hover:text-foreground absolute top-0 right-0 rounded-md p-1 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
            </button>
          ) : null}
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor={inputId} className={labelClassName}>
            差し戻し理由
            <span aria-hidden="true">
              <RequiredMark />
            </span>
          </Label>
          <Textarea
            id={inputId}
            value={returnReason}
            onChange={(event) => {
              setReturnReason(event.target.value);
              if (returnError) setReturnError(null);
            }}
            placeholder={placeholder}
            rows={3}
            className="min-h-16 resize-none"
            maxLength={500}
            ref={returnReasonRef}
            aria-invalid={returnError ? true : undefined}
            aria-describedby={returnError ? errorId : undefined}
          />
          {returnError ? (
            <p id={errorId} className="text-destructive text-xs">
              {returnError}
            </p>
          ) : null}
          {helperText ? <p className="text-muted-foreground text-xs">{helperText}</p> : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className={confirmClassName}
            disabled={isPending}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
