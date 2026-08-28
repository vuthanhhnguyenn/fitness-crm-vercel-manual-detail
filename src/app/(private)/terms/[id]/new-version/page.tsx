'use client';

import { useParams } from 'next/navigation';

import { TermsForm } from '@/app/(private)/terms/_components/terms-form/terms-form';
import { TermsFormSkeleton } from '@/app/(private)/terms/_components/terms-form/terms-form-skeleton';
import { useQuery } from '@tanstack/react-query';

import { DataStateBoundary } from '@/components/common/data-state-boundary';

import { getCrmTermsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';

export default function TermsNewVersionPage() {
  const params = useParams();
  const termsId = params.id as string;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmTermsByIdOptions({ path: { id: termsId } }),
    enabled: Boolean(termsId),
  });

  if (!data) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && !isError}
        onRetry={() => void refetch()}
        emptyTitle="規約文書が見つかりません"
        emptyDescription={`指定された規約ID（${termsId}）は存在しないか、参照権限がありません。`}
        skeleton={<TermsFormSkeleton />}
      />
    );
  }

  return (
    <TermsForm
      mode="new-version"
      sourceId={termsId}
      parentTermsId={data.parentTermsId ?? data.id}
      prevTermsId={data.id}
      relatedTermsRef={{ title: data.title, version: data.version }}
      defaultValues={{
        brandEnum: [data.brandEnum],
        title: data.title,
        termsType: data.termsType,
        displayOrder: data.displayOrder,
        requiresConsent: data.requiresConsent,
      }}
    />
  );
}
