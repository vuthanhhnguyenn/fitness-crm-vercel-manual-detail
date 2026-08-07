'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  postCrmLockersByIdSlotsExportMutation,
  postCrmLockersContractsExportMutation,
  postCrmLockersExportMutation,
  postCrmLockersPendingSlotsExportMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import { exportLockerContractsListCsv } from '../_utils/locker-contracts-csv-export.util';
import { exportLockerSlotsCsv } from '../_utils/locker-slots-csv-export.util';
import { exportLockersListCsv } from '../_utils/lockers-csv-export.util';
import { exportLockerPendingSlotsListCsv } from '../pending/_utils/locker-pending-slots-csv-export.util';

export function useLockersCsvExport() {
  return useMutation({
    ...postCrmLockersExportMutation(),
    onSuccess: (data) => {
      exportLockersListCsv(data);
      toast.success('CSVを出力しました');
    },
    onError: () => {
      toast.error('CSVの出力に失敗しました');
    },
  });
}

export function useLockerContractsCsvExport() {
  return useMutation({
    ...postCrmLockersContractsExportMutation(),
    onSuccess: (data) => {
      exportLockerContractsListCsv(data);
      toast.success('CSVを出力しました');
    },
    onError: () => {
      toast.error('CSVの出力に失敗しました');
    },
  });
}

export function useLockerPendingSlotsCsvExport() {
  return useMutation({
    ...postCrmLockersPendingSlotsExportMutation(),
    onSuccess: (data) => {
      exportLockerPendingSlotsListCsv(data);
      toast.success('CSVを出力しました');
    },
    onError: () => {
      toast.error('CSVの出力に失敗しました');
    },
  });
}

export function useLockerSlotsCsvExport(
  lockerCode: string,
  contractTypeMasters: { code: string; name: string }[],
) {
  return useMutation({
    ...postCrmLockersByIdSlotsExportMutation(),
    onSuccess: (data) => {
      exportLockerSlotsCsv(data, lockerCode, contractTypeMasters);
      toast.success('CSVを出力しました');
    },
    onError: () => {
      toast.error('CSVの出力に失敗しました');
    },
  });
}
