'use client';

import { useEffect, useMemo, useState } from 'react';

import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startOfMonth } from 'date-fns';
import { ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { SearchableSelect } from '@/components/common/searchable-select';
import { StatusCard } from '@/components/common/status-card';

import {
  deleteCrmSurveysByIdMutation,
  getCrmStoresOptions,
  getCrmSurveysByIdOptions,
  getCrmSurveysByIdQueryKey,
  getCrmSurveysByIdStoresByStoreIdVisibilityOptions,
  getCrmSurveysQueryKey,
  getCrmSurveysResponsesOptions,
  patchCrmSurveysByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmSurveysByIdResponse } from '@/lib/api/types.gen';
import { SurveyTemplateStatus } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { SURVEY_STATUS_LABELS } from '../_constants/constants';
import { SurveyBasicInfoSection } from './_components/survey-basic-info-section';
import { SurveyDeleteDialog } from './_components/survey-delete-dialog';
import { SurveyDetailHeaderActions } from './_components/survey-detail-header-actions';
import { SurveyDetailLayout } from './_components/survey-detail-layout';
import { SurveyDisableDialog } from './_components/survey-disable-dialog';
import { SurveyQuestionsSection } from './_components/survey-questions-section';
import { SurveySummaryCard } from './_components/survey-summary-card';

type SurveyStoreOption = { id: string; name: string; store_id: string };

type SurveyDetail = NonNullable<GetCrmSurveysByIdResponse>['survey'];

export default function SurveyDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const surveyId = params.id as string;
  const [disableReason, setDisableReason] = useState('');
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const currentMonthRange = useMemo(() => {
    const today = new Date();
    return {
      periodFrom: formatDateYYYYMMDD(startOfMonth(today), ''),
      periodTo: formatDateYYYYMMDD(today, ''),
    };
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmSurveysByIdOptions({ path: { id: surveyId } }),
  });

  const { data: monthlyResponsesData } = useQuery({
    ...getCrmSurveysResponsesOptions({
      query: {
        page: 1,
        survey_id: surveyId,
        period_from: currentMonthRange.periodFrom,
        period_to: currentMonthRange.periodTo,
        limit: 1,
      },
    }),
  });

  const { data: storesData } = useQuery({
    ...getCrmStoresOptions({ query: { page: 1, limit: 100 } }),
  });

  const storeOptions = useMemo(
    () =>
      storesData?.stores?.map((store) => ({
        id: store.id,
        name: store.name,
        store_id: store.store_id,
      })) ?? [],
    [storesData],
  );
  const activeStoreId = searchParams.get('storeId') ?? storeOptions[0]?.id ?? null;
  const activeStore =
    storeOptions.find((store) => store.id === activeStoreId) ?? storeOptions[0] ?? null;

  useEffect(() => {
    if (!storeOptions.length || searchParams.get('storeId')) {
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    next.set('storeId', storeOptions[0]!.id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [pathname, router, searchParams, storeOptions]);

  const handleStoreChange = (storeId: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (storeId) {
      next.set('storeId', storeId);
    } else {
      next.delete('storeId');
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const { data: visibilityData } = useQuery({
    ...getCrmSurveysByIdStoresByStoreIdVisibilityOptions({
      path: { id: surveyId, storeId: activeStoreId ?? '' },
    }),
    enabled: Boolean(activeStoreId),
  });

  const disableMutation = useMutation({
    ...patchCrmSurveysByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'アンケートを無効化しました');
      queryClient.invalidateQueries({ queryKey: getCrmSurveysQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getCrmSurveysByIdQueryKey({ path: { id: surveyId } }),
      });
      setDisableReason('');
      setDisableDialogOpen(false);
    },
    onError: () => {
      toast.error('アンケートの無効化に失敗しました');
    },
  });

  const deleteMutation = useMutation({
    ...deleteCrmSurveysByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'アンケートを削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmSurveysQueryKey() });
      setDeleteDialogOpen(false);
      router.push(navigate('/surveys'));
    },
    onError: () => {
      toast.error('アンケートの削除に失敗しました');
    },
  });

  if (isLoading) {
    return <DataStateBoundary isLoading isEmpty={false} />;
  }

  if (isError || !data?.survey) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError={isError}
        isEmpty={!data?.survey}
        onRetry={() => refetch()}
        emptyTitle="アンケートが見つかりません"
      />
    );
  }

  const survey: SurveyDetail = data.survey;
  const isInactive = survey.status === SurveyTemplateStatus.INACTIVE;
  const statusTone = isInactive ? 'muted' : 'success';
  const statusMeta = [
    `作成: ${survey.created_at}`,
    `最終回答: ${survey.last_response_date ?? '—'}`,
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        breadcrumb={<BackLink label="アンケート管理に戻る" href={navigate('/surveys')} />}
        title={survey.name}
        actions={
          <div className="flex items-center gap-2">
            <SearchableSelect<SurveyStoreOption>
              value={activeStoreId}
              valueLabel={activeStore ? `${activeStore.store_id} ${activeStore.name}` : undefined}
              options={storeOptions}
              placeholder="店舗を選択"
              searchPlaceholder="店舗名・店舗IDで検索..."
              emptyMessage="該当する店舗がありません"
              onSelect={(store) => handleStoreChange(store?.id ?? '')}
              getOptionKey={(store) => store.id}
              getOptionLabel={(store) => `${store.store_id} ${store.name}`}
              getOptionKeywords={(store) => [store.name, store.store_id, store.id].join(' ')}
            />
            <SurveyDetailHeaderActions
              surveyId={surveyId}
              onDeleteClick={() => setDeleteDialogOpen(true)}
            />
          </div>
        }
      />

      <main className="flex-1 overflow-auto px-6 py-4">
        <SurveyDetailLayout
          main={
            <>
              <SurveyBasicInfoSection survey={survey} />
              <SurveyQuestionsSection
                questions={survey.questions}
                storeId={activeStoreId}
                visibility={visibilityData?.visibility ?? null}
              />
            </>
          }
          aside={
            <>
              <StatusCard
                tone={statusTone}
                icon={ClipboardList}
                label={SURVEY_STATUS_LABELS[survey.status]}
                meta={statusMeta}
                action={
                  <SurveyDisableDialog
                    disabled={isInactive}
                    isPending={disableMutation.isPending}
                    open={disableDialogOpen}
                    reason={disableReason}
                    onOpenChange={setDisableDialogOpen}
                    onReasonChange={setDisableReason}
                    onConfirm={() => {
                      disableMutation.mutate({
                        path: { id: surveyId },
                        body: {
                          status: SurveyTemplateStatus.INACTIVE,
                          reason: disableReason || null,
                        },
                      });
                    }}
                  />
                }
              />
              <SurveySummaryCard
                totalResponses={survey.response_count}
                monthlyResponses={monthlyResponsesData?.pagination.total ?? 0}
                responseRate={survey.response_rate}
              />
            </>
          }
        />
      </main>

      <SurveyDeleteDialog
        surveyName={survey.name}
        open={deleteDialogOpen}
        isPending={deleteMutation.isPending}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          deleteMutation.mutate({ path: { id: surveyId } });
        }}
      />
    </div>
  );
}
