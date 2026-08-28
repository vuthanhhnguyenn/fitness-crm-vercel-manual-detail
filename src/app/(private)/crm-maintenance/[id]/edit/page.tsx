'use client';

import { useParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';

import { getCrmMaintenancesByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { CrmMaintenanceForm } from '../../_components/crm-maintenance-form/crm-maintenance-form';
import { CrmMaintenanceFormSkeleton } from '../../_components/crm-maintenance-form/crm-maintenance-form-skeleton';

export default function CrmMaintenanceEditPage() {
  const params = useParams();
  const maintenanceId = params.id as string;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmMaintenancesByIdOptions({ path: { id: maintenanceId } }),
    enabled: Boolean(maintenanceId),
  });

  if (!data) {
    return (
      <div className="flex flex-col">
        <PageHeader
          breadcrumb={
            <BackLink label="CRMメンテナンス管理に戻る" href={navigate('/crm-maintenance')} />
          }
          title="CRMメンテナンス編集"
        />
        <DataStateBoundary
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && !isError}
          onRetry={() => void refetch()}
          emptyTitle="メンテナンス情報が見つかりません"
          emptyDescription={`指定されたID（${maintenanceId}）のメンテナンス情報は存在しません。`}
          skeleton={<CrmMaintenanceFormSkeleton />}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumb={
          <BackLink label="CRMメンテナンス管理に戻る" href={navigate('/crm-maintenance')} />
        }
        title="CRMメンテナンス編集"
      />
      <CrmMaintenanceForm
        mode="edit"
        maintenanceId={maintenanceId}
        currentStatus={data.status}
        defaultValues={{
          title: data.title,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          message: data.message,
          note: data.note ?? '',
          allowedUsers: data.allowedUsers.map((user) => ({
            staffId: user.staffId,
            name: user.name,
            role: user.role,
          })),
        }}
      />
    </div>
  );
}
