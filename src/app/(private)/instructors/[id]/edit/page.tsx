'use client';

import { useParams } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';

import { getCrmInstructorsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { StaffRole } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';
import { canPerformInstructorAction, getEditableFields } from '@/lib/utils/instructor-permissions';

import { InstructorForm } from '../../_components/instructor-form/instructor-form';
import { InstructorFormSkeleton } from '../../_components/instructor-form/instructor-form-skeleton';

export default function InstructorEditPage() {
  const params = useParams();
  const instructorId = params.id as string;
  const { user } = useAuthUser();

  const { data, isLoading, isError, error, refetch } = useQuery({
    ...getCrmInstructorsByIdOptions({ path: { id: instructorId } }),
    enabled: Boolean(instructorId),
  });
  const isNotFound = error?.message === 'NOT_FOUND';
  const instructor = data?.data;

  if (!instructor) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError && !isNotFound}
        isEmpty={isNotFound || !instructor}
        onRetry={() => void refetch()}
        emptyTitle="指導者が見つかりません"
        emptyDescription={`指定された指導者ID（${instructorId}）は存在しないか、参照権限がありません。`}
        skeleton={<InstructorFormSkeleton />}
      />
    );
  }

  const staffRole = (user?.role.toLowerCase() ?? 'observer') as StaffRole;
  const isSelf = user?.id === instructor.instructor_id;
  const canEdit = canPerformInstructorAction(staffRole, 'edit', { isSelf });
  const editableFields = getEditableFields(staffRole, isSelf);
  const isLimitedEdit = editableFields !== 'all';

  if (!canEdit) {
    return (
      <DataStateBoundary
        isLoading={false}
        isEmpty
        emptyTitle="編集権限がありません"
        emptyDescription="この指導者プロフィールを編集する権限がありません。"
      />
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumb={<BackLink label="指導者管理に戻る" href={navigate('/instructors')} />}
        title="指導者編集"
      />
      <InstructorForm
        mode="edit"
        instructorId={instructorId}
        nameLocked={isLimitedEdit}
        roleClassificationsLocked={isLimitedEdit}
        defaultValues={{
          lastName: instructor.last_name,
          firstName: instructor.first_name,
          romajiLastName: instructor.romaji_last_name ?? '',
          romajiFirstName: instructor.romaji_first_name ?? '',
          nickname: instructor.nickname ?? '',
          roleClassifications: instructor.role_classifications,
          profileText: instructor.profile_text ?? '',
          instructingHistory: instructor.instructing_history ?? '',
          photoUrl: instructor.photo_url,
          minBookingLeadHours: instructor.buffer_settings.min_booking_lead_hours,
          preBufferMinutes: instructor.buffer_settings.pre_buffer_minutes,
          postBufferMinutes: instructor.buffer_settings.post_buffer_minutes,
          crmAccountLinkStaffId: instructor.crm_account_link?.staff_id ?? null,
          crmAccountLinkStaffName: instructor.crm_account_link?.staff_name ?? null,
        }}
      />
    </div>
  );
}
