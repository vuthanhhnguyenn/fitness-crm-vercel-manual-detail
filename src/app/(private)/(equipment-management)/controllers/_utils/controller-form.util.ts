import type {
  GetCrmControllersByIdResponse,
  PatchControllerRequest,
  UpsertControllerRequest,
} from '@/lib/api/types.gen';

import type {
  ControllerFormSubmitValues,
  ControllerFormValues,
} from '../_schemas/controller-form.schema';

type ControllerDetail = NonNullable<GetCrmControllersByIdResponse>;

export const emptyControllerFormDefaults: ControllerFormValues = {
  name: '',
  store_code: '',
  location: '',
  ip_address: '',
  port: '',
  control_port_count: '',
  firmware_version: '',
  status: 'normal',
};

export function controllerDetailToFormValues(detail: ControllerDetail): ControllerFormValues {
  return {
    name: detail.name ?? '',
    store_code: detail.store_code,
    location: detail.location,
    ip_address: detail.ip_address,
    port: String(detail.port),
    control_port_count: String(detail.control_port_count),
    firmware_version: detail.firmware_version ?? '',
    status: detail.status,
  };
}

export function controllerFormValuesToBody(
  values: ControllerFormSubmitValues,
): UpsertControllerRequest {
  return {
    name: values.name.trim(),
    store_code: values.store_code.trim(),
    location: values.location.trim(),
    ip_address: values.ip_address.trim(),
    port: Number(values.port),
    control_port_count: Number(values.control_port_count),
    firmware_version: values.firmware_version.trim() || null,
    status: values.status,
  };
}

/**
 * Build a PATCH payload containing only the fields the user actually changed.
 */
export function controllerFormValuesToPatchBody(
  values: ControllerFormSubmitValues,
  dirtyFields: Partial<Record<keyof ControllerFormValues, unknown>>,
): PatchControllerRequest {
  const full = controllerFormValuesToBody(values);
  const patch: PatchControllerRequest = {};

  if (dirtyFields.name) patch.name = full.name;
  if (dirtyFields.store_code) patch.store_code = full.store_code;
  if (dirtyFields.location) patch.location = full.location;
  if (dirtyFields.ip_address) patch.ip_address = full.ip_address;
  if (dirtyFields.port) patch.port = full.port;
  if (dirtyFields.control_port_count) patch.control_port_count = full.control_port_count;
  if (dirtyFields.firmware_version) patch.firmware_version = full.firmware_version;
  if (dirtyFields.status) patch.status = full.status;

  return patch;
}
