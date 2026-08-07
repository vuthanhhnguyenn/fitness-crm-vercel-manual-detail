import type { SurveyResponseDetail } from '@/app/api/_schemas/survey-reporting.schema';

export type SurveyReportingType = {
  _rows: SurveyResponseDetail[];
  _seeded: boolean;
  _seed(): void;
  getAll(): SurveyResponseDetail[];
  getById(id: string): SurveyResponseDetail | undefined;
};
