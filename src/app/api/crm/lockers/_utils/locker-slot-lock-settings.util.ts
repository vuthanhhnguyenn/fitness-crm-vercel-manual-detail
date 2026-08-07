import type { LockerLockType, LockerSlotLockSetting } from '@/app/api/_schemas/locker.schema';

export type LockerSlotLockSettingsMeta = {
  default_lock_type: LockerLockType;
  lock_type_by_slot: Record<string, LockerLockType>;
  password_by_slot: Record<string, string>;
};

export function collectSlotLockSettings(meta: LockerSlotLockSettingsMeta): LockerSlotLockSetting[] {
  const settings: LockerSlotLockSetting[] = [];

  for (const [slotNumber, lockType] of Object.entries(meta.lock_type_by_slot)) {
    if (lockType === meta.default_lock_type && !meta.password_by_slot[slotNumber]) {
      continue;
    }
    settings.push({
      slot_number: slotNumber,
      lock_type: lockType,
      password: meta.password_by_slot[slotNumber] ?? null,
    });
  }

  for (const [slotNumber, password] of Object.entries(meta.password_by_slot)) {
    if (meta.lock_type_by_slot[slotNumber]) continue;
    settings.push({
      slot_number: slotNumber,
      lock_type: meta.default_lock_type,
      password,
    });
  }

  return settings;
}

export function applySlotLockSettings(
  meta: LockerSlotLockSettingsMeta,
  defaultLockType: LockerLockType,
  settings: LockerSlotLockSetting[] = [],
): void {
  meta.default_lock_type = defaultLockType;
  meta.lock_type_by_slot = {};
  meta.password_by_slot = {};

  for (const setting of settings) {
    if (setting.lock_type !== defaultLockType) {
      meta.lock_type_by_slot[setting.slot_number] = setting.lock_type;
    }
    if (setting.lock_type === 'dial' && setting.password) {
      meta.password_by_slot[setting.slot_number] = setting.password;
    }
  }
}

export function formatLockerTimestamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
