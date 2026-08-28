'use client';

import { useParams } from 'next/navigation';

import { MemberHeadupCard } from '@/app/(private)/members/_components/member-headup-card';
import {
  type SuspensionHistoryCell,
  SuspensionHistoryStrip,
} from '@/app/(private)/members/_components/suspension-history-strip';
import { memberTypeLabel } from '@/app/(private)/members/_constants/constants';
import { formatDateYYYYMM } from '@/utils/date.util';
import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';

import { getApiErrorStatus } from '@/lib/api-error.util';
import { getCrmLeavesByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmLeavesByIdResponse } from '@/lib/api/types.gen';
import { LeaveStatus, LeaveType } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { LEAVE_STATUS_CLASSES, LEAVE_STATUS_LABELS } from '../_constants/constants';
import {
  LeaveApprovalFlow,
  LeaveDetailInfo,
  LeaveProxyInfo,
  LeaveRelatedInfo,
} from './_components/leave-detail-info';
import { LeaveDetailSkeleton } from './_components/leave-detail-skeleton';
import { LeaveStatusAction } from './_components/leave-status-action';

/**
 * The detail carries its history inline (FR-057a), while the shared strip takes a per-month
 * record — the same shape the member-detail wrapper builds from its own endpoint.
 */
function toStripHistory(
  months: NonNullable<GetCrmLeavesByIdResponse>['leave']['suspension_history'],
): Record<string, SuspensionHistoryCell> {
  return Object.fromEntries(
    months.map((m) => [
      m.year_month,
      { status: m.status, applicationId: m.application_number ?? undefined },
    ]),
  );
}

export default function LeaveDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isPending, isError, error, refetch } = useQuery({
    ...getCrmLeavesByIdOptions({ path: { id } }),
  });

  const leave = data?.leave;

  // FR-083 — an unknown or out-of-scope id is a not-found, not a permission error:
  // the detail handler answers 404 for both so the two are indistinguishable here.
  const isNotFound = getApiErrorStatus(error) === 404;

  if (isPending || isError || !leave) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHeader
          breadcrumb={<BackLink label="休会・退会管理に戻る" href={navigate('/members/leaves')} />}
          title="休会・退会申請"
        />
        <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
          <DataStateBoundary
            isLoading={isPending}
            isError={isError && !isNotFound}
            isEmpty={isNotFound || (!isPending && !isError && !leave)}
            onRetry={() => void refetch()}
            skeleton={<LeaveDetailSkeleton />}
            errorTitle="申請情報の取得に失敗しました"
            emptyTitle="対象の申請が見つかりません"
            emptyDescription="削除されたか、参照できる権限がない可能性があります。"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        breadcrumb={<BackLink label="休会・退会管理に戻る" href={navigate('/members/leaves')} />}
        title={`${leave.member.name} さんの${leave.type === LeaveType.SUSPENSION ? '休会' : '退会'}申請`}
        badge={
          <>
            {/* FR-058 — the human-readable application number, never the record id. */}
            <Badge variant="secondary" className="font-mono text-xs font-medium">
              {leave.application_number}
            </Badge>
            {leave.status === LeaveStatus.COMPLETED || leave.status === LeaveStatus.CANCELLED ? (
              <Badge variant="secondary" className="text-xs font-medium">
                {LEAVE_STATUS_LABELS[leave.status]}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className={`gap-1 text-xs font-medium ${LEAVE_STATUS_CLASSES[leave.status].badge}`}
              >
                <span
                  className={`size-1.5 rounded-full ${LEAVE_STATUS_CLASSES[leave.status].dot}`}
                />
                {LEAVE_STATUS_LABELS[leave.status]}
              </Badge>
            )}
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
        {/* FR-057a — the member block travels with the application detail; no second lookup. */}
        <MemberHeadupCard
          memberId={leave.member.member_id}
          // FR-059 — identifiers use the member number, never the internal record id.
          memberNumber={leave.member.member_number}
          name={leave.member.name}
          nameKana={leave.member.name_kana}
          legacyMemberCode={leave.member.legacy_member_code}
          memberTypeLabel={memberTypeLabel(leave.member.member_type)}
          contractName={leave.member.contract_name}
          storeName={leave.member.store_name}
          facePhotoUrl={leave.member.face_photo_url}
        />

        {/* 申請情報はタブなしで直接表示（Q-14） */}
        <div className="flex gap-4">
          {/* Left column — 60% */}
          <div className="flex w-[60%] flex-col gap-4">
            <LeaveDetailInfo leave={leave} />
            <LeaveApprovalFlow leave={leave} />
            <LeaveProxyInfo leave={leave} />
            <LeaveRelatedInfo leave={leave} />

            <SuspensionHistoryStrip
              title="休会・退会履歴"
              history={toStripHistory(leave.suspension_history)}
              currentYearMonth={formatDateYYYYMM(new Date())}
              viewApplicationsHref={navigate('/members/leaves', {
                member_id: leave.member.member_id,
              })}
              viewApplicationsLabel="他の申請一覧を見る"
            />
          </div>

          {/* Right column — 40%, sticky */}
          <div className="w-[40%]">
            <LeaveStatusAction leave={leave} />
          </div>
        </div>
      </div>
    </div>
  );
}
