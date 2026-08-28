import { isBefore, isValid, parse, startOfDay } from 'date-fns';

import type { BrandFeeGroupFormValues } from '../_schemas/brand-fee-group-form.schema';
import type { BrandFeeGroup } from '../_types/brand-fee.type';

export function parseDateValue(value: string): Date | undefined {
  const parsed = parse(value, 'yyyy/MM/dd', new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function isPastDate(value: string): boolean {
  const parsed = parseDateValue(value);
  if (!parsed) return false;
  return isBefore(startOfDay(parsed), startOfDay(new Date()));
}

export function formatFeeValueInput(value: number | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '';
  }

  return String(value);
}

export function buildDefaultValues(feeGroup: BrandFeeGroup | null): BrandFeeGroupFormValues {
  if (!feeGroup) {
    return { feeItems: [] };
  }

  return {
    feeItems: feeGroup.fee_items.map((item) => ({
      itemCode: item.item_code,
      itemName: item.item_name,
      effectiveStartDate: item.effective_start_date,
      currentValueIncludingTaxYen: item.current_value_including_tax_yen,
      scheduledChanges: item.scheduled_changes.map((change) => ({
        effectiveStartDate: change.effective_start_date,
        valueIncludingTaxYen: change.value_including_tax_yen,
      })),
    })),
  };
}

function hasSameScheduledChanges(
  formChanges: BrandFeeGroupFormValues['feeItems'][number]['scheduledChanges'],
  currentChanges: BrandFeeGroup['fee_items'][number]['scheduled_changes'],
): boolean {
  if (formChanges.length !== currentChanges.length) return false;
  return formChanges.every(
    (change, index) =>
      change.effectiveStartDate === currentChanges[index]?.effective_start_date &&
      change.valueIncludingTaxYen === currentChanges[index]?.value_including_tax_yen,
  );
}

export function hasFeeGroupChanges(
  feeGroup: BrandFeeGroup | null,
  feeItems: BrandFeeGroupFormValues['feeItems'] | undefined,
): boolean {
  if (!feeGroup || !feeItems || feeItems.length !== feeGroup.fee_items.length) {
    return false;
  }

  return feeItems.some((item, index) => {
    const currentItem = feeGroup.fee_items[index];
    if (!currentItem) return false;

    return (
      item.itemName.trim() !== currentItem.item_name ||
      item.effectiveStartDate !== currentItem.effective_start_date ||
      item.currentValueIncludingTaxYen !== currentItem.current_value_including_tax_yen ||
      !hasSameScheduledChanges(item.scheduledChanges, currentItem.scheduled_changes)
    );
  });
}
