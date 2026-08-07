'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getCrmLockersByIdQueryKey,
  patchCrmLockersByIdSlotsBySlotIdMutation,
  postCrmLockersByIdSlotsBySlotIdReminderNotificationsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { PatchCrmLockersByIdSlotsBySlotIdData } from '@/lib/api/types.gen';

import { useLockerBulkRelease } from '../../_hooks/use-locker-bulk-release.hook';

type UpdateLockerSlotBody = NonNullable<PatchCrmLockersByIdSlotsBySlotIdData['body']>;

export function useLockerSlotMutations(lockerId: string) {
  const queryClient = useQueryClient();
  const { releaseSlotNumbers, isReleasing } = useLockerBulkRelease();

  const updateSlotMutation = useMutation({
    ...patchCrmLockersByIdSlotsBySlotIdMutation(),
    onSuccess: ({ message }) => {
      queryClient.invalidateQueries({
        queryKey: getCrmLockersByIdQueryKey({ path: { id: lockerId } }),
      });
      toast.success(message);
    },
    onError: () => {
      toast.error('スロット設定の更新に失敗しました');
    },
  });

  const reminderMutation = useMutation({
    ...postCrmLockersByIdSlotsBySlotIdReminderNotificationsMutation(),
    onSuccess: ({ message }) => {
      queryClient.invalidateQueries({
        queryKey: getCrmLockersByIdQueryKey({ path: { id: lockerId } }),
      });
      toast.success(message);
    },
    onError: () => {
      toast.error('リマインド通知の送信に失敗しました');
    },
  });

  const releaseSlots = (slotNumbers: string[], callbacks?: { onSuccess?: () => void }) =>
    releaseSlotNumbers(lockerId, slotNumbers, callbacks);

  const updateSlot = (slotId: string, body: UpdateLockerSlotBody) =>
    updateSlotMutation.mutateAsync({
      path: { id: lockerId, slotId },
      body,
    });

  const sendReminder = (slotId: string, reminderDays: 7 | 14 | 30) =>
    reminderMutation.mutateAsync({
      path: { id: lockerId, slotId },
      body: { reminder_days: reminderDays },
    });

  return {
    releaseSlots,
    updateSlot,
    sendReminder,
    isReleasing,
    isUpdatingSlot: updateSlotMutation.isPending,
    isSendingReminder: reminderMutation.isPending,
  };
}
