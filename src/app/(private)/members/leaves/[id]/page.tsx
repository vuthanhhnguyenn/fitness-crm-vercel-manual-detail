'use client';

import { useParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Badge } from '@/components/ui/badge';

import { getCrmLeavesByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  LEAVE_STATUS_CLASSES,
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_CLASSES,
  LEAVE_TYPE_LABELS,
} from '../_constants/constants';
import {
  LeaveApprovalFlow,
  LeaveDetailInfo,
  LeaveProxyInfo,
  LeaveRelatedInfo,
} from './_components/leave-detail-info';
import { LeaveDetailSkeleton } from './_components/leave-detail-skeleton';
import { LeaveStatusAction } from './_components/leave-status-action';

export default function LeaveDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isPending, isError } = useQuery({
    ...getCrmLeavesByIdOptions({ path: { id } }),
  });

  const leave = data?.leave;

  return (
    <DataStateBoundary
      isLoading={isPending}
      isError={isError}
      isEmpty={!leave}
      skeleton={<LeaveDetailSkeleton />}
    >
      <div className="flex flex-col gap-4 p-6">
        <BreadcrumbNav
          items={[
            { url: navigate('/members/leaves'), label: '休会・退会管理' },
            { label: leave?.id ?? id },
          ]}
        />

        {/* Page header */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{leave?.id}</h1>
          {leave && (
            <>
              <Badge
                variant="outline"
                className={`text-xs font-medium ${LEAVE_TYPE_CLASSES[leave.type]}`}
              >
                {LEAVE_TYPE_LABELS[leave.type]}
              </Badge>
              {leave.status === 'completed' ? (
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
          )}
        </div>

        {/* Body */}
        {leave && (
          <div className="flex gap-4">
            {/* Left column — 60% */}
            <div className="flex w-[60%] flex-col gap-4">
              <LeaveDetailInfo leave={leave} />
              <LeaveApprovalFlow leave={leave} />
              <LeaveProxyInfo leave={leave} />
              <LeaveRelatedInfo leave={leave} />
            </div>

            {/* Right column — 40% sticky */}
            <div className="w-[40%]">
              <LeaveStatusAction leave={leave} />
            </div>
          </div>
        )}
      </div>
    </DataStateBoundary>
  );
}
