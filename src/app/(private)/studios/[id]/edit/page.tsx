'use client';

import { useParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';

import { getCrmStudiosByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetStudioDetailResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import type { StudioFormValues } from '../../_components/studio-form.schema';
import { StudioForm } from '../../_components/studio-form/studio-form';
import { StudioFormSkeleton } from '../../_components/studio-form/studio-form-skeleton';

function detailToFormValues(detail: GetStudioDetailResponse): {
  defaultValues: Partial<StudioFormValues>;
  assignedLessonCount: number;
} {
  const layout = detail.layout;
  const layoutFormatted =
    layout.state === 'configured' && layout.rows && layout.columns
      ? {
          rows: layout.rows,
          columns: layout.columns,
          cells: (layout.cells ?? []).map((c) => ({
            x: c.x,
            y: c.y,
            kind: c.kind as 'normal_seat' | 'equipment_seat' | 'fixed_object' | 'empty',
          })),
        }
      : undefined;

  return {
    defaultValues: {
      storeId: detail.data.store_id,
      name: detail.data.name,
      studioType: 'normal' as const,
      operatingHours: detail.data.usage_hours.replace('-', '~'),
      capacity: detail.data.capacity,
      bufferValue: detail.data.buffer_value,
      equipmentNotes: detail.data.equipment_notes ?? '',
      internalNotes: detail.data.internal_notes ?? '',
      status: detail.data.status,
      images: [...detail.images]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((img) => ({
          id: img.image_id,
          url: img.url,
        })),
      layout: layoutFormatted,
    },
    assignedLessonCount: detail.data.assigned_lesson_count,
  };
}

export default function StudioEditPage() {
  const params = useParams<{ id: string }>();
  const studioId = params.id;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmStudiosByIdOptions({ path: { id: studioId } }),
    enabled: Boolean(studioId),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <PageHeader
          breadcrumb={
            <BackLink label="スタジオ詳細に戻る" href={navigate('/studios/[id]', studioId)} />
          }
          title="読み込み中..."
        />
        <StudioFormSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col">
        <PageHeader
          breadcrumb={
            <BackLink label="スタジオ管理に戻る" href={navigate('/studios/[id]', studioId)} />
          }
          title="エラー"
        />
        <DataStateBoundary
          isLoading={false}
          isError={isError}
          isEmpty={!data}
          onRetry={() => refetch()}
          emptyTitle="スタジオが見つかりません"
          emptyDescription="指定されたスタジオは存在しないか、削除された可能性があります。"
        />
      </div>
    );
  }

  const { defaultValues, assignedLessonCount } = detailToFormValues(data);

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumb={
          <BackLink label="スタジオ詳細に戻る" href={navigate('/studios/[id]', studioId)} />
        }
        title="スタジオ編集"
      />
      <StudioForm
        mode="edit"
        studioId={studioId}
        defaultValues={defaultValues}
        assignedLessonCount={assignedLessonCount}
      />
    </div>
  );
}
