'use client';

import { useEffect, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import { Info } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type {
  GetCrmLockersByIdResponse,
  GetCrmLockersContractsByIdResponse,
} from '@/lib/api/types.gen';

import type { LockerContractFormValues } from '../_schemas/locker-contract-form.schema';

type LockerDetail = NonNullable<GetCrmLockersByIdResponse>['locker'];
type LockerContractDetail = NonNullable<GetCrmLockersContractsByIdResponse>['contract'];

type LockerContractContractInfoSectionProps = {
  contract: LockerContractDetail;
  locker?: LockerDetail;
};

export function LockerContractContractInfoSection({
  contract,
  locker,
}: LockerContractContractInfoSectionProps) {
  const form = useFormContext<LockerContractFormValues>();
  const contractTypeCode = useWatch({ control: form.control, name: 'contract_type_code' });
  const slotNumber = useWatch({ control: form.control, name: 'slot_number' });

  const selectedSlot = useMemo(
    () => (locker?.slot_items ?? []).find((slot) => slot.slot_number === slotNumber),
    [locker?.slot_items, slotNumber],
  );

  /**
   * FR-013: the fee applying to a slot comes from the cabinet's pair — the bottom-row code for
   * slots flagged `is_bottom_row`, the standard code otherwise — so those are the only codes
   * the contract may name. The designed backend rejects anything else (E-VAL-001).
   */
  const feeOptions = useMemo(() => {
    const candidates = [
      locker?.standard_option_contract_master,
      locker?.bottom_option_contract_master,
    ].filter((option) => option != null);
    return candidates.filter(
      (option, index) => candidates.findIndex((item) => item.code === option.code) === index,
    );
  }, [locker?.standard_option_contract_master, locker?.bottom_option_contract_master]);

  const applicableCode = selectedSlot?.is_bottom_row
    ? (locker?.bottom_contract_type_code ?? locker?.contract_type_code)
    : locker?.contract_type_code;

  const selectedContractType = feeOptions.find((option) => option.code === contractTypeCode);
  // Only the slot's own resolved master carries a description; the pair refs do not.
  const selectedDescription =
    selectedSlot?.contract_type?.code === contractTypeCode
      ? selectedSlot?.contract_type?.description
      : null;

  const endDateLabel = contract.end_date ? formatDateYYYYMMDD(contract.end_date) : '';

  // Moving the contract to a slot on another row changes which of the cabinet's two fee options applies (FR-013)
  useEffect(() => {
    if (!contractTypeCode || !applicableCode) return;
    // Wait for the locker detail: realigning while it is still in flight would silently rewrite
    // an existing 割引・割増 contract and mark the form dirty, offering to save a change the
    // user never made.
    if (!locker) return;
    if (feeOptions.some((option) => option.code === contractTypeCode)) return;

    form.setValue('contract_type_code', applicableCode, { shouldDirty: true });
  }, [applicableCode, contractTypeCode, feeOptions, form, locker]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">契約情報</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  契約開始日<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value}
                    onDateChange={field.onChange}
                    placeholder="日付を選択"
                    hasError={Boolean(form.formState.errors.start_date)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/*
            FR-006: the end date is recorded by the cancellation flow (解約処理 → 解約日),
            which also enforces the cancellation-fee rule (#36). It is display-only here so
            editing a contract cannot bypass that rule; use the 解約 dialog to change it.
          */}
          <FormItem>
            <FormLabel>契約終了日</FormLabel>
            <Input className="bg-muted h-8" value={endDateLabel} disabled readOnly />
          </FormItem>
        </div>

        <div className="bg-muted/30 mt-4 rounded-lg border px-4 py-4">
          <p className="mb-3 text-xs font-medium">契約種類</p>
          <FormField
            control={form.control}
            name="contract_type_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  契約種類<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  disabled={feeOptions.length === 0}
                >
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="選択してください">
                        {selectedContractType?.name}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {feeOptions.map((option) => (
                      <SelectItem key={option.code} value={option.code}>
                        {option.name}（¥{option.price_including_tax.toLocaleString()}/月）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedContractType ? (
            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">契約形態コード</p>
                <p className="font-mono text-sm font-medium">{selectedContractType.code}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">適用料金（月額）</p>
                <p className="text-sm font-medium">
                  ¥{selectedContractType.price_including_tax.toLocaleString()} / 月（税込）
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1 text-xs">適用条件</p>
                <p className="text-sm">{selectedDescription ?? '—'}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex items-start gap-2 border-t pt-3">
            <Info className="text-muted-foreground mt-0.5 size-3 shrink-0" />
            <p className="text-muted-foreground text-xs">
              選択した契約種類に基づき、契約形態コードと料金が自動適用されます。
              {selectedSlot?.is_bottom_row
                ? '最下段スロットのため、ロッカー設備に登録された最下段用の契約形態コードが適用されます。'
                : '最下段以外のスロットのため、ロッカー設備に登録された標準の契約形態コードが適用されます。'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
