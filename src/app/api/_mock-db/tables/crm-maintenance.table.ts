import type { DbType } from '@/app/api/_mock-db/_db.types';
import { buildCrmMaintenanceSeed } from '@/app/api/_mock-db/seeds/crm-maintenance.seed';
import type {
  CrmMaintenanceAllowedUsersTable,
  CrmMaintenanceCreateResult,
  CrmMaintenanceDeleteResult,
  CrmMaintenanceNotifyResult,
  CrmMaintenanceUpdateResult,
  CrmMaintenancesType,
} from '@/app/api/_mock-db/types/crm-maintenance.type';
import type {
  CreateCrmMaintenanceBody,
  CrmMaintenance,
  CrmMaintenanceAllowedUserResponse,
  CrmMaintenanceDetailResponse,
  CrmMaintenanceItemResponse,
  CrmMaintenanceStatus,
  GetCrmMaintenancesQuery,
  UpdateCrmMaintenanceBody,
} from '@/app/api/_schemas/crm-maintenance.schema';

export function computeStatus(startsAt: string, endsAt: string): CrmMaintenanceStatus {
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();

  if (now < start) return 'planned';
  if (now > end) return 'completed';
  return 'in_progress';
}

export function toCrmMaintenanceItemResponse(
  row: CrmMaintenance,
  allowedUserCount: number,
): CrmMaintenanceItemResponse {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: computeStatus(row.starts_at, row.ends_at),
    allowedUserCount,
    createdAt: row.created_at,
    notified: row.notified,
  };
}

export function toCrmMaintenanceDetailResponse(
  row: CrmMaintenance,
  allowedUsers: CrmMaintenanceAllowedUserResponse[],
): CrmMaintenanceDetailResponse {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    message: row.message,
    note: row.note,
    status: computeStatus(row.starts_at, row.ends_at),
    allowedUsers,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    notified: row.notified,
  };
}

function periodsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

function hasPeriodOverlap(
  rows: CrmMaintenance[],
  startsAt: string,
  endsAt: string,
  excludeId?: string,
): boolean {
  return rows.some(
    (row) => row.id !== excludeId && periodsOverlap(startsAt, endsAt, row.starts_at, row.ends_at),
  );
}

function createCrmMaintenanceAllowedUsersTable(): CrmMaintenanceAllowedUsersTable {
  return {
    _rows: [],
    getByMaintenanceId(maintenanceId: string): string[] {
      return this._rows
        .filter((entry) => entry.crm_maintenance_id === maintenanceId)
        .map((entry) => entry.staff_id);
    },
    setByMaintenanceId(maintenanceId: string, staffIds: string[]): void {
      this._rows = this._rows.filter((entry) => entry.crm_maintenance_id !== maintenanceId);
      for (const staffId of [...new Set(staffIds)]) {
        this._rows.push({ crm_maintenance_id: maintenanceId, staff_id: staffId });
      }
    },
    deleteByMaintenanceId(maintenanceId: string): void {
      this._rows = this._rows.filter((entry) => entry.crm_maintenance_id !== maintenanceId);
    },
  };
}

