'use client';

import { useQuery } from '@tanstack/react-query';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';

import { getCrmMembershipApplicationsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { ActivityTimelineCard } from './activity-timeline-card';
import { ApplicantInfoCard } from './applicant-info-card';
import { ApplicationMetaCard } from './application-meta-card';
import { BlacklistResultCard } from './blacklist-result-card';
import { CancelMenuDropdown } from './cancel-dialog-menu';
import { ContractInfoCard } from './contract-info-card';
import { FeePaymentCard } from './fee-payment-card';
import { MembershipApplicationDetailSkeleton } from './membership-application-detail-skeleton';
import { getStatusBadge, getStatusLabel } from './membership-application.utils';
import { StatusActionCard } from './status-action-card';

type ApplicationStatus = 'pending' | 'review' | 'approved' | 'rejected' | 'cancelled';

interface MembershipApplicationDetailProps {
  applicationId: string;
}

export function MembershipApplicationDetail({
  applicationId,
}: Readonly<MembershipApplicationDetailProps>) {
  const { data, isLoading, error } = useQuery(
    getCrmMembershipApplicationsByIdOptions({ path: { id: applicationId } }),
  );

  if (isLoading) return <MembershipApplicationDetailSkeleton />;

  if (error || !data?.application) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-destructive">申込情報が見つかりません</div>
      </div>
    );
  }

  const app = data.application;
  const status = app.status as ApplicationStatus;

  const BREADCRUMB_ITEMS = [
    { url: navigate('/membership-applications'), label: app.applicant_name },
    { label: '会員詳細' },
  ];

  return (
    <>
      <PageHeader
        breadcrumb={<BreadcrumbNav items={BREADCRUMB_ITEMS} variant="section" />}
        title={app.applicant_name}
        badge={
          <Badge
            variant="outline"
            className={`gap-1 text-[10px] font-medium ${getStatusBadge(status)}`}
          >
            {getStatusLabel(status)}
          </Badge>
        }
        actions={<CancelMenuDropdown app={app} />}
      />
      <div className="bg-muted/40 p-6 pt-4">
        {/* 2-column layout */}
        <div className="flex gap-6">
          {/* Left Column (60%) */}
          <div className="flex w-[60%] flex-col gap-4">
            <ApplicantInfoCard app={app} />
            <BlacklistResultCard
              blacklistMatch={app.blacklist_match}
              blacklistConditions={app.blacklist_conditions ?? []}
            />
            <ContractInfoCard app={app} />
            <FeePaymentCard app={app} />
            <ActivityTimelineCard
              initialTimeline={
                (app.timeline as {
                  id: string;
                  kind: 'system' | 'memo';
                  date: string;
                  operator: string;
                  content: string;
                }[]) ?? []
              }
              applicationId={applicationId}
            />
          </div>

          {/* Right Column (40%) sticky */}
          <div className="w-[40%]">
            <div className="sticky top-20 flex flex-col gap-4">
              <StatusActionCard app={app} applicationId={applicationId} />
              <ApplicationMetaCard app={app} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
