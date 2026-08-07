import { z } from 'zod';

export const EquipmentStatusSchema = z.enum(['normal', 'error', 'maintenance', 'discarded']);

export const EquipmentTypeSchema = z.enum([
  'entry_gate',
  'hydrogen_water_server',
  'body_composition_monitor',
  'tanning_machine',
  'protein_server',
  'other',
]);

export const EquipmentAuthenticationMethodSchema = z.enum([
  'member_qr_scan',
  'device_qr_scan',
  'none',
]);

export const ConnectedEquipmentListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  store_id: z.string(),
  store_name: z.string(),
  controller_number: z.number().int().nonnegative(),
  qr_code_id: z.string().nullable(),
  equipment_type: EquipmentTypeSchema,
  serial_number: z.string(),
  ip_address: z.string().nullable(),
  mac_address: z.string().nullable(),
  install_location: z.string(),
  installed_on: z.string(),
  status: EquipmentStatusSchema,
  authentication_method: EquipmentAuthenticationMethodSchema,
  linked_contract_labels: z.array(z.string()),
  updated_at: z.string(),
});

export const GetEquipmentQuerySchema = z.object({
  search: z.string().optional(),
  store_id: z.string().optional(),
  equipment_type: EquipmentTypeSchema.optional(),
  status: EquipmentStatusSchema.optional(),
  sort_by: z
    .enum([
      'id',
      'name',
      'controller_number',
      'qr_code_id',
      'equipment_type',
      'status',
      'updated_at',
    ])
    .default('id'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .refine((value) => [25, 50, 100, 200].includes(value))
    .default(50),
});

export const GetEquipmentResponseSchema = z.object({
  items: z.array(ConnectedEquipmentListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int(),
  total_pages: z.number().int().nonnegative(),
});

// Aggregate counters powering the 店舗機器管理 tabs (接続機器一覧 / 接点制御装置一覧).
export const GetEquipmentSummaryResponseSchema = z.object({
  equipment_count: z.number().int().nonnegative(),
  controllers_count: z.number().int().nonnegative(),
});

// CSV export reuses the list filters/sort without pagination; the response is a file.
export const ExportEquipmentRequestSchema = GetEquipmentQuerySchema.omit({
  page: true,
  limit: true,
});

export const BulkUpdateEquipmentStatusRequestSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: EquipmentStatusSchema,
  change_reason: z.string().optional(),
});

export const BulkUpdateEquipmentStatusResultSchema = z.object({
  id: z.string(),
  success: z.boolean(),
  status: EquipmentStatusSchema.optional(),
  error: z.string().optional(),
});

export const BulkUpdateEquipmentStatusResponseSchema = z.object({
  success: z.boolean(),
  updated_count: z.number().int().nonnegative(),
  results: z.array(BulkUpdateEquipmentStatusResultSchema),
});

export const EquipmentContractLinkTypeSchema = z.enum(['main', 'option', 'per_use']);

export const UsageControlRuleDisplaySchema = z.object({
  contract_link_types: z.array(EquipmentContractLinkTypeSchema),
  option_type_label: z.string().nullable(),
  main_contract_type_label: z.string().nullable(),
  per_use_option_type_label: z.string().nullable(),
  show_gate_stop_info: z.boolean(),
});

export const ControllerSummarySchema = z.object({
  controller_id: z.string(),
  ip_address: z.string(),
  port: z.number().int().positive(),
  status: EquipmentStatusSchema,
  name: z.string().nullable(),
});

export const ConnectedEquipmentDetailSchema = ConnectedEquipmentListItemSchema.extend({
  usage_control_rule: UsageControlRuleDisplaySchema,
  controller_summary: ControllerSummarySchema,
  controller_id: z.string().nullable(),
  remarks: z.string().nullable(),
  created_at: z.string(),
  last_status_confirmed_at: z.string(),
});

export const EquipmentStatusHistoryEventTypeSchema = z.enum(['created', 'status_change']);

export const EquipmentStatusHistoryItemSchema = z.object({
  id: z.string(),
  occurred_at: z.string(),
  operator_name: z.string(),
  event_type: EquipmentStatusHistoryEventTypeSchema,
  from_status: EquipmentStatusSchema.nullable(),
  to_status: EquipmentStatusSchema.nullable(),
  change_reason: z.string().nullable(),
});

// ─── Create / Update (FR-003 / FR-005) ──────────────────────────────────────

export const EquipmentUsageControlRuleInputSchema = z.object({
  main_enabled: z.boolean().default(false),
  main_contract_type: z.string().nullable().default(null),
  option_enabled: z.boolean().default(false),
  option_type: z.string().nullable().default(null),
  per_use_enabled: z.boolean().default(false),
  per_use_option_type: z.string().nullable().default(null),
});

