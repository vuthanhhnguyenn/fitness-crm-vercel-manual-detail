import { exportCsv } from '@/utils/csv.util';

import type { LockerListItem, PostCrmLockersExportResponse } from '@/lib/api/types.gen';

import { LOCKER_OPTION_TYPE_LABELS, LOCKER_SHAPE_LABELS } from '../_constants/constants';

const CSV_FILENAME_PREFIX = 'lockers';

const CSV_HEADERS = [
  'ロッカーID',
  'エリア',
  '形状',
  'オプション契約',
  'スロット数',
  '空き/使用中',
  'ナンバリング',
];

function toCsvRows(lockers: LockerListItem[]): string[][] {
  return lockers.map((locker) => [
    locker.locker_id,
    locker.area,
    LOCKER_SHAPE_LABELS[locker.shape],
    LOCKER_OPTION_TYPE_LABELS[locker.option_type],
    String(locker.slots),
    `${locker.available_slots}/${locker.in_use_slots}`,
    locker.numbering_pattern,
  ]);
}

export function exportLockersListCsv(data: PostCrmLockersExportResponse): void {
  exportCsv(CSV_HEADERS, toCsvRows(data.lockers), CSV_FILENAME_PREFIX);
}
