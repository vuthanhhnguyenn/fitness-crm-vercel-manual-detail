'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  getCrmNotificationsByIdQueryKey,
  getCrmNotificationsQueryKey,
  patchCrmNotificationsByIdActionMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { PatchCrmNotificationsByIdActionData } from '@/lib/api/types.gen';

export type ManualNotificationAction = NonNullable<
  PatchCrmNotificationsByIdActionData['body']
>['action'];

export const manualNotificationReturnReasonSchema = z
  .string()
  .trim()
  .min(1, '差し戻し理由を入力してください')
  .max(500, '差し戻し理由は500文字以内で入力してください');

export function useManualNotificationAction() {
  const queryClient = useQueryClient();

  return useMutation({
    ...patchCrmNotificationsByIdActionMutation(),
    onSuccess: (data, variables) => {
      const action = variables.body?.action;
      if (!action) return;

      void queryClient.invalidateQueries({ queryKey: getCrmNotificationsQueryKey() });
      if (action !== 'delete') {
        void queryClient.invalidateQueries({
          queryKey: getCrmNotificationsByIdQueryKey({ path: { id: variables.path.id } }),
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
      toast.success(successMessages[action].title, {
        description: successMessages[action].description,
      });
    },
  });
}
