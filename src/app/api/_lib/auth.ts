/**
 * API-layer auth helpers
 * Reads the Bearer token from the Authorization header, decodes it,
 * and returns the authenticated user row from the mock DB.
 */
import { NextRequest } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { decodeJWT } from '@/utils/auth.util';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  position: string;
  role: 'System' | 'Headquarter' | 'Manager' | 'Staff' | 'Trainer' | 'Observer';
  staff_id?: string;
  /** Store IDs a Manager oversees (their 所轄店舗 span). See `getAllowedStoreIds`. */
  managed_store_ids?: string[];
};

export type AuthResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Resolves the authenticated user from the request's Authorization header.
 * Returns `{ ok: false, status: 401 }` when the token is missing or invalid.
 */
export function getAuthUserFromRequest(request: NextRequest): AuthResult {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const token = authHeader.slice(7);
  const payload = decodeJWT(token) as { id?: string } | null;
  if (!payload?.id) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const user = db.users.getById(payload.id);
  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  return { ok: true, user };
}

/**
 * A-01 権限マトリクス「オプション操作」— 会員のオプション契約を追加・変更・解約できるロール。
 * Observer は所属店舗の参照のみ（`×`）、Trainer は会員参照自体を持たない。
 * Staff の `※職位に依る` 粒度は職位マスター（Y-01）側の話なので、ここではロール単位までを判定する。
 */
export const OPTION_CONTRACT_OPERATOR_ROLES: readonly AuthenticatedUser['role'][] = [
  'System',
  'Headquarter',
  'Manager',
  'Staff',
];

/**
 * Returns the store IDs that the authenticated user is allowed to access.
 *
 * - System / Headquarter → all stores (returns null = unrestricted)
 * - Manager → only their 所轄店舗 (managed_store_ids). B-01 権限マトリクスでは Manager は所轄店舗のみ
 *   （店舗運営系機能のデータスコープ）— so Managers are scoped, not unrestricted.
 * - Staff / Trainer / Observer → the store linked via staff_linkage (direct_store), or every store
 *   under their linked FC company (fc_company) when they have no direct store. Every staff record
 *   (including Trainer's and Observer's) carries this linkage — see B-01 権限マトリクスの "Observer所属"
 *   (Observer sees their own store only), the same mechanism Staff uses. Trainer is store-scoped
 *   too (D-01 の own-session scope は所属店舗内), not access-less: ROLE_PERMISSIONS grants it
 *   MembersView / LessonsView …, all of which run against store-scoped endpoints.
 * - Unknown / no staff linkage → no access (returns empty array)
 */
export function getAllowedStoreIds(user: AuthenticatedUser): string[] | null {
  const role = user.role;

  if (role === 'System' || role === 'Headquarter') {
    return null; // unrestricted
  }

  if (role === 'Manager') {
    // Scoped to the Manager's managed stores; no managed stores → deny access.
    return user.managed_store_ids ?? [];
  }

  if ((role === 'Staff' || role === 'Trainer' || role === 'Observer') && user.staff_id) {
    // Look up linked store from the staff list item
    const staffRecord = db.staffs.getList().find((s) => s.staff_id === user.staff_id);
    if (staffRecord?.linked_store_id) {
      return [staffRecord.linked_store_id];
    }
    if (staffRecord?.linked_fc_company_id) {
      // FC-linked staff (no single store): scoped to every store under their franchise company
      return db.stores
        .getList()
        .filter((s) => s.fc_company_id === staffRecord.linked_fc_company_id)
        .map((s) => s.id);
    }
    // No linked store or FC company → deny access
    return [];
  }

  return []; // Staff/Trainer/Observer with no staff_id, unknown role → no store access
}

/**
 * Formats an authenticated user for display in a change-history 操作者 column,
 * e.g. "田中 太郎（本部管理者）" — the acting user's name with their role/title in parentheses.
 */
export function formatOperatorName(user: AuthenticatedUser): string {
  return user.position ? `${user.name}（${user.position}）` : user.name;
}

/**
 * Returns the FC company IDs the authenticated user is allowed to view.
 *
 * - System / Headquarter → all companies (returns null = unrestricted). FR-037.
 * - Staff → only the FC company they're linked to (staff_linkage.linked_fc_company_id),
 *   read-only; no linkage → no access. FR-037, FR-038.
 * - Manager / Trainer / Observer → no access (this screen isn't part of their permission set).
 */
export function getAllowedFranchiseCompanyIds(user: AuthenticatedUser): string[] | null {
  const role = user.role;

  if (role === 'System' || role === 'Headquarter') {
    return null; // unrestricted
  }

  if (role === 'Staff' && user.staff_id) {
    const staffRecord = db.staffs.getList().find((s) => s.staff_id === user.staff_id);
    if (staffRecord?.linked_fc_company_id) {
      return [staffRecord.linked_fc_company_id];
    }
    return [];
  }

  return []; // Manager, Trainer, Observer, Staff with no linkage → no access
}
