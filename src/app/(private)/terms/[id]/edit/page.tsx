'use client';

import { useParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { DataStateBoundary } from '@/components/common/data-state-boundary';

import { getCrmTermsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';

import { TermsForm } from '../../_components/terms-form/terms-form';
import { getTermsFormDefaultValues } from '../../_schemas/terms-form.mapper';

export default function TermsEditPage() {
  const params = useParams<{ id: string }>();
  const termId = params.id;
  const { isLoading, isError, data, refetch } = useQuery({
    ...getCrmTermsByIdOptions({ path: { id: termId } }),
  });

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data}
      onRetry={() => {
        void refetch();
      }}
      emptyTitle="規約が見つかりません"
      errorTitle="規約を取得できませんでした"
    >
      {data ? (
        <TermsForm
          mode="edit"
          termsId={termId}
          defaultValues={getTermsFormDefaultValues(data)}
          showActiveVersionWarning={data.status === 'published'}
        />
      ) : null}
    </DataStateBoundary>
  );
}
