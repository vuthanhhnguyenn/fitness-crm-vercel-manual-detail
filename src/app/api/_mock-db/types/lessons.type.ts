export type LessonsType = {
  _rows: Array<{
    id: string;
    name: string;
    lesson_type: 'studio' | 'personal';
    duration: number;
  }>;
  _seeded: boolean;
  _seed(): void;
  getList(
    lessonType?: 'studio' | 'personal',
  ): Array<{ id: string; name: string; lesson_type: 'studio' | 'personal'; duration: number }>;
  getById(
    id: string,
  ): { id: string; name: string; lesson_type: 'studio' | 'personal'; duration: number } | undefined;
};
