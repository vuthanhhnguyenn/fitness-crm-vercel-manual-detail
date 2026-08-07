import { BrandBadge } from '@/components/common/brand-badge';
import { Field } from '@/components/common/field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmSurveysResponsesByResponseIdResponse } from '@/lib/api/types.gen';

import { formatSurveyDateOnly } from '../../../_constants/constants';

type SurveyResponseDetail = NonNullable<GetCrmSurveysResponsesByResponseIdResponse>['response'];

interface ResponseBasicInfoSectionProps {
  response: SurveyResponseDetail;
}

export function ResponseBasicInfoSection({ response }: ResponseBasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">基本情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label="会員番号" value={response.member_number} mono />
          <Field label="会員名" value={response.member_name} />
          <Field label="アンケート名" value={response.survey_name} />
          <Field label="アンケートID" value={response.survey_id} mono />
          <Field label="ブランド" value={<BrandBadge brand={response.brand} />} />
          <Field label="店舗" value={response.store_name} />
          <Field label="回答日時" value={formatSurveyDateOnly(response.response_date)} />
        </div>
      </CardContent>
    </Card>
  );
}
