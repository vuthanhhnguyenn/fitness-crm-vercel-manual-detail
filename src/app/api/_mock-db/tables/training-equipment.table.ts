import type {
  InstallationStatus,
  ToolType,
  TrainingEquipmentLinkedExercise,
} from '@/app/api/_schemas/training-equipment.schema';

import type { DbType } from '../_db.types';
import {
  SEED_TOOL_TYPES,
  SEED_TRAINING_EQUIPMENT,
  SEED_TRAINING_EQUIPMENT_HISTORY,
  SEED_TRAINING_EQUIPMENT_LINKS,
  TRAINING_EQUIPMENT_EXERCISE_CATALOG,
  type ToolTypeMockRow,
  type TrainingEquipmentExerciseCatalogItem,
  type TrainingEquipmentExerciseLinkRow,
  type TrainingEquipmentMockItem,
  type TrainingEquipmentStatusHistoryRow,
} from '../seeds/training-equipment.seed';

export function createTrainingEquipmentTables(getDb: () => DbType) {
  return {
    toolTypes: {
      _rows: [] as ToolTypeMockRow[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = SEED_TOOL_TYPES.map((row) => ({ ...row }));
      },
      list(options?: { includeNone?: boolean; includeInactive?: boolean }): ToolType[] {
        this._seed();
        const includeNone = options?.includeNone ?? false;
        const includeInactive = options?.includeInactive ?? false;

        return this._rows
          .filter((row) => {
            if (!includeInactive && (!row.isActive || row.deletedAt !== null)) {
              return false;
            }
            if (!includeNone && row.code === 'none') {
              return false;
            }
            return true;
          })
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((row) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            sortOrder: row.sortOrder,
          }));
      },
      getById(id: string): ToolTypeMockRow | undefined {
        this._seed();
        return this._rows.find((row) => row.id === id);
      },
      getByCode(code: string): ToolTypeMockRow | undefined {
        this._seed();
        return this._rows.find((row) => row.code === code);
      },
    },

    trainingEquipment: {
      _rows: [] as TrainingEquipmentMockItem[],
      _historyRows: [] as TrainingEquipmentStatusHistoryRow[],
      _linkRows: [] as TrainingEquipmentExerciseLinkRow[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = SEED_TRAINING_EQUIPMENT.map((row) => ({ ...row }));
        this._historyRows = SEED_TRAINING_EQUIPMENT_HISTORY.map((row) => ({ ...row }));
        this._linkRows = SEED_TRAINING_EQUIPMENT_LINKS.map((row) => ({ ...row }));
      },
      getAll(): TrainingEquipmentMockItem[] {
        this._seed();
        return this._rows.filter((item) => !item.isDeleted);
      },
      getById(id: string): TrainingEquipmentMockItem | undefined {
        this._seed();
        return this._rows.find((item) => item.id === id && !item.isDeleted);
      },
      create(
        item: Omit<
          TrainingEquipmentMockItem,
          'id' | 'createdAt' | 'updatedAt' | 'statusChangedAt' | 'isDeleted'
        >,
      ): TrainingEquipmentMockItem {
        this._seed();
        const now = new Date().toISOString();
        const nextNumber =
          this._rows.reduce((max, row) => {
            const parsed = Number(row.id.replace('TE-', ''));
            return Number.isNaN(parsed) ? max : Math.max(max, parsed);
          }, 0) + 1;
        const next: TrainingEquipmentMockItem = {
          ...item,
          id: `TE-${String(nextNumber).padStart(3, '0')}`,
          statusChangedAt: now,
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        };
        this._rows.push(next);
        // Status history has a NOT NULL `changedReason`, so the system fills the initial
        // registration row with 「新規登録」 — the first history row is never blank.
        this.appendHistory({
          id: `TH-${next.id}-000`,
          equipmentId: next.id,
          previousStatus: null,
          newStatus: next.installationStatus,
          changedReason: '新規登録',
          changedByName: next.statusChangedByName,
          changedAt: now,
        });
        return next;
      },
      update(
        id: string,
        patch: Partial<TrainingEquipmentMockItem>,
      ): TrainingEquipmentMockItem | undefined {
        this._seed();
        const index = this._rows.findIndex((item) => item.id === id && !item.isDeleted);
        if (index === -1) return undefined;
        const next = { ...this._rows[index], ...patch, updatedAt: new Date().toISOString() };
        this._rows[index] = next;
        return next;
      },
      softDelete(id: string): boolean {
        this._seed();
        const index = this._rows.findIndex((item) => item.id === id && !item.isDeleted);
        if (index === -1) return false;
        this._rows[index].isDeleted = true;
        this._rows[index].updatedAt = new Date().toISOString();
        return true;
      },
      /**
       * FR-007: records the transition and refreshes the FR-004 status card.
       * Changing to the same installation status is not a transition, so neither the history nor
       * the status card is updated (the same treatment as `skipped` in the bulk update).
       */
      changeStatus(
        id: string,
        newStatus: InstallationStatus,
        changedByName: string,
        changedReason: string,
      ): TrainingEquipmentMockItem | undefined {
        this._seed();
        const current = this.getById(id);
        if (!current) return undefined;
        if (current.installationStatus === newStatus) return current;
        const now = new Date().toISOString();
        const next = this.update(id, {
          installationStatus: newStatus,
          statusChangedAt: now,
          statusChangedByName: changedByName,
        });
        if (!next) return undefined;
        this.appendHistory({
          id: `TH-${Date.now()}-${id}`,
          equipmentId: id,
          previousStatus: current.installationStatus,
          newStatus,
          changedReason,
          changedByName,
          changedAt: now,
        });
        return next;
      },
      getHistory(equipmentId: string): TrainingEquipmentStatusHistoryRow[] {
        this._seed();
        return this._historyRows.filter((row) => row.equipmentId === equipmentId);
      },
      appendHistory(row: TrainingEquipmentStatusHistoryRow): void {
        this._seed();
        this._historyRows.unshift(row);
      },
      /** Resolves join rows into the FR-008 linked-exercise payload. */
      getLinks(equipmentId: string): TrainingEquipmentLinkedExercise[] {
        this._seed();
        return this._linkRows
          .filter((row) => row.equipmentId === equipmentId)
          .map((row) => {
            const candidate = this.getExerciseCandidate(row.exerciseId);
            const mstToolId = candidate?.mstToolId ?? '';
            return {
              exerciseId: row.exerciseId,
              exerciseCode: candidate?.exerciseCode ?? row.exerciseId,
              name: candidate?.name ?? row.exerciseId,
              mstToolId,
              toolName: getDb().toolTypes.getById(mstToolId)?.name ?? '',
              difficulty: candidate?.difficulty ?? null,
              bodyPart: candidate?.bodyPart ?? null,
            };
          });
      },
      addLinks(equipmentId: string, exerciseIds: string[]): void {
        this._seed();
        const now = new Date().toISOString();
        const existing = new Set(
          this._linkRows
            .filter((row) => row.equipmentId === equipmentId)
            .map((row) => row.exerciseId),
        );
        exerciseIds
          .filter((exerciseId) => !existing.has(exerciseId))
          .forEach((exerciseId) => {
            this._linkRows.push({ equipmentId, exerciseId, createdAt: now });
          });
      },
      deleteLink(equipmentId: string, exerciseId: string): boolean {
        this._seed();
        const index = this._linkRows.findIndex(
          (row) => row.equipmentId === equipmentId && row.exerciseId === exerciseId,
        );
        if (index === -1) return false;
        this._linkRows.splice(index, 1);
        return true;
      },
      deleteAllLinks(equipmentId: string): number {
        this._seed();
        const before = this._linkRows.length;
        this._linkRows = this._linkRows.filter((row) => row.equipmentId !== equipmentId);
        return before - this._linkRows.length;
      },
      hasLinks(equipmentId: string): boolean {
        this._seed();
        return this._linkRows.some((row) => row.equipmentId === equipmentId);
      },
      countLinks(equipmentId: string): number {
        this._seed();
        return this._linkRows.filter((row) => row.equipmentId === equipmentId).length;
      },
      getExerciseCandidate(exerciseId: string): TrainingEquipmentExerciseCatalogItem | undefined {
        return TRAINING_EQUIPMENT_EXERCISE_CATALOG.find((item) => item.exerciseId === exerciseId);
      },
      listExerciseCandidates() {
        return TRAINING_EQUIPMENT_EXERCISE_CATALOG.map((item) => ({
          ...item,
          toolName: getDb().toolTypes.getById(item.mstToolId)?.name ?? '',
        }));
      },
      /** FR-009: returns the doc-shaped `{ updated, skipped }` counters. */
      bulkChangeStatus(
        equipmentIds: string[],
        newStatus: InstallationStatus,
        changedByName: string,
        changedReason: string,
      ): { updated: number; skipped: number } {
        this._seed();
        let updated = 0;
        let skipped = 0;

        [...new Set(equipmentIds)].forEach((id) => {
          const current = this.getById(id);
          if (!current || current.installationStatus === newStatus) {
            skipped += 1;
            return;
          }
          this.changeStatus(id, newStatus, changedByName, changedReason);
          updated += 1;
        });

        return { updated, skipped };
      },
    },
  };
}
