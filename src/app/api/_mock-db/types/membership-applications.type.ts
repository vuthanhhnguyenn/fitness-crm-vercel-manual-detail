import type { DirectEnrollmentRequest as DirectEnrollmentRequestType } from '@/app/api/_schemas/membership-application.schema';

import type {
  MembershipApplication,
  MembershipApplicationStatus,
} from '@/types/api/membership-application.type';

import type { MembershipApplicationDetails } from '../seeds/membership.seed';

export type MembershipApplicationsType = {
  _seeded: boolean;
  _seed(): void;
  getAll(): MembershipApplication[];
  getById(id: string): MembershipApplication | undefined;
  getDetails(id: string): MembershipApplicationDetails;
  updateDetails(id: string, patch: Record<string, unknown>): unknown;
  updateStatus(id: string, status: MembershipApplicationStatus): MembershipApplication | undefined;
  addMemo(
    id: string,
    content: string,
    operator: string,
  ): MembershipApplicationDetails['timeline'] | undefined;
  deleteMemo(id: string, memoId: string): boolean;
  createDirect(data: DirectEnrollmentRequestType, blMatched: boolean): MembershipApplication;
};
