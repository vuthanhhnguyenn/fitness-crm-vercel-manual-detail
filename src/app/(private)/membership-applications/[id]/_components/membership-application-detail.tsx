'use client';
// Holds local UI/dialog state and mutation calls — client-only.
import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';

import { getCrmMembershipApplicationsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { ApiErrorWithStatus } from '@/types/global.type';

import { ActivityTimelineCard } from './activity-timeline-card';
import { ApplicantInfoCard } from './applicant-info-card';
import { ApplicationMetaCard } from './application-meta-card';
import { BlacklistResultCard } from './blacklist-result-card';
import { CancelMenuDropdown } from './cancel-dialog-menu';
import { CompanionUpgradeBanner } from './companion-upgrade-banner';
import { ContractInfoCard } from './contract-info-card';
import { FeePaymentCard } from './fee-payment-card';
import { MembershipApplicationDetailSkeleton } from './membership-application-detail-skeleton';
import { getStatusBadge, getStatusLabel } from './membership-application.utils';
import { StatusActionCard } from './status-action-card';

interface MembershipApplicationDetailProps {
  applicationId: string;
}

export function MembershipApplicationDetail({
  applicationId,
}: Readonly<MembershipApplicationDetailProps>) {
  const { data, isLoading, isError, error, refetch } = useQuery(
    getCrmMembershipApplicationsByIdOptions({ path: { id: applicationId } }),
  );
  const isNotFound = (error as ApiErrorWithStatus)?.status === 404;

  // ⚠️ PROVISIONAL (FR-025a) — staff-discretionary enrolment-fee exemption reason,
  // lifted here so both the fee card (which renders the input) and the approve
  // mutation (which submits it) share the same value. See the note in
  // `fee-payment-card.tsx` and `membership-application.table.ts`.
  const [staffExemptionOpen, setStaffExemptionOpen] = useState(false);
  const [staffExemptionReason, setStaffExemptionReason] = useState('');

  const app = data?.application;

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError && !isNotFound}
      isEmpty={isNotFound || !app}
      onRetry={() => void refetch()}
      skeleton={<MembershipApplicationDetailSkeleton />}
      errorTitle="申込情報を読み込めませんでした"
      emptyTitle="申込情報が見つかりません"
    >
      {app && (
        <>
          <PageHeader
            breadcrumb={
              <BackLink label="入会申請管理に戻る" href={navigate('/membership-applications')} />
            }
            title={app.applicant_name}
            badge={
              <Badge
                variant="outline"
                className={`gap-1 text-[10px] font-medium ${getStatusBadge(app.status)}`}
              >
                {getStatusLabel(app.status)}
              </Badge>
            }
            actions={
              (app.status === 'approved' || app.status === 'auto_approved') && (
                <CancelMenuDropdown app={app} />
              )
            }
          />
          <div className="bg-muted/40 p-6 pt-4">
            {/* 2-column layout */}
            <div className="flex gap-6">
              {/* Left Column (60%) */}
              <div className="flex w-[60%] flex-col gap-4">
                {app.companion_upgrade && (
                  <CompanionUpgradeBanner companionUpgrade={app.companion_upgrade} />
                )}
                <ApplicantInfoCard app={app} />
                <BlacklistResultCard app={app} />
                <ContractInfoCard app={app} />
                <FeePaymentCard
                  app={app}
                  staffExemptionOpen={staffExemptionOpen}
                  staffExemptionReason={staffExemptionReason}
                  onStaffExemptionOpenChange={setStaffExemptionOpen}
                  onStaffExemptionReasonChange={setStaffExemptionReason}
                />
                <ActivityTimelineCard
                  initialTimeline={app.timeline}
                  applicationId={applicationId}
                />
              </div>

              {/* Right Column (40%) sticky */}
              <div className="w-[40%]">
                <div className="sticky top-20 flex flex-col gap-4">
                  <StatusActionCard
                    app={app}
                    applicationId={applicationId}
                    staffExemptionReason={staffExemptionReason}
                    onStaffExemptionReasonChange={setStaffExemptionReason}
                  />
                  <ApplicationMetaCard app={app} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DataStateBoundary>
  );
}
