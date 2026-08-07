export type TemplatesType = {
  _rows: import('@/app/api/_schemas/lesson-schedule.schema').RepeatTemplate[];
  _seeded: boolean;
  _seed(): void;
  getList(): import('@/app/api/_schemas/lesson-schedule.schema').RepeatTemplate[];
  getById(
    id: string,
  ): import('@/app/api/_schemas/lesson-schedule.schema').RepeatTemplate | undefined;
  create(
    input: import('@/app/api/_schemas/lesson-schedule.schema').CreateTemplateRequest,
  ): import('@/app/api/_schemas/lesson-schedule.schema').RepeatTemplate;
  deleteById(id: string): boolean;
};
