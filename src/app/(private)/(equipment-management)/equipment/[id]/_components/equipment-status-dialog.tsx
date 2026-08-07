'use client';

import { useMemo, useState } from 'react';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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

import {
  getCrmEquipmentByIdQueryKey,
  postCrmEquipmentBulkStatusMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmEquipmentByIdResponse } from '@/lib/api/types.gen';

import {
  EQUIPMENT_STATUS_BADGE_MAP,
  EQUIPMENT_STATUS_LABELS,
  type EquipmentStatus,
} from '../../_constants/constants';

type EquipmentDetail = NonNullable<GetCrmEquipmentByIdResponse>['equipment'];

const ALL_STATUSES: EquipmentStatus[] = ['normal', 'error', 'maintenance', 'discarded'];

interface EquipmentStatusDialogProps {
  equipment: EquipmentDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EquipmentStatusDialog({
  equipment,
  open,
  onOpenChange,
}: EquipmentStatusDialogProps) {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState<EquipmentStatus | ''>('');
  const [changeReason, setChangeReason] = useState('');

  const statusOptions = useMemo(
    () => ALL_STATUSES.filter((status) => status !== equipment.status),
    [equipment.status],
  );

  const currentStatusBadge = EQUIPMENT_STATUS_BADGE_MAP[equipment.status];
  const isDiscard = newStatus === 'discarded';

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setNewStatus('');
      setChangeReason('');
    }
    onOpenChange(nextOpen);
  };

  const statusMutation = useMutation({
    ...postCrmEquipmentBulkStatusMutation(),
    onSuccess: (data) => {
      if (!data.success) {
        toast.error('ステータス変更に失敗しました');
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: getCrmEquipmentByIdQueryKey({ path: { id: equipment.id } }),
      });
      toast.success('ステータスを変更しました');
      handleOpenChange(false);
    },
    onError: () => {
      toast.error('ステータス変更に失敗しました');
    },
  });

  const handleSubmit = () => {
    if (!newStatus) return;

    statusMutation.mutate({
      body: {
        ids: [equipment.id],
        status: newStatus,
        change_reason: changeReason.trim() || undefined,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ステータス変更</DialogTitle>
          <DialogDescription>接続機器のステータスを変更します。</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">接続機器名</p>
                <p className="text-sm font-medium">{equipment.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">現在のステータス</p>
                <Badge variant="outline" className={currentStatusBadge.badgeClassName}>
                  <span className={`size-1.5 rounded-full ${currentStatusBadge.dotClassName}`} />
                  {EQUIPMENT_STATUS_LABELS[equipment.status]}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>新しいステータス</Label>
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
                {statusOptions.map((status) => {
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

          {isDiscard ? (
            <div className="bg-destructive/10 border-destructive/20 rounded-md border px-3 py-2">
              <p className="text-destructive text-xs font-medium">
                廃棄への変更は取り消しが困難です
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                廃棄に変更すると機器の利用制御が停止されます。
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label>
              変更理由
              <span className="text-muted-foreground ml-1 text-xs font-normal">任意</span>
            </Label>
            <Textarea
              placeholder="変更理由や作業内容を入力"
              rows={3}
              maxLength={TEXTAREA_MAX_LENGTH}
              value={changeReason}
              onChange={(event) => setChangeReason(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={statusMutation.isPending}
          >
            キャンセル
          </Button>
          <Button
            className={
              isDiscard ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''
            }
            disabled={!newStatus || statusMutation.isPending}
            onClick={handleSubmit}
          >
            {statusMutation.isPending ? '保存中...' : isDiscard ? '廃棄する' : '変更を保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
