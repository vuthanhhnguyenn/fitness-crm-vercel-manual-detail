'use client';

import { use, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';

import { getCrmBannersByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { BannerForm } from '../../_components/banner-form/banner-form';
import { BannerFormSkeleton } from '../../_components/banner-form/banner-form-skeleton';
import { bannerDetailToFormValues } from '../../_schemas/banner-form.mapper';

interface BannerEditPageProps {
  params: Promise<{ id: string }>;
}

export default function BannerEditPage({ params }: BannerEditPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const navigateToList = useCallback(() => {
    router.push(navigate('/banners'));
  }, [router]);

  const { data, isError, isLoading, refetch } = useQuery(
    getCrmBannersByIdOptions({ path: { id } }),
  );

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="バナー管理に戻る" href={navigate('/banners')} />}
        title="バナー編集"
      />
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data}
        onRetry={() => refetch()}
        errorTitle="バナー情報の取得に失敗しました"
        skeleton={<BannerFormSkeleton />}
      >
        {data && (
          <BannerForm
            mode="edit"
            defaultValues={data ? bannerDetailToFormValues(data) : undefined}
            bannerId={id}
            onNavigateBack={navigateToList}
          />
        )}
      </DataStateBoundary>
    </>
  );
}
