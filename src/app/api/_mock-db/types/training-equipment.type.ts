import type {
  InstallationStatus,
  TrainingEquipmentLinkedExercise,
} from '@/app/api/_schemas/training-equipment.schema';

import type {
  TrainingEquipmentExerciseCatalogItem,
  TrainingEquipmentExerciseLinkRow,
  TrainingEquipmentMockItem,
  TrainingEquipmentStatusHistoryRow,
} from '../seeds/training-equipment.seed';

export type TrainingEquipmentType = {
  _rows: TrainingEquipmentMockItem[];
  _historyRows: TrainingEquipmentStatusHistoryRow[];
  _linkRows: TrainingEquipmentExerciseLinkRow[];
  _seeded: boolean;
  _seed(): void;
  getAll(): TrainingEquipmentMockItem[];
  getById(id: string): TrainingEquipmentMockItem | undefined;
  create(
    item: Omit<
      TrainingEquipmentMockItem,
      'id' | 'createdAt' | 'updatedAt' | 'statusChangedAt' | 'isDeleted'
    >,
  ): TrainingEquipmentMockItem;
  update(
    id: string,
    patch: Partial<TrainingEquipmentMockItem>,
  ): TrainingEquipmentMockItem | undefined;
  softDelete(id: string): boolean;
  changeStatus(
    id: string,
    newStatus: InstallationStatus,
    changedByName: string,
    changedReason: string,
  ): TrainingEquipmentMockItem | undefined;
  getHistory(equipmentId: string): TrainingEquipmentStatusHistoryRow[];
  appendHistory(row: TrainingEquipmentStatusHistoryRow): void;
  getLinks(equipmentId: string): TrainingEquipmentLinkedExercise[];
  addLinks(equipmentId: string, exerciseIds: string[]): void;
  deleteLink(equipmentId: string, exerciseId: string): boolean;
  deleteAllLinks(equipmentId: string): number;
  hasLinks(equipmentId: string): boolean;
  countLinks(equipmentId: string): number;
  getExerciseCandidate(exerciseId: string): TrainingEquipmentExerciseCatalogItem | undefined;
  listExerciseCandidates(): Array<TrainingEquipmentExerciseCatalogItem & { toolName: string }>;
  bulkChangeStatus(
    equipmentIds: string[],
    newStatus: InstallationStatus,
    changedByName: string,
    changedReason: string,
  ): { updated: number; skipped: number };
};
