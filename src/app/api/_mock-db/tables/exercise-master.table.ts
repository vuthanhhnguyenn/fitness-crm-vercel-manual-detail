import type {
  CreateExerciseMasterBody,
  ExerciseMasterDeleteBlockReason,
  ExerciseMasterDetail,
  ExerciseMasterKind,
  ExerciseMasterListItem,
  GetExerciseMasterListQuery,
  GetExerciseMasterListResponse,
  UpdateExerciseMasterBody,
} from '@/app/api/_schemas/exercise-master.schema';
import type { ExerciseDetail } from '@/app/api/_schemas/exercise.schema';

import type { DbType } from '../_db.types';
import {
  EXERCISE_MASTER_KIND_LABEL,
  EXERCISE_MASTER_KIND_PREFIX,
  EXERCISE_MASTER_SEEDS,
  type ExerciseMasterRecord as MasterRecord,
} from '../seeds/exercise-master.seed';

const nowIso = () => new Date().toISOString();

type DeleteExerciseMasterResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      blockReason: ExerciseMasterDeleteBlockReason;
    }
  | undefined;

function mapLabel(kind: ExerciseMasterKind): string {
  return EXERCISE_MASTER_KIND_LABEL[kind];
}

function mapRecord(record: MasterRecord, usageCount: number): ExerciseMasterListItem {
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    description: record.description,
    sortOrder: record.sortOrder,
    usageCount,
    status: record.deletedAt ? 'inactive' : 'active',
    updatedAt: record.updatedAt,
  };
}

function toDetail(record: MasterRecord, usageCount: number): ExerciseMasterDetail {
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    description: record.description,
    sortOrder: record.sortOrder,
    usageCount,
    status: record.deletedAt ? 'inactive' : 'active',
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
    deletedAt: record.deletedAt,
    updatedBy: record.updatedBy,
  };
}

function getUsageCount(kind: ExerciseMasterKind, id: string, db: DbType): number {
  const exercises: ExerciseDetail[] = db.exercises.getAll();
  switch (kind) {
    case 'category':
      return exercises.filter((exercise) => exercise.categoryId === id).length;
    case 'muscle':
      return exercises.filter(
        (exercise) => exercise.primaryMuscleId === id || exercise.secondaryMuscleIds.includes(id),
      ).length;
    case 'tool':
      return exercises.filter((exercise) => exercise.toolId === id).length;
    case 'exercise_type':
      return exercises.filter((exercise) => exercise.exerciseTypeId === id).length;
  }
}

