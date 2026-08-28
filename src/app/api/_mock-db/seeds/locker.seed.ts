import type {
  LockerNumberingPattern,
  LockerOptionMasterRef,
  LockerOptionType,
  LockerReminderNotification,
  LockerSlotOpenType,
} from '@/app/api/_schemas/locker.schema';
import type { OptionMasterDetail } from '@/app/api/_schemas/option-master.schema';
import type { LockerSlotLockSettingsMeta } from '@/app/api/crm/lockers/_utils/locker-slot-lock-settings.util';

export type LockerFeeSeed = {
  amount: number;
  applied_at: string;
};

export type LockerDetailSeedMeta = LockerSlotLockSettingsMeta & {
  option_contract_code: string | null;
  /**
   * FR-013 fee options carried by the cabinet (designed backend: `lockers.option_id` /
   * `lockers.bottom_option_id`). The standard code applies to every slot except the bottom
   * row; the bottom code to the slots flagged `is_bottom_row`.
   */
  contract_type_code: string | null;
  bottom_contract_type_code: string | null;
  guide_text: string | null;
  note: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  slot_prefix: string;
  slot_columns: number;
  slot_numbering_pattern: LockerNumberingPattern;
  default_slot_size: {
    width_cm: number;
    height_cm: number;
    depth_cm: number;
  };
  default_open_type: LockerSlotOpenType;
  slot_size_by_slot: Record<string, { width_cm: number; height_cm: number; depth_cm: number }>;
  open_type_by_slot: Record<string, LockerSlotOpenType>;
  /**
   * FR-013 例外的 override: per-slot fee option, only for slots that deviate from the code
   * derived from `is_bottom_row`. A value here must still be one of the cabinet's two codes.
   */
  contract_type_code_by_slot: Record<string, string>;
  /** FR-009: date the PIN was last changed. Slots without one treat the contract start date as the initial setting date */
  password_changed_at_by_slot: Record<string, string>;
  individual_fee_by_slot: Record<string, LockerFeeSeed>;
  reminder_notifications_by_slot: Record<string, LockerReminderNotification[]>;
};

export function parseLockerSize(size: string): {
  width_cm: number;
  height_cm: number;
  depth_cm: number;
} {
  const match = size.match(/^W(\d+)×H(\d+)×D(\d+)$/);
  if (!match) {
    return { width_cm: 35, height_cm: 40, depth_cm: 50 };
  }

  return {
    width_cm: Number.parseInt(match[1]!, 10),
    height_cm: Number.parseInt(match[2]!, 10),
    depth_cm: Number.parseInt(match[3]!, 10),
  };
}

export function toLockerOptionRef(option: OptionMasterDetail): LockerOptionMasterRef {
  return {
    id: option.id,
    name: option.name,
    code: option.code,
    price_including_tax: option.price_including_tax,
  };
}

export const LOCKER_CONTRACT_TYPE_DESCRIPTIONS: Record<string, string> = {
  'LK-STD-001': '標準月額料金',
  'LK-PRM-001': '大型・特別設置スロット向け',
  'LK-DSC-001': '最下段スロット個別会費',
  'LK-DSC-002': '他オプションとのセット割引',
};

export function computeLockerContractEndDate(startDate: string): string {
  const [yearText, monthText] = startDate.split(/[/-]/);
  const year = Number(yearText);
  const month = Number(monthText);
  if (!year || !month) return startDate;
  const endYear = month >= 4 ? year + 1 : year;
  return `${endYear}-03-31T00:00:00Z`;
}

export function normalizeLockerDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/\//g, '-');
  if (!/T/.test(normalized) && /^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized}T00:00:00Z`;
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return normalized;
  }

  return date.toISOString();
}

export function resolveLockerContractTypeFromCode(code: string): LockerOptionType {
  if (code.includes('PRM')) return 'premium';
  return 'standard';
}
