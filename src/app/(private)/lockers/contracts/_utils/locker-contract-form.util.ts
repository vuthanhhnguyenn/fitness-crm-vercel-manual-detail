import { parseDate } from '@/utils/date.util';
import { format } from 'date-fns';

import type { GetCrmLockersContractsByIdResponse } from '@/lib/api/types.gen';
import { LockerLockType } from '@/lib/api/types.gen';

import type {
  LockerContractFormSubmitValues,
  LockerContractFormValues,
} from '../_schemas/locker-contract-form.schema';

type LockerContractDetail = NonNullable<GetCrmLockersContractsByIdResponse>['contract'];

export function parseApiDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/\//g, '-');
  const isoLike = /T/.test(normalized) ? normalized : `${normalized}T00:00:00Z`;
  return parseDate(isoLike) ?? undefined;
}

export const emptyLockerContractFormDefaults: LockerContractFormValues = {
  locker_id: '',
  slot_number: '',
  contract_type_code: '',
  start_date: undefined as unknown as Date,
  password: '',
};

/**
 * Serialises a picked date as the UTC midnight ISO string the API expects.
 * Formats the local Y/M/D first (via date-fns) so the day never shifts — using
 * `toISOString()` on the raw Date would move a JST evening back to the previous day.
 */
function toApiDate(date: Date): string {
  return `${format(date, 'yyyy-MM-dd')}T00:00:00Z`;
}

export function lockerContractDetailToFormValues(
  contract: LockerContractDetail,
): LockerContractFormValues {
  return {
    locker_id: contract.locker_id,
    slot_number: contract.locker_number,
    contract_type_code: contract.contract_type_code ?? '',
    start_date: parseApiDate(contract.start_date) ?? new Date(),
    password: contract.password ?? '',
  };
}

export function lockerContractFormValuesToUpdateBody(values: LockerContractFormSubmitValues) {
  return {
    locker_id: values.locker_id,
    slot_number: values.slot_number,
    contract_type_code: values.contract_type_code,
    start_date: toApiDate(values.start_date),
    password: values.password ? values.password : null,
  };
}

export function validateDialPassword(
  lockType: string | undefined,
  password: string | undefined,
): string | null {
  if (lockType !== LockerLockType.DIAL) return null;
  if (password && /^\d{4}$/.test(password)) return null;
  return 'ダイヤル錠の場合は4桁のパスワードが必須です';
}

export function formatLockerLabel(lockerId: string, area: string, shapeLabel: string) {
  return `${lockerId} — ${area}（${shapeLabel}）`;
}

export function getSlotSelectLabel(
  slotNumber: string,
  status: string,
  memberName: string | null | undefined,
  currentSlotNumber?: string,
) {
  if (slotNumber === currentSlotNumber) {
    return `${slotNumber}（現在の割当）`;
  }
  if (status === 'in_use') {
    return `${slotNumber}（使用中${memberName ? `：${memberName}` : ''}）`;
  }
  if (status === 'pending_release') {
    return `${slotNumber}（開放待ち）`;
  }
  return `${slotNumber}（利用可）`;
}
