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
  /** Numbers of in-use slots (E-01 FR-002 error case: the lock type of an in-use slot cannot be changed) */
  inUseSlotNumbers?: string[];
  /** New FIT365 lockers only allow dial locks (#219): disable the cylinder lock option */
  cylinderDisabled?: boolean;
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
  inUseSlotNumbers = [],
  cylinderDisabled = false,
  onSlotSettingChange,
}: SlotLockSettingsTableProps) {
  if (!prefix || !shape) return null;

  const slots = buildLockerSlotPositions(prefix, shape, pattern, startNum);
  if (slots.length === 0) return null;

  const inUseSlots = new Set(inUseSlotNumbers);

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2">
        <Info className="text-muted-foreground size-4" />
        <p className="text-muted-foreground text-xs">
          スロットごとに施錠方法を個別変更できます。変更しない場合は上記「施錠方法（デフォルト）」が適用されます。使用中スロットの施錠方法は変更できません。
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-3 py-2 text-left text-xs font-semibold">スロット番号</th>
              <th className="px-3 py-2 text-left text-xs font-semibold">位置</th>
              <th className="px-3 py-2 text-left text-xs font-semibold">状態</th>
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
              // Highlight a row that carries an explicit per-slot setting (a PIN counts) or whose
              // lock type differs from the default — either way it is no longer "just the default".
              const isCustomized =
                customized !== undefined || setting.lock_type !== defaultLockType;
              const isInUse = inUseSlots.has(slot.slot_number);
              // E-01 FR-009 error case: input other than 4 digits is a validation error
              const isPasswordInvalid =
                setting.lock_type === 'dial' &&
                Boolean(setting.password) &&
                setting.password?.length !== 4;

              return (
                <tr
                  key={slot.slot_number}
                  className={`border-b last:border-0 ${isCustomized ? 'bg-primary/10' : ''}`}
                >
                  <td className="px-3 py-2 text-xs font-medium">{slot.slot_number}</td>
                  <td className="text-muted-foreground px-3 py-2 text-xs">
                    {slot.row_number}段 {slot.column_number}列
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {isInUse ? (
                      <span className="text-info font-medium">使用中</span>
                    ) : (
                      <span className="text-muted-foreground">利用可</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={setting.lock_type}
                      disabled={isInUse}
                      onValueChange={(value) => {
                        onSlotSettingChange(slot.slot_number, {
                          slot_number: slot.slot_number,
                          lock_type: value as LockerLockType,
                          password: value === 'cylinder' ? '' : (setting.password ?? ''),
                        });
                      }}
                    >
                      <SelectTrigger className="h-7 w-32.5 text-xs">
                        <SelectValue>{LOCKER_LOCK_TYPE_LABELS[setting.lock_type]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LOCKER_LOCK_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem
                            key={value}
                            value={value}
                            disabled={cylinderDisabled && value === 'cylinder'}
                          >
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    {setting.lock_type === 'dial' ? (
                      <div>
                        <Input
                          maxLength={4}
                          placeholder="0000"
                          value={setting.password ?? ''}
                          aria-invalid={isPasswordInvalid || undefined}
                          onChange={(event) => {
                            const next = event.target.value.replace(/\D/g, '').slice(0, 4);
                            onSlotSettingChange(slot.slot_number, {
                              ...setting,
                              password: next,
                            });
                          }}
                          className={`h-7 w-20 text-center font-mono text-xs tracking-widest ${
                            isPasswordInvalid ? 'border-destructive' : ''
                          }`}
                        />
                        {isPasswordInvalid ? (
                          <p className="text-destructive mt-1 text-xs">4桁で入力してください</p>
                        ) : null}
                      </div>
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
