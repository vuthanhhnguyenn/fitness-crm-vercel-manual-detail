'use client';

import { useMemo, useState } from 'react';

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

import type { TrainingEquipmentItem } from '@/lib/api/types.gen';

import {
  TRAINING_EQUIPMENT_STATUS_LABELS,
  type TrainingEquipmentStatus,
} from '../_constants/training-equipment.constants';

type TrainingEquipmentBulkStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  isSubmitting: boolean;
  onSubmit: (payload: { next_status: TrainingEquipmentItem['status']; reason: string }) => void;
};

export function TrainingEquipmentBulkStatusDialog({
  open,
  onOpenChange,
  selectedCount,
  isSubmitting,
  onSubmit,
}: TrainingEquipmentBulkStatusDialogProps) {
  const [nextStatus, setNextStatus] = useState<TrainingEquipmentStatus | ''>('');
  const [reason, setReason] = useState('');
  const canSubmit = useMemo(
    () => Boolean(nextStatus) && reason.trim().length > 0,
    [nextStatus, reason],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setNextStatus('');
      setReason('');
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = () => {
    if (!nextStatus || !canSubmit) return;
    onSubmit({
      next_status: nextStatus,
      reason: reason.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-base">一括設置状態変更</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-muted-foreground text-sm">
            選択中の <strong className="text-foreground">{selectedCount}件</strong>{' '}
            の機材の設置状態を一括変更します。
          </p>
          <div>
            <Label className="mb-2 block text-xs font-medium">新しい設置状態</Label>
            <Select
              value={nextStatus}
              onValueChange={(value) => setNextStatus(value as TrainingEquipmentStatus)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="選択してください">
                  {nextStatus ? TRAINING_EQUIPMENT_STATUS_LABELS[nextStatus] : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TRAINING_EQUIPMENT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block text-xs font-medium">
              変更理由
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Textarea
              placeholder="変更理由や対応内容を記入"
              className="min-h-[80px] resize-none"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button disabled={!canSubmit || isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? '保存中...' : '変更を適用'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
