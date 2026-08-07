import type { StaffRole } from '@/lib/api/types.gen';

const PERMISSION_MAP: Record<StaffRole, string[]> = {
  system: ['view', 'edit', 'delete'],
  headquarter: ['view', 'edit', 'delete'],
  manager: ['view', 'edit', 'delete'],
  staff: ['view', 'edit'],
  trainer: ['view'],
  observer: ['view'],
};

export function canPerformAction(role: StaffRole, action: 'view' | 'edit' | 'delete'): boolean {
  return PERMISSION_MAP[role]?.includes(action) ?? false;
}

export function canRegister(role: StaffRole): boolean {
  return canPerformAction(role, 'edit') || role === 'staff';
}
