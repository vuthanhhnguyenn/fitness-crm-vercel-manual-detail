import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

/**
 * E-03 Training Equipment Management — mock contract.
 *
 * Field/parameter names follow the backend API design document
 * (`.cache/api/openapi.json`, tag "Training Equipment Management"). Deliberate
 * deviations, all driven by the prototype
 * (`.cache/fitness-crm-ui/src/pages/training-equipment-*.tsx`) which wins on
 * conflicts, are listed in `specs/010-training-equipment/spec.md`
 * ("API Design Alignment").
 */

export const TRAINING_EQUIPMENT_PAGE_SIZES = [25, 50, 100, 200];

/** Reason for a status change: required free text, 1–500 characters (the old 5-value enum was dropped). */
export const CHANGED_REASON_MAX_LENGTH = 500;

const CHANGED_REASON_FIELD = z
  .string()
  .trim()
  .min(1, '変更理由を入力してください')
  .max(
    CHANGED_REASON_MAX_LENGTH,
    `変更理由は${CHANGED_REASON_MAX_LENGTH}文字以内で入力してください`,
  )
  .openapi({ description: '自由文 1〜500 字。必須' });

export const InstallationStatusSchema = z
  .enum(['installed', 'maintenance', 'removed', 'discarded'])
  .openapi({
    title: 'InstallationStatus',
    description: '設置状態（設置中 / メンテナンス中 / 撤去済み / 廃棄）',
  });

export const LocationInGymSchema = z
  .enum(['aerobic_area', 'machine_area', 'free_weight_area', 'stretch_area'])
  .openapi({
    title: 'LocationInGym',
    description: '設置エリア（Phase 1 は固定4種）',
  });

/** All `mst_tools.code` values. */
export const ToolTypeCodeSchema = z
  .enum([
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
  ])
  .openapi({ title: 'ToolTypeCode', description: '器具種別コード' });

/** Equipment-assignable tool types (`code !== 'none'`, E-03 BR-EQP-006). */
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

export const TrainingEquipmentPaginationSchema = z
  .object({
    page: z.number().int().min(1).openapi({ example: 1 }),
    limit: z.number().int().min(1).openapi({ example: 50 }),
    totalItems: z.number().int().min(0).openapi({
      example: 5,
      description: '検索条件適用後の総件数',
    }),
    totalPages: z.number().int().min(0).openapi({ example: 1 }),
    totalAllItems: z.number().int().min(0).nullable().openapi({
      example: 5,
      description:
        '条件をクリアした状態（任意パラメータを既定値に戻した状態）の総件数。ただし現在の絞り込みが廃棄行を含む場合は廃棄行も母数に含める（抽出件数が母数を上回らないようにするため）。includeTotalAll=false の場合は null',
    }),
  })
  .openapi({
    title: 'TrainingEquipmentPagination',
    description: 'トレーニング機材一覧のページネーション情報',
  });

export const TrainingEquipmentListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'TE-001' }),
    name: z.string().openapi({ example: 'ラットプルダウン LP-100' }),
    mstToolId: z.string().openapi({ example: 'a0000003-0000-4000-8000-000000000003' }),
    toolName: z.string().openapi({ example: 'ケーブル（マシン）' }),
    quantity: z.number().int().min(1).openapi({ example: 1 }),
    locationInGym: LocationInGymSchema.nullable(),
    installationStatus: InstallationStatusSchema,
    manufacturer: z.string().nullable().openapi({ example: 'テクノジム' }),
    model: z.string().nullable().openapi({ example: 'LP-100X' }),
    linkedExerciseCount: z.number().int().min(0).openapi({ example: 2 }),
    storeId: z.string().openapi({ example: 'store-001' }),
    storeCode: z.string().openapi({ example: 'S-001', description: '店舗ID（表示用コード）' }),
    storeName: z.string().openapi({ example: 'FIT365八潮店' }),
    updatedAt: z.string().openapi({ example: '2026-06-24T09:00:00.000Z' }),
  })
  .openapi({
    title: 'TrainingEquipmentListItem',
    description: 'E-03 機材一覧行（FR-001 表示項目）',
  });

