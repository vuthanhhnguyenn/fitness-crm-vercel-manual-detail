import {
  type CreatePositionBody,
  type GetPositionsQuery,
  type GetPositionsResponse,
  POSITION_PERMISSION_CATEGORY_DEFS,
  POSITION_PERMISSION_KEYS,
  type Position,
  type PositionDetail,
  type PositionListItem,
  type PositionPermissionMap,
  type UpdatePositionBody,
} from '@/app/api/_schemas/position.schema';

import type { DbType } from '../_db.types';
import { SEED_POSITION_ROWS } from '../seeds/position.seed';
import type { PositionsType } from '../types/positions.type';

// crm_role enum definition order (BE: sort=role sorts by CREATE TYPE order)
const ROLE_ORDER: Record<Position['role'], number> = {
  headquarter: 0,
  manager: 1,
  staff: 2,
  trainer: 3,
  observer: 4,
};

function buildFullPermissionMap(
  partial: Partial<PositionPermissionMap> | undefined,
  base?: PositionPermissionMap,
): PositionPermissionMap {
  const map = {} as Record<(typeof POSITION_PERMISSION_KEYS)[number], boolean>;
  for (const key of POSITION_PERMISSION_KEYS) {
    map[key] = partial?.[key] ?? base?.[key] ?? false;
  }
  return map;
}

function grantedCategoryCount(permissions: PositionPermissionMap): number {
  return POSITION_PERMISSION_CATEGORY_DEFS.filter((category) =>
    category.permissions.some((permission) => permissions[permission.key]),
  ).length;
}

