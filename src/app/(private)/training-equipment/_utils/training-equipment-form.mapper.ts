import type { TrainingEquipmentDetail } from '@/lib/api/types.gen';

import type {
  TrainingEquipmentFormSubmitValues,
  TrainingEquipmentFormValues,
} from '../_schemas/training-equipment-form.schema';

export function trainingEquipmentFormToCreatePayload(values: TrainingEquipmentFormSubmitValues) {
  return {
    storeId: values.storeId,
    name: values.name,
    mstToolId: values.mstToolId,
    quantity: values.quantity,
    installationStatus: values.installationStatus,
    locationInGym: values.locationInGym ?? null,
    manufacturer: values.manufacturer ?? null,
    model: values.model ?? null,
    installedOn: values.installedOn ?? null,
    note: values.note ?? null,
  };
}

/** FR-005: store and installation status are not editable (status is changed from the detail page). */
export function trainingEquipmentFormToUpdatePayload(values: TrainingEquipmentFormSubmitValues) {
  return {
    name: values.name,
    mstToolId: values.mstToolId,
    quantity: values.quantity,
    locationInGym: values.locationInGym ?? null,
    manufacturer: values.manufacturer ?? null,
    model: values.model ?? null,
    installedOn: values.installedOn ?? null,
    note: values.note ?? null,
  };
}

export function equipmentToFormDefaults(
  equipment: TrainingEquipmentDetail,
): TrainingEquipmentFormValues {
  return {
    storeId: equipment.storeId,
    name: equipment.name,
    mstToolId: equipment.mstToolId,
    quantity: equipment.quantity,
    locationInGym: equipment.locationInGym,
    manufacturer: equipment.manufacturer,
    model: equipment.model,
    installedOn: equipment.installedOn,
    installationStatus: equipment.installationStatus,
    note: equipment.note,
  };
}

export const emptyTrainingEquipmentFormDefaults: TrainingEquipmentFormValues = {
  storeId: '',
  name: '',
  mstToolId: '',
  quantity: 1,
  locationInGym: null,
  manufacturer: null,
  model: null,
  installedOn: null,
  installationStatus: 'installed',
  note: null,
};
