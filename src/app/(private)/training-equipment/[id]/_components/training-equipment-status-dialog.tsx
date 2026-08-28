'use client';

import { useEffect, useState } from 'react';

import { RequiredMark } from '@/components/common/field-marker';
import { Badge } from '@/components/ui/badge';
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

import type { InstallationStatus, TrainingEquipmentDetail } from '@/lib/api/types.gen';

import {
  INSTALLATION_STATUS_LABELS,
  TRAINING_EQUIPMENT_CHANGED_REASON_MAX_LENGTH,
} from '../../_constants/training-equipment.constants';
import { useSubmitGuard } from '../../_hooks/use-submit-guard.hook';
import {
  getInstallationStatusBadgeClass,
  getInstallationStatusDotClass,
} from '../../_utils/training-equipment-display.util';

type TrainingEquipmentStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: TrainingEquipmentDetail;
  isSubmitting?: boolean;
  /** Lets the double-submit guard reopen so a failed update can be retried. */
  isSubmitError?: boolean;
  onSubmit: (payload: { newStatus: InstallationStatus; changedReason: string }) => void;
};

/**
 * FR-007: the reason is required; the update cannot proceed without it.
 * The current status is left out of the options because it is not a transition (and leaves no history).
 */
export function TrainingEquipmentStatusDialog({
  open,
  onOpenChange,
  equipment,
  isSubmitting = false,
  isSubmitError = false,
  onSubmit,
}: TrainingEquipmentStatusDialogProps) {
  const [newStatus, setNewStatus] = useState<InstallationStatus | ''>('');
  const [changedReason, setChangedReason] = useState('');
  const [errors, setErrors] = useState<{ newStatus?: string; changedReason?: string }>({});
  const { submitOnce, resetSubmitGuard } = useSubmitGuard(isSubmitting, isSubmitError);

  // The parent closes the dialog on success without going through `handleOpenChange`, so the guard
  // is reopened here when the dialog is shown again.
  useEffect(() => {
    if (open) resetSubmitGuard();
  }, [open, resetSubmitGuard]);

  const statusOptions = (
    Object.entries(INSTALLATION_STATUS_LABELS) as Array<[InstallationStatus, string]>
  ).filter(([value]) => value !== equipment.installationStatus);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setNewStatus('');
      setChangedReason('');
      setErrors({});
    }
    resetSubmitGuard();
    onOpenChange(next);
  };

  const handleSubmit = () => {
    const nextErrors: typeof errors = {};
    if (!newStatus) nextErrors.newStatus = '新しい設置状態を選択してください';
    if (!changedReason.trim()) {
      nextErrors.changedReason = '変更理由が未入力の場合は更新できません';
    }
    setErrors(nextErrors);
    if (!newStatus || Object.keys(nextErrors).length > 0) return;

    submitOnce(() => onSubmit({ newStatus, changedReason: changedReason.trim() }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle className="text-base">設置状態変更</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 rounded-md p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground text-xs">機材ID</p>
                <p className="text-sm font-medium">{equipment.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">機材名</p>
                <p className="text-sm font-medium">{equipment.name}</p>
              </div>
            </div>
          </div>

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
                {statusOptions.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <Badge
                      variant="outline"
                      className={`gap-1 text-xs font-medium ${getInstallationStatusBadgeClass(value)}`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${getInstallationStatusDotClass(value)}`}
                      />
                      {label}
                    </Badge>
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
              value={changedReason}
              onChange={(event) => {
                setChangedReason(event.target.value);
                if (event.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, changedReason: undefined }));
                }
              }}
              placeholder="変更理由や対応内容を記入"
              className="min-h-20 resize-none"
              maxLength={TRAINING_EQUIPMENT_CHANGED_REASON_MAX_LENGTH}
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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : '変更を保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
