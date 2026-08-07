import type {
  GetCrmEquipmentByIdResponse,
  PatchEquipmentRequest,
  UpsertEquipmentRequest,
} from '@/lib/api/types.gen';

import type {
  EquipmentFormSubmitValues,
  EquipmentFormValues,
} from '../_schemas/equipment-form.schema';

type EquipmentDetail = NonNullable<GetCrmEquipmentByIdResponse>['equipment'];

export const emptyEquipmentFormDefaults: EquipmentFormValues = {
  name: '',
  equipment_type: '' as EquipmentFormValues['equipment_type'],
  serial_number: '',
  install_location: '',
  installed_on: '',
  status: 'normal',
  authentication_method: null,
  controller_id: null,
  controller_number: '',
  ip_address: '',
  mac_address: '',
  usage_control_rule: {
    main_enabled: false,
    main_contract_type: null,
    option_enabled: false,
    option_type: null,
    per_use_enabled: false,
    per_use_option_type: null,
  },
  remarks: '',
};

export function equipmentDetailToFormValues(detail: EquipmentDetail): EquipmentFormValues {
  const rule = detail.usage_control_rule;

  return {
    name: detail.name,
    equipment_type: detail.equipment_type,
    serial_number: detail.serial_number,
    install_location: detail.install_location,
    installed_on: detail.installed_on,
    status: detail.status,
    authentication_method: detail.authentication_method,
    controller_id: detail.controller_id,
    controller_number: detail.controller_number != null ? String(detail.controller_number) : '',
    ip_address: detail.ip_address ?? '',
    mac_address: detail.mac_address ?? '',
    usage_control_rule: {
      main_enabled: rule.contract_link_types.includes('main'),
      main_contract_type: rule.main_contract_type_label,
      option_enabled: rule.contract_link_types.includes('option'),
      option_type: rule.option_type_label,
      per_use_enabled: rule.contract_link_types.includes('per_use'),
      per_use_option_type: rule.per_use_option_type_label,
    },
    remarks: detail.remarks ?? '',
  };
}

export function equipmentFormValuesToBody(
  values: EquipmentFormSubmitValues,
): UpsertEquipmentRequest {
  const rule = values.usage_control_rule;

  return {
    name: values.name.trim(),
    equipment_type: values.equipment_type,
    serial_number: values.serial_number.trim(),
    install_location: values.install_location.trim(),
    installed_on: values.installed_on,
    controller_number: Number(values.controller_number),
    status: values.status,
    authentication_method: values.authentication_method,
    controller_id: values.controller_id,
    ip_address: values.ip_address.trim() || null,
    mac_address: values.mac_address.trim() || null,
    // Unchecked judgments discard their type value before persistence
    usage_control_rule: {
      main_enabled: rule.main_enabled,
      main_contract_type: rule.main_enabled ? rule.main_contract_type : null,
      option_enabled: rule.option_enabled,
      option_type: rule.option_enabled ? rule.option_type : null,
      per_use_enabled: rule.per_use_enabled,
      per_use_option_type: rule.per_use_enabled ? rule.per_use_option_type : null,
    },
    remarks: values.remarks.trim() || null,
  };
}

/**
 * Build a PATCH payload containing only the fields the user actually changed.
 * `usage_control_rule` is treated as a single unit: if any of its sub-fields is
 * dirty, the whole (cleaned) rule object is sent.
 */
export function equipmentFormValuesToPatchBody(
  values: EquipmentFormSubmitValues,
  dirtyFields: Partial<Record<keyof EquipmentFormValues, unknown>>,
): PatchEquipmentRequest {
  const full = equipmentFormValuesToBody(values);
  const patch: PatchEquipmentRequest = {};

  if (dirtyFields.name) patch.name = full.name;
  if (dirtyFields.equipment_type) patch.equipment_type = full.equipment_type;
  if (dirtyFields.serial_number) patch.serial_number = full.serial_number;
  if (dirtyFields.install_location) patch.install_location = full.install_location;
  if (dirtyFields.installed_on) patch.installed_on = full.installed_on;
  if (dirtyFields.controller_number) patch.controller_number = full.controller_number;
  if (dirtyFields.status) patch.status = full.status;
  if (dirtyFields.authentication_method) patch.authentication_method = full.authentication_method;
  if (dirtyFields.controller_id) patch.controller_id = full.controller_id;
  if (dirtyFields.ip_address) patch.ip_address = full.ip_address;
  if (dirtyFields.mac_address) patch.mac_address = full.mac_address;
  if (dirtyFields.usage_control_rule) patch.usage_control_rule = full.usage_control_rule;
  if (dirtyFields.remarks) patch.remarks = full.remarks;

  return patch;
}
