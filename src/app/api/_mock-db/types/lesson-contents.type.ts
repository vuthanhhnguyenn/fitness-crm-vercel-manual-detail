import type { LessonContentDetail } from '@/app/api/_schemas/lesson-content-detail.schema';
import type { LessonContentItem } from '@/app/api/_schemas/lesson-content.schema';

export type LessonContentsType = {
  _rows: LessonContentItem[];
  _seeded: boolean;
  _seed(): void;
  getList(): LessonContentItem[];
  getRowById(id: string): LessonContentItem | undefined;
  getDetail(id: string): LessonContentDetail | undefined;
  create(
    data: import('@/app/api/_schemas/lesson-content-form.schema').CreateLessonContentRequest & {
      lesson_type: 'studio' | 'bodycare';
    },
  ): LessonContentDetail;
  update(
    id: string,
    data: Partial<
      import('@/app/api/_schemas/lesson-content-form.schema').CreateLessonContentRequest
    >,
  ): LessonContentDetail | undefined;
};