export const TrainingEquipmentLinkedExerciseSchema = z
  .object({
    exerciseId: z.string().openapi({ example: 'EX-011' }),
    exerciseCode: z.string().openapi({ example: 'EX-00011' }),
    name: z.string().openapi({ example: 'ラットプルダウン（ワイドグリップ）' }),
    /** Prototype extension: the linked-exercise table shows tool type / difficulty / body part. */
    mstToolId: z.string(),
    toolName: z.string().openapi({ example: 'ケーブル（マシン）' }),
    difficulty: z.string().nullable().openapi({ example: '中級' }),
    bodyPart: z.string().nullable().openapi({ example: '背中' }),
  })
  .openapi({
    title: 'TrainingEquipmentLinkedExercise',
    description: 'E-03 FR-008 機材に紐づくエクササイズ',
  });

export const TrainingEquipmentStatusCardSchema = z
  .object({
    installationStatus: InstallationStatusSchema,
    lastChangedAt: z.string().openapi({ example: '2026-06-24T09:00:00.000Z' }),
    lastChangedByName: z.string().nullable().openapi({ example: '田中花子' }),
  })
  .openapi({
    title: 'TrainingEquipmentStatusCard',
    description: 'E-03 FR-004 詳細画面右パネルのステータスカード',
  });

export const TrainingEquipmentDetailSchema = z
  .object({
    id: z.string().openapi({ example: 'TE-001' }),
    storeId: z.string().openapi({ example: 'store-001' }),
    storeCode: z.string().openapi({ example: 'S-001', description: '店舗ID（表示用コード）' }),
    storeName: z.string().openapi({ example: 'FIT365八潮店' }),
    name: z.string().openapi({ example: 'ラットプルダウン LP-100' }),
    mstToolId: z.string().openapi({ example: 'a0000003-0000-4000-8000-000000000003' }),
    toolCode: TrainingEquipmentToolTypeSchema,
    toolName: z.string().openapi({ example: 'ケーブル（マシン）' }),
    quantity: z.number().int().min(1).openapi({ example: 1 }),
    installationStatus: InstallationStatusSchema,
    locationInGym: LocationInGymSchema.nullable(),
    manufacturer: z.string().nullable().openapi({ example: 'テクノジム' }),
    model: z.string().nullable().openapi({ example: 'LP-100X' }),
    installedOn: z.string().nullable().openapi({ example: '2023-05-01' }),
    note: z.string().nullable(),
    linkedExercises: z.array(TrainingEquipmentLinkedExerciseSchema),
    statusCard: TrainingEquipmentStatusCardSchema,
    createdAt: z.string().openapi({ example: '2023-05-01T00:00:00.000Z' }),
    updatedAt: z.string().openapi({ example: '2026-06-24T09:00:00.000Z' }),
  })
  .openapi({
    title: 'TrainingEquipmentDetail',
    description: 'E-03 FR-004 機材詳細',
  });

/** FR-001 / FR-002. `installationStatus` and `includeDiscarded` are AND-combined. */
export const ListTrainingEquipmentQuerySchema = z.object({
  includeTotalAll: booleanQueryDefaultFalse(
    'When true, pagination.totalAllItems is computed (条件をクリア時の件数)',
  ),
  storeId: z.string().optional().openapi({
    description:
      '対象店舗。System / Headquarter は省略可（省略＝全店舗横断）。それ以外のロールは必須で、省略すると 400',
  }),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .refine((value) => TRAINING_EQUIPMENT_PAGE_SIZES.includes(value))
    .default(50),
  sort: z
    .enum(['id', 'toolType', 'name', 'updatedAt', 'locationInGym', 'installationStatus'])
    .default('toolType'),
  order: z.enum(['asc', 'desc']).default('asc'),
  keyword: z.string().optional().openapi({ description: '機材名の部分一致' }),
  mstToolId: z.string().optional(),
  installationStatus: InstallationStatusSchema.optional(),
  locationInGym: LocationInGymSchema.optional(),
  includeDiscarded: booleanQueryDefaultFalse(
    'When false, `discarded` rows are hidden (FR-001 default visibility rule)',
  ),
});

export const ListTrainingEquipmentResponseSchema = z
  .object({
    items: z.array(TrainingEquipmentListItemSchema),
    pagination: TrainingEquipmentPaginationSchema,
  })
  .openapi({
    title: 'ListTrainingEquipmentResponse',
    description: 'トレーニング機材一覧レスポンス',
  });

