'use client';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { Check } from 'lucide-react';

import { StatusCard } from '@/components/common/status-card';

import { type GetCrmStaffsByIdResponse } from '@/lib/api/types.gen';

import { StaffDeactivateAction } from '../../_components/staff-deactivate-action';
import { STAFF_STATUS_LABELS, StaffStatus } from '../../_constants/constants';
import { StaffReactivateAction } from './staff-reactivate-action';

type Staff = GetCrmStaffsByIdResponse['staff'];

interface StaffStatusCardProps {
  staff: Staff;
}

/**
 * Right-column StatusCard — tone/icon/label/meta lines, 無効化する action button
 * src: staff-detail.tsx L299-315
 */
export function StaffStatusCard({ staff }: StaffStatusCardProps) {
  const staffStatus = staff.status as StaffStatus;
  const fullName = `${staff.personal_info.last_name} ${staff.personal_info.first_name}`.trim();

  return (
    <StatusCard
      tone={staffStatus === StaffStatus.ACTIVE ? 'success' : 'muted'}
      icon={Check}
      label={STAFF_STATUS_LABELS[staffStatus] || '-'}
      meta={[
        `作成: ${formatDateYYYYMMDD_HHMM(staff.created_at)}`,
        `更新: ${formatDateYYYYMMDD_HHMM(staff.updated_at)}`,
      ]}
      action={
        staffStatus === StaffStatus.INACTIVE ? (
          <StaffReactivateAction staffId={staff.id} staffName={fullName} />
        ) : (
          <StaffDeactivateAction staffId={staff.id} staffName={fullName} withReason />
        )
      }
    />
  );
}
