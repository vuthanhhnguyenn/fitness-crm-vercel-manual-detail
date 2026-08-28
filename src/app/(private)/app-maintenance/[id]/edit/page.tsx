'use client';

import { useParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';

import { getCrmAppMaintenancesByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { AppMaintenanceForm } from '../../_components/app-maintenance-form/app-maintenance-form';
import { AppMaintenanceFormSkeleton } from '../../_components/app-maintenance-form/app-maintenance-form-skeleton';

export default function AppMaintenanceEditPage() {
  const params = useParams();
  const maintenanceId = params.id as string;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmAppMaintenancesByIdOptions({ path: { id: maintenanceId } }),
    enabled: Boolean(maintenanceId),
  });

  if (!data) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && !isError}
        onRetry={() => void refetch()}
        emptyTitle="メンテナンス情報が見つかりません"
        emptyDescription={`指定されたID（${maintenanceId}）のメンテナンス情報は存在しません。`}
        skeleton={<AppMaintenanceFormSkeleton />}
      />
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumb={
          <BackLink label="アプリメンテナンス管理に戻る" href={navigate('/app-maintenance')} />
        }
        title="アプリメンテナンス編集"
      />
      <AppMaintenanceForm
        mode="edit"
        maintenanceId={maintenanceId}
        currentStatus={data.status}
        defaultValues={{
          targetBrand: data.targetBrand,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          message: data.message,
        }}
      />
    </div>
  );
}