function refineUsageControlRule(
  rule: EquipmentUsageControlRuleInput | null | undefined,
  ctx: z.RefinementCtx,
) {
  if (!rule) return;

  if (rule.main_enabled && !rule.main_contract_type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '主契約タイプを選択してください',
      path: ['usage_control_rule', 'main_contract_type'],
    });
  }
  if (rule.option_enabled && !rule.option_type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'オプション種別を選択してください',
      path: ['usage_control_rule', 'option_type'],
    });
  }
  if (rule.per_use_enabled && !rule.per_use_option_type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '都次オプション種別を選択してください',
      path: ['usage_control_rule', 'per_use_option_type'],
    });
  }
}

export const UpsertEquipmentRequestSchema = z
  .object({
    name: z.string().min(1, '機器名を入力してください').max(255),
    equipment_type: EquipmentTypeSchema,
    serial_number: z.string().min(1, 'シリアルナンバーを入力してください').max(255),
    install_location: z.string().min(1, '設置場所を入力してください').max(255),
    installed_on: z.string().min(1, '設置日を入力してください'),
    controller_number: z.coerce.number().int().nonnegative(),
    status: EquipmentStatusSchema.default('normal'),
    authentication_method: EquipmentAuthenticationMethodSchema.nullable().default(null),
    controller_id: z.string().nullable().default(null),
    ip_address: z.string().nullable().default(null),
    mac_address: z.string().nullable().default(null),
    usage_control_rule: EquipmentUsageControlRuleInputSchema.nullable().default(null),
    remarks: z.string().max(1000).nullable().default(null),
  })
  .superRefine((data, ctx) => refineUsageControlRule(data.usage_control_rule, ctx));

// PATCH body (FR-005): every field optional, no defaults — only changed fields are sent/applied.
export const PatchEquipmentRequestSchema = z
  .object({
    name: z.string().min(1, '機器名を入力してください').max(255).optional(),
    equipment_type: EquipmentTypeSchema.optional(),
    serial_number: z.string().min(1, 'シリアルナンバーを入力してください').max(255).optional(),
    install_location: z.string().min(1, '設置場所を入力してください').max(255).optional(),
    installed_on: z.string().min(1, '設置日を入力してください').optional(),
    controller_number: z.coerce.number().int().nonnegative().optional(),
    status: EquipmentStatusSchema.optional(),
    authentication_method: EquipmentAuthenticationMethodSchema.nullable().optional(),
    controller_id: z.string().nullable().optional(),
    ip_address: z.string().nullable().optional(),
    mac_address: z.string().nullable().optional(),
    usage_control_rule: EquipmentUsageControlRuleInputSchema.nullable().optional(),
    remarks: z.string().max(1000).nullable().optional(),
  })
  .superRefine((data, ctx) => refineUsageControlRule(data.usage_control_rule, ctx));

export const CreateEquipmentResponseSchema = z.object({
  equipment: ConnectedEquipmentDetailSchema,
});

export const UpdateEquipmentResponseSchema = z.object({
  equipment: ConnectedEquipmentDetailSchema,
});

export const GetEquipmentDetailResponseSchema = z.object({
  equipment: ConnectedEquipmentDetailSchema,
});

export const GetEquipmentHistoryResponseSchema = z.object({
  history: z.array(EquipmentStatusHistoryItemSchema),
});

export type ConnectedEquipmentListItem = z.infer<typeof ConnectedEquipmentListItemSchema>;
export type GetEquipmentQuery = z.infer<typeof GetEquipmentQuerySchema>;
export type GetEquipmentResponse = z.infer<typeof GetEquipmentResponseSchema>;
export type GetEquipmentSummaryResponse = z.infer<typeof GetEquipmentSummaryResponseSchema>;
export type ExportEquipmentRequest = z.infer<typeof ExportEquipmentRequestSchema>;
export type BulkUpdateEquipmentStatusRequest = z.infer<
  typeof BulkUpdateEquipmentStatusRequestSchema
>;
export type BulkUpdateEquipmentStatusResponse = z.infer<
  typeof BulkUpdateEquipmentStatusResponseSchema
>;
export type UsageControlRuleDisplay = z.infer<typeof UsageControlRuleDisplaySchema>;
export type ControllerSummary = z.infer<typeof ControllerSummarySchema>;
export type ConnectedEquipmentDetail = z.infer<typeof ConnectedEquipmentDetailSchema>;
export type EquipmentStatusHistoryItem = z.infer<typeof EquipmentStatusHistoryItemSchema>;
export type GetEquipmentDetailResponse = z.infer<typeof GetEquipmentDetailResponseSchema>;
export type GetEquipmentHistoryResponse = z.infer<typeof GetEquipmentHistoryResponseSchema>;
export type EquipmentUsageControlRuleInput = z.infer<typeof EquipmentUsageControlRuleInputSchema>;
export type UpsertEquipmentRequest = z.infer<typeof UpsertEquipmentRequestSchema>;
export type PatchEquipmentRequest = z.infer<typeof PatchEquipmentRequestSchema>;
export type CreateEquipmentResponse = z.infer<typeof CreateEquipmentResponseSchema>;
export type UpdateEquipmentResponse = z.infer<typeof UpdateEquipmentResponseSchema>;
