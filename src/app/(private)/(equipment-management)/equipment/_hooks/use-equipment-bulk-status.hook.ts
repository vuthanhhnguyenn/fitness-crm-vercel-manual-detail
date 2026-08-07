'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getCrmEquipmentQueryKey,
  postCrmEquipmentBulkStatusMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmEquipmentData } from '@/lib/api/types.gen';

import type { EquipmentStatus } from '../_constants/constants';
import { EQUIPMENT_STATUS_LABELS } from '../_constants/constants';

type BulkStatusPayload = {
  ids: string[];
  status: EquipmentStatus;
  changeReason?: string;
};

export function useEquipmentBulkStatus(queryParams: GetCrmEquipmentData['query']) {
  const queryClient = useQueryClient();

  const bulkStatusMutation = useMutation({
    ...postCrmEquipmentBulkStatusMutation(),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: getCrmEquipmentQueryKey({ query: queryParams }),
      });

      const status = variables.body?.status;
      if (!status) return;

      const statusLabel = EQUIPMENT_STATUS_LABELS[status];

      if (data.updated_count > 0) {
        toast.success(`${data.updated_count}件のステータスを「${statusLabel}」に変更しました`);
      }

      const failedCount = data.results.filter((result) => !result.success).length;
      if (failedCount > 0) {
        toast.error(`${failedCount}件のステータス変更に失敗しました`);
      }
    },
    onError: () => {
      toast.error('一括状態変更に失敗しました');
    },
  });

  const bulkUpdateStatus = (payload: BulkStatusPayload, callbacks?: { onSuccess?: () => void }) => {
    bulkStatusMutation.mutate(
      {
        body: {
          ids: payload.ids,
          status: payload.status,
          change_reason: payload.changeReason,
        },
      },
      { onSuccess: callbacks?.onSuccess },
    );
  };

  return {
    bulkUpdateStatus,
    isBulkUpdating: bulkStatusMutation.isPending,
  };
}
