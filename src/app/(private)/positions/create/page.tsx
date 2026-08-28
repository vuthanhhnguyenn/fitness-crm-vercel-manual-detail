'use client';

// Client page: nuqs cloneFrom param + React Query prefill drive the form
import { Suspense } from 'react';

import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, useQueryState } from 'nuqs';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { PageHeader } from '@/components/common/page-header';

import { getCrmPositionsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { PositionForm } from '../_components/position-form/position-form';

function PositionCreatePageContent() {
  // 複製モード (FR-013): /positions/create?cloneFrom={id} — URL駆動でリロードにも耐える
  const [cloneFromId] = useQueryState('cloneFrom', parseAsInteger);
  const isCloneRequested = cloneFromId !== null;

  const {
    data: cloneSource,
    isLoading,
    isError,
  } = useQuery({
    ...getCrmPositionsByIdOptions({ path: { id: cloneFromId ?? 0 } }),
    enabled: isCloneRequested,
  });

  if (isCloneRequested && isLoading) {
    return (
      <>
        <PageHeader
          breadcrumb={<BackLink label="職位マスター管理に戻る" href={navigate('/positions')} />}
          title="職位 複製して作成"
        />
        <DataStateBoundary isLoading isEmpty={false} />
      </>
    );
  }

  // 複製元が見つからない/取得失敗 → 空の新規作成フォームへフォールバック (spec edge case)
  if (isCloneRequested && !isError && cloneSource) {
    return <PositionForm mode="clone" defaultDetail={cloneSource} />;
  }

  return <PositionForm mode="create" />;
}

export default function PositionCreatePage() {
  return (
    <Suspense fallback={<Loading />}>
      <PositionCreatePageContent />
    </Suspense>
  );
}
