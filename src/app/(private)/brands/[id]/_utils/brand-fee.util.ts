import type { BrandFeeGroupFormValues } from '../_schemas/brand-fee-group-form.schema';
import type { BrandFeeGroup, BrandFeeItem } from '../_types/brand-fee.type';

const CIRCLED_NUMERALS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'] as const;

export function toCircledNumeral(value: number): string {
  return CIRCLED_NUMERALS[value - 1] ?? `${value}`;
}

export function formatYen(value: number): string {
  return `¥${value.toLocaleString('ja-JP')}`;
}

function hasSameScheduledChanges(
  formChanges: BrandFeeGroupFormValues['feeItems'][number]['scheduledChanges'],
  currentChanges: BrandFeeItem['scheduled_changes'],
): boolean {
  if (formChanges.length !== currentChanges.length) return false;
  return formChanges.every(
    (change, index) =>
      change.effectiveStartDate === currentChanges[index]?.effective_start_date &&
      change.valueIncludingTaxYen === currentChanges[index]?.value_including_tax_yen,
  );
}

export function hasFeeGroupChanges(
  feeGroup: BrandFeeGroup,
  values: BrandFeeGroupFormValues,
): boolean {
  if (values.feeItems.length !== feeGroup.fee_items.length) {
    return true;
  }

  return values.feeItems.some((item, index) => {
    const currentItem = feeGroup.fee_items[index];
    if (!currentItem) return true;

    return (
      item.itemName.trim() !== currentItem.item_name ||
      item.effectiveStartDate !== currentItem.effective_start_date ||
      item.currentValueIncludingTaxYen !== currentItem.current_value_including_tax_yen ||
      !hasSameScheduledChanges(item.scheduledChanges, currentItem.scheduled_changes)
    );
  });
}
