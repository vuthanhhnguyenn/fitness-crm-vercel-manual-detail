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
  role: 'System' | 'Headquarter' | 'Manager' | 'Staff' | 'Trainer' | 'Observer';
  staff_id?: string;
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
 * Returns the store IDs that the authenticated user is allowed to access.
 *
 * - System / Headquarter / Manager → all stores (returns null = unrestricted)
 * - Staff → only the store linked via staff_linkage (direct_store)
 * - Other roles (Trainer, Observer) → no access (returns empty array)
 */
export function getAllowedStoreIds(user: AuthenticatedUser): string[] | null {
  const role = user.role;

  if (role === 'System' || role === 'Headquarter' || role === 'Manager') {
    return null; // unrestricted
  }

  if (role === 'Staff' && user.staff_id) {
    // Look up linked store from the staff list item
    const staffRecord = db.staffs.getList().find((s) => s.staff_id === user.staff_id);
    if (staffRecord?.linked_store_id) {
      return [staffRecord.linked_store_id];
    }
    // No linked store → deny access
    return [];
  }

  return []; // Trainer, Observer, unknown → no store access
}
