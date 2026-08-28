import type { AuthenticatedUser } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import type { TermsBrand } from '@/app/api/_schemas/terms.schema';

/** JOYFIT sub-brands roll up to `joyfit` for this feature's 2-brand scope (research.md #9, #10). */
const STAFF_BRAND_TO_TERMS_BRAND: Partial<Record<string, TermsBrand>> = {
  joyfit: 'joyfit',
  joyfit24: 'joyfit',
  joyfit_yoga: 'joyfit',
  joyfit_plus: 'joyfit',
  fit365: 'fit365',
};

/**
 * Resolves the requester's terms-brand scope for list/detail reads.
 * - System/Headquarter → `null` (unrestricted).
 * - Manager/Staff/Observer with `brand === 'all'` → `null` (unrestricted).
 * - Manager/Staff/Observer with a specific brand → that brand (list/detail results are filtered
 *   to it; an out-of-scope detail id resolves to a 404, not 403 — research.md #9).
 */
export function getRequesterBrandScope(user: AuthenticatedUser): TermsBrand | null {
  if (user.role === 'System' || user.role === 'Headquarter') return null;

  const staffRecord = user.staff_id
    ? db.staffs.getList().find((staff) => staff.staff_id === user.staff_id)
    : undefined;

  if (!staffRecord || staffRecord.brand === 'all') return null;

  return STAFF_BRAND_TO_TERMS_BRAND[staffRecord.brand] ?? null;
}
