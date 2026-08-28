'use client';

import { use } from 'react';

import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';

import { getCrmAppVersionsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { ApiErrorWithStatus } from '@/types/global.type';

import { AppVersionForm } from '../../_components/app-version-form/app-version-form';
import { AppVersionFormSkeleton } from '../../_components/app-version-form/app-version-form-skeleton';
import { appVersionRecordToFormValues } from '../../_schemas/app-version-form.mapper';

interface AppVersionEditPageProps {
  params: Promise<{ id: string }>;
}

export default function AppVersionEditPage({ params }: AppVersionEditPageProps) {
  const { id } = use(params);

  const { data, isLoading, isError, error, refetch } = useQuery(
    getCrmAppVersionsByIdOptions({ path: { id } }),
  );
  const isNotFound = (error as ApiErrorWithStatus)?.status === 404;

  if (!data || isLoading || isError) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError && !isNotFound}
        isEmpty={isNotFound || (!isLoading && !isError && !data)}
        onRetry={() => refetch()}
        emptyTitle="アプリバージョンが見つかりません"
        emptyDescription="指定されたアプリバージョンは存在しないか、削除された可能性があります。"
        skeleton={<AppVersionFormSkeleton />}
      />
    );
  }

  return (
    <>
      <PageHeader
        breadcrumb={
          <BackLink label="アプリ配信バージョン管理に戻る" href={navigate('/app-versions')} />
        }
        title="バージョン編集"
      />

      <AppVersionForm
        mode="edit"
        defaultValues={appVersionRecordToFormValues(data)}
        versionId={id}
      />
    </>
  );
}
