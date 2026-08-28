import { type CrmMaintenanceAllowedUser, CrmMaintenanceStatus } from '@/lib/api/types.gen';

export const CRM_MAINTENANCE_PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

export const CRM_MAINTENANCE_DEFAULT_PAGE_SIZE = 50;

export const CRM_MAINTENANCE_STATUS_LABELS: Record<CrmMaintenanceStatus, string> = {
  [CrmMaintenanceStatus.PLANNED]: '予定',
  [CrmMaintenanceStatus.IN_PROGRESS]: 'メンテナンス中',
  [CrmMaintenanceStatus.COMPLETED]: '完了',
};

export const CRM_MAINTENANCE_STATUS_BADGE_CLASSES: Record<CrmMaintenanceStatus, string> = {
  [CrmMaintenanceStatus.PLANNED]: 'bg-info/15 text-info border-info/20',
  [CrmMaintenanceStatus.IN_PROGRESS]: 'bg-warning/15 text-warning border-warning/20',
  [CrmMaintenanceStatus.COMPLETED]: 'bg-muted text-muted-foreground border-border',
};

/** 事前通知 (FR-007) — 通知済み(済) / 未通知(未) バッジ配色 (raw color 禁止 → テーマトークン参照)。 */
export const CRM_MAINTENANCE_NOTIFIED_BADGE_CLASS = 'bg-success/15 text-success border-success/20';
export const CRM_MAINTENANCE_UNNOTIFIED_BADGE_CLASS =
  'bg-muted text-muted-foreground border-border';

/**
 * Staff role (lowercase `StaffRoleSchema` enum, reused from the Y-01 staff master)
 * → display label. Roles are labeled in capitalized English (System / Headquarter / …),
 * so the allowed-user badges and the staff-search role dropdown both render from this map, while
 * the value sent to `GET /crm/staffs?role=` stays the lowercase enum key.
 */
export type StaffRole = CrmMaintenanceAllowedUser['role'];

export const STAFF_ROLE_DISPLAY_LABELS: Record<StaffRole, string> = {
  system: 'System',
  headquarter: 'Headquarter',
  manager: 'Manager',
  staff: 'Staff',
  trainer: 'Trainer',
  observer: 'Observer',
};

/**
 * Ordered role keys — the single source of truth for the staff-role list. Drives the
 * staff-search dropdown order and is re-exported into the form Zod schema's `z.enum`
 * (see `crm-maintenance-form.schema.ts`). `as const satisfies readonly StaffRole[]`
 * verifies every entry is a valid `StaffRole` without widening, so `z.enum` still
 * receives literal values; `STAFF_ROLE_DISPLAY_LABELS` (Record<StaffRole>) guards the
 * reverse — a role added to the generated type without a label here fails to compile.
 */
export const STAFF_ROLE_ORDER = [
  'system',
  'headquarter',
  'manager',
  'staff',
  'trainer',
  'observer',
] as const satisfies readonly StaffRole[];
