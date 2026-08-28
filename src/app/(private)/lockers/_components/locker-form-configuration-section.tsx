'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  getCrmLockersByIdOptions,
  getCrmStoresByIdOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import { LockerOptionType, StoreListBrand } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  LOCKER_LOCK_TYPE_LABELS,
  LOCKER_OPTION_TYPE_LABELS,
  LOCKER_SHAPE_LABELS,
  LOCKER_SLOT_OPEN_TYPE_LABELS,
} from '../_constants/constants';
import { LOCKER_NUMBERING_PATTERN_LABELS } from '../_constants/locker-form.constants';
import type {
  LockerFormValues,
  LockerSlotLockSettingFormValue,
} from '../_schemas/locker-form.schema';
import { LOCKER_SLOT_START_NUMBER } from '../_utils/locker-slot-numbering.util';
import {
  type LockerOptionMasterItem,
  LockerOptionMasterSelect,
} from './locker-option-master-select';
import { SlotGridPreview } from './slot-grid-preview';
import { SlotLockSettingsTable } from './slot-lock-settings-table';

type LockerFormConfigurationSectionProps = {
  mode: 'create' | 'edit';
  lockerId?: string;
};

export function LockerFormConfigurationSection({
  mode,
  lockerId,
}: LockerFormConfigurationSectionProps) {
  const router = useRouter();
  const form = useFormContext<LockerFormValues>();
  const isEdit = mode === 'edit';

  // The master is paged by the Select, so the option the user just picked is kept here to
  // label the trigger; on edit the saved code is labelled from the locker detail instead.
  const [pickedContractOption, setPickedContractOption] = useState<LockerOptionMasterItem | null>(
    null,
  );
  const [pickedBottomOption, setPickedBottomOption] = useState<LockerOptionMasterItem | null>(null);

  const shape = useWatch({ control: form.control, name: 'shape' });
  const storeId = useWatch({ control: form.control, name: 'store_id' });
  const locationSymbol = useWatch({ control: form.control, name: 'location_symbol' });
  const numberingPattern = useWatch({ control: form.control, name: 'slot_numbering_pattern' });
  const defaultLockType = useWatch({ control: form.control, name: 'default_lock_type' });
  const slotLockSettings = useWatch({ control: form.control, name: 'slot_lock_settings' }) ?? [];

  // New FIT365 lockers only allow dial locks (#219 / E-01). When editing, respect the existing setting.
  const { data: selectedStoreRes } = useQuery({
    ...getCrmStoresByIdOptions({ path: { id: storeId } }),
    enabled: Boolean(storeId) && !isEdit,
  });
  const isDialLockOnly = !isEdit && selectedStoreRes?.store?.brand === StoreListBrand.FIT365;

  // E-01 FR-002 error case: the lock type of an in-use slot cannot be changed
  const { data: lockerDetailRes } = useQuery({
    ...getCrmLockersByIdOptions({ path: { id: lockerId ?? '' } }),
    enabled: isEdit && Boolean(lockerId),
  });
  const inUseSlotNumbers = useMemo(
    () =>
      (lockerDetailRes?.locker.slot_items ?? [])
        .filter((slot) => slot.status === 'in_use')
        .map((slot) => slot.slot_number),
    [lockerDetailRes?.locker.slot_items],
  );

  const contractTypeCode = useWatch({ control: form.control, name: 'contract_type_code' });
  const bottomContractTypeCode = useWatch({
    control: form.control,
    name: 'bottom_contract_type_code',
  });
  // Labels for the saved codes: the master is paged, so on edit they come from the locker
  // detail rather than from a list the client would otherwise have to load in full.
  const savedContractOption = lockerDetailRes?.locker.standard_option_contract_master;
  const savedBottomOption = lockerDetailRes?.locker.bottom_option_contract_master;
  const contractCodeLabel =
    pickedContractOption?.code === contractTypeCode
      ? pickedContractOption?.name
      : savedContractOption?.code === contractTypeCode
        ? savedContractOption?.name
        : undefined;
  const bottomContractCodeLabel =
    pickedBottomOption?.code === bottomContractTypeCode
      ? pickedBottomOption?.name
      : savedBottomOption?.code === bottomContractTypeCode
        ? savedBottomOption?.name
        : undefined;

  useEffect(() => {
    if (!isDialLockOnly) return;

    if (form.getValues('default_lock_type') === 'cylinder') {
      form.setValue('default_lock_type', 'dial', { shouldDirty: true });
    }

    const settings = form.getValues('slot_lock_settings') ?? [];
    if (settings.some((setting) => setting.lock_type === 'cylinder')) {
      form.setValue(
        'slot_lock_settings',
        settings.map((setting) =>
          setting.lock_type === 'cylinder' ? { ...setting, lock_type: 'dial' as const } : setting,
        ),
        { shouldDirty: true },
      );
    }
  }, [form, isDialLockOnly]);

  const handleSlotSettingChange = (slotNumber: string, setting: LockerSlotLockSettingFormValue) => {
    const current = form.getValues('slot_lock_settings') ?? [];
    const defaultType = form.getValues('default_lock_type');
    const isDefault =
      setting.lock_type === defaultType && (!setting.password || setting.password === '');

    const withoutCurrent = current.filter((item) => item.slot_number !== slotNumber);
    const next = isDefault ? withoutCurrent : [...withoutCurrent, setting];
    form.setValue('slot_lock_settings', next, { shouldDirty: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">ロッカー構成</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        {isEdit ? (
          <div className="bg-warning/10 border-warning/20 mb-4 rounded-lg border px-4 py-3">
            <p className="text-warning text-xs">
              ロッカー形状の変更は、既存の契約に影響します。変更が必要な場合はサポートへご連絡ください。
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="shape"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  形状<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  key={`shape-${field.value ?? 'empty'}`}
                  value={field.value ? field.value : undefined}
                  onValueChange={field.onChange}
                  disabled={isEdit}
                >
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="選択してください">
                        {LOCKER_SHAPE_LABELS[field.value]}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(LOCKER_SHAPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slot_numbering_pattern"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  スロット番号付与パターン<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue>{LOCKER_NUMBERING_PATTERN_LABELS[field.value]}</SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(LOCKER_NUMBERING_PATTERN_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground mt-1 text-xs">
                  形状と番号付与パターンに基づき、スロット番号は自動採番されます（手動での番号指定はできません）
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="option_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>オプション契約</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue>{LOCKER_OPTION_TYPE_LABELS[field.value]}</SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(LOCKER_OPTION_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contract_type_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>契約形態コード（最下段以外）</FormLabel>
                <FormControl>
                  <LockerOptionMasterSelect
                    value={field.value ?? ''}
                    valueLabel={contractCodeLabel}
                    placeholder="G-02 オプション管理から選択"
                    searchPlaceholder="契約形態コード・名称で検索"
                    emptyMessage="該当する契約形態コードがありません"
                    triggerClassName="h-8 w-full text-sm"
                    disabled={form.watch('option_type') === LockerOptionType.NONE}
                    hasError={Boolean(form.formState.errors.contract_type_code)}
                    onSelect={(option) => {
                      setPickedContractOption(option);
                      field.onChange(option?.code ?? null);
                    }}
                  />
                </FormControl>
                <p className="text-muted-foreground mt-1 text-xs">
                  最下段を除く全スロットに適用される料金体系コードです
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* FR-013: bottom-row fee option. Optional — when unset, the standard code applies to every row. */}
          <FormField
            control={form.control}
            name="bottom_contract_type_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>契約形態コード（最下段）</FormLabel>
                <FormControl>
                  <LockerOptionMasterSelect
                    value={field.value ?? ''}
                    valueLabel={bottomContractCodeLabel}
                    placeholder="未設定（最下段以外と同じ）"
                    searchPlaceholder="契約形態コード・名称で検索"
                    emptyMessage="該当する契約形態コードがありません"
                    triggerClassName="h-8 w-full text-sm"
                    disabled={form.watch('option_type') === LockerOptionType.NONE}
                    hasError={Boolean(form.formState.errors.bottom_contract_type_code)}
                    onSelect={(option) => {
                      setPickedBottomOption(option);
                      field.onChange(option?.code ?? null);
                    }}
                  />
                </FormControl>
                <p className="text-muted-foreground mt-1 text-xs">
                  最下段スロットに個別の割引・割増を適用する場合に設定します（未設定なら全段同一）
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="default_open_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  開閉方法（デフォルト）<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="選択してください">
                        {LOCKER_SLOT_OPEN_TYPE_LABELS[field.value]}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(LOCKER_SLOT_OPEN_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="default_lock_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  施錠方法（デフォルト）<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue>{LOCKER_LOCK_TYPE_LABELS[field.value]}</SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(LOCKER_LOCK_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem
                        key={value}
                        value={value}
                        disabled={isDialLockOnly && value === 'cylinder'}
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground mt-1 text-xs">
                  スロットごとに個別変更できます（下表参照）
                </p>
                {isDialLockOnly ? (
                  <p className="text-muted-foreground mt-1 text-xs">
                    FIT365店舗の新規ロッカーはダイヤル式のみ選択できます
                  </p>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* E-01 FR-002: slot size W×H×D (default for the whole locker; shown on the member-facing screen per FR-010) */}
          <FormItem className="md:col-span-2">
            <FormLabel>
              スロットサイズ（W×H×D・デフォルト）
              <span className="text-destructive ml-0.5">*</span>
            </FormLabel>
            <div className="flex flex-wrap items-start gap-3">
              {(
                [
                  { name: 'default_slot_size.width_cm', label: '横幅', placeholder: '35' },
                  { name: 'default_slot_size.height_cm', label: '高さ', placeholder: '40' },
                  { name: 'default_slot_size.depth_cm', label: '奥行き', placeholder: '48' },
                ] as const
              ).map((dimension) => (
                <FormField
                  key={dimension.name}
                  control={form.control}
                  name={dimension.name}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">{dimension.label}:</span>
                        <FormControl>
                          <Input
                            inputMode="numeric"
                            placeholder={dimension.placeholder}
                            className="h-8 w-16 text-sm"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(event) =>
                              field.onChange(event.target.value.replace(/\D/g, ''))
                            }
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              単位:
              cm。会員向けスロット選択画面に表示されます。スロット単位の個別変更は「スロット個別設定」から行えます
            </p>
          </FormItem>
        </div>

        {shape && locationSymbol ? (
          <SlotGridPreview
            shape={shape}
            prefix={locationSymbol}
            startNum={LOCKER_SLOT_START_NUMBER}
            pattern={numberingPattern}
          />
        ) : null}

        {shape && locationSymbol ? (
          <SlotLockSettingsTable
            shape={shape}
            prefix={locationSymbol}
            startNum={LOCKER_SLOT_START_NUMBER}
            pattern={numberingPattern}
            defaultLockType={defaultLockType}
            slotSettings={slotLockSettings}
            inUseSlotNumbers={inUseSlotNumbers}
            cylinderDisabled={isDialLockOnly}
            onSlotSettingChange={handleSlotSettingChange}
          />
        ) : null}

        <div className="mt-4">
          {isEdit && lockerId ? (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 text-sm"
              onClick={() => router.push(`${navigate('/lockers/[id]', lockerId)}?tab=slots`)}
            >
              <Settings2 className="size-4" />
              スロット個別設定（詳細画面で設定）
            </Button>
          ) : (
            <Button type="button" variant="outline" className="w-full gap-2 text-sm" disabled>
              <Settings2 className="size-4" />
              スロット個別設定（保存後に設定可能）
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