export function createCrmMaintenanceTables(getDb: () => DbType) {
  function staffExists(staffId: string): boolean {
    return getDb()
      .staffs.getList()
      .some((staff) => staff.staff_id === staffId);
  }

  return {
    crmMaintenances: {
      _rows: [] as CrmMaintenance[],
      _allowedUsers: createCrmMaintenanceAllowedUsersTable(),
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        const { rows, allowedUsers } = buildCrmMaintenanceSeed();
        this._rows = rows;
        this._allowedUsers._rows = allowedUsers;
      },
      getAllowedStaffIds(maintenanceId: string): string[] {
        this._seed();
        return this._allowedUsers.getByMaintenanceId(maintenanceId);
      },
      getAllowedUsers(maintenanceId: string): CrmMaintenanceAllowedUserResponse[] {
        this._seed();
        const staffList = getDb().staffs.getList();
        return this._allowedUsers
          .getByMaintenanceId(maintenanceId)
          .map((staffId) => {
            const staff = staffList.find((entry) => entry.staff_id === staffId);
            if (!staff) return null;
            return { staffId, name: staff.name, role: staff.role };
          })
          .filter((user): user is CrmMaintenanceAllowedUserResponse => user !== null);
      },
      list(query: GetCrmMaintenancesQuery): {
        rows: CrmMaintenance[];
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
              row.title.toLowerCase().includes(normalized),
          );
        }

        if (query.status) {
          rows = rows.filter((row) => computeStatus(row.starts_at, row.ends_at) === query.status);
        }

        const sortFieldMap = {
          startsAt: 'starts_at',
          endsAt: 'ends_at',
          createdAt: 'created_at',
        } as const;
        const sortField = sortFieldMap[query.sort];
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
      getById(id: string): CrmMaintenance | undefined {
        this._seed();
        return this._rows.find((row) => row.id === id);
      },
      create(data: CreateCrmMaintenanceBody, createdBy: string): CrmMaintenanceCreateResult {
        this._seed();

        if (hasPeriodOverlap(this._rows, data.startsAt, data.endsAt)) {
          return 'period_conflict';
        }

        const allowedUserIds = data.allowedUserIds ?? [];
        if (allowedUserIds.some((staffId) => !staffExists(staffId))) {
          return 'unknown_staff_id';
        }

        const ids = this._rows
          .map((row) => Number.parseInt(row.id.replace('M-', ''), 10))
          .filter((n) => !Number.isNaN(n));
        const nextNumber = ids.length > 0 ? Math.max(...ids) + 1 : 1;
        const now = new Date().toISOString();

        const row: CrmMaintenance = {
          id: `M-${String(nextNumber).padStart(3, '0')}`,
          title: data.title,
          starts_at: data.startsAt,
          ends_at: data.endsAt,
          message: data.message,
          note: data.note ?? null,
          created_by: createdBy,
          updated_by: null,
          created_at: now,
          updated_at: null,
          notified: false,
        };
        this._rows.push(row);
        this._allowedUsers.setByMaintenanceId(row.id, allowedUserIds);
        return row;
      },
      update(
        id: string,
        data: UpdateCrmMaintenanceBody,
        updatedBy: string,
      ): CrmMaintenanceUpdateResult {
        this._seed();

        const index = this._rows.findIndex((row) => row.id === id);
        if (index === -1) return 'not_found';

        const existing = this._rows[index];
        const currentStatus = computeStatus(existing.starts_at, existing.ends_at);

        if (data.startsAt !== undefined && currentStatus === 'in_progress') {
          return 'start_locked';
        }

        const effectiveStartsAt = data.startsAt ?? existing.starts_at;
        const effectiveEndsAt = data.endsAt ?? existing.ends_at;

        if (new Date(effectiveEndsAt) <= new Date(effectiveStartsAt)) {
          return 'invalid_period';
        }

        if (hasPeriodOverlap(this._rows, effectiveStartsAt, effectiveEndsAt, id)) {
          return 'period_conflict';
        }

        if (data.allowedUserIds !== undefined) {
          if (data.allowedUserIds.some((staffId) => !staffExists(staffId))) {
            return 'unknown_staff_id';
          }
        }

        const updated: CrmMaintenance = {
          ...existing,
          title: data.title ?? existing.title,
          starts_at: effectiveStartsAt,
          ends_at: effectiveEndsAt,
          message: data.message ?? existing.message,
          note: data.note !== undefined ? data.note : existing.note,
          updated_by: updatedBy,
          updated_at: new Date().toISOString(),
        };
        this._rows[index] = updated;

        if (data.allowedUserIds !== undefined) {
          this._allowedUsers.setByMaintenanceId(id, data.allowedUserIds);
        }

        return updated;
      },
      delete(id: string): CrmMaintenanceDeleteResult {
        this._seed();

        const index = this._rows.findIndex((row) => row.id === id);
        if (index === -1) return 'not_found';

        const existing = this._rows[index];
        if (computeStatus(existing.starts_at, existing.ends_at) === 'in_progress') {
          return 'in_progress_locked';
        }

        this._rows.splice(index, 1);
        this._allowedUsers.deleteByMaintenanceId(id);
        return true;
      },
      notify(id: string): CrmMaintenanceNotifyResult {
        this._seed();

        const index = this._rows.findIndex((row) => row.id === id);
        if (index === -1) return 'not_found';

        const updated: CrmMaintenance = { ...this._rows[index], notified: true };
        this._rows[index] = updated;
        return updated;
      },
    } satisfies CrmMaintenancesType,
  };
}
