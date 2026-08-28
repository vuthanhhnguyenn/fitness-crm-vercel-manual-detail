import { exportCsv } from '@/utils/csv.util';
import { formatDateYYYYMMDD } from '@/utils/date.util';

import type { PostCrmLockersByIdSlotsExportResponse } from '@/lib/api/types.gen';

import { LOCKER_CONTRACT_STATUS_LABELS } from '../_constants/constants';

const CSV_HEADERS = [
  'スロット番号',
  'ステータス',
  '契約者',
  '会員ID',
  'オプション契約',
  '契約種類',
  '解約日',
  'パスワード',
];

type LockerSlotExportItem = PostCrmLockersByIdSlotsExportResponse['slots'][number];

function toCsvRows(slots: LockerSlotExportItem[]): string[][] {
  return slots.map((slot) => [
    slot.slot_number,
    LOCKER_CONTRACT_STATUS_LABELS[slot.status],
    slot.member_name ?? '',
    slot.member_id ?? '',
    slot.option_contract_name ?? '',
    // The contract type master is resolved server-side on the slot, so the export needs no
    // separate lookup table (and cannot mislabel a code missing from a partially loaded list).
    slot.is_bottom_row ? (slot.contract_type?.name ?? '未割当') : '',
    slot.cancel_date ? formatDateYYYYMMDD(slot.cancel_date) : '',
    slot.password ?? '',
  ]);
}

export function exportLockerSlotsCsv(
  data: PostCrmLockersByIdSlotsExportResponse,
  lockerCode: string,
): void {
  exportCsv(CSV_HEADERS, toCsvRows(data.slots), `locker_${lockerCode}_slots`);
}
