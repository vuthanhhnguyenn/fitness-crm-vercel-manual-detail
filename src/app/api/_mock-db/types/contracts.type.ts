import type { GetContractsResponse } from '@/lib/api/types.gen';

import type { MembershipApplication } from '@/types/api/membership-application.type';

import type { ContractRow } from '../seeds/membership.seed';

export type ContractType = {
  _seeded: boolean;
  _seed(): void;
  getById(contractId: string): ContractRow | undefined;
  getByPlanName(planName: string): ContractRow | undefined;
  getByMemberId(memberId: string): GetContractsResponse | undefined;
  getByApplicationId(applicationId: string): ContractRow | undefined;
  create(input: {
    contract_id: string;
    member_id?: string;
    application_id?: string;
    data: GetContractsResponse;
  }): ContractRow;
  createFromApprovedApplication(input: { application: MembershipApplication; member_id: string }): {
    member_id: string;
    contract_id: string;
  };
};
