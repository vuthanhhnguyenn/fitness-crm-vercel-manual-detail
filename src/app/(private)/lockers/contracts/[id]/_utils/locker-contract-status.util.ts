import { LockerContractStatus } from '@/lib/api/types.gen';

export function isLockerContractTerminated(contract: {
  termination_date: string | null;
  status: LockerContractStatus;
}): boolean {
  return contract.termination_date !== null && contract.status === LockerContractStatus.IN_USE;
}
