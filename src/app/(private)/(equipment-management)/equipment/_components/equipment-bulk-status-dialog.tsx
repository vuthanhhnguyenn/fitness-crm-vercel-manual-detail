'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

import type { EquipmentStatus } from '../_constants/constants';
import { EQUIPMENT_STATUS_BADGE_MAP, EQUIPMENT_STATUS_LABELS } from '../_constants/constants';

const STATUS_OPTIONS: EquipmentStatus[] = ['normal', 'error', 'maintenance', 'discarded'];

interface EquipmentBulkStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  isSubmitting: boolean;
  onSubmit: (payload: { status: EquipmentStatus; changeReason?: string }) => void;
}

export function EquipmentBulkStatusDialog({
  open,
  onOpenChange,
  selectedCount,
  isSubmitting,
  onSubmit,
}: EquipmentBulkStatusDialogProps) {
  const [newStatus, setNewStatus] = useState<EquipmentStatus | ''>('');
  const [changeReason, setChangeReason] = useState('');
  const isDiscard = newStatus === 'discarded';

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setNewStatus('');
      setChangeReason('');
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = () => {
    if (!newStatus) return;

    onSubmit({
      status: newStatus,
      changeReason: changeReason.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>一括状態変更</DialogTitle>
          <DialogDescription>
            選択中 {selectedCount} 件の接続機器のステータスを変更します。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>変更先ステータス</Label>
            <Select
              value={newStatus}
              onValueChange={(value) => setNewStatus(value as EquipmentStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="ステータスを選択">
                  {newStatus ? EQUIPMENT_STATUS_LABELS[newStatus] : 'ステータスを選択'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => {
                  const statusBadge = EQUIPMENT_STATUS_BADGE_MAP[status];

                  return (
                    <SelectItem key={status} value={status}>
                      <span className="inline-flex items-center gap-2">
                        <span className={`size-1.5 rounded-full ${statusBadge.dotClassName}`} />
                        {EQUIPMENT_STATUS_LABELS[status]}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {isDiscard && (
            <div className="bg-destructive/10 border-destructive/20 rounded-md border px-3 py-2">
              <p className="text-destructive text-xs font-medium">
                廃棄への変更は取り消しが困難です
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                廃棄に変更すると機器の利用制御が停止されます。
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>
              変更理由
              <span className="text-muted-foreground ml-1 text-xs font-normal">任意</span>
            </Label>
            <Textarea
              placeholder="変更理由や作業内容を入力"
              rows={3}
              value={changeReason}
              onChange={(event) => setChangeReason(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button
            className={
              isDiscard ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''
            }
            disabled={!newStatus || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? '保存中...' : isDiscard ? '廃棄する' : '変更を保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
