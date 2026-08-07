'use client';

import { useMemo, useState } from 'react';

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

import type { TrainingEquipmentItem } from '@/lib/api/types.gen';

import { TRAINING_EQUIPMENT_STATUS_LABELS } from '../../_constants/training-equipment.constants';
import {
  getTrainingEquipmentStatusBadgeClass,
  getTrainingEquipmentStatusDotClass,
} from '../../_utils/training-equipment-display.util';

type TrainingEquipmentStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: TrainingEquipmentItem;
  isSubmitting?: boolean;
  onSubmit: (payload: { next_status: TrainingEquipmentItem['status']; reason: string }) => void;
};

export function TrainingEquipmentStatusDialog({
  open,
  onOpenChange,
  equipment,
  isSubmitting = false,
  onSubmit,
}: TrainingEquipmentStatusDialogProps) {
  const [nextStatus, setNextStatus] = useState<TrainingEquipmentItem['status'] | ''>('');
  const [reason, setReason] = useState('');
  const canSubmit = useMemo(
    () => Boolean(nextStatus) && reason.trim().length > 0,
    [nextStatus, reason],
  );
  const reset = () => {
    setNextStatus('');
    setReason('');
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = () => {
    if (!nextStatus || !canSubmit) return;
    onSubmit({ next_status: nextStatus, reason: reason.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base">ステータス変更</DialogTitle>
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
            <Label className="mb-2 block text-xs font-medium">新しいステータス</Label>
            <Select
              value={nextStatus}
              onValueChange={(value) => setNextStatus(value as TrainingEquipmentItem['status'])}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="選択してください">
                  {nextStatus ? TRAINING_EQUIPMENT_STATUS_LABELS[nextStatus] : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TRAINING_EQUIPMENT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <Badge
                      variant="outline"
                      className={`gap-1 text-xs font-medium ${getTrainingEquipmentStatusBadgeClass(value as TrainingEquipmentItem['status'])}`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${getTrainingEquipmentStatusDotClass(value as TrainingEquipmentItem['status'])}`}
                      />
                      {label}
                    </Badge>
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
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="変更理由や対応内容を記入"
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            変更を保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
