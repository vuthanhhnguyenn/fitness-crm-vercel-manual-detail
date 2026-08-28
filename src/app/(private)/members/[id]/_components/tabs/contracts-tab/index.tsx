'use client';

import type { GetMemberDetailResponse } from '@/lib/api/types.gen';

import { CampaignsCard } from './campaigns-card';
import { ContractSummaryCard } from './contract-summary-card';
import { DayPassHistoryCard } from './day-pass-history-card';
import { FeeAdjustmentCard } from './fee-adjustment-card';
import { MainContractCard } from './main-contract-card';
import { MemberSuspensionHistoryStrip } from './member-suspension-history-strip';
import { OptionContractsCard } from './option-contracts-card';

type MemberStatus = GetMemberDetailResponse['memberStatus'];

interface ContractsTabProps {
  memberId: string;
  memberStatus?: MemberStatus;
  /** member.constraints from the member-detail bundle (unpaid fee, cancellation-fee period, etc.) */
  constraints?: GetMemberDetailResponse['constraints'];
}

export function ContractsTab({ memberId, memberStatus, constraints }: ContractsTabProps) {
  const isOnLeave = memberStatus === 'suspended';
  const isRetirePending = memberStatus === 'pending_withdrawal';
  // Use member.constraints from the member-detail bundle as the single source of truth for the
  // unpaid / cancellation-period flags (deriving them from another query lifts the restriction
  // while that query is still loading)
  const hasUnpaidFee = constraints?.hasUnpaidFee ?? false;
  const inCancellationPeriod = constraints?.inCancellationPeriod ?? false;

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* Left Column (60%) */}
      <div className="flex w-full flex-col gap-4 md:w-[60%]">
        <MainContractCard memberId={memberId} />

        <FeeAdjustmentCard memberId={memberId} />

        <OptionContractsCard
          memberId={memberId}
          isOnLeave={isOnLeave}
          isRetirePending={isRetirePending}
          hasUnpaidFee={hasUnpaidFee}
          inCancellationPeriod={inCancellationPeriod}
        />

        <CampaignsCard memberId={memberId} />

        <DayPassHistoryCard memberId={memberId} />
      </div>

      {/* Right Column (40%) */}
      <div className="w-full md:w-[40%]">
        <div className="sticky top-0 flex flex-col gap-4">
          <ContractSummaryCard memberId={memberId} />
          <MemberSuspensionHistoryStrip memberId={memberId} />
        </div>
      </div>
    </div>
  );
}
