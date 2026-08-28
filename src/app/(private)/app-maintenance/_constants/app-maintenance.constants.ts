import { AppMaintenanceStatus, AppMaintenanceTargetBrand } from '@/lib/api/types.gen';

export const APP_MAINTENANCE_PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

export const APP_MAINTENANCE_DEFAULT_PAGE_SIZE = 50;

export const APP_MAINTENANCE_BRAND_LABELS: Record<AppMaintenanceTargetBrand, string> = {
  [AppMaintenanceTargetBrand.JOYFIT]: 'JOYFIT',
  [AppMaintenanceTargetBrand.FIT365]: 'FIT365',
};

export const APP_MAINTENANCE_STATUS_LABELS: Record<AppMaintenanceStatus, string> = {
  [AppMaintenanceStatus.PLANNED]: '予定',
  [AppMaintenanceStatus.IN_PROGRESS]: 'メンテナンス中',
  [AppMaintenanceStatus.COMPLETED]: '完了',
};

export const APP_MAINTENANCE_STATUS_BADGE_CLASSES: Record<AppMaintenanceStatus, string> = {
  [AppMaintenanceStatus.PLANNED]: 'bg-info/15 text-info border-info/20',
  [AppMaintenanceStatus.IN_PROGRESS]: 'bg-warning/15 text-warning border-warning/20',
  [AppMaintenanceStatus.COMPLETED]: 'bg-muted text-muted-foreground border-border',
};
