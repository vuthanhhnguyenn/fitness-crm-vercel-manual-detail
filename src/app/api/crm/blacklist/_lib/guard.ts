/**
 * Blacklist access guard (A-01 FR-001 – FR-004).
 *
 * FR-003 requires the refusal to live here rather than only in the screen: hiding the
 * sidebar entry and redirecting the route to /403 leaves the endpoint itself open, so a
 * non-HQ caller can read every entry — or release one — with a single request.
 *
 * FR-004 is the deliberate absence in this file: blacklist data is a cross-store audit
 * surface, so there is **no** store-scope narrowing here. That is why this guard does not
 * call `getAllowedStoreIds` the way the store-scoped feature routes do.
 */
import { NextRequest, NextResponse } from 'next/server';

import { type AuthenticatedUser, getAuthUserFromRequest } from '@/app/api/_lib/auth';

/** A-01 権限マトリクス 「BL管理」: System ○ / Headquarter ○ / everyone else ×. */
const BLACKLIST_ROLES = ['System', 'Headquarter'] as const;

export type BlacklistGuardResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; response: NextResponse };

/**
 * Resolves the caller and refuses anyone outside HQ/System.
 *
 * Returns the ready-made error response so each route can `return guard.response`
 * without restating the status/body mapping.
 */
export function guardBlacklistRequest(request: NextRequest): BlacklistGuardResult {
  const auth = getAuthUserFromRequest(request);
  if (!auth.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: auth.error }, { status: auth.status }),
    };
  }

  if (!BLACKLIST_ROLES.includes(auth.user.role as (typeof BLACKLIST_ROLES)[number])) {
    // A-01 L268 「BL一覧・詳細参照はHQ以上のみ。Staff日常画面には表示しない」
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true, user: auth.user };
}
