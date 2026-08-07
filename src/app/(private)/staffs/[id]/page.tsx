'use client';

import { useParams, useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { DataStateBoundary } from '@/components/common/data-state-boundary';

import { getCrmStaffsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { StaffStatus } from '../_constants/constants';
import { StaffDetailHeader } from './_components/staff-detail-header';
import { StaffDetailSkeleton } from './_components/staff-detail-skeleton';
import { StaffLoginInfoCard } from './_components/staff-login-info-card';
import { StaffPermissionCard } from './_components/staff-permission-card';
import { StaffPersonalInfoCard } from './_components/staff-personal-info-card';
import { StaffStatusCard } from './_components/staff-status-card';

export default function StaffDetailPage() {
  const params = useParams();
  const staffId = params.id as string;

  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery(
    getCrmStaffsByIdOptions({
      path: { id: staffId },
    }),
  );

  if (isLoading) return <StaffDetailSkeleton />;

  if (isError || !data?.staff) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError={isError}
        isEmpty={!data?.staff}
        onRetry={() => refetch()}
      />
    );
  }

  const { staff } = data;
  const fullName = `${staff.personal_info.last_name} ${staff.personal_info.first_name}`.trim();
  const staffStatus = staff.status as StaffStatus;

  const handleEdit = () => {
    router.push(navigate('/staffs/[id]/edit', staffId));
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BreadcrumbNav
          items={[{ url: '/staffs', label: 'スタッフ管理' }, { label: 'スタッフ詳細' }]}
          variant="section"
        />
      </div>
      <StaffDetailHeader
        staffId={staffId}
        fullName={fullName}
        staffStatus={staffStatus}
        onEdit={handleEdit}
      />

      <div className="flex-1 overflow-auto px-4 pb-4">
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <StaffPersonalInfoCard staff={staff} />
            <StaffLoginInfoCard staff={staff} />
          </div>

          <div className="space-y-4 lg:col-span-2">
            <StaffStatusCard staff={staff} />
            <StaffPermissionCard staff={staff} />
          </div>
        </div>
      </div>
    </div>
  );
}
