'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getCrmLockersByIdQueryKey,
  getCrmLockersContractsQueryKey,
  getCrmLockersPendingSlotsQueryKey,
  getCrmLockersQueryKey,
  getCrmLockersSummaryQueryKey,
  postCrmLockersSlotsReleaseMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import {
  type LockerSlotReleaseTarget,
  buildBulkReleaseRequestItems,
  buildBulkReleaseRequestItemsFromLocker,
} from '../_utils/locker-slot-release.util';

type ReleaseCallbacks = {
  onSuccess?: () => void;
};

function invalidateLockerReleaseQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  lockerIds: string[],
) {
  for (const lockerId of lockerIds) {
    queryClient.invalidateQueries({
      queryKey: getCrmLockersByIdQueryKey({ path: { id: lockerId } }),
    });
  }

  queryClient.invalidateQueries({ queryKey: getCrmLockersSummaryQueryKey() });
  queryClient.invalidateQueries({
    queryKey: getCrmLockersPendingSlotsQueryKey(),
    refetchType: 'all',
  });
  queryClient.invalidateQueries({
    queryKey: getCrmLockersContractsQueryKey(),
    refetchType: 'all',
  });
  queryClient.invalidateQueries({ queryKey: getCrmLockersQueryKey(), refetchType: 'all' });
}

export function useLockerBulkRelease() {
  const queryClient = useQueryClient();

  const releaseMutation = useMutation({
    ...postCrmLockersSlotsReleaseMutation(),
    onSuccess: (data) => {
      invalidateLockerReleaseQueries(queryClient, data.locker_ids);
      toast.success(data.message);
    },
    onError: () => {
      toast.error('スロットの開放に失敗しました');
    },
  });

  const releaseTargets = (targets: LockerSlotReleaseTarget[], callbacks?: ReleaseCallbacks) => {
    releaseMutation.mutate(
      { body: { items: buildBulkReleaseRequestItems(targets) } },
      { onSuccess: callbacks?.onSuccess },
    );
  };

  const releaseSlotNumbers = (
    lockerId: string,
    slotNumbers: string[],
    callbacks?: ReleaseCallbacks,
  ) => {
    releaseMutation.mutate(
      { body: { items: buildBulkReleaseRequestItemsFromLocker(lockerId, slotNumbers) } },
      { onSuccess: callbacks?.onSuccess },
    );
  };

  return {
    releaseTargets,
    releaseSlotNumbers,
    isReleasing: releaseMutation.isPending,
  };
}
