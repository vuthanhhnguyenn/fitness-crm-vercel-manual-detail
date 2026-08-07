'use client';

import { Info } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { LockerLockType, LockerNumberingPattern, LockerShape } from '@/lib/api/types.gen';

import { LOCKER_LOCK_TYPE_LABELS } from '../_constants/constants';
import type { LockerSlotLockSettingFormValue } from '../_schemas/locker-form.schema';
import { buildLockerSlotPositions } from '../_utils/locker-slot-numbering.util';

type SlotLockSettingsTableProps = {
  shape: LockerShape;
  prefix: string;
  startNum: number;
  pattern: LockerNumberingPattern;
  defaultLockType: LockerLockType;
  slotSettings: LockerSlotLockSettingFormValue[];
  onSlotSettingChange: (slotNumber: string, setting: LockerSlotLockSettingFormValue) => void;
};

function findSlotSetting(
  settings: LockerSlotLockSettingFormValue[],
  slotNumber: string,
): LockerSlotLockSettingFormValue | undefined {
  return settings.find((setting) => setting.slot_number === slotNumber);
}

export function SlotLockSettingsTable({
  shape,
  prefix,
  startNum,
  pattern,
  defaultLockType,
  slotSettings,
  onSlotSettingChange,
}: SlotLockSettingsTableProps) {
  if (!prefix || !shape) return null;

  const slots = buildLockerSlotPositions(prefix, shape, pattern, startNum);
  if (slots.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2">
        <Info className="text-muted-foreground size-4" />
        <p className="text-muted-foreground text-xs">
          スロットごとに施錠方法を個別変更できます。変更しない場合は上記「施錠方法（デフォルト）」が適用されます。
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-3 py-2 text-left text-xs font-semibold">スロット番号</th>
              <th className="px-3 py-2 text-left text-xs font-semibold">位置</th>
              <th className="px-3 py-2 text-left text-xs font-semibold">施錠方法</th>
              <th className="px-3 py-2 text-left text-xs font-semibold">
                暗証番号（ダイヤル錠のみ）
              </th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => {
              const customized = findSlotSetting(slotSettings, slot.slot_number);
              const setting: LockerSlotLockSettingFormValue = customized ?? {
                slot_number: slot.slot_number,
                lock_type: defaultLockType,
                password: '',
              };
              const isCustomized = customized !== undefined;

              return (
                <tr
                  key={slot.slot_number}
                  className={`border-b last:border-0 ${isCustomized ? 'bg-primary/10' : ''}`}
                >
                  <td className="px-3 py-2 text-xs font-medium">{slot.slot_number}</td>
                  <td className="text-muted-foreground px-3 py-2 text-xs">
                    {slot.row_number}段 {slot.column_number}列
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={setting.lock_type}
                      onValueChange={(value) => {
                        onSlotSettingChange(slot.slot_number, {
                          slot_number: slot.slot_number,
                          lock_type: value as LockerLockType,
                          password: value === 'cylinder' ? '' : (setting.password ?? ''),
                        });
                      }}
                    >
                      <SelectTrigger className="h-7 w-[130px] text-xs">
                        <SelectValue>{LOCKER_LOCK_TYPE_LABELS[setting.lock_type]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LOCKER_LOCK_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    {setting.lock_type === 'dial' ? (
                      <Input
                        maxLength={4}
                        placeholder="0000"
                        value={setting.password ?? ''}
                        onChange={(event) => {
                          const next = event.target.value.replace(/\D/g, '').slice(0, 4);
                          onSlotSettingChange(slot.slot_number, {
                            ...setting,
                            password: next,
                          });
                        }}
                        className="h-7 w-20 text-center font-mono text-xs tracking-widest"
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">なし</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="bg-muted/30 text-muted-foreground border-t px-3 py-2 text-xs">
          全 {slots.length} スロット
          {slotSettings.length > 0 && (
            <span className="text-primary ml-2 font-medium">
              （{slotSettings.length}件 個別変更済み）
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
