import { z } from 'zod';

import { EquipmentStatusSchema } from './equipment.schema';

const LOCAL_IP_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

export const ControllerSchema = z.object({
  controller_id: z.string(),
  controller_number: z.number().int().nonnegative(),
  name: z.string().nullable(),
  store_code: z.string(),
  location: z.string(),
  ip_address: z.string(),
  port: z.number().int().positive(),
  firmware_version: z.string().nullable(),
  control_port_count: z.number().int().min(1).max(64),
  status: EquipmentStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const ControllerListItemSchema = ControllerSchema.extend({
  device_count: z.number().int().nonnegative(),
});

export const ControllerDeviceSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  normal: z.number().int().nonnegative(),
  error: z.number().int().nonnegative(),
});

export const ControllerDetailSchema = ControllerSchema.extend({
  device_count: z.number().int().nonnegative(),
  device_summary: ControllerDeviceSummarySchema,
});

export const ControllerConnectedDeviceSchema = z.object({
  equipment_id: z.string(),
  name: z.string(),
  controller_number: z.number().int(),
  gate_type: z.string().nullable(),
  status: EquipmentStatusSchema,
});

export const ControllerHistoryChangeTypeSchema = z.enum([
  'status_change',
  'fault_report',
  'inspection',
  'created',
]);

export const ControllerHistoryItemSchema = z.object({
  occurred_at: z.string(),
  operator: z.string(),
  change_type: ControllerHistoryChangeTypeSchema,
  from_status: EquipmentStatusSchema.nullable(),
  to_status: EquipmentStatusSchema.nullable(),
  memo: z.string().nullable(),
});

export const GetControllersQuerySchema = z.object({
  search: z.string().optional(),
  status: EquipmentStatusSchema.optional(),
  store_id: z.string().optional(),
  sort_by: z
    .enum([
      'controller_id',
      'name',
      'store_code',
      'location',
      'ip_address',
      'firmware_version',
      'control_port_count',
      'device_count',
      'status',
    ])
    .default('controller_id'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});

export const GetControllersResponseSchema = z.object({
  items: z.array(ControllerListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().positive(),
  total_pages: z.number().int().nonnegative(),
});

// CSV export reuses the list filters/sort without pagination; the response is a file.
export const ExportControllersRequestSchema = GetControllersQuerySchema.omit({
  page: true,
  limit: true,
});

export const GetControllerDevicesResponseSchema = z.object({
  devices: z.array(ControllerConnectedDeviceSchema),
  summary: ControllerDeviceSummarySchema,
});

export const GetControllerHistoryResponseSchema = z.object({
  items: z.array(ControllerHistoryItemSchema),
});

export const UpsertControllerRequestSchema = z.object({
  name: z.string().min(1, '装置名を入力してください').max(255),
  store_code: z.string().min(1, '店舗コードを選択してください'),
  location: z.string().min(1, '設置場所を入力してください').max(255),
  ip_address: z
    .string()
    .min(1, 'IPアドレスを入力してください')
    .regex(LOCAL_IP_REGEX, 'IPアドレスの形式が正しくありません'),
  port: z.coerce.number().int().min(1).max(65535),
  firmware_version: z.string().max(255).nullable().optional(),
  control_port_count: z.coerce.number().int().min(1).max(64),
  status: EquipmentStatusSchema.default('normal'),
});

export const PatchControllerRequestSchema = UpsertControllerRequestSchema.partial();

export const CreateControllerResponseSchema = ControllerDetailSchema;
export const UpdateControllerResponseSchema = ControllerDetailSchema;
export const GetControllerDetailResponseSchema = ControllerDetailSchema;

export type Controller = z.infer<typeof ControllerSchema>;
export type ControllerListItem = z.infer<typeof ControllerListItemSchema>;
export type ControllerDeviceSummary = z.infer<typeof ControllerDeviceSummarySchema>;
export type ControllerDetail = z.infer<typeof ControllerDetailSchema>;
export type ControllerConnectedDevice = z.infer<typeof ControllerConnectedDeviceSchema>;
export type ControllerHistoryChangeType = z.infer<typeof ControllerHistoryChangeTypeSchema>;
export type ControllerHistoryItem = z.infer<typeof ControllerHistoryItemSchema>;
export type GetControllersQuery = z.infer<typeof GetControllersQuerySchema>;
export type GetControllersResponse = z.infer<typeof GetControllersResponseSchema>;
export type ExportControllersRequest = z.infer<typeof ExportControllersRequestSchema>;
export type GetControllerDevicesResponse = z.infer<typeof GetControllerDevicesResponseSchema>;
export type GetControllerHistoryResponse = z.infer<typeof GetControllerHistoryResponseSchema>;
export type UpsertControllerRequest = z.infer<typeof UpsertControllerRequestSchema>;
export type PatchControllerRequest = z.infer<typeof PatchControllerRequestSchema>;
export type CreateControllerResponse = z.infer<typeof CreateControllerResponseSchema>;
export type UpdateControllerResponse = z.infer<typeof UpdateControllerResponseSchema>;
export type GetControllerDetailResponse = z.infer<typeof GetControllerDetailResponseSchema>;
