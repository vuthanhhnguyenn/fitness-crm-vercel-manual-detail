'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import type {
  GetCrmLockersByIdResponse,
  GetCrmLockersContractsByIdResponse,
} from '@/lib/api/types.gen';

import type { LockerContractFormValues } from '../_schemas/locker-contract-form.schema';
import { LockerContractAssignmentSection } from './locker-contract-assignment-section';
import { LockerContractContractInfoSection } from './locker-contract-contract-info-section';
import { LockerContractMemberSection } from './locker-contract-member-section';
import { LockerContractPasswordSection } from './locker-contract-password-section';
import { LockerContractUnpaidAlert } from './locker-contract-unpaid-alert';

type LockerContractDetail = NonNullable<GetCrmLockersContractsByIdResponse>['contract'];
type LockerDetail = NonNullable<GetCrmLockersByIdResponse>['locker'];

type LockerContractFormProps = {
  mode?: 'create' | 'edit';
  contract?: LockerContractDetail;
  locker?: LockerDetail;
};

/** Form UI shared by ロッカー契約新規 and ロッカー契約編集 */
export function LockerContractForm({ mode = 'create', contract, locker }: LockerContractFormProps) {
  const form = useFormContext<LockerContractFormValues>();
  const memberId = useWatch({ control: form.control, name: 'member_id' });

  return (
    <div className="space-y-6">
      {mode === 'create' ? <LockerContractUnpaidAlert memberId={memberId} /> : null}

      <LockerContractMemberSection mode={mode} contract={contract} />
      <LockerContractAssignmentSection
        mode={mode}
        locker={locker}
        currentSlotNumber={mode === 'edit' ? contract?.locker_number : undefined}
      />
      <LockerContractContractInfoSection contract={contract} />
      <LockerContractPasswordSection locker={locker} />
    </div>
  );
}
