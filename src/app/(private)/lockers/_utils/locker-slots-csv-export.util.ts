import { exportCsv } from '@/utils/csv.util';

import type { PostCrmLockersByIdSlotsExportResponse } from '@/lib/api/types.gen';

import { LOCKER_CONTRACT_STATUS_LABELS } from '../_constants/constants';

const CSV_HEADERS = [
  'スロット番号',
  'ステータス',
  '契約者',
  '会員ID',
  'オプション契約',
  'G-02契約種類',
  '開放待ち日',
  'パスワード',
];

type LockerSlotExportItem = PostCrmLockersByIdSlotsExportResponse['slots'][number];

function toCsvRows(
  slots: LockerSlotExportItem[],
  contractTypeNameByCode: Map<string, string>,
): string[][] {
  return slots.map((slot) => [
    slot.slot_number,
    LOCKER_CONTRACT_STATUS_LABELS[slot.status],
    slot.member_name ?? '',
    slot.member_id ?? '',
    slot.option_contract_name ?? '',
    slot.is_bottom_row
      ? (contractTypeNameByCode.get(slot.contract_type_code ?? '') ?? '未割当')
      : '',
    slot.cancel_date ?? '',
    slot.password ?? '',
  ]);
}

export function exportLockerSlotsCsv(
  data: PostCrmLockersByIdSlotsExportResponse,
  lockerCode: string,
  contractTypeMasters: { code: string; name: string }[],
): void {
  const contractTypeNameByCode = new Map(
    contractTypeMasters.map((item) => [item.code, item.name] as const),
  );

  exportCsv(
    CSV_HEADERS,
    toCsvRows(data.slots, contractTypeNameByCode),
    `locker_${lockerCode}_slots`,
  );
}
