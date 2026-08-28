import type { MembershipApplication } from '@/app/api/_schemas/membership-application.schema';

import type { Campaign, GetContractsResponse } from '@/lib/api/types.gen';

import type { ContractRow } from '../seeds/membership.seed';

type StoredContractChange = {
  changed_at: string;
  previous_plan: string;
  new_plan: string;
  reason?: string;
};

/**
 * A-01 FR-013a: a submitted 主契約変更 is an application awaiting the month-start run, so the
 * plan itself stays untouched while this record exists. At most one per contract.
 */
type StoredPendingPlanChange = {
  /** Where the booking came from — a member-level request or an HQ bulk job. */
  source: 'application' | 'bulk_job';
  source_id: string;
  application_id: string;
  to_plan_id: string;
  to_plan_name: string;
  to_monthly_fee: number;
  effective_from: string;
  requested_at: string;
  requested_by: string;
};

type StoredMainContract = {
  id: string;
  plan_name: string;
  monthly_fee: number;
  start_date: string;
  penalty_period_end?: string;
  change_history: StoredContractChange[];
  pending_plan_change?: StoredPendingPlanChange;
};

type StoredOptionContract = {
  id: string;
  name: string;
  monthly_fee: number;
  start_date: string;
  next_billing_date: string;
  status?: 'active' | 'scheduled' | 'cancel_scheduled';
};

type StoredCampaign = {
  id: string;
  campaign_name: string;
  period_start?: string;
  period_end?: string;
  discount_content?: string;
  remaining_days?: number;
  applied_at?: string;
  content?: string;
  status?: Campaign['status'];
};

/**
 * How a contract row is stored in the mock DB.
 *
 * The 主契約 / オプション契約 / キャンペーン endpoints serve camelCase (`MainContract`,
 * `OptionContract`, `Campaign`), but these rows are seeded — and read — by the membership
 * application and family-registration mocks in snake_case, so storage keeps that casing and the
 * routes convert at the boundary via `_lib/member-contract.ts`.
 */
export type ContractsRecord = Omit<
  GetContractsResponse,
  'mainContract' | 'optionContracts' | 'campaigns'
> & {
  main_contract: StoredMainContract;
  option_contracts: StoredOptionContract[];
  campaigns: { active: StoredCampaign[]; history: StoredCampaign[] };
};

export type ContractType = {
  _seeded: boolean;
  _seed(): void;
  getById(contractId: string): ContractRow | undefined;
  getByPlanName(planName: string): ContractRow | undefined;
  getByMemberId(memberId: string): ContractsRecord | undefined;
  getByApplicationId(applicationId: string): ContractRow | undefined;
  create(input: {
    contract_id: string;
    member_id?: string;
    application_id?: string;
    data: ContractsRecord;
  }): ContractRow;
  createFromApprovedApplication(input: { application: MembershipApplication; member_id: string }): {
    member_id: string;
    contract_id: string;
  };
};
