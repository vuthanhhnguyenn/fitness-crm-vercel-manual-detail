'use client';

import { useEffect, useState } from 'react';

import { RequiredMark } from '@/components/common/field-marker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import type { InstallationStatus } from '@/lib/api/types.gen';

import {
  INSTALLATION_STATUS_LABELS,
  TRAINING_EQUIPMENT_CHANGED_REASON_MAX_LENGTH,
} from '../_constants/training-equipment.constants';
import { useSubmitGuard } from '../_hooks/use-submit-guard.hook';

type TrainingEquipmentBulkStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  isSubmitting: boolean;
  /** Lets the double-submit guard reopen so a failed update can be retried. */
  isSubmitError?: boolean;
  onSubmit: (payload: { newStatus: InstallationStatus; changedReason: string }) => void;
};

/**
 * FR-009: a required reason is entered before the bulk update; it applies to every selected record.
 * As in the single status-change dialog, the button stays clickable and a missing reason shows an
 * inline error message (rather than a disabled button whose reason is unclear).
 */
export function TrainingEquipmentBulkStatusDialog({
  open,
  onOpenChange,
  selectedCount,
  isSubmitting,
  isSubmitError = false,
  onSubmit,
}: TrainingEquipmentBulkStatusDialogProps) {
  const [newStatus, setNewStatus] = useState<InstallationStatus | ''>('');
  const [changedReason, setChangedReason] = useState('');
  const [errors, setErrors] = useState<{ newStatus?: string; changedReason?: string }>({});
  const { submitOnce, resetSubmitGuard } = useSubmitGuard(isSubmitting, isSubmitError);

  // The parent closes the dialog on success without going through `handleOpenChange`, so the guard
  // is reopened here when the dialog is shown again.
  useEffect(() => {
    if (open) resetSubmitGuard();
  }, [open, resetSubmitGuard]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setNewStatus('');
      setChangedReason('');
      setErrors({});
    }
    resetSubmitGuard();
    onOpenChange(nextOpen);
  };

  const handleSubmit = () => {
    const nextErrors: typeof errors = {};
    if (!newStatus) nextErrors.newStatus = '新しい設置状態を選択してください';
    if (!changedReason.trim()) {
      nextErrors.changedReason = '変更理由を入力してください（未入力の場合は更新できません）';
    }
    setErrors(nextErrors);
    if (!newStatus || Object.keys(nextErrors).length > 0) return;

    submitOnce(() => onSubmit({ newStatus, changedReason: changedReason.trim() }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle className="text-base">一括設置状態変更</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-muted-foreground text-sm">
            選択中の <strong className="text-foreground">{selectedCount}件</strong>{' '}
            の機材の設置状態を一括変更します。
          </p>
          <div>
            <Label className="mb-2 block text-xs font-medium">
              新しい設置状態
              <RequiredMark />
            </Label>
            <Select
              value={newStatus}
              onValueChange={(value) => {
                setNewStatus(value as InstallationStatus);
                setErrors((prev) => ({ ...prev, newStatus: undefined }));
              }}
            >
              <SelectTrigger className="h-9" aria-invalid={Boolean(errors.newStatus)}>
                <SelectValue placeholder="選択してください">
                  {newStatus ? INSTALLATION_STATUS_LABELS[newStatus] : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INSTALLATION_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.newStatus && (
              <p className="text-destructive mt-1 text-xs">{errors.newStatus}</p>
            )}
          </div>
          <div>
            <Label className="mb-2 block text-xs font-medium">
              変更理由
              <RequiredMark />
            </Label>
            <Textarea
              placeholder="変更理由や対応内容を記入"
              className="min-h-20 resize-none"
              maxLength={TRAINING_EQUIPMENT_CHANGED_REASON_MAX_LENGTH}
              value={changedReason}
              onChange={(event) => {
                setChangedReason(event.target.value);
                if (event.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, changedReason: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.changedReason)}
            />
            {errors.changedReason && (
              <p className="text-destructive mt-1 text-xs">{errors.changedReason}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? '保存中...' : '変更を適用'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
