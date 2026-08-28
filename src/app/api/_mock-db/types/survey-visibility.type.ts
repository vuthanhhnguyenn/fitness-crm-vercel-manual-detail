import type {
  SurveyStoreVisibility,
  SurveyStoreVisibilityQuestion,
  SurveyTemplateDetail,
  UpdateSurveyStoreVisibilityBody,
} from '@/app/api/_schemas/survey.schema';

export type SurveyVisibilityType = {
  _rows: Array<{
    survey_id: string;
    store_id: string;
    questions: SurveyStoreVisibilityQuestion[];
    updated_at: string;
  }>;
  _seeded: boolean;
  _seed(): void;
  getBySurveyAndStore(
    surveyId: string,
    storeId: string,
  ): { questions: SurveyStoreVisibilityQuestion[]; updated_at: string } | undefined;
  upsert(
    surveyId: string,
    storeId: string,
    data: UpdateSurveyStoreVisibilityBody,
    survey: SurveyTemplateDetail,
  ): SurveyStoreVisibility;
};
