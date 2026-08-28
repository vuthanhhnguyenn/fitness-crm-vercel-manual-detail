import type {
  CreateRoutineResponse,
  DuplicateRoutineResponse,
  GetRoutinesQuery,
  GetRoutinesResponse,
  RoutineDetail,
  UpdateRoutinePublishStatusBody,
  UpdateRoutinePublishStatusResponse,
  UpdateRoutineResponse,
  UpsertRoutineBody,
} from '@/app/api/_schemas/routine.schema';

import type { RoutineRecord } from '../seeds/routine.seed';

export type RoutineValidationError = {
  status: 400 | 422;
  code: string;
  error: string;
};

export type RoutinesType = {
  _rows: RoutineRecord[];
  _seeded: boolean;
  _seed(): void;
  validateUpsertBody(body: UpsertRoutineBody): RoutineValidationError | null;
  list(query: GetRoutinesQuery): GetRoutinesResponse;
  getById(id: string): RoutineDetail | undefined;
  create(body: UpsertRoutineBody): CreateRoutineResponse;
  update(id: string, body: UpsertRoutineBody): UpdateRoutineResponse | undefined;
  updatePublishStatus(
    id: string,
    body: UpdateRoutinePublishStatusBody,
  ):
    | { ok: true; response: UpdateRoutinePublishStatusResponse }
    | { ok: false; code: string; error: string }
    | undefined;
  delete(id: string): { ok: true } | { ok: false; code: string; error: string } | undefined;
  duplicate(id: string): DuplicateRoutineResponse | undefined;
};
