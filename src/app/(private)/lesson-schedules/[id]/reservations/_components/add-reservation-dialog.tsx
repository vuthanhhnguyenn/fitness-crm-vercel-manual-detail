'use client';

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, X } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  getCrmLessonSchedulesByScheduleIdReservationsQueryKey,
  postCrmLessonSchedulesByScheduleIdReservationsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { LessonScheduleListItem, MemberSearchResult } from '@/lib/api/types.gen';

import { AddReservationMemberSearch } from './add-reservation-member-search';

interface AddReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string;
  schedule: LessonScheduleListItem;
  preselectedSpaceNumber?: string | null;
  remainingSeats: number;
}

type MemberWarning = {
  type: 'no-count' | 'penalty';
  message: string;
};

export function AddReservationDialog({
  open,
  onOpenChange,
  scheduleId,
  schedule,
  preselectedSpaceNumber,
  remainingSeats: initialRemainingSeats,
}: AddReservationDialogProps) {
  const [addedMembers, setAddedMembers] = useState<MemberSearchResult[]>([]);
  const [warning, setWarning] = useState<MemberWarning | null>(null);
  const [sendNotification, setSendNotification] = useState(true);
  const [spaceNumber, setSpaceNumber] = useState(preselectedSpaceNumber ?? 'auto');
  const queryClient = useQueryClient();

  const remainingSeats = initialRemainingSeats - addedMembers.length;

  const addReservation = useMutation({
    ...postCrmLessonSchedulesByScheduleIdReservationsMutation(),
    onSuccess: () => {
      toast.success('予約を追加しました');
      queryClient.invalidateQueries({
        queryKey: getCrmLessonSchedulesByScheduleIdReservationsQueryKey({
          path: { scheduleId },
        }),
      });
      handleClose();
    },
    onError: () => {
      toast.error('予約の追加に失敗しました');
    },
  });

  const handleAdd = (member: MemberSearchResult) => {
    if (remainingSeats <= 0) return;
    if (member.remaining_sessions === 0) {
      setWarning({ type: 'no-count', message: '残回数が不足しています' });
      return;
    }
    if (member.penalty_active) {
      setWarning({
        type: 'penalty',
        message: `予約不可期間中の会員です${member.penalty_end_date ? `（${member.penalty_end_date}まで）` : ''}`,
      });
      return;
    }
    setWarning(null);
    if (!addedMembers.find((m) => m.member_id === member.member_id)) {
      setAddedMembers((prev) => [...prev, member]);
    }
  };

  const handleRemove = (memberId: string) => {
    setAddedMembers((prev) => prev.filter((m) => m.member_id !== memberId));
  };

  const handleConfirm = () => {
    addedMembers.forEach((member) => {
      addReservation.mutate({
        path: { scheduleId },
        body: {
          member_id: member.member_id,
          schedule_id: scheduleId,
          space_number: spaceNumber !== 'auto' ? spaceNumber : undefined,
          send_notification: sendNotification,
        },
      });
    });
  };

  const handleClose = () => {
    setAddedMembers([]);
    setWarning(null);
    setSpaceNumber(preselectedSpaceNumber ?? 'auto');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-base">予約を追加する</DialogTitle>
          <p className="text-muted-foreground text-xs">
            {schedule.lesson_name} | 残り{remainingSeats}席
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Added members chips */}
          {addedMembers.length > 0 && (
            <div className="bg-success/10 border-success/20 rounded-lg border p-3">
              <p className="text-success mb-2 text-xs font-medium">
                追加予定（{addedMembers.length}名）
              </p>
              <div className="flex flex-wrap gap-2">
                {addedMembers.map((m) => (
                  <span
                    key={m.member_id}
                    className="bg-background border-success/20 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                  >
                    <span className="font-medium">{m.name}</span>
                    <span className="text-muted-foreground">{m.member_id}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive ml-1 size-4"
                      onClick={() => handleRemove(m.member_id)}
                    >
                      <X className="size-3" />
                    </Button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Warning */}
          {warning && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 text-xs ${
                warning.type === 'penalty'
                  ? 'bg-destructive/10 border-destructive/20 text-destructive border'
                  : 'bg-warning/10 border-warning/20 text-warning border'
              }`}
            >
              <AlertCircle className="size-4 shrink-0" />
              {warning.message}
            </div>
          )}

          {/* Member Search */}
          <AddReservationMemberSearch
            scheduleId={scheduleId}
            addedMemberIds={addedMembers.map((m) => m.member_id)}
            remainingSeats={remainingSeats}
            onAdd={handleAdd}
          />

          {/* Space number */}
          <div>
            <Label className="mb-2 block text-xs font-medium">スペース番号</Label>
            <Select value={spaceNumber} onValueChange={(v) => setSpaceNumber(v ?? 'auto')}>
              <SelectTrigger className="h-9 w-[200px] text-sm">
                <SelectValue>
                  {(value) => (!value || value === 'auto' ? '自動割り当て' : `スペース ${value}`)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">自動割り当て</SelectItem>
                {Array.from({ length: 16 }, (_, i) => String(i + 1)).map((num) => (
                  <SelectItem key={num} value={num}>
                    スペース {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notification toggle */}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={sendNotification}
              onCheckedChange={(v) => setSendNotification(!!v)}
            />
            予約確定通知を送信する
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            キャンセル
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={addedMembers.length === 0 || addReservation.isPending}
          >
            追加確定（{addedMembers.length}名）
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
