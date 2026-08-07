import type { LessonContentDetail } from '@/app/api/_schemas/lesson-content-detail.schema';

export type LessonContentDetailsType = {
  getDetail(id: string): LessonContentDetail | undefined;
  exists(id: string): boolean;
  update(
    id: string,
    data: Partial<
      import('@/app/api/_schemas/lesson-content-form.schema').CreateLessonContentRequest
    >,
  ): LessonContentDetail | undefined;
};
