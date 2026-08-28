import type {
  CreateExerciseResponse,
  ExerciseDeleteBlockReason,
  ExerciseDetail,
  GetExercisesQuery,
  GetExercisesResponse,
  UpdateExercisePublishStatusBody,
  UpdateExercisePublishStatusResponse,
  UpdateExerciseResponse,
  UpsertExerciseBody,
} from '@/app/api/_schemas/exercise.schema';

import type { ExerciseRecord } from '../seeds/exercise.seed';

export type ExercisesType = {
  _rows: ExerciseRecord[];
  _seeded: boolean;
  _seed(): void;
  isBodyweightTool(toolId: string): boolean;
  validateUpsertBody(body: UpsertExerciseBody): string | null;
  list(query: GetExercisesQuery): GetExercisesResponse;
  getAll(): ExerciseDetail[];
  getById(id: string): ExerciseDetail | undefined;
  create(body: UpsertExerciseBody): CreateExerciseResponse;
  update(id: string, body: UpsertExerciseBody): UpdateExerciseResponse | undefined;
  updatePublishStatus(
    id: string,
    body: UpdateExercisePublishStatusBody,
  ): UpdateExercisePublishStatusResponse | undefined;
  delete(id: string):
    | { ok: true }
    | {
        ok: false;
        error: string;
        blockReason: ExerciseDeleteBlockReason;
      }
    | undefined;
};
