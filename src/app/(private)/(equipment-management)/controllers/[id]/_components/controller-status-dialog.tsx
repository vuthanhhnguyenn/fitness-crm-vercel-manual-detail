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
  getCrmControllersByIdQueryKey,
  getCrmControllersQueryKey,
  patchCrmControllersByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmControllersByIdResponse } from '@/lib/api/types.gen';

import {
  CONTROLLER_STATUS_BADGE_MAP,
  CONTROLLER_STATUS_LABELS,
  CONTROLLER_STATUS_VALUES,
  type ControllerStatus,
} from '../../_constants/constants';

const CHANGE_TYPE_OPTIONS = ['ステータス変更', '故障報告', '点検完了'] as const;

type ControllerDetail = NonNullable<GetCrmControllersByIdResponse>;

interface ControllerStatusDialogProps {
  controller: ControllerDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ControllerStatusDialog({
  controller,
  open,
  onOpenChange,
}: ControllerStatusDialogProps) {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState<ControllerStatus | ''>('');
  const [changeType, setChangeType] = useState<string>('ステータス変更');
  const [memo, setMemo] = useState('');

  const statusOptions = useMemo(
    () => CONTROLLER_STATUS_VALUES.filter((status) => status !== controller.status),
    [controller.status],
  );

  const currentStatusBadge = CONTROLLER_STATUS_BADGE_MAP[controller.status];
  const isDiscard = newStatus === 'discarded';

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setNewStatus('');
      setChangeType('ステータス変更');
      setMemo('');
    }
    onOpenChange(nextOpen);
  };

  const statusMutation = useMutation({
    ...patchCrmControllersByIdMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getCrmControllersByIdQueryKey({ path: { id: controller.controller_id } }),
      });
      void queryClient.invalidateQueries({ queryKey: getCrmControllersQueryKey() });
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
      path: { id: controller.controller_id },
      body: { status: newStatus },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ステータス変更</DialogTitle>
          <DialogDescription>接点制御装置のステータスを変更します。</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">装置名</p>
                <p className="text-sm font-medium">{controller.name ?? controller.controller_id}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">現在のステータス</p>
                <Badge variant="outline" className={currentStatusBadge.badgeClassName}>
                  <span className={`size-1.5 rounded-full ${currentStatusBadge.dotClassName}`} />
                  {CONTROLLER_STATUS_LABELS[controller.status]}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>変更種別</Label>
            <Select value={changeType} onValueChange={(value) => setChangeType(value ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="種別を選択" />
              </SelectTrigger>
              <SelectContent>
                {CHANGE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>新しいステータス</Label>
            <Select
              value={newStatus}
              onValueChange={(value) => setNewStatus(value as ControllerStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="ステータスを選択">
                  {newStatus ? CONTROLLER_STATUS_LABELS[newStatus] : 'ステータスを選択'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => {
                  const statusBadge = CONTROLLER_STATUS_BADGE_MAP[status];

                  return (
                    <SelectItem key={status} value={status}>
                      <span className="inline-flex items-center gap-2">
                        <span className={`size-1.5 rounded-full ${statusBadge.dotClassName}`} />
                        {CONTROLLER_STATUS_LABELS[status]}
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
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label>
              メモ
              <span className="text-muted-foreground ml-1 text-xs font-normal">任意</span>
            </Label>
            <Textarea
              placeholder="変更理由や作業内容を入力"
              rows={3}
              maxLength={TEXTAREA_MAX_LENGTH}
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
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
