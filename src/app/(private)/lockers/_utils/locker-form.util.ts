import type { GetCrmLockersByIdResponse } from '@/lib/api/types.gen';
import {
  LockerLockType,
  LockerNumberingPattern,
  LockerOptionType,
  LockerShape,
  LockerSlotOpenType,
} from '@/lib/api/types.gen';

import { LOCKER_AREA_OPTIONS } from '../_constants/locker-form.constants';
import type { LockerFormSubmitValues, LockerFormValues } from '../_schemas/locker-form.schema';

type LockerDetail = NonNullable<GetCrmLockersByIdResponse>['locker'];

export const emptyLockerFormDefaults: LockerFormValues = {
  store_id: '',
  location_symbol: '',
  area_label: '',
  guide_text: '',
  note: '',
  image_url: null,
  shape: '' as LockerShape,
  slot_numbering_pattern: LockerNumberingPattern.TOP_LEFT_TO_RIGHT,
  start_number: 1,
  option_type: LockerOptionType.NONE,
  contract_type_code: null,
  default_open_type: LockerSlotOpenType.DOOR,
  default_lock_type: LockerLockType.DIAL,
  slot_lock_settings: [],
};

export function lockerDetailToFormValues(locker: LockerDetail): LockerFormValues {
  const areaOption = LOCKER_AREA_OPTIONS.find((option) => option.value === locker.location_symbol);

  return {
    store_id: locker.store_id,
    location_symbol: locker.location_symbol,
    area_label: areaOption?.label ?? locker.area,
    guide_text: locker.guide_text ?? '',
    note: locker.note ?? '',
    image_url: locker.image_url,
    shape: locker.shape,
    slot_numbering_pattern: locker.slot_numbering_pattern,
    start_number: locker.start_number,
    option_type: locker.option_type,
    contract_type_code: locker.contract_type_code,
    default_open_type: locker.default_open_type,
    default_lock_type: locker.default_lock_type,
    slot_lock_settings: (locker.slot_lock_settings ?? []).map((setting) => ({
      slot_number: setting.slot_number,
      lock_type: setting.lock_type,
      password: setting.password ?? '',
    })),
  };
}

export function lockerFormValuesToCreateBody(values: LockerFormSubmitValues) {
  return {
    store_id: values.store_id,
    location_symbol: values.location_symbol,
    area_label: values.area_label,
    guide_text: values.guide_text || null,
    note: values.note || null,
    image_url: values.image_url ?? null,
    shape: values.shape,
    slot_numbering_pattern: values.slot_numbering_pattern,
    start_number: values.start_number,
    option_type: values.option_type,
    contract_type_code:
      values.option_type === LockerOptionType.NONE ? null : (values.contract_type_code ?? null),
    default_open_type: values.default_open_type,
    default_lock_type: values.default_lock_type,
    slot_lock_settings: values.slot_lock_settings.map((setting) => ({
      slot_number: setting.slot_number,
      lock_type: setting.lock_type,
      password:
        setting.lock_type === LockerLockType.DIAL && setting.password ? setting.password : null,
    })),
  };
}

export function lockerFormValuesToUpdateBody(values: LockerFormSubmitValues) {
  const {
    location_symbol,
    area_label,
    guide_text,
    note,
    image_url,
    slot_numbering_pattern,
    start_number,
    option_type,
    contract_type_code,
    default_open_type,
    default_lock_type,
    slot_lock_settings,
  } = lockerFormValuesToCreateBody(values);

  return {
    location_symbol,
    area_label,
    guide_text,
    note,
    image_url,
    slot_numbering_pattern,
    start_number,
    option_type,
    contract_type_code,
    default_open_type,
    default_lock_type,
    slot_lock_settings,
  };
}
