import { exportCsv } from '@/utils/csv.util';

import type {
  LockerContractListItem,
  PostCrmLockersContractsExportResponse,
} from '@/lib/api/types.gen';

import { LOCKER_CONTRACT_STATUS_LABELS, LOCKER_OPTION_TYPE_LABELS } from '../_constants/constants';

const CSV_FILENAME_PREFIX = 'locker_contracts';

const CSV_HEADERS = [
  '契約ID',
  '会員名',
  '会員ID',
  'ロッカー番号',
  'オプション契約',
  '契約開始日',
  '契約終了日',
  'ステータス',
];

function toCsvRows(contracts: LockerContractListItem[]): string[][] {
  return contracts.map((contract) => [
    contract.contract_id,
    contract.member_name,
    contract.member_id,
    contract.locker_number,
    LOCKER_OPTION_TYPE_LABELS[contract.contract_type],
    contract.start_date,
    contract.end_date,
    LOCKER_CONTRACT_STATUS_LABELS[contract.status],
  ]);
}

export function exportLockerContractsListCsv(data: PostCrmLockersContractsExportResponse): void {
  exportCsv(CSV_HEADERS, toCsvRows(data.contracts), CSV_FILENAME_PREFIX);
}
