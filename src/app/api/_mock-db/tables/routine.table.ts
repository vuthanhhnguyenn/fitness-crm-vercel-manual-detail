import type {
  CreateRoutineResponse,
  DuplicateRoutineResponse,
  GetRoutinesQuery,
  GetRoutinesResponse,
  RoutineDetail,
  RoutineExercise,
  RoutineListItem,
  RoutineSet,
  UpdateRoutinePublishStatusBody,
  UpdateRoutinePublishStatusResponse,
  UpdateRoutineResponse,
  UpsertRoutineBody,
} from '@/app/api/_schemas/routine.schema';

import type { DbType } from '../_db.types';
import {
  type RoutineExerciseRecord,
  type RoutineRecord,
  type RoutineSetRecord,
  SEED_ROUTINES,
} from '../seeds/routine.seed';

const CREATE_STAFF_ID = 'STF-001';
const CREATE_STAFF_NAME = '本部 花子';

export function createRoutineTables(getDb: () => DbType) {
  return {
    routines: {
      _seeded: false,
      _rows: [] as RoutineRecord[],

      _seed() {
        if (this._seeded) return;
        this._rows = SEED_ROUTINES.map((record) => ({
          ...record,
          thumbnailS3Keys: [...record.thumbnailS3Keys],
          exercises: record.exercises.map((exercise) => ({
            ...exercise,
            sets: exercise.sets.map((set) => ({ ...set })),
          })),
        }));
        this._seeded = true;
      },

      _findActiveById(id: string) {
        return this._rows.find(
          (record) => record.id === id && record.origin === 'official' && record.deletedAt === null,
        );
      },

      _findActiveIndexById(id: string) {
        return this._rows.findIndex(
          (record) => record.id === id && record.origin === 'official' && record.deletedAt === null,
        );
      },

      _categoryName(categoryId: string) {
        return getDb().routineCategories.getById(categoryId)?.name ?? categoryId;
      },

      _resolveExercise(record: RoutineExerciseRecord): RoutineExercise {
        const exercise = getDb().exercises.getById(record.exerciseId);
        return {
          exerciseId: record.exerciseId,
          exerciseName: exercise?.nameJa ?? record.exerciseId,
          categoryName: exercise?.categoryName ?? '',
          sortOrder: record.sortOrder,
          hqComment: record.hqComment,
          sets: record.sets
            .slice()
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((set): RoutineSet => ({ ...set })),
        };
      },

      _toDetail(record: RoutineRecord): RoutineDetail {
        return {
          id: record.id,
          routineCode: record.routineCode,
          name: record.name,
          categoryId: record.categoryId,
          categoryName: this._categoryName(record.categoryId),
          description: record.description,
          thumbnailS3Keys: [...record.thumbnailS3Keys],
          publishStatus: record.publishStatus,
          publishedAt: record.publishedAt,
          exerciseCount: record.exercises.length,
          exercises: record.exercises
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((exercise) => this._resolveExercise(exercise)),
          createdByStaffId: record.createdByStaffId,
          updatedByStaffId: record.updatedByStaffId,
          updatedByName: record.updatedByName,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };
      },

      _toListItem(record: RoutineRecord): RoutineListItem {
        return {
          id: record.id,
          routineCode: record.routineCode,
          name: record.name,
          categoryId: record.categoryId,
          categoryName: this._categoryName(record.categoryId),
          exerciseCount: record.exercises.length,
          publishStatus: record.publishStatus,
          updatedAt: record.updatedAt,
        };
      },

      _nextSequence() {
        const max = this._rows.reduce((current, row) => {
          const suffix = Number(row.routineCode.replace(/^RT-/, ''));
          return Number.isFinite(suffix) && suffix > current ? suffix : current;
        }, 0);
        return max + 1;
      },

      _bodyToExerciseRecords(body: UpsertRoutineBody): RoutineExerciseRecord[] {
        return body.exercises.map((exercise, index) => ({
          exerciseId: exercise.exerciseId,
          sortOrder: exercise.sortOrder ?? index,
          hqComment: exercise.hqComment ?? null,
          sets: exercise.sets.map(
            (set, setIndex): RoutineSetRecord => ({
              setNumber: setIndex + 1,
              setType: 'normal',
              supersetGroup: null,
              targetWeightKg: set.targetWeightKg ?? null,
              targetReps: set.targetReps ?? null,
              targetDurationSeconds: set.targetDurationSeconds ?? null,
              targetDistanceM: set.targetDistanceM ?? null,
              targetRpe: set.targetRpe ?? null,
            }),
          ),
        }));
      },

      // Y-09 create/edit の業務ルール検証（Zod で表現できない DB 参照系）
      validateUpsertBody(body: UpsertRoutineBody) {
        this._seed();

        const ids = body.exercises.map((exercise) => exercise.exerciseId);
        if (new Set(ids).size !== ids.length) {
          return {
            status: 400 as const,
            code: 'E-VAL-001',
            error: '同じエクササイズを重複して追加することはできません',
          };
        }

        for (const exercise of body.exercises) {
          // Phase 1: superset は不可（FR-014 は Phase 2 スコープ）
          if (exercise.sets.some((set) => set.setType === 'superset')) {
            return {
              status: 400 as const,
              code: 'E-VAL-001',
              error: 'スーパーセットは Phase 1 では設定できません',
            };
          }

          // 推奨Rep数・重量は0以上（FR-009 異常系）
          const hasNegative = exercise.sets.some(
            (set) =>
              (set.targetReps != null && set.targetReps < 0) ||
              (set.targetWeightKg != null && set.targetWeightKg < 0),
          );
          if (hasNegative) {
            return {
              status: 422 as const,
              code: 'E-RTN-005',
              error: '推奨Rep数・推奨重量は0以上の数値で入力してください',
            };
          }

          // 公開中エクササイズのみ追加可（FR-008 異常系）
          const exerciseDetail = getDb().exercises.getById(exercise.exerciseId);
          if (!exerciseDetail || exerciseDetail.publishStatus !== 'public') {
            return {
              status: 422 as const,
              code: 'E-RTN-004',
              error: '公開中のエクササイズのみ追加できます',
            };
          }
        }

        return null;
      },

      list(query: GetRoutinesQuery): GetRoutinesResponse {
        this._seed();
        let rows = this._rows.filter(
          (record) => record.origin === 'official' && record.deletedAt === null,
        );
        const totalAllItems = rows.length;

        if (query.search) {
          const term = query.search.toLowerCase().trim();
          rows = rows.filter((row) => row.name.toLowerCase().includes(term));
        }
        if (query.categoryId) {
          rows = rows.filter((row) => row.categoryId === query.categoryId);
        }
        if (query.publishStatus) {
          rows = rows.filter((row) => row.publishStatus === query.publishStatus);
        }

        rows = [...rows].sort((a, b) => {
          const direction = query.sortOrder === 'asc' ? 1 : -1;
          if (query.sortBy === 'name') {
            return a.name.localeCompare(b.name, 'ja') * direction;
          }
          if (query.sortBy === 'exerciseCount') {
            return (a.exercises.length - b.exercises.length) * direction;
          }
          if (query.sortBy === 'publishStatus') {
            return a.publishStatus.localeCompare(b.publishStatus) * direction;
          }
          return a.updatedAt.localeCompare(b.updatedAt) * direction;
        });

        const totalItems = rows.length;
        const totalPages = Math.ceil(totalItems / query.limit) || 0;
        const startIndex = (query.page - 1) * query.limit;

        return {
          items: rows
            .slice(startIndex, startIndex + query.limit)
            .map((record) => this._toListItem(record)),
          pagination: {
            page: query.page,
            limit: query.limit,
            totalItems,
            totalPages,
            totalAllItems,
          },
        };
      },

      getById(id: string) {
        this._seed();
        const row = this._findActiveById(id);
        return row ? this._toDetail(row) : undefined;
      },

      create(body: UpsertRoutineBody): CreateRoutineResponse {
        this._seed();
        const sequence = this._nextSequence();
        const timestamp = new Date().toISOString();
        const record: RoutineRecord = {
          id: `RT-${String(sequence).padStart(3, '0')}`,
          routineCode: `RT-${String(sequence).padStart(5, '0')}`,
          name: body.name,
          description: body.description ?? null,
          categoryId: body.categoryId,
          brandEnum: 'joyfit',
          thumbnailS3Keys: [...body.thumbnailS3Keys],
          origin: 'official',
          sourceRoutineId: null,
          isPublic: false,
          publishStatus: 'unpublished',
          publishedAt: null,
          exercises: this._bodyToExerciseRecords(body),
          deletedAt: null,
          createdByStaffId: CREATE_STAFF_ID,
          updatedByStaffId: CREATE_STAFF_ID,
          updatedByName: CREATE_STAFF_NAME,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        this._rows.unshift(record);

        return {
          message: 'ルーティンを登録しました',
          routine: this._toDetail(record),
        };
      },

      update(id: string, body: UpsertRoutineBody): UpdateRoutineResponse | undefined {
        this._seed();
        const index = this._findActiveIndexById(id);
        if (index === -1) return undefined;

        const existing = this._rows[index]!;
        const timestamp = new Date().toISOString();

        this._rows[index] = {
          ...existing,
          name: body.name,
          description: body.description ?? null,
          categoryId: body.categoryId,
          thumbnailS3Keys: [...body.thumbnailS3Keys],
          exercises: this._bodyToExerciseRecords(body),
          updatedByStaffId: CREATE_STAFF_ID,
          updatedByName: CREATE_STAFF_NAME,
          updatedAt: timestamp,
        };

        return {
          message: 'ルーティンを更新しました',
          routine: this._toDetail(this._rows[index]!),
        };
      },

      updatePublishStatus(id: string, body: UpdateRoutinePublishStatusBody) {
        this._seed();
        const index = this._findActiveIndexById(id);
        if (index === -1) return undefined;

        const existing = this._rows[index]!;

        // FR-007: 非公開→公開はエクササイズ1件以上が条件
        if (body.publishStatus === 'published' && existing.exercises.length === 0) {
          return {
            ok: false as const,
            code: 'E-RTN-003',
            error: '公開するにはエクササイズを1件以上登録してください',
          };
        }

        const timestamp = new Date().toISOString();
        const isPublished = body.publishStatus === 'published';

        this._rows[index] = {
          ...existing,
          publishStatus: body.publishStatus,
          isPublic: isPublished,
          publishedAt: isPublished ? (existing.publishedAt ?? timestamp) : existing.publishedAt,
          updatedByStaffId: CREATE_STAFF_ID,
          updatedByName: CREATE_STAFF_NAME,
          updatedAt: timestamp,
        };

        const response: UpdateRoutinePublishStatusResponse = {
          message: 'ステータスを更新しました',
          routine: this._toDetail(this._rows[index]!),
        };

        return { ok: true as const, response };
      },

      delete(id: string) {
        this._seed();
        const index = this._findActiveIndexById(id);
        if (index === -1) return undefined;

        const existing = this._rows[index]!;

        // FR-006: 公開中は削除不可（先に非公開へ）
        if (existing.publishStatus === 'published') {
          return {
            ok: false as const,
            code: 'E-RTN-002',
            error: '公開中のルーティンは削除できません。先に非公開に変更してください。',
          };
        }

        const timestamp = new Date().toISOString();
        this._rows[index] = {
          ...existing,
          deletedAt: timestamp,
          updatedByStaffId: CREATE_STAFF_ID,
          updatedByName: CREATE_STAFF_NAME,
          updatedAt: timestamp,
        };

        return { ok: true as const };
      },

      duplicate(id: string): DuplicateRoutineResponse | undefined {
        this._seed();
        const source = this._findActiveById(id);
        if (!source) return undefined;

        const sequence = this._nextSequence();
        const timestamp = new Date().toISOString();
        const record: RoutineRecord = {
          ...source,
          id: `RT-${String(sequence).padStart(3, '0')}`,
          routineCode: `RT-${String(sequence).padStart(5, '0')}`,
          name: `${source.name}のコピー`,
          thumbnailS3Keys: [...source.thumbnailS3Keys],
          sourceRoutineId: source.id,
          isPublic: false,
          publishStatus: 'unpublished',
          publishedAt: null,
          exercises: source.exercises.map((exercise) => ({
            ...exercise,
            sets: exercise.sets.map((set) => ({ ...set })),
          })),
          deletedAt: null,
          createdByStaffId: CREATE_STAFF_ID,
          updatedByStaffId: CREATE_STAFF_ID,
          updatedByName: CREATE_STAFF_NAME,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        this._rows.unshift(record);

        return {
          message: 'ルーティンを複製しました',
          routine: this._toDetail(record),
        };
      },
    },
  };
}
