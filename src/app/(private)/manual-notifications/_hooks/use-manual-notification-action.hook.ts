'use client';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getCrmNotificationsByIdQueryKey,
  getCrmNotificationsQueryKey,
  patchCrmNotificationsByIdActionMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import type { ManualNotificationAction } from '../_utils/manual-notification-action.util';

export function useManualNotificationAction() {
  const queryClient = useQueryClient();

  return useMutation({
    ...patchCrmNotificationsByIdActionMutation(),
    onSuccess: (data, variables) => {
      const action = variables.body?.action;
      if (!action) return;

      void queryClient.invalidateQueries({ queryKey: getCrmNotificationsQueryKey() });
      const detailQueryKey = getCrmNotificationsByIdQueryKey({
        path: { id: variables.path.id },
      });
      if (action === 'delete') {
        queryClient.removeQueries({ queryKey: detailQueryKey, exact: true });
      } else {
        void queryClient.invalidateQueries({ queryKey: detailQueryKey });
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
              : `指定タイミング（${data.item.timing.type === 'scheduled' ? formatDateYYYYMMDD_HHMM(data.item.timing.scheduledAt, '—') : '繰り返し'}）での配信予約が確定しました。`,
        },
        return: {
          title: '通知を差し戻しました',
          description: '差し戻し理由を通知作成者に送信しました。',
        },
        resubmit: { title: '通知を再申請しました' },
        delete: { title: '通知を削除しました' },
      };
      toast.success(successMessages[action].title, {
        description: successMessages[action].description,
      });
    },
  });
}
