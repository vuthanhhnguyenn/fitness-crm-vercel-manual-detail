'use client';

import { useParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';

import { getCrmSurveysResponsesByResponseIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmSurveysResponsesByResponseIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';
import { cn } from '@/lib/utils';

import { SURVEY_RESPONSE_STATUS_LABELS } from '../../_constants/constants';
import { ResponseAnswersSection } from './_components/response-answers-section';
import { ResponseBasicInfoSection } from './_components/response-basic-info-section';
import { ResponseDetailHeaderActions } from './_components/response-detail-header-actions';
import { ResponseDetailLayout } from './_components/response-detail-layout';
import { ResponseStatusSection } from './_components/response-status-section';

type SurveyResponseDetail = NonNullable<GetCrmSurveysResponsesByResponseIdResponse>['response'];

export default function SurveyResponseDetailPage() {
  const params = useParams();
  const responseId = params.responseId as string;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmSurveysResponsesByResponseIdOptions({ path: { responseId } }),
  });

  if (isLoading) {
    return <DataStateBoundary isLoading isEmpty={false} />;
  }

  if (isError || !data?.response) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError={isError}
        isEmpty={!data?.response}
        onRetry={() => refetch()}
        emptyTitle="回答が見つかりません"
      />
    );
  }

  const response: SurveyResponseDetail = data.response;
  const isCompleted = response.status === 'completed';
  const statusBadgeClass = isCompleted
    ? 'bg-success/15 text-success border-success/20'
    : 'bg-warning/15 text-warning border-warning/20';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        breadcrumb={<BackLink label="回答データに戻る" href={navigate('/surveys/responses')} />}
        title={`${response.member_name} の回答`}
        badge={
          <Badge variant="outline" className={cn('text-xs', statusBadgeClass)}>
            {SURVEY_RESPONSE_STATUS_LABELS[response.status]}
          </Badge>
        }
        actions={
          <ResponseDetailHeaderActions
            memberId={response.member_id}
            surveyId={response.survey_id}
          />
        }
      />

      <main className="flex-1 overflow-auto px-6 py-4">
        <ResponseDetailLayout
          main={
            <>
              <ResponseBasicInfoSection response={response} />
              <ResponseAnswersSection answers={response.answers} />
            </>
          }
          aside={
            <ResponseStatusSection status={response.status} responseDate={response.response_date} />
          }
        />
      </main>
    </div>
  );
}
