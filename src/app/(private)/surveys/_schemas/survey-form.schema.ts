import { z } from 'zod';

import {
  StoreListBrand,
  SurveyTemplateStatus,
  SurveyTemplateTrigger,
  SurveyTemplateType,
} from '@/lib/api/types.gen';

export const SURVEY_QUESTION_FORMAT_VALUES = [
  'single_choice',
  'multiple_choice',
  'free_text',
] as const;

export const surveyQuestionChoiceFormSchema = z.object({
  id: z.string(),
  text: z.string().trim().min(1, '選択肢テキストを入力してください'),
});

export const surveyQuestionFormSchema = z.object({
  id: z.string(),
  content: z.string().trim().min(1, '設問内容を入力してください'),
  format: z.enum(SURVEY_QUESTION_FORMAT_VALUES),
  required: z.boolean(),
  hasResponses: z.boolean(),
  choices: z.array(surveyQuestionChoiceFormSchema),
});

export const surveyFormSchema = z
  .object({
    name: z.string().trim().min(1, 'アンケート名を入力してください'),
    brand: z.nativeEnum(StoreListBrand),
    type: z.nativeEnum(SurveyTemplateType),
    trigger: z.nativeEnum(SurveyTemplateTrigger),
    status: z.nativeEnum(SurveyTemplateStatus),
    replaceExistingSurveyId: z.string().nullable().optional(),
    questions: z.array(surveyQuestionFormSchema).min(1, '設問を1件以上追加してください'),
  })
  .superRefine((value, ctx) => {
    value.questions.forEach((question, index) => {
      if (question.format !== 'free_text' && question.choices.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions', index, 'choices'],
          message: '選択肢を1件以上追加してください',
        });
      }
    });
  });

export type SurveyFormValues = z.infer<typeof surveyFormSchema>;
export type SurveyQuestionFormValues = z.infer<typeof surveyQuestionFormSchema>;
export type SurveyQuestionChoiceFormValues = z.infer<typeof surveyQuestionChoiceFormSchema>;
export type SurveyBrand = StoreListBrand;

export type SurveyFormSubmitValues = SurveyFormValues;

export interface SurveyDetailLike {
  id: string;
  name: string;
  type: SurveyTemplateType;
  trigger: SurveyTemplateTrigger;
  brand: SurveyBrand;
  status: SurveyTemplateStatus;
  questions: Array<{
    no: number;
    content: string;
    format: 'single_choice' | 'multiple_choice' | 'free_text';
    required: boolean;
    has_responses?: boolean;
    choices: Array<{ order: number; text: string }>;
  }>;
}

export function createEmptySurveyQuestion(id: string): SurveyQuestionFormValues {
  return {
    id,
    content: '',
    format: 'single_choice',
    required: true,
    hasResponses: false,
    choices: [{ id: `${id}-choice-1`, text: '' }],
  };
}

export function createEmptySurveyFormValues(): SurveyFormValues {
  return {
    name: '',
    brand: 'fit365',
    type: 'lifecycle',
    trigger: 'join',
    status: 'active',
    replaceExistingSurveyId: null,
    questions: [createEmptySurveyQuestion('q-1')],
  };
}

export function mapSurveyDetailToFormValues(survey: SurveyDetailLike): SurveyFormValues {
  return {
    name: survey.name,
    brand: survey.brand,
    type: survey.type,
    trigger: survey.trigger,
    status: survey.status,
    replaceExistingSurveyId: null,
    questions: survey.questions.map((question, index) => ({
      id: `q-${question.no}-${index}`,
      content: question.content,
      format: question.format,
      required: question.required,
      hasResponses: Boolean(question.has_responses),
      choices: question.choices.map((choice, choiceIndex) => ({
        id: `q-${question.no}-${index}-choice-${choiceIndex + 1}`,
        text: choice.text,
      })),
    })),
  };
}

export function mapSurveyFormValuesToPayload(values: SurveyFormValues) {
  return {
    name: values.name.trim(),
    brand: values.brand,
    type: values.type,
    trigger: values.trigger,
    status: values.status,
    replace_existing_survey_id: values.replaceExistingSurveyId ?? null,
    questions: values.questions.map((question, index) => ({
      no: index + 1,
      content: question.content.trim(),
      format: question.format,
      required: question.required,
      has_responses: question.hasResponses,
      choices: question.choices.map((choice, choiceIndex) => ({
        order: choiceIndex + 1,
        text: choice.text.trim(),
      })),
    })),
  };
}
