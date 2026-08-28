/**
 * Member-contract response mappers for the mock API layer.
 *
 * Two shapes coexist on purpose:
 * - **API contract** (camelCase) — what `/crm/members/{id}/contracts/*` serves, matching the rest
 *   of the member-detail bundle (`GetMemberDetailResponse`, day-pass, fee-adjustments, …).
 * - **Mock-DB storage** (snake_case) — `db.contracts` rows are shared with the membership
 *   application / family-registration seeds, so their internal shape stays as seeded.
 *
 * Routes convert at the boundary so neither side leaks its casing into the other.
 */
import type { ContractsRecord } from '@/app/api/_mock-db/types/contracts.type';

import type { Campaigns, MainContract, OptionContract } from '@/lib/api/types.gen';

/** The generator inlines this object, so derive it from `MainContract` rather than importing it. */
type MemberPendingPlanChange = NonNullable<MainContract['pendingPlanChange']>;

type StoredMainContract = ContractsRecord['main_contract'];
type StoredPendingPlanChange = NonNullable<StoredMainContract['pending_plan_change']>;
type StoredOptionContract = ContractsRecord['option_contracts'][number];
type StoredCampaign = ContractsRecord['campaigns']['active'][number];

/** Mock-DB pending plan change → `MemberPendingPlanChange` API shape (A-01 FR-013a). */
export function toPendingPlanChangeResponse(
  stored: StoredPendingPlanChange | undefined,
): MemberPendingPlanChange | undefined {
  if (!stored) return undefined;
  return {
    source: stored.source,
    sourceId: stored.source_id,
    applicationId: stored.application_id,
    toPlanId: stored.to_plan_id,
    toPlanName: stored.to_plan_name,
    toMonthlyFee: stored.to_monthly_fee,
    effectiveFrom: stored.effective_from,
    requestedAt: stored.requested_at,
    requestedBy: stored.requested_by,
  };
}

/** Mock-DB main contract → `MainContract` API shape. */
export function toMainContractResponse(stored: StoredMainContract): MainContract {
  return {
    id: stored.id,
    planName: stored.plan_name,
    monthlyFee: stored.monthly_fee,
    startDate: stored.start_date,
    penaltyPeriodEnd: stored.penalty_period_end,
    changeHistory: (stored.change_history ?? []).map((change) => ({
      changedAt: change.changed_at,
      previousPlan: change.previous_plan,
      newPlan: change.new_plan,
      reason: change.reason,
    })),
    pendingPlanChange: toPendingPlanChangeResponse(stored.pending_plan_change),
  };
}

/** Mock-DB option contract → `OptionContract` API shape (status defaults to 適用中). */
export function toOptionContractResponse(stored: StoredOptionContract): OptionContract {
  return {
    id: stored.id,
    name: stored.name,
    monthlyFee: stored.monthly_fee,
    startDate: stored.start_date,
    nextBillingDate: stored.next_billing_date,
    status: stored.status ?? 'active',
  };
}

/** Mock-DB campaign → `Campaign` API shape. */
function toCampaignResponse(stored: StoredCampaign): Campaigns['active'][number] {
  return {
    id: stored.id,
    campaignName: stored.campaign_name,
    periodStart: stored.period_start,
    periodEnd: stored.period_end,
    discountContent: stored.discount_content,
    remainingDays: stored.remaining_days,
    appliedAt: stored.applied_at,
    content: stored.content,
    status: stored.status,
  };
}

/** Mock-DB campaign buckets → `Campaigns` API shape. */
export function toCampaignsResponse(stored: ContractsRecord['campaigns']): Campaigns {
  return {
    active: stored.active.map(toCampaignResponse),
    history: stored.history.map(toCampaignResponse),
  };
}
