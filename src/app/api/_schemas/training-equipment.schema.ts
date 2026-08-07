import { z } from 'zod';

export const TrainingEquipmentStatusSchema = z.enum([
  'installed',
  'maintenance',
  'removed',
  'discarded',
]);

export const LocationInGymSchema = z.enum([
  'aerobic_area',
  'machine_area',
  'free_weight_area',
  'stretch_area',
]);

/** All `mst_tools.code` values (camelCase per official API). */
export const ToolTypeCodeSchema = z.enum([
  'none',
  'machine',
  'cableMachine',
  'smithMachine',
  'barbell',
  'dumbbell',
  'kettlebell',
  'resistanceBand',
  'trx',
  'other',
]);

/** Equipment-assignable tool types (`code !== 'none'`). */
export const TrainingEquipmentToolTypeSchema = ToolTypeCodeSchema.exclude(['none']);

function booleanQueryDefaultFalse(description: string) {
  return z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return false;
    if (typeof val === 'boolean') return val;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return false;
  }, z.boolean().default(false).describe(description));
}

export const ToolTypeSchema = z.object({
  id: z.string().uuid(),
  code: ToolTypeCodeSchema,
  name: z.string(),
  sortOrder: z.number().int(),
});

export const ListToolTypesQuerySchema = z.object({
  includeNone: booleanQueryDefaultFalse(
    "When false, code='none' (bodyweight) is excluded (E-03 BR-EQP-006)",
  ),
  includeInactive: booleanQueryDefaultFalse(
    'When false, only is_active=true and non-deleted rows are returned',
  ),
});

export const ListToolTypesResponseSchema = z.object({
  items: z.array(ToolTypeSchema),
});

export const TrainingEquipmentItemSchema = z.object({
  id: z.string(),
  store_id: z.string(),
  store_name: z.string(),
  name: z.string(),
  tool_type: TrainingEquipmentToolTypeSchema,
  tool_name: z.string().optional(),
  quantity: z.number().int().min(1),
  installation_area: LocationInGymSchema.nullable(),
  manufacturer: z.string().nullable(),
  model_number: z.string().nullable(),
  installed_on: z.string().nullable(),
  status: TrainingEquipmentStatusSchema,
  notes: z.string().nullable(),
  linked_exercise_count: z.number().int().nonnegative(),
  last_updated_at: z.string(),
  last_updated_by: z.string(),
  is_deleted: z.boolean(),
});

export const GetTrainingEquipmentQuerySchema = z.object({
  store_id: z.string().optional(),
  keyword: z.string().optional(),
  tool_type: TrainingEquipmentToolTypeSchema.optional(),
  status: z
    .enum(['installed', 'maintenance', 'removed', 'discarded', 'exclude_discarded', 'all'])
    .default('exclude_discarded'),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce
    .number()
    .int()
    .refine((value) => [25, 50, 100, 200].includes(value))
    .default(50),
  sort_by: z
    .enum(['id', 'name', 'tool_type', 'quantity', 'installation_area', 'status', 'last_updated_at'])
    .optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const GetTrainingEquipmentResponseSchema = z.object({
  items: z.array(TrainingEquipmentItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  page_size: z.number().int(),
  total_pages: z.number().int().nonnegative(),
});

export const UpsertTrainingEquipmentSchema = z.object({
  store_id: z.string().min(1),
  store_name: z.string().min(1),
  name: z.string().min(1).max(255),
  tool_type: TrainingEquipmentToolTypeSchema,
  quantity: z.coerce.number().int().min(1),
  installation_area: LocationInGymSchema.nullable().optional(),
  manufacturer: z.string().max(255).nullable().optional(),
  model_number: z.string().max(255).nullable().optional(),
  installed_on: z.string().nullable().optional(),
  status: TrainingEquipmentStatusSchema.default('installed'),
  notes: z.string().max(1000).nullable().optional(),
});

export const PatchTrainingEquipmentSchema = UpsertTrainingEquipmentSchema.partial();

export const TrainingEquipmentDetailResponseSchema = z.object({
  equipment: TrainingEquipmentItemSchema,
});

export const TrainingEquipmentExerciseLinkSchema = z.object({
  equipment_id: z.string(),
  exercise_id: z.string(),
  exercise_name: z.string(),
  exercise_tool_type: z.string(),
  exercise_tool_name: z.string(),
  difficulty: z.string().nullable(),
  body_part: z.string().nullable(),
  created_at: z.string(),
});

export const TrainingEquipmentExerciseCatalogItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  tool_type: TrainingEquipmentToolTypeSchema,
  tool_name: z.string(),
  difficulty: z.string().nullable(),
  body_part: z.string().nullable(),
});

export const GetTrainingEquipmentExercisesQuerySchema = z.object({
  keyword: z.string().optional(),
  tool_type: TrainingEquipmentToolTypeSchema.optional(),
});

export const AddTrainingEquipmentExerciseLinksSchema = z.object({
  exercise_ids: z.array(z.string().min(1)).min(1),
  force: z.boolean().optional(),
});

export const TrainingEquipmentExerciseLinksResponseSchema = z.object({
  items: z.array(TrainingEquipmentExerciseLinkSchema),
});

export const TrainingEquipmentExercisesResponseSchema = z.object({
  items: z.array(TrainingEquipmentExerciseCatalogItemSchema),
});

export const TrainingEquipmentStatusHistorySchema = z.object({
  id: z.string(),
  equipment_id: z.string(),
  changed_at: z.string(),
  changed_by: z.string(),
  from_status: TrainingEquipmentStatusSchema,
  to_status: TrainingEquipmentStatusSchema,
  reason: z.string(),
});

export const GetTrainingEquipmentHistoryResponseSchema = z.object({
  items: z.array(TrainingEquipmentStatusHistorySchema),
});

export const UpdateTrainingEquipmentStatusSchema = z.object({
  next_status: TrainingEquipmentStatusSchema,
  reason: z.string().min(1, '変更理由を入力してください').max(1000),
});

export const UpdateTrainingEquipmentStatusResponseSchema = z.object({
  equipment: TrainingEquipmentItemSchema,
});

export const ExportTrainingEquipmentRequestSchema = GetTrainingEquipmentQuerySchema.omit({
  page: true,
  page_size: true,
});

export const BulkUpdateTrainingEquipmentStatusRequestSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  next_status: TrainingEquipmentStatusSchema,
  reason: z.string().min(1, '変更理由を入力してください').max(1000),
});

