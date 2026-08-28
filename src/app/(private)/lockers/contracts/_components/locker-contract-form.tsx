'use client';

import type {
  GetCrmLockersByIdResponse,
  GetCrmLockersContractsByIdResponse,
} from '@/lib/api/types.gen';

import { LockerContractAssignmentSection } from './locker-contract-assignment-section';
import { LockerContractContractInfoSection } from './locker-contract-contract-info-section';
import { LockerContractMemberSection } from './locker-contract-member-section';
import { LockerContractPasswordSection } from './locker-contract-password-section';
import { LockerContractUnpaidAlert } from './locker-contract-unpaid-alert';

type LockerContractDetail = NonNullable<GetCrmLockersContractsByIdResponse>['contract'];
type LockerDetail = NonNullable<GetCrmLockersByIdResponse>['locker'];

type LockerContractFormProps = {
  contract: LockerContractDetail;
  locker?: LockerDetail;
};

/**
 * Locker contract edit form.
 * E-01: locker contracts are edit-only in the CRM (new contracts are concluded outside the CRM),
 * so the contract holder is read-only; only the assigned slot, contract info, and PIN can be changed.
 */
export function LockerContractForm({ contract, locker }: LockerContractFormProps) {
  return (
    <div className="space-y-6">
      {/* FR-005 error case: unpaid balance check */}
      <LockerContractUnpaidAlert memberId={contract.member_id} />

      <LockerContractMemberSection contract={contract} />
      <LockerContractAssignmentSection locker={locker} currentSlotNumber={contract.locker_number} />
      <LockerContractContractInfoSection contract={contract} locker={locker} />
      <LockerContractPasswordSection locker={locker} />
    </div>
  );
}
