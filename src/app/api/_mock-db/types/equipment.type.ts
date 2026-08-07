import type {
  ConnectedEquipmentDetail,
  ConnectedEquipmentListItem,
  EquipmentStatusHistoryItem,
  PatchEquipmentRequest,
  UpsertEquipmentRequest,
} from '@/app/api/_schemas/equipment.schema';

import type { EquipmentMeta } from '../seeds/equipment.seed';

export type EquipmentType = {
  _rows: ConnectedEquipmentListItem[];
  _historyByEquipmentId: Record<string, EquipmentStatusHistoryItem[]>;
  _metaById: Record<string, EquipmentMeta>;
  _seeded: boolean;
  _seed(): void;
  getAll(): ConnectedEquipmentListItem[];
  getById(id: string): ConnectedEquipmentListItem | undefined;
  getDetailById(id: string): ConnectedEquipmentDetail | undefined;
  getHistory(id: string): EquipmentStatusHistoryItem[];
  create(input: UpsertEquipmentRequest): ConnectedEquipmentDetail;
  update(id: string, input: PatchEquipmentRequest): ConnectedEquipmentDetail | undefined;
  delete(id: string): boolean;
  bulkUpdateStatus(
    ids: string[],
    status: ConnectedEquipmentListItem['status'],
  ): Array<{
    id: string;
    success: boolean;
    status?: ConnectedEquipmentListItem['status'];
    error?: string;
  }>;
};
