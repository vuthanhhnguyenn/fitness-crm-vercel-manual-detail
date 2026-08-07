import { BrandBadge } from '@/components/common/brand-badge';
import { Field } from '@/components/common/field';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmSurveysByIdResponse } from '@/lib/api/types.gen';

import { SurveyTriggerBadge } from '../../_components/survey-trigger-badge';
import { SURVEY_TYPE_BADGE_CLASSES, SURVEY_TYPE_LABELS } from '../../_constants/constants';

type SurveyDetail = NonNullable<GetCrmSurveysByIdResponse>['survey'];

interface SurveyBasicInfoSectionProps {
  survey: SurveyDetail;
}

export function SurveyBasicInfoSection({ survey }: SurveyBasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">基本情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label="アンケートID" value={survey.id} />
          <Field label="アンケート名" value={survey.name} />
          <Field
            label="種別"
            value={
              <Badge variant="outline" className={SURVEY_TYPE_BADGE_CLASSES[survey.type]}>
                {SURVEY_TYPE_LABELS[survey.type]}
              </Badge>
            }
          />
          <Field label="ブランド" value={<BrandBadge brand={survey.brand} />} />
          <Field label="発動トリガー" value={<SurveyTriggerBadge trigger={survey.trigger} />} />
          <Field label="作成日" value={survey.created_at} />
          <Field label="最終更新日" value={survey.updated_at} />
        </div>
      </CardContent>
    </Card>
  );
}
