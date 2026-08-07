'use client';

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import {
  getCrmLessonSchedulesByScheduleIdReservationsQueryKey,
  postCrmLessonSchedulesByScheduleIdReservationsByReservationIdCancelMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { Reservation } from '@/lib/api/types.gen';

interface CancelReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string;
  reservation: Reservation | null;
}

export function CancelReservationDialog({
  open,
  onOpenChange,
  scheduleId,
  reservation,
}: CancelReservationDialogProps) {
  const [cancelType, setCancelType] = useState<'member' | 'staff' | 'instructor'>('member');
  const [sendNotification, setSendNotification] = useState(true);
  const queryClient = useQueryClient();

  const cancelReservation = useMutation({
    ...postCrmLessonSchedulesByScheduleIdReservationsByReservationIdCancelMutation(),
    onSuccess: () => {
      toast.success('予約をキャンセルしました');
      queryClient.invalidateQueries({
        queryKey: getCrmLessonSchedulesByScheduleIdReservationsQueryKey({
          path: { scheduleId },
        }),
      });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('キャンセルに失敗しました');
    },
  });

  const handleConfirm = () => {
    if (!reservation) return;
    cancelReservation.mutate({
      path: { scheduleId, reservationId: reservation.id },
      body: {
        cancel_type: cancelType,
        send_notification: sendNotification,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">予約をキャンセル</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Target reservation info */}
          {reservation && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium">{reservation.member_name}</p>
              <p className="text-muted-foreground text-xs">
                {reservation.reservation_date} {reservation.reservation_time}
                {reservation.space_number && ` | スペース ${reservation.space_number}`}
              </p>
            </div>
          )}

          {/* Cancel type selection */}
          <div>
            <Label className="mb-2 block text-xs font-medium">キャンセル区分</Label>
            <RadioGroup
              value={cancelType}
              onValueChange={(v) => setCancelType(v as typeof cancelType)}
            >
              <div className="space-y-2">
                <label
                  className={`flex cursor-pointer items-start gap-2 rounded border p-2 transition-colors ${cancelType === 'member' ? 'bg-primary/[0.05] border-primary' : 'hover:bg-muted/50'}`}
                >
                  <RadioGroupItem value="member" className="mt-0.5" />
                  <div>
                    <span className="text-sm">会員によるキャンセル</span>
                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                      最短受付期間内の場合、無断キャンセルとしてペナルティカウントに加算されます
                    </p>
                  </div>
                </label>
                <label
                  className={`flex cursor-pointer items-start gap-2 rounded border p-2 transition-colors ${cancelType === 'staff' ? 'bg-primary/[0.05] border-primary' : 'hover:bg-muted/50'}`}
                >
                  <RadioGroupItem value="staff" className="mt-0.5" />
                  <div>
                    <span className="text-sm">スタッフによるキャンセル</span>
                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                      運営上の理由によるキャンセルです
                    </p>
                  </div>
                </label>
                <label
                  className={`flex cursor-pointer items-start gap-2 rounded border p-2 transition-colors ${cancelType === 'instructor' ? 'bg-primary/[0.05] border-primary' : 'hover:bg-muted/50'}`}
                >
                  <RadioGroupItem value="instructor" className="mt-0.5" />
                  <div>
                    <span className="text-sm">指導者都合のキャンセル</span>
                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                      回数消費を取り消します（月次プランの場合）
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Notification */}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={sendNotification}
              onCheckedChange={(v) => setSendNotification(!!v)}
            />
            キャンセル通知を送信する
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={cancelReservation.isPending}
          >
            キャンセルを確定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
