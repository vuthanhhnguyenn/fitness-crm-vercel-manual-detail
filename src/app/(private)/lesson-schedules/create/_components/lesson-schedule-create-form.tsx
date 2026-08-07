'use client';

import { Button } from '@/components/ui/button';

import { LessonScheduleFormDateStudio } from './lesson-schedule-form-date-studio';
import { LessonScheduleFormInstructors } from './lesson-schedule-form-instructors';
import { LessonScheduleFormLesson } from './lesson-schedule-form-lesson';
import { LessonScheduleFormPublication } from './lesson-schedule-form-publication';
import { LessonScheduleFormReservation } from './lesson-schedule-form-reservation';

interface LessonScheduleCreateFormProps {
  isSubmitting?: boolean;
  hasSubmitError?: boolean;
  onCancel: () => void;
}

export function LessonScheduleCreateForm({
  isSubmitting = false,
  hasSubmitError = false,
  onCancel,
}: Readonly<LessonScheduleCreateFormProps>) {
  return (
    <div className="flex flex-col gap-6">
      <LessonScheduleFormDateStudio />
      <LessonScheduleFormLesson />
      <LessonScheduleFormInstructors />
      <LessonScheduleFormPublication />
      <LessonScheduleFormReservation />

      <div className="flex items-center justify-end gap-2 border-t p-4">
        {hasSubmitError && (
          <p className="text-destructive mr-auto text-xs">未入力の項目があります</p>
        )}
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : 'スケジュールを登録する'}
        </Button>
      </div>
    </div>
  );
}
