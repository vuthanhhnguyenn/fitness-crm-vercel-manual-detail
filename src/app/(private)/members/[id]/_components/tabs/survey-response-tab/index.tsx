'use client';

import { useRouter } from 'next/navigation';

import { formatDateTime } from '@/utils/format.util';
import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getCrmMembersByIdSurveyResponsesOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmMembersByIdSurveyResponsesResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

type SurveyResponseItem = GetCrmMembersByIdSurveyResponsesResponse['items'][number];
type SurveyType = SurveyResponseItem['surveyType'];

const SURVEY_TYPE_LABELS: Record<SurveyType, string> = {
  lifecycle: 'ライフサイクル',
  operational: 'オペレーション',
};

// Type-badge colors match getTypeBadge in the prototype's survey-list.tsx
const SURVEY_TYPE_BADGE_CLASSES: Record<SurveyType, string> = {
  lifecycle: 'bg-info/15 text-info border-info/20',
  operational: 'bg-warning/15 text-warning border-warning/20',
};

export function SurveyResponseHistoryTab({ memberId }: { memberId: string }) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useQuery(
    getCrmMembersByIdSurveyResponsesOptions({
      path: { id: memberId },
    }),
  );

  const items = data?.items ?? [];

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data}
      onRetry={() => refetch()}
    >
      {data ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <History className="text-muted-foreground size-4" />
              アンケート回答履歴
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            {items.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-xs">回答なし</p>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      router.push(navigate('/surveys/responses/[responseId]', item.id))
                    }
                    className="hover:bg-accent flex flex-col gap-1 rounded-md border p-3 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{item.surveyName}</span>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-[10px] font-normal ${SURVEY_TYPE_BADGE_CLASSES[item.surveyType]}`}
                      >
                        {SURVEY_TYPE_LABELS[item.surveyType]}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {formatDateTime(item.responseDate)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </DataStateBoundary>
  );
}
