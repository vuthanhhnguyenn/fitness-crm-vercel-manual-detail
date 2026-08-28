import type {
  GetRoutineCategoriesResponse,
  RoutineCategory,
} from '@/app/api/_schemas/routine-category.schema';

import type { RoutineCategoryRecord } from '../seeds/routine-category.seed';

export type RoutineCategoriesType = {
  _rows: RoutineCategoryRecord[];
  _seeded: boolean;
  _seed(): void;
  list(): GetRoutineCategoriesResponse;
  getById(id: string): RoutineCategory | undefined;
};
