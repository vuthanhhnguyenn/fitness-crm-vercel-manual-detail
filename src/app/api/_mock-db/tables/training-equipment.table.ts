import type {
  ToolType,
  TrainingEquipmentExerciseLink,
  TrainingEquipmentStatusHistory,
} from '@/app/api/_schemas/training-equipment.schema';

import type { DbType } from '../_db.types';
import {
  SEED_TOOL_TYPES,
  SEED_TRAINING_EQUIPMENT,
  SEED_TRAINING_EQUIPMENT_HISTORY,
  SEED_TRAINING_EQUIPMENT_LINKS,
  TRAINING_EQUIPMENT_EXERCISE_CATALOG,
  type ToolTypeMockRow,
  type TrainingEquipmentMockItem,
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
            if (!includeInactive && (!row.is_active || row.deleted_at !== null)) {
              return false;
            }
            if (!includeNone && row.code === 'none') {
              return false;
            }
            return true;
          })
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((row) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            sortOrder: row.sort_order,
          }));
      },
      getByCode(code: string): ToolTypeMockRow | undefined {
        this._seed();
        return this._rows.find((row) => row.code === code);
      },
    },

    trainingEquipment: {
      _rows: [] as TrainingEquipmentMockItem[],
      _historyRows: [] as TrainingEquipmentStatusHistory[],
      _linkRows: [] as TrainingEquipmentExerciseLink[],
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
        return [...this._rows];
      },
      getById(id: string): TrainingEquipmentMockItem | undefined {
        this._seed();
        return this._rows.find((item) => item.id === id && !item.is_deleted);
      },
      create(
        item: Omit<
          TrainingEquipmentMockItem,
          'id' | 'linked_exercise_count' | 'last_updated_at' | 'is_deleted'
        >,
      ): TrainingEquipmentMockItem {
        this._seed();
        const nextNumber = this._rows.length + 1;
        const next: TrainingEquipmentMockItem = {
          ...item,
          id: `TE-${String(nextNumber).padStart(3, '0')}`,
          linked_exercise_count: 0,
          last_updated_at: new Date().toISOString(),
          is_deleted: false,
        };
        this._rows.push(next);
        return next;
      },
      update(
        id: string,
        patch: Partial<TrainingEquipmentMockItem>,
      ): TrainingEquipmentMockItem | undefined {
        this._seed();
        const index = this._rows.findIndex((item) => item.id === id && !item.is_deleted);
        if (index === -1) return undefined;
        const next = {
          ...this._rows[index],
          ...patch,
          last_updated_at: new Date().toISOString(),
        };
        this._rows[index] = next;
        return next;
      },
      softDelete(id: string): boolean {
        this._seed();
        const index = this._rows.findIndex((item) => item.id === id && !item.is_deleted);
        if (index === -1) return false;
        this._rows[index].is_deleted = true;
        this._rows[index].last_updated_at = new Date().toISOString();
        return true;
      },
      getHistory(equipmentId: string): TrainingEquipmentStatusHistory[] {
        this._seed();
        return this._historyRows.filter((row) => row.equipment_id === equipmentId);
      },
      appendHistory(row: TrainingEquipmentStatusHistory): void {
        this._seed();
        this._historyRows.unshift(row);
      },
      getLinks(equipmentId: string): TrainingEquipmentExerciseLink[] {
        this._seed();
        return this._linkRows.filter((row) => row.equipment_id === equipmentId);
      },
      addLinks(rows: TrainingEquipmentExerciseLink[]): void {
        this._seed();
        this._linkRows.push(...rows);
      },
      deleteLink(equipmentId: string, exerciseId: string): boolean {
        this._seed();
        const index = this._linkRows.findIndex(
          (row) => row.equipment_id === equipmentId && row.exercise_id === exerciseId,
        );
        if (index === -1) return false;
        this._linkRows.splice(index, 1);
        return true;
      },
      deleteAllLinks(equipmentId: string): number {
        this._seed();
        const before = this._linkRows.length;
        this._linkRows = this._linkRows.filter((row) => row.equipment_id !== equipmentId);
        return before - this._linkRows.length;
      },
      hasLinks(equipmentId: string): boolean {
        this._seed();
        return this._linkRows.some((row) => row.equipment_id === equipmentId);
      },
      refreshLinkCount(equipmentId: string): void {
        this._seed();
        const row = this._rows.find((item) => item.id === equipmentId && !item.is_deleted);
        if (!row) return;
        row.linked_exercise_count = this._linkRows.filter(
          (item) => item.equipment_id === equipmentId,
        ).length;
      },
      getExerciseCatalogItem(exerciseId: string) {
        return TRAINING_EQUIPMENT_EXERCISE_CATALOG.find((item) => item.id === exerciseId);
      },
      listExerciseCatalog() {
        return TRAINING_EQUIPMENT_EXERCISE_CATALOG.map((item) => ({
          ...item,
          tool_name: getDb().toolTypes.getByCode(item.tool_type)?.name ?? item.tool_type,
        }));
      },
      bulkUpdateStatus(
        ids: string[],
        nextStatus: TrainingEquipmentMockItem['status'],
        changedBy: string,
        reason: string,
      ) {
        this._seed();
        const uniqueIds = [...new Set(ids)];
        const now = new Date().toISOString();

        return uniqueIds.map((id) => {
          const current = this._rows.find((item) => item.id === id && !item.is_deleted);
          if (!current) {
            return { id, success: false, error: 'Training equipment not found' };
          }

          if (current.status === nextStatus) {
            return { id, success: true, status: nextStatus };
          }

          const index = this._rows.findIndex((item) => item.id === id && !item.is_deleted);
          this._rows[index] = {
            ...this._rows[index],
            status: nextStatus,
            last_updated_at: now,
            last_updated_by: changedBy,
          };

          this.appendHistory({
            id: `TH-${Date.now()}-${id}`,
            equipment_id: id,
            changed_at: now,
            changed_by: changedBy,
            from_status: current.status,
            to_status: nextStatus,
            reason,
          });

          return { id, success: true, status: nextStatus };
        });
      },
    },
  };
}
