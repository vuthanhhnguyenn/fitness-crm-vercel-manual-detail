import type {
  TrainingEquipmentExerciseLink,
  TrainingEquipmentItem,
  TrainingEquipmentStatusHistory,
  TrainingEquipmentToolType,
} from '@/app/api/_schemas/training-equipment.schema';

import type {
  TrainingEquipmentExerciseCatalogItem,
  TrainingEquipmentMockItem,
} from '../seeds/training-equipment.seed';

export type TrainingEquipmentType = {
  _rows: TrainingEquipmentMockItem[];
  _historyRows: TrainingEquipmentStatusHistory[];
  _linkRows: TrainingEquipmentExerciseLink[];
  _seeded: boolean;
  _seed(): void;
  getAll(): TrainingEquipmentMockItem[];
  getById(id: string): TrainingEquipmentMockItem | undefined;
  create(
    item: Omit<
      TrainingEquipmentMockItem,
      'id' | 'linked_exercise_count' | 'last_updated_at' | 'is_deleted'
    >,
  ): TrainingEquipmentMockItem;
  update(
    id: string,
    patch: Partial<TrainingEquipmentMockItem>,
  ): TrainingEquipmentMockItem | undefined;
  softDelete(id: string): boolean;
  getHistory(equipmentId: string): TrainingEquipmentStatusHistory[];
  appendHistory(row: TrainingEquipmentStatusHistory): void;
  getLinks(equipmentId: string): TrainingEquipmentExerciseLink[];
  addLinks(rows: TrainingEquipmentExerciseLink[]): void;
  deleteLink(equipmentId: string, exerciseId: string): boolean;
  hasLinks(equipmentId: string): boolean;
  refreshLinkCount(equipmentId: string): void;
  deleteAllLinks(equipmentId: string): number;
  getExerciseCatalogItem(exerciseId: string): TrainingEquipmentExerciseCatalogItem | undefined;
  listExerciseCatalog(): Array<{
    id: string;
    name: string;
    tool_type: TrainingEquipmentToolType;
    tool_name: string;
    difficulty: string;
    body_part: string;
  }>;
  bulkUpdateStatus(
    ids: string[],
    nextStatus: TrainingEquipmentItem['status'],
    changedBy: string,
    reason: string,
  ): Array<{
    id: string;
    success: boolean;
    status?: TrainingEquipmentItem['status'];
    error?: string;
  }>;
};
