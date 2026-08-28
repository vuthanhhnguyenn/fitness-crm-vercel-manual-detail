'use client';

import { Suspense, use } from 'react';

import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { PageHeader } from '@/components/common/page-header';

import { getCrmRoutinesByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { RoutineForm } from '../../_components/routine-form/routine-form';

type RoutineEditPageProps = {
  params: Promise<{ id: string }>;
};

function RoutineEditPageContent({ params }: RoutineEditPageProps) {
  const { id } = use(params);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmRoutinesByIdOptions({ path: { id } }),
  });

  const routine = data?.routine;

  if (isLoading || isError || !routine) {
    return (
      <>
        <PageHeader
          breadcrumb={<BackLink label="ルーティン管理に戻る" href={navigate('/routines')} />}
          title="ルーティン 編集"
        />
        <DataStateBoundary
          isLoading={isLoading}
          isError={isError}
          isEmpty={!routine}
          onRetry={() => void refetch()}
          errorTitle="ルーティンの取得に失敗しました"
          emptyTitle="ルーティンが見つかりませんでした"
        />
      </>
    );
  }

  return <RoutineForm mode="edit" defaultDetail={routine} />;
}

export default function RoutineEditPage({ params }: RoutineEditPageProps) {
  return (
    <Suspense fallback={<Loading />}>
      <RoutineEditPageContent params={params} />
    </Suspense>
  );
}
