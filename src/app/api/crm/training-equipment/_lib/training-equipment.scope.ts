import { type AuthenticatedUser, getAllowedStoreIds } from '@/app/api/_lib/auth';

/** `null` = across every store (HQ only). An array = restricted to those stores. */
export type StoreScope = string[] | null;

export type StoreScopeResult =
  | { ok: true; scope: StoreScope }
  | { ok: false; status: 400 | 403; error: string };

/**
 * E-03 store scope. Implements the API design's "`storeId` is conditionally required".
 *
 * - System / Headquarter → `storeId` is optional; omitting it means every store (`null`)
 * - Every other role → `storeId` is required: 400 when omitted, 403 for another store's id
 */
export function resolveStoreScope(
  user: AuthenticatedUser,
  storeId: string | undefined,
): StoreScopeResult {
  const allowed = getAllowedStoreIds(user);
  const requested = storeId && storeId !== 'all' ? storeId : undefined;

  // Roles that can access every store (System / Headquarter)
  if (allowed === null) {
    return { ok: true, scope: requested ? [requested] : null };
  }

  if (!requested) {
    return { ok: false, status: 400, error: '対象店舗（storeId）を指定してください' };
  }
  if (!allowed.includes(requested)) {
    return { ok: false, status: 403, error: 'この店舗の機材を参照する権限がありません' };
  }
  return { ok: true, scope: [requested] };
}

export type AccessResult = { ok: true } | { ok: false; status: 403; error: string };

const OK: AccessResult = { ok: true };

/**
 * Whether a single equipment record may be accessed. Equipment in another store is off limits even
 * when its id is known. Applies the same rule as `resolveStoreScope` to a row carrying `storeId`.
 */
export function assertStoreAccess(user: AuthenticatedUser, storeId: string): AccessResult {
  const allowed = getAllowedStoreIds(user);
  if (allowed === null || allowed.includes(storeId)) return OK;
  return { ok: false, status: 403, error: 'この店舗の機材を操作する権限がありません' };
}

/** System / Headquarter check (soft delete and exercise links are HQ-only). */
export function isHqRole(user: AuthenticatedUser): boolean {
  return user.role === 'System' || user.role === 'Headquarter';
}

/**
 * Write permissions from the E-03 permission matrix.
 * Create / edit / status change: HQ and Staff. Soft delete and exercise links: HQ only.
 */
export function assertCanWrite(user: AuthenticatedUser): AccessResult {
  if (isHqRole(user) || user.role === 'Staff') return OK;
  return { ok: false, status: 403, error: 'トレーニング機材を編集する権限がありません' };
}

export function assertHqOnly(user: AuthenticatedUser, action: string): AccessResult {
  if (isHqRole(user)) return OK;
  return { ok: false, status: 403, error: `${action}は本部のみ実行できます` };
}
