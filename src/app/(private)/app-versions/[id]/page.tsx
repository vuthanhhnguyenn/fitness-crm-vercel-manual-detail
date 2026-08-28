'use client';

import { use, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';

import {
  deleteCrmAppVersionsByIdMutation,
  getCrmAppVersionsByIdOptions,
  getCrmAppVersionsQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { ApiErrorWithStatus } from '@/types/global.type';

import { AppVersionDeleteDialog } from '../_components/app-version-delete-dialog';
import { AppVersionDetailHeaderActions } from './_components/app-version-detail-header-actions';
import { AppVersionDetailSkeleton } from './_components/app-version-detail-skeleton';
import { AppVersionInfoCard } from './_components/app-version-info-card';

type AppVersionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function AppVersionDetailPage({ params }: AppVersionDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    ...getCrmAppVersionsByIdOptions({ path: { id } }),
  });
  const isNotFound = (error as ApiErrorWithStatus)?.status === 404;

  const deleteMutation = useMutation({
    ...deleteCrmAppVersionsByIdMutation(),
    onSuccess: () => {
      toast.success('アプリバージョンを削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmAppVersionsQueryKey() });
      router.push(navigate('/app-versions'));
    },
    onError: () => {
      toast.error('アプリバージョンの削除に失敗しました');
    },
  });

  if (!data || isLoading || isError) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError && !isNotFound}
        isEmpty={isNotFound || (!isLoading && !isError && !data)}
        onRetry={() => void refetch()}
        emptyTitle="アプリバージョンが見つかりません"
        skeleton={<AppVersionDetailSkeleton />}
      />
    );
  }

  return (
    <>
      <PageHeader
        breadcrumb={
          <BackLink label="アプリ配信バージョン管理に戻る" href={navigate('/app-versions')} />
        }
        title="バージョン詳細"
        actions={
          <AppVersionDetailHeaderActions id={id} onDeleteClick={() => setDeleteOpen(true)} />
        }
      />
      <div className="bg-background min-h-0 flex-1 overflow-auto px-6 py-4">
        <AppVersionInfoCard data={data} />
      </div>

      <AppVersionDeleteDialog
        item={deleteOpen ? (data ?? null) : null}
        onOpenChange={(open) => setDeleteOpen(open)}
        onConfirm={() => deleteMutation.mutate({ path: { id } })}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
