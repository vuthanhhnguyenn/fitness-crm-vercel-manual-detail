import type { GetCrmTrainingEquipmentData, InstallationStatus } from '@/lib/api/types.gen';

import {
  TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
  TRAINING_EQUIPMENT_STATUS_FILTER_OPTIONS,
} from '../_constants/training-equipment.constants';

type TrainingEquipmentQuery = NonNullable<GetCrmTrainingEquipmentData['query']>;

export type TrainingEquipmentStatusFilter =
  (typeof TRAINING_EQUIPMENT_STATUS_FILTER_OPTIONS)[number]['value'];

export type TrainingEquipmentStatusParams = Pick<
  TrainingEquipmentQuery,
  'installationStatus' | 'includeDiscarded'
>;

/**
 * Converts the URL's status filter (`exclude_discarded` / `all` / a specific status) into the API's
 * two axes: `installationStatus` + `includeDiscarded`.
 */
export function toInstallationStatusParams(
  value: TrainingEquipmentStatusFilter,
): TrainingEquipmentStatusParams {
  if (value === TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT) {
    return { includeDiscarded: false };
  }
  if (value === 'all') return { includeDiscarded: true };
  return { installationStatus: value satisfies InstallationStatus };
}
