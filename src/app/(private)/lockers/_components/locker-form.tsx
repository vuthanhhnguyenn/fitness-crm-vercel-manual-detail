'use client';

import { LockerFormAreaSection } from './locker-form-area-section';
import { LockerFormBasicInfoSection } from './locker-form-basic-info-section';
import { LockerFormConfigurationSection } from './locker-form-configuration-section';

type LockerFormProps = {
  mode?: 'create' | 'edit';
  lockerId?: string;
};

export function LockerForm({ mode = 'create', lockerId }: LockerFormProps) {
  return (
    <div className="space-y-6">
      <LockerFormBasicInfoSection />
      <LockerFormAreaSection excludeLockerId={mode === 'edit' ? lockerId : undefined} />
      <LockerFormConfigurationSection mode={mode} lockerId={lockerId} />
    </div>
  );
}
