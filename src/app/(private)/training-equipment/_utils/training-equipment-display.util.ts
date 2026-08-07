import type { StatusTone } from '@/components/common/status-card';

import {
  TRAINING_EQUIPMENT_STATUS_LABELS,
  type TrainingEquipmentStatus,
} from '../_constants/training-equipment.constants';

export function getTrainingEquipmentStatusTone(status: TrainingEquipmentStatus): StatusTone {
  switch (status) {
    case 'installed':
      return 'success';
    case 'maintenance':
      return 'info';
    case 'removed':
      return 'warning';
    case 'discarded':
      return 'muted';
    default:
      return 'muted';
  }
}

export function getTrainingEquipmentStatusLabel(status: TrainingEquipmentStatus): string {
  return TRAINING_EQUIPMENT_STATUS_LABELS[status];
}

export function getTrainingEquipmentStatusBadgeClass(status: TrainingEquipmentStatus): string {
  switch (status) {
    case 'installed':
      return 'bg-success/15 text-success border-success/20';
    case 'maintenance':
      return 'bg-info/15 text-info border-info/20';
    case 'removed':
      return 'bg-warning/15 text-warning border-warning/20';
    case 'discarded':
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
    default:
      return '';
  }
}

export function getTrainingEquipmentStatusDotClass(status: TrainingEquipmentStatus): string {
  switch (status) {
    case 'installed':
      return 'bg-success';
    case 'maintenance':
      return 'bg-info';
    case 'removed':
      return 'bg-warning';
    case 'discarded':
      return 'bg-muted-foreground';
    default:
      return 'bg-muted-foreground';
  }
}