export const CreateTrainingEquipmentRequestSchema = z
  .object({
    storeId: z.string().min(1, '設置店舗を選択してください'),
    name: z.string().min(1, '機材名を入力してください').max(255),
    mstToolId: z.string().min(1, '器具種別を選択してください'),
    quantity: z.coerce.number().int().min(1, '数量を入力してください'),
    installationStatus: InstallationStatusSchema.default('installed'),
    locationInGym: LocationInGymSchema.nullable().optional(),
    manufacturer: z.string().max(255).nullable().optional(),
    model: z.string().max(255).nullable().optional(),
    installedOn: z.string().nullable().optional(),
    note: z.string().max(1000).nullable().optional(),
  })
  .openapi({
    title: 'CreateTrainingEquipmentRequest',
    description: 'E-03 FR-003 機材新規登録',
  });

/** FR-005. `storeId` is intentionally absent: a store move is "set to removed" + register anew. */
export const UpdateTrainingEquipmentRequestSchema = CreateTrainingEquipmentRequestSchema.omit({
  storeId: true,
  installationStatus: true,
}).partial();

export const ChangeInstallationStatusRequestSchema = z
  .object({
    newStatus: InstallationStatusSchema,
    changedReason: CHANGED_REASON_FIELD,
  })
  .openapi({
    title: 'ChangeInstallationStatusRequest',
    description: 'E-03 FR-007 設置状態変更（変更理由は必須）',
  });

export const ChangeInstallationStatusResponseSchema = z
  .object({
    original: TrainingEquipmentDetailSchema,
  })
  .openapi({
    title: 'ChangeInstallationStatusResponse',
    description: '設置状態変更後の機材詳細',
  });

export const BulkUpdateInstallationStatusRequestSchema = z
  .object({
    equipmentIds: z.array(z.string().min(1)).min(1),
    newStatus: InstallationStatusSchema,
    changedReason: CHANGED_REASON_FIELD,
  })
  .openapi({
    title: 'BulkUpdateInstallationStatusRequest',
    description: 'E-03 FR-009 設置状態の一括更新',
  });

export const BulkUpdateInstallationStatusResponseSchema = z
  .object({
    updated: z.number().int().min(0).openapi({ description: '更新された件数' }),
    skipped: z.number().int().min(0).openapi({ description: '対象外・変更不要でスキップした件数' }),
  })
  .openapi({
    title: 'BulkUpdateInstallationStatusResponse',
    description: '一括更新の結果件数',
  });

export const TrainingEquipmentStatusHistoryItemSchema = z
  .object({
    id: z.string().openapi({ example: 'TH-001' }),
    previousStatus: InstallationStatusSchema.nullable(),
    newStatus: InstallationStatusSchema,
    changedReason: z.string().openapi({ example: 'ケーブル摩耗確認' }),
    changedByName: z.string().nullable().openapi({ example: '田中花子' }),
    changedAt: z.string().openapi({ example: '2026-06-24T09:00:00.000Z' }),
  })
  .openapi({
    title: 'TrainingEquipmentStatusHistoryItem',
    description: 'E-03 FR-011 設置状態変更履歴（Phase 1 は参照のみ）',
  });

