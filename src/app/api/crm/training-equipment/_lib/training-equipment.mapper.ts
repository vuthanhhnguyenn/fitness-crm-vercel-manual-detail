import { db } from '@/app/api/_mock-db';
import type {
  TrainingEquipmentMockItem,
  TrainingEquipmentStatusHistoryRow,
} from '@/app/api/_mock-db/seeds/training-equipment.seed';
import type {
  ExportTrainingEquipmentQuery,
  InstallationStatus,
  ListTrainingEquipmentQuery,
  LocationInGym,
  TrainingEquipmentDetail,
  TrainingEquipmentListItem,
  TrainingEquipmentStatusHistoryItem,
  TrainingEquipmentToolType,
} from '@/app/api/_schemas/training-equipment.schema';

import type { StoreScope } from './training-equipment.scope';

export const INSTALLATION_STATUS_LABELS: Record<InstallationStatus, string> = {
  installed: '設置中',
  maintenance: 'メンテナンス中',
  removed: '撤去済み',
  discarded: '廃棄',
};

export const LOCATION_IN_GYM_LABELS: Record<LocationInGym, string> = {
  aerobic_area: '有酸素エリア',
  machine_area: 'マシンエリア',
  free_weight_area: 'フリーウェイトエリア',
  stretch_area: 'ストレッチエリア',
};

/**
 * The two enum columns sort by **enum declaration order**, not by label.
 * Rows with no installation area (null) always come last.
 */
const LOCATION_IN_GYM_ORDER = Object.keys(LOCATION_IN_GYM_LABELS) as LocationInGym[];
const INSTALLATION_STATUS_ORDER = Object.keys(INSTALLATION_STATUS_LABELS) as InstallationStatus[];

function toolOf(mstToolId: string) {
  return db.toolTypes.getById(mstToolId);
}

/**
 * Store display code (`stores.store_id`). Always returned — even when `storeId` was given — so a
 * row can be identified by store in the cross-store view.
 */
function storeCodeOf(storeId: string): string {
  return db.stores.getList().find((store) => store.id === storeId)?.store_id ?? '';
}

export function toListItem(row: TrainingEquipmentMockItem): TrainingEquipmentListItem {
  return {
    id: row.id,
    name: row.name,
    mstToolId: row.mstToolId,
    toolName: toolOf(row.mstToolId)?.name ?? '',
    quantity: row.quantity,
    locationInGym: row.locationInGym,
    installationStatus: row.installationStatus,
    manufacturer: row.manufacturer,
    model: row.model,
    linkedExerciseCount: db.trainingEquipment.countLinks(row.id),
    storeId: row.storeId,
    storeCode: storeCodeOf(row.storeId),
    storeName: row.storeName,
    updatedAt: row.updatedAt,
  };
}

