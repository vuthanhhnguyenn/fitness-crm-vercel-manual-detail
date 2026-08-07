'use client';

import { useQuery } from '@tanstack/react-query';

import { getCrmMembersByIdContractsSummaryOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmMembersByIdResponse } from '@/lib/api/types.gen';

import { ActiveCampaignsCard, CampaignHistoryCard } from './campaigns-card';
import { ContractSummaryCard } from './contract-summary-card';
import { DayPassHistoryCard } from './day-pass-history-card';
import { MainContractCard } from './main-contract-card';
import { OptionContractsCard } from './option-contracts-card';
import { UsageStatusCard } from './usage-status-card';

type MemberStatus = GetCrmMembersByIdResponse['profile']['status'];

interface ContractsTabProps {
  memberId: string;
  memberStatus?: MemberStatus;
}

export function ContractsTab({ memberId, memberStatus }: ContractsTabProps) {
  const { data } = useQuery(
    getCrmMembersByIdContractsSummaryOptions({
      path: { id: memberId },
    }),
  );

  const isOnLeave = memberStatus === 'suspended';
  const isRetirePending = memberStatus === 'pending_withdrawal';
  const hasUnpaidFee = (data?.unpaid_amount ?? 0) > 0;

  return (
    <div className="flex gap-4">
      {/* Left Column (60%) */}
      <div className="flex w-[60%] flex-col gap-4">
        <MainContractCard memberId={memberId} />

        <OptionContractsCard
          memberId={memberId}
          isOnLeave={isOnLeave}
          isRetirePending={isRetirePending}
          hasUnpaidFee={hasUnpaidFee}
        />

        <ActiveCampaignsCard memberId={memberId} />

        <CampaignHistoryCard memberId={memberId} />

        <DayPassHistoryCard memberId={memberId} />
      </div>

      {/* Right Column (40%) */}
      <div className="w-[40%]">
        <div className="sticky flex flex-col gap-4">
          <ContractSummaryCard memberId={memberId} />
          <UsageStatusCard memberId={memberId} />
        </div>
      </div>
    </div>
  );
}
