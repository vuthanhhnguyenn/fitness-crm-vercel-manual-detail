import {
  OptionDiscountCondition,
  OptionDiscountStatus,
  OptionDiscountType,
} from '@/lib/api/types.gen';

export const OPTION_DISCOUNT_CONDITION_LABELS: Record<OptionDiscountCondition, string> = {
  [OptionDiscountCondition.SIMULTANEOUS]: '同時申込時',
  [OptionDiscountCondition.EXISTING_MEMBER]: '既存会員も対象',
  [OptionDiscountCondition.FAMILY_2_PLUS]: '家族2名以上',
  [OptionDiscountCondition.OPTIONS_3_PLUS]: '3オプション同時',
};

export const OPTION_DISCOUNT_TYPE_LABELS: Record<OptionDiscountType, string> = {
  [OptionDiscountType.FIXED_AMOUNT]: '定額値引き',
  [OptionDiscountType.PERCENTAGE]: '割合割引',
};

export const OPTION_DISCOUNT_TYPE_BADGE_CLASSES: Record<OptionDiscountType, string> = {
  [OptionDiscountType.FIXED_AMOUNT]: 'bg-info/15 text-info border-info/20',
  [OptionDiscountType.PERCENTAGE]: 'bg-warning/15 text-warning border-warning/20',
};

export const OPTION_DISCOUNT_STATUS_LABELS: Record<OptionDiscountStatus, string> = {
  [OptionDiscountStatus.ACTIVE]: '有効',
  [OptionDiscountStatus.INACTIVE]: '無効',
};

export const OPTION_DISCOUNT_STATUS_BADGE_CLASSES: Record<OptionDiscountStatus, string> = {
  [OptionDiscountStatus.ACTIVE]: 'bg-success/15 text-success border-success/20',
  [OptionDiscountStatus.INACTIVE]: 'bg-muted text-muted-foreground border-border',
};

export function formatOptionDiscountValue(type: OptionDiscountType, value: number): string {
  if (type === OptionDiscountType.PERCENTAGE) {
    return `${value}%`;
  }

  return `¥${value.toLocaleString()}`;
}
