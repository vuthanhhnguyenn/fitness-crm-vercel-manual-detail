'use client';

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

import { getCrmOptionsOptions } from '@/lib/api/@tanstack/react-query.gen';
import { LockerOptionType } from '@/lib/api/types.gen';
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

  const { data: lockerContractOptionsData } = useQuery({
    ...getCrmOptionsOptions({
      query: { page: 1, limit: 200, status: 'active', category: 'locker_option' },
    }),
  });
  const lockerContractOptions = lockerContractOptionsData?.options ?? [];

  const shape = useWatch({ control: form.control, name: 'shape' });
  const locationSymbol = useWatch({ control: form.control, name: 'location_symbol' });
  const startNumber = useWatch({ control: form.control, name: 'start_number' });
  const numberingPattern = useWatch({ control: form.control, name: 'slot_numbering_pattern' });
  const defaultLockType = useWatch({ control: form.control, name: 'default_lock_type' });
  const slotLockSettings = useWatch({ control: form.control, name: 'slot_lock_settings' }) ?? [];

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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  スロット番号開始値<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="例: 1"
                    className="h-8"
                    {...field}
                    value={String(field.value ?? 1)}
                  />
                </FormControl>
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
              <FormItem className="md:col-span-2">
                <FormLabel>契約形態コード</FormLabel>
                <Select
                  key={`contract-type-${field.value ?? 'empty'}`}
                  value={field.value ? field.value : undefined}
                  onValueChange={(value) => field.onChange(value)}
                  disabled={form.watch('option_type') === LockerOptionType.NONE}
                >
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="G-02 オプション管理から選択">
                        {field.value
                          ? lockerContractOptions.find((option) => option.code === field.value)
                              ?.name
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {lockerContractOptions.map((option) => (
                      <SelectItem key={option.code} value={option.code}>
                        {`${option.name}（${option.code}）`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground mt-1 text-xs">
                  G-02
                  オプション管理で定義済みの料金体系コードから選択します（ロッカーの形状・メーカー等に紐づくコード）
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
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground mt-1 text-xs">
                  スロットごとに個別変更できます（下表参照）
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {shape && locationSymbol ? (
          <SlotGridPreview
            shape={shape}
            prefix={locationSymbol}
            startNum={Number(startNumber) || 1}
            pattern={numberingPattern}
          />
        ) : null}

        {shape && locationSymbol ? (
          <SlotLockSettingsTable
            shape={shape}
            prefix={locationSymbol}
            startNum={Number(startNumber) || 1}
            pattern={numberingPattern}
            defaultLockType={defaultLockType}
            slotSettings={slotLockSettings}
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
