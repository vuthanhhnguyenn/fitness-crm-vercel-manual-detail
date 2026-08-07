import { exportCsv } from '@/utils/csv.util';

import type {
  LockerPendingSlotListItem,
  PostCrmLockersPendingSlotsExportResponse,
} from '@/lib/api/types.gen';

import {
  LOCKER_LOCK_TYPE_LABELS,
  LOCKER_PENDING_LOCATION_LABELS,
} from '../../_constants/constants';

const CSV_FILENAME_PREFIX = 'locker_pending_slots';

const CSV_HEADERS = [
  'スロット番号',
  'ロケーション',
  'ロッカー名',
  '会員名',
  '会員ID',
  '解約日',
  '開放待ち日数',
  'スロットサイズ',
  '施錠方法',
];

function toCsvRows(pendingSlots: LockerPendingSlotListItem[]): string[][] {
  return pendingSlots.map((slot) => [
    slot.slot_number,
    LOCKER_PENDING_LOCATION_LABELS[slot.locker_location],
    slot.locker_name,
    slot.member_name,
    slot.member_id,
    slot.cancel_date,
    `${slot.pending_days}日`,
    slot.size,
    LOCKER_LOCK_TYPE_LABELS[slot.lock_type],
  ]);
}

export function exportLockerPendingSlotsListCsv(
  data: PostCrmLockersPendingSlotsExportResponse,
): void {
  exportCsv(CSV_HEADERS, toCsvRows(data.pending_slots), CSV_FILENAME_PREFIX);
}
