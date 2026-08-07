import type {
  SurveyTemplateChangeHistoryItem,
  SurveyTemplateDetail,
  SurveyTemplateListItem,
  SurveyTemplateStatus,
  SurveyTemplateUpsertBody,
} from '@/app/api/_schemas/survey.schema';

export type SurveysType = {
  _rows: SurveyTemplateDetail[];
  _changeHistory: Record<string, SurveyTemplateChangeHistoryItem[]>;
  _seeded: boolean;
  _seed(): void;
  getList(): SurveyTemplateListItem[];
  getById(id: string): SurveyTemplateDetail | undefined;
  getChangeHistory(id: string): SurveyTemplateChangeHistoryItem[];
  delete(id: string): boolean;
  add(data: SurveyTemplateUpsertBody): SurveyTemplateDetail;
  update(id: string, data: SurveyTemplateUpsertBody): SurveyTemplateDetail | undefined;
  updateStatus(
    id: string,
    status: SurveyTemplateStatus,
    reason?: string | null,
  ): SurveyTemplateDetail | undefined;
};
