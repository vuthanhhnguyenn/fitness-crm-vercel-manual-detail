import { z } from 'zod';

import type {
  CreatePositionBody,
  PositionDetail,
  PositionPermissionMap,
  PositionRoleCategory,
  UpdatePositionBody,
} from '@/lib/api/types.gen';

import {
  CSV_DEFAULTS_BY_ROLE,
  CSV_PERMISSION_KEYS,
  POSITION_PERMISSION_CATEGORIES,
  type PositionPermissionKey,
} from '../_constants/position-permissions.constant';

const PERMISSION_KEYS = POSITION_PERMISSION_CATEGORIES.flatMap((category) =>
  category.permissions.map((permission) => permission.key),
);

const permissionShape = Object.fromEntries(
  PERMISSION_KEYS.map((key) => [key, z.boolean()]),
) as Record<PositionPermissionKey, z.ZodBoolean>;

const DESCRIPTION_MAX_LENGTH = 500;

export const positionFormSchema = z.object({
  position_name: z
    .string()
    .trim()
    .min(1, '職位名を入力してください')
    .max(100, '職位名は100文字以内で入力してください'),
  role: z.string().min(1, '対象ロールを選択してください'),
  description: z
    .string()
    .max(DESCRIPTION_MAX_LENGTH, `説明は${DESCRIPTION_MAX_LENGTH}文字以内で入力してください`)
    .optional(),
  permissions: z.object(permissionShape),
});

export type PositionFormValues = z.infer<typeof positionFormSchema>;

export function buildAllOffPermissions(): PositionPermissionMap {
  return Object.fromEntries(PERMISSION_KEYS.map((key) => [key, false])) as PositionPermissionMap;
}

/** FR-011: CSV出力管理のロール別デフォルトを適用したマップを返す（他カテゴリは不変） */
export function applyCsvRoleDefaults(
  permissions: PositionPermissionMap,
  role: string,
): PositionPermissionMap {
  const csvDefault = CSV_DEFAULTS_BY_ROLE[role as PositionRoleCategory] ?? false;
  const next = { ...permissions };
  for (const key of CSV_PERMISSION_KEYS) {
    next[key] = csvDefault;
  }
  return next;
}

export function createEmptyPositionFormValues(): PositionFormValues {
  return {
    position_name: '',
    role: '',
    description: '',
    permissions: buildAllOffPermissions(),
  };
}

/** Edit prefill (FR-012); clone prefill keeps the name blank per V0 (FR-013) */
export function mapPositionDetailToFormValues(
  detail: PositionDetail,
  options?: { blankName?: boolean },
): PositionFormValues {
  return {
    position_name: options?.blankName ? '' : detail.position_name,
    role: detail.role,
    description: detail.description ?? '',
    permissions: { ...detail.permissions },
  };
}

export function mapFormValuesToCreateBody(values: PositionFormValues): CreatePositionBody {
  return {
    position_name: values.position_name.trim(),
    role: values.role as PositionRoleCategory,
    description: values.description?.trim() ? values.description.trim() : null,
    permissions: values.permissions,
  };
}

/** PATCH body — role is immutable and therefore never included (Clarification Q3) */
export function mapFormValuesToUpdateBody(values: PositionFormValues): UpdatePositionBody {
  return {
    position_name: values.position_name.trim(),
    description: values.description?.trim() ? values.description.trim() : null,
    permissions: values.permissions,
  };
}
