import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

/**
 * High-level role category on the position master (職位マスター)
 */
export const PositionRoleCategorySchema = z
  .enum(['headquarter', 'manager', 'staff', 'trainer', 'observer'])
  .openapi({
    title: 'PositionRoleCategory',
    description:
      'Position role: headquarter=本部, manager=マネージャー系, staff=店舗スタッフ, trainer=トレーナー, observer=閲覧',
  });

/**
 * JSON blob for main permission highlights (主な権限の特徴)
 */
export const PositionFeaturesSchema = z.record(z.string(), z.unknown()).openapi({
  title: 'PositionFeatures',
  description: 'Feature flags and labels for this position (mirrors DB JSON column)',
});

/**
 * Position master row (positions table)
 */
export const PositionSchema = z
  .object({
    id: z.number().int().openapi({ example: 1, description: 'Position PK' }),
    role: PositionRoleCategorySchema.openapi({ description: 'ロール' }),
    position_name: z.string().openapi({ example: '本部管理者', description: '職位名' }),
    features: PositionFeaturesSchema.openapi({ description: '主な権限の特徴' }),
  })
  .openapi({
    title: 'Position',
    description: 'Normalized staff position / 職位マスター',
  });

/**
 * Granular permission row (staff_permissions table)
 */
export const StaffPermissionRecordSchema = z
  .object({
    id: z.number().int().openapi({ description: 'Permission row PK' }),
    staff_id: z.string().openapi({ example: '1', description: 'Internal staff id (FK staff.id)' }),
    permission_code: z.string().openapi({ example: 'Y-03.view', description: 'Permission code' }),
  })
  .openapi({
    title: 'StaffPermissionRecord',
    description: 'Staff permission detail row',
  });

/**
 * GET /crm/positions — list position master rows
 */
export const GetPositionsResponseSchema = z
  .object({
    positions: z.array(PositionSchema).openapi({
      description: 'All positions (職位マスター)',
    }),
  })
  .openapi({
    title: 'GetPositionsResponse',
    description: 'List of staff positions for filters and forms',
  });

export type Position = z.infer<typeof PositionSchema>;
export type StaffPermissionRecord = z.infer<typeof StaffPermissionRecordSchema>;
export type PositionRoleCategory = z.infer<typeof PositionRoleCategorySchema>;
export type GetPositionsResponse = z.infer<typeof GetPositionsResponseSchema>;
