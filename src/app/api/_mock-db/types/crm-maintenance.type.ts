import type {
  CreateCrmMaintenanceBody,
  CrmMaintenance,
  CrmMaintenanceAllowedUserResponse,
  GetCrmMaintenancesQuery,
  UpdateCrmMaintenanceBody,
} from '@/app/api/_schemas/crm-maintenance.schema';

/** Join row — no denormalized name/role; resolved from `db.staffs` at read time. */
export type CrmMaintenanceAllowedUserRow = {
  crm_maintenance_id: string;
  staff_id: string;
};

/** Many-to-many join table, mirroring `banners`' `BannerBrandMapTable`. */
export type CrmMaintenanceAllowedUsersTable = {
  _rows: CrmMaintenanceAllowedUserRow[];
  getByMaintenanceId(maintenanceId: string): string[];
  setByMaintenanceId(maintenanceId: string, staffIds: string[]): void;
  deleteByMaintenanceId(maintenanceId: string): void;
};

export type CrmMaintenanceCreateResult = CrmMaintenance | 'period_conflict' | 'unknown_staff_id';

export type CrmMaintenanceUpdateResult =
  | CrmMaintenance
  | 'not_found'
  | 'start_locked'
  | 'invalid_period'
  | 'period_conflict'
  | 'unknown_staff_id';

export type CrmMaintenanceDeleteResult = 'not_found' | 'in_progress_locked' | true;

/** 事前通知送信 (FR-007) — mock: 通知済みフラグを立てるだけ。 */
export type CrmMaintenanceNotifyResult = CrmMaintenance | 'not_found';

export type CrmMaintenancesType = {
  _rows: CrmMaintenance[];
  _allowedUsers: CrmMaintenanceAllowedUsersTable;
  _seeded: boolean;
  _seed(): void;
  getAllowedStaffIds(maintenanceId: string): string[];
  /** Resolves allowed users against `db.staffs` (name/role) at read time. */
  getAllowedUsers(maintenanceId: string): CrmMaintenanceAllowedUserResponse[];
  list(query: GetCrmMaintenancesQuery): {
    rows: CrmMaintenance[];
    total: number;
    totalAll: number;
  };
  getById(id: string): CrmMaintenance | undefined;
  create(data: CreateCrmMaintenanceBody, createdBy: string): CrmMaintenanceCreateResult;
  update(id: string, data: UpdateCrmMaintenanceBody, updatedBy: string): CrmMaintenanceUpdateResult;
  delete(id: string): CrmMaintenanceDeleteResult;
  /** 事前通知を送信 (FR-007) — sets `notified = true` (疑似送信)。 */
  notify(id: string): CrmMaintenanceNotifyResult;
};
