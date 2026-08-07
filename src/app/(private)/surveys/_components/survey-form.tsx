'use client';

import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import { GetCrmSurveysResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { SURVEY_TRIGGER_LABELS } from '../_constants/constants';
import { useSurveyDuplicateTrigger } from '../_hooks/use-survey-form';
import { type SurveyFormSubmitValues, type SurveyFormValues } from '../_schemas/survey-form.schema';
import { SurveyFormBasicInfoSection } from './survey-form-basic-info';
import { SurveyFormQuestionsSection } from './survey-form-questions';
import { SurveyFormStatusSection } from './survey-form-status';
import { SurveyFormQuestionVisibilitySection } from './survey-form-store-visibility';

interface SurveyFormProps {
  isEdit?: boolean;
  isSubmitting?: boolean;
  surveyId?: string;
  existingSurveys: GetCrmSurveysResponse['surveys'];
  onCancel: () => void;
  onSubmit: (values: SurveyFormSubmitValues) => void;
}

export function SurveyForm({
  isEdit = false,
  isSubmitting = false,
  surveyId,
  existingSurveys,
  onCancel,
  onSubmit,
}: Readonly<SurveyFormProps>) {
  const form = useFormContext<SurveyFormValues>();
  const trigger = useWatch({ control: form.control, name: 'trigger' });
  const [deleteTarget, setDeleteTarget] = useState<{ index: number; hasResponses: boolean } | null>(
    null,
  );
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [pendingSubmitValues, setPendingSubmitValues] = useState<SurveyFormSubmitValues | null>(
    null,
  );

  const duplicateSurvey = useSurveyDuplicateTrigger(existingSurveys, trigger, surveyId);

  const handleFormSubmit = form.handleSubmit((values) => {
    const duplicate = duplicateSurvey ?? undefined;
    if (duplicate) {
      setPendingSubmitValues(values);
      setDuplicateDialogOpen(true);
      return;
    }

    onSubmit(values);
  });

  const confirmDuplicateSave = () => {
    if (!pendingSubmitValues || !duplicateSurvey) {
      setDuplicateDialogOpen(false);
      setPendingSubmitValues(null);
      return;
    }

    onSubmit({
      ...pendingSubmitValues,
      replaceExistingSurveyId: duplicateSurvey.id,
    });
    setDuplicateDialogOpen(false);
    setPendingSubmitValues(null);
  };

  const confirmDeleteQuestion = () => {
    if (!deleteTarget) return;

    if (deleteTarget.hasResponses) {
      setDeleteTarget(null);
      return;
    }

    const questions = form.getValues('questions');
    form.setValue(
      'questions',
      questions.filter((_question, index: number) => index !== deleteTarget.index),
      { shouldDirty: true, shouldValidate: true },
    );

    setDeleteTarget(null);
  };

  return (
    <>
      <form onSubmit={handleFormSubmit}>
        <div className="flex flex-col gap-6">
          {isEdit && (
            <div className="mx-auto w-full max-w-[960px]">
              <Alert className="border-warning/50 bg-warning/10 mb-6 w-full px-4 py-3">
                <AlertTriangle className="text-warning size-4" />
                <AlertDescription className="text-muted-foreground text-xs">
                  回答済みデータがある状態で設問を変更すると、既存の回答との整合性が失われます。
                </AlertDescription>
              </Alert>
            </div>
          )}

          <SurveyFormBasicInfoSection />

          <SurveyFormQuestionsSection
            onDeleteQuestion={(index) => {
              const question = form.getValues(`questions.${index}`);
              setDeleteTarget({ index, hasResponses: question.hasResponses });
            }}
          />

          {isEdit && <SurveyFormQuestionVisibilitySection />}

          <SurveyFormStatusSection />

          <div className="flex items-center justify-end gap-2 border-t p-4">
            <Button
              size="lg"
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button size="lg" type="submit" disabled={isSubmitting}>
              {isEdit ? '変更を保存する' : '登録する'}
            </Button>
          </div>
        </div>
      </form>

      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>同一トリガーのアンケートが既に存在します</AlertDialogTitle>
            <AlertDialogDescription>
              「{SURVEY_TRIGGER_LABELS[trigger]}」のアンケート（{duplicateSurvey?.name}
              ）が既に有効です。 新しい方を有効にすると既存は自動的に無効化されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDuplicateDialogOpen(false);
                setPendingSubmitValues(null);
              }}
            >
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDuplicateSave}>
              既存を無効化して登録
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.hasResponses ? 'この設問は削除できません' : 'この設問を削除しますか？'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.hasResponses
                ? 'この設問には回答データがあります。削除はできません。必要に応じて表示設定から非表示にしてください。'
                : 'この操作は取り消せません。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className={
                deleteTarget?.hasResponses
                  ? undefined
                  : cn('bg-warning text-warning-foreground hover:bg-warning/90')
              }
              onClick={confirmDeleteQuestion}
            >
              {deleteTarget?.hasResponses ? '閉じる' : '削除する'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
