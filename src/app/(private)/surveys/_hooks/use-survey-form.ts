import { useMemo } from 'react';

import type { GetCrmSurveysResponse } from '@/lib/api/types.gen';

import type { SurveyFormValues } from '../_schemas/survey-form.schema';

type SurveyRow = GetCrmSurveysResponse['surveys'][number];

export function useSurveyDuplicateTrigger(
  surveys: SurveyRow[],
  trigger: SurveyFormValues['trigger'],
  currentSurveyId?: string,
) {
  return useMemo(
    () =>
      surveys.find(
        (survey) =>
          survey.status === 'active' && survey.trigger === trigger && survey.id !== currentSurveyId,
      ),
    [currentSurveyId, surveys, trigger],
  );
}
