'use client';

import { useParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { PageHeader } from '@/components/common/page-header';

import { getCrmExercisesByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { ExerciseForm } from '../../_components/exercise-form';

export default function ExerciseEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmExercisesByIdOptions({ path: { id } }),
    enabled: Boolean(id),
  });

  if (isLoading) return <Loading />;

  if (isError || !data?.exercise) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError={isError}
        isEmpty={!data?.exercise}
        onRetry={() => refetch()}
        emptyTitle="エクササイズが見つかりません"
        emptyDescription="指定されたエクササイズは存在しないか、削除された可能性があります。"
      />
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumb={
          <BackLink label="エクササイズ詳細に戻る" href={navigate('/exercises/[id]', id)} />
        }
        title="エクササイズ 編集"
      />
      <ExerciseForm mode="edit" defaultDetail={data.exercise} />
    </div>
  );
}
