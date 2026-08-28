'use client';

// Client page: fetches the position detail to prefill the edit form
import { Suspense, use } from 'react';

import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { PageHeader } from '@/components/common/page-header';

import { getCrmPositionsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { PositionForm } from '../../_components/position-form/position-form';

type PositionEditPageProps = {
  params: Promise<{ id: string }>;
};

function PositionEditPageContent({ params }: Readonly<PositionEditPageProps>) {
  const { id } = use(params);
  const positionId = Number(id);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmPositionsByIdOptions({ path: { id: positionId } }),
    enabled: Number.isInteger(positionId) && positionId > 0,
  });

  if (isLoading || isError || !data) {
    return (
      <>
        <PageHeader
          breadcrumb={<BackLink label="職位マスター管理に戻る" href={navigate('/positions')} />}
          title="職位 編集"
        />
        <DataStateBoundary
          isLoading={isLoading}
          isError={isError}
          isEmpty={!data}
          onRetry={() => void refetch()}
          errorTitle="職位の取得に失敗しました"
          emptyTitle="職位が見つかりませんでした"
        />
      </>
    );
  }

  return <PositionForm mode="edit" defaultDetail={data} />;
}

export default function PositionEditPage({ params }: Readonly<PositionEditPageProps>) {
  return (
    <Suspense fallback={<Loading />}>
      <PositionEditPageContent params={params} />
    </Suspense>
  );
}
