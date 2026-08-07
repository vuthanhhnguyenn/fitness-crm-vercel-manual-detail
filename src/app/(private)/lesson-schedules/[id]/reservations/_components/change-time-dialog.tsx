'use client';

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmLessonSchedulesQueryKey,
  patchCrmLessonSchedulesByScheduleIdTimeChangeMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { LessonScheduleListItem } from '@/lib/api/types.gen';

import { toTimeSlot } from '../../../_components/lesson-schedule-display.util';

interface ChangeTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string;
  schedule: LessonScheduleListItem;
}

export function ChangeTimeDialog({
  open,
  onOpenChange,
  scheduleId,
  schedule,
}: ChangeTimeDialogProps) {
  const currentStart = toTimeSlot(schedule.start_time);
  const currentEnd = toTimeSlot(schedule.end_time);

  const [startTime, setStartTime] = useState(currentStart);
  const [endTime, setEndTime] = useState(currentEnd);
  const [reason, setReason] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const queryClient = useQueryClient();

  const isTimeRangeValid = startTime < endTime;

  const changeMutation = useMutation({
    ...patchCrmLessonSchedulesByScheduleIdTimeChangeMutation(),
    onSuccess: () => {
      toast.success('時間を変更しました');
      queryClient.invalidateQueries({ queryKey: getCrmLessonSchedulesQueryKey() });
      handleClose();
    },
    onError: () => {
      toast.error('時間の変更に失敗しました');
    },
  });

  const handleClose = () => {
    setStartTime(currentStart);
    setEndTime(currentEnd);
    setReason('');
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (!reason.trim() || !isTimeRangeValid) return;
    changeMutation.mutate({
      path: { scheduleId },
      body: {
        start_time: startTime,
        end_time: endTime,
        reason: reason.trim(),
        send_notification: sendNotification,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-base">時間を変更する</DialogTitle>
          <p className="text-muted-foreground text-xs">{schedule.lesson_name}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current time */}
          <div>
            <Label className="mb-2 block text-xs font-medium">現在の時間</Label>
            <div className="bg-muted/50 rounded-lg p-3 text-sm font-medium">
              {currentStart} 〜 {currentEnd}
            </div>
          </div>

          {/* New time inputs */}
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-xs font-medium">開始時刻</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="mb-2 block text-xs font-medium">終了時刻</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            {!isTimeRangeValid && (
              <p className="text-destructive mt-1 text-[10px]">
                終了時間は開始時間より後にしてください
              </p>
            )}
          </div>

          {/* Warning */}
          <div className="bg-warning/10 border-warning/20 rounded-lg border p-3">
            <p className="text-warning text-xs">
              時間変更により、同時間帯の他のレッスンとスタジオが重複しないか確認してください。
            </p>
          </div>

          {/* Notification */}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={sendNotification}
              onCheckedChange={(v) => setSendNotification(!!v)}
            />
            予約者に時間変更を通知する（{schedule.booked_count}名）
          </label>

          {/* Reason */}
          <div>
            <p className="mb-1 text-xs font-bold">
              変更理由 <span className="text-destructive">*</span>
            </p>
            <Textarea
              placeholder="変更理由を入力してください（例: 施設メンテナンスのため時間変更）"
              className="resize-none text-sm"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Impact summary */}
          <div className="bg-muted/50 rounded-lg border p-4">
            <h4 className="mb-2 text-xs font-bold">変更の影響</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Info className="text-info size-4 shrink-0" />
                <span className="text-muted-foreground">
                  影響を受ける予約:{' '}
                  <strong className="text-foreground">{schedule.booked_count}件</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="text-warning size-4 shrink-0" />
                <span className="text-muted-foreground">
                  予約者への通知: <strong className="text-foreground">時間変更のお知らせ</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-success size-4 shrink-0" />
                <span className="text-muted-foreground">
                  返金処理: <strong className="text-foreground">不要</strong>（レッスン自体は実施）
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            キャンセル
          </Button>
          <Button
            size="sm"
            disabled={!reason.trim() || !isTimeRangeValid || changeMutation.isPending}
            onClick={handleConfirm}
          >
            時間を変更する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