/** FR-011. Same pagination contract as the list (`StatusHistoryResponse` in the API design). */
export const ListEquipmentStatusHistoryQuerySchema = z.object({
  includeTotalAll: booleanQueryDefaultFalse(
    'When true, pagination.totalAllItems is computed (条件をクリア時の件数)',
  ),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

export const ListEquipmentStatusHistoryResponseSchema = z.object({
  items: z.array(TrainingEquipmentStatusHistoryItemSchema),
  pagination: TrainingEquipmentPaginationSchema,
});

export const ListEquipmentExerciseLinksResponseSchema = z.object({
  items: z.array(TrainingEquipmentLinkedExerciseSchema),
});

export const AddEquipmentExerciseLinksRequestSchema = z
  .object({
    exerciseIds: z.array(z.string().min(1)).min(1),
    force: z.boolean().optional().openapi({
      description: '器具種別不一致を承認して保存する場合に true（FR-008 異常系）',
    }),
  })
  .openapi({
    title: 'AddEquipmentExerciseLinksRequest',
    description: 'E-03 FR-008 エクササイズ紐づけ追加',
  });

export const AddEquipmentExerciseLinksResponseSchema = z.object({
  links: z.array(TrainingEquipmentLinkedExerciseSchema),
  warnings: z.array(z.string()).optional(),
});

/**
 * Mock-only candidate list for the "add exercise" modal. The backend design
 * document sources candidates from Y-08 `/admin/exercises`; wiring that up is
 * deferred until Y-08 exposes difficulty / body part in the shape this modal filters on.
 */
export const TrainingEquipmentExerciseCandidateSchema = z.object({
  exerciseId: z.string(),
  exerciseCode: z.string(),
  name: z.string(),
  mstToolId: z.string(),
  toolName: z.string(),
  difficulty: z.string().nullable(),
  bodyPart: z.string().nullable(),
});

export const EXERCISE_CANDIDATE_PAGE_SIZE = 20;

export const ListEquipmentExerciseCandidatesQuerySchema = z.object({
  keyword: z.string().optional().openapi({ description: 'エクササイズ名の部分一致' }),
  mstToolId: z.string().optional(),
  difficulty: z.string().optional().openapi({ description: '難易度の完全一致' }),
  bodyPart: z.string().optional().openapi({ description: '部位の完全一致' }),
  excludeLinkedEquipmentId: z.string().optional().openapi({
    description: '指定した機材に紐づけ済みのエクササイズを候補から除外する',
  }),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(EXERCISE_CANDIDATE_PAGE_SIZE),
});

export const ListEquipmentExerciseCandidatesResponseSchema = z.object({
  items: z.array(TrainingEquipmentExerciseCandidateSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
  /**
   * Difficulty and body part have no master API, so the values actually present in the whole
   * candidate catalog are returned. They are derived from the full catalog rather than the
   * filtered result, so selecting one does not remove the other options.
   */
  filters: z.object({
    difficulties: z.array(z.string()),
    bodyParts: z.array(z.string()),
  }),
});

/** FR-010. GET + query parameters as per the API design (exports every row, no pagination). */
export const ExportTrainingEquipmentQuerySchema = ListTrainingEquipmentQuerySchema.omit({
  includeTotalAll: true,
  page: true,
  limit: true,
});

export type InstallationStatus = z.infer<typeof InstallationStatusSchema>;
export type LocationInGym = z.infer<typeof LocationInGymSchema>;
export type ToolTypeCode = z.infer<typeof ToolTypeCodeSchema>;
export type ToolType = z.infer<typeof ToolTypeSchema>;
export type TrainingEquipmentToolType = z.infer<typeof TrainingEquipmentToolTypeSchema>;
export type ListToolTypesQuery = z.infer<typeof ListToolTypesQuerySchema>;
export type ListToolTypesResponse = z.infer<typeof ListToolTypesResponseSchema>;
export type TrainingEquipmentListItem = z.infer<typeof TrainingEquipmentListItemSchema>;
export type TrainingEquipmentDetail = z.infer<typeof TrainingEquipmentDetailSchema>;
export type TrainingEquipmentLinkedExercise = z.infer<typeof TrainingEquipmentLinkedExerciseSchema>;
export type ListTrainingEquipmentQuery = z.infer<typeof ListTrainingEquipmentQuerySchema>;
export type ListTrainingEquipmentResponse = z.infer<typeof ListTrainingEquipmentResponseSchema>;
export type CreateTrainingEquipmentRequest = z.infer<typeof CreateTrainingEquipmentRequestSchema>;
export type UpdateTrainingEquipmentRequest = z.infer<typeof UpdateTrainingEquipmentRequestSchema>;
export type ChangeInstallationStatusRequest = z.infer<typeof ChangeInstallationStatusRequestSchema>;
export type BulkUpdateInstallationStatusRequest = z.infer<
  typeof BulkUpdateInstallationStatusRequestSchema
>;
export type TrainingEquipmentStatusHistoryItem = z.infer<
  typeof TrainingEquipmentStatusHistoryItemSchema
>;
export type AddEquipmentExerciseLinksRequest = z.infer<
  typeof AddEquipmentExerciseLinksRequestSchema
>;
export type TrainingEquipmentExerciseCandidate = z.infer<
  typeof TrainingEquipmentExerciseCandidateSchema
>;
export type ListEquipmentExerciseCandidatesQuery = z.infer<
  typeof ListEquipmentExerciseCandidatesQuerySchema
>;
export type ExportTrainingEquipmentQuery = z.infer<typeof ExportTrainingEquipmentQuerySchema>;
export type ListEquipmentStatusHistoryQuery = z.infer<typeof ListEquipmentStatusHistoryQuerySchema>;
