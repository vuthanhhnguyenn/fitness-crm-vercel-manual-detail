import type {
  CreateExerciseMasterBody,
  ExerciseMasterDeleteBlockReason,
  ExerciseMasterDetail,
  ExerciseMasterKind,
  GetExerciseMasterListQuery,
  GetExerciseMasterListResponse,
  UpdateExerciseMasterBody,
} from '@/app/api/_schemas/exercise-master.schema';

export type ExerciseMasterRecord = ExerciseMasterDetail & {
  deletedAt: string | null;
};

export type ExerciseMastersType = {
  _rows: Record<ExerciseMasterKind, ExerciseMasterRecord[]>;
  _seeded: boolean;
  _seed(): void;
  list(kind: ExerciseMasterKind, query: GetExerciseMasterListQuery): GetExerciseMasterListResponse;
  getOptions(kind: ExerciseMasterKind): Array<{ id: string; label: string }>;
  getAll(kind: ExerciseMasterKind): ExerciseMasterDetail[];
  getById(kind: ExerciseMasterKind, id: string): ExerciseMasterDetail | undefined;
  create(kind: ExerciseMasterKind, body: CreateExerciseMasterBody): ExerciseMasterDetail;
  update(
    kind: ExerciseMasterKind,
    id: string,
    body: UpdateExerciseMasterBody,
  ): ExerciseMasterDetail | undefined;
  delete(
    kind: ExerciseMasterKind,
    id: string,
  ):
    | { ok: true }
    | {
        ok: false;
        error: string;
        blockReason: ExerciseMasterDeleteBlockReason;
      }
    | undefined;
  getUsageCount(kind: ExerciseMasterKind, id: string): number;
};
