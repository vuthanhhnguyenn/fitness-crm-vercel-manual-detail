'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getCrmNotificationsByIdQueryKey,
  getCrmNotificationsQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { NotificationCrud } from '@/lib/api/sdk.gen';

export type ManualNotificationAction =
  | 'request_approval'
  | 'send'
  | 'approve'
  | 'return'
  | 'resubmit'
  | 'delete';

export function useManualNotificationAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: ManualNotificationAction;
      reason?: string;
    }) =>
      NotificationCrud.patchCrmNotificationsByIdAction({
        path: { id },
        body: { action, ...(reason ? { reason } : {}) },
        throwOnError: true,
      }).then((result) => result.data),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: getCrmNotificationsQueryKey() });
      if (variables.action !== 'delete') {
        void queryClient.invalidateQueries({
          queryKey: getCrmNotificationsByIdQueryKey({ path: { id: variables.id } }),
        });
      }
      const successMessages: Record<
        ManualNotificationAction,
        { title: string; description?: string }
      > = {
        request_approval: { title: '通知の承認依頼を送信しました' },
        send: { title: '通知の配信を開始しました' },
        approve: {
          title: '通知を承認しました',
          description:
            data.item.timing.type === 'immediate'
              ? '配信を実行します。'
              : `指定タイミング（${data.item.timing.type === 'scheduled' ? data.item.timing.scheduledAt : '繰り返し'}）での配信予約が確定しました。`,
        },
        return: {
          title: '通知を差し戻しました',
          description: '差し戻し理由を通知作成者に送信しました。',
        },
        resubmit: { title: '通知を再申請しました' },
        delete: { title: '通知を削除しました' },
      };
      toast.success(successMessages[variables.action].title, {
        description: successMessages[variables.action].description,
      });
    },
  });
}
