import { buildAppMaintenanceSeed } from '@/app/api/_mock-db/seeds/app-maintenance.seed';
import type {
  AppMaintenanceDeleteResult,
  AppMaintenanceUpdateResult,
  AppMaintenancesType,
} from '@/app/api/_mock-db/types/app-maintenances.type';
import type {
  AppMaintenance,
  AppMaintenanceDetailResponse,
  AppMaintenanceItemResponse,
  AppMaintenanceStatus,
  CreateAppMaintenanceBody,
  GetAppMaintenancesQuery,
  UpdateAppMaintenanceBody,
} from '@/app/api/_schemas/app-maintenance.schema';

/** Mirrors `banner.table.ts`'s `computeStatus` — never stored, always derived from `now()`. */
export function computeStatus(startsAt: string, endsAt: string): AppMaintenanceStatus {
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();

  if (now < start) return 'planned';
  if (now > end) return 'completed';
  return 'in_progress';
}

export function toAppMaintenanceItemResponse(row: AppMaintenance): AppMaintenanceItemResponse {
  return {
    id: row.id,
    targetBrand: row.target_brand,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    message: row.message,
    status: computeStatus(row.starts_at, row.ends_at),
    createdAt: row.created_at,
  };
}

export function toAppMaintenanceDetailResponse(row: AppMaintenance): AppMaintenanceDetailResponse {
  return {
    ...toAppMaintenanceItemResponse(row),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

/** Half-open interval overlap: `[aStart, aEnd)` intersects `[bStart, bEnd)`. */
function periodsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

function hasBrandOverlap(
  rows: AppMaintenance[],
  targetBrand: string,
  startsAt: string,
  endsAt: string,
  excludeId?: string,
): boolean {
  return rows.some(
    (row) =>
      row.id !== excludeId &&
      row.target_brand === targetBrand &&
      periodsOverlap(startsAt, endsAt, row.starts_at, row.ends_at),
  );
}

export function createAppMaintenanceTables() {
  return {
    appMaintenances: {
      _rows: [] as AppMaintenance[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = buildAppMaintenanceSeed();
      },
      list(query: GetAppMaintenancesQuery): {
        rows: AppMaintenance[];
        total: number;
        totalAll: number;
      } {
        this._seed();

        const totalAll = this._rows.length;
        let rows = [...this._rows];

        if (query.search) {
          const normalized = query.search.toLowerCase().trim();
          rows = rows.filter(
            (row) =>
              row.id.toLowerCase().includes(normalized) ||
              row.message.toLowerCase().includes(normalized),
          );
        }

        if (query.brand) {
          rows = rows.filter((row) => row.target_brand === query.brand);
        }

        if (query.status) {
          rows = rows.filter((row) => computeStatus(row.starts_at, row.ends_at) === query.status);
        }

        const sortField = query.sort === 'startsAt' ? 'starts_at' : 'ends_at';
        rows.sort((left, right) => {
          const leftValue = new Date(left[sortField]).getTime();
          const rightValue = new Date(right[sortField]).getTime();
          const comparison = leftValue - rightValue;
          return query.order === 'asc' ? comparison : -comparison;
        });

        const total = rows.length;
        const start = (query.page - 1) * query.limit;
        return { rows: rows.slice(start, start + query.limit), total, totalAll };
      },
      getById(id: string): AppMaintenance | undefined {
        this._seed();
        return this._rows.find((row) => row.id === id);
      },
      create(
        data: CreateAppMaintenanceBody,
        createdBy: string,
      ): AppMaintenance | 'period_conflict' {
        this._seed();

        if (hasBrandOverlap(this._rows, data.targetBrand, data.startsAt, data.endsAt)) {
          return 'period_conflict';
        }

        const ids = this._rows
          .map((row) => Number.parseInt(row.id.replace('AM-', ''), 10))
          .filter((n) => !Number.isNaN(n));
        const nextNumber = ids.length > 0 ? Math.max(...ids) + 1 : 1;
        const now = new Date().toISOString();

        const row: AppMaintenance = {
          id: `AM-${String(nextNumber).padStart(3, '0')}`,
          target_brand: data.targetBrand,
          starts_at: data.startsAt,
          ends_at: data.endsAt,
          message: data.message,
          created_by: createdBy,
          updated_by: null,
          created_at: now,
          updated_at: null,
        };
        this._rows.push(row);
        return row;
      },
      update(
        id: string,
        data: UpdateAppMaintenanceBody,
        updatedBy: string,
      ): AppMaintenanceUpdateResult {
        this._seed();

        const index = this._rows.findIndex((row) => row.id === id);
        if (index === -1) return 'not_found';

        const existing = this._rows[index];
        const currentStatus = computeStatus(existing.starts_at, existing.ends_at);

        if (data.startsAt !== undefined && currentStatus === 'in_progress') {
          return 'start_locked';
        }

        const effectiveBrand = data.targetBrand ?? existing.target_brand;
        const effectiveStartsAt = data.startsAt ?? existing.starts_at;
        const effectiveEndsAt = data.endsAt ?? existing.ends_at;

        if (new Date(effectiveEndsAt) <= new Date(effectiveStartsAt)) {
          return 'invalid_period';
        }

        if (hasBrandOverlap(this._rows, effectiveBrand, effectiveStartsAt, effectiveEndsAt, id)) {
          return 'period_conflict';
        }

        const updated: AppMaintenance = {
          ...existing,
          target_brand: effectiveBrand,
          starts_at: effectiveStartsAt,
          ends_at: effectiveEndsAt,
          message: data.message ?? existing.message,
          updated_by: updatedBy,
          updated_at: new Date().toISOString(),
        };
        this._rows[index] = updated;
        return updated;
      },
      delete(id: string): AppMaintenanceDeleteResult {
        this._seed();

        const index = this._rows.findIndex((row) => row.id === id);
        if (index === -1) return 'not_found';

        const existing = this._rows[index];
        if (computeStatus(existing.starts_at, existing.ends_at) === 'in_progress') {
          return 'in_progress_locked';
        }

        this._rows.splice(index, 1);
        return true;
      },
    } satisfies AppMaintenancesType,
  };
}