function nextId(kind: ExerciseMasterKind, rows: MasterRecord[]): string {
  const prefix = EXERCISE_MASTER_KIND_PREFIX[kind];
  const max = rows.reduce((current, row) => {
    const suffix = Number(row.id.replace(/^[A-Z-]+/, ''));
    return Number.isFinite(suffix) && suffix > current ? suffix : current;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

function createRecord(
  kind: ExerciseMasterKind,
  body: CreateExerciseMasterBody,
  db: DbType,
): MasterRecord {
  const rows = db.exerciseMasters._rows[kind];
  const now = nowIso();
  return {
    id: nextId(kind, rows),
    code: body.code,
    name: body.name,
    description: body.description ?? null,
    sortOrder: body.sortOrder,
    usageCount: 0,
    status: 'active',
    updatedAt: now,
    createdAt: now,
    deletedAt: null,
    updatedBy: '本部 花子',
  };
}

function updateRecord(
  record: MasterRecord,
  body: UpdateExerciseMasterBody,
  db: DbType,
  kind: ExerciseMasterKind,
): MasterRecord {
  return {
    ...record,
    name: body.name,
    description: body.description ?? null,
    sortOrder: body.sortOrder,
    usageCount: getUsageCount(kind, record.id, db),
    updatedAt: nowIso(),
    updatedBy: '本部 花子',
  };
}

function seedRows(kind: ExerciseMasterKind): MasterRecord[] {
  return EXERCISE_MASTER_SEEDS[kind].map((seed, index) => ({
    id: `${EXERCISE_MASTER_KIND_PREFIX[kind]}-${String(index + 1).padStart(3, '0')}`,
    code: seed.code,
    name: seed.name,
    description: seed.description,
    sortOrder: seed.sortOrder,
    usageCount: 0,
    status: 'active',
    updatedAt: '2026-01-15T00:00:00Z',
    createdAt: '2025-04-01T00:00:00Z',
    deletedAt: null,
    updatedBy: '本部 花子',
  }));
}

export function createExerciseMasterTables(getDb: () => DbType) {
  const exerciseMasters = {
    _seeded: false,
    _rows: {
      category: [] as MasterRecord[],
      muscle: [] as MasterRecord[],
      tool: [] as MasterRecord[],
      exercise_type: [] as MasterRecord[],
    },

    _seed() {
      if (this._seeded) return;
      this._seeded = true;
      (Object.keys(this._rows) as ExerciseMasterKind[]).forEach((kind) => {
        this._rows[kind] = seedRows(kind);
      });
    },

    list(
      kind: ExerciseMasterKind,
      query: GetExerciseMasterListQuery,
    ): GetExerciseMasterListResponse {
      this._seed();
      const db = getDb();
      let rows = this._rows[kind].filter((record) => record.deletedAt === null);

      if (query.search) {
        const term = query.search.toLowerCase().trim();
        rows = rows.filter(
          (record) =>
            record.code.toLowerCase().includes(term) ||
            record.name.toLowerCase().includes(term) ||
            (record.description ?? '').toLowerCase().includes(term),
        );
      }

      return {
        items: rows
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder || b.updatedAt.localeCompare(a.updatedAt))
          .map((record) => mapRecord(record, getUsageCount(kind, record.id, db))),
      };
    },

    getOptions(kind: ExerciseMasterKind) {
      this._seed();
      return this._rows[kind]
        .filter((record) => record.deletedAt === null)
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder || b.updatedAt.localeCompare(a.updatedAt))
        .map((record) => ({
          id: record.id,
          label: record.name,
        }));
    },

    getAll(kind: ExerciseMasterKind) {
      this._seed();
      const db = getDb();
      return this._rows[kind]
        .filter((record) => record.deletedAt === null)
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder || b.updatedAt.localeCompare(a.updatedAt))
        .map((record) => toDetail(record, getUsageCount(kind, record.id, db)));
    },

    getById(kind: ExerciseMasterKind, id: string) {
      this._seed();
      const db = getDb();
      const record = this._rows[kind].find((item) => item.id === id && item.deletedAt === null);
      return record ? toDetail(record, getUsageCount(kind, record.id, db)) : undefined;
    },

    create(kind: ExerciseMasterKind, body: CreateExerciseMasterBody) {
      this._seed();
      const db = getDb();
      const record = createRecord(kind, body, db);
      this._rows[kind].unshift(record);
      return toDetail(record, getUsageCount(kind, record.id, db));
    },

    update(kind: ExerciseMasterKind, id: string, body: UpdateExerciseMasterBody) {
      this._seed();
      const db = getDb();
      const index = this._rows[kind].findIndex((item) => item.id === id && item.deletedAt === null);
      if (index === -1) return undefined;
      const next = updateRecord(this._rows[kind][index]!, body, db, kind);
      this._rows[kind][index] = next;
      return toDetail(next, getUsageCount(kind, next.id, db));
    },

    delete(kind: ExerciseMasterKind, id: string): DeleteExerciseMasterResult {
      this._seed();
      const db = getDb();
      const index = this._rows[kind].findIndex((item) => item.id === id && item.deletedAt === null);
      if (index === -1) return undefined;
      const usageCount = getUsageCount(kind, id, db);
      if (usageCount > 0) {
        return {
          ok: false as const,
          error: `${mapLabel(kind)}はエクササイズで使用中のため削除できません`,
          blockReason: 'in_use_by_exercise' as const,
        };
      }

      this._rows[kind][index] = {
        ...this._rows[kind][index]!,
        deletedAt: nowIso(),
        updatedAt: nowIso(),
        updatedBy: '本部 花子',
      };

      return { ok: true as const };
    },

    getUsageCount(kind: ExerciseMasterKind, id: string) {
      this._seed();
      return getUsageCount(kind, id, getDb());
    },
  };

  return { exerciseMasters };
}
