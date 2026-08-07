'use client';

import { useParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';

import { getCrmLessonContentsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmLessonContentsByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { LessonForm } from '../../_components/lesson-form/lesson-form';
import { LessonFormSkeleton } from '../../_components/lesson-form/lesson-form-skeleton';
import { detailImagesToFormImages } from '../../_schemas/lesson-form.schema';
import type { LessonFormValues } from '../../_schemas/lesson-form.schema';

type LessonDetail = NonNullable<GetCrmLessonContentsByIdResponse>['data'];

const COPY_SUFFIX = '（コピー）';

function detailToFormValues(detail: LessonDetail): Partial<LessonFormValues> {
  const name =
    detail.name.length + COPY_SUFFIX.length > 255 ? detail.name : `${detail.name}${COPY_SUFFIX}`;
  return {
    name,
    lessonType: detail.lesson_type,
    brand: detail.brand,
    duration: detail.duration,
    pricingType:
      detail.pricing_type === 'paid'
        ? 'per_use'
        : detail.pricing_type === 'included'
          ? 'free'
          : 'free',
    perUseFee: detail.per_use_fee ?? null,
    restrictedMainContracts: detail.restriction?.restricted_main_contracts ?? [],
    restrictedOptionContracts: detail.restriction?.restricted_option_contracts ?? [],
    images: detailImagesToFormImages(detail.images),
    description: detail.description ?? '',
    notes: detail.internal_memo ?? '',
    status: detail.status,
  };
}

export default function LessonDuplicatePage() {
  const params = useParams<{ id: string }>();
  const lessonId = params.id;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmLessonContentsByIdOptions({ path: { id: lessonId } }),
    enabled: Boolean(lessonId),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <PageHeader
          breadcrumb={<BackLink label="レッスン内容管理に戻る" href={navigate('/lessons')} />}
          title="新規レッスン作成"
        />
        <LessonFormSkeleton />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="flex flex-col">
        <PageHeader
          breadcrumb={<BackLink label="レッスン内容管理に戻る" href={navigate('/lessons')} />}
          title="エラー"
        />
        <DataStateBoundary
          isLoading={false}
          isError={isError}
          isEmpty={!data?.data}
          onRetry={() => refetch()}
          emptyTitle="レッスン内容が見つかりません"
          emptyDescription="指定されたレッスン内容は存在しないか、削除された可能性があります。"
        />
      </div>
    );
  }

  const detail = data.data;
  const defaultValues = detailToFormValues(detail);

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumb={<BackLink label="レッスン内容管理に戻る" href={navigate('/lessons')} />}
        title="新規レッスン作成"
      />
      <LessonForm mode="duplicate" defaultValues={defaultValues} />
    </div>
  );
}
