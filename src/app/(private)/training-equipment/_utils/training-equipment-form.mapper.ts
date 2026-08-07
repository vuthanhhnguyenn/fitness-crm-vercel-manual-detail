import type { TrainingEquipmentItem } from '@/lib/api/types.gen';

import type { TrainingEquipmentFormSubmitValues } from '../_schemas/training-equipment-form.schema';

export function trainingEquipmentFormToCreatePayload(values: TrainingEquipmentFormSubmitValues) {
  return {
    store_id: values.store_id,
    store_name: values.store_name,
    name: values.name,
    tool_type: values.tool_type,
    quantity: values.quantity,
    installation_area: values.installation_area ?? null,
    manufacturer: values.manufacturer ?? null,
    model_number: values.model_number ?? null,
    installed_on: values.installed_on ?? null,
    status: values.status,
    notes: values.notes ?? null,
  };
}

export function trainingEquipmentFormToUpdatePayload(values: TrainingEquipmentFormSubmitValues) {
  return {
    name: values.name,
    tool_type: values.tool_type,
    quantity: values.quantity,
    installation_area: values.installation_area ?? null,
    manufacturer: values.manufacturer ?? null,
    model_number: values.model_number ?? null,
    installed_on: values.installed_on ?? null,
    notes: values.notes ?? null,
  };
}

export function equipmentToFormDefaults(equipment: TrainingEquipmentItem) {
  return {
    store_id: equipment.store_id,
    store_name: equipment.store_name,
    name: equipment.name,
    tool_type: equipment.tool_type,
    quantity: equipment.quantity,
    installation_area: equipment.installation_area,
    manufacturer: equipment.manufacturer,
    model_number: equipment.model_number,
    installed_on: equipment.installed_on,
    status: equipment.status,
    notes: equipment.notes,
  };
}

export const emptyTrainingEquipmentFormDefaults = {
  store_id: '',
  store_name: '',
  name: '',
  tool_type: 'machine' as const,
  quantity: 1,
  installation_area: null,
  manufacturer: null,
  model_number: null,
  installed_on: null,
  status: 'installed' as const,
  notes: null,
};
