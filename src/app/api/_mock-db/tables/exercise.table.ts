import type {
  CreateExerciseResponse,
  ExerciseDeleteBlockReason,
  ExerciseDetail,
  ExerciseListItem,
  ExerciseStep,
  GetExercisesQuery,
  GetExercisesResponse,
  UpdateExercisePublishStatusBody,
  UpdateExercisePublishStatusResponse,
  UpdateExerciseResponse,
  UpsertExerciseBody,
} from '@/app/api/_schemas/exercise.schema';

import type { DbType } from '../_db.types';
import {
  EXERCISE_STEP_LABELS,
  EXERCISE_TAGS,
  type ExerciseRecord,
  SEED_EXERCISES,
} from '../seeds/exercise.seed';

type ExerciseOption = {
  id: string;
  label: string;
};

export function createExercisesTables(getDb: () => DbType) {
  return {
    exercises: {
      _seeded: false,
      _rows: [] as ExerciseRecord[],

      _seed() {
        if (this._seeded) return;
        this._rows = SEED_EXERCISES.map((record) => ({ ...record }));
        this._seeded = true;
      },

      _mapOptionLabel(options: ExerciseOption[], id: string) {
        return options.find((option) => option.id === id)?.label ?? id;
      },

      _getMasterOptions(kind: 'category' | 'muscle' | 'tool' | 'exercise_type') {
        return getDb().exerciseMasters.getOptions(kind);
      },

      _getMasterCode(kind: 'category' | 'muscle' | 'tool' | 'exercise_type', id: string) {
        return getDb().exerciseMasters.getById(kind, id)?.code ?? null;
      },

      _getMasterLabel(kind: 'category' | 'muscle' | 'tool' | 'exercise_type', id: string) {
        return this._mapOptionLabel(this._getMasterOptions(kind), id);
      },

      _normalizeImages(images: UpsertExerciseBody['images']) {
        const hasPrimary = images.some((image) => image.isPrimary);
        return images.map((image, index) => ({
          id: `IMG-${index}-${image.sortOrder}`,
          url: image.url,
          sortOrder: image.sortOrder,
          isPrimary: hasPrimary ? image.isPrimary : index === 0,
        }));
      },

      _toStepModel(inputSteps: UpsertExerciseBody['explanationSteps']): ExerciseStep[] {
        return inputSteps.map((step) => ({
          step: step.step,
          label: EXERCISE_STEP_LABELS[step.step]!,
          textJa: step.textJa,
          textEn: step.textEn ?? null,
          isMissing: step.textJa.trim().length === 0,
        }));
      },

      _canDelete(record: ExerciseRecord): {
        canDelete: boolean;
        blockReason: ExerciseDeleteBlockReason | null;
      } {
        if (record.publishStatus === 'public') {
          return { canDelete: false, blockReason: 'public' };
        }

        if (record.routineUsageCount > 0) {
          return { canDelete: false, blockReason: 'in_use_by_routine' };
        }

        return { canDelete: true, blockReason: null };
      },

      _toRelatedExerciseSummary(record: ExerciseRecord) {
        return {
          id: record.id,
          exerciseCode: record.exerciseCode,
          nameJa: record.nameJa,
          categoryName: this._getMasterLabel('category', record.categoryId),
          level: record.level,
        };
      },

      _toDetail(record: ExerciseRecord): ExerciseDetail {
        const deleteState = this._canDelete(record);

        return {
          id: record.id,
          exerciseCode: record.exerciseCode,
          nameJa: record.nameJa,
          nameEn: record.nameEn,
          overviewJa: record.overviewJa,
          overviewEn: record.overviewEn,
          categoryId: record.categoryId,
          categoryName: this._getMasterLabel('category', record.categoryId),
          primaryMuscleId: record.primaryMuscleId,
          primaryMuscleName: this._getMasterLabel('muscle', record.primaryMuscleId),
          secondaryMuscleIds: record.secondaryMuscleIds,
          secondaryMuscleNames: record.secondaryMuscleIds.map((id) =>
            this._getMasterLabel('muscle', id),
          ),
          toolId: record.toolId,
          toolName: this._getMasterLabel('tool', record.toolId),
          exerciseTypeId: record.exerciseTypeId,
          exerciseTypeName: this._getMasterLabel('exercise_type', record.exerciseTypeId),
          handUsage: record.handUsage,
          level: record.level,
          restSeconds: record.restSeconds,
          publishStatus: record.publishStatus,
          updatedAt: record.updatedAt,
          updatedBy: record.updatedBy,
          videoUrl: record.videoUrl,
          images: record.images,
          explanationSteps: record.explanationSteps.map((step) => ({
            ...step,
            isMissing: step.textJa.trim().length === 0,
          })),
          linkedEquipment: record.linkedEquipmentIds
            .map((id) => getDb().trainingEquipment.getById(id))
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
            .map((item) => ({
              id: item.id,
              label: item.name,
            })),
          relatedExercises: record.relatedExerciseIds
            .map((id) => this._rows.find((row) => row.id === id && row.deletedAt === null))
            .filter((row): row is ExerciseRecord => Boolean(row))
            .map((row) => this._toRelatedExerciseSummary(row)),
          tags: EXERCISE_TAGS.map((tag) => ({
            ...tag,
            enabled: record.enabledTagIds.includes(tag.id),
          })),
          canDelete: deleteState.canDelete,
          deleteBlockReason: deleteState.blockReason,
        };
      },

      _toListItem(record: ExerciseRecord): ExerciseListItem {
        const detail = this._toDetail(record);

        return {
          id: detail.id,
          exerciseCode: detail.exerciseCode,
          nameJa: detail.nameJa,
          categoryName: detail.categoryName,
          primaryMuscleName: detail.primaryMuscleName,
          toolName: detail.toolName,
          level: detail.level,
          publishStatus: detail.publishStatus,
          updatedAt: detail.updatedAt,
          thumbnailUrl:
            (detail.images.find((image) => image.isPrimary) ?? detail.images[0])?.url ?? null,
          canDelete: detail.canDelete,
          deleteBlockReason: detail.deleteBlockReason,
        };
      },

      _applyBody(record: ExerciseRecord, body: UpsertExerciseBody): ExerciseRecord {
        const updatedAt = new Date().toISOString();

        return {
          ...record,
          nameJa: body.nameJa,
          nameEn: body.nameEn ?? null,
          overviewJa: body.overviewJa ?? null,
          overviewEn: body.overviewEn ?? null,
          categoryId: body.categoryId,
          primaryMuscleId: body.primaryMuscleId,
          secondaryMuscleIds: body.secondaryMuscleIds,
          toolId: body.toolId,
          exerciseTypeId: body.exerciseTypeId,
          handUsage: body.handUsage,
          level: body.level,
          restSeconds: body.restSeconds,
          publishStatus: body.publishStatus,
          videoUrl: body.videoUrl || null,
          images: this._normalizeImages(body.images),
          explanationSteps: this._toStepModel(body.explanationSteps),
          linkedEquipmentIds: body.linkedEquipmentIds,
          relatedExerciseIds: body.relatedExerciseIds,
          enabledTagIds: body.enabledTagIds,
          updatedAt,
          updatedBy: '本部 花子',
        };
      },

      _findActiveById(id: string) {
        return this._rows.find((record) => record.id === id && record.deletedAt === null);
      },

      _findActiveIndexById(id: string) {
        return this._rows.findIndex((record) => record.id === id && record.deletedAt === null);
      },

      isBodyweightTool(toolId: string) {
        this._seed();
        return this._getMasterCode('tool', toolId) === 'none';
      },

      validateUpsertBody(body: UpsertExerciseBody) {
        this._seed();
        if (this.isBodyweightTool(body.toolId) && body.linkedEquipmentIds.length > 0) {
          return '器具種別が「なし（自重）」の場合は機材を紐づけできません';
        }
        return null;
      },

      getAll(): ExerciseDetail[] {
        this._seed();
        return this._rows
          .filter((record) => record.deletedAt === null)
          .map((record) => this._toDetail(record));
      },

      list(query: GetExercisesQuery): GetExercisesResponse {
        this._seed();
        let rows = this._rows.filter((record) => record.deletedAt === null);

        if (query.search) {
          const term = query.search.toLowerCase().trim();
          rows = rows.filter(
            (row) =>
              row.nameJa.toLowerCase().includes(term) || row.nameEn?.toLowerCase().includes(term),
          );
        }

        if (query.categoryId) rows = rows.filter((row) => row.categoryId === query.categoryId);
        if (query.primaryMuscleId) {
          rows = rows.filter((row) => row.primaryMuscleId === query.primaryMuscleId);
        }
        if (query.toolId) rows = rows.filter((row) => row.toolId === query.toolId);
        if (query.level) rows = rows.filter((row) => row.level === query.level);
        if (query.publishStatus) {
          rows = rows.filter((row) => row.publishStatus === query.publishStatus);
        }

        rows = [...rows].sort((a, b) => {
          const direction = query.sortOrder === 'asc' ? 1 : -1;
          if (query.sortBy === 'updatedAt') {
            return a.updatedAt.localeCompare(b.updatedAt) * direction;
          }
          if (query.sortBy === 'publishStatus') {
            return a.publishStatus.localeCompare(b.publishStatus) * direction;
          }
          return a.nameJa.localeCompare(b.nameJa, 'ja') * direction;
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
          },
        };
      },

      getById(id: string) {
        this._seed();
        const row = this._findActiveById(id);
        return row ? this._toDetail(row) : undefined;
      },

      create(body: UpsertExerciseBody): CreateExerciseResponse {
        this._seed();
        const nextNumber = this._rows.length + 42;
        const timestamp = new Date().toISOString();
        const id = `EX-${String(nextNumber).padStart(3, '0')}`;
        const record = this._applyBody(
          {
            id,
            exerciseCode: `EX-${String(nextNumber).padStart(5, '0')}`,
            nameJa: '',
            nameEn: null,
            overviewJa: null,
            overviewEn: null,
            categoryId: body.categoryId,
            primaryMuscleId: body.primaryMuscleId,
            secondaryMuscleIds: [],
            toolId: body.toolId,
            exerciseTypeId: body.exerciseTypeId,
            handUsage: body.handUsage,
            level: body.level,
            restSeconds: 90,
            publishStatus: 'private',
            updatedAt: timestamp,
            updatedBy: '本部 花子',
            videoUrl: null,
            images: [],
            explanationSteps: [],
            linkedEquipmentIds: [],
            relatedExerciseIds: [],
            enabledTagIds: [],
            deletedAt: null,
            routineUsageCount: 0,
          },
          body,
        );

        this._rows.unshift(record);

        return {
          message: 'エクササイズを登録しました',
          exercise: this._toDetail(record),
        };
      },

      update(id: string, body: UpsertExerciseBody): UpdateExerciseResponse | undefined {
        this._seed();
        const index = this._findActiveIndexById(id);
        if (index === -1) return undefined;

        this._rows[index] = this._applyBody(this._rows[index]!, body);

        return {
          message: 'エクササイズを更新しました',
          exercise: this._toDetail(this._rows[index]!),
        };
      },

      updatePublishStatus(
        id: string,
        body: UpdateExercisePublishStatusBody,
      ): UpdateExercisePublishStatusResponse | undefined {
        this._seed();
        const index = this._findActiveIndexById(id);
        if (index === -1) return undefined;
        const updatedAt = new Date().toISOString();

        this._rows[index] = {
          ...this._rows[index]!,
          publishStatus: body.publishStatus,
          updatedAt,
          updatedBy: '本部 花子',
        };

        const detail = this._toDetail(this._rows[index]!);

        return {
          message: 'ステータスを更新しました',
          exercise: detail,
          incompleteStepWarning:
            body.publishStatus === 'public' &&
            detail.explanationSteps.some((step) => step.textJa.trim().length === 0),
        };
      },

      delete(id: string) {
        this._seed();
        const index = this._findActiveIndexById(id);
        if (index === -1) return undefined;

        const result = this._canDelete(this._rows[index]!);

        if (!result.canDelete) {
          return {
            ok: false as const,
            error:
              result.blockReason === 'public'
                ? '公開中のエクササイズは削除できません。先に非公開に変更してください。'
                : '使用中のため削除できません',
            blockReason: result.blockReason!,
          };
        }

        const timestamp = new Date().toISOString();

        this._rows[index] = {
          ...this._rows[index]!,
          deletedAt: timestamp,
          updatedAt: timestamp,
          updatedBy: '本部 花子',
        };

        return { ok: true as const };
      },
    },
  };
}
