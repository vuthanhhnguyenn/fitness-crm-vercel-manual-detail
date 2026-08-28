import type { StatusTone } from '@/components/common/status-card';

import type { InstallationStatus } from '@/lib/api/types.gen';

import { INSTALLATION_STATUS_LABELS } from '../_constants/training-equipment.constants';

export function getInstallationStatusTone(status: InstallationStatus): StatusTone {
  switch (status) {
    case 'installed':
      return 'success';
    case 'maintenance':
      return 'info';
    case 'removed':
      return 'warning';
    case 'discarded':
    default:
      return 'muted';
  }
}

export function getInstallationStatusLabel(status: InstallationStatus): string {
  return INSTALLATION_STATUS_LABELS[status];
}

export function getInstallationStatusBadgeClass(status: InstallationStatus): string {
  switch (status) {
    case 'installed':
      return 'bg-success/15 text-success border-success/20';
    case 'maintenance':
      return 'bg-info/15 text-info border-info/20';
    case 'removed':
      return 'bg-warning/15 text-warning border-warning/20';
    case 'discarded':
    default:
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
  }
}

export function getInstallationStatusDotClass(status: InstallationStatus): string {
  switch (status) {
    case 'installed':
      return 'bg-success';
    case 'maintenance':
      return 'bg-info';
    case 'removed':
      return 'bg-warning';
    case 'discarded':
    default:
      return 'bg-muted-foreground';
  }
}