export const BulkUpdateTrainingEquipmentStatusResultSchema = z.object({
  id: z.string(),
  success: z.boolean(),
  status: TrainingEquipmentStatusSchema.optional(),
  error: z.string().optional(),
});

export const BulkUpdateTrainingEquipmentStatusResponseSchema = z.object({
  success: z.boolean(),
  updated_count: z.number().int().nonnegative(),
  results: z.array(BulkUpdateTrainingEquipmentStatusResultSchema),
});

export type TrainingEquipmentItem = z.infer<typeof TrainingEquipmentItemSchema>;
export type LocationInGym = z.infer<typeof LocationInGymSchema>;
export type ToolTypeCode = z.infer<typeof ToolTypeCodeSchema>;
export type ToolType = z.infer<typeof ToolTypeSchema>;
export type ListToolTypesQuery = z.infer<typeof ListToolTypesQuerySchema>;
export type ListToolTypesResponse = z.infer<typeof ListToolTypesResponseSchema>;
export type TrainingEquipmentToolType = z.infer<typeof TrainingEquipmentToolTypeSchema>;
export type GetTrainingEquipmentQuery = z.infer<typeof GetTrainingEquipmentQuerySchema>;
export type GetTrainingEquipmentResponse = z.infer<typeof GetTrainingEquipmentResponseSchema>;
export type UpsertTrainingEquipment = z.infer<typeof UpsertTrainingEquipmentSchema>;
export type PatchTrainingEquipment = z.infer<typeof PatchTrainingEquipmentSchema>;
export type TrainingEquipmentExerciseLink = z.infer<typeof TrainingEquipmentExerciseLinkSchema>;
export type TrainingEquipmentExerciseCatalogItem = z.infer<
  typeof TrainingEquipmentExerciseCatalogItemSchema
>;
export type GetTrainingEquipmentExercisesQuery = z.infer<
  typeof GetTrainingEquipmentExercisesQuerySchema
>;
export type TrainingEquipmentStatusHistory = z.infer<typeof TrainingEquipmentStatusHistorySchema>;
export type AddTrainingEquipmentExerciseLinks = z.infer<
  typeof AddTrainingEquipmentExerciseLinksSchema
>;
export type UpdateTrainingEquipmentStatus = z.infer<typeof UpdateTrainingEquipmentStatusSchema>;
export type ExportTrainingEquipmentRequest = z.infer<typeof ExportTrainingEquipmentRequestSchema>;
export type BulkUpdateTrainingEquipmentStatusRequest = z.infer<
  typeof BulkUpdateTrainingEquipmentStatusRequestSchema
>;
export type BulkUpdateTrainingEquipmentStatusResponse = z.infer<
  typeof BulkUpdateTrainingEquipmentStatusResponseSchema
>;
