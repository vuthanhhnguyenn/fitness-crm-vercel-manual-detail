'use client';

import { Suspense } from 'react';

import { useSearchParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { DataStateBoundary } from '@/components/common/data-state-boundary';

import { getCrmTermsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';

import { TermsForm } from '../_components/terms-form/terms-form';
import { getTermsNewVersionDefaultValues } from '../_schemas/terms-form.mapper';

function TermsCreateContent() {
  const searchParams = useSearchParams();
  const sourceId = searchParams.get('sourceId');
  const isNewVersion = searchParams.get('mode') === 'new-version';
  const { isLoading, isError, data, refetch } = useQuery({
    ...getCrmTermsByIdOptions({ path: { id: sourceId ?? '' } }),
    enabled: isNewVersion && Boolean(sourceId),
  });

  if (!isNewVersion) return <TermsForm mode="create" />;

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!sourceId || !data}
      onRetry={() => {
        void refetch();
      }}
      emptyTitle="元の規約が見つかりません"
      errorTitle="元の規約を取得できませんでした"
    >
      {data ? (
        <TermsForm
          mode="new-version"
          sourceId={sourceId ?? undefined}
          defaultValues={getTermsNewVersionDefaultValues(data)}
          relatedTermsRef={{ title: data.title, version: data.currentVersion }}
        />
      ) : null}
    </DataStateBoundary>
  );
}

export default function TermsCreatePage() {
  return (
    <Suspense fallback={<DataStateBoundary isLoading isEmpty={false} />}>
      <TermsCreateContent />
    </Suspense>
  );
}