export function createPositionTables(getDb: () => DbType) {
  return {
    positions: {
      _rows: [] as Position[],
      _seeded: false,

      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows.push(
          ...SEED_POSITION_ROWS.map((row) => ({
            ...row,
            permissions: { ...row.permissions },
          })),
        );
      },

      getList(): Position[] {
        this._seed();
        return [...this._rows];
      },

      getById(id: number): Position | undefined {
        this._seed();
        return this._rows.find((p) => p.id === id);
      },

      staffCount(id: number): number {
        return getDb()
          .staffs.getList()
          .filter((staff) => staff.position_id === id).length;
      },

      _toListItem(row: Position): PositionListItem {
        return {
          id: row.id,
          position_name: row.position_name,
          description: row.description,
          role: row.role,
          is_system_managed: row.is_system_managed,
          staff_count: this.staffCount(row.id),
          grantedCategoryCount: grantedCategoryCount(row.permissions),
          totalCategoryCount: POSITION_PERMISSION_CATEGORY_DEFS.length,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      },

      list(query: GetPositionsQuery): GetPositionsResponse {
        this._seed();
        const { search, permission, role, includeTotalAll, page, limit, sort, order } = query;

        let filtered = [...this._rows];
        if (search) {
          const searchLower = search.toLowerCase().trim();
          filtered = filtered.filter((row) =>
            row.position_name.toLowerCase().includes(searchLower),
          );
        }
        if (permission) {
          filtered = filtered.filter((row) => row.permissions[permission]);
        }
        if (role) {
          filtered = filtered.filter((row) => row.role === role);
        }

        const direction = order === 'desc' ? -1 : 1;
        filtered.sort((a, b) => {
          if (sort === 'name') {
            return a.position_name.localeCompare(b.position_name, 'ja') * direction;
          }
          if (sort === 'createdAt') {
            return (
              (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0) * direction
            );
          }
          // sort === 'role': crm_role enum order, id as stable tiebreaker
          const byRole = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
          return (byRole !== 0 ? byRole : a.id - b.id) * direction;
        });

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / limit));
        const startIndex = (page - 1) * limit;
        const items = filtered
          .slice(startIndex, startIndex + limit)
          .map((row) => this._toListItem(row));

        return {
          items,
          pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            ...(includeTotalAll ? { totalAllItems: this._rows.length } : {}),
          },
        };
      },

      getDetail(id: number): PositionDetail | undefined {
        const row = this.getById(id);
        if (!row) return undefined;
        return {
          id: row.id,
          position_name: row.position_name,
          description: row.description,
          role: row.role,
          is_system_managed: row.is_system_managed,
          staff_count: this.staffCount(row.id),
          permissions: { ...row.permissions },
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      },

      getPermissionsPreview(id: number) {
        const row = this.getById(id);
        if (!row) return undefined;
        return {
          id: row.id,
          position_name: row.position_name,
          role: row.role,
          categories: POSITION_PERMISSION_CATEGORY_DEFS.map((category) => ({
            categoryKey: category.categoryKey,
            categoryLabel: category.categoryLabel,
            permissions: category.permissions.map((permission) => ({
              permissionKey: permission.key,
              label: permission.label,
              granted: row.permissions[permission.key],
            })),
          })),
        };
      },

      _findDuplicateName(role: Position['role'], name: string, excludeId?: number) {
        return this._rows.find(
          (row) => row.role === role && row.position_name === name && row.id !== excludeId,
        );
      },

      create(body: CreatePositionBody) {
        this._seed();
        if (this._findDuplicateName(body.role, body.position_name)) {
          return {
            ok: false as const,
            status: 409 as const,
            error: '同じロール内に同名の職位が既に存在します',
            code: 'E-STF-010',
          };
        }
        const now = new Date().toISOString();
        const nextId = this._rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
        const row: Position = {
          id: nextId,
          role: body.role,
          position_name: body.position_name,
          description: body.description ?? null,
          permissions: buildFullPermissionMap(body.permissions),
          is_system_managed: false,
          created_at: now,
          updated_at: now,
        };
        this._rows.push(row);
        return {
          ok: true as const,
          data: {
            id: row.id,
            position_name: row.position_name,
            role: row.role,
            created_at: row.created_at,
          },
        };
      },

      update(id: number, body: UpdatePositionBody) {
        this._seed();
        const row = this._rows.find((p) => p.id === id);
        if (!row) {
          return {
            ok: false as const,
            status: 404 as const,
            error: '職位が見つかりません',
            code: 'E-STF-009',
          };
        }
        if (row.is_system_managed) {
          return {
            ok: false as const,
            status: 422 as const,
            error: 'システム管理の職位は変更できません',
            code: 'E-STF-012',
          };
        }
        if (
          body.position_name !== undefined &&
          this._findDuplicateName(row.role, body.position_name, id)
        ) {
          return {
            ok: false as const,
            status: 409 as const,
            error: '同じロール内に同名の職位が既に存在します',
            code: 'E-STF-010',
          };
        }
        if (body.position_name !== undefined) row.position_name = body.position_name;
        if (body.description !== undefined) row.description = body.description;
        if (body.permissions !== undefined) {
          row.permissions = buildFullPermissionMap(body.permissions, row.permissions);
        }
        row.updated_at = new Date().toISOString();
        return {
          ok: true as const,
          data: {
            id: row.id,
            position_name: row.position_name,
            role: row.role,
            updated_at: row.updated_at,
          },
        };
      },

      remove(id: number) {
        this._seed();
        const index = this._rows.findIndex((p) => p.id === id);
        if (index === -1) {
          return {
            ok: false as const,
            status: 404 as const,
            error: '職位が見つかりません',
            code: 'E-STF-009',
          };
        }
        const row = this._rows[index]!;
        if (row.is_system_managed) {
          return {
            ok: false as const,
            status: 422 as const,
            error: 'システム管理の職位は削除できません',
            code: 'E-STF-012',
          };
        }
        if (this.staffCount(id) > 0) {
          return {
            ok: false as const,
            status: 409 as const,
            error: 'スタッフが割り当てられている職位は削除できません',
            code: 'E-STF-011',
          };
        }
        this._rows.splice(index, 1);
        return { ok: true as const, data: null };
      },
    } satisfies PositionsType,
  };
}
