'use client';

import { use } from 'react';

import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';

import { getCrmVisitExperiencesByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { VISIT_EXPERIENCE_STATUS_LABELS } from '@/types/api/visit-experience.type';

import { B01InfoCard } from './_components/b01-info-card';
import { BlacklistResultCard } from './_components/blacklist-result-card';
import { DetailSkeleton } from './_components/detail-skeleton';
import { PermitActions } from './_components/permit-actions';
import { PersonalInfoCard } from './_components/personal-info-card';
import { ReservationInfoCard } from './_components/reservation-info-card';
import { StatusPanel } from './_components/status-panel';
import { TimelineCard } from './_components/timeline-card';

const STATUS_BADGE_CLASS: Record<string, string> = {
  application_received: 'bg-muted text-muted-foreground border-border',
  info_missing: 'bg-warning/15 text-warning border-warning/20',
  bl_checking: 'bg-destructive/15 text-destructive border-destructive/20',
  visiting: 'bg-info/15 text-info border-info/20',
  visit_completed: 'bg-muted text-muted-foreground border-border',
  membership_applied: 'bg-success/15 text-success border-success/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

export default function VisitExperienceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const {
    data: record,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    ...getCrmVisitExperiencesByIdOptions({ path: { id } }),
  });

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="見学・体験管理に戻る" href={navigate('/visit-experiences')} />}
        title={record?.customer_name ?? '見学・体験 詳細'}
        subtitle={record ? `ID: ${record.id}` : undefined}
        badge={
          record ? (
            <Badge
              variant="outline"
              className={`text-[10px] font-medium ${STATUS_BADGE_CLASS[record.status] ?? 'bg-muted text-muted-foreground border-border'}`}
            >
              {VISIT_EXPERIENCE_STATUS_LABELS[record.status] ?? record.status}
            </Badge>
          ) : undefined
        }
      />

      <div className="p-6">
        <DataStateBoundary
          isLoading={isLoading}
          isError={isError}
          isEmpty={!record}
          onRetry={refetch}
          skeleton={<DetailSkeleton />}
          emptyTitle="見学情報が見つかりません"
          emptyDescription="IDを確認して再度お試しください"
          errorTitle="見学情報の取得に失敗しました"
        >
          {record && (
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* Left column (60%): personal info + BL result + timeline */}
              <div className="flex min-w-0 flex-[3] flex-col gap-4">
                <PersonalInfoCard record={record} />
                <BlacklistResultCard record={record} />
                <TimelineCard record={record} />
              </div>

              {/* Right column (40%): sticky status+actions + visit details + B-01 */}
              <div className="flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-0 lg:w-[40%] lg:self-start">
                <StatusPanel record={record} action={<PermitActions record={record} />} />
                <ReservationInfoCard record={record} />
                <B01InfoCard record={record} />
              </div>
            </div>
          )}
        </DataStateBoundary>
      </div>
    </>
  );
}
