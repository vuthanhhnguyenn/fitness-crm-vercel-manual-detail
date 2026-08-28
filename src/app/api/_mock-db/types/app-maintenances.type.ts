import type {
  AppMaintenance,
  CreateAppMaintenanceBody,
  GetAppMaintenancesQuery,
  UpdateAppMaintenanceBody,
} from '@/app/api/_schemas/app-maintenance.schema';

export type AppMaintenanceUpdateResult =
  | AppMaintenance
  | 'not_found'
  | 'start_locked'
  | 'invalid_period'
  | 'period_conflict';

export type AppMaintenanceDeleteResult = 'not_found' | 'in_progress_locked' | true;

export type AppMaintenancesType = {
  _rows: AppMaintenance[];
  _seeded: boolean;
  _seed(): void;
  list(query: GetAppMaintenancesQuery): {
    rows: AppMaintenance[];
    total: number;
    totalAll: number;
  };
  getById(id: string): AppMaintenance | undefined;
  create(data: CreateAppMaintenanceBody, createdBy: string): AppMaintenance | 'period_conflict';
  update(id: string, data: UpdateAppMaintenanceBody, updatedBy: string): AppMaintenanceUpdateResult;
  delete(id: string): AppMaintenanceDeleteResult;
};
