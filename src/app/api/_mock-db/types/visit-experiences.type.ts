import type { VisitExperienceDetail } from '@/app/api/_schemas/visit-experience.schema';

export type VisitExperiencesType = {
  _rows: VisitExperienceDetail[];
  _seeded: boolean;
  _seed(): void;
  getAll(): VisitExperienceDetail[];
  getById(id: string): VisitExperienceDetail | undefined;
  update(id: string, record: VisitExperienceDetail): void;
};