export function toDetail(row: TrainingEquipmentMockItem): TrainingEquipmentDetail {
  const tool = toolOf(row.mstToolId);
  return {
    id: row.id,
    storeId: row.storeId,
    storeCode: storeCodeOf(row.storeId),
    storeName: row.storeName,
    name: row.name,
    mstToolId: row.mstToolId,
    toolCode: (tool?.code ?? 'other') as TrainingEquipmentToolType,
    toolName: tool?.name ?? '',
    quantity: row.quantity,
    installationStatus: row.installationStatus,
    locationInGym: row.locationInGym,
    manufacturer: row.manufacturer,
    model: row.model,
    installedOn: row.installedOn,
    note: row.note,
    linkedExercises: db.trainingEquipment.getLinks(row.id),
    statusCard: {
      installationStatus: row.installationStatus,
      lastChangedAt: row.statusChangedAt,
      lastChangedByName: row.statusChangedByName,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toHistoryItem(
  row: TrainingEquipmentStatusHistoryRow,
): TrainingEquipmentStatusHistoryItem {
  return {
    id: row.id,
    previousStatus: row.previousStatus,
    newStatus: row.newStatus,
    changedReason: row.changedReason,
    changedByName: row.changedByName,
    changedAt: row.changedAt,
  };
}

type EquipmentFilterQuery = Partial<
  Pick<
    ListTrainingEquipmentQuery,
    'keyword' | 'mstToolId' | 'locationInGym' | 'installationStatus' | 'includeDiscarded'
  >
>;

/** Narrows rows by store scope (the result of `resolveStoreScope`). `null` means every store. */
export function applyStoreScope(
  rows: TrainingEquipmentMockItem[],
  scope: StoreScope,
): TrainingEquipmentMockItem[] {
  return scope === null ? rows : rows.filter((item) => scope.includes(item.storeId));
}

/**
 * FR-002 filters, AND-combined. `includeDiscarded=false` hides `discarded` rows
 * unless the caller asks for that status explicitly (FR-001 default visibility).
 * Store scoping is handled by `applyStoreScope`.
 */
export function applyFilters(
  rows: TrainingEquipmentMockItem[],
  query: EquipmentFilterQuery,
): TrainingEquipmentMockItem[] {
  let items = rows;

  // Partial match on the equipment name only; installation area is an enum, narrowed by the `locationInGym` filter.
  if (query.keyword) {
    const needle = query.keyword.trim().toLowerCase();
    items = items.filter((item) => item.name.toLowerCase().includes(needle));
  }
  if (query.mstToolId) {
    items = items.filter((item) => item.mstToolId === query.mstToolId);
  }
  if (query.locationInGym) {
    items = items.filter((item) => item.locationInGym === query.locationInGym);
  }
  if (query.installationStatus) {
    items = items.filter((item) => item.installationStatus === query.installationStatus);
  } else if (!query.includeDiscarded) {
    items = items.filter((item) => item.installationStatus !== 'discarded');
  }

  return items;
}

/**
 * FR-016: default ordering is the API's responsibility — tool type (mst_tools.sortOrder)
 * then equipment name ascending. The secondary key stays ascending regardless of `order`.
 */
export function applySort(
  rows: TrainingEquipmentMockItem[],
  sort: ListTrainingEquipmentQuery['sort'],
  order: ListTrainingEquipmentQuery['order'],
): TrainingEquipmentMockItem[] {
  const direction = order === 'desc' ? -1 : 1;
  const byName = (left: TrainingEquipmentMockItem, right: TrainingEquipmentMockItem) =>
    left.name.localeCompare(right.name, 'ja');

  return [...rows].sort((left, right) => {
    switch (sort) {
      case 'toolType': {
        const leftOrder = toolOf(left.mstToolId)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = toolOf(right.mstToolId)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) return (leftOrder - rightOrder) * direction;
        return byName(left, right);
      }
      case 'name':
        return byName(left, right) * direction;
      case 'updatedAt':
        return left.updatedAt.localeCompare(right.updatedAt) * direction;
      case 'locationInGym': {
        const rank = (value: LocationInGym | null) =>
          value ? LOCATION_IN_GYM_ORDER.indexOf(value) : LOCATION_IN_GYM_ORDER.length;
        const gap = rank(left.locationInGym) - rank(right.locationInGym);
        return gap !== 0 ? gap * direction : byName(left, right);
      }
      case 'installationStatus': {
        const gap =
          INSTALLATION_STATUS_ORDER.indexOf(left.installationStatus) -
          INSTALLATION_STATUS_ORDER.indexOf(right.installationStatus);
        return gap !== 0 ? gap * direction : byName(left, right);
      }
      case 'id':
      default:
        return left.id.localeCompare(right.id) * direction;
    }
  });
}

export function filterAndSort(
  query: ExportTrainingEquipmentQuery,
  scope: StoreScope,
): TrainingEquipmentMockItem[] {
  const scoped = applyStoreScope(db.trainingEquipment.getAll(), scope);
  return applySort(applyFilters(scoped, query), query.sort, query.order);
}
