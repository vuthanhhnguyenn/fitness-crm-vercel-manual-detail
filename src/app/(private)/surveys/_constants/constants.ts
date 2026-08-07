import { MEMBER_TYPE_LABELS } from '@/app/(private)/members/_constants/constants';

import {
  MemberType,
  StoreListBrand,
  SurveyQuestionFormat,
  SurveyTemplateStatus,
  SurveyTemplateTrigger,
  SurveyTemplateType,
} from '@/lib/api/types.gen';

export const SURVEY_SORT_FIELDS = [
  'id',
  'name',
  'type',
  'trigger',
  'brand',
  'question_count',
  'response_count',
  'response_rate',
  'last_response_date',
  'status',
] as const;

export type SurveySortField = (typeof SURVEY_SORT_FIELDS)[number];

export const SURVEY_TYPE_LABELS: Record<SurveyTemplateType, string> = {
  [SurveyTemplateType.LIFECYCLE]: 'ライフサイクル',
  [SurveyTemplateType.OPERATIONAL]: 'オペレーション',
};

export const SURVEY_TYPE_BADGE_CLASSES: Record<SurveyTemplateType, string> = {
  [SurveyTemplateType.LIFECYCLE]: 'bg-info/15 text-info border-info/20',
  [SurveyTemplateType.OPERATIONAL]: 'bg-warning/15 text-warning border-warning/20',
};

export const SURVEY_TRIGGER_LABELS: Record<SurveyTemplateTrigger, string> = {
  [SurveyTemplateTrigger.JOIN]: '入会時',
  [SurveyTemplateTrigger.LEAVE]: '退会時',
  [SurveyTemplateTrigger.SUSPENSION_REQUEST]: '休会申請時',
  [SurveyTemplateTrigger.TRANSFER]: '移籍時',
  [SurveyTemplateTrigger.RENEWAL]: '更新時',
  [SurveyTemplateTrigger.MANUAL_DELIVERY]: '手動配信',
  [SurveyTemplateTrigger.CONDITIONAL_TRIGGER]: '条件トリガー',
};

export const SURVEY_STATUS_LABELS: Record<SurveyTemplateStatus, string> = {
  [SurveyTemplateStatus.ACTIVE]: '有効',
  [SurveyTemplateStatus.INACTIVE]: '無効',
};

export const SURVEY_STATUS_BADGE_CLASSES: Record<SurveyTemplateStatus, string> = {
  [SurveyTemplateStatus.ACTIVE]: 'bg-success/15 text-success border-success/20',
  [SurveyTemplateStatus.INACTIVE]: 'bg-muted text-muted-foreground border-border',
};

export const SURVEY_QUESTION_FORMAT_LABELS: Record<SurveyQuestionFormat, string> = {
  [SurveyQuestionFormat.SINGLE_CHOICE]: '選択式（単一）',
  [SurveyQuestionFormat.MULTIPLE_CHOICE]: '選択式（複数）',
  [SurveyQuestionFormat.FREE_TEXT]: '自由記述',
};

export const SURVEY_RESPONSE_STATUS_LABELS: Record<'completed' | 'partial', string> = {
  completed: '完了',
  partial: '未完了',
};

export const SURVEY_RESPONSE_STATUS_BADGE_CLASSES: Record<'completed' | 'partial', string> = {
  completed: 'bg-success/15 text-success border-success/20',
  partial: 'bg-warning/15 text-warning border-warning/20',
};

export const SURVEY_RESPONSE_MEMBER_TYPE_LABELS: Record<MemberType, string> = MEMBER_TYPE_LABELS;

export const SURVEY_BRAND_LABELS: Record<StoreListBrand, string> = {
  [StoreListBrand.JOYFIT]: 'JOYFIT',
  [StoreListBrand.FIT365]: 'FIT365',
  [StoreListBrand.JOYFIT24]: 'JOYFIT24',
  [StoreListBrand.JOYFIT_YOGA]: 'JOYFIT YOGA',
  [StoreListBrand.JOYFIT_PLUS]: 'JOYFIT+',
};

export function formatSurveyDateOnly(value?: string | null): string {
  if (!value) return '—';
  return value.trim().split(' ')[0] ?? '—';
}
